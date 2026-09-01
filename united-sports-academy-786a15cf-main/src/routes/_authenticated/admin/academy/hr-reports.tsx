import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, Download, FileText, Clock3, CalendarOff, Wallet, Award } from "lucide-react";
import { exportCSV, exportXLSX, exportPDF, type Row } from "@/lib/legends/export-utils";

import { PermissionGate } from "@/components/legends/PermissionGate";

export const Route = createFileRoute("/_authenticated/admin/academy/hr-reports")({
  head: () => ({ meta: [{ title: "HR Reports · United Sports Academy" }] }),
  component: () => <PermissionGate path="/hr-reports"><HRReportsPage /></PermissionGate>,
});

type Employee = { id: string; employee_code: string; full_name: string; full_name_ar: string | null; department: string | null; title: string | null; base_salary: number };
type EmpAtt = { id: string; employee_id: string; work_date: string; clock_in: string | null; clock_out: string | null; hours_worked: number | null; status: string };
type Leave = { id: string; employee_id: string; leave_type: string; start_date: string; end_date: string; days: number; status: string; reason: string | null };
type PayrollRun = { id: string; period_year: number; period_month: number; status: string; total_amount: number };
type PayrollItem = { id: string; payroll_run_id: string; employee_id: string; base_salary: number; allowances: number; deductions: number; bonuses: number; net_pay: number };

function todayISO() { return new Date().toISOString().slice(0, 10); }
function monthStart() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }

function HRReportsPage() {
  const { currentBranchId } = useSession();
  const { lang } = useI18n();
  const L = (en: string, ar: string) => (lang === "ar" ? ar : en);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <FileSpreadsheet className="h-7 w-7 text-cyan-glow mt-1" />
        <div>
          <h2 className="text-2xl font-bold">{L("HR Reports", "تقارير الموظفين")}</h2>
          <p className="text-sm text-muted-foreground">{L("Attendance, leaves, payroll & coach performance", "الحضور والإجازات والمرتبات وأداء المدربين")}</p>
        </div>
      </div>

      {!currentBranchId ? (
        <Card className="glass"><CardContent className="py-10 text-center text-muted-foreground">{L("Select a branch", "اختر فرعًا")}</CardContent></Card>
      ) : (
        <Tabs defaultValue="attendance" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="attendance"><Clock3 className="h-4 w-4 mr-1" />{L("Attendance", "الحضور والانصراف")}</TabsTrigger>
            <TabsTrigger value="leaves"><CalendarOff className="h-4 w-4 mr-1" />{L("Leaves & Permits", "الإجازات والأذونات")}</TabsTrigger>
            <TabsTrigger value="payroll"><Wallet className="h-4 w-4 mr-1" />{L("Payroll", "الرواتب")}</TabsTrigger>
            <TabsTrigger value="coaches"><Award className="h-4 w-4 mr-1" />{L("Coach Performance", "أداء المدربين")}</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance"><AttendanceReport branchId={currentBranchId} L={L} /></TabsContent>
          <TabsContent value="leaves"><LeavesReport branchId={currentBranchId} L={L} /></TabsContent>
          <TabsContent value="payroll"><PayrollReport branchId={currentBranchId} L={L} /></TabsContent>
          <TabsContent value="coaches"><CoachReport branchId={currentBranchId} L={L} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function ExportBar({ rows, filename, title }: { rows: Row[]; filename: string; title: string }) {
  const { lang } = useI18n();
  const L = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const disabled = rows.length === 0;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground">{rows.length} {L("rows", "صف")}</span>
      <Button size="sm" variant="outline" disabled={disabled} onClick={() => exportCSV(rows, filename)}><Download className="h-3.5 w-3.5 mr-1" />CSV</Button>
      <Button size="sm" variant="outline" disabled={disabled} onClick={() => exportXLSX([{ name: title.slice(0,30), rows }], filename)}><Download className="h-3.5 w-3.5 mr-1" />Excel</Button>
      <Button size="sm" variant="outline" disabled={disabled} onClick={() => exportPDF({ title, sections: [{ heading: title, rows }], filename })}><FileText className="h-3.5 w-3.5 mr-1" />PDF</Button>
    </div>
  );
}

// ---------- Attendance ----------
function AttendanceReport({ branchId, L }: { branchId: string; L: (en: string, ar: string) => string }) {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(todayISO());
  const [empId, setEmpId] = useState<string>("all");

  const empsQ = useQuery({ queryKey: ["hr-emp-min", branchId], queryFn: async () => {
    const { data, error } = await supabase.from("ac_employees").select("id, employee_code, full_name, full_name_ar, department, title, base_salary").eq("branch_id", branchId).order("full_name");
    if (error) throw error; return data as Employee[];
  }});
  const attQ = useQuery({ queryKey: ["hr-att", branchId, from, to, empId], queryFn: async () => {
    let q = supabase.from("ac_employee_attendance").select("*").eq("branch_id", branchId).gte("work_date", from).lte("work_date", to).order("work_date", { ascending: false });
    if (empId !== "all") q = q.eq("employee_id", empId);
    const { data, error } = await q; if (error) throw error; return data as EmpAtt[];
  }});

  const empMap = useMemo(() => Object.fromEntries((empsQ.data ?? []).map(e => [e.id, e])), [empsQ.data]);
  const rows: Row[] = useMemo(() => (attQ.data ?? []).map(a => {
    const e = empMap[a.employee_id];
    return {
      [L("Date","التاريخ")]: a.work_date,
      [L("Code","الكود")]: e?.employee_code ?? "",
      [L("Employee","الموظف")]: e?.full_name ?? "",
      [L("Department","القسم")]: e?.department ?? "",
      [L("Clock In","الحضور")]: a.clock_in ? new Date(a.clock_in).toLocaleTimeString() : "",
      [L("Clock Out","الانصراف")]: a.clock_out ? new Date(a.clock_out).toLocaleTimeString() : "",
      [L("Hours","ساعات")]: a.hours_worked ?? 0,
      [L("Status","الحالة")]: a.status,
    };
  }), [attQ.data, empMap, L]);

  const totalHours = rows.reduce((s, r) => s + Number(r[L("Hours","ساعات")] ?? 0), 0);
  const presentCount = (attQ.data ?? []).filter(a => a.status === "present").length;
  const lateCount = (attQ.data ?? []).filter(a => a.status === "late").length;
  const absentCount = (attQ.data ?? []).filter(a => a.status === "absent").length;

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
        <CardTitle className="text-base">{L("Attendance Report", "تقرير الحضور")}</CardTitle>
        <ExportBar rows={rows} filename={`hr-attendance-${from}_${to}`} title={L("HR Attendance","حضور الموظفين")} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label={L("From","من")}><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label={L("To","إلى")}><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          <Field label={L("Employee","الموظف")}>
            <Select value={empId} onValueChange={setEmpId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L("All","الكل")}</SelectItem>
                {(empsQ.data ?? []).map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-end"><div className="text-xs text-muted-foreground">{L("Total hours","إجمالي ساعات")}: <span className="text-cyan-glow font-bold">{totalHours.toFixed(1)}</span></div></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <KpiPill label={L("Present","حاضر")} value={presentCount} tone="emerald" />
          <KpiPill label={L("Late","متأخر")} value={lateCount} tone="amber" />
          <KpiPill label={L("Absent","غائب")} value={absentCount} tone="rose" />
        </div>
        <DataTable rows={rows} empty={L("No records.","لا توجد سجلات.")} />
      </CardContent>
    </Card>
  );
}

// ---------- Leaves ----------
function LeavesReport({ branchId, L }: { branchId: string; L: (en: string, ar: string) => string }) {
  const [status, setStatus] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(todayISO());

  const empsQ = useQuery({ queryKey: ["hr-emp-min", branchId], queryFn: async () => {
    const { data, error } = await supabase.from("ac_employees").select("id, employee_code, full_name, full_name_ar, department, title, base_salary").eq("branch_id", branchId);
    if (error) throw error; return data as Employee[];
  }});
  const leavesQ = useQuery({ queryKey: ["hr-leaves", branchId, status, type, from, to], queryFn: async () => {
    let q = supabase.from("ac_leave_requests").select("*").eq("branch_id", branchId)
      .gte("start_date", from).lte("start_date", to)
      .order("start_date", { ascending: false });
    if (status !== "all") q = q.eq("status", status);
    if (type !== "all") q = q.eq("leave_type", type);
    const { data, error } = await q; if (error) throw error; return data as Leave[];
  }});

  const empMap = useMemo(() => Object.fromEntries((empsQ.data ?? []).map(e => [e.id, e])), [empsQ.data]);
  const rows: Row[] = useMemo(() => (leavesQ.data ?? []).map(l => ({
    [L("Employee","الموظف")]: empMap[l.employee_id]?.full_name ?? "",
    [L("Type","النوع")]: l.leave_type,
    [L("From","من")]: l.start_date,
    [L("To","إلى")]: l.end_date,
    [L("Days","الأيام")]: l.days,
    [L("Status","الحالة")]: l.status,
    [L("Reason","السبب")]: l.reason ?? "",
  })), [leavesQ.data, empMap, L]);

  const pending = (leavesQ.data ?? []).filter(l => l.status === "pending").length;
  const approved = (leavesQ.data ?? []).filter(l => l.status === "approved").length;
  const rejected = (leavesQ.data ?? []).filter(l => l.status === "rejected").length;

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
        <CardTitle className="text-base">{L("Leaves & Permits","الإجازات والأذونات")}</CardTitle>
        <ExportBar rows={rows} filename="hr-leaves" title={L("Leaves & Permits","الإجازات والأذونات")} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label={L("From","من")}><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label={L("To","إلى")}><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          <Field label={L("Status","الحالة")}>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L("All","الكل")}</SelectItem>
                <SelectItem value="pending">{L("Pending","معلق")}</SelectItem>
                <SelectItem value="approved">{L("Approved","معتمد")}</SelectItem>
                <SelectItem value="rejected">{L("Rejected","مرفوض")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={L("Type","النوع")}>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L("All","الكل")}</SelectItem>
                <SelectItem value="annual">{L("Annual","سنوية")}</SelectItem>
                <SelectItem value="sick">{L("Sick","مرضية")}</SelectItem>
                <SelectItem value="permit">{L("Permit","إذن")}</SelectItem>
                <SelectItem value="unpaid">{L("Unpaid","بدون مرتب")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <KpiPill label={L("Pending","معلق")} value={pending} tone="amber" />
          <KpiPill label={L("Approved","معتمد")} value={approved} tone="emerald" />
          <KpiPill label={L("Rejected","مرفوض")} value={rejected} tone="rose" />
        </div>
        <DataTable rows={rows} empty={L("No leave requests.","لا توجد طلبات.")} />
      </CardContent>
    </Card>
  );
}

// ---------- Payroll ----------
function PayrollReport({ branchId, L }: { branchId: string; L: (en: string, ar: string) => string }) {
  const runsQ = useQuery({ queryKey: ["hr-runs", branchId], queryFn: async () => {
    const { data, error } = await supabase.from("ac_payroll_runs").select("*").eq("branch_id", branchId).order("period_year", { ascending: false }).order("period_month", { ascending: false });
    if (error) throw error; return data as PayrollRun[];
  }});
  const [runId, setRunId] = useState<string>("");
  const activeRun = runId || (runsQ.data?.[0]?.id ?? "");

  const empsQ = useQuery({ queryKey: ["hr-emp-min", branchId], queryFn: async () => {
    const { data, error } = await supabase.from("ac_employees").select("id, employee_code, full_name, full_name_ar, department, title, base_salary").eq("branch_id", branchId);
    if (error) throw error; return data as Employee[];
  }});
  const itemsQ = useQuery({ queryKey: ["hr-items", activeRun], enabled: !!activeRun, queryFn: async () => {
    const { data, error } = await supabase.from("ac_payroll_items").select("*").eq("payroll_run_id", activeRun);
    if (error) throw error; return data as PayrollItem[];
  }});

  const empMap = useMemo(() => Object.fromEntries((empsQ.data ?? []).map(e => [e.id, e])), [empsQ.data]);
  const rows: Row[] = useMemo(() => (itemsQ.data ?? []).map(i => ({
    [L("Code","الكود")]: empMap[i.employee_id]?.employee_code ?? "",
    [L("Employee","الموظف")]: empMap[i.employee_id]?.full_name ?? "",
    [L("Base","أساسي")]: i.base_salary.toFixed(2),
    [L("Allowances","بدلات")]: i.allowances.toFixed(2),
    [L("Bonuses","حوافز")]: i.bonuses.toFixed(2),
    [L("Deductions","خصومات")]: i.deductions.toFixed(2),
    [L("Net Pay","الصافي")]: i.net_pay.toFixed(2),
  })), [itemsQ.data, empMap, L]);

  const total = (itemsQ.data ?? []).reduce((s, i) => s + Number(i.net_pay), 0);

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
        <CardTitle className="text-base">{L("Payroll Report","تقرير الرواتب")}</CardTitle>
        <ExportBar rows={rows} filename={`payroll-${activeRun.slice(0,8)}`} title={L("Payroll","الرواتب")} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label={L("Payroll Run","دورة الرواتب")}>
            <Select value={activeRun} onValueChange={setRunId}>
              <SelectTrigger><SelectValue placeholder={L("Select run","اختر الدورة")} /></SelectTrigger>
              <SelectContent>
                {(runsQ.data ?? []).map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.period_year}/{String(r.period_month).padStart(2,"0")} — {r.status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-end"><div className="text-sm">{L("Total net","إجمالي الصافي")}: <span className="text-cyan-glow font-bold text-lg">{total.toFixed(2)}</span> EGP</div></div>
        </div>
        <DataTable rows={rows} empty={L("No payroll items.","لا توجد عناصر مرتبات.")} />
      </CardContent>
    </Card>
  );
}

// ---------- Coach Performance ----------
function CoachReport({ branchId, L }: { branchId: string; L: (en: string, ar: string) => string }) {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(todayISO());

  const slotsQ = useQuery({ queryKey: ["sched-slots-all", branchId], queryFn: async () => {
    const { data, error } = await supabase.from("ac_schedule_slots").select("id, coach_id").eq("branch_id", branchId).eq("active", true);
    if (error) throw error; return data as { id: string; coach_id: string | null }[];
  }});
  const assessQ = useQuery({ queryKey: ["assess", branchId, from, to], queryFn: async () => {
    const { data, error } = await supabase.from("ac_assessments").select("id, coach_id, assessment_date").eq("branch_id", branchId).gte("assessment_date", from).lte("assessment_date", to);
    if (error) throw error; return data as { id: string; coach_id: string | null; assessment_date: string }[];
  }});
  const attQ = useQuery({ queryKey: ["att-trainees", branchId, from, to], queryFn: async () => {
    const { data, error } = await supabase.from("ac_attendance").select("id, coach_id, check_in_at").eq("branch_id", branchId).gte("check_in_at", from).lte("check_in_at", to + "T23:59:59");
    if (error) throw error; return data as { id: string; coach_id: string | null; check_in_at: string }[];
  }});
  const coachesQ = useQuery({ queryKey: ["coaches-min", branchId], queryFn: async () => {
    const { data, error } = await supabase.from("ac_employees").select("id, employee_code, full_name, full_name_ar, department, title, base_salary").eq("branch_id", branchId).ilike("department", "%coach%");
    if (error) throw error; return data as Employee[];
  }});

  const rows: Row[] = useMemo(() => {
    const counts: Record<string, { sessions: number; evals: number; trainees: number }> = {};
    (slotsQ.data ?? []).forEach(s => { if (s.coach_id) { counts[s.coach_id] = counts[s.coach_id] ?? { sessions: 0, evals: 0, trainees: 0 }; counts[s.coach_id].sessions++; } });
    (assessQ.data ?? []).forEach(a => { if (a.coach_id) { counts[a.coach_id] = counts[a.coach_id] ?? { sessions: 0, evals: 0, trainees: 0 }; counts[a.coach_id].evals++; } });
    (attQ.data ?? []).forEach(a => { if (a.coach_id) { counts[a.coach_id] = counts[a.coach_id] ?? { sessions: 0, evals: 0, trainees: 0 }; counts[a.coach_id].trainees++; } });
    const cmap = Object.fromEntries((coachesQ.data ?? []).map(c => [c.id, c]));
    return Object.entries(counts).map(([id, c]) => ({
      [L("Coach","المدرب")]: cmap[id]?.full_name ?? id.slice(0,8),
      [L("Active Slots","الحصص النشطة")]: c.sessions,
      [L("Evaluations","التقييمات")]: c.evals,
      [L("Trainee Check-ins","حضور المتدربين")]: c.trainees,
    })).sort((a, b) => Number(b[L("Trainee Check-ins","حضور المتدربين")]) - Number(a[L("Trainee Check-ins","حضور المتدربين")]));
  }, [slotsQ.data, assessQ.data, attQ.data, coachesQ.data, L]);

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
        <CardTitle className="text-base">{L("Coach Performance","أداء المدربين")}</CardTitle>
        <ExportBar rows={rows} filename={`coach-performance-${from}_${to}`} title={L("Coach Performance","أداء المدربين")} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label={L("From","من")}><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label={L("To","إلى")}><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        </div>
        <DataTable rows={rows} empty={L("No coach activity in this range.","لا توجد بيانات في هذا النطاق.")} />
      </CardContent>
    </Card>
  );
}

// ---------- helpers ----------
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}

function KpiPill({ label, value, tone }: { label: string; value: number; tone: "emerald" | "amber" | "rose" }) {
  const toneClass = tone === "emerald" ? "border-emerald-500/30 text-emerald-400" : tone === "amber" ? "border-amber-500/30 text-amber-400" : "border-rose-500/30 text-rose-400";
  return (
    <div className={"rounded-xl border bg-background/30 p-3 " + toneClass}>
      <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

function DataTable({ rows, empty }: { rows: Row[]; empty: string }) {
  if (rows.length === 0) return <div className="text-sm text-muted-foreground py-8 text-center">{empty}</div>;
  const headers = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto rounded-lg border border-border/50">
      <Table>
        <TableHeader>
          <TableRow>{headers.map(h => <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              {headers.map(h => <TableCell key={h} className="whitespace-nowrap text-xs">
                {h.toLowerCase().includes("status") || ["الحالة","status"].includes(h.toLowerCase())
                  ? <Badge variant="outline">{String(r[h] ?? "")}</Badge>
                  : String(r[h] ?? "")}
              </TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
