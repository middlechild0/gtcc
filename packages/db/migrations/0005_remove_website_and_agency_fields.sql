-- Remove website field from users table
ALTER TABLE public.users DROP COLUMN IF EXISTS website;

-- Remove agency/license fields from verification_applications table
ALTER TABLE public.verification_applications DROP COLUMN IF EXISTS license_number;
ALTER TABLE public.verification_applications DROP COLUMN IF EXISTS agency_name;
ALTER TABLE public.verification_applications DROP COLUMN IF EXISTS agency_address;
ALTER TABLE public.verification_applications DROP COLUMN IF EXISTS years_of_experience;
