-- =============================================================
-- Full System Schema Verification
-- Run after the migration in Supabase SQL editor
-- =============================================================

with required_tables as (
  select unnest(array[
    'branches',
    'ac_profiles',
    'ac_user_roles',
    'ac_trainees',
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
    'hr_attendance',
    'hr_leaves',
    'payroll_runs',
    'payroll_items',
    'group_types',
    'staff_hours',
    'coach_slots',
    'coach_evaluations',
    'pool_sessions',
    'lane_logs',
    'page_permissions',
    'skill_levels',
    'audit_log'
  ]) as table_name
),
actual_tables as (
  select table_name
  from information_schema.tables
  where table_schema = 'public'
),
missing_tables as (
  select t.table_name
  from required_tables t
  left join actual_tables a on a.table_name = t.table_name
  where a.table_name is null
)
select
  case when exists (select 1 from missing_tables) then 'missing_tables_detected' else 'full_system_schema_ready' end as status,
  (select count(*) from missing_tables) as missing_count,
  (select array_agg(table_name order by table_name) from missing_tables) as missing_tables;

select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'branches', 'clients', 'coaches', 'leads', 'courses', 'blog_posts', 'partners',
    'join_submissions', 'site_settings', 'ac_trainees', 'ac_subscriptions', 'ac_invoices', 'ac_attendance'
  )
order by table_name, ordinal_position;
