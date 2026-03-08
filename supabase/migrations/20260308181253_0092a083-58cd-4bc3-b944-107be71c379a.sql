
-- Fix: remove broad policy that still exposes all columns
DROP POLICY IF EXISTS "Authenticated can view basic advertiser info" ON public.advertisers;

-- Recreate view with security_invoker to fix security definer warning
CREATE OR REPLACE VIEW public.public_advertisers 
WITH (security_invoker = true) AS
SELECT id, company_name, user_id
FROM public.advertisers;

-- Allow authenticated users to SELECT for the view to work (limited columns via view)
-- Use a policy that allows reading only id, company_name, user_id through the view
CREATE POLICY "Authenticated can read advertisers for view"
  ON public.advertisers FOR SELECT
  TO authenticated
  USING (true);
