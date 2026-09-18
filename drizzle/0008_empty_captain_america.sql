CREATE TABLE "accommodation_photo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accommodation_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accommodation_photo" ADD CONSTRAINT "accommodation_photo_accommodation_id_accommodation_id_fk" FOREIGN KEY ("accommodation_id") REFERENCES "public"."accommodation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accommodation_photo_acc_idx" ON "accommodation_photo" USING btree ("accommodation_id","sort_order");