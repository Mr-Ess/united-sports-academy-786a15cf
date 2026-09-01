import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText } from "lucide-react";

type Row = {
  id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  actor_id: string | null;
  created_at: string;
  before: any;
  after: any;
};

type Profile = { id: string; display_name: string | null };

export function AuditLogPanel({ tables, limit = 25 }: { tables: string[]; limit?: number }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const { currentBranchId } = useSession();

  const q = useQuery({
    queryKey: ["audit-log", currentBranchId, tables.join(","), limit],
    enabled: !!currentBranchId,
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase.from("ac_audit_log")
        .select("id, action, table_name, record_id, actor_id, created_at, before, after")
        .eq("branch_id", currentBranchId!)
        .in("table_name", tables)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) {
        // Likely RLS: hide silently for non-admins
        return [];
      }
      return (data ?? []) as any;
    },
  });

  const actorIds = Array.from(new Set((q.data ?? []).map(r => r.actor_id).filter(Boolean))) as string[];
  const profilesQ = useQuery({
    queryKey: ["audit-profiles", actorIds.join(",")],
    enabled: actorIds.length > 0,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase.from("ac_profiles").select("id, display_name").in("id", actorIds);
      if (error) return [];
      return (data ?? []) as any;
    },
  });
  const nameById = Object.fromEntries((profilesQ.data ?? []).map(p => [p.id, p.display_name || "—"]));

  const rows = q.data ?? [];
  const tone = (a: string) =>
    a === "INSERT" ? "bg-mint/20 text-mint border-mint/40"
      : a === "UPDATE" ? "bg-teal/20 text-cyan-glow border-teal/40"
      : "bg-destructive/20 text-destructive-foreground border-destructive/40";

  const actionLabel = (a: string) =>
    isAr ? (a === "INSERT" ? "إنشاء" : a === "UPDATE" ? "تعديل" : "حذف") : a;

  return (
    <Card className="glass p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ScrollText className="h-4 w-4 text-cyan-glow" />
          {isAr ? "سجل التدقيق" : "Audit Log"}
          <span className="text-xs text-muted-foreground">({rows.length})</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {isAr ? "آخر التغييرات داخل الفرع" : "Latest changes in this branch"}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {isAr ? "لا توجد سجلات تدقيق متاحة." : "No audit entries (or no permission)."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border/30">
                <th className="px-2 py-1.5 text-left">{isAr ? "الوقت" : "Time"}</th>
                <th className="px-2 py-1.5 text-left">{isAr ? "المستخدم" : "User"}</th>
                <th className="px-2 py-1.5 text-left">{isAr ? "الإجراء" : "Action"}</th>
                <th className="px-2 py-1.5 text-left">{isAr ? "الجدول" : "Table"}</th>
                <th className="px-2 py-1.5 text-left">{isAr ? "التغيير" : "Detail"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                let detail = "—";
                if (r.action === "UPDATE" && r.before && r.after) {
                  const diffs: string[] = [];
                  for (const k of Object.keys(r.after)) {
                    if (k === "updated_at" || k === "created_at") continue;
                    if (JSON.stringify(r.before[k]) !== JSON.stringify(r.after[k])) {
                      diffs.push(`${k}: ${fmt(r.before[k])} → ${fmt(r.after[k])}`);
                    }
                  }
                  detail = diffs.slice(0, 3).join(" · ") || "—";
                } else if (r.action === "INSERT" && r.after) {
                  detail = `#${String(r.after.id ?? "").slice(0, 8)}`;
                } else if (r.action === "DELETE" && r.before) {
                  detail = `#${String(r.before.id ?? "").slice(0, 8)}`;
                }
                return (
                  <tr key={r.id} className="border-b border-border/20">
                    <td className="px-2 py-1.5 tabular-nums">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-2 py-1.5">{r.actor_id ? (nameById[r.actor_id] ?? r.actor_id.slice(0, 8)) : "—"}</td>
                    <td className="px-2 py-1.5"><Badge variant="outline" className={tone(r.action)}>{actionLabel(r.action)}</Badge></td>
                    <td className="px-2 py-1.5 text-muted-foreground">{r.table_name}</td>
                    <td className="px-2 py-1.5 text-muted-foreground max-w-[420px] truncate" title={detail}>{detail}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function fmt(v: any) {
  if (v == null) return "∅";
  if (typeof v === "object") return JSON.stringify(v).slice(0, 30);
  return String(v).slice(0, 30);
}
