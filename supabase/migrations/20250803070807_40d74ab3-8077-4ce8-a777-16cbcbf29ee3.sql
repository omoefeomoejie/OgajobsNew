-- Trust & Verification System Migration
-- Create verification status enum
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'expired');

-- Create document types enum for Nigerian-specific verification
CREATE TYPE document_type AS ENUM ('nin', 'voters_card', 'drivers_license', 'international_passport', 'business_registration');

-- Create skill certification table
CREATE TABLE public.skill_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  certification_type TEXT NOT NULL, -- 'self_assessed', 'client_verified', 'third_party', 'platform_tested'
  certification_level TEXT NOT NULL, -- 'beginner', 'intermediate', 'expert', 'master'
  verification_score INTEGER DEFAULT 0, -- 0-100 score based on reviews and tests
  verified_by UUID REFERENCES public.profiles(id), -- Who verified this skill
  certificate_url TEXT, -- Link to certificate document
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create identity verification table
CREATE TABLE public.identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  document_number TEXT NOT NULL,
  document_image_url TEXT,
  selfie_url TEXT, -- For document + face verification
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  address TEXT,
  verification_status verification_status DEFAULT 'pending',
  verified_by UUID REFERENCES public.profiles(id), -- Admin who verified
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(artisan_id, document_type)
);

-- Create pricing transparency table for standardized pricing
CREATE TABLE public.service_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_category TEXT NOT NULL,
  service_subcategory TEXT NOT NULL,
  city TEXT NOT NULL, -- Lagos, Abuja, Benin City
  min_price DECIMAL NOT NULL,
  max_price DECIMAL NOT NULL,
  average_price DECIMAL NOT NULL,
  recommended_price DECIMAL NOT NULL,
  price_factors JSONB, -- Factors that affect pricing
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id),
  UNIQUE(service_category, service_subcategory, city)
);

-- Create trust metrics table
CREATE TABLE public.trust_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  identity_verified BOOLEAN DEFAULT false,
  skills_verified INTEGER DEFAULT 0, -- Number of verified skills
  total_jobs_completed INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  on_time_completion_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
  repeat_client_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
  dispute_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
  response_time_hours DECIMAL(5,2) DEFAULT 24.00, -- Average response time
  trust_score INTEGER DEFAULT 0, -- 0-100 calculated trust score
  verified_since TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add verification status to profiles
ALTER TABLE public.profiles 
ADD COLUMN identity_verified BOOLEAN DEFAULT false,
ADD COLUMN skills_verified BOOLEAN DEFAULT false,
ADD COLUMN trust_score INTEGER DEFAULT 0,
ADD COLUMN verification_level TEXT DEFAULT 'unverified'; -- 'unverified', 'basic', 'standard', 'premium'

-- Enable RLS on new tables
ALTER TABLE public.skill_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skill_certifications
CREATE POLICY "Artisans can view their own certifications" ON public.skill_certifications
  FOR SELECT USING (artisan_id = auth.uid());

CREATE POLICY "Artisans can create their own certifications" ON public.skill_certifications
  FOR INSERT WITH CHECK (artisan_id = auth.uid());

CREATE POLICY "Artisans can update their own certifications" ON public.skill_certifications
  FOR UPDATE USING (artisan_id = auth.uid());

CREATE POLICY "Public can view verified certifications" ON public.skill_certifications
  FOR SELECT USING (verification_score > 0);

-- RLS Policies for identity_verifications
CREATE POLICY "Artisans can view their own verification" ON public.identity_verifications
  FOR SELECT USING (artisan_id = auth.uid());

CREATE POLICY "Artisans can create verification requests" ON public.identity_verifications
  FOR INSERT WITH CHECK (artisan_id = auth.uid());

CREATE POLICY "Artisans can update pending verifications" ON public.identity_verifications
  FOR UPDATE USING (artisan_id = auth.uid() AND verification_status = 'pending');

CREATE POLICY "Admins can manage all verifications" ON public.identity_verifications
  FOR ALL USING (public.is_admin());

-- RLS Policies for service_pricing
CREATE POLICY "Public can view service pricing" ON public.service_pricing
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage service pricing" ON public.service_pricing
  FOR ALL USING (public.is_admin());

-- RLS Policies for trust_metrics
CREATE POLICY "Public can view trust metrics" ON public.trust_metrics
  FOR SELECT USING (true);

CREATE POLICY "Artisans can view their own trust metrics" ON public.trust_metrics
  FOR SELECT USING (artisan_id = auth.uid());

-- Function to calculate trust score
CREATE OR REPLACE FUNCTION calculate_trust_score(artisan_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  identity_points INTEGER := 0;
  skills_points INTEGER := 0;
  performance_points INTEGER := 0;
  total_score INTEGER := 0;
  metrics RECORD;
BEGIN
  -- Get trust metrics
  SELECT * INTO metrics FROM public.trust_metrics WHERE artisan_id = artisan_user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Identity verification (30 points max)
  IF metrics.identity_verified THEN
    identity_points := 30;
  END IF;
  
  -- Skills verification (25 points max)
  skills_points := LEAST(metrics.skills_verified * 5, 25);
  
  -- Performance metrics (45 points max)
  performance_points := LEAST(
    (metrics.average_rating * 10) + 
    (metrics.on_time_completion_rate * 0.15) + 
    (metrics.repeat_client_rate * 0.1) + 
    ((100 - metrics.dispute_rate) * 0.1) +
    (CASE WHEN metrics.response_time_hours <= 2 THEN 10 
          WHEN metrics.response_time_hours <= 6 THEN 7
          WHEN metrics.response_time_hours <= 24 THEN 5
          ELSE 0 END), 
    45
  );
  
  total_score := identity_points + skills_points + performance_points;
  
  -- Update the trust score
  UPDATE public.trust_metrics 
  SET trust_score = total_score, last_updated = now()
  WHERE artisan_id = artisan_user_id;
  
  -- Update profile trust score
  UPDATE public.profiles 
  SET trust_score = total_score
  WHERE id = artisan_user_id;
  
  RETURN total_score;
END;
$$;

-- Function to update verification level based on trust score
CREATE OR REPLACE FUNCTION update_verification_level(artisan_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  score INTEGER;
  level TEXT;
BEGIN
  SELECT trust_score INTO score FROM public.profiles WHERE id = artisan_user_id;
  
  IF score >= 80 THEN
    level := 'premium';
  ELSIF score >= 60 THEN
    level := 'standard';
  ELSIF score >= 30 THEN
    level := 'basic';
  ELSE
    level := 'unverified';
  END IF;
  
  UPDATE public.profiles 
  SET verification_level = level
  WHERE id = artisan_user_id;
  
  RETURN level;
END;
$$;

-- Trigger to update trust metrics when profiles change
CREATE OR REPLACE FUNCTION update_trust_metrics_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update trust metrics
  INSERT INTO public.trust_metrics (artisan_id, identity_verified)
  VALUES (NEW.id, NEW.identity_verified)
  ON CONFLICT (artisan_id) 
  DO UPDATE SET 
    identity_verified = NEW.identity_verified,
    last_updated = now();
  
  -- Calculate new trust score
  PERFORM calculate_trust_score(NEW.id);
  PERFORM update_verification_level(NEW.id);
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER update_trust_metrics_on_profile_change
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_trust_metrics_trigger();

-- Insert sample service pricing for Lagos
INSERT INTO public.service_pricing (service_category, service_subcategory, city, min_price, max_price, average_price, recommended_price, price_factors) VALUES
('home-services', 'plumbing', 'Lagos', 5000, 50000, 15000, 18000, '{"complexity": "basic to advanced", "materials": "included/excluded", "time": "1-4 hours"}'),
('home-services', 'electrical', 'Lagos', 3000, 100000, 25000, 30000, '{"scope": "repair to installation", "materials": "wiring, switches", "permits": "required for major work"}'),
('home-services', 'cleaning', 'Lagos', 5000, 30000, 12000, 15000, '{"size": "1-4 bedroom", "type": "regular/deep clean", "frequency": "one-time/recurring"}'),
('home-services', 'painting', 'Lagos', 15000, 150000, 45000, 50000, '{"area": "room to full house", "paint_quality": "economy to premium", "prep_work": "included"}'),
('construction-building', 'masonry-bricklaying', 'Lagos', 50000, 800000, 200000, 250000, '{"scope": "walls to full structure", "materials": "blocks, cement", "labor": "skilled masons"}'),
('personal-services', 'mobile-beauty', 'Lagos', 3000, 50000, 15000, 18000, '{"service_type": "basic to premium", "location": "home service", "duration": "1-3 hours"}');

-- Create updated_at triggers for all new tables
CREATE TRIGGER update_skill_certifications_updated_at
  BEFORE UPDATE ON public.skill_certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_identity_verifications_updated_at
  BEFORE UPDATE ON public.identity_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trust_metrics_updated_at
  BEFORE UPDATE ON public.trust_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();