import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly refreshTokenExpiresDays: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.refreshTokenExpiresDays = Number(
      this.configService.get<string>('REFRESH_TOKEN_EXPIRES_DAYS', '7'),
    );
  }

  generateAccessToken(userId: string, role: string): string {
    return this.jwtService.sign({ sub: userId, role });
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const rawToken = uuidv4();
    const tokenHash = await bcrypt.hash(rawToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenExpiresDays);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });

    return rawToken;
  }

  async rotateRefreshToken(
    rawToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
    const allTokens = await this.prisma.refreshToken.findMany({
      where: {
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    let matchedToken: (typeof allTokens)[number] | null = null;

    for (const storedToken of allTokens) {
      const isMatch = await bcrypt.compare(rawToken, storedToken.tokenHash);
      if (isMatch) {
        matchedToken = storedToken;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({
      where: { id: matchedToken.id },
    });

    const { user } = matchedToken;
    const newAccessToken = this.generateAccessToken(user.id, user.role);
    const newRefreshToken = await this.generateRefreshToken(user.id);

    this.logger.log(`Refresh token rotated for user ${user.id}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      userId: user.id,
    };
  }

  async revokeRefreshToken(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
    this.logger.log(`All refresh tokens revoked for user ${userId}`);
  }
}
