DO $$
BEGIN
  ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_user_id_auth_users_id_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

