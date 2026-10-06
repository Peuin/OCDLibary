ALTER TABLE "dashboard_featured_shelves" ADD COLUMN "title" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "dashboard_featured_shelves" ADD COLUMN "display_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "dashboard_featured_shelves" ADD COLUMN "rows" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "dashboard_shelf_books" ADD COLUMN "shelf_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "dashboard_shelf_books" ADD CONSTRAINT "dashboard_shelf_books_shelf_id_dashboard_featured_shelves_id_fk" FOREIGN KEY ("shelf_id") REFERENCES "public"."dashboard_featured_shelves"("id") ON DELETE cascade ON UPDATE no action;