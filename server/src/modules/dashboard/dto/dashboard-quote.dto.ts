import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { DASHBOARD_QUOTE_PAGE_SIZE_MAX, DASHBOARD_QUOTE_SOURCE_MAX, DASHBOARD_QUOTE_TEXT_MAX } from '@bookorbit/types';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateDashboardQuoteDto {
  @Transform(trim)
  @IsString()
  @MaxLength(DASHBOARD_QUOTE_TEXT_MAX)
  text!: string;

  @Transform(trim)
  @IsString()
  @MaxLength(DASHBOARD_QUOTE_SOURCE_MAX)
  source!: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateDashboardQuoteDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(DASHBOARD_QUOTE_TEXT_MAX)
  text?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(DASHBOARD_QUOTE_SOURCE_MAX)
  source?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class ListDashboardQuotesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(DASHBOARD_QUOTE_PAGE_SIZE_MAX)
  pageSize = 20;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class RandomDashboardQuoteDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  excludeId?: number;
}
