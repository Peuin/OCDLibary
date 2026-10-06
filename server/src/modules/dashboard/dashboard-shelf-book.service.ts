import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { DASHBOARD_SHELF_BOOKS_MAX, type AddDashboardShelfBooksResponse, type ContentFilterRules } from '@bookorbit/types';
import type { RequestUser } from '../../common/types/request-user';
import { sanitizeLogValue } from '../../common/utils/log-sanitize.utils';
import { DashboardFeaturedShelfRepository } from './dashboard-featured-shelf.repository';
import { DashboardShelfBookRepository } from './dashboard-shelf-book.repository';

/** The books on a dashboard shelf. They change only when an administrator adds or removes one. */
@Injectable()
export class DashboardShelfBookService {
  private readonly logger = new Logger(DashboardShelfBookService.name);

  constructor(
    private readonly repo: DashboardShelfBookRepository,
    private readonly shelfRepo: DashboardFeaturedShelfRepository,
  ) {}

  /** The shelf's books this viewer may see, in the order they were added. */
  findVisibleBookIds(shelfId: number, accessibleLibraryIds: number[], limit: number, contentFilters?: ContentFilterRules): Promise<number[]> {
    return this.repo.findVisibleBookIds(shelfId, accessibleLibraryIds, limit, contentFilters);
  }

  async addBooks(shelfId: number, bookIds: number[], user: RequestUser): Promise<AddDashboardShelfBooksResponse> {
    const event = 'dashboard.shelf_books_add';
    const startedAt = Date.now();
    const requested = [...new Set(bookIds)];
    this.logger.log(`[${event}] [start] userId=${user.id} shelfId=${shelfId} requestedCount=${requested.length} - shelf books add started`);
    try {
      if (!(await this.shelfRepo.findById(shelfId))) throw new NotFoundException('Shelf not found');
      const existingIds = new Set(await this.repo.findExistingBookIds(requested));
      const toAdd = requested.filter((id) => existingIds.has(id));
      if (toAdd.length === 0) throw new NotFoundException('None of these books exist');
      if ((await this.repo.countBooks(shelfId)) + toAdd.length > DASHBOARD_SHELF_BOOKS_MAX) {
        throw new BadRequestException(`A shelf holds at most ${DASHBOARD_SHELF_BOOKS_MAX} books`);
      }
      const added = await this.repo.appendBooks(shelfId, toAdd, user.id);
      this.logger.log(
        `[${event}] [end] userId=${user.id} shelfId=${shelfId} durationMs=${Date.now() - startedAt} added=${added} skipped=${requested.length - added} - shelf books added`,
      );
      return { added };
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
      if (!(await this.repo.removeBook(shelfId, bookId))) throw new NotFoundException('That book is not on this shelf');
      this.logger.log(
        `[${event}] [end] userId=${user.id} shelfId=${shelfId} bookId=${bookId} durationMs=${Date.now() - startedAt} - shelf book removed`,
      );
    } catch (error) {
      this.logFailure(event, `userId=${user.id} shelfId=${shelfId} bookId=${bookId}`, startedAt, error, 'shelf book remove failed');
      throw error;
    }
  }

  private logFailure(event: string, ids: string, startedAt: number, error: unknown, message: string): void {
    const errorClass = error instanceof Error ? error.constructor.name : typeof error;
    const detail = sanitizeLogValue(error instanceof Error ? error.message : error);
    this.logger.warn(`[${event}] [fail] ${ids} durationMs=${Date.now() - startedAt} errorClass=${errorClass} error="${detail}" - ${message}`);
  }
}
