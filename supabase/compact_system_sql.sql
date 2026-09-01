-- =============================================================
-- United Sports Academy - Compact SQL Schema
-- Purpose: clear, shorter, production-friendly starter schema for
-- the Academy + Site + Admin modules with core relationships.
-- Run in Supabase SQL editor or via psql:
--   psql "$DATABASE_URL" -f supabase/compact_system_sql.sql
-- =============================================================

create extension if not exists pgcrypto;

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
  category text,
  skill_level text,
  active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_subscriptions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  trainee_id uuid not null references public.ac_trainees(id) on delete cascade,
  coach_id uuid references public.ac_profiles(id) on delete set null,
  package_name text not null,
  total_sessions integer not null default 0,
  used_sessions integer not null default 0,
  price numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
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
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
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

create index if not exists idx_ac_trainees_branch_id on public.ac_trainees(branch_id);
create index if not exists idx_ac_subscriptions_branch_id on public.ac_subscriptions(branch_id);
create index if not exists idx_ac_attendance_branch_id on public.ac_attendance(branch_id);
create index if not exists idx_leads_branch_id on public.leads(branch_id);
create index if not exists idx_courses_published on public.courses(published);
create index if not exists idx_blog_published on public.blog_posts(published);

-- Seed data
insert into public.branches (id, name, name_ar, address, phone, email, active, sort_order)
values
  ('11111111-1111-4111-8111-111111111111', 'Main Branch', 'الفرع الرئيسي', 'Riyadh', '+966500000001', 'main@unitedsport.academy', true, 1),
  ('22222222-2222-4222-8222-222222222222', 'North Branch', 'الفرع الشمالي', 'Jeddah', '+966500000002', 'north@unitedsport.academy', true, 2)
on conflict (id) do nothing;

insert into public.ac_profiles (id, user_id, full_name, phone, language, default_branch_id)
values
  ('33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444', 'Admin Manager', '+966500000010', 'en', '11111111-1111-4111-8111-111111111111'),
  ('55555555-5555-4555-8555-555555555555', '66666666-6666-4666-8666-666666666666', 'Coach Hager', '+966500000011', 'ar', '11111111-1111-4111-8111-111111111111')
on conflict (id) do nothing;

insert into public.ac_user_roles (user_id, role, branch_id)
values
  ('44444444-4444-4444-8444-444444444444', 'admin', '11111111-1111-4111-8111-111111111111'),
  ('66666666-6666-4666-8666-666666666666', 'coach', '11111111-1111-4111-8111-111111111111')
on conflict (user_id, role, branch_id) do nothing;

insert into public.ac_trainees (id, branch_id, profile_id, assigned_coach_id, client_code, full_name, full_name_ar, phone, email, gender, category, skill_level, active)
values
  ('77777777-7777-4777-8777-777777777777', '11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', '55555555-5555-4555-8555-555555555555', 'USA-1001', 'Ali Hassan', 'علي حسن', '+966500000100', 'ali@example.com', 'male', 'Swimming', 'Beginner', true),
  ('88888888-8888-4888-8888-888888888888', '11111111-1111-4111-8111-111111111111', null, '55555555-5555-4555-8555-555555555555', 'USA-1002', 'Mona Saleh', 'منى صالح', '+966500000101', 'mona@example.com', 'female', 'Football', 'Intermediate', true)
on conflict (id) do nothing;

insert into public.ac_subscriptions (id, branch_id, trainee_id, coach_id, package_name, total_sessions, used_sessions, price, paid_amount, start_date, end_date, status)
values
  ('99999999-9999-4999-8999-999999999999', '11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-777777777777', '55555555-5555-4555-8555-555555555555', 'Swimming Starter', 20, 3, 1200.00, 800.00, current_date - interval '10 days', current_date + interval '40 days', 'active'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', '88888888-8888-4888-8888-888888888888', '55555555-5555-4555-8555-555555555555', 'Elite Fitness', 30, 8, 1800.00, 1800.00, current_date - interval '15 days', current_date + interval '45 days', 'active')
on conflict (id) do nothing;

insert into public.ac_invoices (id, branch_id, trainee_id, subscription_id, invoice_number, subtotal, tax, discount, total, paid_amount, status)
values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-777777777777', '99999999-9999-4999-8999-999999999999', 'INV-1001', 1200.00, 0.00, 0.00, 1200.00, 800.00, 'partial'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '11111111-1111-4111-8111-111111111111', '88888888-8888-4888-8888-888888888888', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'INV-1002', 1800.00, 0.00, 0.00, 1800.00, 1800.00, 'paid')
on conflict (id) do nothing;

insert into public.ac_attendance (id, branch_id, client_id, client_code, person_name, person_type, method, checked_in_at)
values
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-777777777777', 'USA-1001', 'Ali Hassan', 'trainee', 'qr', now() - interval '2 hours'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '11111111-1111-4111-8111-111111111111', '88888888-8888-4888-8888-888888888888', 'USA-1002', 'Mona Saleh', 'trainee', 'manual', now() - interval '1 hour')
on conflict (id) do nothing;

insert into public.courses (id, branch_id, title, title_ar, slug, summary, description, price, duration, level, published)
values
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', '11111111-1111-4111-8111-111111111111', 'Swimming Fundamentals', 'أساسيات السباحة', 'swimming-fundamentals', 'Beginner swim coaching', 'Full beginner coaching program for young athletes.', 550.00, '8 weeks', 'Beginner', true),
  ('12121212-1212-4121-8121-121212121212', '11111111-1111-4111-8111-111111111111', 'Performance Sprint', 'سباق الأداء', 'performance-sprint', 'Sprint and reaction program', 'For athletes aiming to improve acceleration and explosiveness.', 690.00, '6 weeks', 'Advanced', true)
on conflict (id) do nothing;

insert into public.blog_posts (id, title, slug, excerpt, content, published)
values
  ('13131313-1313-4131-8131-131313131313', 'Youth Training Season Starts', 'youth-training-season-starts', 'Registration is open for the new cycle.', 'We are preparing a strong training season for all age groups.', true),
  ('14141414-1414-4141-8141-141414141414', 'Recovery Tips for Athletes', 'recovery-tips-for-athletes', 'Small habits improve performance.', 'Rest, hydration, and sleep are essential in every athlete plan.', true)
on conflict (id) do nothing;

insert into public.partners (id, name, website, active)
values
  ('15151515-1515-4151-8151-151515151515', 'Sport City', 'https://sportcity.example', true),
  ('16161616-1616-4161-8161-161616161616', 'Elite Health', 'https://elitehealth.example', true)
on conflict (id) do nothing;

insert into public.join_submissions (id, type, full_name, phone, email, interest, message, status)
values
  ('17171717-1717-4171-8171-171717171717', 'academy', 'Sara Ali', '+966500000200', 'sara@example.com', 'Swimming', 'Interested in beginner class.', 'new'),
  ('18181818-1818-4181-8181-181818181818', 'general', 'Omar Nader', '+966500000201', 'omar@example.com', 'Football', 'Looking for fitness consulting.', 'contacted')
on conflict (id) do nothing;

insert into public.leads (id, branch_id, full_name, phone, email, source, status, notes)
values
  ('19191919-1919-4191-8191-191919191919', '11111111-1111-4111-8111-111111111111', 'Nasser Khalid', '+966500000300', 'nasser@example.com', 'Instagram', 'new', 'Interested in private lessons.'),
  ('20202020-2020-4202-8202-202020202020', '22222222-2222-4222-8222-222222222222', 'Lina Fahad', '+966500000301', 'lina@example.com', 'Referral', 'qualified', 'Wants programs for daughters.')
on conflict (id) do nothing;

insert into public.employees (id, branch_id, full_name, role, phone, email, active)
values
  ('21212121-2121-4212-8212-212121212121', '11111111-1111-4111-8111-111111111111', 'Yousef Omar', 'Reception', '+966500000400', 'yousef@example.com', true),
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Noor Fatima', 'Coach Assistant', '+966500000401', 'noor@example.com', true)
on conflict (id) do nothing;

insert into public.payroll_runs (id, branch_id, pay_period, total_amount, status)
values
  ('23232323-2323-4232-8232-232323232323', '11111111-1111-4111-8111-111111111111', '2026-09', 18000.00, 'draft'),
  ('24242424-2424-4242-8242-242424242424', '22222222-2222-4222-8222-222222222222', '2026-09', 9500.00, 'approved')
on conflict (id) do nothing;

-- Quick checks
select 'branches' as table_name, count(*) as rows from public.branches
union all
select 'ac_profiles', count(*) from public.ac_profiles
union all
select 'ac_trainees', count(*) from public.ac_trainees
union all
select 'ac_subscriptions', count(*) from public.ac_subscriptions
union all
select 'ac_invoices', count(*) from public.ac_invoices
union all
select 'courses', count(*) from public.courses
union all
select 'leads', count(*) from public.leads;
