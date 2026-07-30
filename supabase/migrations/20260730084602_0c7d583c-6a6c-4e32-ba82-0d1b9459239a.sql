
-- Fix mutable search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

REVOKE EXECUTE ON FUNCTION public.assign_first_user_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "anyone can submit" ON public.join_submissions;
CREATE POLICY "anyone can submit" ON public.join_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(full_name) BETWEEN 1 AND 200
    AND char_length(email) BETWEEN 3 AND 200
    AND type IN ('member','coach','volunteer','workshop')
  );

-- private schema
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

DO $$ BEGIN
  CREATE TYPE public.academy_role AS ENUM (
    'super_admin','top_management','branch_admin','finance','hr',
    'coach','receptionist','warehouse','procurement','maintenance',
    'tenant','trainee'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text NOT NULL,
  address text,
  phone text,
  email text,
  pool_specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated;
GRANT SELECT ON public.branches TO anon;
GRANT ALL ON public.branches TO service_role;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.academy_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  full_name text,
  phone text,
  language text NOT NULL DEFAULT 'ar',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_profiles TO authenticated;
GRANT ALL ON public.academy_profiles TO service_role;
ALTER TABLE public.academy_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.academy_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.academy_role NOT NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, branch_id)
);
GRANT SELECT ON public.academy_user_roles TO authenticated;
GRANT ALL ON public.academy_user_roles TO service_role;
ALTER TABLE public.academy_user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.page_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL UNIQUE,
  label_ar text,
  allowed_roles public.academy_role[] NOT NULL DEFAULT '{}',
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.page_permissions TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.page_permissions TO authenticated;
GRANT ALL ON public.page_permissions TO service_role;
ALTER TABLE public.page_permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.has_academy_role(_user_id uuid, _role public.academy_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.academy_user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION private.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.academy_user_roles WHERE user_id = _user_id AND role = 'super_admin')
$$;

CREATE OR REPLACE FUNCTION private.has_any_academy_role(_user_id uuid, _roles public.academy_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.academy_user_roles WHERE user_id = _user_id AND role = ANY(_roles))
$$;

CREATE OR REPLACE FUNCTION private.user_branch_ids(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT branch_id FROM public.academy_user_roles
  WHERE user_id = _user_id AND branch_id IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.has_academy_role(_user_id uuid, _role public.academy_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT private.has_academy_role(_user_id, _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_academy_role(uuid, public.academy_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT private.is_super_admin(_user_id)
$$;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.has_any_academy_role(_user_id uuid, _roles public.academy_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT private.has_any_academy_role(_user_id, _roles)
$$;
GRANT EXECUTE ON FUNCTION public.has_any_academy_role(uuid, public.academy_role[]) TO authenticated;

DROP TRIGGER IF EXISTS branches_set_updated_at ON public.branches;
CREATE TRIGGER branches_set_updated_at BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS academy_profiles_set_updated_at ON public.academy_profiles;
CREATE TRIGGER academy_profiles_set_updated_at BEFORE UPDATE ON public.academy_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS page_permissions_set_updated_at ON public.page_permissions;
CREATE TRIGGER page_permissions_set_updated_at BEFORE UPDATE ON public.page_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "branches read auth" ON public.branches;
CREATE POLICY "branches read auth" ON public.branches FOR SELECT
  TO authenticated, anon USING (active = true OR public.is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "branches manage super" ON public.branches;
CREATE POLICY "branches manage super" ON public.branches FOR ALL
  TO authenticated
  USING (public.has_any_academy_role(auth.uid(), ARRAY['super_admin','top_management']::public.academy_role[]))
  WITH CHECK (public.has_any_academy_role(auth.uid(), ARRAY['super_admin','top_management']::public.academy_role[]));

DROP POLICY IF EXISTS "profiles own" ON public.academy_profiles;
CREATE POLICY "profiles own" ON public.academy_profiles FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "roles read" ON public.academy_user_roles;
CREATE POLICY "roles read" ON public.academy_user_roles FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "roles manage super" ON public.academy_user_roles;
CREATE POLICY "roles manage super" ON public.academy_user_roles FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "perms read all" ON public.page_permissions;
CREATE POLICY "perms read all" ON public.page_permissions FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "perms manage super" ON public.page_permissions;
CREATE POLICY "perms manage super" ON public.page_permissions FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "audit read mgmt" ON public.audit_log;
CREATE POLICY "audit read mgmt" ON public.audit_log FOR SELECT
  TO authenticated
  USING (public.has_any_academy_role(auth.uid(), ARRAY['super_admin','top_management']::public.academy_role[]));
DROP POLICY IF EXISTS "audit insert auth" ON public.audit_log;
CREATE POLICY "audit insert auth" ON public.audit_log FOR INSERT
  TO authenticated WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

INSERT INTO public.branches (id, name, name_ar, address, phone, active, sort_order)
VALUES ('11111111-1111-1111-1111-111111111111', 'Main HQ', 'الفرع الرئيسي', 'المقر الرئيسي', '+20 000 000 0000', true, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.page_permissions (path, label_ar, allowed_roles) VALUES
  ('/academy',                      'نظرة عامة',        ARRAY['super_admin','top_management','branch_admin']::public.academy_role[]),
  ('/academy/leads',                'العملاء المحتملين', ARRAY['super_admin','top_management','branch_admin','receptionist']::public.academy_role[]),
  ('/academy/clients',              'العملاء',           ARRAY['super_admin','top_management','branch_admin','receptionist','finance']::public.academy_role[]),
  ('/academy/finance/ledger',       'الدفتر المالي',    ARRAY['super_admin','top_management','finance']::public.academy_role[]),
  ('/academy/finance/receipts',     'الإيصالات',         ARRAY['super_admin','top_management','finance','receptionist']::public.academy_role[]),
  ('/academy/finance/subscriptions','الاشتراكات',        ARRAY['super_admin','top_management','finance','receptionist']::public.academy_role[]),
  ('/academy/finance/invoicing',    'الفوترة',           ARRAY['super_admin','top_management','finance']::public.academy_role[]),
  ('/academy/pool-operations',      'تشغيل المسبح',      ARRAY['super_admin','top_management','branch_admin','coach']::public.academy_role[]),
  ('/academy/qr-attendance',        'حضور QR',           ARRAY['super_admin','top_management','branch_admin','coach','receptionist']::public.academy_role[]),
  ('/academy/lane-log',             'سجل الحارات',       ARRAY['super_admin','top_management','branch_admin','coach']::public.academy_role[]),
  ('/academy/attendance',           'الحضور',            ARRAY['super_admin','top_management','branch_admin','coach','receptionist']::public.academy_role[]),
  ('/academy/schedule',             'الجداول',           ARRAY['super_admin','top_management','branch_admin','coach']::public.academy_role[]),
  ('/academy/coaches',              'المدربين',          ARRAY['super_admin','top_management','branch_admin','hr']::public.academy_role[]),
  ('/academy/assessments',          'التقييمات',         ARRAY['super_admin','top_management','branch_admin','coach']::public.academy_role[]),
  ('/academy/hr',                   'الموارد البشرية',   ARRAY['super_admin','top_management','hr']::public.academy_role[]),
  ('/academy/hr/attendance',        'حضور الموظفين',     ARRAY['super_admin','top_management','hr']::public.academy_role[]),
  ('/academy/hr/leaves',            'الإجازات',          ARRAY['super_admin','top_management','hr']::public.academy_role[]),
  ('/academy/hr/payroll',           'الرواتب',           ARRAY['super_admin','top_management','hr','finance']::public.academy_role[]),
  ('/academy/analytics',            'التحليلات',         ARRAY['super_admin','top_management','branch_admin']::public.academy_role[]),
  ('/academy/reports',              'التقارير',          ARRAY['super_admin','top_management','branch_admin','finance']::public.academy_role[]),
  ('/academy/hr-reports',           'تقارير الموظفين',   ARRAY['super_admin','top_management','hr']::public.academy_role[]),
  ('/academy/branch-reports',       'مقارنة الفروع',     ARRAY['super_admin']::public.academy_role[]),
  ('/academy/permissions',          'الأدوار والصلاحيات',ARRAY['super_admin']::public.academy_role[]),
  ('/academy/branches',             'الفروع',            ARRAY['super_admin','top_management']::public.academy_role[]),
  ('/academy/settings',             'الإعدادات',         ARRAY['super_admin','top_management','branch_admin']::public.academy_role[])
ON CONFLICT (path) DO NOTHING;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.branches;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.academy_user_roles;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- storage policies
CREATE POLICY "public read site-media" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'site-media');
CREATE POLICY "staff upload site-media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-media' AND public.is_staff(auth.uid()));
CREATE POLICY "staff update site-media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'site-media' AND public.is_staff(auth.uid()));
CREATE POLICY "staff delete site-media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'site-media' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "attachments upload auth" ON storage.objects;
CREATE POLICY "attachments upload auth" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'attachments');
DROP POLICY IF EXISTS "attachments read auth" ON storage.objects;
CREATE POLICY "attachments read auth" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'attachments');
DROP POLICY IF EXISTS "attachments delete mgmt" ON storage.objects;
CREATE POLICY "attachments delete mgmt" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'attachments'
    AND public.has_any_academy_role(
      auth.uid(),
      ARRAY['super_admin','top_management','branch_admin','finance','hr']::public.academy_role[]
    )
  );
