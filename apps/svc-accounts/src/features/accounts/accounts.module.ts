import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { AccountsController } from './accounts.controller';
import { OwnershipGuard } from './guards/ownership.guard';
import { UserRegisteredConsumer } from './consumers/user-registered.consumer';
import { EntryCreatedConsumer } from './consumers/entry-created.consumer';
import { QUEUES } from '@pay-ledger/shared-types';
import { AccountsService } from './accounts.service';
import { BalanceService } from './balance.service';

@Module({
  imports: [
    /**
     * svc-accounts only CONSUMES events — it does not publish any.
     * The ClientsModule is therefore not needed here.
     * The consumer transport is registered in main.ts via connectMicroservice().
     */
  ],
  controllers: [
    AccountsController,
    // RabbitMQ consumers are also controllers in NestJS microservices
    UserRegisteredConsumer,
    EntryCreatedConsumer,
  ],
  providers: [AccountsService, BalanceService, OwnershipGuard],
  exports: [AccountsService, BalanceService],
})
export class AccountsModule {}
