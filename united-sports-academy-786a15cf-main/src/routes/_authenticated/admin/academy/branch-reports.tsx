import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/legends/i18n";
import { useSession } from "@/lib/legends/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GitCompare, FileSpreadsheet, FileText, FileDown } from "lucide-react";
import { PermissionGate } from "@/components/legends/PermissionGate";
import { exportCSV, exportPDF, exportXLSX, type Row } from "@/lib/legends/export-utils";

export const Route = createFileRoute("/_authenticated/admin/academy/branch-reports")({
  head: () => ({ meta: [{ title: "Branch Comparison · United Sports Academy" }] }),
  component: () => <PermissionGate path="/branch-reports"><BranchReportsPage /></PermissionGate>,
});

type Branch = { id: string; name: string; name_ar: string | null; active: boolean };

function BranchReportsPage() {
  const { lang, t } = useI18n();
  const { branches: allowedBranches, isSuperAdmin } = useSession();
  const L = (en: string, ar: string) => (lang === "ar" ? ar : en);

  const branchesQ = useQuery({
    queryKey: ["br-cmp-branches", isSuperAdmin, allowedBranches.map(b => b.id).join(",")],
    enabled: allowedBranches.length > 0,
    queryFn: async () => {
      const allowedIds = allowedBranches.map((b) => b.id);
      const { data, error } = await supabase
        .from("branches")
        .select("id,name,name_ar,active")
        .is("deleted_at", null)
        .in("id", allowedIds)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Branch[];
    },
  });

  const kpisQ = useQuery({
    queryKey: ["br-cmp-kpis", branchesQ.data?.map((b) => b.id).join(",")],
    enabled: !!branchesQ.data && branchesQ.data.length > 0,
    queryFn: async () => {
      const branches = branchesQ.data!;
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

      const out: Record<string, { trainees: number; employees: number; activeSubs: number; revenue: number; todayAtt: number }> = {};
      await Promise.all(branches.map(async (b) => {
        const [trainees, employees, subs, invoices, att] = await Promise.all([
          supabase.from("ac_trainees").select("id", { count: "exact", head: true }).eq("branch_id", b.id).is("deleted_at", null),
          supabase.from("ac_employees").select("id", { count: "exact", head: true }).eq("branch_id", b.id).eq("status", "active"),
          supabase.from("ac_subscriptions").select("id", { count: "exact", head: true }).eq("branch_id", b.id).eq("status", "active"),
          supabase.from("ac_invoices").select("paid_amount").eq("branch_id", b.id).gte("issue_date", startOfMonth.toISOString().slice(0, 10)),
          supabase.from("ac_attendance").select("id", { count: "exact", head: true }).eq("branch_id", b.id).gte("check_in_at", startOfDay.toISOString()),
        ]);
        const rev = (invoices.data ?? []).reduce((s: number, r: any) => s + Number(r.paid_amount ?? 0), 0);
        out[b.id] = {
          trainees: trainees.count ?? 0,
          employees: employees.count ?? 0,
          activeSubs: subs.count ?? 0,
          revenue: rev,
          todayAtt: att.count ?? 0,
        };
      }));
      return out;
    },
  });

  const branches = branchesQ.data ?? [];
  const kpis = kpisQ.data ?? {};

  const totals = branches.reduce(
    (acc, b) => {
      const k = kpis[b.id]; if (!k) return acc;
      acc.trainees += k.trainees; acc.employees += k.employees;
      acc.activeSubs += k.activeSubs; acc.revenue += k.revenue; acc.todayAtt += k.todayAtt;
      return acc;
    },
    { trainees: 0, employees: 0, activeSubs: 0, revenue: 0, todayAtt: 0 },
  );

  const exportRows = (): Row[] => branches.map((b) => {
    const k = kpis[b.id] ?? { trainees: 0, employees: 0, activeSubs: 0, revenue: 0, todayAtt: 0 };
    return {
      Branch: (lang === "ar" && b.name_ar) || b.name,
      Trainees: k.trainees,
      Employees: k.employees,
      "Active Subscriptions": k.activeSubs,
      "Monthly Revenue": k.revenue,
      "Today Attendance": k.todayAtt,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <GitCompare className="h-7 w-7 text-cyan-glow mt-1" />
          <div>
            <h2 className="text-2xl font-bold">{t("br.compareTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("br.compareSub")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV(exportRows(), "branch-comparison")}>
            <FileDown className="h-4 w-4 me-1" />CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportXLSX([{ name: "Branches", rows: exportRows() }], "branch-comparison")}>
            <FileSpreadsheet className="h-4 w-4 me-1" />Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportPDF({
            title: L("Branch Comparison Report", "تقرير مقارنة الفروع"),
            sections: [{ heading: L("All Branches", "كل الفروع"), rows: exportRows() }],
            filename: "branch-comparison",
          })}>
            <FileText className="h-4 w-4 me-1" />PDF
          </Button>
        </div>
      </div>


      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label={t("br.trainees")} value={totals.trainees} />
        <Kpi label={t("br.employees")} value={totals.employees} />
        <Kpi label={t("br.activeSubs")} value={totals.activeSubs} />
        <Kpi label={t("br.monthRevenue")} value={totals.revenue.toLocaleString()} prefix="EGP " />
        <Kpi label={t("br.todayAttendance")} value={totals.todayAtt} />
      </div>

      <Card className="glass">
        <CardHeader><CardTitle className="text-base">{t("br.compareTitle")}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {branchesQ.isLoading || kpisQ.isLoading ? (
            <div className="py-8 text-center text-muted-foreground">{L("Loading...", "تحميل...")}</div>
          ) : branches.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">{L("No branches yet.", "لا توجد فروع.")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{L("Branch", "الفرع")}</TableHead>
                  <TableHead>{L("Status", "الحالة")}</TableHead>
                  <TableHead className="text-end">{t("br.trainees")}</TableHead>
                  <TableHead className="text-end">{t("br.employees")}</TableHead>
                  <TableHead className="text-end">{t("br.activeSubs")}</TableHead>
                  <TableHead className="text-end">{t("br.monthRevenue")}</TableHead>
                  <TableHead className="text-end">{t("br.todayAttendance")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((b) => {
                  const k = kpis[b.id] ?? { trainees: 0, employees: 0, activeSubs: 0, revenue: 0, todayAtt: 0 };
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{(lang === "ar" && b.name_ar) || b.name}</TableCell>
                      <TableCell><Badge variant={b.active ? "default" : "outline"}>{b.active ? L("Active", "نشط") : L("Inactive", "غير نشط")}</Badge></TableCell>
                      <TableCell className="text-end">{k.trainees}</TableCell>
                      <TableCell className="text-end">{k.employees}</TableCell>
                      <TableCell className="text-end">{k.activeSubs}</TableCell>
                      <TableCell className="text-end font-mono">{k.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-end">{k.todayAtt}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, prefix }: { label: string; value: number | string; prefix?: string }) {
  return (
    <Card className="glass">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-cyan-glow mt-1">{prefix}{value}</p>
      </CardContent>
    </Card>
  );
}
