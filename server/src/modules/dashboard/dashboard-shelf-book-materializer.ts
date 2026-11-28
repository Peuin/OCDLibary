import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DASHBOARD_SHELF_BOOKS_MAX } from '@bookorbit/types';
import { DB } from '../../db';
import * as schema from '../../db/schema';
import { collectionBooks, dashboardFeaturedShelves, dashboardShelfBooks } from '../../db/schema';

type Db = NodePgDatabase<typeof schema>;
export type DashboardShelfBookTx = Parameters<Parameters<Db['transaction']>[0]>[0];

@Injectable()
export class DashboardShelfBookMaterializer {
  constructor(@Inject(DB) private readonly db: Db) {}

  inTransaction<T>(callback: (tx: DashboardShelfBookTx) => Promise<T>): Promise<T> {
    return this.db.transaction(callback);
  }

  async materializeLinkedBooks(shelfId: number, tx: DashboardShelfBookTx, addedByUserId?: number): Promise<void> {
    const [shelf] = await tx
      .select({ collectionId: dashboardFeaturedShelves.collectionId })
      .from(dashboardFeaturedShelves)
      .where(eq(dashboardFeaturedShelves.id, shelfId))
      .for('update')
      .limit(1);
    if (!shelf || shelf.collectionId === null) return;

    const hiddenRows = await tx
      .select({ bookId: dashboardShelfBooks.bookId })
      .from(dashboardShelfBooks)
      .where(and(eq(dashboardShelfBooks.shelfId, shelfId), eq(dashboardShelfBooks.hidden, true)));
    const hidden = new Set(hiddenRows.map((row) => row.bookId));
    const [collectionRows, ownRows] = await Promise.all([
      tx
        .select({ bookId: collectionBooks.bookId })
        .from(collectionBooks)
        .where(eq(collectionBooks.collectionId, shelf.collectionId))
        .orderBy(asc(collectionBooks.position))
        .limit(DASHBOARD_SHELF_BOOKS_MAX + hidden.size),
      tx
        .select({ bookId: dashboardShelfBooks.bookId })
        .from(dashboardShelfBooks)
        .where(and(eq(dashboardShelfBooks.shelfId, shelfId), eq(dashboardShelfBooks.hidden, false)))
        .orderBy(asc(dashboardShelfBooks.position), asc(dashboardShelfBooks.id)),
    ]);

    const own = ownRows.map((row) => row.bookId);
    const snapshot = [...new Set([...collectionRows.map((row) => row.bookId).filter((id) => !hidden.has(id)), ...own])].slice(
      0,
      DASHBOARD_SHELF_BOOKS_MAX,
    );

    await tx.delete(dashboardShelfBooks).where(eq(dashboardShelfBooks.shelfId, shelfId));
    if (snapshot.length > 0) {
      await tx.insert(dashboardShelfBooks).values(
        snapshot.map((bookId, index) => ({
          shelfId,
          bookId,
          position: index + 1,
          hidden: false,
          addedByUserId: addedByUserId ?? null,
        })),
      );
    }
    await tx.update(dashboardFeaturedShelves).set({ collectionId: null }).where(eq(dashboardFeaturedShelves.id, shelfId));
  }

  async materializeCollectionShelves(collectionId: number, tx: DashboardShelfBookTx): Promise<void> {
    const shelves = await tx
      .select({ id: dashboardFeaturedShelves.id })
      .from(dashboardFeaturedShelves)
      .where(eq(dashboardFeaturedShelves.collectionId, collectionId))
      .orderBy(asc(dashboardFeaturedShelves.id));

    for (const shelf of shelves) {
      await this.materializeLinkedBooks(shelf.id, tx);
    }
  }
}
