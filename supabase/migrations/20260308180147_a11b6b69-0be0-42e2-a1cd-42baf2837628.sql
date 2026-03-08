
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Allow users to view their own profile fully
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Create a public_profiles view that excludes sensitive fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, name, avatar_url, verified, created_at, updated_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;
