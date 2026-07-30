
-- ========================================
-- ROLES & AUTHORIZATION
-- ========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'moderator');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

CREATE POLICY "users see own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ========================================
-- SHARED updated_at TRIGGER
-- ========================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ========================================
-- COURSES
-- ========================================
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  category TEXT NOT NULL,
  category_ar TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'Offline',
  level TEXT NOT NULL DEFAULT 'Beginner',
  duration TEXT,
  duration_ar TEXT,
  schedule TEXT,
  schedule_ar TEXT,
  venue TEXT,
  venue_ar TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  seats_left INT NOT NULL DEFAULT 0,
  total_seats INT NOT NULL DEFAULT 0,
  rating NUMERIC DEFAULT 4.8,
  reviews_count INT DEFAULT 0,
  gradient TEXT DEFAULT 'from-blue-500 to-indigo-500',
  featured BOOLEAN DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT true,
  start_date DATE,
  end_date DATE,
  instructor JSONB DEFAULT '{}'::jsonb,
  syllabus JSONB DEFAULT '[]'::jsonb,
  reviews JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published courses" ON public.courses
  FOR SELECT TO anon, authenticated USING (published = true OR public.is_staff(auth.uid()));
CREATE POLICY "staff manage courses" ON public.courses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE TRIGGER courses_updated BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================
-- PROGRAMS
-- ========================================
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  icon TEXT,
  gradient TEXT DEFAULT 'from-blue-500 to-indigo-500',
  sort_order INT DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.programs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.programs TO authenticated;
GRANT ALL ON public.programs TO service_role;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published programs" ON public.programs
  FOR SELECT TO anon, authenticated USING (published = true OR public.is_staff(auth.uid()));
CREATE POLICY "staff manage programs" ON public.programs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE TRIGGER programs_updated BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================
-- BLOG POSTS
-- ========================================
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  excerpt TEXT,
  excerpt_ar TEXT,
  content TEXT,
  content_ar TEXT,
  cover_image TEXT,
  author_name TEXT,
  category TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published posts" ON public.blog_posts
  FOR SELECT TO anon, authenticated USING (published = true OR public.is_staff(auth.uid()));
CREATE POLICY "staff manage posts" ON public.blog_posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE TRIGGER blog_updated BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================
-- PARTNERS
-- ========================================
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  tier TEXT DEFAULT 'standard',
  sort_order INT DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published partners" ON public.partners
  FOR SELECT TO anon, authenticated USING (published = true OR public.is_staff(auth.uid()));
CREATE POLICY "staff manage partners" ON public.partners
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE TRIGGER partners_updated BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================
-- MEDIA ITEMS
-- ========================================
CREATE TABLE public.media_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  title_ar TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  type TEXT NOT NULL DEFAULT 'image',
  category TEXT,
  sort_order INT DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media_items TO authenticated;
GRANT ALL ON public.media_items TO service_role;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published media" ON public.media_items
  FOR SELECT TO anon, authenticated USING (published = true OR public.is_staff(auth.uid()));
CREATE POLICY "staff manage media" ON public.media_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

-- ========================================
-- JOIN SUBMISSIONS
-- ========================================
CREATE TABLE public.join_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- member | coach | volunteer | workshop
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  age INT,
  gender TEXT,
  interest TEXT,
  message TEXT,
  extra JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new', -- new | contacted | approved | rejected
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.join_submissions TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.join_submissions TO authenticated;
GRANT ALL ON public.join_submissions TO service_role;
ALTER TABLE public.join_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit" ON public.join_submissions
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "staff read submissions" ON public.join_submissions
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff update submissions" ON public.join_submissions
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin delete submissions" ON public.join_submissions
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER submissions_updated BEFORE UPDATE ON public.join_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================
-- SITE SETTINGS
-- ========================================
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========================================
-- AUTO-ASSIGN FIRST USER AS ADMIN
-- ========================================
CREATE OR REPLACE FUNCTION public.assign_first_user_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_first_user_admin();

-- Seed initial site settings
INSERT INTO public.site_settings (key, value) VALUES
  ('general', '{"site_name": "United Sport Academy", "site_name_ar": "أكاديمية يونايتد الرياضية", "tagline": "Elite training. Real results.", "tagline_ar": "تدريب احترافي. نتائج حقيقية."}'::jsonb),
  ('contact', '{"email": "hello@unitedsport.ae", "phone": "+971 4 000 0000", "address": "Dubai, UAE", "whatsapp": "+971500000000"}'::jsonb),
  ('social', '{"instagram": "", "facebook": "", "twitter": "", "youtube": "", "tiktok": ""}'::jsonb);
