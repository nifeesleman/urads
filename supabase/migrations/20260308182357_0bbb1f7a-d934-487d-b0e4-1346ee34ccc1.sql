
-- Remove the broad policy that exposes all advertiser columns
DROP POLICY IF EXISTS "Authenticated can read advertisers for view" ON public.advertisers;

-- Recreate the view WITHOUT security_invoker so it bypasses RLS
-- This means the view itself controls what columns are visible
CREATE OR REPLACE VIEW public.public_advertisers AS
SELECT id, company_name, user_id
FROM public.advertisers;
