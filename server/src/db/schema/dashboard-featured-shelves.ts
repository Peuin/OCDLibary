import { index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

import { users } from './auth';

/**
 * Dashboard shelves an administrator builds for every user: a free-form title, an optional saint
 * card at the head, and books added by hand (see `dashboardShelfBooks`).
 */
export const dashboardFeaturedShelves = pgTable(
  'dashboard_featured_shelves',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull().default(''),
    /** The saint whose portrait and name lead the shelf. */
    saintName: text('saint_name'),
    /** Bumped on every image upload or removal; 0 means the shelf has no portrait. */
    imageVersion: integer('image_version').notNull().default(0),
    displayOrder: integer('display_order').notNull().default(0),
    /** How many rows the shelf's books take in its "view all" layout. */
    rows: integer('rows').notNull().default(1),
    createdByUserId: integer('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (t) => [index('dashboard_featured_shelves_order_idx').on(t.displayOrder, t.id)],
);

export type DashboardFeaturedShelfRow = typeof dashboardFeaturedShelves.$inferSelect;
