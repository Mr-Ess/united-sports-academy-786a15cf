-- =============================================================
-- Academy core schema for United Sports Academy
-- Purpose: create the live tables that the app expects in Supabase
-- Must be run in the Supabase SQL editor against the real project
-- =============================================================

create extension if not exists pgcrypto;

create type public.academy_role as enum (
  'admin',
  'manager',
  'coach',
  'staff',
  'viewer'
);

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

-- Helpful indexes for academy searches and reports
create index if not exists idx_branches_active on public.branches(active);
create index if not exists idx_trainees_branch_active on public.ac_trainees(branch_id, active, deleted_at);
create index if not exists idx_trainees_client_code on public.ac_trainees(client_code);
create index if not exists idx_subscriptions_branch_status on public.ac_subscriptions(branch_id, status, deleted_at);
create index if not exists idx_subscriptions_trainee on public.ac_subscriptions(trainee_id, status);
create index if not exists idx_invoices_branch_issue_date on public.ac_invoices(branch_id, issue_date);
create index if not exists idx_attendance_branch_checked_in on public.ac_attendance(branch_id, checked_in_at);

-- Keep timestamps fresh when rows are updated.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_branches_updated_at
before update on public.branches
for each row execute function public.set_updated_at();

create trigger trg_ac_profiles_updated_at
before update on public.ac_profiles
for each row execute function public.set_updated_at();

create trigger trg_ac_trainees_updated_at
before update on public.ac_trainees
for each row execute function public.set_updated_at();

create trigger trg_ac_subscriptions_updated_at
before update on public.ac_subscriptions
for each row execute function public.set_updated_at();

create trigger trg_ac_invoices_updated_at
before update on public.ac_invoices
for each row execute function public.set_updated_at();

create trigger trg_ac_accounts_updated_at
before update on public.ac_accounts
for each row execute function public.set_updated_at();

create trigger trg_ac_transactions_updated_at
before update on public.ac_transactions
for each row execute function public.set_updated_at();

create trigger trg_ac_groups_updated_at
before update on public.ac_groups
for each row execute function public.set_updated_at();

create trigger trg_ac_pools_updated_at
before update on public.ac_pools
for each row execute function public.set_updated_at();

create trigger trg_ac_lanes_updated_at
before update on public.ac_lanes
for each row execute function public.set_updated_at();

create trigger trg_ac_time_slots_updated_at
before update on public.ac_time_slots
for each row execute function public.set_updated_at();

create trigger trg_ac_assessments_updated_at
before update on public.ac_assessments
for each row execute function public.set_updated_at();

-- Optional: row-level security for apps that rely on authenticated policies.
-- Service role still bypasses RLS; this keeps a sane default for authenticated access.
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

-- Allow authenticated users to read/write by default for project use during setup.
-- These policies are intentionally broad; tighten later for production permissions.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'branches' and policyname = 'branches_all_authenticated'
  ) then
    create policy "branches_all_authenticated" on public.branches for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ac_profiles' and policyname = 'ac_profiles_all_authenticated'
  ) then
    create policy "ac_profiles_all_authenticated" on public.ac_profiles for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ac_user_roles' and policyname = 'ac_user_roles_all_authenticated'
  ) then
    create policy "ac_user_roles_all_authenticated" on public.ac_user_roles for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ac_trainees' and policyname = 'ac_trainees_all_authenticated'
  ) then
    create policy "ac_trainees_all_authenticated" on public.ac_trainees for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ac_subscriptions' and policyname = 'ac_subscriptions_all_authenticated'
  ) then
    create policy "ac_subscriptions_all_authenticated" on public.ac_subscriptions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ac_invoices' and policyname = 'ac_invoices_all_authenticated'
  ) then
    create policy "ac_invoices_all_authenticated" on public.ac_invoices for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ac_attendance' and policyname = 'ac_attendance_all_authenticated'
  ) then
    create policy "ac_attendance_all_authenticated" on public.ac_attendance for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ac_accounts' and policyname = 'ac_accounts_all_authenticated'
  ) then
    create policy "ac_accounts_all_authenticated" on public.ac_accounts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ac_transactions' and policyname = 'ac_transactions_all_authenticated'
  ) then
    create policy "ac_transactions_all_authenticated" on public.ac_transactions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ac_groups' and policyname = 'ac_groups_all_authenticated'
  ) then
    create policy "ac_groups_all_authenticated" on public.ac_groups for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ac_pools' and policyname = 'ac_pools_all_authenticated'
  ) then
    create policy "ac_pools_all_authenticated" on public.ac_pools for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ac_lanes' and policyname = 'ac_lanes_all_authenticated'
  ) then
    create policy "ac_lanes_all_authenticated" on public.ac_lanes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ac_time_slots' and policyname = 'ac_time_slots_all_authenticated'
  ) then
    create policy "ac_time_slots_all_authenticated" on public.ac_time_slots for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ac_assessments' and policyname = 'ac_assessments_all_authenticated'
  ) then
    create policy "ac_assessments_all_authenticated" on public.ac_assessments for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
end $$;

-- Ensure the project has the critical core tables on the real database.
select 'academy_core_schema_ready' as status;
