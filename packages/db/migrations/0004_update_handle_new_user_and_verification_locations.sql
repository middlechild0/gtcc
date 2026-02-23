-- Add service_location_ids to verification_applications to capture requested locations
ALTER TABLE public.verification_applications
ADD COLUMN IF NOT EXISTS service_location_ids jsonb;

-- Update handle_new_user trigger to stop using invitations.intended_role
-- for automatic role assignment or creating verification applications.

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
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    'user'
  );

  -- 2. Check for pending invitation
  SELECT * INTO invite_record
  FROM public.invitations
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > now();

  IF invite_record.id IS NOT NULL THEN
    -- Mark invitation as accepted
    UPDATE public.invitations
    SET status = 'accepted',
        accepted_at = now()
    WHERE id = invite_record.id;

    -- Log acceptance (keep for audit trail)
    INSERT INTO public.audit_logs (user_id, action, details)
    VALUES (
      NEW.id,
      'invite_accepted',
      jsonb_build_object(
        'invite_id', invite_record.id,
        'intended_role', invite_record.intended_role
      )
    );
  END IF;

  -- 3. Always log user creation
  INSERT INTO public.audit_logs (user_id, action, details)
  VALUES (
    NEW.id,
    'user_created',
    jsonb_build_object('email', NEW.email)
  );

  RETURN NEW;
END;
$$;

