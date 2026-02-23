CREATE TABLE "agent_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"license_number" text,
	"agency_name" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" uuid,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"user_id" uuid NOT NULL,
	"permission_id" integer NOT NULL,
	CONSTRAINT "user_permissions_user_id_permission_id_pk" PRIMARY KEY("user_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"bio" text,
	"phone" text,
	"website" text,
	"preferences" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "agents" CASCADE;--> statement-breakpoint
DROP TABLE "house_hunters" CASCADE;--> statement-breakpoint
ALTER TABLE "agent_verifications" ADD CONSTRAINT "agent_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_verifications" ADD CONSTRAINT "agent_verifications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

-- Enable RLS
ALTER TABLE "agent_verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Users can read/update own. Public can read (for agent profiles).
CREATE POLICY "Public view profiles" ON "user_profiles" FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON "user_profiles" FOR UPDATE USING (auth.uid() = id);

-- Verifications: Users view own. Admins view all.
CREATE POLICY "Users view own verification" ON "agent_verifications" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage verifications" ON "agent_verifications" FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name = 'admin')
);

-- User Permissions: Users view own.
CREATE POLICY "Users view own permissions" ON "user_permissions" FOR SELECT USING (auth.uid() = user_id);

-- New Trigger Logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  invite_record record;
  admin_role_id int;
  p_id int;
BEGIN
  -- 1. Insert into public.users
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url');

  -- 2. Create User Profile (Empty default)
  INSERT INTO public.user_profiles (id) VALUES (new.id);

  -- 3. Check for pending invitation
  SELECT * INTO invite_record FROM public.invitations WHERE email = new.email AND status = 'pending' AND expires_at > now();

  IF invite_record.id IS NOT NULL THEN
    -- Mark invitation as accepted
    UPDATE public.invitations SET status = 'accepted', accepted_at = now() WHERE id = invite_record.id;
    -- Log
    INSERT INTO public.audit_logs (user_id, action, details) VALUES (new.id, 'invite_accepted', jsonb_build_object('invite_id', invite_record.id, 'role', invite_record.role));

    -- Handle Roles
    IF invite_record.role = 'admin' THEN
       SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin';
       IF admin_role_id IS NOT NULL THEN
         INSERT INTO public.user_roles (user_id, role_id) VALUES (new.id, admin_role_id);
       END IF;
       -- Admins implicitly get all access, or we can grant specific permissions here too.
       -- For now, relying on 'admin' role check in app logic, OR we grant all permissions to admin users in user_permissions?
       -- Proposed design said keys roles optional, admin auto-inherits. So we stick to role check for admin.
    
    ELSIF invite_record.role = 'agent' THEN
       -- Valid invite for agent -> Auto-Approve Verification
       INSERT INTO public.agent_verifications (user_id, status, notes) VALUES (new.id, 'approved', 'Invited as agent');
       
       -- Grant Agent Permissions
       -- 'listings:create', 'listings:update', 'listings:delete'
       FOR p_id IN SELECT id FROM public.permissions WHERE name IN ('listings:create', 'listings:update', 'listings:delete') LOOP
         INSERT INTO public.user_permissions (user_id, permission_id) VALUES (new.id, p_id);
       END LOOP;
    END IF;
  ELSE
    -- No invite check.
    -- Default is just a user (House Hunter behavior).
    -- They can verify as agent later via UI workflow.
    NULL;
  END IF;

  -- Audit Log
  INSERT INTO public.audit_logs (user_id, action, details) VALUES (new.id, 'user_created', jsonb_build_object('email', new.email));

  RETURN new;
END;
$$;