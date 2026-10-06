import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import {
  DASHBOARD_FEATURED_SHELF_MAX,
  DASHBOARD_FEATURED_SHELF_ROWS_MAX,
  DASHBOARD_FEATURED_SHELF_SAINT_NAME_MAX,
  DASHBOARD_FEATURED_SHELF_TITLE_MAX,
  DASHBOARD_SCROLLER_MAX_LIMIT,
  DASHBOARD_SHELF_BOOKS_MAX,
  DASHBOARD_SHELF_LAYOUTS,
  SCROLLER_TYPES,
  type DashboardShelfLayoutValue,
  type ScrollerType,
} from '@bookorbit/types';

const MAX_DEFAULT_LAYOUT_SHELVES = 16;
const MAX_SHELF_ROWS = 3;

export class CreateDashboardFeaturedShelfDto {
  @IsString()
  @MinLength(1)
  @MaxLength(DASHBOARD_FEATURED_SHELF_TITLE_MAX)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(DASHBOARD_FEATURED_SHELF_SAINT_NAME_MAX)
  saintName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(DASHBOARD_FEATURED_SHELF_ROWS_MAX)
  rows?: number;

  // null unlinks the shelf, so only undefined skips validation.
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsInt()
  @Min(1)
  collectionId?: number | null;
}

export class UpdateDashboardFeaturedShelfDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(DASHBOARD_FEATURED_SHELF_TITLE_MAX)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(DASHBOARD_FEATURED_SHELF_SAINT_NAME_MAX)
  saintName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(DASHBOARD_FEATURED_SHELF_ROWS_MAX)
  rows?: number;

  // null unlinks the shelf, so only undefined skips validation.
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsInt()
  @Min(1)
  collectionId?: number | null;
}

export class ReorderDashboardFeaturedShelvesDto {
  @IsArray()
  @ArrayMaxSize(DASHBOARD_FEATURED_SHELF_MAX)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids!: number[];
}

export class DashboardShelfBookParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  bookId!: number;
}

export class AddDashboardShelfBooksDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(DASHBOARD_SHELF_BOOKS_MAX)
  @IsInt({ each: true })
  @Min(1, { each: true })
  bookIds!: number[];
}

export class DashboardDefaultScrollerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  id!: string;

  @IsIn(SCROLLER_TYPES)
  type!: ScrollerType;

  @IsString()
  @MaxLength(120)
  label!: string;

  @IsBoolean()
  enabled!: boolean;

  @IsInt()
  @Min(0)
  order!: number;

  @IsInt()
  @Min(1)
  @Max(DASHBOARD_SCROLLER_MAX_LIMIT)
  limit!: number;

  @IsInt()
  @Min(1)
  @Max(MAX_SHELF_ROWS)
  rows!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  smartScopeId?: number;
}

export class DashboardDefaultLayoutDto {
  @IsArray()
  @ArrayMaxSize(MAX_DEFAULT_LAYOUT_SHELVES)
  @ValidateNested({ each: true })
  @Type(() => DashboardDefaultScrollerDto)
  scrollers!: DashboardDefaultScrollerDto[];

  @IsIn(DASHBOARD_SHELF_LAYOUTS)
  shelfLayout!: DashboardShelfLayoutValue;
}
