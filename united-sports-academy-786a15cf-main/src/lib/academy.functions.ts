import { createServerFn } from "@tanstack/react-start";

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
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: branches, error } = await supabaseAdmin
      .from("branches")
      .select("id, name, name_ar, active")
      .eq("active", true)
      .order("sort_order");
    if (error) throw error;
    return {
      userId: null,
      email: null,
      roles: [] as AcademyRole[],
      isSuperAdmin: true,
      profile: null,
      branches: branches ?? [],
    };
  });

export const listPagePermissions = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("page_permissions")
      .select("*")
      .order("path");
    if (error) throw error;
    return data;
  });
