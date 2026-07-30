import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
type JsonRow = { [k: string]: JsonValue };

const ALLOWED = new Set<string>([
  "leads",
  "lead_interactions",
  "clients",
  "coaches",
  "subscriptions",
  "invoices",
  "payments",
  "schedule_sessions",
  "attendance",
  "lane_logs",
  "assessments",
  "pool_sessions",
  "hr_employees",
  "hr_attendance",
  "hr_leaves",
  "payroll_runs",
  "payroll_items",
  "academy_notifications",
  "skill_levels",
  "branches",
  "page_permissions",
  "audit_log",
  "coach_evaluations",
  "trainee_evaluations",
  "group_types",
  "coach_slots",
  "schedule_bookings",
  "staff_hours",
]);

type ListInput = {
  table: string;
  branch_id?: string | null;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  select?: string;
};

export const listRows = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: ListInput) => {
    if (!ALLOWED.has(data.table)) throw new Error("Table not allowed");
    return data;
  })
  .handler(async ({ data, context }) => {
    let q = context.supabase.from(data.table as never).select(data.select ?? "*");
    if (data.branch_id) q = q.eq("branch_id", data.branch_id);
    if (data.order) q = q.order(data.order.column, { ascending: data.order.ascending ?? false });
    q = q.limit(data.limit ?? 500);
    const { data: rows, error } = await q;
    if (error) throw error;
    return JSON.parse(JSON.stringify(rows ?? [])) as JsonRow[];
  });

type SaveInput = { table: string; payload: Record<string, unknown> };

export const upsertRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: SaveInput) => {
    if (!ALLOWED.has(data.table)) throw new Error("Table not allowed");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { error, data: saved } = await context.supabase
      .from(data.table as never)
      .upsert(data.payload as never)
      .select()
      .maybeSingle();
    if (error) throw error;
    return JSON.parse(JSON.stringify(saved ?? null)) as JsonRow | null;
  });

type DeleteInput = { table: string; id: string };

export const deleteRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: DeleteInput) => {
    if (!ALLOWED.has(data.table)) throw new Error("Table not allowed");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from(data.table as never).delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
