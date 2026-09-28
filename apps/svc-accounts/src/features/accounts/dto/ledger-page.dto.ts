import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * LedgerPageDto — query params for cursor-based ledger pagination.
 * Cursor = createdAt timestamp of the oldest item on the current page.
 * Send it as `before` to get the next page.
 */
export class LedgerPageDto {
  /**
   * ISO-8601 date string cursor — fetch entries created BEFORE this timestamp.
   * Omit to get the most recent page.
   */
  @ApiPropertyOptional({ example: '2026-09-26T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  before?: string;

  /** Records per page. Default 20, max 100. */
  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
