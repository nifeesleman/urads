-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('advertiser', 'influencer', 'admin');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Advertisers table
CREATE TABLE public.advertisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name TEXT,
  budget_range TEXT,
  product_service TEXT,
  location TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.advertisers ENABLE ROW LEVEL SECURITY;

-- Influencers table
CREATE TABLE public.influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  niche TEXT[],
  followers INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  platforms TEXT[],
  country TEXT,
  price_per_post DECIMAL(10,2),
  bio TEXT,
  portfolio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;

-- Campaign status enum
CREATE TYPE public.campaign_status AS ENUM ('open', 'in_progress', 'delivered', 'approved', 'disputed', 'cancelled');

-- Campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID REFERENCES public.advertisers(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  niche TEXT[],
  budget DECIMAL(10,2) NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  requirements TEXT,
  status campaign_status DEFAULT 'open',
  escrow_address TEXT,
  escrow_tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Application status enum
CREATE TYPE public.application_status AS ENUM ('applied', 'accepted', 'rejected');

-- Applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  influencer_id UUID REFERENCES public.influencers(id) ON DELETE CASCADE NOT NULL,
  status application_status DEFAULT 'applied',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (campaign_id, influencer_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Escrow status enum
CREATE TYPE public.escrow_status AS ENUM ('pending', 'locked', 'released', 'refunded');

-- Escrow table
CREATE TABLE public.escrow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  status escrow_status DEFAULT 'pending',
  contract_address TEXT,
  deposit_tx_hash TEXT,
  release_tx_hash TEXT,
  deliverable_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.escrow ENABLE ROW LEVEL SECURITY;

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- RLS Policies

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Advertisers policies
CREATE POLICY "Advertisers are viewable by everyone"
  ON public.advertisers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own advertiser profile"
  ON public.advertisers FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Influencers policies
CREATE POLICY "Verified influencers are viewable by everyone"
  ON public.influencers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own influencer profile"
  ON public.influencers FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Campaigns policies
CREATE POLICY "Open campaigns are viewable by everyone"
  ON public.campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Advertisers can create campaigns"
  ON public.campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.advertisers 
      WHERE id = advertiser_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Advertisers can update their campaigns"
  ON public.campaigns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.advertisers 
      WHERE id = advertiser_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Advertisers can delete their campaigns"
  ON public.campaigns FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.advertisers 
      WHERE id = advertiser_id AND user_id = auth.uid()
    )
  );

-- Applications policies
CREATE POLICY "Campaign parties can view applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.influencers WHERE id = influencer_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.advertisers a ON c.advertiser_id = a.id
      WHERE c.id = campaign_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Influencers can apply to campaigns"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.influencers WHERE id = influencer_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Application parties can update"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.influencers WHERE id = influencer_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.advertisers a ON c.advertiser_id = a.id
      WHERE c.id = campaign_id AND a.user_id = auth.uid()
    )
  );

-- Escrow policies
CREATE POLICY "Campaign parties can view escrow"
  ON public.escrow FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.advertisers a ON c.advertiser_id = a.id
      WHERE c.id = campaign_id AND a.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.applications app ON app.campaign_id = c.id
      JOIN public.influencers i ON app.influencer_id = i.id
      WHERE c.id = campaign_id AND i.user_id = auth.uid() AND app.status = 'accepted'
    )
  );

CREATE POLICY "Advertisers can create escrow"
  ON public.escrow FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.advertisers a ON c.advertiser_id = a.id
      WHERE c.id = campaign_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Campaign parties can update escrow"
  ON public.escrow FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.advertisers a ON c.advertiser_id = a.id
      WHERE c.id = campaign_id AND a.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.applications app ON app.campaign_id = c.id
      JOIN public.influencers i ON app.influencer_id = i.id
      WHERE c.id = campaign_id AND i.user_id = auth.uid() AND app.status = 'accepted'
    )
  );

-- Messages policies
CREATE POLICY "Users can view their messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their received messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admin policies using has_role function
CREATE POLICY "Admins can view all user roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all campaigns"
  ON public.campaigns FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all applications"
  ON public.applications FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all escrow"
  ON public.escrow FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_advertisers_updated_at
  BEFORE UPDATE ON public.advertisers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_influencers_updated_at
  BEFORE UPDATE ON public.influencers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_escrow_updated_at
  BEFORE UPDATE ON public.escrow
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();