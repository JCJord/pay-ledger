import { ApiProperty } from '@nestjs/swagger';

export class BalanceResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-...' })
  accountId!: string;

  /**
   * Net balance = totalCredits - totalDebits.
   * The arithmetic is done with decimal.js in BalanceService;
   * this is the serialised number result.
   */
  @ApiProperty({ example: 150.75 })
  balance!: number;

  @ApiProperty({ example: 200.0 })
  totalCredits!: number;

  @ApiProperty({ example: 49.25 })
  totalDebits!: number;

  @ApiProperty()
  updatedAt!: Date;
}
