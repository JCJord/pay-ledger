import { Injectable, Logger } from '@nestjs/common';
import { EntryType, Prisma } from '@prisma/client-accounts';
import { PrismaService } from 'prisma/prisma.service';
import { BalanceResponseDto } from './dto/balance-response.dto';
import { Decimal } from '@prisma/client-accounts/runtime/library';

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getBalance(accountId: string): Promise<BalanceResponseDto> {
    const snapshot = await this.prisma.accountBalanceSnapshot.findUniqueOrThrow(
      {
        where: { accountId },
      },
    );

    const credits = new Decimal(snapshot.totalCredits.toString());
    const debits = new Decimal(snapshot.totalDebits.toString());
    const balance = credits.minus(debits);

    return {
      accountId: snapshot.accountId,
      balance: balance.toNumber(),
      totalCredits: credits.toNumber(),
      totalDebits: debits.toNumber(),
      updatedAt: snapshot.updatedAt,
    };
  }

  async updateSnapshot(
    accountId: string,
    type: EntryType,
    amount: string,
  ): Promise<void> {
    const amt = new Decimal(amount);

    await this.prisma.$transaction(
      async (tx) => {
        const current = await tx.accountBalanceSnapshot.findUniqueOrThrow({
          where: { accountId },
        });

        if (type == EntryType.DEBIT) {
          const newDebits = new Decimal(current.totalDebits.toString()).plus(
            amt,
          );
          await tx.accountBalanceSnapshot.update({
            where: { accountId },
            data: {
              totalDebits: newDebits.toString(),
            },
          });
        } else if (type == EntryType.CREDIT) {
          const newCredits = new Decimal(current.totalCredits.toString()).plus(
            amt,
          );

          await tx.accountBalanceSnapshot.update({
            where: { accountId },
            data: {
              totalCredits: newCredits.toString(),
            },
          });
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async initializeSnapshot(accountId: string): Promise<void> {
    await this.prisma.accountBalanceSnapshot.create({
      data: {
        accountId,
        totalCredits: new Decimal(0).toString(),
        totalDebits: new Decimal(0).toString(),
      },
    });

    this.logger.log(`Initialized balance snapshot for account ${accountId}`);
  }
}
