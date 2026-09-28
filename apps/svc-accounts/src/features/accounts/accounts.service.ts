import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { nanoid } from 'nanoid';
import { CreateAccountDto } from './dto/create-account.dto';
import { Account, AccountType } from '@prisma/client-accounts';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private generateAccountNumber(): string {
    return `ACC-${nanoid(10)}`;
  }

  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    const account = await this.prisma.account.create({
      data: {
        accountNumber: this.generateAccountNumber(),
        userId: createAccountDto.userId,
        ownerName: createAccountDto.ownerName,
        ownerEmail: createAccountDto.ownerEmail,
        currency: createAccountDto.currency ?? 'BRL',
        type: createAccountDto.type ?? AccountType.CUSTOMER_WALLET,
      },
    });

    this.logger.log(`Created account for user ${createAccountDto.userId}`);

    return account;
  }

  async findById(id: string): Promise<Account | null> {
    return this.prisma.account.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { userId },
    });
  }

  async getLedger(accountId: string, before?: string, limit: number = 20) {
    return this.prisma.ledgerEntryProjection.findMany({
      where: {
        accountId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
