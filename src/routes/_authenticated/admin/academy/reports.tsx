import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { BranchGuard } from "@/components/legends/BranchGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, FileSpreadsheet, FileDown, FileBarChart, Filter, FileJson } from "lucide-react";
import { exportCSV, exportPDF, exportXLSX, type Row } from "@/lib/legends/export-utils";
import { toast } from "sonner";
import { useI18n } from "@/lib/legends/i18n";

export const Route = createFileRoute("/_authenticated/admin/academy/reports")({
  head: () => ({ meta: [{ title: "Reports · United Sports Academy" }] }),
  component: () => (
    <BranchGuard>
      <ReportsPage />
    </BranchGuard>
  ),
});

type ReportType = "trainees" | "employees" | "schedules" | "attendance" | "financials" | "subscriptions" | "leads" | "coach_attendance";

function ReportsPage() {
  const { t, lang } = useI18n();
  const L = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const { currentBranchId, branches } = useSession();
  const branchName = branches.find((b) => b.id === currentBranchId)?.name ?? "—";

  const [type, setType] = useState<ReportType>("trainees");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  // ---- Data queries, all scoped to currentBranchId ----
  const traineesQ = useQuery({
    queryKey: ["rep-trainees", currentBranchId],
    enabled: !!currentBranchId && type === "trainees",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ac_trainees")
        .select("client_code,first_name,last_name,phone,date_of_birth,active,skill_level_id,created_at")
        .eq("branch_id", currentBranchId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const employeesQ = useQuery({
    queryKey: ["rep-employees", currentBranchId],
    enabled: !!currentBranchId && (type === "employees" || type === "schedules" || type === "coach_attendance"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ac_employees")
        .select("id,full_name,full_name_ar,role,status,phone,hire_date")
        .eq("branch_id", currentBranchId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const slotsQ = useQuery({
    queryKey: ["rep-slots", currentBranchId],
    enabled: !!currentBranchId && type === "schedules",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ac_schedule_slots")
        .select("id,day_of_week,coach_id,lane_id,time_slot_id,capacity,active")
        .eq("branch_id", currentBranchId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const attQ = useQuery({
    queryKey: ["rep-att", currentBranchId, fromDate, toDate],
    enabled: !!currentBranchId && type === "attendance",
    queryFn: async () => {
      let q = supabase
        .from("ac_attendance")
        .select("check_in_at,check_out_at,trainee_id,coach_id,method,notes")
        .eq("branch_id", currentBranchId!)
        .order("check_in_at", { ascending: false })
        .limit(2000);
      if (fromDate) q = q.gte("check_in_at", new Date(fromDate).toISOString());
      if (toDate) {
        const end = new Date(toDate); end.setHours(23, 59, 59, 999);
        q = q.lte("check_in_at", end.toISOString());
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const invoicesQ = useQuery({
    queryKey: ["rep-inv", currentBranchId, fromDate, toDate],
    enabled: !!currentBranchId && type === "financials",
    queryFn: async () => {
      let q = supabase
        .from("ac_invoices")
        .select("invoice_number,issue_date,total_amount,paid_amount,status,trainee_id")
        .eq("branch_id", currentBranchId!)
        .order("issue_date", { ascending: false });
      if (fromDate) q = q.gte("issue_date", fromDate);
      if (toDate) q = q.lte("issue_date", toDate);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const subsQ = useQuery({
    queryKey: ["rep-subs", currentBranchId],
    enabled: !!currentBranchId && type === "subscriptions",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ac_subscriptions")
        .select("start_date,end_date,status,sessions_total,sessions_used,trainee_id,price")
        .eq("branch_id", currentBranchId!)
        .is("deleted_at", null)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const leadsQ = useQuery({
    queryKey: ["rep-leads", currentBranchId, fromDate, toDate],
    enabled: !!currentBranchId && type === "leads",
    queryFn: async () => {
      let q = supabase
        .from("leads" as any)
        .select("name,contact,service,source,status,agent,assessment_date,subscription_type,offer,comments,created_at")
        .eq("branch_id", currentBranchId!)
        .order("created_at", { ascending: false });
      if (fromDate) q = q.gte("created_at", new Date(fromDate).toISOString());
      if (toDate) {
        const end = new Date(toDate); end.setHours(23, 59, 59, 999);
        q = q.lte("created_at", end.toISOString());
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const coachAttQ = useQuery({
    queryKey: ["rep-coach-att", currentBranchId, fromDate, toDate],
    enabled: !!currentBranchId && type === "coach_attendance",
    queryFn: async () => {
      let q = supabase
        .from("ac_employee_attendance")
        .select("employee_id,check_in_at,check_out_at,notes,method")
        .eq("branch_id", currentBranchId!)
        .order("check_in_at", { ascending: false })
        .limit(2000);
      if (fromDate) q = q.gte("check_in_at", new Date(fromDate).toISOString());
      if (toDate) {
        const end = new Date(toDate); end.setHours(23, 59, 59, 999);
        q = q.lte("check_in_at", end.toISOString());
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const matchSearch = (...vals: (string | number | null | undefined)[]) => {
    if (!search.trim()) return true;
    const s = search.trim().toLowerCase();
    return vals.some((v) => String(v ?? "").toLowerCase().includes(s));
  };

  const sections: { title: string; rows: Row[] }[] = useMemo(() => {
    switch (type) {
      case "trainees": {
        return [{
          title: L("Trainees Roster", "سجل المتدربين"),
          rows: (traineesQ.data ?? [])
            .filter((r: any) => matchSearch(r.client_code, r.first_name, r.last_name, r.phone))
            .map((r: any) => ({
              [L("Client ID", "كود العميل")]: r.client_code,
              [L("First Name", "الاسم الأول")]: r.first_name,
              [L("Last Name", "اسم العائلة")]: r.last_name,
              [L("Phone", "الهاتف")]: r.phone ?? "",
              [L("DOB", "تاريخ الميلاد")]: r.date_of_birth ?? "",
              [L("Status", "الحالة")]: r.active ? L("Active", "نشط") : L("Inactive", "غير نشط"),
              [L("Created", "تاريخ الإنشاء")]: String(r.created_at ?? "").slice(0, 10),
            })),
        }];
      }
      case "employees": {
        return [{
          title: L("Employees Directory", "دليل الموظفين"),
          rows: (employeesQ.data ?? [])
            .filter((r: any) => matchSearch(r.full_name, r.full_name_ar, r.phone, r.role))
            .map((r: any) => ({
              [L("Name", "الاسم")]: lang === "ar" ? (r.full_name_ar || r.full_name) : r.full_name,
              [L("Role", "الدور")]: r.role,
              [L("Status", "الحالة")]: r.status,
              [L("Phone", "الهاتف")]: r.phone ?? "",
              [L("Hire Date", "تاريخ التعيين")]: r.hire_date ?? "",
            })),
        }];
      }
      case "schedules": {
        const empById = new Map((employeesQ.data ?? []).map((e: any) => [e.id, e]));
        return [{
          title: L("Schedule Slots", "جدول الحصص"),
          rows: (slotsQ.data ?? [])
            .filter((s: any) => {
              const emp = empById.get(s.coach_id);
              return matchSearch(emp?.full_name, emp?.full_name_ar);
            })
            .map((s: any) => {
              const emp: any = empById.get(s.coach_id);
              return {
                [L("Day", "اليوم")]: s.day_of_week,
                [L("Coach", "المدرب")]: emp ? (lang === "ar" ? emp.full_name_ar || emp.full_name : emp.full_name) : "—",
                [L("Capacity", "السعة")]: s.capacity,
                [L("Active", "نشط")]: s.active ? "✓" : "—",
              };
            }),
        }];
      }
      case "attendance": {
        return [{
          title: L("Attendance Log", "سجل الحضور"),
          rows: (attQ.data ?? [])
            .filter((a: any) => matchSearch(a.method, a.notes))
            .map((a: any) => ({
              [L("Check In", "وقت الدخول")]: a.check_in_at ? new Date(a.check_in_at).toLocaleString() : "",
              [L("Check Out", "وقت الخروج")]: a.check_out_at ? new Date(a.check_out_at).toLocaleString() : "",
              [L("Method", "الطريقة")]: a.method ?? "",
              [L("Notes", "ملاحظات")]: a.notes ?? "",
            })),
        }];
      }
      case "financials": {
        const inv = (invoicesQ.data ?? []).filter((r: any) => matchSearch(r.invoice_number, r.status));
        const totalBilled = inv.reduce((s: number, r: any) => s + Number(r.total_amount ?? 0), 0);
        const totalPaid = inv.reduce((s: number, r: any) => s + Number(r.paid_amount ?? 0), 0);
        return [
          {
            title: L("Invoices", "الفواتير"),
            rows: inv.map((r: any) => ({
              [L("Invoice #", "رقم الفاتورة")]: r.invoice_number,
              [L("Issue Date", "تاريخ الإصدار")]: r.issue_date,
              [L("Status", "الحالة")]: r.status,
              [L("Total", "الإجمالي")]: Number(r.total_amount ?? 0),
              [L("Paid", "المدفوع")]: Number(r.paid_amount ?? 0),
              [L("Outstanding", "المتبقي")]: Number(r.total_amount ?? 0) - Number(r.paid_amount ?? 0),
            })),
          },
          {
            title: L("Summary", "الملخص"),
            rows: [
              { [L("Metric", "البند")]: L("Total Billed", "إجمالي الفواتير"), [L("Value (EGP)", "القيمة (ج.م)")]: totalBilled },
              { [L("Metric", "البند")]: L("Total Paid", "إجمالي المدفوع"), [L("Value (EGP)", "القيمة (ج.م)")]: totalPaid },
              { [L("Metric", "البند")]: L("Outstanding", "المتبقي"), [L("Value (EGP)", "القيمة (ج.م)")]: totalBilled - totalPaid },
            ],
          },
        ];
      }
      case "subscriptions": {
        return [{
          title: L("Subscriptions", "الاشتراكات"),
          rows: (subsQ.data ?? [])
            .filter((r: any) => matchSearch(r.status))
            .map((r: any) => ({
              [L("Start", "البداية")]: r.start_date,
              [L("End", "النهاية")]: r.end_date,
              [L("Status", "الحالة")]: r.status,
              [L("Sessions", "الحصص")]: `${r.sessions_used ?? 0}/${r.sessions_total ?? 0}`,
              [L("Price", "السعر")]: Number(r.price ?? 0),
            })),
        }];
      }
      case "leads": {
        const rows = (leadsQ.data ?? [])
          .filter((r: any) => matchSearch(r.name, r.contact, r.status, r.agent, r.source))
          .map((r: any) => ({
            [L("Name", "الاسم")]: r.name,
            [L("Contact", "التواصل")]: r.contact,
            [L("Service", "الخدمة")]: r.service,
            [L("Source", "المصدر")]: r.source,
            [L("Status", "الحالة")]: r.status,
            [L("Agent", "المسؤول")]: r.agent,
            [L("Assessment", "التقييم")]: r.assessment_date ?? "",
            [L("Comments", "ملاحظات")]: r.comments ?? "",
            [L("Created", "الإنشاء")]: String(r.created_at ?? "").slice(0, 10),
          }));
        // Bucket by status (Interested = Hot, Pending Follow-up = Warm, Refused = Cold, etc.)
        const buckets: Record<string, any[]> = {};
        for (const r of leadsQ.data ?? []) {
          const k = (r as any).status || L("Unspecified", "غير محدد");
          (buckets[k] = buckets[k] || []).push(r);
        }
        const summary = Object.entries(buckets).map(([status, arr]) => ({
          [L("Status", "الحالة")]: status,
          [L("Count", "العدد")]: arr.length,
        }));
        return [
          { title: L("Leads", "العملاء المحتملون"), rows },
          { title: L("Summary by Status", "ملخص حسب الحالة"), rows: summary },
        ];
      }
      case "coach_attendance": {
        const empById = new Map((employeesQ.data ?? []).map((e: any) => [e.id, e]));
        return [{
          title: L("Coach Attendance", "حضور المدربين"),
          rows: (coachAttQ.data ?? [])
            .filter((a: any) => {
              const emp: any = empById.get(a.employee_id);
              return matchSearch(emp?.full_name, emp?.full_name_ar, a.method, a.notes);
            })
            .map((a: any) => {
              const emp: any = empById.get(a.employee_id);
              return {
                [L("Coach", "المدرب")]: emp ? (lang === "ar" ? emp.full_name_ar || emp.full_name : emp.full_name) : "—",
                [L("Check In", "وقت الدخول")]: a.check_in_at ? new Date(a.check_in_at).toLocaleString() : "",
                [L("Check Out", "وقت الخروج")]: a.check_out_at ? new Date(a.check_out_at).toLocaleString() : "",
                [L("Method", "الطريقة")]: a.method ?? "",
                [L("Notes", "ملاحظات")]: a.notes ?? "",
              };
            }),
        }];
      }
      default:
        return [];
    }
  }, [type, lang, search, traineesQ.data, employeesQ.data, slotsQ.data, attQ.data, invoicesQ.data, subsQ.data, leadsQ.data, coachAttQ.data]);

  const totalRows = sections.reduce((s, d) => s + d.rows.length, 0);
  const dateRange = fromDate || toDate ? `${fromDate || "…"} → ${toDate || "…"}` : L("All dates", "كل التواريخ");
  const filename = `legends-${branchName.replace(/\s+/g, "_")}-${type}-${new Date().toISOString().slice(0, 10)}`;

  const onCSV = () => {
    if (totalRows === 0) return toast.error(L("No data to export", "لا توجد بيانات للتصدير"));
    if (sections.length === 1) exportCSV(sections[0].rows, filename);
    else sections.forEach((d, i) => exportCSV(d.rows, `${filename}-${i + 1}-${d.title.replace(/\s+/g, "_")}`));
    toast.success(L("CSV exported", "تم تصدير CSV"));
  };
  const onXLSX = () => {
    if (totalRows === 0) return toast.error(L("No data to export", "لا توجد بيانات للتصدير"));
    exportXLSX(sections.map((d) => ({ name: d.title, rows: d.rows })), filename);
    toast.success(L("Excel exported", "تم تصدير Excel"));
  };
  const onPDF = () => {
    if (totalRows === 0) return toast.error(L("No data to export", "لا توجد بيانات للتصدير"));
    exportPDF({
      title: `United Sports Academy — ${TITLES(L)[type]} — ${branchName}`,
      subtitle: `${dateRange} · ${totalRows} ${L("records", "سجل")} · ${new Date().toLocaleString()}`,
      sections: sections.map((d) => ({ heading: d.title, rows: d.rows })),
      filename,
    });
    toast.success(L("PDF exported", "تم تصدير PDF"));
  };
  const onJSON = () => {
    if (totalRows === 0) return toast.error(L("No data to export", "لا توجد بيانات للتصدير"));
    const payload = {
      branch: branchName,
      branch_id: currentBranchId,
      report: type,
      generated_at: new Date().toISOString(),
      date_range: { from: fromDate || null, to: toDate || null },
      sections,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success(L("JSON exported", "تم تصدير JSON"));
  };

  const loading =
    (type === "trainees" && traineesQ.isLoading) ||
    (type === "employees" && employeesQ.isLoading) ||
    (type === "schedules" && (slotsQ.isLoading || employeesQ.isLoading)) ||
    (type === "attendance" && attQ.isLoading) ||
    (type === "financials" && invoicesQ.isLoading) ||
    (type === "subscriptions" && subsQ.isLoading) ||
    (type === "leads" && leadsQ.isLoading) ||
    (type === "coach_attendance" && (coachAttQ.isLoading || employeesQ.isLoading));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-teal/15 p-2.5 ring-1 ring-teal/30"><FileBarChart className="h-5 w-5 text-cyan-glow" /></div>
        <div>
          <h2 className="text-xl font-bold">{t("pg.reports.h")}</h2>
          <p className="text-xs text-muted-foreground">
            {L("Scoped to branch:", "ضمن نطاق فرع:")} <span className="text-cyan-glow font-semibold">{branchName}</span>
          </p>
        </div>
      </div>

      <Tabs value={type} onValueChange={(v) => setType(v as ReportType)}>
        <TabsList className="bg-card/40 backdrop-blur flex-wrap h-auto">
          <TabsTrigger value="trainees">{L("Trainees", "المتدربون")}</TabsTrigger>
          <TabsTrigger value="employees">{L("Employees", "الموظفون")}</TabsTrigger>
          <TabsTrigger value="schedules">{L("Schedules", "الجداول")}</TabsTrigger>
          <TabsTrigger value="attendance">{L("Trainee Attendance", "حضور المتدربين")}</TabsTrigger>
          <TabsTrigger value="coach_attendance">{L("Coach Attendance", "حضور المدربين")}</TabsTrigger>
          <TabsTrigger value="financials">{L("Financials", "الماليات")}</TabsTrigger>
          <TabsTrigger value="subscriptions">{L("Subscriptions", "الاشتراكات")}</TabsTrigger>
          <TabsTrigger value="leads">{L("CRM / Leads", "العملاء المحتملون")}</TabsTrigger>
        </TabsList>

        <Card className="glass mt-4 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
            <Filter className="h-3.5 w-3.5" /> {L("Filters", "تصفية")}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4">
            <Field label={L("From", "من")}>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </Field>
            <Field label={L("To", "إلى")}>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </Field>
            <Field label={L("Search", "بحث")}>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={L("Name, code, phone…", "اسم، كود، هاتف…")}
              />
            </Field>
          </div>
        </Card>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">{totalRows}</span> {L("records", "سجل")} · {dateRange}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onCSV} variant="outline" className="border-teal/40"><FileText className="h-4 w-4" /> CSV</Button>
            <Button onClick={onXLSX} variant="outline" className="border-mint/40"><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
            <Button onClick={onJSON} variant="outline" className="border-cyan-glow/40"><FileJson className="h-4 w-4" /> JSON</Button>
            <Button onClick={onPDF} className="bg-gradient-to-r from-teal to-cyan-glow text-primary-foreground"><FileDown className="h-4 w-4" /> PDF</Button>
          </div>
        </div>

        <TabsContent value={type} className="mt-4">
          {loading ? (
            <Card className="glass p-8 text-center text-sm text-muted-foreground">
              {L("Loading…", "تحميل…")}
            </Card>
          ) : (
            sections.map((d, idx) => (
              <Card key={idx} className="glass mb-4 overflow-hidden p-0">
                <div className="border-b border-border/40 px-4 py-3 text-sm font-semibold">
                  {d.title} <span className="text-xs text-muted-foreground ml-2">({d.rows.length})</span>
                </div>
                <div className="overflow-x-auto max-h-[420px]">
                  {d.rows.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      {L("No records match the current filters.", "لا توجد سجلات مطابقة.")}
                    </div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-card/90 backdrop-blur">
                        <tr>
                          {Object.keys(d.rows[0]).map((k) => (
                            <th key={k} className="px-3 py-2 text-start font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {d.rows.map((r, i) => (
                          <tr key={i} className="border-b border-border/20 hover:bg-background/30">
                            {Object.keys(d.rows[0]).map((k) => (
                              <td key={k} className="px-3 py-2 whitespace-nowrap">{String(r[k] ?? "")}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

const TITLES = (L: (en: string, ar: string) => string): Record<ReportType, string> => ({
  trainees: L("Trainees Report", "تقرير المتدربين"),
  employees: L("Employees Report", "تقرير الموظفين"),
  schedules: L("Schedules Report", "تقرير الجداول"),
  attendance: L("Attendance Report", "تقرير الحضور"),
  financials: L("Financial Report", "تقرير مالي"),
  subscriptions: L("Subscriptions Report", "تقرير الاشتراكات"),
  leads: L("CRM / Leads Report", "تقرير العملاء المحتملين"),
  coach_attendance: L("Coach Attendance Report", "تقرير حضور المدربين"),
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
