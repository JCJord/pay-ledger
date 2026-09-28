import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '@pay-ledger/shared-types';

export class AccountResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-...' })
  id!: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-...' })
  userId!: string;

  @ApiProperty({ example: 'ACC-v8x3k2m1n4' })
  accountNumber!: string;

  @ApiProperty({ example: 'Jane Doe' })
  ownerName!: string;

  @ApiProperty({ example: 'jane@example.com' })
  ownerEmail!: string;

  @ApiProperty({ enum: AccountType, example: AccountType.CUSTOMER_WALLET })
  type!: AccountType;

  @ApiProperty({ example: 'BRL' })
  currency!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
