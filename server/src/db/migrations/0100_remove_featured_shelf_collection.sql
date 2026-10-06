ALTER TABLE "dashboard_featured_shelves" DROP CONSTRAINT "dashboard_featured_shelves_collection_id_collections_id_fk";
--> statement-breakpoint
DROP INDEX "dashboard_featured_shelves_order_idx";--> statement-breakpoint
DROP INDEX "dashboard_featured_shelves_collection_idx";--> statement-breakpoint
ALTER TABLE "dashboard_featured_shelves" DROP COLUMN "collection_id";--> statement-breakpoint
ALTER TABLE "dashboard_featured_shelves" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "dashboard_featured_shelves" DROP COLUMN "display_order";