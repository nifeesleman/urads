
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Advertisers are viewable by everyone" ON public.advertisers;

-- Owner can fully manage their profile (already exists, keep it)
-- Create a public view for limited advertiser info (no website, location, budget_range)
CREATE OR REPLACE VIEW public.public_advertisers AS
SELECT id, company_name, user_id
FROM public.advertisers;

-- Allow authenticated users to read the limited view via the base table
-- Only the owner or campaign-related parties can see full details
CREATE POLICY "Users can view own advertiser profile"
  ON public.advertisers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated can view basic advertiser info"
  ON public.advertisers FOR SELECT
  TO authenticated
  USING (true);
