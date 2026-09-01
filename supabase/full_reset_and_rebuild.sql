-- =============================================================
-- United Sports Academy - Full Reset + Rebuild Schema
-- Purpose:
--   1) Deletes all existing objects in public schema.
--   2) Rebuilds a fresh, project-matched database structure.
--   3) Creates relationships between all relevant tables.
--   4) Keeps the design aligned with the app modules and roles.
-- Usage:
--   Run this script in the Supabase SQL editor or via psql.
-- =============================================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================
-- ENUMS
-- =============================================================
CREATE TYPE public.academy_role AS ENUM (
  'super_admin',
  'top_management',
  'branch_admin',
  'finance',
  'hr',
  'coach',
  'receptionist',
  'warehouse',
  'procurement',
  'maintenance',
  'tenant',
  'trainee'
);

-- =============================================================
-- CORE TABLES
-- =============================================================
CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text NOT NULL DEFAULT '',
  address text,
  phone text,
  email text,
  active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  pool_specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  phone text,
  language text NOT NULL DEFAULT 'en',
  default_branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.academy_role NOT NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, branch_id)
);

CREATE TABLE public.super_admin_allowlist (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.academy_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  email text,
  phone text,
  default_branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.academy_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.academy_role NOT NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, branch_id)
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, branch_id)
);

-- =============================================================
-- ACADEMY / TRAINING TABLES
-- =============================================================
CREATE TABLE public.ac_trainees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.ac_profiles(id) ON DELETE SET NULL,
  assigned_coach_id uuid REFERENCES public.ac_profiles(id) ON DELETE SET NULL,
  client_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  full_name_ar text,
  phone text,
  email text,
  gender text,
  birthdate date,
  address text,
  emergency_contact text,
  category text,
  skill_level text,
  medical_notes text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_skill_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ar text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  trainee_id uuid NOT NULL REFERENCES public.ac_trainees(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES public.ac_profiles(id) ON DELETE SET NULL,
  group_id uuid,
  lane_id uuid,
  time_slot_id uuid,
  schedule_slot_id uuid,
  package_name text NOT NULL,
  package_type text,
  total_sessions integer NOT NULL DEFAULT 0,
  used_sessions integer NOT NULL DEFAULT 0,
  price numeric(12,2) NOT NULL DEFAULT 0,
  paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_method text,
  receipt_number text,
  start_date date NOT NULL DEFAULT current_date,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  notes text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  trainee_id uuid REFERENCES public.ac_trainees(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.ac_subscriptions(id) ON DELETE SET NULL,
  invoice_number text NOT NULL UNIQUE,
  issue_date date NOT NULL DEFAULT current_date,
  due_date date,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_by uuid,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.ac_trainees(id) ON DELETE CASCADE,
  client_code text,
  person_name text,
  person_type text NOT NULL DEFAULT 'trainee',
  method text NOT NULL DEFAULT 'qr',
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  confirmed_by uuid,
  session_id uuid,
  session_label text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ar text,
  kind text NOT NULL DEFAULT 'cash',
  currency text NOT NULL DEFAULT 'SAR',
  active boolean NOT NULL DEFAULT true,
  opening_balance numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.ac_accounts(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES public.ac_invoices(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.ac_subscriptions(id) ON DELETE SET NULL,
  category_id uuid,
  kind text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'SAR',
  payment_method text,
  reference text,
  description text,
  tx_date date NOT NULL DEFAULT current_date,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ar text,
  category text,
  level text,
  color text,
  max_capacity integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ar text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_lanes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  pool_id uuid NOT NULL REFERENCES public.ac_pools(id) ON DELETE CASCADE,
  lane_number integer NOT NULL,
  name text,
  status text NOT NULL DEFAULT 'active',
  default_capacity integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pool_id, lane_number)
);

CREATE TABLE public.ac_time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  label text NOT NULL,
  day_of_week integer NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  trainee_id uuid NOT NULL REFERENCES public.ac_trainees(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES public.ac_profiles(id) ON DELETE SET NULL,
  assessment_date date NOT NULL DEFAULT current_date,
  skill_level_id uuid,
  technique_score numeric(5,2),
  speed_score numeric(5,2),
  endurance_score numeric(5,2),
  overall_score numeric(5,2),
  passed boolean,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_page_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL UNIQUE,
  label_ar text,
  is_public boolean NOT NULL DEFAULT false,
  allowed_roles public.academy_role[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  user_id uuid,
  kind text NOT NULL DEFAULT 'info',
  severity text NOT NULL DEFAULT 'normal',
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  actor_id uuid,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_qr_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  trainee_id uuid REFERENCES public.ac_trainees(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE public.ac_schedule_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  time_slot_id uuid REFERENCES public.ac_time_slots(id) ON DELETE CASCADE,
  lane_id uuid REFERENCES public.ac_lanes(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES public.ac_profiles(id) ON DELETE SET NULL,
  group_id uuid,
  capacity_override integer,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  user_id uuid,
  employee_code text,
  full_name text NOT NULL,
  full_name_ar text,
  department text,
  title text,
  phone text,
  email text,
  status text NOT NULL DEFAULT 'active',
  base_salary numeric(12,2) NOT NULL DEFAULT 0,
  hired_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_employee_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.ac_employees(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  check_in_at timestamptz,
  check_out_at timestamptz,
  status text NOT NULL DEFAULT 'present',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.ac_employees(id) ON DELETE CASCADE,
  leave_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.ac_payroll_runs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.ac_employees(id) ON DELETE CASCADE,
  base numeric(12,2) NOT NULL DEFAULT 0,
  allowances numeric(12,2) NOT NULL DEFAULT 0,
  deductions numeric(12,2) NOT NULL DEFAULT 0,
  net numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  address text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.ac_suppliers(id) ON DELETE SET NULL,
  order_number text NOT NULL UNIQUE,
  order_date date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'draft',
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.ac_purchase_orders(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  total_cost numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  category text,
  unit text,
  qty_on_hand integer NOT NULL DEFAULT 0,
  min_stock integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.ac_inventory_items(id) ON DELETE CASCADE,
  movement_type text NOT NULL,
  qty integer NOT NULL DEFAULT 0,
  reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_maintenance_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  status text NOT NULL DEFAULT 'active',
  last_service_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_maintenance_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES public.ac_maintenance_assets(id) ON DELETE SET NULL,
  title text NOT NULL,
  issue text,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_whatsapp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  templates jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_whatsapp_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  phone text NOT NULL,
  template_name text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ar text,
  agent_type text NOT NULL DEFAULT 'assistant',
  model text,
  system_prompt text,
  description text,
  description_ar text,
  is_active boolean NOT NULL DEFAULT true,
  trigger_event text,
  schedule_cron text,
  webhook_url text,
  max_tokens integer NOT NULL DEFAULT 2000,
  temperature numeric(3,2) NOT NULL DEFAULT 0.7,
  tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- WEBSITE / PUBLIC MODULES
-- =============================================================
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  title_ar text NOT NULL DEFAULT '',
  description text,
  description_ar text,
  icon text,
  gradient text,
  published boolean NOT NULL DEFAULT true,
  sort_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  title_ar text NOT NULL DEFAULT '',
  category text NOT NULL,
  category_ar text NOT NULL DEFAULT '',
  level text NOT NULL DEFAULT 'Beginner',
  mode text,
  schedule text,
  schedule_ar text,
  duration text,
  duration_ar text,
  venue text,
  venue_ar text,
  start_date date,
  end_date date,
  price numeric(12,2) NOT NULL DEFAULT 0,
  original_price numeric(12,2),
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  total_seats integer NOT NULL DEFAULT 0,
  seats_left integer NOT NULL DEFAULT 0,
  rating numeric(3,1),
  reviews jsonb,
  reviews_count integer,
  instructor jsonb,
  syllabus jsonb,
  gradient text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  title_ar text,
  excerpt text,
  excerpt_ar text,
  content text,
  content_ar text,
  cover_image text,
  author_name text,
  category text,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website_url text,
  tier text,
  published boolean NOT NULL DEFAULT true,
  sort_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  title_ar text,
  type text NOT NULL DEFAULT 'image',
  url text NOT NULL,
  thumbnail_url text,
  category text,
  published boolean NOT NULL DEFAULT true,
  sort_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.join_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  interest text,
  age integer,
  gender text,
  message text,
  type text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'new',
  notes text,
  extra jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- CRM / LEADS / CLIENTS / SCHEDULES
-- =============================================================
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  source text,
  service text,
  status text NOT NULL DEFAULT 'new',
  subscription_type text,
  offer_label text,
  offer_amount numeric(12,2),
  agent_id uuid,
  assigned_staff text,
  attended boolean,
  evaluation_date date,
  converted_client_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  actor_id uuid,
  kind text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  client_code text,
  full_name text NOT NULL,
  phone text,
  email text,
  coach_id uuid,
  level text,
  level_id uuid,
  age integer,
  birth_date date,
  address text,
  emergency_contact text,
  category text,
  assigned_staff text,
  membership_id text,
  medical_notes text,
  notes text,
  parent_name text,
  parent_phone text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.coaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  user_id uuid,
  full_name text NOT NULL,
  email text,
  phone text,
  role text,
  specialty text,
  certifications text,
  color text,
  active boolean NOT NULL DEFAULT true,
  max_sessions integer,
  day_groups text[] NOT NULL DEFAULT '{}',
  work_days text[] DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.schedule_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES public.coaches(id) ON DELETE SET NULL,
  title text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  capacity integer,
  pool_lane integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_code text,
  person_name text,
  person_type text NOT NULL DEFAULT 'client',
  method text NOT NULL DEFAULT 'qr',
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  confirmed_by uuid,
  session_id uuid REFERENCES public.schedule_sessions(id) ON DELETE SET NULL,
  session_label text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  subscription_id uuid,
  invoice_no text NOT NULL UNIQUE,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  description text,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'cash',
  receipt_no text NOT NULL UNIQUE,
  paid_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'paid',
  notes text,
  trainee_name text,
  phone text,
  membership_id text,
  session_time text,
  sessions_total integer,
  sessions_used integer,
  coach_name text,
  coach_id uuid,
  group_type text,
  training_days text,
  level text,
  skill_rating numeric(3,1),
  category text,
  client_code text,
  emergency_contact text,
  address text,
  age integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.schedule_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.schedule_sessions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'booked',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trainee_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  trainee_id uuid REFERENCES public.ac_trainees(id) ON DELETE CASCADE,
  evaluator_id uuid,
  score numeric(5,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  trainee_id uuid REFERENCES public.ac_trainees(id) ON DELETE CASCADE,
  coach_id uuid,
  score numeric(5,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- HR / PAYROLL / OPERATIONS
-- =============================================================
CREATE TABLE public.hr_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  user_id uuid,
  full_name text NOT NULL,
  phone text,
  email text,
  position text,
  base_salary numeric(12,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  hired_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hr_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  check_in timestamptz,
  check_out timestamptz,
  hours numeric(5,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hr_leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  leave_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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

CREATE TABLE public.payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  base numeric(12,2) NOT NULL DEFAULT 0,
  allowances numeric(12,2) NOT NULL DEFAULT 0,
  deductions numeric(12,2) NOT NULL DEFAULT 0,
  net numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.group_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  max_capacity integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.staff_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  staff_name text NOT NULL,
  staff_role text,
  day_group text,
  time_slot text,
  hours numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.coach_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  coach_id uuid,
  coach_name text,
  day_group text NOT NULL,
  time_slot text NOT NULL,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.coach_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  coach_id uuid,
  coach_name text,
  evaluated_at date NOT NULL,
  punctuality integer NOT NULL DEFAULT 0,
  communication integer NOT NULL DEFAULT 0,
  technical integer NOT NULL DEFAULT 0,
  students integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pool_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  measured_at timestamptz NOT NULL,
  ph numeric(4,2),
  chlorine numeric(4,2),
  temperature numeric(4,2),
  turbidity numeric(4,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lane_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES public.coaches(id) ON DELETE SET NULL,
  pool_lane integer NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  activity text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.page_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL UNIQUE,
  label_ar text,
  is_public boolean NOT NULL DEFAULT false,
  allowed_roles public.academy_role[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.skill_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  actor_id uuid,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- SECURITY / FUNCTIONS / TRIGGERS
-- =============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.claim_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_user_id uuid;
BEGIN
  v_email := lower(current_user);

  IF v_email IS NULL THEN
    RETURN false;
  END IF;

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = v_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.ac_user_roles (user_id, role, branch_id)
  VALUES (v_user_id, 'super_admin', NULL)
  ON CONFLICT (user_id, role, branch_id) DO NOTHING;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ac_user_roles r
    WHERE r.user_id = _user_id
      AND r.role = 'super_admin'
  );
$$;

-- =============================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================
DO $$
DECLARE
  table_names text[] := ARRAY[
    'branches',
    'ac_profiles',
    'ac_user_roles',
    'academy_profiles',
    'academy_user_roles',
    'ac_trainees',
    'ac_skill_levels',
    'ac_subscriptions',
    'ac_invoices',
    'ac_attendance',
    'ac_accounts',
    'ac_transactions',
    'ac_groups',
    'ac_pools',
    'ac_lanes',
    'ac_time_slots',
    'ac_assessments',
    'ac_page_permissions',
    'ac_notifications',
    'ac_ai_agents',
    'site_settings',
    'programs',
    'courses',
    'blog_posts',
    'partners',
    'media_items',
    'join_submissions',
    'leads',
    'lead_interactions',
    'clients',
    'coaches',
    'schedule_sessions',
    'attendance',
    'invoices',
    'payments',
    'hr_employees',
    'hr_leaves',
    'payroll_runs',
    'group_types',
    'staff_hours',
    'coach_slots',
    'coach_evaluations',
    'page_permissions',
    'skill_levels',
    'audit_log'
  ];
  current_table text;
BEGIN
  FOREACH current_table IN ARRAY table_names LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = current_table
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
        current_table,
        current_table
      );
    END IF;
  END LOOP;
END $$;

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_branches_active ON public.branches(active, deleted_at);
CREATE INDEX IF NOT EXISTS idx_ac_profiles_user_id ON public.ac_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ac_user_roles_user_id ON public.ac_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_ac_trainees_branch_active ON public.ac_trainees(branch_id, active, deleted_at);
CREATE INDEX IF NOT EXISTS idx_ac_subscriptions_branch_status ON public.ac_subscriptions(branch_id, status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_ac_invoices_branch_date ON public.ac_invoices(branch_id, issue_date);
CREATE INDEX IF NOT EXISTS idx_ac_attendance_branch_time ON public.ac_attendance(branch_id, checked_in_at);
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(published);
CREATE INDEX IF NOT EXISTS idx_blog_published ON public.blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_leads_branch_status ON public.leads(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_branch_name ON public.clients(branch_id, full_name);
CREATE INDEX IF NOT EXISTS idx_schedule_branch_time ON public.schedule_sessions(branch_id, start_at);
CREATE INDEX IF NOT EXISTS idx_hr_employees_branch ON public.hr_employees(branch_id, active);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_branch ON public.payroll_runs(branch_id, period_start);
CREATE INDEX IF NOT EXISTS idx_skill_levels_sort ON public.skill_levels(sort_order);

-- =============================================================
-- RLS
-- =============================================================
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_trainees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_lanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'branches' AND policyname = 'branches_authenticated_all'
  ) THEN
    CREATE POLICY "branches_authenticated_all" ON public.branches
      FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'courses' AND policyname = 'courses_authenticated_all'
  ) THEN
    CREATE POLICY "courses_authenticated_all" ON public.courses
      FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'join_submissions' AND policyname = 'join_submissions_authenticated_all'
  ) THEN
    CREATE POLICY "join_submissions_authenticated_all" ON public.join_submissions
      FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- =============================================================
-- SEED DATA (optional but useful for fresh setup)
-- =============================================================
INSERT INTO public.branches (id, name, name_ar, address, phone, email, active, sort_order, pool_specs, settings)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'Riyadh Central', 'الرياض المركز', 'King Fahd Road, Riyadh', '+966500100001', 'riyadh@unitedsports.sa', true, 1, '{"pools": 2, "lanes": 6}'::jsonb, '{"timezone":"Asia/Riyadh","currency":"SAR"}'::jsonb),
  ('22222222-2222-4222-8222-222222222222', 'Jeddah Marina', 'جدة الميناء', 'Red Sea Road, Jeddah', '+966500100002', 'jeddah@unitedsports.sa', true, 2, '{"pools": 1, "lanes": 4}'::jsonb, '{"timezone":"Asia/Riyadh","currency":"SAR"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.site_settings (key, value)
VALUES
  ('site_name', '{"en":"United Sports Academy","ar":"أكاديمية يونايتد سبورتس"}'::jsonb),
  ('contact_phone', '"+966500100099"'::jsonb),
  ('default_currency', '"SAR"'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.programs (id, slug, title, title_ar, description, description_ar, icon, gradient, published, sort_order)
VALUES
  ('33333333-3333-4333-8333-333333333333', 'swimming', 'Swimming', 'سباحة', 'Professional swimming programs.', 'برامج سباحة احترافية.', 'waves', 'from-cyan-500 to-blue-600', true, 1),
  ('44444444-4444-4444-8444-444444444444', 'fitness', 'Fitness', 'لياقة', 'Strength and conditioning programs.', 'برامج القوة واللياقة.', 'dumbbell', 'from-orange-500 to-red-600', true, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.courses (id, slug, title, title_ar, category, category_ar, level, mode, schedule, schedule_ar, duration, duration_ar, venue, venue_ar, start_date, end_date, price, original_price, featured, published, total_seats, seats_left, rating, reviews_count, gradient)
VALUES
  ('55555555-5555-4555-8555-555555555555', 'swim-foundations', 'Swim Foundations', 'أساسيات السباحة', 'Swimming', 'سباحة', 'Beginner', 'In Person', 'Mon/Wed/Fri', 'الإثنين والأربعاء والجمعة', '8 Weeks', '8 أسابيع', 'Riyadh Pool A', 'حمام الرياض A', '2026-09-10', '2026-11-05', 1200.00, 1500.00, true, true, 20, 12, 4.8, 2, 'from-cyan-500 to-blue-600')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.skill_levels (id, name, name_ar, sort_order)
VALUES
  ('66666666-6666-4666-8666-666666666666', 'Beginner', 'مبتدئ', 1),
  ('77777777-7777-4777-8777-777777777777', 'Intermediate', 'متوسط', 2),
  ('88888888-8888-4888-8888-888888888888', 'Advanced', 'متقدم', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.page_permissions (id, path, label_ar, is_public, allowed_roles)
VALUES
  ('99999999-9999-4999-8999-999999999999', '/admin', 'لوحة الإدارة', false, '{super_admin,branch_admin,finance,hr,coach,receptionist}'::public.academy_role[]),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '/programs', 'البرامج', true, '{}'::public.academy_role[]),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '/academy', 'الأكاديمية', false, '{super_admin,branch_admin,coach,hr}'::public.academy_role[])
ON CONFLICT (id) DO NOTHING;

SELECT 'full_reset_and_rebuild_sql_loaded' AS status;
