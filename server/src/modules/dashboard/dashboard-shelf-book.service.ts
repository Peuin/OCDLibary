import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { DASHBOARD_SHELF_BOOKS_MAX, type AddDashboardShelfBooksResponse, type ContentFilterRules } from '@bookorbit/types';
import type { RequestUser } from '../../common/types/request-user';
import { sanitizeLogValue } from '../../common/utils/log-sanitize.utils';
import type { DashboardFeaturedShelfRow } from '../../db/schema';
import { CollectionService } from '../collection/collection.service';
import { DashboardFeaturedShelfRepository } from './dashboard-featured-shelf.repository';
import { DashboardShelfBookRepository } from './dashboard-shelf-book.repository';

/**
 * The books on a dashboard shelf. A shelf linked to a collection follows it one way: whatever the
 * collection gains or loses shows on the shelf, while books added to or taken off the shelf stay on
 * the shelf and never touch the collection. A collection book taken off the shelf is kept as a
 * hidden row, so the shelf stops showing it without the collection losing it.
 */
@Injectable()
export class DashboardShelfBookService {
  private readonly logger = new Logger(DashboardShelfBookService.name);

  constructor(
    private readonly repo: DashboardShelfBookRepository,
    private readonly shelfRepo: DashboardFeaturedShelfRepository,
    private readonly collectionService: CollectionService,
  ) {}

  /** The collection's books first, in its order, then the shelf's own, skipping hidden and repeated books. */
  async findVisibleBookIds(
    shelfId: number,
    user: RequestUser,
    accessibleLibraryIds: number[],
    limit: number,
    contentFilters?: ContentFilterRules,
  ): Promise<number[]> {
    const shelf = await this.getShelfOrThrow(shelfId);
    const ownBookIds = await this.repo.findVisibleBookIds(shelfId, accessibleLibraryIds, limit, contentFilters);
    if (shelf.collectionId === null) return ownBookIds;

    const hidden = new Set(await this.repo.findHiddenBookIds(shelfId));
    const collectionBookIds = await this.findCollectionBookIds(shelf.collectionId, user, limit + hidden.size, accessibleLibraryIds);
    const visible = [...collectionBookIds.filter((id) => !hidden.has(id)), ...ownBookIds];
    return [...new Set(visible)].slice(0, limit);
  }

  async addBooks(shelfId: number, bookIds: number[], user: RequestUser): Promise<AddDashboardShelfBooksResponse> {
    const event = 'dashboard.shelf_books_add';
    const startedAt = Date.now();
    const requested = [...new Set(bookIds)];
    this.logger.log(`[${event}] [start] userId=${user.id} shelfId=${shelfId} requestedCount=${requested.length} - shelf books add started`);
    try {
      const shelf = await this.getShelfOrThrow(shelfId);
      // A collection book taken off the shelf comes back by being shown again, not as a copy.
      const restored = shelf.collectionId !== null ? await this.repo.unhideBooks(shelfId, requested) : 0;
      const existingIds = new Set(await this.repo.findExistingBookIds(requested));
      const toAdd = requested.filter((id) => existingIds.has(id));
      if (toAdd.length === 0 && restored === 0) throw new NotFoundException('None of these books exist');
      if ((await this.repo.countBooks(shelfId)) + toAdd.length > DASHBOARD_SHELF_BOOKS_MAX) {
        throw new BadRequestException(`A shelf holds at most ${DASHBOARD_SHELF_BOOKS_MAX} books of its own`);
      }
      const appended = await this.repo.appendBooks(shelfId, toAdd, user.id);
      this.logger.log(
        `[${event}] [end] userId=${user.id} shelfId=${shelfId} durationMs=${Date.now() - startedAt} appended=${appended} restored=${restored} - shelf books added`,
      );
      return { added: appended + restored };
    } catch (error) {
      this.logFailure(event, `userId=${user.id} shelfId=${shelfId}`, startedAt, error, 'shelf books add failed');
      throw error;
    }
  }

  async removeBook(shelfId: number, bookId: number, user: RequestUser): Promise<void> {
    const event = 'dashboard.shelf_books_remove';
    const startedAt = Date.now();
    this.logger.log(`[${event}] [start] userId=${user.id} shelfId=${shelfId} bookId=${bookId} - shelf book remove started`);
    try {
      const shelf = await this.getShelfOrThrow(shelfId);
      const fromCollection = shelf.collectionId !== null && (await this.collectionService.containsBook(shelf.collectionId, bookId));
      if (fromCollection) {
        await this.repo.hideBook(shelfId, bookId, user.id);
      } else if (!(await this.repo.removeBook(shelfId, bookId))) {
        throw new NotFoundException('That book is not on this shelf');
      }
      this.logger.log(
        `[${event}] [end] userId=${user.id} shelfId=${shelfId} bookId=${bookId} durationMs=${Date.now() - startedAt} hidden=${fromCollection} - shelf book removed`,
      );
    } catch (error) {
      this.logFailure(event, `userId=${user.id} shelfId=${shelfId} bookId=${bookId}`, startedAt, error, 'shelf book remove failed');
      throw error;
    }
  }

  assertLinkable(collectionId: number): Promise<void> {
    return this.collectionService.assertShelfLinkable(collectionId);
  }

  /**
   * Applies a link change. The shelf's own books always stay. Hidden books belong to the old link and
   * are dropped; unlinking keeps a copy of the books the collection was showing, so the shelf does not
   * suddenly empty.
   */
  async relink(shelf: DashboardFeaturedShelfRow, collectionId: number | null, user: RequestUser): Promise<void> {
    if (shelf.collectionId === collectionId) return;
    if (collectionId !== null) await this.assertLinkable(collectionId);
    if (collectionId === null && shelf.collectionId !== null) {
      const hidden = new Set(await this.repo.findHiddenBookIds(shelf.id));
      const shown = await this.findCollectionBookIds(shelf.collectionId, user, DASHBOARD_SHELF_BOOKS_MAX + hidden.size);
      const room = DASHBOARD_SHELF_BOOKS_MAX - (await this.repo.countBooks(shelf.id));
      await this.repo.removeHiddenBooks(shelf.id);
      await this.repo.appendBooks(shelf.id, shown.filter((id) => !hidden.has(id)).slice(0, Math.max(room, 0)), user.id);
      return;
    }
    await this.repo.removeHiddenBooks(shelf.id);
  }

  private async findCollectionBookIds(collectionId: number, user: RequestUser, limit: number, libraryIds?: number[]): Promise<number[]> {
    try {
      return await this.collectionService.findBookIdsInOrder(collectionId, user, limit, libraryIds);
    } catch (error) {
      // A linked collection that went private leaves only the shelf's own books for readers.
      if (error instanceof ForbiddenException || error instanceof NotFoundException) return [];
      throw error;
    }
  }

  private async getShelfOrThrow(shelfId: number): Promise<DashboardFeaturedShelfRow> {
    const shelf = await this.shelfRepo.findById(shelfId);
    if (!shelf) throw new NotFoundException('Shelf not found');
    return shelf;
  }

  private logFailure(event: string, ids: string, startedAt: number, error: unknown, message: string): void {
    const errorClass = error instanceof Error ? error.constructor.name : typeof error;
    const detail = sanitizeLogValue(error instanceof Error ? error.message : error);
    this.logger.warn(`[${event}] [fail] ${ids} durationMs=${Date.now() - startedAt} errorClass=${errorClass} error="${detail}" - ${message}`);
  }
}
