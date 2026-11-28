ALTER TABLE "bookmarks" ADD COLUMN "book_file_id" integer;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "page_number" integer;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_book_file_id_book_files_id_fk" FOREIGN KEY ("book_file_id") REFERENCES "public"."book_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookmarks_user_file_page_uidx" ON "bookmarks" USING btree ("user_id","book_file_id","page_number") WHERE "bookmarks"."page_number" is not null;--> statement-breakpoint
CREATE INDEX "bookmarks_book_file_id_idx" ON "bookmarks" USING btree ("book_file_id") WHERE "bookmarks"."book_file_id" is not null;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_pdf_location_chk" CHECK ("bookmarks"."page_number" is null or ("bookmarks"."page_number" >= 1 and "bookmarks"."book_file_id" is not null and "bookmarks"."cfi" is null and "bookmarks"."position_seconds" is null));