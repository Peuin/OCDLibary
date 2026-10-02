import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DB } from '../../db';
import * as schema from '../../db/schema';
import { dashboardFeaturedShelves } from '../../db/schema';

type Db = NodePgDatabase<typeof schema>;

@Injectable()
export class DashboardFeaturedShelfRepository {
  constructor(@Inject(DB) private readonly db: Db) {}

  findAll() {
    return this.db.select().from(dashboardFeaturedShelves).orderBy(asc(dashboardFeaturedShelves.displayOrder), asc(dashboardFeaturedShelves.id));
  }

  async findById(id: number) {
    const [row] = await this.db.select().from(dashboardFeaturedShelves).where(eq(dashboardFeaturedShelves.id, id)).limit(1);
    return row ?? null;
  }

  async count(): Promise<number> {
    const [row] = await this.db.select({ total: sql<number>`count(*)::int` }).from(dashboardFeaturedShelves);
    return row?.total ?? 0;
  }

  async insert(values: typeof dashboardFeaturedShelves.$inferInsert) {
    const [row] = await this.db.insert(dashboardFeaturedShelves).values(values).returning();
    return row;
  }

  async update(id: number, values: Partial<typeof dashboardFeaturedShelves.$inferInsert>) {
    const [row] = await this.db.update(dashboardFeaturedShelves).set(values).where(eq(dashboardFeaturedShelves.id, id)).returning();
    return row ?? null;
  }

  async bumpImageVersion(id: number, hasImage: boolean) {
    const [row] = await this.db
      .update(dashboardFeaturedShelves)
      .set({
        imageVersion: hasImage ? sql`greatest(${dashboardFeaturedShelves.imageVersion}, 0) + 1` : sql`0`,
      })
      .where(eq(dashboardFeaturedShelves.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: number): Promise<boolean> {
    const rows = await this.db
      .delete(dashboardFeaturedShelves)
      .where(eq(dashboardFeaturedShelves.id, id))
      .returning({ id: dashboardFeaturedShelves.id });
    return rows.length > 0;
  }

  async updateDisplayOrders(ids: number[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      for (const [index, id] of ids.entries()) {
        await tx
          .update(dashboardFeaturedShelves)
          .set({ displayOrder: index + 1 })
          .where(eq(dashboardFeaturedShelves.id, id));
      }
    });
  }
}
