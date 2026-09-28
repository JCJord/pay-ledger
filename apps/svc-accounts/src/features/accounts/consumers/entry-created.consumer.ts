import { Controller, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { BalanceService } from '../balance.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { EntryCreatedEvent, ROUTING_KEYS } from '@pay-ledger/shared-types';

@Controller()
export class EntryCreatedConsumer {
  private readonly logger = new Logger(EntryCreatedConsumer.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly balanceService: BalanceService,
  ) {}

  @EventPattern(ROUTING_KEYS.ENTRY_CREATED)
  async handle(
    @Payload() event: EntryCreatedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    try {
      this.logger.log(
        `Received entry.created event: entryId=${event.data.entryId}, accountId=${event.data.accountId}, type=${event.data.type}`,
      );

      const existing = await this.prisma.ledgerEntryProjection.findUnique({
        where: { id: event.data.entryId },
      });

      if (existing) {
        channel.ack(message);

        return;
      }

      await this.prisma.ledgerEntryProjection.create({
        data: {
          id: event.data.entryId,
          accountId: event.data.accountId,
          invoiceId: event.data.invoiceId,
          type: event.data.type,
          amount: event.data.amount,
          createdAt: new Date(event.timestamp),
        },
      });

      await this.balanceService.updateSnapshot(
        event.data.accountId,
        event.data.type,
        event.data.amount,
      );

      channel.ack(message);
      this.logger.log(`Processed and Acked entry ${event.data.entryId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process entry.created event ${event.data.entryId}:`,
        error,
      );
      channel.nack(message, false, false);
    }
  }
}
