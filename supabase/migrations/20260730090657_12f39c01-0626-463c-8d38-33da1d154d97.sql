CREATE TABLE IF NOT EXISTS public.super_admin_allowlist (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.super_admin_allowlist TO authenticated;
GRANT ALL ON public.super_admin_allowlist TO service_role;
ALTER TABLE public.super_admin_allowlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "super admins manage allowlist" ON public.super_admin_allowlist;
CREATE POLICY "super admins manage allowlist" ON public.super_admin_allowlist
  FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

INSERT INTO public.super_admin_allowlist (email)
VALUES ('the.one.behind.kemetrise@gmail.com')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.claim_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
  _verified timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT lower(u.email), u.email_confirmed_at INTO _email, _verified
  FROM auth.users u WHERE u.id = auth.uid();
  IF _email IS NULL OR _verified IS NULL THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.super_admin_allowlist a WHERE lower(a.email) = _email) THEN
    RETURN false;
  END IF;
  INSERT INTO public.academy_user_roles (user_id, role)
  VALUES (auth.uid(), 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END $$;

GRANT EXECUTE ON FUNCTION public.claim_super_admin() TO authenticated;