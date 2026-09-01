-- =============================================================
-- United Sports Academy - Live Ready SQL Schema
-- Purpose: production-safe database structure without demo data.
-- Safe for direct use in Supabase SQL editor.
-- =============================================================

create extension if not exists pgcrypto;

-- Enum for academy role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'academy_role'
  ) THEN
    CREATE TYPE public.academy_role AS ENUM (
      'admin',
      'manager',
      'coach',
      'staff',
      'viewer'
    );
  END IF;
END $$;

-- Core branch structure
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

-- Academy core
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

-- Site / public modules
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  title text not null,
  title_ar text,
  slug text unique,
  summary text,
  description text,
  price numeric(12,2) default 0,
  duration text,
  level text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  excerpt text,
  content text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.join_submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'general',
  full_name text not null,
  phone text,
  email text,
  interest text,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  source text,
  status text not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  full_name text not null,
  role text not null,
  phone text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  pay_period text not null,
  total_amount numeric(12,2) not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for main relationships
create index if not exists idx_ac_trainees_branch_id on public.ac_trainees(branch_id);
create index if not exists idx_ac_trainees_profile_id on public.ac_trainees(profile_id);
create index if not exists idx_ac_subscriptions_branch_id on public.ac_subscriptions(branch_id);
create index if not exists idx_ac_subscriptions_trainee_id on public.ac_subscriptions(trainee_id);
create index if not exists idx_ac_invoices_branch_id on public.ac_invoices(branch_id);
create index if not exists idx_ac_attendance_branch_id on public.ac_attendance(branch_id);
create index if not exists idx_ac_attendance_client_id on public.ac_attendance(client_id);
create index if not exists idx_courses_branch_id on public.courses(branch_id);
create index if not exists idx_courses_published on public.courses(published);
create index if not exists idx_blog_published on public.blog_posts(published);
create index if not exists idx_leads_branch_id on public.leads(branch_id);
create index if not exists idx_employees_branch_id on public.employees(branch_id);

-- Compatibility guards for partial/older schemas
alter table public.courses
  add column if not exists branch_id uuid references public.branches(id) on delete set null,
  add column if not exists title_ar text,
  add column if not exists slug text,
  add column if not exists summary text,
  add column if not exists description text,
  add column if not exists price numeric(12,2) default 0,
  add column if not exists duration text,
  add column if not exists level text,
  add column if not exists published boolean default false;

alter table public.blog_posts
  add column if not exists title text,
  add column if not exists slug text,
  add column if not exists excerpt text,
  add column if not exists content text,
  add column if not exists published boolean default false;

-- Final schema check
select 'live_ready_schema_ok' as status;
