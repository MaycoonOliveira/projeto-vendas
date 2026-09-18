CREATE TABLE "guest_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"direction" text DEFAULT 'OUT' NOT NULL,
	"body" text NOT NULL,
	"created_by_admin_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guest_message_channel_valid" CHECK ("guest_message"."channel" in ('WHATSAPP','EMAIL','PHONE','NOTE')),
	CONSTRAINT "guest_message_direction_valid" CHECK ("guest_message"."direction" in ('OUT','IN'))
);
--> statement-breakpoint
ALTER TABLE "guest_message" ADD CONSTRAINT "guest_message_guest_id_guest_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_message" ADD CONSTRAINT "guest_message_created_by_admin_id_user_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guest_message_guest_idx" ON "guest_message" USING btree ("guest_id","created_at");