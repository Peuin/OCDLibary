CREATE TABLE "dashboard_featured_shelves" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection_id" integer NOT NULL,
	"title" text NOT NULL,
	"image_version" integer DEFAULT 0 NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dashboard_featured_shelves" ADD CONSTRAINT "dashboard_featured_shelves_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_featured_shelves" ADD CONSTRAINT "dashboard_featured_shelves_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dashboard_featured_shelves_order_idx" ON "dashboard_featured_shelves" USING btree ("display_order","id");--> statement-breakpoint
CREATE INDEX "dashboard_featured_shelves_collection_idx" ON "dashboard_featured_shelves" USING btree ("collection_id");