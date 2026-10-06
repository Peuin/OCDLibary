CREATE TABLE "dashboard_shelf_books" (
	"id" serial PRIMARY KEY NOT NULL,
	"shelf_type" varchar(40) NOT NULL,
	"book_id" integer NOT NULL,
	"position" integer NOT NULL,
	"added_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dashboard_shelf_books" ADD CONSTRAINT "dashboard_shelf_books_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_shelf_books" ADD CONSTRAINT "dashboard_shelf_books_added_by_user_id_users_id_fk" FOREIGN KEY ("added_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dashboard_shelf_books_shelf_book_uidx" ON "dashboard_shelf_books" USING btree ("shelf_type","book_id");--> statement-breakpoint
CREATE INDEX "dashboard_shelf_books_shelf_position_idx" ON "dashboard_shelf_books" USING btree ("shelf_type","position");--> statement-breakpoint
CREATE INDEX "dashboard_shelf_books_book_idx" ON "dashboard_shelf_books" USING btree ("book_id");