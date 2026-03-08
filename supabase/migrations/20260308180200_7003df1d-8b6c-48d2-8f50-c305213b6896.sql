
-- Fix security definer view by recreating with security_invoker
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true) AS
SELECT id, name, avatar_url, verified, created_at, updated_at
FROM public.profiles;

-- Grant access
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Need a permissive policy so the view can read rows for authenticated users
CREATE POLICY "Authenticated can view basic profile info"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
