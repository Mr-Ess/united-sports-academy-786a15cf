# Module to Table Mapping

## Public Website
- Programs: `programs`
- Courses: `courses`
- Blog: `blog_posts`
- Partners: `partners`
- Media: `media_items`
- Contact/Join form: `join_submissions`
- Site settings: `site_settings`

## Academy / CRM
- Branches: `branches`
- Profiles and roles: `ac_profiles`, `ac_user_roles`
- Trainees: `ac_trainees`
- Subscriptions: `ac_subscriptions`
- Invoices: `ac_invoices`
- Attendance: `ac_attendance`
- Accounts and finance: `ac_accounts`, `ac_transactions`
- Groups and pools: `ac_groups`, `ac_pools`, `ac_lanes`, `ac_time_slots`
- Assessments: `ac_assessments`

## HR / Operations
- Employees: `hr_employees`
- HR attendance: `hr_attendance`
- Leave requests: `hr_leaves`
- Payroll: `payroll_runs`, `payroll_items`

## Leads / Clients / Scheduling
- Leads: `leads`, `lead_interactions`
- Clients: `clients`
- Coaches: `coaches`
- Schedule sessions: `schedule_sessions`
- Attendance: `attendance`
- Invoices: `invoices`
- Payments: `payments`

## Admin / Security
- Page permissions: `page_permissions`
- Audit log: `audit_log`
- Skill levels: `skill_levels`

## Relationship Notes
- Every feature table keeps a `branch_id` relationship to `branches`.
- Training records such as `ac_trainees`, `ac_subscriptions`, `ac_attendance` and `payments` are linked by `id` and `branch_id`.
- CRUD screens and permission screens in the app are designed around these tables and their relations.
- For a real live project, the same table structure should be applied in Supabase and then the environment variables should be set with the valid project URL and keys.
