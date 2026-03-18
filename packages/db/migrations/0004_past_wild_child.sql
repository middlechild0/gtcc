CREATE TYPE "public"."blood_group_enum" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."gender_enum" AS ENUM('MALE', 'FEMALE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."marital_status_enum" AS ENUM('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'OTHER');--> statement-breakpoint
CREATE TABLE "insurance_providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_providers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "patient_branch_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" uuid NOT NULL,
	"branch_id" integer NOT NULL,
	"is_registration_branch" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patient_branch_profiles_patient_id_branch_id_unique" UNIQUE("patient_id","branch_id")
);
--> statement-breakpoint
CREATE TABLE "patient_guarantors" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"relationship" text,
	"phone" text,
	"email" text,
	"national_id" text,
	"employer" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_insurances" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" uuid NOT NULL,
	"provider_id" integer NOT NULL,
	"member_number" text NOT NULL,
	"principal_name" text,
	"principal_relationship" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_kins" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"relationship" text,
	"phone" text,
	"email" text,
	"national_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_number" text NOT NULL,
	"salutation" text,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"date_of_birth" date,
	"gender" "gender_enum",
	"marital_status" "marital_status_enum",
	"blood_group" "blood_group_enum",
	"email" text,
	"phone" text,
	"country" text DEFAULT 'Kenya' NOT NULL,
	"address" text,
	"passport_number" text,
	"national_id" text,
	"nhif_number" text,
	"merged_into_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patients_patient_number_unique" UNIQUE("patient_number"),
	CONSTRAINT "patients_national_id_unique" UNIQUE("national_id")
);
--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_branch_profiles" ADD CONSTRAINT "patient_branch_profiles_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_branch_profiles" ADD CONSTRAINT "patient_branch_profiles_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_guarantors" ADD CONSTRAINT "patient_guarantors_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_insurances" ADD CONSTRAINT "patient_insurances_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_insurances" ADD CONSTRAINT "patient_insurances_provider_id_insurance_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."insurance_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_kins" ADD CONSTRAINT "patient_kins_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_code_unique" UNIQUE("code");