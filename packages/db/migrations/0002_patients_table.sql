-- Patients table + unique patient number (PAT-000001, …)
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS patient_number_seq;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "patient_number" text;--> statement-breakpoint
UPDATE "patients" SET "patient_number" = 'PAT-' || lpad(nextval('patient_number_seq')::text, 6, '0') WHERE "patient_number" IS NULL;--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "patient_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_patient_number_unique" UNIQUE("patient_number");
