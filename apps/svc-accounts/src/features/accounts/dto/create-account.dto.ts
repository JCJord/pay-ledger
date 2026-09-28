import { AccountType } from '@pay-ledger/shared-types';

/**
 * Internal-only DTO — not exposed on any HTTP endpoint.
 * Used by UserRegisteredConsumer when calling AccountsService.create().
 */
export class CreateAccountDto {
  userId!: string;
  ownerName!: string;
  ownerEmail!: string;
  currency!: string;
  type?: AccountType;
}
