-- =============================================================
-- Academy schema integrity check
-- Run this in Supabase SQL editor
-- =============================================================

WITH required_tables AS (
  SELECT 'branches' AS table_name UNION ALL
  SELECT 'ac_trainees' UNION ALL
  SELECT 'ac_subscriptions' UNION ALL
  SELECT 'ac_invoices' UNION ALL
  SELECT 'ac_user_roles' UNION ALL
  SELECT 'ac_attendance'
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
FROM missing_tables
UNION ALL
SELECT 'EXISTS_TABLES' AS check_type, table_name AS item_name
FROM existing_tables
WHERE table_name IN ('branches','ac_trainees','ac_subscriptions','ac_invoices','ac_user_roles','ac_attendance');

-- Verify critical columns
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('branches','ac_trainees','ac_subscriptions','ac_invoices','ac_user_roles','ac_attendance')
  AND column_name IN (
    'id','name','name_ar','branch_id','trainee_id','subscription_id','user_id','role','client_code','full_name','active',
    'status','total_amount','paid_amount','created_at','updated_at','deleted_at'
  )
ORDER BY table_name, column_name;

-- Verify foreign keys for academy data flow
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND (
    tc.table_name IN ('ac_trainees','ac_subscriptions','ac_invoices','ac_user_roles')
    OR ccu.table_name IN ('branches','ac_trainees','ac_subscriptions')
  )
ORDER BY tc.table_name, kcu.column_name;

-- Optional quick counts
SELECT 'branches' AS table_name, COUNT(*) AS row_count FROM public.branches
UNION ALL
SELECT 'ac_trainees', COUNT(*) FROM public.ac_trainees
UNION ALL
SELECT 'ac_subscriptions', COUNT(*) FROM public.ac_subscriptions
UNION ALL
SELECT 'ac_invoices', COUNT(*) FROM public.ac_invoices
UNION ALL
SELECT 'ac_user_roles', COUNT(*) FROM public.ac_user_roles
UNION ALL
SELECT 'ac_attendance', COUNT(*) FROM public.ac_attendance;
