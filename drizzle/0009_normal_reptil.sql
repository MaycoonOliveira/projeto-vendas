ALTER TABLE "guest" ADD COLUMN "document_type" text;--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "document_number" text;--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "status" text DEFAULT 'NORMAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "guest" ADD CONSTRAINT "guest_status_valid" CHECK ("guest"."status" in ('NORMAL','VIP','BLACKLIST'));--> statement-breakpoint
ALTER TABLE "guest" ADD CONSTRAINT "guest_document_type_valid" CHECK ("guest"."document_type" is null or "guest"."document_type" in ('CPF','PASSPORT','OTHER'));