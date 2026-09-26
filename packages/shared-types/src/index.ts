export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SETTLED = 'SETTLED',
  FAILED = 'FAILED',
}

export enum EntryType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum AccountType {
  CUSTOMER_WALLET = 'CUSTOMER_WALLET',
  MERCHANT_RECEIVABLE = 'MERCHANT_RECEIVABLE',
  SYSTEM_ESCROW = 'SYSTEM_ESCROW',
  PLATFORM_FEE = 'PLATFORM_FEE',
}

export interface BaseEvent<T> {
  eventId: string;
  eventType: string;
  timestamp: string;
  data: T;
}

export interface UserRegisteredEventData {
  userId: string;
  email: string;
  ownerName: string;
  currency: string;
}

export type UserRegisteredEvent = BaseEvent<UserRegisteredEventData>;

export interface InvoiceCreatedEventData {
  invoiceId: string;
  idempotencyKey: string;
  amount: string;
  currency: string;
  payerAccountId: string;
  payeeAccountId: string;
}

export type InvoiceCreatedEvent = BaseEvent<InvoiceCreatedEventData>;

export interface InvoiceSettledEventData {
  invoiceId: string;
}

export type InvoiceSettledEvent = BaseEvent<InvoiceSettledEventData>;

export interface InvoiceFailedEventData {
  invoiceId: string;
  reason: string;
}

export type InvoiceFailedEvent = BaseEvent<InvoiceFailedEventData>;

export interface EntryCreatedEventData {
  entryId: string;
  invoiceId: string;
  accountId: string;
  type: EntryType;
  amount: string;
}

export type EntryCreatedEvent = BaseEvent<EntryCreatedEventData>;

export const ROUTING_KEYS = {
  USER_REGISTERED: 'user.registered',
  INVOICE_CREATED: 'invoice.created',
  INVOICE_SETTLED: 'invoice.settled',
  INVOICE_FAILED: 'invoice.failed',
  ENTRY_CREATED: 'entry.created',
} as const;

export const EXCHANGES = {
  PAYLEDGER_EVENTS: 'payledger.events',
} as const;

export const QUEUES = {
  INVOICES_SETTLE: 'invoices.settle.queue',
  ACCOUNTS_UPDATE: 'accounts.update.queue',
  INVOICES_STATUS: 'invoices.status.queue',
  INVOICES_DLQ: 'invoices.dlq',
  ACCOUNTS_REGISTER: 'accounts.register.queue',
} as const;
