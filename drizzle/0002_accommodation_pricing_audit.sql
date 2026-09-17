CREATE TABLE "accommodation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"capacity" integer NOT NULL,
	"base_price_cents" integer NOT NULL,
	"min_nights" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accommodation_slug_unique" UNIQUE("slug"),
	CONSTRAINT "accommodation_capacity_positive" CHECK ("accommodation"."capacity" > 0),
	CONSTRAINT "accommodation_base_price_nonneg" CHECK ("accommodation"."base_price_cents" >= 0),
	CONSTRAINT "accommodation_min_nights_min" CHECK ("accommodation"."min_nights" >= 1)
);
--> statement-breakpoint
CREATE TABLE "rate_override" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accommodation_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"price_cents" integer NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_override_dates_order" CHECK ("rate_override"."start_date" <= "rate_override"."end_date"),
	CONSTRAINT "rate_override_price_nonneg" CHECK ("rate_override"."price_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"metadata" jsonb,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_log_actor_type" CHECK ("audit_log"."actor_type" in ('USER','SYSTEM','GUEST'))
);
--> statement-breakpoint
ALTER TABLE "rate_override" ADD CONSTRAINT "rate_override_accommodation_id_accommodation_id_fk" FOREIGN KEY ("accommodation_id") REFERENCES "public"."accommodation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accommodation_is_active_idx" ON "accommodation" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "rate_override_acc_dates_idx" ON "rate_override" USING btree ("accommodation_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
-- Nao-sobreposicao de rate_override por acomodacao (Drizzle nao modela coluna gerada de
-- daterange nem EXCLUDE). `during` = daterange fechado [start,end] (a tarifa vale para as
-- noites de start a end). Requer btree_gist (habilitado na migration 0000).
ALTER TABLE "rate_override" ADD COLUMN "during" daterange GENERATED ALWAYS AS (daterange("start_date", "end_date", '[]')) STORED;--> statement-breakpoint
ALTER TABLE "rate_override" ADD CONSTRAINT "rate_override_no_overlap" EXCLUDE USING gist ("accommodation_id" WITH =, "during" WITH &&);