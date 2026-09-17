CREATE TABLE "occupancy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accommodation_id" uuid NOT NULL,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"source_type" text NOT NULL,
	"reservation_id" uuid,
	"block_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "occupancy_dates_order" CHECK ("occupancy"."check_out" > "occupancy"."check_in"),
	CONSTRAINT "occupancy_source_type" CHECK ("occupancy"."source_type" in ('RESERVATION','BLOCK')),
	CONSTRAINT "occupancy_source_consistent" CHECK (("occupancy"."source_type" = 'RESERVATION' AND "occupancy"."reservation_id" IS NOT NULL AND "occupancy"."block_id" IS NULL)
        OR ("occupancy"."source_type" = 'BLOCK' AND "occupancy"."block_id" IS NOT NULL AND "occupancy"."reservation_id" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "occupancy" ADD CONSTRAINT "occupancy_accommodation_id_accommodation_id_fk" FOREIGN KEY ("accommodation_id") REFERENCES "public"."accommodation"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "occupancy_acc_active_idx" ON "occupancy" USING btree ("accommodation_id","active");--> statement-breakpoint
-- Coluna GERADA `during` = daterange SEMIABERTO [check_in, check_out) (o dia de check-out
-- fica livre para um novo check-in). Drizzle nao modela coluna gerada de daterange.
ALTER TABLE "occupancy" ADD COLUMN "during" daterange GENERATED ALWAYS AS (daterange("check_in", "check_out", '[)')) STORED;--> statement-breakpoint
-- Garantia anti-overbooking: EXCLUDE parcial (so `active`). Ocupacoes inativas (canceladas/
-- expiradas) nao bloqueiam. Requer btree_gist (migration 0000). Datas adjacentes ([10,12) e
-- [12,14)) NAO se sobrepoem; qualquer overlap real e rejeitado (SQLSTATE 23P01).
ALTER TABLE "occupancy" ADD CONSTRAINT "occupancy_no_overlap" EXCLUDE USING gist ("accommodation_id" WITH =, "during" WITH &&) WHERE ("active");