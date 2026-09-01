create table if not exists public.ac_accounts (
  active boolean default true not null,
  branch_id uuid not null,
  created_at timestamptz default now() not null,
  currency text default 'EGP' not null,
  id uuid primary key default gen_random_uuid(),
  kind text default 'general' not null,
  name text not null,
  name_ar text,
  notes text,
  opening_balance numeric default 0 not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_ai_agents (
  agent_type text default 'assistant' not null,
  branch_id uuid not null,
  config jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  created_by uuid,
  description text,
  description_ar text,
  id uuid primary key default gen_random_uuid(),
  is_active boolean default true not null,
  last_run_at timestamptz,
  max_tokens integer default 2048 not null,
  model text default 'google/gemini-2.5-flash' not null,
  n8n_workflow_id text,
  name text not null,
  name_ar text,
  schedule_cron text,
  system_prompt text default '' not null,
  temperature numeric default 0.7 not null,
  tools jsonb default '[]'::jsonb not null,
  trigger_event text,
  updated_at timestamptz default now() not null,
  webhook_url text
);

create table if not exists public.ac_assessments (
  assessment_date date default CURRENT_DATE not null,
  branch_id uuid not null,
  coach_id uuid,
  created_at timestamptz default now() not null,
  endurance_score integer,
  id uuid primary key default gen_random_uuid(),
  notes text,
  overall_score integer,
  passed boolean,
  skill_level_id uuid,
  speed_score integer,
  submitted_by uuid,
  technique_score integer,
  trainee_id uuid not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_attachments (
  branch_id uuid not null,
  comment text,
  created_at timestamptz default now() not null,
  entity_id uuid not null,
  entity_type text not null,
  file_name text not null,
  file_path text not null,
  id uuid primary key default gen_random_uuid(),
  mime_type text,
  size_bytes bigint,
  updated_at timestamptz default now() not null,
  uploaded_by uuid
);

create table if not exists public.ac_attendance (
  branch_id uuid not null,
  check_in_at timestamptz default now() not null,
  check_out_at timestamptz,
  coach_id uuid,
  confirmed_at timestamptz,
  confirmed_by uuid,
  created_at timestamptz default now() not null,
  created_by uuid,
  id uuid primary key default gen_random_uuid(),
  method text default 'manual' not null,
  notes text,
  schedule_slot_id uuid,
  status text default 'present' not null,
  subscription_id uuid,
  trainee_id uuid not null
);

create table if not exists public.ac_audit_log (
  action text not null,
  actor_id uuid,
  after jsonb,
  before jsonb,
  branch_id uuid,
  created_at timestamptz default now() not null,
  id uuid primary key default gen_random_uuid(),
  record_id text,
  table_name text
);

create table if not exists public.ac_custom_roles (
  allowed_paths text[] default '{}'::text[] not null,
  created_at timestamptz default now() not null,
  desc_ar text,
  desc_en text,
  id uuid primary key default gen_random_uuid(),
  key text not null,
  name_ar text,
  name_en text not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_employee_attendance (
  branch_id uuid not null,
  clock_in timestamptz,
  clock_out timestamptz,
  created_at timestamptz default now() not null,
  employee_id uuid not null,
  hours_worked numeric,
  id uuid primary key default gen_random_uuid(),
  notes text,
  status text default 'present' not null,
  updated_at timestamptz default now() not null,
  work_date date default CURRENT_DATE not null
);

create table if not exists public.ac_employees (
  allowances numeric default 0 not null,
  base_salary numeric default 0 not null,
  branch_id uuid not null,
  created_at timestamptz default now() not null,
  department text,
  email text,
  employee_code text not null,
  full_name text not null,
  full_name_ar text,
  hire_date date default CURRENT_DATE not null,
  id uuid primary key default gen_random_uuid(),
  national_id text,
  notes text,
  phone text,
  profile_id uuid,
  status text default 'active' not null,
  termination_date date,
  title text,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_expense_categories (
  active boolean default true not null,
  branch_id uuid not null,
  color text,
  created_at timestamptz default now() not null,
  id uuid primary key default gen_random_uuid(),
  kind text default 'general' not null,
  name text not null,
  name_ar text,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_groups (
  active boolean default true not null,
  branch_id uuid not null,
  category text,
  color text,
  created_at timestamptz default now() not null,
  id uuid primary key default gen_random_uuid(),
  level text,
  max_capacity integer default 8 not null,
  name text not null,
  name_ar text,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_inventory_items (
  branch_id uuid not null,
  category text,
  created_at timestamptz default now() not null,
  id uuid primary key default gen_random_uuid(),
  location text,
  min_quantity numeric default 0 not null,
  name text not null,
  name_ar text,
  notes text,
  quantity numeric default 0 not null,
  sku text,
  unit text,
  unit_cost numeric default 0 not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_inventory_movements (
  branch_id uuid not null,
  created_at timestamptz default now() not null,
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  movement_type text not null,
  notes text,
  performed_by uuid,
  quantity numeric not null,
  reference text,
  unit_cost numeric
);

create table if not exists public.ac_invoices (
  branch_id uuid not null,
  created_at timestamptz default now() not null,
  created_by uuid,
  deleted_at timestamptz,
  discount numeric default 0 not null,
  due_date date,
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null,
  issue_date date default CURRENT_DATE not null,
  items jsonb default '[]'::jsonb not null,
  notes text,
  paid_amount numeric default 0 not null,
  status text default 'unpaid' not null,
  subscription_id uuid,
  subtotal numeric default 0 not null,
  tax numeric default 0 not null,
  total numeric default 0 not null,
  trainee_id uuid,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_lanes (
  branch_id uuid not null,
  created_at timestamptz default now() not null,
  default_capacity integer default 8 not null,
  id uuid primary key default gen_random_uuid(),
  lane_number integer not null,
  name text,
  pool_id uuid not null,
  status text default 'available' not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_leads (
  agent text default '' not null,
  assessment_attended boolean default false not null,
  assessment_date date default CURRENT_DATE,
  branch_id uuid not null,
  comments text default '' not null,
  contact text default '' not null,
  created_at timestamptz default now() not null,
  created_by uuid,
  id uuid primary key default gen_random_uuid(),
  name text not null,
  offer text default 'None' not null,
  service text default '' not null,
  source text default '' not null,
  status text default 'new' not null,
  subscription_type text default '' not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_leave_requests (
  approved_at timestamptz,
  approved_by uuid,
  branch_id uuid not null,
  created_at timestamptz default now() not null,
  days integer not null,
  employee_id uuid not null,
  end_date date not null,
  id uuid primary key default gen_random_uuid(),
  leave_type text not null,
  reason text,
  start_date date not null,
  status text default 'pending' not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_maintenance_assets (
  branch_id uuid not null,
  category text,
  code text,
  created_at timestamptz default now() not null,
  id uuid primary key default gen_random_uuid(),
  location text,
  name text not null,
  name_ar text,
  notes text,
  purchase_date date,
  status text default 'operational' not null,
  updated_at timestamptz default now() not null,
  warranty_expiry date
);

create table if not exists public.ac_maintenance_tickets (
  asset_id uuid,
  assigned_to uuid,
  branch_id uuid not null,
  cost numeric,
  created_at timestamptz default now() not null,
  description text,
  id uuid primary key default gen_random_uuid(),
  priority text default 'medium' not null,
  reported_by uuid,
  resolution_notes text,
  resolved_at timestamptz,
  status text default 'open' not null,
  title text not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_notifications (
  body text,
  branch_id uuid,
  created_at timestamptz default now() not null,
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  link text,
  meta jsonb default '{}'::jsonb,
  read_at timestamptz,
  severity text default 'info' not null,
  title text not null,
  user_id uuid
);

create table if not exists public.ac_page_permissions (
  allowed_roles academy_role[] default '{}'::academy_role[] not null,
  created_at timestamptz default now() not null,
  id uuid primary key default gen_random_uuid(),
  is_public boolean default false not null,
  path text not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_payroll_items (
  allowances numeric default 0 not null,
  base_salary numeric default 0 not null,
  bonuses numeric default 0 not null,
  branch_id uuid not null,
  created_at timestamptz default now() not null,
  deductions numeric default 0 not null,
  employee_id uuid not null,
  id uuid primary key default gen_random_uuid(),
  net_pay numeric default 0 not null,
  notes text,
  payroll_run_id uuid not null
);

create table if not exists public.ac_payroll_runs (
  branch_id uuid not null,
  created_at timestamptz default now() not null,
  finalized_at timestamptz,
  finalized_by uuid,
  id uuid primary key default gen_random_uuid(),
  notes text,
  period_month integer not null,
  period_year integer not null,
  status text default 'draft' not null,
  total_amount numeric default 0 not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_pools (
  branch_id uuid not null,
  created_at timestamptz default now() not null,
  deleted_at timestamptz,
  depth_m numeric,
  id uuid primary key default gen_random_uuid(),
  length_m numeric,
  name text not null,
  name_ar text,
  notes text,
  status text default 'operational' not null,
  temperature_c numeric,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_profiles (
  birthdate date,
  created_at timestamptz default now() not null,
  default_branch_id uuid,
  display_name text,
  gender text,
  id uuid primary key default gen_random_uuid(),
  medical_notes text,
  national_id text,
  phone text,
  photo_url text,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_purchase_order_items (
  created_at timestamptz default now() not null,
  description text not null,
  id uuid primary key default gen_random_uuid(),
  item_id uuid,
  line_total numeric default 0 not null,
  po_id uuid not null,
  quantity numeric default 0 not null,
  received_quantity numeric default 0 not null,
  unit_cost numeric default 0 not null
);

create table if not exists public.ac_purchase_orders (
  approved_by uuid,
  branch_id uuid not null,
  created_at timestamptz default now() not null,
  created_by uuid,
  expected_date date,
  id uuid primary key default gen_random_uuid(),
  notes text,
  order_date date default CURRENT_DATE not null,
  po_number text,
  status text default 'draft' not null,
  supplier_id uuid,
  total numeric default 0 not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_qr_tokens (
  branch_id uuid not null,
  created_at timestamptz default now() not null,
  expires_at timestamptz not null,
  id uuid primary key default gen_random_uuid(),
  token text not null,
  trainee_id uuid not null,
  used_at timestamptz
);

create table if not exists public.ac_schedule_slots (
  active boolean default true not null,
  branch_id uuid not null,
  capacity_override integer,
  coach_id uuid,
  created_at timestamptz default now() not null,
  group_id uuid,
  id uuid primary key default gen_random_uuid(),
  lane_id uuid not null,
  notes text,
  time_slot_id uuid not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_skill_levels (
  branch_id uuid,
  code text not null,
  created_at timestamptz default now() not null,
  description text,
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ar text,
  rank integer default 0 not null
);

create table if not exists public.ac_subscriptions (
  branch_id uuid not null,
  coach_id uuid,
  created_at timestamptz default now() not null,
  deleted_at timestamptz,
  end_date date,
  group_id uuid,
  id uuid primary key default gen_random_uuid(),
  lane_id uuid,
  notes text,
  package_name text not null,
  package_type text,
  paid_amount numeric default 0 not null,
  payment_method text,
  price numeric default 0 not null,
  receipt_number text,
  schedule_slot_id uuid,
  start_date date default CURRENT_DATE not null,
  status text default 'active' not null,
  time_slot_id uuid,
  total_sessions integer default 0 not null,
  trainee_id uuid not null,
  updated_at timestamptz default now() not null,
  used_sessions integer default 0 not null
);

create table if not exists public.ac_suppliers (
  active boolean default true not null,
  address text,
  branch_id uuid not null,
  contact_name text,
  created_at timestamptz default now() not null,
  email text,
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text,
  phone text,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_time_slots (
  active boolean default true not null,
  branch_id uuid not null,
  created_at timestamptz default now() not null,
  day_of_week integer not null,
  end_time time not null,
  id uuid primary key default gen_random_uuid(),
  label text not null,
  start_time time not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_trainees (
  active boolean default true not null,
  address text,
  assigned_coach_id uuid,
  birthdate date,
  branch_id uuid not null,
  category text,
  client_code text not null,
  created_at timestamptz default now() not null,
  deleted_at timestamptz,
  email text,
  emergency_contact text,
  full_name text not null,
  full_name_ar text,
  gender text,
  id uuid primary key default gen_random_uuid(),
  medical_notes text,
  notes text,
  phone text,
  photo_url text,
  profile_id uuid,
  skill_level text,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_transactions (
  account_id uuid,
  amount numeric not null,
  branch_id uuid not null,
  category_id uuid,
  created_at timestamptz default now() not null,
  created_by uuid,
  currency text default 'EGP' not null,
  description text,
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid,
  kind text not null,
  payment_method text,
  reference text,
  subscription_id uuid,
  tx_date date default CURRENT_DATE not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.ac_user_roles (
  branch_id uuid,
  created_at timestamptz default now() not null,
  id uuid primary key default gen_random_uuid(),
  role academy_role not null,
  user_id uuid not null
);

create table if not exists public.ac_whatsapp_outbox (
  branch_id uuid not null,
  created_at timestamptz default now() not null,
  error text,
  id uuid primary key default gen_random_uuid(),
  payload jsonb default '{}'::jsonb not null,
  provider_message_id text,
  rendered_body text not null,
  sent_at timestamptz,
  status text default 'queued' not null,
  template_key text not null,
  to_phone text not null
);

create table if not exists public.ac_whatsapp_settings (
  branch_id uuid not null,
  created_at timestamptz default now() not null,
  enabled boolean default true not null,
  id uuid primary key default gen_random_uuid(),
  phone_display text,
  templates jsonb default '{}'::jsonb not null,
  updated_at timestamptz default now() not null
);

do $$
declare t text;
begin
  foreach t in array array['ac_accounts','ac_ai_agents','ac_assessments','ac_attachments','ac_attendance','ac_audit_log','ac_custom_roles','ac_employee_attendance','ac_employees','ac_expense_categories','ac_groups','ac_inventory_items','ac_inventory_movements','ac_invoices','ac_lanes','ac_leads','ac_leave_requests','ac_maintenance_assets','ac_maintenance_tickets','ac_notifications','ac_page_permissions','ac_payroll_items','ac_payroll_runs','ac_pools','ac_profiles','ac_purchase_order_items','ac_purchase_orders','ac_qr_tokens','ac_schedule_slots','ac_skill_levels','ac_subscriptions','ac_suppliers','ac_time_slots','ac_trainees','ac_transactions','ac_user_roles','ac_whatsapp_outbox','ac_whatsapp_settings'] loop
    execute format('grant select, insert, update, delete on public.%I to anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "open_all" on public.%I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
  foreach t in array array['ac_accounts','ac_ai_agents','ac_assessments','ac_attachments','ac_custom_roles','ac_employee_attendance','ac_employees','ac_expense_categories','ac_groups','ac_inventory_items','ac_invoices','ac_lanes','ac_leads','ac_leave_requests','ac_maintenance_assets','ac_maintenance_tickets','ac_page_permissions','ac_payroll_runs','ac_pools','ac_profiles','ac_purchase_orders','ac_schedule_slots','ac_subscriptions','ac_suppliers','ac_time_slots','ac_trainees','ac_transactions','ac_whatsapp_settings'] loop
    execute format('create trigger trg_%s_updated before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

alter table public.branches add column if not exists deleted_at timestamptz;

do $$
declare r record;
begin
  for r in select unnest(array[
    'ac_accounts','ac_ai_agents','ac_assessments','ac_attachments','ac_attendance','ac_audit_log',
    'ac_employee_attendance','ac_employees','ac_expense_categories','ac_groups','ac_inventory_items',
    'ac_inventory_movements','ac_invoices','ac_lanes','ac_leads','ac_leave_requests','ac_maintenance_assets',
    'ac_maintenance_tickets','ac_notifications','ac_payroll_items','ac_payroll_runs','ac_pools',
    'ac_purchase_orders','ac_qr_tokens','ac_schedule_slots','ac_skill_levels','ac_subscriptions',
    'ac_suppliers','ac_time_slots','ac_trainees','ac_transactions','ac_whatsapp_outbox','ac_whatsapp_settings'
  ]) as t
  loop
    execute format('alter table public.%I add constraint %I foreign key (branch_id) references public.branches(id) on delete cascade', r.t, r.t||'_branch_fk');
  end loop;
end $$;

alter table public.ac_assessments add constraint ac_assessments_trainee_fk foreign key (trainee_id) references public.ac_trainees(id) on delete cascade;
alter table public.ac_assessments add constraint ac_assessments_coach_fk foreign key (coach_id) references public.ac_profiles(id) on delete set null;
alter table public.ac_assessments add constraint ac_assessments_level_fk foreign key (skill_level_id) references public.ac_skill_levels(id) on delete set null;
alter table public.ac_attendance add constraint ac_attendance_trainee_fk foreign key (trainee_id) references public.ac_trainees(id) on delete cascade;
alter table public.ac_attendance add constraint ac_attendance_slot_fk foreign key (schedule_slot_id) references public.ac_schedule_slots(id) on delete set null;
alter table public.ac_attendance add constraint ac_attendance_sub_fk foreign key (subscription_id) references public.ac_subscriptions(id) on delete set null;
alter table public.ac_attendance add constraint ac_attendance_coach_fk foreign key (coach_id) references public.ac_profiles(id) on delete set null;
alter table public.ac_employee_attendance add constraint ac_empatt_emp_fk foreign key (employee_id) references public.ac_employees(id) on delete cascade;
alter table public.ac_employees add constraint ac_employees_profile_fk foreign key (profile_id) references public.ac_profiles(id) on delete set null;
alter table public.ac_inventory_movements add constraint ac_invmov_item_fk foreign key (item_id) references public.ac_inventory_items(id) on delete cascade;
alter table public.ac_invoices add constraint ac_invoices_trainee_fk foreign key (trainee_id) references public.ac_trainees(id) on delete set null;
alter table public.ac_invoices add constraint ac_invoices_sub_fk foreign key (subscription_id) references public.ac_subscriptions(id) on delete set null;
alter table public.ac_lanes add constraint ac_lanes_pool_fk foreign key (pool_id) references public.ac_pools(id) on delete cascade;
alter table public.ac_leave_requests add constraint ac_leaves_emp_fk foreign key (employee_id) references public.ac_employees(id) on delete cascade;
alter table public.ac_maintenance_tickets add constraint ac_tickets_asset_fk foreign key (asset_id) references public.ac_maintenance_assets(id) on delete set null;
alter table public.ac_payroll_items add constraint ac_payitem_run_fk foreign key (payroll_run_id) references public.ac_payroll_runs(id) on delete cascade;
alter table public.ac_payroll_items add constraint ac_payitem_emp_fk foreign key (employee_id) references public.ac_employees(id) on delete cascade;
alter table public.ac_purchase_order_items add constraint ac_poitem_po_fk foreign key (po_id) references public.ac_purchase_orders(id) on delete cascade;
alter table public.ac_purchase_order_items add constraint ac_poitem_item_fk foreign key (item_id) references public.ac_inventory_items(id) on delete set null;
alter table public.ac_purchase_orders add constraint ac_po_supplier_fk foreign key (supplier_id) references public.ac_suppliers(id) on delete set null;
alter table public.ac_qr_tokens add constraint ac_qr_trainee_fk foreign key (trainee_id) references public.ac_trainees(id) on delete cascade;
alter table public.ac_schedule_slots add constraint ac_slots_lane_fk foreign key (lane_id) references public.ac_lanes(id) on delete cascade;
alter table public.ac_schedule_slots add constraint ac_slots_time_fk foreign key (time_slot_id) references public.ac_time_slots(id) on delete cascade;
alter table public.ac_schedule_slots add constraint ac_slots_group_fk foreign key (group_id) references public.ac_groups(id) on delete set null;
alter table public.ac_schedule_slots add constraint ac_slots_coach_fk foreign key (coach_id) references public.ac_profiles(id) on delete set null;
alter table public.ac_subscriptions add constraint ac_subs_trainee_fk foreign key (trainee_id) references public.ac_trainees(id) on delete cascade;
alter table public.ac_subscriptions add constraint ac_subs_group_fk foreign key (group_id) references public.ac_groups(id) on delete set null;
alter table public.ac_subscriptions add constraint ac_subs_lane_fk foreign key (lane_id) references public.ac_lanes(id) on delete set null;
alter table public.ac_subscriptions add constraint ac_subs_slot_fk foreign key (schedule_slot_id) references public.ac_schedule_slots(id) on delete set null;
alter table public.ac_subscriptions add constraint ac_subs_time_fk foreign key (time_slot_id) references public.ac_time_slots(id) on delete set null;
alter table public.ac_subscriptions add constraint ac_subs_coach_fk foreign key (coach_id) references public.ac_profiles(id) on delete set null;
alter table public.ac_trainees add constraint ac_trainees_coach_fk foreign key (assigned_coach_id) references public.ac_profiles(id) on delete set null;
alter table public.ac_trainees add constraint ac_trainees_profile_fk foreign key (profile_id) references public.ac_profiles(id) on delete set null;
alter table public.ac_transactions add constraint ac_tx_account_fk foreign key (account_id) references public.ac_accounts(id) on delete set null;
alter table public.ac_transactions add constraint ac_tx_cat_fk foreign key (category_id) references public.ac_expense_categories(id) on delete set null;
alter table public.ac_transactions add constraint ac_tx_invoice_fk foreign key (invoice_id) references public.ac_invoices(id) on delete set null;
alter table public.ac_transactions add constraint ac_tx_sub_fk foreign key (subscription_id) references public.ac_subscriptions(id) on delete set null;

create unique index if not exists ac_trainees_code_uidx on public.ac_trainees(client_code);
create unique index if not exists ac_invoices_number_uidx on public.ac_invoices(invoice_number);
create unique index if not exists ac_employees_code_uidx on public.ac_employees(employee_code);
create unique index if not exists ac_custom_roles_key_uidx on public.ac_custom_roles(key);
create unique index if not exists ac_page_permissions_path_uidx on public.ac_page_permissions(path);
create unique index if not exists ac_qr_tokens_token_uidx on public.ac_qr_tokens(token);
create unique index if not exists ac_whatsapp_settings_branch_uidx on public.ac_whatsapp_settings(branch_id);
create unique index if not exists ac_lanes_pool_number_uidx on public.ac_lanes(pool_id, lane_number);
create unique index if not exists ac_user_roles_uidx on public.ac_user_roles(user_id, role, coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid));
create unique index if not exists ac_slots_unique_uidx on public.ac_schedule_slots(lane_id, time_slot_id);

create or replace view public.ac_lane_occupancy
with (security_invoker = true) as
select
  ss.id as schedule_slot_id,
  ss.branch_id,
  ss.lane_id,
  l.lane_number,
  l.pool_id,
  p.name as pool_name,
  ss.coach_id,
  ss.group_id,
  ts.day_of_week,
  ts.start_time,
  ts.end_time,
  coalesce(ss.capacity_override, l.default_capacity) as capacity,
  (select count(*) from public.ac_subscriptions s
     where s.schedule_slot_id = ss.id and s.status = 'active' and s.deleted_at is null)::int as occupied
from public.ac_schedule_slots ss
join public.ac_lanes l on l.id = ss.lane_id
join public.ac_pools p on p.id = l.pool_id
join public.ac_time_slots ts on ts.id = ss.time_slot_id
where ss.active;

grant select on public.ac_lane_occupancy to anon, authenticated, service_role;

create or replace function public.ac_generate_client_code()
returns text language sql stable as $$
  select 'LG-' || upper(substring(md5(random()::text || clock_timestamp()::text) for 6));
$$;

create or replace function public.ac_available_coaches(_branch_id uuid, _time_slot_id uuid)
returns table (id uuid, full_name text, title text, department text)
language sql stable security definer set search_path = public as $$
  select pr.id,
         coalesce(pr.display_name, e.full_name, 'Coach') as full_name,
         e.title, e.department
  from public.ac_profiles pr
  left join public.ac_employees e on e.profile_id = pr.id and e.branch_id = _branch_id
  where not exists (
    select 1 from public.ac_schedule_slots ss
    where ss.coach_id = pr.id and ss.time_slot_id = _time_slot_id and ss.active
  )
  order by 2;
$$;

create or replace function public.ac_available_groups(_branch_id uuid, _time_slot_id uuid, _level text default null, _category text default null)
returns table (id uuid, name text, name_ar text, level text, category text, color text, max_capacity integer, current_count integer)
language sql stable security definer set search_path = public as $$
  select g.id, g.name, g.name_ar, g.level, g.category, g.color, g.max_capacity,
    (select count(*) from public.ac_subscriptions s where s.group_id = g.id and s.status='active' and s.deleted_at is null)::int
  from public.ac_groups g
  where g.branch_id = _branch_id and g.active
    and (_level is null or g.level = _level)
    and (_category is null or g.category = _category)
  order by g.name;
$$;

grant execute on function public.ac_generate_client_code() to anon, authenticated, service_role;
grant execute on function public.ac_available_coaches(uuid, uuid) to anon, authenticated, service_role;
grant execute on function public.ac_available_groups(uuid, uuid, text, text) to anon, authenticated, service_role;