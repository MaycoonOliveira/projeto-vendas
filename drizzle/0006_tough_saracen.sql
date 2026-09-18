CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"paid_on" date NOT NULL,
	"method" text NOT NULL,
	"note" text,
	"recorded_by_admin_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_amount_positive" CHECK ("payment"."amount_cents" > 0),
	CONSTRAINT "payment_method_valid" CHECK ("payment"."method" in ('PIX','CASH','CARD','TRANSFER','OTHER'))
);
--> statement-breakpoint
ALTER TABLE "reservation" DROP CONSTRAINT "reservation_status_valid";--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "internal_note" text;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_reservation_id_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_recorded_by_admin_id_user_id_fk" FOREIGN KEY ("recorded_by_admin_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_reservation_idx" ON "payment" USING btree ("reservation_id");--> statement-breakpoint
CREATE INDEX "payment_paid_on_idx" ON "payment" USING btree ("paid_on");--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_status_valid" CHECK ("reservation"."status" in ('PENDING','CONFIRMED','CHECKED_IN','CHECKED_OUT','CANCELLED','EXPIRED','COMPLETED','NO_SHOW'));