import { DASHBOARD_SHELF_BOOKS_MAX } from '@bookorbit/types';
import { dashboardFeaturedShelves, dashboardShelfBooks } from '../../db/schema';
import { DashboardShelfBookMaterializer } from './dashboard-shelf-book-materializer';

function selectChain(result: unknown) {
  const chain: Record<string, unknown> = {};
  for (const method of ['from', 'where', 'orderBy', 'limit', 'for']) {
    chain[method] = vi.fn(() => chain);
  }
  chain.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(result).then(resolve, reject);
  return chain;
}

function makeMaterializer(results: unknown[]) {
  const tx = {
    select: vi.fn(() => selectChain(results.shift())),
    delete: vi.fn(() => selectChain(undefined)),
    insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })) })),
  };
  const db = { transaction: vi.fn((callback: (tx: unknown) => Promise<unknown>) => callback(tx)) };
  return { materializer: new DashboardShelfBookMaterializer(db as never), tx };
}

describe('DashboardShelfBookMaterializer', () => {
  it('snapshots visible collection books before shelf books, skips hidden and duplicates, and rewrites positions', async () => {
    const { materializer, tx } = makeMaterializer([
      [{ collectionId: 77 }],
      [{ bookId: 3 }],
      [{ bookId: 1 }, { bookId: 2 }, { bookId: 3 }, { bookId: 4 }],
      [{ bookId: 5 }, { bookId: 2 }, { bookId: 6 }],
    ]);

    await materializer.inTransaction((transaction) => materializer.materializeLinkedBooks(9, transaction, 42));

    expect(tx.select).toHaveBeenCalledTimes(4);
    const lockQuery = tx.select.mock.results[0].value as ReturnType<typeof selectChain>;
    expect(lockQuery.for as ReturnType<typeof vi.fn>).toHaveBeenCalledWith('update');
    expect(tx.delete).toHaveBeenCalledWith(dashboardShelfBooks);
    expect(tx.insert).toHaveBeenCalledWith(dashboardShelfBooks);
    const insertBuilder = tx.insert.mock.results[0].value as { values: ReturnType<typeof vi.fn> };
    expect(insertBuilder.values).toHaveBeenCalledWith([
      { shelfId: 9, bookId: 1, position: 1, hidden: false, addedByUserId: 42 },
      { shelfId: 9, bookId: 2, position: 2, hidden: false, addedByUserId: 42 },
      { shelfId: 9, bookId: 4, position: 3, hidden: false, addedByUserId: 42 },
      { shelfId: 9, bookId: 5, position: 4, hidden: false, addedByUserId: 42 },
      { shelfId: 9, bookId: 6, position: 5, hidden: false, addedByUserId: 42 },
    ]);
    expect(tx.update).toHaveBeenCalledWith(dashboardFeaturedShelves);
  });

  it('caps the materialized snapshot at the shelf limit in the displayed order', async () => {
    const collectionRows = Array.from({ length: DASHBOARD_SHELF_BOOKS_MAX + 5 }, (_, index) => ({ bookId: index + 1 }));
    const { materializer, tx } = makeMaterializer([[{ collectionId: 77 }], [], collectionRows, []]);

    await materializer.inTransaction((transaction) => materializer.materializeLinkedBooks(9, transaction));

    const insertBuilder = tx.insert.mock.results[0].value as { values: ReturnType<typeof vi.fn> };
    const inserted = insertBuilder.values.mock.calls[0][0] as Array<{ bookId: number; position: number }>;
    expect(inserted).toHaveLength(DASHBOARD_SHELF_BOOKS_MAX);
    expect(inserted[0]).toMatchObject({ bookId: 1, position: 1 });
    expect(inserted.at(-1)).toMatchObject({ bookId: DASHBOARD_SHELF_BOOKS_MAX, position: DASHBOARD_SHELF_BOOKS_MAX });
  });

  it('does not rewrite an already unlinked or missing shelf', async () => {
    const { materializer, tx } = makeMaterializer([[{ collectionId: null }]]);

    await materializer.inTransaction((transaction) => materializer.materializeLinkedBooks(9, transaction));

    expect(tx.delete).not.toHaveBeenCalled();
    expect(tx.insert).not.toHaveBeenCalled();
    expect(tx.update).not.toHaveBeenCalled();
  });

  it('materializes every shelf linked to a collection before deletion', async () => {
    const { materializer, tx } = makeMaterializer([[{ id: 5 }, { id: 7 }], [{ collectionId: 77 }], [], [], [], [{ collectionId: 77 }], [], [], []]);

    await materializer.inTransaction((transaction) => materializer.materializeCollectionShelves(77, transaction));

    expect(tx.select).toHaveBeenCalledTimes(9);
    expect(tx.delete).toHaveBeenCalledTimes(2);
    expect(tx.update).toHaveBeenCalledTimes(2);
  });
});
