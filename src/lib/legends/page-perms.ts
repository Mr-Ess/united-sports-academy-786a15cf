import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/legends/permissions";

export type PagePermRow = {
  id: string;
  path: string;
  allowed_roles: AppRole[];
  is_public: boolean;
};

export function usePagePerms() {
  return useQuery({
    queryKey: ["page-permissions"],
    queryFn: async (): Promise<PagePermRow[]> => {
      const { data, error } = await supabase
        .from("ac_page_permissions")
        .select("id,path,allowed_roles,is_public")
        .order("path");
      if (error) throw error;
      return (data ?? []) as PagePermRow[];
    },
    staleTime: 60_000,
  });
}

// PERMISSIONS TEMPORARILY DISABLED — always allow.
export function canAccessDynamic(
  _path: string,
  _roles: { role: AppRole; branch_id: string | null }[],
  _isSuperAdmin: boolean,
  _perms: PagePermRow[] | undefined,
): boolean {
  return true;
}

