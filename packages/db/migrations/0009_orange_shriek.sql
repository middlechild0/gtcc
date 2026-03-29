CREATE TYPE "public"."insurance_billing_basis" AS ENUM('CAPITATION', 'FEE_FOR_SERVICE');--> statement-breakpoint
CREATE TABLE "insurance_provider_schemes" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"name" text NOT NULL,
	"billing_basis" "insurance_billing_basis" DEFAULT 'FEE_FOR_SERVICE' NOT NULL,
	"requires_pre_auth" boolean DEFAULT false NOT NULL,
	"copay_amount" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_provider_schemes_provider_id_name_unique" UNIQUE("provider_id","name")
);
--> statement-breakpoint
ALTER TABLE "insurance_providers" ADD COLUMN "provider_code" text;--> statement-breakpoint
ALTER TABLE "insurance_providers" ADD COLUMN "billing_basis" "insurance_billing_basis" DEFAULT 'FEE_FOR_SERVICE' NOT NULL;--> statement-breakpoint
ALTER TABLE "insurance_providers" ADD COLUMN "requires_pre_auth" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "insurance_providers" ADD COLUMN "copay_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "insurance_providers" ADD COLUMN "sha_accreditation_number" text;--> statement-breakpoint
ALTER TABLE "patient_insurances" ADD COLUMN "scheme_id" integer;--> statement-breakpoint
ALTER TABLE "patient_insurances" ADD COLUMN "pre_auth_number" text;--> statement-breakpoint
ALTER TABLE "price_books" ADD COLUMN "insurance_provider_scheme_id" integer;--> statement-breakpoint
ALTER TABLE "insurance_provider_schemes" ADD CONSTRAINT "insurance_provider_schemes_provider_id_insurance_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."insurance_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_insurances" ADD CONSTRAINT "patient_insurances_scheme_id_insurance_provider_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."insurance_provider_schemes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_books" ADD CONSTRAINT "price_books_insurance_provider_scheme_id_insurance_provider_schemes_id_fk" FOREIGN KEY ("insurance_provider_scheme_id") REFERENCES "public"."insurance_provider_schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_providers" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "insurance_providers" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "insurance_providers" DROP COLUMN "address";--> statement-breakpoint
ALTER TABLE "patient_insurances" DROP COLUMN "principal_name";--> statement-breakpoint
ALTER TABLE "patient_insurances" DROP COLUMN "principal_relationship";--> statement-breakpoint
ALTER TABLE "insurance_providers" ADD CONSTRAINT "insurance_providers_provider_code_unique" UNIQUE("provider_code");--> statement-breakpoint
ALTER TABLE "insurance_providers" ADD CONSTRAINT "insurance_providers_sha_accreditation_number_unique" UNIQUE("sha_accreditation_number");