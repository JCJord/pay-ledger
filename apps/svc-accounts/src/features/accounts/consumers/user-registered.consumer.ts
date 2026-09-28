import { Controller, Logger } from '@nestjs/common';
import { BalanceService } from '../balance.service';
import { AccountsService } from '../accounts.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import {
  AccountType,
  ROUTING_KEYS,
  UserRegisteredEvent,
} from '@pay-ledger/shared-types';

@Controller()
export class UserRegisteredConsumer {
  private readonly logger = new Logger(UserRegisteredConsumer.name);

  constructor(
    private readonly accountService: AccountsService,
    private readonly balanceService: BalanceService,
  ) {}

  @EventPattern('user.registered')
  async handle(
    @Payload() event: UserRegisteredEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    try {
      this.logger.log(
        `Receveid user Registered Event: ${ROUTING_KEYS.USER_REGISTERED}`,
      );

      const existingAccounts = await this.accountService.findByUserId(
        event.data.userId,
      );

      if (existingAccounts.length > 0) {
        this.logger.warn(
          `Account already exists for user ${event.data.userId}, acking duplciate message`,
        );
        channel.ack(message);
        return;
      }

      const account = await this.accountService.create({
        userId: event.data.userId,
        ownerName: event.data.ownerName,
        ownerEmail: event.data.email,
        currency: event.data.currency,
        type: AccountType.CUSTOMER_WALLET,
      });

      await this.balanceService.initializeSnapshot(account.id);

      channel.ack(message);

      this.logger.log(
        `Successfully created account ${account.id} and acked message`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process user.registered event for user ${event.data.userId}:`,
        error,
      );
      channel.nack(message, false, false);
    }
  }
}
