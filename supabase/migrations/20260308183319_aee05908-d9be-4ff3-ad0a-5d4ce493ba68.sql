
-- Fix 2: Convert all RESTRICTIVE policies to PERMISSIVE
-- PostgreSQL requires PERMISSIVE policies to grant access; RESTRICTIVE only narrows it.

-- ========================
-- PROFILES
-- ========================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========================
-- USER_ROLES
-- ========================
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own role"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role IN ('advertiser', 'influencer'));

CREATE POLICY "Admins can view all user roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========================
-- ADVERTISERS
-- ========================
DROP POLICY IF EXISTS "Users can manage their own advertiser profile" ON public.advertisers;
DROP POLICY IF EXISTS "Users can view own advertiser profile" ON public.advertisers;

CREATE POLICY "Users can manage their own advertiser profile"
  ON public.advertisers FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ========================
-- INFLUENCERS
-- ========================
DROP POLICY IF EXISTS "Users can manage their own influencer profile" ON public.influencers;
DROP POLICY IF EXISTS "Verified influencers are viewable by everyone" ON public.influencers;

CREATE POLICY "Users can manage their own influencer profile"
  ON public.influencers FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Verified influencers are viewable by everyone"
  ON public.influencers FOR SELECT TO authenticated
  USING (true);

-- ========================
-- CAMPAIGNS
-- ========================
DROP POLICY IF EXISTS "Open campaigns are viewable by everyone" ON public.campaigns;
DROP POLICY IF EXISTS "Advertisers can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Advertisers can update their campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Advertisers can delete their campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can manage all campaigns" ON public.campaigns;

CREATE POLICY "Open campaigns are viewable by everyone"
  ON public.campaigns FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Advertisers can create campaigns"
  ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM advertisers
    WHERE advertisers.id = campaigns.advertiser_id AND advertisers.user_id = auth.uid()
  ));

CREATE POLICY "Advertisers can update their campaigns"
  ON public.campaigns FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM advertisers
    WHERE advertisers.id = campaigns.advertiser_id AND advertisers.user_id = auth.uid()
  ));

CREATE POLICY "Advertisers can delete their campaigns"
  ON public.campaigns FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM advertisers
    WHERE advertisers.id = campaigns.advertiser_id AND advertisers.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all campaigns"
  ON public.campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========================
-- APPLICATIONS
-- ========================
DROP POLICY IF EXISTS "Campaign parties can view applications" ON public.applications;
DROP POLICY IF EXISTS "Influencers can apply to campaigns" ON public.applications;
DROP POLICY IF EXISTS "Application parties can update" ON public.applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applications;

CREATE POLICY "Campaign parties can view applications"
  ON public.applications FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM influencers WHERE influencers.id = applications.influencer_id AND influencers.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM campaigns c JOIN advertisers a ON c.advertiser_id = a.id WHERE c.id = applications.campaign_id AND a.user_id = auth.uid())
  );

CREATE POLICY "Influencers can apply to campaigns"
  ON public.applications FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM influencers WHERE influencers.id = applications.influencer_id AND influencers.user_id = auth.uid()
  ));

CREATE POLICY "Application parties can update"
  ON public.applications FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM influencers WHERE influencers.id = applications.influencer_id AND influencers.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM campaigns c JOIN advertisers a ON c.advertiser_id = a.id WHERE c.id = applications.campaign_id AND a.user_id = auth.uid())
  );

CREATE POLICY "Admins can view all applications"
  ON public.applications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========================
-- ESCROW
-- ========================
DROP POLICY IF EXISTS "Campaign parties can view escrow" ON public.escrow;
DROP POLICY IF EXISTS "Advertisers can create escrow" ON public.escrow;
DROP POLICY IF EXISTS "Campaign parties can update escrow" ON public.escrow;
DROP POLICY IF EXISTS "Admins can manage all escrow" ON public.escrow;

CREATE POLICY "Campaign parties can view escrow"
  ON public.escrow FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM campaigns c JOIN advertisers a ON c.advertiser_id = a.id WHERE c.id = escrow.campaign_id AND a.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM campaigns c JOIN applications app ON app.campaign_id = c.id JOIN influencers i ON app.influencer_id = i.id WHERE c.id = escrow.campaign_id AND i.user_id = auth.uid() AND app.status = 'accepted')
  );

CREATE POLICY "Advertisers can create escrow"
  ON public.escrow FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM campaigns c JOIN advertisers a ON c.advertiser_id = a.id WHERE c.id = escrow.campaign_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Campaign parties can update escrow"
  ON public.escrow FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM campaigns c JOIN advertisers a ON c.advertiser_id = a.id WHERE c.id = escrow.campaign_id AND a.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM campaigns c JOIN applications app ON app.campaign_id = c.id JOIN influencers i ON app.influencer_id = i.id WHERE c.id = escrow.campaign_id AND i.user_id = auth.uid() AND app.status = 'accepted')
  );

CREATE POLICY "Admins can manage all escrow"
  ON public.escrow FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========================
-- MESSAGES
-- ========================
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;

CREATE POLICY "Users can view their messages"
  ON public.messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their received messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (receiver_id = auth.uid());

CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========================
-- NOTIFICATIONS
-- ========================
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;

CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
