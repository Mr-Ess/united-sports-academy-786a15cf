import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["academy_role"];
type Branch = { id: string; name: string; name_ar: string | null; settings: any };
type Role = { role: AppRole; branch_id: string | null };

interface SessionCtx {
  userId: string | null;
  email: string | null;
  roles: Role[];
  branches: Branch[];
  currentBranchId: string | null;
  setCurrentBranchId: (id: string) => void;
  isSuperAdmin: boolean;
  assignedBranchIds: string[];
  canAccessBranch: (branchId: string | null | undefined) => boolean;
  hasRole: (role: AppRole, branchId?: string | null) => boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<SessionCtx | null>(null);
const LS_BRANCH = "legends-current-branch";

export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [currentBranchId, _setCurrentBranchId] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.session?.user.id ?? null);
      setEmail(data.session?.user.email ?? null);
      setBootstrapping(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setUserId(session?.user.id ?? null);
      setEmail(session?.user.email ?? null);
      if (event !== "SIGNED_OUT") qc.invalidateQueries();
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [qc]);

  const rolesQ = useQuery({
    queryKey: ["my-roles", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Role[]> => {
      const { data, error } = await supabase.from("ac_user_roles").select("role, branch_id");
      if (error) throw error;
      return (data ?? []) as Role[];
    },
  });

  const branchesQ = useQuery({
    queryKey: ["my-branches", userId, (rolesQ.data ?? []).map(r => `${r.role}:${r.branch_id ?? "g"}`).join(",")],
    enabled: !!userId && !rolesQ.isLoading,
    queryFn: async (): Promise<Branch[]> => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name, name_ar, settings")
        .order("name");
      if (error) throw error;
      const all = (data ?? []) as Branch[];
      const roles = rolesQ.data ?? [];
      const isSuper = roles.some((r) => r.role === "super_admin");
      if (isSuper) return all;
      // Restrict to the branches the user is explicitly assigned to via user_roles.
      // Branch-scoped role rows carry branch_id; global rows (null) don't grant branch access on their own.
      const allowed = new Set(roles.map((r) => r.branch_id).filter((x): x is string => !!x));
      return allowed.size === 0 ? [] : all.filter((b) => allowed.has(b.id));
    },
  });

  // Choose initial branch
  useEffect(() => {
    if (!branchesQ.data || branchesQ.data.length === 0) return;
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(LS_BRANCH) : null;
    const exists = stored && branchesQ.data.some((b) => b.id === stored);
    const next = exists ? stored! : branchesQ.data[0].id;
    _setCurrentBranchId(next);
  }, [branchesQ.data]);

  const setCurrentBranchId = (id: string) => {
    _setCurrentBranchId(id);
    try { window.localStorage.setItem(LS_BRANCH, id); } catch {}
  };

  const roles = rolesQ.data ?? [];
  const isSuperAdmin = roles.some((r) => r.role === "super_admin");
  const assignedBranchIds = Array.from(new Set(roles.map((r) => r.branch_id).filter((x): x is string => !!x)));
  const canAccessBranch = (branchId: string | null | undefined) =>
    isSuperAdmin || (!!branchId && assignedBranchIds.includes(branchId));
  const hasRole = (role: AppRole, branchId?: string | null) =>
    isSuperAdmin || roles.some((r) => r.role === role && (!branchId || !r.branch_id || r.branch_id === branchId));

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    try { window.localStorage.removeItem(LS_BRANCH); } catch {}
    window.location.replace("/auth");
  };

  const value: SessionCtx = {
    userId,
    email,
    roles,
    branches: branchesQ.data ?? [],
    currentBranchId,
    setCurrentBranchId,
    isSuperAdmin,
    assignedBranchIds,
    canAccessBranch,
    hasRole,
    loading: bootstrapping || rolesQ.isLoading || branchesQ.isLoading,
    signOut,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession must be used within SessionProvider");
  return v;
}
