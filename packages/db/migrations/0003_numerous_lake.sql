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
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"relationship" text,
	"phone" text,
	"email" text,
	"national_id" text,
	"employer" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patient_guarantors_patient_id_unique" UNIQUE("patient_id")
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_kins" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"relationship" text,
	"phone" text,
	"email" text,
	"national_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patient_kins_patient_id_unique" UNIQUE("patient_id")
);
--> statement-breakpoint
ALTER TABLE "patients" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "salutation" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "middle_name" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "date_of_birth" timestamp;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "marital_status" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "blood_group" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "country" text DEFAULT 'Kenya' NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "passport_number" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "national_id" text;
--> statement-breakpoint
ALTER TABLE "patient_branch_profiles" ADD CONSTRAINT "patient_branch_profiles_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_branch_profiles" ADD CONSTRAINT "patient_branch_profiles_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_guarantors" ADD CONSTRAINT "patient_guarantors_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_insurances" ADD CONSTRAINT "patient_insurances_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_insurances" ADD CONSTRAINT "patient_insurances_provider_id_insurance_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "insurance_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_kins" ADD CONSTRAINT "patient_kins_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE cascade ON UPDATE no action;