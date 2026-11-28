import { boolean, index, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

/** Quotes an administrator curates; the dashboard header shows a random enabled one on each visit. */
export const dashboardQuotes = pgTable(
  'dashboard_quotes',
  {
    id: serial('id').primaryKey(),
    text: text('text').notNull(),
    source: text('source').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (t) => [index('dashboard_quotes_enabled_id_idx').on(t.enabled, t.id)],
);

export type DashboardQuoteRow = typeof dashboardQuotes.$inferSelect;
