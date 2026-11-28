import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, ilike, inArray, ne, or, sql, type SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DB } from '../../db';
import * as schema from '../../db/schema';
import { dashboardQuotes } from '../../db/schema';

type Db = NodePgDatabase<typeof schema>;

const INSERT_CHUNK_SIZE = 500;

const displayColumns = { id: dashboardQuotes.id, text: dashboardQuotes.text, source: dashboardQuotes.source };

@Injectable()
export class DashboardQuoteRepository {
  constructor(@Inject(DB) private readonly db: Db) {}

  async findPage(offset: number, limit: number, search: string | undefined) {
    const where = search ? this.searchFilter(search) : undefined;
    const [items, [count]] = await Promise.all([
      this.db.select().from(dashboardQuotes).where(where).orderBy(desc(dashboardQuotes.id)).limit(limit).offset(offset),
      this.db
        .select({ total: sql<number>`count(*)::int` })
        .from(dashboardQuotes)
        .where(where),
    ]);
    return { items, total: count?.total ?? 0 };
  }

  /** Picks one enabled quote by a random offset over the (enabled, id) index, skipping `excludeId`. */
  async findRandomEnabled(excludeId: number | null, random: () => number = Math.random) {
    const where = excludeId === null ? eq(dashboardQuotes.enabled, true) : and(eq(dashboardQuotes.enabled, true), ne(dashboardQuotes.id, excludeId));
    const [count] = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(dashboardQuotes)
      .where(where);
    const total = count?.total ?? 0;
    if (total === 0) return null;
    const offset = Math.min(Math.floor(random() * total), total - 1);
    const [row] = await this.db.select(displayColumns).from(dashboardQuotes).where(where).orderBy(asc(dashboardQuotes.id)).limit(1).offset(offset);
    return row ?? null;
  }

  async findDuplicate(text: string, source: string, excludeId?: number) {
    const conditions = [eq(dashboardQuotes.text, text), eq(dashboardQuotes.source, source)];
    if (excludeId !== undefined) conditions.push(ne(dashboardQuotes.id, excludeId));
    const [row] = await this.db
      .select({ id: dashboardQuotes.id })
      .from(dashboardQuotes)
      .where(and(...conditions))
      .limit(1);
    return row ?? null;
  }

  async findExistingKeys(texts: string[]): Promise<Set<string>> {
    const keys = new Set<string>();
    for (let i = 0; i < texts.length; i += INSERT_CHUNK_SIZE) {
      const rows = await this.db
        .select({ text: dashboardQuotes.text, source: dashboardQuotes.source })
        .from(dashboardQuotes)
        .where(inArray(dashboardQuotes.text, texts.slice(i, i + INSERT_CHUNK_SIZE)));
      for (const row of rows) keys.add(quoteKey(row.text, row.source));
    }
    return keys;
  }

  async findById(id: number) {
    const [row] = await this.db.select().from(dashboardQuotes).where(eq(dashboardQuotes.id, id)).limit(1);
    return row ?? null;
  }

  async insert(values: typeof dashboardQuotes.$inferInsert) {
    const [row] = await this.db.insert(dashboardQuotes).values(values).returning();
    return row!;
  }

  async insertMany(values: (typeof dashboardQuotes.$inferInsert)[]): Promise<number> {
    if (values.length === 0) return 0;
    await this.db.transaction(async (tx) => {
      for (let i = 0; i < values.length; i += INSERT_CHUNK_SIZE) {
        await tx.insert(dashboardQuotes).values(values.slice(i, i + INSERT_CHUNK_SIZE));
      }
    });
    return values.length;
  }

  async update(id: number, values: Partial<typeof dashboardQuotes.$inferInsert>) {
    const [row] = await this.db.update(dashboardQuotes).set(values).where(eq(dashboardQuotes.id, id)).returning();
    return row ?? null;
  }

  async delete(id: number): Promise<boolean> {
    const rows = await this.db.delete(dashboardQuotes).where(eq(dashboardQuotes.id, id)).returning({ id: dashboardQuotes.id });
    return rows.length > 0;
  }

  private searchFilter(search: string): SQL | undefined {
    const pattern = `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
    return or(ilike(dashboardQuotes.text, pattern), ilike(dashboardQuotes.source, pattern));
  }
}

export function quoteKey(text: string, source: string): string {
  return `${text}\u0000${source}`;
}
