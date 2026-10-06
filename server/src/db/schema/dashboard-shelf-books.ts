import { boolean, index, integer, pgTable, serial, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

import { users } from './auth';
import { books } from './books';
import { dashboardFeaturedShelves } from './dashboard-featured-shelves';

/**
 * Books on a dashboard shelf beyond any linked collection's, plus the collection books hidden from it.
 * Only an administrator adding or removing one changes this list.
 */
export const dashboardShelfBooks = pgTable(
  'dashboard_shelf_books',
  {
    id: serial('id').primaryKey(),
    shelfId: integer('shelf_id')
      .notNull()
      .references(() => dashboardFeaturedShelves.id, { onDelete: 'cascade' }),
    bookId: integer('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    /**
     * On a shelf linked to a collection: a collection book taken off this shelf only. The shelf
     * keeps following the collection otherwise, and the collection keeps the book.
     */
    hidden: boolean('hidden').notNull().default(false),
    addedByUserId: integer('added_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('dashboard_shelf_books_shelf_book_uidx').on(t.shelfId, t.bookId),
    index('dashboard_shelf_books_shelf_position_idx').on(t.shelfId, t.position),
    index('dashboard_shelf_books_book_idx').on(t.bookId),
  ],
);

export type DashboardShelfBookRow = typeof dashboardShelfBooks.$inferSelect;
