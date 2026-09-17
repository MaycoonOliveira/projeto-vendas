CREATE TABLE "guest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_code" text NOT NULL,
	"accommodation_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"guests_count" integer NOT NULL,
	"nights" integer NOT NULL,
	"total_price_cents" integer NOT NULL,
	"currency" text DEFAULT 'BRL' NOT NULL,
	"price_breakdown" jsonb,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"source" text DEFAULT 'WEBSITE' NOT NULL,
	"hold_expires_at" timestamp with time zone,
	"notes" text,
	"created_by_admin_id" text,
	"cancelled_reason" text,
	"idempotency_key" text,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservation_public_code_unique" UNIQUE("public_code"),
	CONSTRAINT "reservation_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "reservation_dates_order" CHECK ("reservation"."check_out" > "reservation"."check_in"),
	CONSTRAINT "reservation_guests_positive" CHECK ("reservation"."guests_count" > 0),
	CONSTRAINT "reservation_total_nonneg" CHECK ("reservation"."total_price_cents" >= 0),
	CONSTRAINT "reservation_status_valid" CHECK ("reservation"."status" in ('PENDING','CONFIRMED','CANCELLED','EXPIRED','COMPLETED','NO_SHOW')),
	CONSTRAINT "reservation_source_valid" CHECK ("reservation"."source" in ('WEBSITE','MANUAL'))
);
--> statement-breakpoint
CREATE TABLE "reservation_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"changed_by_admin_id" text,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_accommodation_id_accommodation_id_fk" FOREIGN KEY ("accommodation_id") REFERENCES "public"."accommodation"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_guest_id_guest_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guest"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_created_by_admin_id_user_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_status_history" ADD CONSTRAINT "reservation_status_history_reservation_id_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_status_history" ADD CONSTRAINT "reservation_status_history_changed_by_admin_id_user_id_fk" FOREIGN KEY ("changed_by_admin_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reservation_acc_dates_idx" ON "reservation" USING btree ("accommodation_id","check_in","check_out");--> statement-breakpoint
CREATE INDEX "reservation_status_idx" ON "reservation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reservation_guest_idx" ON "reservation" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "reservation_history_res_idx" ON "reservation_status_history" USING btree ("reservation_id");--> statement-breakpoint
ALTER TABLE "occupancy" ADD CONSTRAINT "occupancy_reservation_id_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Indice funcional para reuso de hospede por e-mail case-insensitive (Drizzle nao modela
-- indice de expressao). O ReservationService filtra por lower(email).
CREATE INDEX "guest_email_lower_idx" ON "guest" USING btree (lower("email"));