
-- Helper: canonical branch-scoped policy pattern
-- Shared trigger for updated_at
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Client code generator
CREATE OR REPLACE FUNCTION public.gen_client_code() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT 'CL-' || upper(substring(md5(random()::text || clock_timestamp()::text) for 6));
$$;

-- Skill levels
CREATE TABLE public.skill_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, name_ar text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.skill_levels TO anon, authenticated;
GRANT ALL ON public.skill_levels TO authenticated, service_role;
ALTER TABLE public.skill_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.skill_levels FOR SELECT USING (true);
CREATE POLICY "super manage" ON public.skill_levels FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- Coaches
CREATE TABLE public.coaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  user_id uuid,
  full_name text NOT NULL,
  phone text, email text,
  specialty text,
  certifications text,
  max_sessions int DEFAULT 20,
  work_days text[] DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coaches TO authenticated;
GRANT ALL ON public.coaches TO service_role;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branch scoped rw" ON public.coaches FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));
CREATE TRIGGER trg_coaches_updated BEFORE UPDATE ON public.coaches FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Clients (Trainees)
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  client_code text NOT NULL UNIQUE DEFAULT public.gen_client_code(),
  full_name text NOT NULL,
  phone text, email text,
  birth_date date, gender text,
  level_id uuid REFERENCES public.skill_levels(id),
  coach_id uuid REFERENCES public.coaches(id),
  parent_name text, parent_phone text,
  medical_notes text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branch scoped rw" ON public.clients FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Leads
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text, email text,
  service text, source text,
  agent_id uuid,
  status text NOT NULL DEFAULT 'warm',
  evaluation_date date,
  attended boolean DEFAULT false,
  offer_amount numeric,
  notes text,
  converted_client_id uuid REFERENCES public.clients(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branch scoped rw" ON public.leads FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Lead interactions log
CREATE TABLE public.lead_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  kind text NOT NULL,
  note text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_interactions TO authenticated;
GRANT ALL ON public.lead_interactions TO service_role;
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rw via lead" ON public.lead_interactions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND (public.is_super_admin(auth.uid()) OR l.branch_id IN (SELECT private.user_branch_ids(auth.uid())))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND (public.is_super_admin(auth.uid()) OR l.branch_id IN (SELECT private.user_branch_ids(auth.uid())))));

-- Subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plan text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branch scoped rw" ON public.subscriptions FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Invoices
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  invoice_no text NOT NULL DEFAULT ('INV-' || upper(substring(md5(random()::text) for 8))),
  client_id uuid REFERENCES public.clients(id),
  subscription_id uuid REFERENCES public.subscriptions(id),
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unpaid',
  due_date date,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branch scoped rw" ON public.invoices FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));
CREATE TRIGGER trg_inv_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Payments (Receipts)
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  receipt_no text NOT NULL DEFAULT ('RCP-' || upper(substring(md5(random()::text) for 8))),
  invoice_id uuid REFERENCES public.invoices(id),
  client_id uuid REFERENCES public.clients(id),
  amount numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'cash',
  paid_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branch scoped rw" ON public.payments FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));

-- Schedule sessions
CREATE TABLE public.schedule_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  title text NOT NULL,
  coach_id uuid REFERENCES public.coaches(id),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  pool_lane int,
  capacity int DEFAULT 10,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_sessions TO authenticated;
GRANT ALL ON public.schedule_sessions TO service_role;
ALTER TABLE public.schedule_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branch scoped rw" ON public.schedule_sessions FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));
CREATE TRIGGER trg_sched_updated BEFORE UPDATE ON public.schedule_sessions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Attendance
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.schedule_sessions(id),
  method text NOT NULL DEFAULT 'manual',
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  confirmed_by uuid,
  confirmed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branch scoped rw" ON public.attendance FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));

-- Lane logs
CREATE TABLE public.lane_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  pool_lane int NOT NULL,
  coach_id uuid REFERENCES public.coaches(id),
  start_at timestamptz NOT NULL DEFAULT now(),
  end_at timestamptz,
  activity text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lane_logs TO authenticated;
GRANT ALL ON public.lane_logs TO service_role;
ALTER TABLE public.lane_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branch scoped rw" ON public.lane_logs FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));

-- Assessments
CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES public.coaches(id),
  technique int, endurance int, speed int, overall int,
  passed boolean DEFAULT false,
  level_id uuid REFERENCES public.skill_levels(id),
  notes text,
  assessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT ALL ON public.assessments TO service_role;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branch scoped rw" ON public.assessments FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));

-- Pool operations sessions (water quality)
CREATE TABLE public.pool_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  measured_at timestamptz NOT NULL DEFAULT now(),
  chlorine numeric, ph numeric, temperature numeric,
  turbidity numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pool_sessions TO authenticated;
GRANT ALL ON public.pool_sessions TO service_role;
ALTER TABLE public.pool_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branch scoped rw" ON public.pool_sessions FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));

-- HR employees
CREATE TABLE public.hr_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  user_id uuid,
  full_name text NOT NULL,
  position text,
  phone text, email text,
  base_salary numeric NOT NULL DEFAULT 0,
  hired_at date,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_employees TO authenticated;
GRANT ALL ON public.hr_employees TO service_role;
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branch scoped rw" ON public.hr_employees FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));
CREATE TRIGGER trg_emp_updated BEFORE UPDATE ON public.hr_employees FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- HR attendance
CREATE TABLE public.hr_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  work_date date NOT NULL DEFAULT current_date,
  check_in timestamptz,
  check_out timestamptz,
  hours numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_attendance TO authenticated;
GRANT ALL ON public.hr_attendance TO service_role;
ALTER TABLE public.hr_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branch scoped rw" ON public.hr_attendance FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));

-- HR leaves
CREATE TABLE public.hr_leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  leave_type text NOT NULL DEFAULT 'annual',
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reason text,
  approved_by uuid, approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_leaves TO authenticated;
GRANT ALL ON public.hr_leaves TO service_role;
ALTER TABLE public.hr_leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branch scoped rw" ON public.hr_leaves FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));
CREATE TRIGGER trg_lv_updated BEFORE UPDATE ON public.hr_leaves FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Payroll runs
CREATE TABLE public.payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_runs TO authenticated;
GRANT ALL ON public.payroll_runs TO service_role;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branch scoped rw" ON public.payroll_runs FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));
CREATE TRIGGER trg_pr_updated BEFORE UPDATE ON public.payroll_runs FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Payroll items
CREATE TABLE public.payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id),
  base numeric NOT NULL DEFAULT 0,
  allowances numeric NOT NULL DEFAULT 0,
  deductions numeric NOT NULL DEFAULT 0,
  net numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_items TO authenticated;
GRANT ALL ON public.payroll_items TO service_role;
ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rw via run" ON public.payroll_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.payroll_runs r WHERE r.id = run_id AND (public.is_super_admin(auth.uid()) OR r.branch_id IN (SELECT private.user_branch_ids(auth.uid())))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.payroll_runs r WHERE r.id = run_id AND (public.is_super_admin(auth.uid()) OR r.branch_id IN (SELECT private.user_branch_ids(auth.uid())))));

-- Academy notifications
CREATE TABLE public.academy_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  audience text NOT NULL DEFAULT 'all',
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_notifications TO authenticated;
GRANT ALL ON public.academy_notifications TO service_role;
ALTER TABLE public.academy_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branch scoped rw" ON public.academy_notifications FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IS NULL OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));

-- Seed skill levels
INSERT INTO public.skill_levels (name, name_ar, sort_order) VALUES
  ('Beginner','مبتدئ',1),
  ('Intermediate','متوسط',2),
  ('Advanced','متقدم',3),
  ('Elite','نخبة',4);
