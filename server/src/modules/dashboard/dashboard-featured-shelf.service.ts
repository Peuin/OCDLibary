import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import sharp from 'sharp';

import {
  DASHBOARD_FEATURED_SHELF_IMAGE_MAX_BYTES,
  DASHBOARD_FEATURED_SHELF_MAX,
  DASHBOARD_FEATURED_SHELF_SAINT_NAME_MAX,
  DASHBOARD_FEATURED_SHELF_TITLE_MAX,
  DASHBOARD_SHELF_LAYOUTS,
  type DashboardAttachableShelfType,
  type DashboardDefaultLayout,
  type DashboardFeaturedShelf,
  type DashboardSharedConfig,
} from '@bookorbit/types';
import { APP_SETTING_KEYS } from '../../common/constants/app-settings.constants';
import type { RequestUser } from '../../common/types/request-user';
import { sanitizeLogValue } from '../../common/utils/log-sanitize.utils';
import type { DashboardFeaturedShelfRow } from '../../db/schema';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { CollectionService } from '../collection/collection.service';
import { DashboardFeaturedShelfImageStorage } from './dashboard-featured-shelf-image.storage';
import { DashboardFeaturedShelfRepository } from './dashboard-featured-shelf.repository';
import type {
  CreateDashboardFeaturedShelfDto,
  DashboardDefaultLayoutDto,
  ReorderDashboardFeaturedShelvesDto,
  UpdateDashboardFeaturedShelfDto,
} from './dto/dashboard-featured-shelf.dto';

// Portraits sit in an arched 3:4 frame at the head of the shelf.
const SHELF_IMAGE_WIDTH_PX = 480;
const SHELF_IMAGE_HEIGHT_PX = 640;

type CollectionSummary = Awaited<ReturnType<CollectionService['findSummariesByIds']>>[number];

@Injectable()
export class DashboardFeaturedShelfService {
  private readonly logger = new Logger(DashboardFeaturedShelfService.name);

  constructor(
    private readonly repo: DashboardFeaturedShelfRepository,
    private readonly imageStorage: DashboardFeaturedShelfImageStorage,
    private readonly collectionService: CollectionService,
    private readonly appSettings: AppSettingsService,
  ) {}

  async getSharedConfig(user: RequestUser): Promise<DashboardSharedConfig> {
    const [featuredShelves, defaultLayout] = await Promise.all([this.listVisible(user), this.getDefaultLayout()]);
    return { featuredShelves, defaultLayout };
  }

  /** Every shelf, including ones whose collection went private, for the administrator's editor. */
  async listAll(): Promise<DashboardFeaturedShelf[]> {
    const rows = await this.repo.findAll();
    const summaries = await this.summariesById(rows);
    return rows.map((row) => this.toResponse(row, summaries.get(row.collectionId)));
  }

  async create(dto: CreateDashboardFeaturedShelfDto, user: RequestUser): Promise<DashboardFeaturedShelf> {
    const event = 'dashboard.featured_shelf_create';
    const startedAt = Date.now();
    this.logger.log(`[${event}] [start] userId=${user.id} collectionId=${dto.collectionId} - featured shelf create started`);
    try {
      if ((await this.repo.count()) >= DASHBOARD_FEATURED_SHELF_MAX) {
        throw new BadRequestException(`A dashboard holds at most ${DASHBOARD_FEATURED_SHELF_MAX} featured shelves`);
      }
      const collection = await this.getFeaturableCollection(dto.collectionId);
      const attachTo = dto.attachTo ?? null;
      await this.assertAttachTargetFree(attachTo);
      const row = await this.repo.insert({
        attachTo,
        collectionId: collection.id,
        title: this.resolveTitle(dto.title, collection.name),
        saintName: this.resolveSaintName(dto.saintName),
        displayOrder: (await this.repo.count()) + 1,
        createdByUserId: user.id,
      });
      this.logger.log(
        `[${event}] [end] userId=${user.id} shelfId=${row.id} collectionId=${collection.id} durationMs=${Date.now() - startedAt} - featured shelf created`,
      );
      return this.toResponse(row, collection);
    } catch (error) {
      this.logFailure(event, `userId=${user.id} collectionId=${dto.collectionId}`, startedAt, error, 'featured shelf create failed');
      throw error;
    }
  }

  async update(id: number, dto: UpdateDashboardFeaturedShelfDto, user: RequestUser): Promise<DashboardFeaturedShelf> {
    const event = 'dashboard.featured_shelf_update';
    const startedAt = Date.now();
    this.logger.log(
      `[${event}] [start] userId=${user.id} shelfId=${id} collectionChanged=${dto.collectionId !== undefined} - featured shelf update started`,
    );
    try {
      const existing = await this.getShelfOrThrow(id);
      const collection = await this.getFeaturableCollection(dto.collectionId ?? existing.collectionId);
      const title = dto.title !== undefined ? this.resolveTitle(dto.title, collection.name) : existing.title;
      const saintName = dto.saintName !== undefined ? this.resolveSaintName(dto.saintName) : existing.saintName;
      const attachTo = dto.attachTo !== undefined ? dto.attachTo : existing.attachTo;
      if (attachTo !== existing.attachTo) await this.assertAttachTargetFree(attachTo, id);
      const row = await this.repo.update(id, { collectionId: collection.id, title, saintName, attachTo });
      if (!row) throw new NotFoundException('Featured shelf not found');
      this.logger.log(`[${event}] [end] userId=${user.id} shelfId=${id} durationMs=${Date.now() - startedAt} - featured shelf updated`);
      return this.toResponse(row, collection);
    } catch (error) {
      this.logFailure(event, `userId=${user.id} shelfId=${id}`, startedAt, error, 'featured shelf update failed');
      throw error;
    }
  }

  async remove(id: number, user: RequestUser): Promise<void> {
    const event = 'dashboard.featured_shelf_delete';
    const startedAt = Date.now();
    this.logger.log(`[${event}] [start] userId=${user.id} shelfId=${id} - featured shelf delete started`);
    try {
      if (!(await this.repo.delete(id))) throw new NotFoundException('Featured shelf not found');
      await this.imageStorage.delete(id);
      this.logger.log(`[${event}] [end] userId=${user.id} shelfId=${id} durationMs=${Date.now() - startedAt} - featured shelf deleted`);
    } catch (error) {
      this.logFailure(event, `userId=${user.id} shelfId=${id}`, startedAt, error, 'featured shelf delete failed');
      throw error;
    }
  }

  async reorder(dto: ReorderDashboardFeaturedShelvesDto): Promise<DashboardFeaturedShelf[]> {
    const rows = await this.repo.findAll();
    const existingIds = new Set(rows.map((row) => row.id));
    if (dto.ids.length !== existingIds.size || dto.ids.some((id) => !existingIds.has(id))) {
      throw new BadRequestException('Reorder must list every featured shelf exactly once');
    }
    await this.repo.updateDisplayOrders(dto.ids);
    return this.listAll();
  }

  async uploadImage(id: number, bytes: Buffer, mimeType: string, user: RequestUser): Promise<DashboardFeaturedShelf> {
    const event = 'dashboard.featured_shelf_image_upload';
    const startedAt = Date.now();
    this.logger.log(`[${event}] [start] userId=${user.id} shelfId=${id} bytes=${bytes.length} - featured shelf image upload started`);
    try {
      if (!mimeType.startsWith('image/')) throw new BadRequestException('File must be an image');
      if (bytes.length === 0) throw new BadRequestException('File is empty');
      if (bytes.length > DASHBOARD_FEATURED_SHELF_IMAGE_MAX_BYTES) throw new BadRequestException('Image exceeds 5 MB limit');
      await this.getShelfOrThrow(id);

      await this.imageStorage.save(id, await this.normalizeImage(bytes));
      const row = await this.repo.bumpImageVersion(id, true);
      if (!row) throw new NotFoundException('Featured shelf not found');
      const [collection] = await this.collectionService.findSummariesByIds([row.collectionId]);
      this.logger.log(
        `[${event}] [end] userId=${user.id} shelfId=${id} imageVersion=${row.imageVersion} durationMs=${Date.now() - startedAt} - featured shelf image uploaded`,
      );
      return this.toResponse(row, collection);
    } catch (error) {
      this.logFailure(event, `userId=${user.id} shelfId=${id}`, startedAt, error, 'featured shelf image upload failed');
      throw error;
    }
  }

  async removeImage(id: number, user: RequestUser): Promise<DashboardFeaturedShelf> {
    await this.getShelfOrThrow(id);
    await this.imageStorage.delete(id);
    const row = await this.repo.bumpImageVersion(id, false);
    if (!row) throw new NotFoundException('Featured shelf not found');
    this.logger.log(`[dashboard.featured_shelf_image_delete] [end] userId=${user.id} shelfId=${id} - featured shelf image removed`);
    const [collection] = await this.collectionService.findSummariesByIds([row.collectionId]);
    return this.toResponse(row, collection);
  }

  async getImagePath(id: number): Promise<string | null> {
    const row = await this.repo.findById(id);
    if (!row || row.imageVersion <= 0) return null;
    return this.imageStorage.getPathIfExists(id);
  }

  /** The collection behind a featured shelf, for the shelf's book query. */
  async resolveCollectionId(featuredShelfId: number | undefined): Promise<number> {
    if (!featuredShelfId || featuredShelfId <= 0) {
      throw new BadRequestException('featuredShelfId is required and must be a positive integer when scroller type is featured-shelf');
    }
    return (await this.getShelfOrThrow(featuredShelfId)).collectionId;
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

  private async listVisible(user: RequestUser): Promise<DashboardFeaturedShelf[]> {
    const rows = await this.repo.findAll();
    const summaries = await this.summariesById(rows);
    return rows
      .filter((row) => {
        const collection = summaries.get(row.collectionId);
        if (!collection || collection.mediaType !== 'books') return false;
        return collection.isPublic || collection.userId === user.id || user.isSuperuser;
      })
      .map((row) => this.toResponse(row, summaries.get(row.collectionId)));
  }

  private async summariesById(rows: DashboardFeaturedShelfRow[]): Promise<Map<number, CollectionSummary>> {
    const summaries = await this.collectionService.findSummariesByIds(rows.map((row) => row.collectionId));
    return new Map(summaries.map((summary) => [summary.id, summary]));
  }

  private async getShelfOrThrow(id: number): Promise<DashboardFeaturedShelfRow> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException('Featured shelf not found');
    return row;
  }

  // A featured shelf is shown to everyone, so its collection has to be one everyone may read.
  private async getFeaturableCollection(collectionId: number): Promise<CollectionSummary> {
    const [collection] = await this.collectionService.findSummariesByIds([collectionId]);
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.mediaType !== 'books') throw new BadRequestException('Only book collections can be featured on the dashboard');
    if (!collection.isPublic) throw new BadRequestException('Make the collection public before featuring it on the dashboard');
    return collection;
  }

  private resolveTitle(title: string | undefined, fallback: string): string {
    const trimmed = (title ?? '').trim() || fallback.trim();
    return trimmed.slice(0, DASHBOARD_FEATURED_SHELF_TITLE_MAX);
  }

  // A built-in shelf leads with one saint, so two entries cannot decorate the same one.
  private async assertAttachTargetFree(attachTo: DashboardAttachableShelfType | null, exceptId?: number): Promise<void> {
    if (attachTo === null) return;
    const rows = await this.repo.findAll();
    if (rows.some((row) => row.attachTo === attachTo && row.id !== exceptId)) {
      throw new BadRequestException('Another featured entry already decorates that shelf');
    }
  }

  private resolveSaintName(saintName: string | undefined): string | null {
    const trimmed = (saintName ?? '').trim();
    return trimmed ? trimmed.slice(0, DASHBOARD_FEATURED_SHELF_SAINT_NAME_MAX) : null;
  }

  private toResponse(row: DashboardFeaturedShelfRow, collection: CollectionSummary | undefined): DashboardFeaturedShelf {
    return {
      id: row.id,
      title: row.title,
      collectionId: row.collectionId,
      collectionName: collection?.name ?? '',
      saintName: row.saintName,
      attachTo: row.attachTo ?? null,
      imageUrl: row.imageVersion > 0 ? `/api/v1/dashboard/featured-shelves/${row.id}/image?v=${row.imageVersion}` : null,
      displayOrder: row.displayOrder,
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
