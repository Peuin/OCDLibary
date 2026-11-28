import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import {
  DASHBOARD_QUOTE_IMPORT_MAX_ROWS,
  type DashboardQuote,
  type DashboardQuoteImportResult,
  type DashboardQuotePage,
  type DashboardRandomQuoteResponse,
} from '@bookorbit/types';
import type { RequestUser } from '../../common/types/request-user';
import { sanitizeLogValue } from '../../common/utils/log-sanitize.utils';
import type { DashboardQuoteRow } from '../../db/schema';
import { parseDashboardQuoteFile, type DashboardQuoteImportFormat } from './dashboard-quote-import.parser';
import { DashboardQuoteRepository, quoteKey } from './dashboard-quote.repository';
import type { CreateDashboardQuoteDto, ListDashboardQuotesDto, UpdateDashboardQuoteDto } from './dto/dashboard-quote.dto';

@Injectable()
export class DashboardQuoteService {
  private readonly logger = new Logger(DashboardQuoteService.name);

  constructor(private readonly repo: DashboardQuoteRepository) {}

  /** A different enabled quote from `excludeId` whenever there are at least two to choose from. */
  async pickRandom(excludeId: number | undefined): Promise<DashboardRandomQuoteResponse> {
    const quote =
      (await this.repo.findRandomEnabled(excludeId ?? null)) ?? (excludeId !== undefined ? await this.repo.findRandomEnabled(null) : null);
    return { quote };
  }

  async list(query: ListDashboardQuotesDto): Promise<DashboardQuotePage> {
    const search = query.search || undefined;
    const { items, total } = await this.repo.findPage((query.page - 1) * query.pageSize, query.pageSize, search);
    return { items: items.map(toResponse), total, page: query.page, pageSize: query.pageSize };
  }

  async create(dto: CreateDashboardQuoteDto, user: RequestUser): Promise<DashboardQuote> {
    const text = requireValue(dto.text, 'Quote text is required');
    const source = requireValue(dto.source, 'Quote source is required');
    if (await this.repo.findDuplicate(text, source)) throw new ConflictException('This quote already exists');
    const row = await this.repo.insert({ text, source, enabled: dto.enabled ?? true });
    this.logger.log(`[dashboard.quote_create] [end] userId=${user.id} quoteId=${row.id} - quote created`);
    return toResponse(row);
  }

  async update(id: number, dto: UpdateDashboardQuoteDto, user: RequestUser): Promise<DashboardQuote> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Quote not found');
    const text = dto.text !== undefined ? requireValue(dto.text, 'Quote text is required') : existing.text;
    const source = dto.source !== undefined ? requireValue(dto.source, 'Quote source is required') : existing.source;
    if ((text !== existing.text || source !== existing.source) && (await this.repo.findDuplicate(text, source, id))) {
      throw new ConflictException('This quote already exists');
    }
    const row = await this.repo.update(id, { text, source, enabled: dto.enabled ?? existing.enabled });
    if (!row) throw new NotFoundException('Quote not found');
    this.logger.log(`[dashboard.quote_update] [end] userId=${user.id} quoteId=${id} enabled=${row.enabled} - quote updated`);
    return toResponse(row);
  }

  async remove(id: number, user: RequestUser): Promise<void> {
    if (!(await this.repo.delete(id))) throw new NotFoundException('Quote not found');
    this.logger.log(`[dashboard.quote_delete] [end] userId=${user.id} quoteId=${id} - quote deleted`);
  }

  /** Imports the valid rows, skips quotes that already exist, and reports every bad row by its line. */
  async importFile(content: string, format: DashboardQuoteImportFormat, user: RequestUser): Promise<DashboardQuoteImportResult> {
    const event = 'dashboard.quote_import';
    const startedAt = Date.now();
    this.logger.log(`[${event}] [start] userId=${user.id} format=${format} bytes=${Buffer.byteLength(content)} - quote import started`);
    try {
      const parsed = parseDashboardQuoteFile(content, format);
      if (parsed.rowCount > DASHBOARD_QUOTE_IMPORT_MAX_ROWS) {
        throw new BadRequestException(`A file can hold at most ${DASHBOARD_QUOTE_IMPORT_MAX_ROWS} quotes`);
      }

      const seen = await this.repo.findExistingKeys([...new Set(parsed.quotes.map((quote) => quote.text))]);
      const fresh = parsed.quotes.filter((quote) => {
        const key = quoteKey(quote.text, quote.source);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const imported = await this.repo.insertMany(fresh.map(({ text, source, enabled }) => ({ text, source, enabled })));
      const result = { imported, skippedDuplicates: parsed.quotes.length - fresh.length, errors: parsed.errors };

      this.logger.log(
        `[${event}] [end] userId=${user.id} format=${format} durationMs=${Date.now() - startedAt} rows=${parsed.rowCount} imported=${imported} skippedDuplicates=${result.skippedDuplicates} errorRows=${parsed.errors.length} - quote import completed`,
      );
      return result;
    } catch (error) {
      const errorClass = error instanceof Error ? error.constructor.name : typeof error;
      const detail = sanitizeLogValue(error instanceof Error ? error.message : error);
      this.logger.warn(
        `[${event}] [fail] userId=${user.id} format=${format} durationMs=${Date.now() - startedAt} errorClass=${errorClass} error="${detail}" - quote import failed`,
      );
      throw error;
    }
  }
}

function requireValue(value: string, message: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new BadRequestException(message);
  return trimmed;
}

function toResponse(row: DashboardQuoteRow): DashboardQuote {
  return {
    id: row.id,
    text: row.text,
    source: row.source,
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
