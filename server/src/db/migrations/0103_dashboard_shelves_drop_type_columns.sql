DROP INDEX "dashboard_featured_shelves_attach_to_uidx";--> statement-breakpoint
DROP INDEX "dashboard_shelf_books_shelf_book_uidx";--> statement-breakpoint
DROP INDEX "dashboard_shelf_books_shelf_position_idx";--> statement-breakpoint
CREATE INDEX "dashboard_featured_shelves_order_idx" ON "dashboard_featured_shelves" USING btree ("display_order","id");--> statement-breakpoint
CREATE UNIQUE INDEX "dashboard_shelf_books_shelf_book_uidx" ON "dashboard_shelf_books" USING btree ("shelf_id","book_id");--> statement-breakpoint
CREATE INDEX "dashboard_shelf_books_shelf_position_idx" ON "dashboard_shelf_books" USING btree ("shelf_id","position");--> statement-breakpoint
ALTER TABLE "dashboard_featured_shelves" DROP COLUMN "attach_to";--> statement-breakpoint
ALTER TABLE "dashboard_shelf_books" DROP COLUMN "shelf_type";