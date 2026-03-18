CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'ISSUED', 'PAID', 'VOIDED');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING_LAB', 'IN_LAB', 'READY_FOR_COLLECTION', 'DISPATCHED');--> statement-breakpoint
CREATE TYPE "public"."payment_mode" AS ENUM('CASH', 'MPESA', 'INSURANCE', 'CARD');--> statement-breakpoint
CREATE TYPE "public"."visit_priority" AS ENUM('NORMAL', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."visit_status" AS ENUM('WAITING', 'IN_PROGRESS', 'DONE', 'ON_HOLD');--> statement-breakpoint
CREATE SEQUENCE "public"."patient_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"assigned_doctor_id" uuid,
	"chief_complaint" text,
	"clinical_notes" text,
	"diagnosis" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "consultations_visit_id_unique" UNIQUE("visit_id")
);
--> statement-breakpoint
CREATE TABLE "contact_lens_fittings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"base_curve" text,
	"diameter" text,
	"brand" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "departments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "dispensing_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"assigned_optician_id" uuid,
	"lens_type" text,
	"frame_model" text,
	"is_external_rx" boolean DEFAULT false NOT NULL,
	"status" "order_status" DEFAULT 'PENDING_LAB' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dispensing_orders_visit_id_unique" UNIQUE("visit_id")
);
--> statement-breakpoint
CREATE TABLE "invoice_line_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" text NOT NULL,
	"amount" integer NOT NULL,
	"department_source" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"amount_paid" integer DEFAULT 0 NOT NULL,
	"status" "invoice_status" DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "optical_prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"od_sphere" text,
	"od_cylinder" text,
	"od_axis" text,
	"os_sphere" text,
	"os_cylinder" text,
	"os_axis" text,
	"pupillary_distance" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"payment_mode" "payment_mode" NOT NULL,
	"receipt_number" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pre_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"performed_by_id" uuid,
	"auto_refraction_data" jsonb,
	"intra_ocular_pressure" jsonb,
	"visual_acuity" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pre_tests_visit_id_unique" UNIQUE("visit_id")
);
--> statement-breakpoint
CREATE TABLE "repairs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"issue_description" text,
	"parts_replaced" text,
	"cost_estimate" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "repairs_visit_id_unique" UNIQUE("visit_id")
);
--> statement-breakpoint
CREATE TABLE "visit_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"workflow_steps" jsonb NOT NULL,
	"base_fee" integer,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"branch_id" integer NOT NULL,
	"visit_type_id" integer NOT NULL,
	"ticket_number" text NOT NULL,
	"priority" "visit_priority" DEFAULT 'NORMAL' NOT NULL,
	"current_department_id" integer NOT NULL,
	"status" "visit_status" DEFAULT 'WAITING' NOT NULL,
	"registered_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_assigned_doctor_id_user_profiles_user_id_fk" FOREIGN KEY ("assigned_doctor_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_fittings" ADD CONSTRAINT "contact_lens_fittings_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispensing_orders" ADD CONSTRAINT "dispensing_orders_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispensing_orders" ADD CONSTRAINT "dispensing_orders_assigned_optician_id_user_profiles_user_id_fk" FOREIGN KEY ("assigned_optician_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optical_prescriptions" ADD CONSTRAINT "optical_prescriptions_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_tests" ADD CONSTRAINT "pre_tests_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_tests" ADD CONSTRAINT "pre_tests_performed_by_id_user_profiles_user_id_fk" FOREIGN KEY ("performed_by_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_visit_type_id_visit_types_id_fk" FOREIGN KEY ("visit_type_id") REFERENCES "public"."visit_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_current_department_id_departments_id_fk" FOREIGN KEY ("current_department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_passport_number_unique" UNIQUE("passport_number");--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_nhif_number_unique" UNIQUE("nhif_number");