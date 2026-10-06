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

  /** The shelf's own books this viewer may see, in the order they were added. Hidden collection books are not among them. */
  async findVisibleBookIds(shelfId: number, accessibleLibraryIds: number[], limit: number, contentFilters?: ContentFilterRules): Promise<number[]> {
    if (accessibleLibraryIds.length === 0) return [];
    const cfClauses = contentFilters ? buildContentFilterClauses(contentFilters, this.db) : [];
    const rows = await this.db
      .select({ id: books.id })
      .from(dashboardShelfBooks)
      .innerJoin(books, eq(books.id, dashboardShelfBooks.bookId))
      .where(
        and(
          eq(dashboardShelfBooks.shelfId, shelfId),
          eq(dashboardShelfBooks.hidden, false),
          inArray(books.libraryId, accessibleLibraryIds),
          ...cfClauses,
        ),
      )
      .orderBy(asc(dashboardShelfBooks.position), asc(dashboardShelfBooks.id))
      .limit(limit);
    return rows.map((row) => row.id);
  }

  async findHiddenBookIds(shelfId: number): Promise<number[]> {
    const rows = await this.db
      .select({ bookId: dashboardShelfBooks.bookId })
      .from(dashboardShelfBooks)
      .where(and(eq(dashboardShelfBooks.shelfId, shelfId), eq(dashboardShelfBooks.hidden, true)));
    return rows.map((row) => row.bookId);
  }

  async isOwnBook(shelfId: number, bookId: number): Promise<boolean> {
    const [row] = await this.db
      .select({ id: dashboardShelfBooks.id })
      .from(dashboardShelfBooks)
      .where(and(eq(dashboardShelfBooks.shelfId, shelfId), eq(dashboardShelfBooks.bookId, bookId), eq(dashboardShelfBooks.hidden, false)))
      .limit(1);
    return Boolean(row);
  }

  /** The shelf's own books, not counting hidden collection books. */
  async countBooks(shelfId: number): Promise<number> {
    const [row] = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(dashboardShelfBooks)
      .where(and(eq(dashboardShelfBooks.shelfId, shelfId), eq(dashboardShelfBooks.hidden, false)));
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

  /** Brings hidden collection books back onto the shelf; returns how many were hidden. */
  async unhideBooks(shelfId: number, bookIds: number[]): Promise<number> {
    if (bookIds.length === 0) return 0;
    const rows = await this.db
      .delete(dashboardShelfBooks)
      .where(and(eq(dashboardShelfBooks.shelfId, shelfId), eq(dashboardShelfBooks.hidden, true), inArray(dashboardShelfBooks.bookId, bookIds)))
      .returning({ id: dashboardShelfBooks.id });
    return rows.length;
  }

  /** Takes a linked collection's book off this shelf only. */
  async hideBook(shelfId: number, bookId: number, userId: number): Promise<void> {
    await this.db
      .insert(dashboardShelfBooks)
      .values({ shelfId, bookId, position: 0, hidden: true, addedByUserId: userId })
      .onConflictDoUpdate({ target: [dashboardShelfBooks.shelfId, dashboardShelfBooks.bookId], set: { hidden: true } });
  }

  async removeHiddenBooks(shelfId: number): Promise<void> {
    await this.db.delete(dashboardShelfBooks).where(and(eq(dashboardShelfBooks.shelfId, shelfId), eq(dashboardShelfBooks.hidden, true)));
  }

  async removeBook(shelfId: number, bookId: number): Promise<boolean> {
    const rows = await this.db
      .delete(dashboardShelfBooks)
      .where(and(eq(dashboardShelfBooks.shelfId, shelfId), eq(dashboardShelfBooks.bookId, bookId)))
      .returning({ id: dashboardShelfBooks.id });
    return rows.length > 0;
  }
}
