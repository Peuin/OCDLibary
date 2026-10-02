import { index, integer, pgTable, serial, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import type { DashboardAttachableShelfType } from '@bookorbit/types';

import { users } from './auth';
import { collections } from './collections';

/** Dashboard shelves an administrator pins for every user. Each one shows a single collection. */
export const dashboardFeaturedShelves = pgTable(
  'dashboard_featured_shelves',
  {
    id: serial('id').primaryKey(),
    collectionId: integer('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    /** The saint whose portrait and name lead the shelf, shown with a link to the collection. */
    saintName: text('saint_name'),
    /** A built-in shelf this entry decorates instead of adding a shelf of its own; null means a standalone shelf. */
    attachTo: varchar('attach_to', { length: 40 }).$type<DashboardAttachableShelfType>(),
    /** Bumped on every image upload or removal; 0 means the shelf has no image. */
    imageVersion: integer('image_version').notNull().default(0),
    displayOrder: integer('display_order').notNull().default(0),
    createdByUserId: integer('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('dashboard_featured_shelves_order_idx').on(t.displayOrder, t.id),
    index('dashboard_featured_shelves_collection_idx').on(t.collectionId),
    uniqueIndex('dashboard_featured_shelves_attach_to_uidx').on(t.attachTo),
  ],
);

export type DashboardFeaturedShelfRow = typeof dashboardFeaturedShelves.$inferSelect;
