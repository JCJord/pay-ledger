import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from './token.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import {
  UserRegisteredEvent,
  ROUTING_KEYS,
} from '@pay-ledger/shared-types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    @Inject('RABBITMQ_CLIENT') private readonly rabbitClient: ClientProxy,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ response: AuthResponseDto; refreshToken: string }> {
    const passwordHash = await bcrypt.hash(dto.password, 12);

    let user: Awaited<ReturnType<typeof this.prisma.user.create>>;

    try {
      user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
        },
      });
    } catch (err: any) {

      if (err?.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      throw err;
    }

    const event: UserRegisteredEvent = {
      eventId: uuidv4(),
      eventType: ROUTING_KEYS.USER_REGISTERED,
      timestamp: new Date().toISOString(),
      data: {
        userId: user.id,
        email: user.email,
        ownerName: user.name,
        currency: 'BRL',
      },
    };

    this.rabbitClient.emit(ROUTING_KEYS.USER_REGISTERED, event);
    this.logger.log(`user.registered event published for user ${user.id}`);

    const accessToken = this.tokenService.generateAccessToken(
      user.id,
      user.role,
    );
    const refreshToken = await this.tokenService.generateRefreshToken(user.id);

    return {
      response: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      refreshToken,
    };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ response: AuthResponseDto; refreshToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.tokenService.generateAccessToken(
      user.id,
      user.role,
    );
    const refreshToken = await this.tokenService.generateRefreshToken(user.id);

    this.logger.log(`User ${user.id} logged in`);

    return {
      response: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      refreshToken,
    };
  }

  async refresh(
    rawToken: string,
  ): Promise<{ response: AuthResponseDto; refreshToken: string }> {
    const { accessToken, refreshToken, userId } =
      await this.tokenService.rotateRefreshToken(rawToken);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    return {
      response: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      refreshToken,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(userId);
    this.logger.log(`User ${userId} logged out`);
  }

  async getMe(userId: string): Promise<AuthResponseDto['user']> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
