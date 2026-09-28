import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class OwnershipGuard implements CanActivate {
  private readonly logger = new Logger(OwnershipGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const requestingUserId = request.headers['x-user-id'] as string | undefined;

    if (!requestingUserId) {
      this.logger.warn('OwnershipGuard: Missing x-user-id header in request');
      throw new ForbiddenException('Missing x-user-id header in request');
    }

    const accountId = request.params['id'];

    if (!accountId) {
      return true;
    }

    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, userId: true },
    });

    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    if (account.userId !== requestingUserId) {
      this.logger.warn(
        `OwnershipGuard: User ${requestingUserId} attempted to access account ${accountId} belonging to user ${account.userId}`,
      );
      throw new ForbiddenException('You do not own this account');
    }

    return true;
  }
}
