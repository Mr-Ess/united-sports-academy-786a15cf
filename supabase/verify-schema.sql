-- =============================================================
-- United Sports Academy - Live Supabase Schema Verification
-- Run this in Supabase SQL Editor on the REAL project
-- =============================================================

-- 1) Check missing required tables
WITH required_tables AS (
  SELECT 'branches' AS table_name UNION ALL
  SELECT 'ac_profiles' UNION ALL
  SELECT 'ac_user_roles' UNION ALL
  SELECT 'ac_trainees' UNION ALL
  SELECT 'ac_subscriptions' UNION ALL
  SELECT 'ac_invoices' UNION ALL
  SELECT 'ac_attendance' UNION ALL
  SELECT 'ac_accounts' UNION ALL
  SELECT 'ac_transactions' UNION ALL
  SELECT 'ac_groups' UNION ALL
  SELECT 'ac_pools' UNION ALL
  SELECT 'ac_lanes' UNION ALL
  SELECT 'ac_time_slots' UNION ALL
  SELECT 'ac_assessments'
),
existing_tables AS (
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
),
missing_tables AS (
  SELECT rt.table_name
  FROM required_tables rt
  LEFT JOIN existing_tables et ON et.table_name = rt.table_name
  WHERE et.table_name IS NULL
)
SELECT 'MISSING_TABLES' AS check_type, table_name AS item_name
FROM missing_tables;

-- 2) Check that core relationships exist
SELECT
  tc.table_name AS child_table,
  kcu.column_name AS child_column,
  ccu.table_name AS parent_table,
  ccu.column_name AS parent_column,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND (
    tc.table_name IN (
      'ac_trainees',
      'ac_subscriptions',
      'ac_invoices',
      'ac_attendance',
      'ac_accounts',
      'ac_transactions',
      'ac_groups',
      'ac_lanes',
      'ac_assessments'
    )
    OR ccu.table_name IN ('branches', 'ac_trainees', 'ac_subscriptions')
  )
ORDER BY tc.table_name, kcu.column_name;

-- 3) Check key columns exist
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
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
    'ac_assessments'
  )
  AND column_name IN (
    'id', 'name', 'name_ar', 'branch_id', 'trainee_id', 'subscription_id',
    'user_id', 'role', 'client_code', 'full_name', 'active', 'status',
    'total_amount', 'paid_amount', 'created_at', 'updated_at', 'deleted_at'
  )
ORDER BY table_name, column_name;

-- 4) Quick counts for core academy tables
SELECT 'branches' AS table_name, COUNT(*) AS row_count FROM public.branches
UNION ALL
SELECT 'ac_trainees', COUNT(*) FROM public.ac_trainees
UNION ALL
SELECT 'ac_subscriptions', COUNT(*) FROM public.ac_subscriptions
UNION ALL
SELECT 'ac_invoices', COUNT(*) FROM public.ac_invoices
UNION ALL
SELECT 'ac_attendance', COUNT(*) FROM public.ac_attendance
UNION ALL
SELECT 'ac_accounts', COUNT(*) FROM public.ac_accounts;

-- 5) Check if required enum exists
SELECT
  t.typname AS enum_name,
  e.enumlabel AS value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'academy_role'
ORDER BY e.enumsortorder;
