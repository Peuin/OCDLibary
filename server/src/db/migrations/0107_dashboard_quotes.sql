CREATE TABLE "dashboard_quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"source" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "dashboard_quotes_enabled_id_idx" ON "dashboard_quotes" USING btree ("enabled","id");