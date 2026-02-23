-- Update handle_new_user to match new schema (users table, no user_profiles, check invitations)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  invite_record record;
BEGIN
  -- 1. Insert into public.users
  INSERT INTO public.users (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    'user'
  );

  -- 2. Check for pending invitation
  SELECT * INTO invite_record FROM public.invitations 
  WHERE email = new.email AND status = 'pending' AND expires_at > now();

  IF invite_record.id IS NOT NULL THEN
    -- Mark invitation as accepted
    UPDATE public.invitations 
    SET status = 'accepted', accepted_at = now() 
    WHERE id = invite_record.id;

    -- Log acceptance
    INSERT INTO public.audit_logs (user_id, action, details) 
    VALUES (new.id, 'invite_accepted', jsonb_build_object('invite_id', invite_record.id, 'intended_role', invite_record.intended_role));

    -- Handle Roles
    IF invite_record.intended_role = 'admin' THEN
       UPDATE public.users SET role = 'admin' WHERE id = new.id;
    
    ELSIF invite_record.intended_role = 'agent' THEN
       -- Valid invite for agent -> Create verification application
       -- Note: intended_role is an enum, assume generic placeholder if data missing
       INSERT INTO public.verification_applications (agent_id, status, agency_name, license_number) 
       VALUES (new.id, 'submitted', 'Pending Details', 'Pending Details');
    END IF;
  END IF;

  -- Audit Log
  INSERT INTO public.audit_logs (user_id, action, details) 
  VALUES (new.id, 'user_created', jsonb_build_object('email', new.email));

  RETURN new;
END;
$$;
