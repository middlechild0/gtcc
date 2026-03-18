CREATE TYPE "public"."billable_item_type" AS ENUM('SERVICE', 'PRODUCT');--> statement-breakpoint
CREATE TYPE "public"."override_reason" AS ENUM('INSURANCE_NEGOTIATED_RATE', 'CORPORATE_AGREEMENT', 'DOCTOR_DISCRETION', 'CORRECTION', 'MANAGEMENT_APPROVAL', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."payer_type" AS ENUM('CASH', 'INSURANCE', 'CORPORATE');--> statement-breakpoint
CREATE TYPE "public"."price_book_type" AS ENUM('CASH', 'INSURANCE', 'CORPORATE');--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('FRAME', 'LENS', 'CONTACT_LENS', 'ACCESSORY', 'MEDICATION', 'CONSUMABLE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."service_category" AS ENUM('CONSULTATION', 'DIAGNOSTIC', 'OPTICAL', 'PROCEDURE', 'OTHER');--> statement-breakpoint
CREATE TABLE "billable_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "billable_item_type" NOT NULL,
	"service_id" integer,
	"product_id" integer,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "valid_billable_item" CHECK (num_nonnulls("billable_items"."service_id", "billable_items"."product_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "invoice_line_item_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"line_item_id" integer NOT NULL,
	"original_price" integer NOT NULL,
	"new_price" integer NOT NULL,
	"reason" "override_reason" NOT NULL,
	"note" text,
	"changed_by_id" uuid NOT NULL,
	"approved_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_book_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"price_book_id" integer NOT NULL,
	"billable_item_id" integer NOT NULL,
	"price" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "price_book_entries_price_book_id_billable_item_id_unique" UNIQUE("price_book_id","billable_item_id")
);
--> statement-breakpoint
CREATE TABLE "price_books" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "price_book_type" NOT NULL,
	"branch_id" integer,
	"insurance_provider_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_from" date,
	"effective_to" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sku" text,
	"category" "product_category" NOT NULL,
	"description" text,
	"stock_level" integer DEFAULT 0 NOT NULL,
	"reorder_point" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"vat_exempt" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" "service_category" NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"vat_exempt" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"rate" integer NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tax_rates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "invoice_line_items" RENAME COLUMN "amount" TO "unit_price";--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD COLUMN "billable_item_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD COLUMN "quantity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD COLUMN "subtotal" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD COLUMN "vat_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD COLUMN "total" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD COLUMN "is_overridden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "visit_types" ADD COLUMN "default_service_id" integer;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "payer_type" "payer_type" DEFAULT 'CASH' NOT NULL;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "price_book_id" integer;--> statement-breakpoint
ALTER TABLE "billable_items" ADD CONSTRAINT "billable_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billable_items" ADD CONSTRAINT "billable_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_item_overrides" ADD CONSTRAINT "invoice_line_item_overrides_line_item_id_invoice_line_items_id_fk" FOREIGN KEY ("line_item_id") REFERENCES "public"."invoice_line_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_item_overrides" ADD CONSTRAINT "invoice_line_item_overrides_changed_by_id_user_profiles_user_id_fk" FOREIGN KEY ("changed_by_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_item_overrides" ADD CONSTRAINT "invoice_line_item_overrides_approved_by_id_user_profiles_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_book_entries" ADD CONSTRAINT "price_book_entries_price_book_id_price_books_id_fk" FOREIGN KEY ("price_book_id") REFERENCES "public"."price_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_book_entries" ADD CONSTRAINT "price_book_entries_billable_item_id_billable_items_id_fk" FOREIGN KEY ("billable_item_id") REFERENCES "public"."billable_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_books" ADD CONSTRAINT "price_books_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_books" ADD CONSTRAINT "price_books_insurance_provider_id_insurance_providers_id_fk" FOREIGN KEY ("insurance_provider_id") REFERENCES "public"."insurance_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_billable_item_id_billable_items_id_fk" FOREIGN KEY ("billable_item_id") REFERENCES "public"."billable_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_types" ADD CONSTRAINT "visit_types_default_service_id_services_id_fk" FOREIGN KEY ("default_service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_price_book_id_price_books_id_fk" FOREIGN KEY ("price_book_id") REFERENCES "public"."price_books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_types" DROP COLUMN "base_fee";