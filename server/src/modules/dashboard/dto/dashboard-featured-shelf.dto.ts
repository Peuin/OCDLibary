import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
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
  DASHBOARD_ATTACHABLE_SHELF_TYPES,
  DASHBOARD_FEATURED_SHELF_MAX,
  DASHBOARD_FEATURED_SHELF_SAINT_NAME_MAX,
  DASHBOARD_FEATURED_SHELF_TITLE_MAX,
  DASHBOARD_SCROLLER_MAX_LIMIT,
  DASHBOARD_SHELF_LAYOUTS,
  SCROLLER_TYPES,
  type DashboardAttachableShelfType,
  type DashboardShelfLayoutValue,
  type ScrollerType,
} from '@bookorbit/types';

const MAX_DEFAULT_LAYOUT_SHELVES = DASHBOARD_FEATURED_SHELF_MAX + 8;
const MAX_SHELF_ROWS = 3;

export class CreateDashboardFeaturedShelfDto {
  @IsInt()
  @Min(1)
  collectionId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(DASHBOARD_FEATURED_SHELF_TITLE_MAX)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(DASHBOARD_FEATURED_SHELF_SAINT_NAME_MAX)
  saintName?: string;

  // null is meaningful here: it detaches the entry, so only undefined skips validation.
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsIn(DASHBOARD_ATTACHABLE_SHELF_TYPES)
  attachTo?: DashboardAttachableShelfType | null;
}

export class UpdateDashboardFeaturedShelfDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  collectionId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(DASHBOARD_FEATURED_SHELF_TITLE_MAX)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(DASHBOARD_FEATURED_SHELF_SAINT_NAME_MAX)
  saintName?: string;

  // null is meaningful here: it detaches the entry, so only undefined skips validation.
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsIn(DASHBOARD_ATTACHABLE_SHELF_TYPES)
  attachTo?: DashboardAttachableShelfType | null;
}

export class ReorderDashboardFeaturedShelvesDto {
  @IsArray()
  @ArrayMaxSize(DASHBOARD_FEATURED_SHELF_MAX)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids!: number[];
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

  @IsOptional()
  @IsInt()
  @Min(1)
  featuredShelfId?: number;
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
