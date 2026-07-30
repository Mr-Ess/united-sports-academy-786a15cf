import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AcademyRole =
  | "super_admin"
  | "top_management"
  | "branch_admin"
  | "finance"
  | "hr"
  | "coach"
  | "receptionist"
  | "warehouse"
  | "procurement"
  | "maintenance"
  | "tenant"
  | "trainee";

export const getMyAcademyContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [rolesRes, profileRes, branchesRes] = await Promise.all([
      context.supabase.from("academy_user_roles").select("role, branch_id").eq("user_id", context.userId),
      context.supabase.from("academy_profiles").select("*").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("branches").select("id, name, name_ar, active").eq("active", true).order("sort_order"),
    ]);
    const roles = (rolesRes.data ?? []).map((r) => r.role as AcademyRole);
    return {
      userId: context.userId,
      email: (context.claims.email as string | undefined) ?? null,
      roles,
      isSuperAdmin: roles.includes("super_admin"),
      profile: profileRes.data ?? null,
      branches: branchesRes.data ?? [],
    };
  });

export const listPagePermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("page_permissions")
      .select("*")
      .order("path");
    if (error) throw error;
    return data;
  });
