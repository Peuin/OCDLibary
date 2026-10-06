import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ContentFilterRules } from '@bookorbit/types';

import { DB } from '../../db';
import * as schema from '../../db/schema';
import { books, dashboardShelfBooks } from '../../db/schema';
import { buildContentFilterClauses } from '../../common/utils/content-filter-sql.utils';

type Db = NodePgDatabase<typeof schema>;

@Injectable()
export class DashboardShelfBookRepository {
  constructor(@Inject(DB) private readonly db: Db) {}

  /** The picked books this viewer may see, in the order they were added. */
  async findVisibleBookIds(shelfId: number, accessibleLibraryIds: number[], limit: number, contentFilters?: ContentFilterRules): Promise<number[]> {
    if (accessibleLibraryIds.length === 0) return [];
    const cfClauses = contentFilters ? buildContentFilterClauses(contentFilters, this.db) : [];
    const rows = await this.db
      .select({ id: books.id })
      .from(dashboardShelfBooks)
      .innerJoin(books, eq(books.id, dashboardShelfBooks.bookId))
      .where(and(eq(dashboardShelfBooks.shelfId, shelfId), inArray(books.libraryId, accessibleLibraryIds), ...cfClauses))
      .orderBy(asc(dashboardShelfBooks.position), asc(dashboardShelfBooks.id))
      .limit(limit);
    return rows.map((row) => row.id);
  }

  async countBooks(shelfId: number): Promise<number> {
    const [row] = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(dashboardShelfBooks)
      .where(eq(dashboardShelfBooks.shelfId, shelfId));
    return row?.total ?? 0;
  }

  async findExistingBookIds(bookIds: number[]): Promise<number[]> {
    if (bookIds.length === 0) return [];
    const rows = await this.db.select({ id: books.id }).from(books).where(inArray(books.id, bookIds));
    return rows.map((row) => row.id);
  }

  /** Appends the books after the shelf's last one; books already on the shelf are left where they are. */
  async appendBooks(shelfId: number, bookIds: number[], userId: number): Promise<number> {
    if (bookIds.length === 0) return 0;
    return this.db.transaction(async (tx) => {
      const [last] = await tx
        .select({ position: sql<number>`coalesce(max(${dashboardShelfBooks.position}), 0)::int` })
        .from(dashboardShelfBooks)
        .where(eq(dashboardShelfBooks.shelfId, shelfId));
      const start = last?.position ?? 0;
      const inserted = await tx
        .insert(dashboardShelfBooks)
        .values(bookIds.map((bookId, index) => ({ shelfId, bookId, position: start + index + 1, addedByUserId: userId })))
        .onConflictDoNothing({ target: [dashboardShelfBooks.shelfId, dashboardShelfBooks.bookId] })
        .returning({ id: dashboardShelfBooks.id });
      return inserted.length;
    });
  }

  async removeBook(shelfId: number, bookId: number): Promise<boolean> {
    const rows = await this.db
      .delete(dashboardShelfBooks)
      .where(and(eq(dashboardShelfBooks.shelfId, shelfId), eq(dashboardShelfBooks.bookId, bookId)))
      .returning({ id: dashboardShelfBooks.id });
    return rows.length > 0;
  }
}
