-- =============================================================
-- United Sports Academy - Live Seed + Full System Schema
-- Purpose: create the full project schema and insert a lightweight seed
-- set that works for a live Supabase project without bloating the DB.
-- Safe to run multiple times because of IF NOT EXISTS guards.
-- =============================================================

create extension if not exists pgcrypto;

-- =============================================================
-- Enum
-- =============================================================
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'academy_role'
  ) then
    create type public.academy_role as enum (
      'admin',
      'manager',
      'coach',
      'staff',
      'viewer'
    );
  end if;
end $$;

-- =============================================================
-- Core tables
-- =============================================================
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ar text not null default '',
  address text,
  phone text,
  email text,
  active boolean not null default true,
  deleted_at timestamptz,
  sort_order integer not null default 0,
  pool_specs jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  full_name text,
  phone text,
  language text not null default 'en',
  default_branch_id uuid references public.branches(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.academy_role not null,
  branch_id uuid references public.branches(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, role, branch_id)
);

create table if not exists public.ac_trainees (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  profile_id uuid references public.ac_profiles(id) on delete set null,
  assigned_coach_id uuid references public.ac_profiles(id) on delete set null,
  client_code text not null unique,
  full_name text not null,
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
  active boolean not null default true,
  deleted_at timestamptz,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_subscriptions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  trainee_id uuid not null references public.ac_trainees(id) on delete cascade,
  coach_id uuid references public.ac_profiles(id) on delete set null,
  group_id uuid,
  lane_id uuid,
  time_slot_id uuid,
  schedule_slot_id uuid,
  package_name text not null,
  package_type text,
  total_sessions integer not null default 0,
  used_sessions integer not null default 0,
  price numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  payment_method text,
  receipt_number text,
  start_date date not null default current_date,
  end_date date,
  status text not null default 'active',
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_invoices (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  trainee_id uuid references public.ac_trainees(id) on delete set null,
  subscription_id uuid references public.ac_subscriptions(id) on delete set null,
  invoice_number text not null unique,
  issue_date date not null default current_date,
  due_date date,
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  status text not null default 'pending',
  items jsonb not null default '[]'::jsonb,
  notes text,
  created_by uuid,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_attendance (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  client_id uuid not null references public.ac_trainees(id) on delete cascade,
  client_code text,
  person_name text,
  person_type text not null default 'trainee',
  method text not null default 'qr',
  checked_in_at timestamptz not null default now(),
  confirmed_at timestamptz,
  confirmed_by uuid,
  session_id uuid,
  session_label text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_accounts (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  name text not null,
  name_ar text,
  kind text not null default 'cash',
  currency text not null default 'SAR',
  active boolean not null default true,
  opening_balance numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_transactions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  account_id uuid references public.ac_accounts(id) on delete set null,
  invoice_id uuid references public.ac_invoices(id) on delete set null,
  subscription_id uuid references public.ac_subscriptions(id) on delete set null,
  category_id uuid,
  kind text not null,
  amount numeric(12,2) not null default 0,
  currency text not null default 'SAR',
  payment_method text,
  reference text,
  description text,
  tx_date date not null default current_date,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_groups (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  name text not null,
  name_ar text,
  category text,
  level text,
  color text,
  max_capacity integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_pools (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  name text not null,
  name_ar text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_lanes (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  pool_id uuid not null references public.ac_pools(id) on delete cascade,
  lane_number integer not null,
  name text,
  status text not null default 'active',
  default_capacity integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pool_id, lane_number)
);

create table if not exists public.ac_time_slots (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  label text not null,
  day_of_week integer not null,
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_assessments (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  trainee_id uuid not null references public.ac_trainees(id) on delete cascade,
  coach_id uuid references public.ac_profiles(id) on delete set null,
  assessment_date date not null default current_date,
  skill_level_id uuid,
  technique_score numeric(5,2),
  speed_score numeric(5,2),
  endurance_score numeric(5,2),
  overall_score numeric(5,2),
  passed boolean,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================
-- Site/public tables
-- =============================================================
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  title_ar text not null default '',
  description text,
  description_ar text,
  icon text,
  gradient text,
  published boolean not null default true,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  title_ar text not null default '',
  category text not null,
  category_ar text not null default '',
  level text not null default 'Beginner',
  mode text,
  schedule text,
  schedule_ar text,
  duration text,
  duration_ar text,
  venue text,
  venue_ar text,
  start_date date,
  end_date date,
  price numeric(12,2) not null default 0,
  original_price numeric(12,2),
  featured boolean not null default false,
  published boolean not null default true,
  total_seats integer not null default 0,
  seats_left integer not null default 0,
  rating numeric(3,1),
  reviews jsonb,
  reviews_count integer,
  instructor jsonb,
  syllabus jsonb,
  gradient text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  title_ar text,
  excerpt text,
  excerpt_ar text,
  content text,
  content_ar text,
  cover_image text,
  author_name text,
  category text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website_url text,
  tier text,
  published boolean not null default true,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  title text,
  title_ar text,
  type text not null default 'image',
  url text not null,
  thumbnail_url text,
  category text,
  published boolean not null default true,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.join_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  interest text,
  age integer,
  gender text,
  message text,
  type text not null default 'general',
  status text not null default 'new',
  notes text,
  extra jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  source text,
  service text,
  status text not null default 'new',
  subscription_type text,
  offer_label text,
  offer_amount numeric(12,2),
  agent_id uuid,
  assigned_staff text,
  attended boolean,
  evaluation_date date,
  converted_client_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  actor_id uuid,
  kind text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  client_code text,
  full_name text not null,
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
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coaches (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  user_id uuid,
  full_name text not null,
  email text,
  phone text,
  role text,
  specialty text,
  certifications text,
  color text,
  active boolean not null default true,
  max_sessions integer,
  day_groups text[] not null default '{}',
  work_days text[] default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.schedule_sessions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  coach_id uuid references public.coaches(id) on delete set null,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  capacity integer,
  pool_lane integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  client_code text,
  person_name text,
  person_type text not null default 'client',
  method text not null default 'qr',
  checked_in_at timestamptz not null default now(),
  confirmed_at timestamptz,
  confirmed_by uuid,
  session_id uuid references public.schedule_sessions(id) on delete set null,
  session_label text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  subscription_id uuid,
  invoice_no text not null unique,
  amount numeric(12,2) not null default 0,
  status text not null default 'pending',
  description text,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  amount numeric(12,2) not null default 0,
  method text not null default 'cash',
  receipt_no text not null unique,
  paid_at timestamptz not null default now(),
  status text not null default 'paid',
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
  created_at timestamptz not null default now()
);

create table if not exists public.hr_employees (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  user_id uuid,
  full_name text not null,
  phone text,
  email text,
  position text,
  base_salary numeric(12,2) not null default 0,
  active boolean not null default true,
  hired_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_attendance (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  work_date date not null,
  check_in timestamptz,
  check_out timestamptz,
  hours numeric(5,2),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_leaves (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status text not null default 'pending',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.payroll_runs(id) on delete cascade,
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  base numeric(12,2) not null default 0,
  allowances numeric(12,2) not null default 0,
  deductions numeric(12,2) not null default 0,
  net numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.group_types (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  name text not null,
  max_capacity integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_hours (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  staff_name text not null,
  staff_role text,
  day_group text,
  time_slot text,
  hours numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_slots (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  coach_id uuid,
  coach_name text,
  day_group text not null,
  time_slot text not null,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_evaluations (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  coach_id uuid,
  coach_name text,
  evaluated_at date not null,
  punctuality integer not null default 0,
  communication integer not null default 0,
  technical integer not null default 0,
  students integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pool_sessions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  measured_at timestamptz not null,
  ph numeric(4,2),
  chlorine numeric(4,2),
  temperature numeric(4,2),
  turbidity numeric(4,2),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.lane_logs (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  coach_id uuid references public.coaches(id) on delete set null,
  pool_lane integer not null,
  start_at timestamptz not null,
  end_at timestamptz,
  activity text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.page_permissions (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  label_ar text,
  is_public boolean not null default false,
  allowed_roles public.academy_role[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skill_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ar text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity text not null,
  entity_id uuid,
  actor_id uuid,
  branch_id uuid references public.branches(id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_employee_attendance (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  employee_id uuid,
  check_in_at timestamptz,
  check_out_at timestamptz,
  status text not null default 'present',
  notes text,
  created_at timestamptz not null default now()
);

-- =============================================================
-- Update trigger helper
-- =============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =============================================================
-- Trigger creation
-- =============================================================
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_branches_updated_at') then
    create trigger trg_branches_updated_at before update on public.branches for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_ac_profiles_updated_at') then
    create trigger trg_ac_profiles_updated_at before update on public.ac_profiles for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_ac_trainees_updated_at') then
    create trigger trg_ac_trainees_updated_at before update on public.ac_trainees for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_ac_subscriptions_updated_at') then
    create trigger trg_ac_subscriptions_updated_at before update on public.ac_subscriptions for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_ac_invoices_updated_at') then
    create trigger trg_ac_invoices_updated_at before update on public.ac_invoices for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_ac_accounts_updated_at') then
    create trigger trg_ac_accounts_updated_at before update on public.ac_accounts for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_ac_transactions_updated_at') then
    create trigger trg_ac_transactions_updated_at before update on public.ac_transactions for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_ac_groups_updated_at') then
    create trigger trg_ac_groups_updated_at before update on public.ac_groups for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_ac_pools_updated_at') then
    create trigger trg_ac_pools_updated_at before update on public.ac_pools for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_ac_lanes_updated_at') then
    create trigger trg_ac_lanes_updated_at before update on public.ac_lanes for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_ac_time_slots_updated_at') then
    create trigger trg_ac_time_slots_updated_at before update on public.ac_time_slots for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_ac_assessments_updated_at') then
    create trigger trg_ac_assessments_updated_at before update on public.ac_assessments for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_site_settings_updated_at') then
    create trigger trg_site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_programs_updated_at') then
    create trigger trg_programs_updated_at before update on public.programs for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_courses_updated_at') then
    create trigger trg_courses_updated_at before update on public.courses for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_blog_posts_updated_at') then
    create trigger trg_blog_posts_updated_at before update on public.blog_posts for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_partners_updated_at') then
    create trigger trg_partners_updated_at before update on public.partners for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_media_items_updated_at') then
    create trigger trg_media_items_updated_at before update on public.media_items for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_join_submissions_updated_at') then
    create trigger trg_join_submissions_updated_at before update on public.join_submissions for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_leads_updated_at') then
    create trigger trg_leads_updated_at before update on public.leads for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_clients_updated_at') then
    create trigger trg_clients_updated_at before update on public.clients for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_coaches_updated_at') then
    create trigger trg_coaches_updated_at before update on public.coaches for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_schedule_sessions_updated_at') then
    create trigger trg_schedule_sessions_updated_at before update on public.schedule_sessions for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_invoices_updated_at') then
    create trigger trg_invoices_updated_at before update on public.invoices for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_hr_employees_updated_at') then
    create trigger trg_hr_employees_updated_at before update on public.hr_employees for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_hr_leaves_updated_at') then
    create trigger trg_hr_leaves_updated_at before update on public.hr_leaves for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_payroll_runs_updated_at') then
    create trigger trg_payroll_runs_updated_at before update on public.payroll_runs for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_group_types_updated_at') then
    create trigger trg_group_types_updated_at before update on public.group_types for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_staff_hours_updated_at') then
    create trigger trg_staff_hours_updated_at before update on public.staff_hours for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_coach_slots_updated_at') then
    create trigger trg_coach_slots_updated_at before update on public.coach_slots for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_coach_evaluations_updated_at') then
    create trigger trg_coach_evaluations_updated_at before update on public.coach_evaluations for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_page_permissions_updated_at') then
    create trigger trg_page_permissions_updated_at before update on public.page_permissions for each row execute function public.set_updated_at();
  end if;
end $$;

-- =============================================================
-- Indexes
-- =============================================================
create index if not exists idx_branches_active on public.branches(active);
create index if not exists idx_trainees_branch_active on public.ac_trainees(branch_id, active, deleted_at);
create index if not exists idx_subscriptions_branch_status on public.ac_subscriptions(branch_id, status, deleted_at);
create index if not exists idx_invoices_branch_issue_date on public.ac_invoices(branch_id, issue_date);
create index if not exists idx_attendance_branch_checked_in on public.ac_attendance(branch_id, checked_in_at);
create index if not exists idx_leads_branch_status on public.leads(branch_id, status);
create index if not exists idx_courses_published on public.courses(published);
create index if not exists idx_blog_published on public.blog_posts(published);
create index if not exists idx_clients_branch_full_name on public.clients(branch_id, full_name);
create index if not exists idx_coaches_branch_active on public.coaches(branch_id, active);
create index if not exists idx_schedule_branch on public.schedule_sessions(branch_id, start_at);

-- =============================================================
-- RLS + basic auth policies
-- =============================================================
alter table public.branches enable row level security;
alter table public.ac_profiles enable row level security;
alter table public.ac_user_roles enable row level security;
alter table public.ac_trainees enable row level security;
alter table public.ac_subscriptions enable row level security;
alter table public.ac_invoices enable row level security;
alter table public.ac_attendance enable row level security;
alter table public.ac_accounts enable row level security;
alter table public.ac_transactions enable row level security;
alter table public.ac_groups enable row level security;
alter table public.ac_pools enable row level security;
alter table public.ac_lanes enable row level security;
alter table public.ac_time_slots enable row level security;
alter table public.ac_assessments enable row level security;
alter table public.site_settings enable row level security;
alter table public.programs enable row level security;
alter table public.courses enable row level security;
alter table public.blog_posts enable row level security;
alter table public.partners enable row level security;
alter table public.media_items enable row level security;
alter table public.join_submissions enable row level security;
alter table public.leads enable row level security;
alter table public.lead_interactions enable row level security;
alter table public.clients enable row level security;
alter table public.coaches enable row level security;
alter table public.schedule_sessions enable row level security;
alter table public.attendance enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.hr_employees enable row level security;
alter table public.hr_attendance enable row level security;
alter table public.hr_leaves enable row level security;
alter table public.payroll_runs enable row level security;
alter table public.payroll_items enable row level security;
alter table public.group_types enable row level security;
alter table public.staff_hours enable row level security;
alter table public.coach_slots enable row level security;
alter table public.coach_evaluations enable row level security;
alter table public.pool_sessions enable row level security;
alter table public.lane_logs enable row level security;
alter table public.page_permissions enable row level security;
alter table public.skill_levels enable row level security;
alter table public.audit_log enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='branches' and policyname='branches_all_authenticated') then
    create policy "branches_all_authenticated" on public.branches for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ac_trainees' and policyname='ac_trainees_all_authenticated') then
    create policy "ac_trainees_all_authenticated" on public.ac_trainees for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ac_subscriptions' and policyname='ac_subscriptions_all_authenticated') then
    create policy "ac_subscriptions_all_authenticated" on public.ac_subscriptions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ac_invoices' and policyname='ac_invoices_all_authenticated') then
    create policy "ac_invoices_all_authenticated" on public.ac_invoices for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='join_submissions' and policyname='join_submissions_all_authenticated') then
    create policy "join_submissions_all_authenticated" on public.join_submissions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='leads' and policyname='leads_all_authenticated') then
    create policy "leads_all_authenticated" on public.leads for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='clients' and policyname='clients_all_authenticated') then
    create policy "clients_all_authenticated" on public.clients for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='courses' and policyname='courses_all_authenticated') then
    create policy "courses_all_authenticated" on public.courses for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='blog_posts' and policyname='blog_posts_all_authenticated') then
    create policy "blog_posts_all_authenticated" on public.blog_posts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
end $$;

-- =============================================================
-- Seed data for live project demo
-- =============================================================
insert into public.branches (id, name, name_ar, address, phone, email, active, sort_order, pool_specs, settings)
values
  ('11111111-1111-4111-8111-111111111111', 'Riyadh Central', 'الرياض المركز', 'King Fahd Road, Riyadh', '+966500100001', 'riyadh@unitedsports.sa', true, 1, '{"pools": 2, "lanes": 6}'::jsonb, '{"timezone":"Asia/Riyadh","currency":"SAR"}'::jsonb),
  ('22222222-2222-4222-8222-222222222222', 'Jeddah Marina', 'جدة الميناء', 'Corniche Road, Jeddah', '+966500100002', 'jeddah@unitedsports.sa', true, 2, '{"pools": 1, "lanes": 4}'::jsonb, '{"timezone":"Asia/Riyadh","currency":"SAR"}'::jsonb)
on conflict (id) do nothing;

insert into public.ac_profiles (id, user_id, full_name, phone, language, default_branch_id)
values
  ('33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444', 'Ahmed Alqahtani', '+966500200001', 'en', '11111111-1111-4111-8111-111111111111'),
  ('55555555-5555-4555-8555-555555555555', '66666666-6666-4666-8666-666666666666', 'Sara Alhassan', '+966500200002', 'ar', '11111111-1111-4111-8111-111111111111')
on conflict (id) do nothing;

insert into public.ac_user_roles (id, user_id, role, branch_id)
values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '44444444-4444-4444-8444-444444444444', 'admin', '11111111-1111-4111-8111-111111111111'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '66666666-6666-4666-8666-666666666666', 'manager', '11111111-1111-4111-8111-111111111111')
on conflict (id) do nothing;

insert into public.ac_trainees (id, branch_id, profile_id, assigned_coach_id, client_code, full_name, full_name_ar, phone, email, gender, birthdate, address, emergency_contact, category, skill_level, notes, active)
values
  ('f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f0f0', '11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', 'USA-1001', 'Ali Samir', 'علي سمير', '+966500300001', 'ali.sam@demo.com', 'male', '2010-04-12', 'Al Malqa, Riyadh', '+966500300011', 'swimming', 'Beginner', 'Prefers morning sessions', true),
  ('f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', '22222222-2222-4222-8222-222222222222', '55555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', 'USA-2001', 'Omar Saleh', 'عمر صالح', '+966500300003', 'omar.s@demo.com', 'male', '2008-09-21', 'Corniche, Jeddah', '+966500300013', 'fitness', 'Advanced', 'Strong endurance', true)
on conflict (id) do nothing;

insert into public.ac_subscriptions (id, branch_id, trainee_id, coach_id, package_name, package_type, total_sessions, used_sessions, price, paid_amount, payment_method, receipt_number, start_date, end_date, status, notes)
values
  ('a1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f0f0', '33333333-3333-4333-8333-333333333333', 'Starter Swim', 'monthly', 12, 4, 950.00, 950.00, 'card', 'RCPT-001', '2026-09-01', '2026-10-01', 'active', 'Monthly package'),
  ('a3333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', '55555555-5555-4555-8555-555555555555', 'Elite Fitness', 'monthly', 16, 9, 1800.00, 1800.00, 'cash', 'RCPT-002', '2026-09-01', '2026-10-15', 'active', 'Fitness contract')
on conflict (id) do nothing;

insert into public.ac_invoices (id, branch_id, trainee_id, subscription_id, invoice_number, issue_date, due_date, subtotal, tax, discount, total, paid_amount, status, items, notes, created_by)
values
  ('b1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f0f0', 'a1111111-1111-4111-8111-111111111111', 'INV-2026-001', '2026-09-01', '2026-09-15', 950.00, 0.00, 0.00, 950.00, 950.00, 'paid', '[{"item":"Starter Swim","qty":1,"price":950}]'::jsonb, 'Monthly invoice', '33333333-3333-4333-8333-333333333333'),
  ('b2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', 'a3333333-3333-4333-8333-333333333333', 'INV-2026-002', '2026-09-01', '2026-09-20', 1800.00, 0.00, 0.00, 1800.00, 1800.00, 'paid', '[{"item":"Elite Fitness","qty":1,"price":1800}]'::jsonb, 'Fitness contract', '55555555-5555-4555-8555-555555555555')
on conflict (id) do nothing;

insert into public.site_settings (key, value)
values
  ('site_name', '{"en":"United Sports Academy","ar":"أكاديمية يونايتد سبورتس"}'::jsonb),
  ('default_currency', '"SAR"'::jsonb),
  ('contact_phone', '"+966500100099"'::jsonb)
on conflict (key) do nothing;

insert into public.programs (id, slug, title, title_ar, description, description_ar, icon, gradient, published, sort_order)
values
  ('l1111111-1111-4111-8111-111111111111', 'swimming', 'Swimming', 'سباحة', 'Professional swimming training.', 'تدريب سباحة احترافي.', 'waves', 'from-cyan-500 to-blue-600', true, 1),
  ('l2222222-2222-4222-8222-222222222222', 'fitness', 'Fitness', 'لياقة', 'Strength and conditioning.', 'تمارين القوة والتحمل.', 'dumbbell', 'from-orange-500 to-red-600', true, 2)
on conflict (id) do nothing;

insert into public.courses (id, slug, title, title_ar, category, category_ar, level, mode, schedule, schedule_ar, duration, duration_ar, venue, venue_ar, start_date, end_date, price, original_price, featured, published, total_seats, seats_left, rating, reviews_count, gradient)
values
  ('m1111111-1111-4111-8111-111111111111', 'swim-101', 'Swim 101', 'سباحة 101', 'Swimming', 'سباحة', 'Beginner', 'In Person', 'Mon/Wed/Fri', 'الإثنين والأربعاء والجمعة', '8 weeks', '8 أسابيع', 'Riyadh Pool A', 'حمام الرياض A', '2026-09-10', '2026-11-05', 1200.00, 1500.00, true, true, 20, 12, 4.8, 2, 'from-cyan-500 to-blue-600'),
  ('m2222222-2222-4222-8222-222222222222', 'strength-fundamentals', 'Strength Fundamentals', 'أساسيات القوة', 'Fitness', 'لياقة', 'Intermediate', 'Hybrid', 'Tue/Thu', 'الثلاثاء والخميس', '6 weeks', '6 أسابيع', 'Jeddah Gym', 'صالة جدة', '2026-09-15', '2026-10-27', 900.00, 1200.00, true, true, 18, 9, 4.7, 1, 'from-orange-500 to-red-600')
on conflict (id) do nothing;

insert into public.blog_posts (id, slug, title, title_ar, excerpt, excerpt_ar, content, content_ar, cover_image, author_name, category, published, published_at)
values
  ('n1111111-1111-4111-8111-111111111111', '5-ways-to-build-swim-confidence', '5 Ways to Build Swim Confidence', '5 طرق لبناء الثقة في السباحة', 'Confidence starts with structure and consistency.', 'الثقة تبدأ بالهيكلة والالتزام.', 'In this article we explore steps to improve confidence.', 'في هذه المقالة نناقش خطوات تحسين الثقة.', 'https://example.com/swim.jpg', 'Ahmed Alqahtani', 'Swimming', true, '2026-09-01 08:00:00+00'),
  ('n2222222-2222-4222-8222-222222222222', 'nutrition-for-athletes', 'Nutrition for Athletes', 'التغذية للرياضيين', 'Fueling performance with better habits.', 'تغذية الأداء من خلال عادات أفضل.', 'Good nutrition supports training and recovery.', 'التغذية الجيدة تدعم التدريب والتعافي.', 'https://example.com/nutrition.jpg', 'Sara Alhassan', 'Nutrition', true, '2026-09-02 08:00:00+00')
on conflict (id) do nothing;

insert into public.partners (id, name, logo_url, website_url, tier, published, sort_order)
values
  ('o1111111-1111-4111-8111-111111111111', 'Red Sea Sports', 'https://example.com/rs.jpg', 'https://redseasports.sa', 'gold', true, 1),
  ('o2222222-2222-4222-8222-222222222222', 'CityFit', 'https://example.com/cityfit.jpg', 'https://cityfit.sa', 'silver', true, 2)
on conflict (id) do nothing;

insert into public.media_items (id, title, type, url, thumbnail_url, category, published, sort_order)
values
  ('p1111111-1111-4111-8111-111111111111', 'Pool Photo', 'image', 'https://example.com/pool.jpg', 'https://example.com/pool-thumb.jpg', 'gallery', true, 1),
  ('p2222222-2222-4222-8222-222222222222', 'Coach Session', 'video', 'https://example.com/session.mp4', 'https://example.com/session-thumb.jpg', 'video', true, 2)
on conflict (id) do nothing;

insert into public.join_submissions (id, full_name, email, phone, interest, age, gender, message, type, status, notes)
values
  ('q1111111-1111-4111-8111-111111111111', 'Yasmeen Bilal', 'yasmeen@demo.com', '+966500600001', 'Swimming', 19, 'female', 'Interested in beginner classes.', 'general', 'new', 'Lead from landing page')
on conflict (id) do nothing;

insert into public.leads (id, branch_id, full_name, email, phone, source, service, status, subscription_type, offer_label, offer_amount, assigned_staff, attended, evaluation_date, notes)
values
  ('r1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Yasmeen Bilal', 'yasmeen@demo.com', '+966500600001', 'Website', 'Swimming', 'new', 'monthly', 'Intro trial', 150.00, 'Sales Team', true, '2026-09-03', 'Interested in family package')
on conflict (id) do nothing;

insert into public.clients (id, branch_id, client_code, full_name, phone, email, coach_id, level, age, birth_date, address, category, assigned_staff, membership_id, active)
values
  ('t1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'CL-001', 'Ali Samir', '+966500300001', 'ali.sam@demo.com', '33333333-3333-4333-8333-333333333333', 'Beginner', 15, '2010-04-12', 'Al Malqa, Riyadh', 'swimming', 'Reception', 'MEM-001', true),
  ('t2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'CL-002', 'Omar Saleh', '+966500300003', 'omar.s@demo.com', '55555555-5555-4555-8555-555555555555', 'Advanced', 17, '2008-09-21', 'Corniche, Jeddah', 'fitness', 'Trainer', 'MEM-002', true)
on conflict (id) do nothing;

insert into public.coaches (id, branch_id, user_id, full_name, email, phone, role, specialty, certifications, color, active, max_sessions, day_groups, work_days)
values
  ('u1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', 'Ahmed Alqahtani', 'ahmed@demo.com', '+966500200001', 'Head Coach', 'Swimming', 'AIMS, ASCA', '#2563EB', true, 12, '{"morning","evening"}'::text[], '{"Mon","Tue","Wed"}'::text[]),
  ('u2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '66666666-6666-4666-8666-666666666666', 'Sara Alhassan', 'sara@demo.com', '+966500200002', 'Coach', 'Fitness', 'NASM', '#F59E0B', true, 10, '{"evening"}'::text[], '{"Wed","Thu","Fri"}'::text[])
on conflict (id) do nothing;

insert into public.schedule_sessions (id, branch_id, coach_id, title, start_at, end_at, capacity, pool_lane, notes)
values
  ('v1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'u1111111-1111-4111-8111-111111111111', 'Morning Swim Coaching', '2026-09-01 08:00:00+00', '2026-09-01 09:00:00+00', 8, 1, 'Beginner session'),
  ('v2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'u2222222-2222-4222-8222-222222222222', 'Evening Fitness Class', '2026-09-01 18:00:00+00', '2026-09-01 19:00:00+00', 10, 1, 'Cardio circuit')
on conflict (id) do nothing;

insert into public.attendance (id, branch_id, client_id, client_code, person_name, person_type, method, checked_in_at, confirmed_at, confirmed_by, session_id, session_label, notes)
values
  ('w1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 't1111111-1111-4111-8111-111111111111', 'CL-001', 'Ali Samir', 'client', 'qr', '2026-09-01 08:05:00+00', '2026-09-01 08:07:00+00', '33333333-3333-4333-8333-333333333333', 'v1111111-1111-4111-8111-111111111111', 'Morning Swim Coaching', 'Checked in successfully'),
  ('w2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 't2222222-2222-4222-8222-222222222222', 'CL-002', 'Omar Saleh', 'client', 'manual', '2026-09-01 18:10:00+00', '2026-09-01 18:12:00+00', '55555555-5555-4555-8555-555555555555', 'v2222222-2222-4222-8222-222222222222', 'Evening Fitness Class', 'Excellent energy')
on conflict (id) do nothing;

insert into public.invoices (id, branch_id, client_id, subscription_id, invoice_no, amount, status, description, due_date)
values
  ('x1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 't1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'INV-CLI-001', 950.00, 'paid', 'Monthly swimming package', '2026-09-15'),
  ('x2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 't2222222-2222-4222-8222-222222222222', 'a3333333-3333-4333-8333-333333333333', 'INV-CLI-002', 1800.00, 'paid', 'Monthly fitness package', '2026-09-20')
on conflict (id) do nothing;

insert into public.payments (id, branch_id, client_id, invoice_id, amount, method, receipt_no, paid_at, status, notes, trainee_name, phone, membership_id)
values
  ('y1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 't1111111-1111-4111-8111-111111111111', 'x1111111-1111-4111-8111-111111111111', 950.00, 'card', 'PAY-001', '2026-09-01 08:20:00+00', 'paid', 'Paid by card', 'Ali Samir', '+966500300001', 'MEM-001'),
  ('y2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 't2222222-2222-4222-8222-222222222222', 'x2222222-2222-4222-8222-222222222222', 1800.00, 'cash', 'PAY-002', '2026-09-01 18:15:00+00', 'paid', 'Cash payment received', 'Omar Saleh', '+966500300003', 'MEM-002')
on conflict (id) do nothing;

insert into public.hr_employees (id, branch_id, user_id, full_name, phone, email, position, base_salary, active, hired_at)
values
  ('z1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', 'Abdullah Matar', '+966500700001', 'abdullah@demo.com', 'HR Manager', 6000.00, true, '2025-01-15'),
  ('z2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '66666666-6666-4666-8666-666666666666', 'Noor Alawi', '+966500700002', 'noor@demo.com', 'Operations Lead', 5500.00, true, '2025-02-10')
on conflict (id) do nothing;

insert into public.hr_attendance (id, branch_id, employee_id, work_date, check_in, check_out, hours)
values
  ('aa111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'z1111111-1111-4111-8111-111111111111', '2026-09-01', '2026-09-01 08:15:00+00', '2026-09-01 17:00:00+00', 8.75),
  ('aa222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'z2222222-2222-4222-8222-222222222222', '2026-09-01', '2026-09-01 09:00:00+00', '2026-09-01 18:00:00+00', 9.00)
on conflict (id) do nothing;

insert into public.payroll_runs (id, branch_id, period_start, period_end, status)
values
  ('ac111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '2026-09-01', '2026-09-30', 'draft'),
  ('ac222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '2026-09-01', '2026-09-30', 'finalized')
on conflict (id) do nothing;

insert into public.payroll_items (id, run_id, employee_id, base, allowances, deductions, net)
values
  ('ad111111-1111-4111-8111-111111111111', 'ac111111-1111-4111-8111-111111111111', 'z1111111-1111-4111-8111-111111111111', 6000.00, 500.00, 200.00, 6300.00),
  ('ad222222-2222-4222-8222-222222222222', 'ac222222-2222-4222-8222-222222222222', 'z2222222-2222-4222-8222-222222222222', 5500.00, 300.00, 150.00, 5650.00)
on conflict (id) do nothing;

insert into public.skill_levels (id, name, name_ar, sort_order)
values
  ('al111111-1111-4111-8111-111111111111', 'Beginner', 'مبتدئ', 1),
  ('al222222-2222-4222-8222-222222222222', 'Intermediate', 'متوسط', 2),
  ('al333333-3333-4333-8333-333333333333', 'Advanced', 'متقدم', 3)
on conflict (id) do nothing;

-- =============================================================
-- Final verification signal
-- =============================================================
select 'full_system_live_seed_ready' as status;
