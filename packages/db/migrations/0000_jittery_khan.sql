CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"agency_name" text,
	"license_number" text,
	"bio" text,
	"verified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "house_hunters" (
	"id" uuid PRIMARY KEY NOT NULL,
	"preferences" jsonb
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" integer NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "house_hunters" ADD CONSTRAINT "house_hunters_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_hunters ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users: users can view their own data
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
-- Users: users can update their own data
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Roles: readable by everyone (authenticated)
CREATE POLICY "Roles are viewable by everyone" ON public.roles FOR SELECT TO authenticated USING (true);

-- User Roles: users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Agents: public profiles
CREATE POLICY "Agents are viewable by everyone" ON public.agents FOR SELECT USING (true);
CREATE POLICY "Agents can update own profile" ON public.agents FOR UPDATE USING (auth.uid() = id);

-- House Hunters: private profiles
CREATE POLICY "House hunters can view own profile" ON public.house_hunters FOR SELECT USING (auth.uid() = id);
CREATE POLICY "House hunters can update own profile" ON public.house_hunters FOR UPDATE USING (auth.uid() = id);

-- Trigger to sync auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  assigned_role text;
  role_record record;
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url');

  -- Determine role from metadata, default to 'house_hunter'
  assigned_role := COALESCE(new.raw_user_meta_data ->> 'role', 'house_hunter');

  -- Get role id. We use specific variable to avoid ambiguity
  SELECT id INTO role_record FROM public.roles WHERE name = assigned_role;

  -- Insert into user_roles if role exists
  IF role_record.id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id) VALUES (new.id, role_record.id);
  END IF;
  
  -- Create profile entries if needed
  IF assigned_role = 'agent' THEN
    INSERT INTO public.agents (id) VALUES (new.id);
  ELSIF assigned_role = 'house_hunter' THEN
    INSERT INTO public.house_hunters (id) VALUES (new.id);
  END IF;

  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Seed roles
INSERT INTO public.roles (name) VALUES ('admin'), ('agent'), ('house_hunter') ON CONFLICT (name) DO NOTHING;