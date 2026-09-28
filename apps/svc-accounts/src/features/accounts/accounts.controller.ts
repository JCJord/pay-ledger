import {
  Controller,
  Get,
  Logger,
  Headers,
  ForbiddenException,
  NotFoundException,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { BalanceService } from './balance.service';
import { AccountResponseDto } from './dto/account-response.dto';
import { Account } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { OwnershipGuard } from './guards/ownership.guard';
import { BalanceResponseDto } from './dto/balance-response.dto';
import { LedgerPageDto } from './dto/ledger-page.dto';

@ApiTags('Accounts')
@Controller('accounts')
export class AccountsController {
  private readonly logger = new Logger(AccountsController.name);

  constructor(
    private readonly accountsService: AccountsService,
    private readonly balanceService: BalanceService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get all accounts for the authenticated user' })
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiResponse({ status: 200, type: [AccountResponseDto] })
  async getMyAccounts(
    @Headers('x-user-id') userId: string,
  ): Promise<AccountResponseDto[]> {
    if (!userId) {
      throw new ForbiddenException('Missing User identity number');
    }

    const accounts = await this.accountsService.findByUserId(userId);

    return plainToInstance(AccountResponseDto, accounts);
  }

  @Get(':id')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Get a specific account by ID' })
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiResponse({ status: 200, type: AccountResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden — not your account' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccount(@Param('id') id: string): Promise<AccountResponseDto> {
    const account = await this.accountsService.findById(id);
    if (!account) {
      throw new NotFoundException(`Account ${id} not found`);
    }
    return plainToInstance(AccountResponseDto, account);
  }

  @Get(':id/balance')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Get current balance of user account' })
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiResponse({ status: 200, type: BalanceResponseDto })
  async getBalance(@Param('id') id: string): Promise<BalanceResponseDto> {
    return this.balanceService.getBalance(id);
  }

  @Get(':id/ledger')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Get paginated ledger history from account' })
  @ApiHeader({ name: 'x-user-id', required: true })
  async getLedger(@Param('id') id: string, @Query() query: LedgerPageDto) {
    return await this.accountsService.getLedger(id, query.before, query.limit);
  }

  @Get(':id/balance/internal')
  @ApiOperation({
    summary: '[Internal] Get balance — for svc-settlement use only',
  })
  @ApiHeader({ name: 'x-internal-key', required: true })
  @ApiResponse({ status: 200, type: BalanceResponseDto })
  async getBalanceInternal(
    @Param('id') id: string,
    @Headers('x-internal-key') internalKey: string,
  ): Promise<BalanceResponseDto> {
    if (internalKey !== process.env.INTERNAL_API_KEY) {
      throw new ForbiddenException('Invalid internal key');
    }

    return this.balanceService.getBalance(id);
  }
}
