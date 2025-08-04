-- Portfolio Management System Database Schema

-- Main portfolios table
CREATE TABLE public.portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artisan_id UUID NOT NULL,
  title TEXT NOT NULL,
  bio TEXT,
  specialties TEXT[],
  years_experience INTEGER DEFAULT 0,
  hourly_rate NUMERIC(10,2),
  profile_image_url TEXT,
  cover_image_url TEXT,
  location JSONB,
  availability_status TEXT DEFAULT 'available',
  portfolio_views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_public BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false
);

-- Portfolio projects/work gallery
CREATE TABLE public.portfolio_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  before_image_url TEXT,
  after_image_url TEXT,
  project_images TEXT[],
  completion_date DATE,
  client_name TEXT,
  project_duration TEXT,
  materials_used TEXT[],
  project_cost NUMERIC(10,2),
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Portfolio skills and certifications
CREATE TABLE public.portfolio_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_level INTEGER CHECK (skill_level >= 1 AND skill_level <= 5),
  years_experience INTEGER DEFAULT 0,
  certification_name TEXT,
  certification_authority TEXT,
  certification_date DATE,
  certification_expiry DATE,
  certification_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Service packages for pricing
CREATE TABLE public.service_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  duration TEXT,
  includes TEXT[],
  category TEXT NOT NULL,
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Portfolio analytics and metrics
CREATE TABLE public.portfolio_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_views INTEGER DEFAULT 0,
  project_views JSONB DEFAULT '{}',
  contact_clicks INTEGER DEFAULT 0,
  booking_requests INTEGER DEFAULT 0,
  package_views JSONB DEFAULT '{}',
  referrer_sources JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(portfolio_id, view_date)
);

-- Client testimonials
CREATE TABLE public.portfolio_testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_avatar_url TEXT,
  testimonial TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  project_title TEXT,
  completion_date DATE,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_testimonials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolios
CREATE POLICY "Public can view published portfolios" ON public.portfolios
  FOR SELECT USING (is_public = true);

CREATE POLICY "Artisans can manage their own portfolios" ON public.portfolios
  FOR ALL USING (artisan_id = auth.uid());

-- RLS Policies for portfolio_projects
CREATE POLICY "Public can view portfolio projects" ON public.portfolio_projects
  FOR SELECT USING (
    portfolio_id IN (
      SELECT id FROM public.portfolios WHERE is_public = true
    )
  );

CREATE POLICY "Artisans can manage their portfolio projects" ON public.portfolio_projects
  FOR ALL USING (
    portfolio_id IN (
      SELECT id FROM public.portfolios WHERE artisan_id = auth.uid()
    )
  );

-- RLS Policies for portfolio_skills
CREATE POLICY "Public can view portfolio skills" ON public.portfolio_skills
  FOR SELECT USING (
    portfolio_id IN (
      SELECT id FROM public.portfolios WHERE is_public = true
    )
  );

CREATE POLICY "Artisans can manage their portfolio skills" ON public.portfolio_skills
  FOR ALL USING (
    portfolio_id IN (
      SELECT id FROM public.portfolios WHERE artisan_id = auth.uid()
    )
  );

-- RLS Policies for service_packages
CREATE POLICY "Public can view service packages" ON public.service_packages
  FOR SELECT USING (
    portfolio_id IN (
      SELECT id FROM public.portfolios WHERE is_public = true
    )
  );

CREATE POLICY "Artisans can manage their service packages" ON public.service_packages
  FOR ALL USING (
    portfolio_id IN (
      SELECT id FROM public.portfolios WHERE artisan_id = auth.uid()
    )
  );

-- RLS Policies for portfolio_analytics
CREATE POLICY "Artisans can view their portfolio analytics" ON public.portfolio_analytics
  FOR ALL USING (
    portfolio_id IN (
      SELECT id FROM public.portfolios WHERE artisan_id = auth.uid()
    )
  );

-- RLS Policies for portfolio_testimonials
CREATE POLICY "Public can view approved testimonials" ON public.portfolio_testimonials
  FOR SELECT USING (
    is_approved = true AND portfolio_id IN (
      SELECT id FROM public.portfolios WHERE is_public = true
    )
  );

CREATE POLICY "Artisans can manage their testimonials" ON public.portfolio_testimonials
  FOR ALL USING (
    portfolio_id IN (
      SELECT id FROM public.portfolios WHERE artisan_id = auth.uid()
    )
  );

-- Update triggers for updated_at
CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_packages_updated_at
  BEFORE UPDATE ON public.service_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment portfolio views
CREATE OR REPLACE FUNCTION public.increment_portfolio_views(portfolio_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update main portfolio view count
  UPDATE public.portfolios 
  SET portfolio_views = portfolio_views + 1,
      updated_at = now()
  WHERE id = portfolio_id_param;
  
  -- Update daily analytics
  INSERT INTO public.portfolio_analytics (portfolio_id, view_date, total_views)
  VALUES (portfolio_id_param, CURRENT_DATE, 1)
  ON CONFLICT (portfolio_id, view_date)
  DO UPDATE SET total_views = portfolio_analytics.total_views + 1;
END;
$$;