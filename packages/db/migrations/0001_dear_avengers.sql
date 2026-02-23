CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"details" jsonb,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"invited_by" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_permissions" (
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "phone" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Enable RLS on new tables
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Audit Logs: Users can read their own logs. Admins read all.
CREATE POLICY "Users view own audit logs" ON "audit_logs" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all audit logs" ON "audit_logs" FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name = 'admin')
);

-- Invitations: Admins can manage invitations.
CREATE POLICY "Admins manage invitations" ON "invitations" FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name = 'admin')
);
-- Allow reading invitations by token (public for acceptance flow) is handled by function/logic, usually we don't expose token via RLS loosely.
-- But for a lookup by token we might need a public policy if the user is not logged in.
-- Restrict to simple select by token if needed, but for now we keep it strict.

-- Permissions: All authenticated users can read permissions (needed for UI/checks).
CREATE POLICY "Authenticated users view permissions" ON "permissions" FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users view role_permissions" ON "role_permissions" FOR SELECT USING (auth.role() = 'authenticated');


-- Updated Trigger to handle Invitations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  assigned_role text;
  role_record record;
  invite_record record;
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url');

  -- Check for pending invitation
  SELECT * INTO invite_record FROM public.invitations WHERE email = new.email AND status = 'pending' AND expires_at > now();

  IF invite_record.id IS NOT NULL THEN
    assigned_role := invite_record.role;
    -- Mark invitation as accepted
    UPDATE public.invitations SET status = 'accepted', accepted_at = now() WHERE id = invite_record.id;
    -- Log the acceptance
    INSERT INTO public.audit_logs (user_id, action, details) VALUES (new.id, 'invite_accepted', jsonb_build_object('invite_id', invite_record.id));
  ELSE
    -- Default role fallback
    assigned_role := COALESCE(new.raw_user_meta_data ->> 'role', 'house_hunter');
    
    -- Force 'house_hunter' if trying to be 'agent' or 'admin' without invite (strict mode)
    -- But since we control the UI, we can allow 'agent' IF we want self-serve agents.
    -- The user requirement says "agents are invite only".
    -- So if they try to sign up as agent without invite, force house_hunter?
    -- For now, let's respect the metadata but we can enforce invite-only here if strictness is needed.
    -- User said: "agents are probably not self-serve — an admin likely invites them. ... flow will be, agents are invite only for now."
    -- So if they claim 'agent' but have no invite, we downgrade them or reject?
    -- Downgrading to house_hunter is safer than erroring out the trigger (which might block auth creation).
    IF assigned_role IN ('agent', 'admin') THEN
       assigned_role := 'house_hunter';
    END IF;
  END IF;

  -- Get role id
  SELECT id INTO role_record FROM public.roles WHERE name = assigned_role;

  -- Insert into user_roles
  IF role_record.id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id) VALUES (new.id, role_record.id);
  END IF;
  
  -- Create profile entries
  IF assigned_role = 'agent' THEN
    INSERT INTO public.agents (id) VALUES (new.id);
  ELSIF assigned_role = 'house_hunter' THEN
    INSERT INTO public.house_hunters (id) VALUES (new.id);
  END IF;

  -- Audit Log
  INSERT INTO public.audit_logs (user_id, action, details) VALUES (new.id, 'user_created', jsonb_build_object('role', assigned_role));

  RETURN new;
END;
$$;

-- Seed Permissions and Role Permissions
-- Using DO block to handle complex seeding logic with IDs
DO $$
DECLARE
  r_admin_id int;
  r_agent_id int;
  r_house_hunter_id int;
  p_id int;
BEGIN
  -- Ensure roles exist (idempotent from previous migration)
  -- But we need their IDs
  SELECT id INTO r_admin_id FROM roles WHERE name = 'admin';
  SELECT id INTO r_agent_id FROM roles WHERE name = 'agent';
  SELECT id INTO r_house_hunter_id FROM roles WHERE name = 'house_hunter';

  -- Permissions
  -- Admin Permissions (All)
  -- Insert and get ID, then map to admin
  -- We'll define a list and loop through? Or just manual inserts.
  
  -- Listings
  INSERT INTO permissions (name, description) VALUES ('listings:create', 'Create new property listings') ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id INTO p_id;
  INSERT INTO role_permissions (role_id, permission_id) VALUES (r_admin_id, p_id), (r_agent_id, p_id) ON CONFLICT DO NOTHING;

  INSERT INTO permissions (name, description) VALUES ('listings:update', 'Update own property listings') ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id INTO p_id;
  INSERT INTO role_permissions (role_id, permission_id) VALUES (r_admin_id, p_id), (r_agent_id, p_id) ON CONFLICT DO NOTHING;

  INSERT INTO permissions (name, description) VALUES ('listings:delete', 'Delete own property listings') ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id INTO p_id;
  INSERT INTO role_permissions (role_id, permission_id) VALUES (r_admin_id, p_id), (r_agent_id, p_id) ON CONFLICT DO NOTHING;
  
  INSERT INTO permissions (name, description) VALUES ('listings:read', 'View property listings') ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id INTO p_id;
  INSERT INTO role_permissions (role_id, permission_id) VALUES (r_admin_id, p_id), (r_agent_id, p_id), (r_house_hunter_id, p_id) ON CONFLICT DO NOTHING;

  -- Users
  INSERT INTO permissions (name, description) VALUES ('users:manage', 'Manage all users') ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id INTO p_id;
  INSERT INTO role_permissions (role_id, permission_id) VALUES (r_admin_id, p_id) ON CONFLICT DO NOTHING;

  -- Profiles
  INSERT INTO permissions (name, description) VALUES ('profile:agent:update', 'Update agent profile') ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id INTO p_id;
  INSERT INTO role_permissions (role_id, permission_id) VALUES (r_agent_id, p_id) ON CONFLICT DO NOTHING;

  INSERT INTO permissions (name, description) VALUES ('profile:house_hunter:update', 'Update house hunter profile') ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id INTO p_id;
  INSERT INTO role_permissions (role_id, permission_id) VALUES (r_house_hunter_id, p_id) ON CONFLICT DO NOTHING;
  
  -- Favorites
  INSERT INTO permissions (name, description) VALUES ('favorites:manage', 'Manage favorites') ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id INTO p_id;
  INSERT INTO role_permissions (role_id, permission_id) VALUES (r_house_hunter_id, p_id) ON CONFLICT DO NOTHING;

END $$;