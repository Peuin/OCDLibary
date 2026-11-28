import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import { DASHBOARD_QUOTE_IMPORT_MAX_BYTES, Permission } from '@bookorbit/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import type { MultipartRequest } from '../../common/types/multipart-request';
import type { RequestUser } from '../../common/types/request-user';
import { resolveDashboardQuoteImportFormat } from './dashboard-quote-import.parser';
import { DashboardQuoteService } from './dashboard-quote.service';
import { CreateDashboardQuoteDto, ListDashboardQuotesDto, RandomDashboardQuoteDto, UpdateDashboardQuoteDto } from './dto/dashboard-quote.dto';

@Controller('dashboard/quotes')
export class DashboardQuoteController {
  constructor(private readonly quoteService: DashboardQuoteService) {}

  @Get('random')
  getRandomQuote(@Query() query: RandomDashboardQuoteDto) {
    return this.quoteService.pickRandom(query.excludeId);
  }

  @Get()
  @RequirePermission(Permission.ManageAppSettings)
  listQuotes(@Query() query: ListDashboardQuotesDto) {
    return this.quoteService.list(query);
  }

  @Post()
  @RequirePermission(Permission.ManageAppSettings)
  createQuote(@CurrentUser() user: RequestUser, @Body() dto: CreateDashboardQuoteDto) {
    return this.quoteService.create(dto, user);
  }

  @Post('import')
  @RequirePermission(Permission.ManageAppSettings)
  async importQuotes(@CurrentUser() user: RequestUser, @Req() req: MultipartRequest) {
    let content: string;
    let fileName: string | undefined;
    try {
      const data = await req.file({ limits: { fileSize: DASHBOARD_QUOTE_IMPORT_MAX_BYTES } });
      if (!data) throw new BadRequestException('No file provided');
      fileName = data.filename;
      content = (await data.toBuffer()).toString('utf8');
    } catch (error) {
      if (isFileTooLargeError(error)) throw new BadRequestException('File exceeds 1 MB limit');
      throw error;
    }
    const format = resolveDashboardQuoteImportFormat(fileName);
    if (!format) throw new BadRequestException('Only .csv and .txt files are supported');
    return this.quoteService.importFile(content, format, user);
  }

  @Patch(':id')
  @RequirePermission(Permission.ManageAppSettings)
  updateQuote(@CurrentUser() user: RequestUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDashboardQuoteDto) {
    return this.quoteService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Permission.ManageAppSettings)
  async deleteQuote(@CurrentUser() user: RequestUser, @Param('id', ParseIntPipe) id: number) {
    await this.quoteService.remove(id, user);
  }
}

function isFileTooLargeError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const value = error as { code?: unknown; statusCode?: unknown };
  return value.code === 'FST_REQ_FILE_TOO_LARGE' || value.statusCode === 413;
}
