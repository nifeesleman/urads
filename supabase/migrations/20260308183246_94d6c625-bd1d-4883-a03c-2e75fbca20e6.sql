
-- Fix 1: Prevent admin privilege escalation
-- Drop the unsafe INSERT policy that allows any role to be self-assigned
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- Create a safe INSERT policy that only allows non-admin roles
CREATE POLICY "Users can insert their own role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND role IN ('advertiser', 'influencer'));
