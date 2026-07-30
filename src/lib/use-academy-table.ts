import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { listRows, upsertRow, deleteRow } from "@/lib/academy-crud.functions";
import { useBranch } from "@/lib/branch-context";
import { supabase } from "@/integrations/supabase/client";

export type Row = Record<string, unknown>;

type Options = {
  order?: { column: string; ascending?: boolean };
  limit?: number;
  realtime?: boolean;
  branchScoped?: boolean;
};

export function useAcademyTable(table: string, opts: Options = {}) {
  const { currentBranchId } = useBranch();
  const qc = useQueryClient();
  const list = useServerFn(listRows);
  const save = useServerFn(upsertRow);
  const remove = useServerFn(deleteRow);
  const branchScoped = opts.branchScoped !== false;
  const queryKey = ["academy-table", table, branchScoped ? currentBranchId : "all"];

  const query = useQuery({
    queryKey,
    queryFn: () =>
      list({
        data: {
          table,
          branch_id: branchScoped ? currentBranchId : null,
          order: opts.order ?? { column: "created_at", ascending: false },
          limit: opts.limit ?? 500,
        },
      }),
    enabled: branchScoped ? !!currentBranchId : true,
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, table, currentBranchId]);

  useEffect(() => {
    if (!opts.realtime || !currentBranchId) return;
    const ch = supabase
      .channel(`rt-${table}-${currentBranchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => invalidate())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [table, currentBranchId, opts.realtime, invalidate]);

  const upsert = useCallback(
    async (payload: Row) => {
      try {
        await save({ data: { table, payload: branchScoped ? { branch_id: currentBranchId, ...payload } : payload } });
        invalidate();
        return true;
      } catch (e) {
        toast.error((e as Error).message);
        return false;
      }
    },
    [save, table, currentBranchId, branchScoped, invalidate],
  );

  const destroy = useCallback(
    async (id: string) => {
      try {
        await remove({ data: { table, id } });
        invalidate();
        return true;
      } catch (e) {
        toast.error((e as Error).message);
        return false;
      }
    },
    [remove, table, invalidate],
  );

  return {
    rows: (query.data ?? []) as Row[],
    isLoading: query.isLoading,
    invalidate,
    upsert,
    destroy,
    currentBranchId,
  };
}

export const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
export const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0) || 0);
export const money = (v: unknown) =>
  `EGP ${num(v).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
export const dmy = (v: unknown) => {
  if (!v) return "—";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};
