import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import sharp from 'sharp';

import {
  DASHBOARD_FEATURED_SHELF_IMAGE_MAX_BYTES,
  DASHBOARD_FEATURED_SHELF_MAX,
  DASHBOARD_FEATURED_SHELF_ROWS_MAX,
  DASHBOARD_FEATURED_SHELF_SAINT_NAME_MAX,
  DASHBOARD_FEATURED_SHELF_TITLE_MAX,
  DASHBOARD_SHELF_LAYOUTS,
  type DashboardDefaultLayout,
  type DashboardFeaturedShelf,
  type DashboardSharedConfig,
} from '@bookorbit/types';
import { APP_SETTING_KEYS } from '../../common/constants/app-settings.constants';
import type { RequestUser } from '../../common/types/request-user';
import { sanitizeLogValue } from '../../common/utils/log-sanitize.utils';
import type { DashboardFeaturedShelfRow } from '../../db/schema';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { DashboardFeaturedShelfImageStorage } from './dashboard-featured-shelf-image.storage';
import { DashboardFeaturedShelfRepository } from './dashboard-featured-shelf.repository';
import { DashboardShelfBookService } from './dashboard-shelf-book.service';
import type {
  CreateDashboardFeaturedShelfDto,
  DashboardDefaultLayoutDto,
  ReorderDashboardFeaturedShelvesDto,
  UpdateDashboardFeaturedShelfDto,
} from './dto/dashboard-featured-shelf.dto';

// Portraits sit in an arched 3:4 frame at the head of the shelf.
const SHELF_IMAGE_WIDTH_PX = 480;
const SHELF_IMAGE_HEIGHT_PX = 640;

/** The dashboard shelves an administrator builds for every user: title, saint card and layout. */
@Injectable()
export class DashboardFeaturedShelfService {
  private readonly logger = new Logger(DashboardFeaturedShelfService.name);

  constructor(
    private readonly repo: DashboardFeaturedShelfRepository,
    private readonly imageStorage: DashboardFeaturedShelfImageStorage,
    private readonly appSettings: AppSettingsService,
    private readonly shelfBookService: DashboardShelfBookService,
  ) {}

  async getSharedConfig(): Promise<DashboardSharedConfig> {
    const [featuredShelves, defaultLayout] = await Promise.all([this.listAll(), this.getDefaultLayout()]);
    return { featuredShelves, defaultLayout };
  }

  async listAll(): Promise<DashboardFeaturedShelf[]> {
    const rows = await this.repo.findAll();
    return rows.map((row) => this.toResponse(row));
  }

  async create(dto: CreateDashboardFeaturedShelfDto, user: RequestUser): Promise<DashboardFeaturedShelf> {
    const event = 'dashboard.featured_shelf_create';
    const startedAt = Date.now();
    this.logger.log(`[${event}] [start] userId=${user.id} - shelf create started`);
    try {
      const count = await this.repo.count();
      if (count >= DASHBOARD_FEATURED_SHELF_MAX) {
        throw new BadRequestException(`A dashboard holds at most ${DASHBOARD_FEATURED_SHELF_MAX} shelves`);
      }
      const collectionId = dto.collectionId ?? null;
      if (collectionId !== null) await this.shelfBookService.assertLinkable(collectionId);
      const row = await this.repo.insert({
        title: this.resolveTitle(dto.title),
        collectionId,
        saintName: this.resolveSaintName(dto.saintName),
        rows: this.resolveRows(dto.rows),
        displayOrder: count + 1,
        createdByUserId: user.id,
      });
      this.logger.log(`[${event}] [end] userId=${user.id} shelfId=${row.id} durationMs=${Date.now() - startedAt} - shelf created`);
      return this.toResponse(row);
    } catch (error) {
      this.logFailure(event, `userId=${user.id}`, startedAt, error, 'shelf create failed');
      throw error;
    }
  }

  async update(id: number, dto: UpdateDashboardFeaturedShelfDto, user: RequestUser): Promise<DashboardFeaturedShelf> {
    const event = 'dashboard.featured_shelf_update';
    const startedAt = Date.now();
    this.logger.log(`[${event}] [start] userId=${user.id} shelfId=${id} - shelf update started`);
    try {
      const existing = await this.getShelfOrThrow(id);
      if (dto.collectionId !== undefined) await this.shelfBookService.relink(existing, dto.collectionId, user);
      const row = await this.repo.update(id, {
        collectionId: dto.collectionId !== undefined ? dto.collectionId : existing.collectionId,
        title: dto.title !== undefined ? this.resolveTitle(dto.title) : existing.title,
        saintName: dto.saintName !== undefined ? this.resolveSaintName(dto.saintName) : existing.saintName,
        rows: dto.rows !== undefined ? this.resolveRows(dto.rows) : existing.rows,
      });
      if (!row) throw new NotFoundException('Shelf not found');
      this.logger.log(`[${event}] [end] userId=${user.id} shelfId=${id} durationMs=${Date.now() - startedAt} - shelf updated`);
      return this.toResponse(row);
    } catch (error) {
      this.logFailure(event, `userId=${user.id} shelfId=${id}`, startedAt, error, 'shelf update failed');
      throw error;
    }
  }

  async remove(id: number, user: RequestUser): Promise<void> {
    const event = 'dashboard.featured_shelf_delete';
    const startedAt = Date.now();
    this.logger.log(`[${event}] [start] userId=${user.id} shelfId=${id} - shelf delete started`);
    try {
      if (!(await this.repo.delete(id))) throw new NotFoundException('Shelf not found');
      await this.imageStorage.delete(id);
      this.logger.log(`[${event}] [end] userId=${user.id} shelfId=${id} durationMs=${Date.now() - startedAt} - shelf deleted`);
    } catch (error) {
      this.logFailure(event, `userId=${user.id} shelfId=${id}`, startedAt, error, 'shelf delete failed');
      throw error;
    }
  }

  async reorder(dto: ReorderDashboardFeaturedShelvesDto): Promise<DashboardFeaturedShelf[]> {
    const rows = await this.repo.findAll();
    const existingIds = new Set(rows.map((row) => row.id));
    if (dto.ids.length !== existingIds.size || dto.ids.some((id) => !existingIds.has(id))) {
      throw new BadRequestException('Reorder must list every shelf exactly once');
    }
    await this.repo.updateDisplayOrders(dto.ids);
    return this.listAll();
  }

  async uploadImage(id: number, bytes: Buffer, mimeType: string, user: RequestUser): Promise<DashboardFeaturedShelf> {
    const event = 'dashboard.featured_shelf_image_upload';
    const startedAt = Date.now();
    this.logger.log(`[${event}] [start] userId=${user.id} shelfId=${id} bytes=${bytes.length} - shelf portrait upload started`);
    try {
      if (!mimeType.startsWith('image/')) throw new BadRequestException('File must be an image');
      if (bytes.length === 0) throw new BadRequestException('File is empty');
      if (bytes.length > DASHBOARD_FEATURED_SHELF_IMAGE_MAX_BYTES) throw new BadRequestException('Image exceeds 5 MB limit');
      await this.getShelfOrThrow(id);

      await this.imageStorage.save(id, await this.normalizeImage(bytes));
      const row = await this.repo.bumpImageVersion(id, true);
      if (!row) throw new NotFoundException('Shelf not found');
      this.logger.log(
        `[${event}] [end] userId=${user.id} shelfId=${id} imageVersion=${row.imageVersion} durationMs=${Date.now() - startedAt} - shelf portrait uploaded`,
      );
      return this.toResponse(row);
    } catch (error) {
      this.logFailure(event, `userId=${user.id} shelfId=${id}`, startedAt, error, 'shelf portrait upload failed');
      throw error;
    }
  }

  async removeImage(id: number, user: RequestUser): Promise<DashboardFeaturedShelf> {
    await this.getShelfOrThrow(id);
    await this.imageStorage.delete(id);
    const row = await this.repo.bumpImageVersion(id, false);
    if (!row) throw new NotFoundException('Shelf not found');
    this.logger.log(`[dashboard.featured_shelf_image_delete] [end] userId=${user.id} shelfId=${id} - shelf portrait removed`);
    return this.toResponse(row);
  }

  async getImagePath(id: number): Promise<string | null> {
    const row = await this.repo.findById(id);
    if (!row || row.imageVersion <= 0) return null;
    return this.imageStorage.getPathIfExists(id);
  }

  async getDefaultLayout(): Promise<DashboardDefaultLayout | null> {
    const raw = await this.appSettings.getValue(APP_SETTING_KEYS.DASHBOARD_DEFAULT_LAYOUT);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<DashboardDefaultLayout>;
      if (!Array.isArray(parsed.scrollers)) return null;
      const shelfLayout = (DASHBOARD_SHELF_LAYOUTS as readonly string[]).includes(parsed.shelfLayout ?? '') ? parsed.shelfLayout! : 'two-columns';
      return { scrollers: parsed.scrollers, shelfLayout };
    } catch {
      return null;
    }
  }

  async setDefaultLayout(dto: DashboardDefaultLayoutDto, user: RequestUser): Promise<DashboardDefaultLayout> {
    const layout: DashboardDefaultLayout = { scrollers: dto.scrollers, shelfLayout: dto.shelfLayout };
    await this.appSettings.setValue(APP_SETTING_KEYS.DASHBOARD_DEFAULT_LAYOUT, JSON.stringify(layout));
    this.logger.log(
      `[dashboard.default_layout_update] [end] userId=${user.id} shelfCount=${dto.scrollers.length} shelfLayout=${dto.shelfLayout} - dashboard default layout saved`,
    );
    return layout;
  }

  async clearDefaultLayout(user: RequestUser): Promise<void> {
    await this.appSettings.setValue(APP_SETTING_KEYS.DASHBOARD_DEFAULT_LAYOUT, '');
    this.logger.log(`[dashboard.default_layout_update] [end] userId=${user.id} cleared=true - dashboard default layout cleared`);
  }

  private async getShelfOrThrow(id: number): Promise<DashboardFeaturedShelfRow> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException('Shelf not found');
    return row;
  }

  private resolveTitle(title: string): string {
    const trimmed = title.trim().slice(0, DASHBOARD_FEATURED_SHELF_TITLE_MAX);
    if (!trimmed) throw new BadRequestException('A shelf needs a title');
    return trimmed;
  }

  private resolveSaintName(saintName: string | undefined): string | null {
    const trimmed = (saintName ?? '').trim();
    return trimmed ? trimmed.slice(0, DASHBOARD_FEATURED_SHELF_SAINT_NAME_MAX) : null;
  }

  private resolveRows(rows: number | undefined): number {
    return Math.min(Math.max(rows ?? 1, 1), DASHBOARD_FEATURED_SHELF_ROWS_MAX);
  }

  private toResponse(row: DashboardFeaturedShelfRow): DashboardFeaturedShelf {
    return {
      id: row.id,
      title: row.title,
      saintName: row.saintName,
      imageUrl: row.imageVersion > 0 ? `/api/v1/dashboard/featured-shelves/${row.id}/image?v=${row.imageVersion}` : null,
      rows: row.rows,
      displayOrder: row.displayOrder,
      collectionId: row.collectionId,
    };
  }

  private async normalizeImage(bytes: Buffer): Promise<Buffer> {
    try {
      return await sharp(bytes)
        .rotate()
        .resize(SHELF_IMAGE_WIDTH_PX, SHELF_IMAGE_HEIGHT_PX, { fit: 'cover', position: 'attention' })
        .jpeg({ quality: 88, mozjpeg: true })
        .toBuffer();
    } catch {
      throw new BadRequestException('Invalid image file');
    }
  }

  private logFailure(event: string, ids: string, startedAt: number, error: unknown, message: string): void {
    const errorClass = error instanceof Error ? error.constructor.name : typeof error;
    const detail = sanitizeLogValue(error instanceof Error ? error.message : error);
    this.logger.warn(`[${event}] [fail] ${ids} durationMs=${Date.now() - startedAt} errorClass=${errorClass} error="${detail}" - ${message}`);
  }
}
