-- =============================================================
-- United Sports Academy - Final Local Complete SQL Loader
-- Purpose: single entry-point for full local schema + seed data
-- Usage:
--   psql "$DATABASE_URL" -f supabase/final_local_complete.sql
-- =============================================================

\echo 'Loading United Sports Academy full schema...'
\i 'supabase/full_system_complete_demo.sql'

\echo 'Final local schema load complete.'
