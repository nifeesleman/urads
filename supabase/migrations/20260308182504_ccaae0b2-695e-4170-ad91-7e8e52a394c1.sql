
-- Remove the broad SELECT policy that exposes all profile columns including wallet_address and email
DROP POLICY IF EXISTS "Authenticated can view basic profile info" ON public.profiles;

-- Update public_profiles view to ensure it excludes wallet_address and email
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, name, avatar_url, verified, created_at, updated_at
FROM public.profiles;
