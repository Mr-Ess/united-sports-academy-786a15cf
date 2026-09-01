import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { UsersRound, Plus, Trash2, LogIn, LogOut, Calendar, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/academy/hr")({
  head: () => ({ meta: [{ title: "HR · United Sports Academy" }] }),
  component: HRPage 
});

type Employee = {
  id: string; employee_code: string; full_name: string; full_name_ar: string | null;
  title: string | null; department: string | null; phone: string | null; email: string | null;
  hire_date: string; base_salary: number; allowances: number; status: string;
};
type EmpAtt = { id: string; employee_id: string; work_date: string; clock_in: string | null; clock_out: string | null; hours_worked: number | null; status: string };
type Leave = { id: string; employee_id: string; leave_type: string; start_date: string; end_date: string; days: number; reason: string | null; status: string };
type PayrollRun = { id: string; period_year: number; period_month: number; status: string; total_amount: number };
type PayrollItem = { id: string; employee_id: string; base_salary: number; allowances: number; deductions: number; bonuses: number; net_pay: number };

function HRPage() {
  const { currentBranchId } = useSession();
  const { lang } = useI18n();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><UsersRound className="h-6 w-6 text-cyan-glow" />{lang === "ar" ? "الموارد البشرية" : "HR"}</h2>
        <p className="text-sm text-muted-foreground">{lang === "ar" ? "الموظفون والحضور والإجازات والمرتبات" : "Employees, attendance, leaves & payroll"}</p>
      </div>
      {!currentBranchId ? (
        <Card className="glass"><CardContent className="py-10 text-center text-muted-foreground">{lang === "ar" ? "اختر فرعًا" : "Select a branch"}</CardContent></Card>
      ) : (
        <Tabs defaultValue="employees" className="space-y-4">
          <TabsList>
            <TabsTrigger value="employees">{lang === "ar" ? "الموظفون" : "Employees"}</TabsTrigger>
            <TabsTrigger value="attendance">{lang === "ar" ? "الحضور" : "Attendance"}</TabsTrigger>
            <TabsTrigger value="leaves">{lang === "ar" ? "الإجازات" : "Leaves"}</TabsTrigger>
            <TabsTrigger value="payroll">{lang === "ar" ? "المرتبات" : "Payroll"}</TabsTrigger>
          </TabsList>
          <TabsContent value="employees"><EmployeesTab branchId={currentBranchId} lang={lang} /></TabsContent>
          <TabsContent value="attendance"><EmpAttTab branchId={currentBranchId} lang={lang} /></TabsContent>
          <TabsContent value="leaves"><LeavesTab branchId={currentBranchId} lang={lang} /></TabsContent>
          <TabsContent value="payroll"><PayrollTab branchId={currentBranchId} lang={lang} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ---------- Employees ----------
function EmployeesTab({ branchId, lang }: { branchId: string; lang: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Employee | null>(null);

  const q = useQuery({ queryKey: ["hr-employees", branchId], queryFn: async () => {
    const { data, error } = await supabase.from("ac_employees").select("*").eq("branch_id", branchId).order("full_name");
    if (error) throw error; return data as Employee[];
  }});
  const save = useMutation({
    mutationFn: async (p: any) => {
      if (p.id) { const { error } = await supabase.from("ac_employees").update(p).eq("id", p.id); if (error) throw error; }
      else { const { error } = await supabase.from("ac_employees").insert({ ...p, branch_id: branchId } as any); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr-employees"] }); setOpen(false); setEdit(null); toast.success(lang === "ar" ? "تم" : "Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("ac_employees").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-employees"] }),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setEdit(null); }}>
          <DialogTrigger asChild><Button onClick={() => setEdit(null)}><Plus className="h-4 w-4 mr-1.5" />{lang === "ar" ? "موظف جديد" : "New Employee"}</Button></DialogTrigger>
          <EmployeeDialog editing={edit} onSave={save.mutate} lang={lang} />
        </Dialog>
      </div>
      <Card className="glass"><CardContent className="overflow-x-auto pt-4">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground">
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2">{lang === "ar" ? "الكود" : "Code"}</th>
              <th className="text-left py-2 px-2">{lang === "ar" ? "الاسم" : "Name"}</th>
              <th className="text-left py-2 px-2">{lang === "ar" ? "الوظيفة" : "Title"}</th>
              <th className="text-left py-2 px-2">{lang === "ar" ? "القسم" : "Dept"}</th>
              <th className="text-left py-2 px-2">{lang === "ar" ? "الهاتف" : "Phone"}</th>
              <th className="text-right py-2 px-2">{lang === "ar" ? "الراتب" : "Salary"}</th>
              <th className="text-left py-2 px-2">{lang === "ar" ? "الحالة" : "Status"}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map(e => (
              <tr key={e.id} className="border-b border-border/40 hover:bg-accent/20 cursor-pointer" onClick={() => { setEdit(e); setOpen(true); }}>
                <td className="py-2 px-2 text-xs text-cyan-glow">{e.employee_code}</td>
                <td className="py-2 px-2 font-medium">{e.full_name}</td>
                <td className="py-2 px-2">{e.title ?? "—"}</td>
                <td className="py-2 px-2">{e.department ?? "—"}</td>
                <td className="py-2 px-2 text-xs">{e.phone ?? "—"}</td>
                <td className="py-2 px-2 text-right">{Number(e.base_salary).toLocaleString()}</td>
                <td className="py-2 px-2"><Badge variant="outline">{e.status}</Badge></td>
                <td className="py-2 px-2"><button onClick={ev => { ev.stopPropagation(); del.mutate(e.id); }}><Trash2 className="h-3 w-3 text-rose-400" /></button></td>
              </tr>
            ))}
            {(q.data ?? []).length === 0 && <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">{lang === "ar" ? "لا يوجد موظفون" : "No employees"}</td></tr>}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}

function EmployeeDialog({ editing, onSave, lang }: { editing: Employee | null; onSave: (p: any) => void; lang: string }) {
  const [form, setForm] = useState<any>(editing ?? {
    employee_code: "", full_name: "", full_name_ar: "", title: "", department: "", phone: "", email: "",
    hire_date: new Date().toISOString().slice(0, 10), base_salary: 0, allowances: 0, status: "active",
  });
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>{editing ? (lang === "ar" ? "تعديل موظف" : "Edit Employee") : (lang === "ar" ? "موظف جديد" : "New Employee")}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>{lang === "ar" ? "كود الموظف" : "Code"}</Label><Input value={form.employee_code} onChange={e => setForm({ ...form, employee_code: e.target.value })} /></div>
        <div><Label>{lang === "ar" ? "الاسم" : "Name"}</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
        <div><Label>{lang === "ar" ? "بالعربية" : "Name (AR)"}</Label><Input value={form.full_name_ar ?? ""} onChange={e => setForm({ ...form, full_name_ar: e.target.value })} /></div>
        <div><Label>{lang === "ar" ? "الوظيفة" : "Title"}</Label><Input value={form.title ?? ""} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>{lang === "ar" ? "القسم" : "Department"}</Label><Input value={form.department ?? ""} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
        <div><Label>{lang === "ar" ? "الهاتف" : "Phone"}</Label><Input value={form.phone ?? ""} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
        <div><Label>{lang === "ar" ? "البريد" : "Email"}</Label><Input type="email" value={form.email ?? ""} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
        <div><Label>{lang === "ar" ? "تاريخ التعيين" : "Hire date"}</Label><Input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} /></div>
        <div><Label>{lang === "ar" ? "الراتب الأساسي" : "Base salary"}</Label><Input type="number" value={form.base_salary} onChange={e => setForm({ ...form, base_salary: Number(e.target.value) })} /></div>
        <div><Label>{lang === "ar" ? "البدلات" : "Allowances"}</Label><Input type="number" value={form.allowances} onChange={e => setForm({ ...form, allowances: Number(e.target.value) })} /></div>
        <div><Label>{lang === "ar" ? "الحالة" : "Status"}</Label>
          <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["active","on_leave","terminated"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button disabled={!form.employee_code || !form.full_name} onClick={() => onSave({
          id: editing?.id, employee_code: form.employee_code, full_name: form.full_name,
          full_name_ar: form.full_name_ar || null, title: form.title || null, department: form.department || null,
          phone: form.phone || null, email: form.email || null, hire_date: form.hire_date,
          base_salary: Number(form.base_salary), allowances: Number(form.allowances), status: form.status,
        })}>{lang === "ar" ? "حفظ" : "Save"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ---------- Employee Attendance ----------
function EmpAttTab({ branchId, lang }: { branchId: string; lang: string }) {
  const qc = useQueryClient();
  const empQ = useQuery({ queryKey: ["hr-employees", branchId], queryFn: async () => {
    const { data, error } = await supabase.from("ac_employees").select("id,full_name,employee_code").eq("branch_id", branchId).eq("status", "active");
    if (error) throw error; return data as any[];
  }});
  const today = new Date().toISOString().slice(0, 10);
  const attQ = useQuery({ queryKey: ["hr-att", branchId], queryFn: async () => {
    const { data, error } = await supabase.from("ac_employee_attendance").select("*").eq("branch_id", branchId)
      .gte("work_date", today).order("clock_in", { ascending: false });
    if (error) throw error; return data as EmpAtt[];
  }});

  const empMap = useMemo(() => Object.fromEntries((empQ.data ?? []).map(e => [e.id, e])), [empQ.data]);
  const attByEmp = useMemo(() => Object.fromEntries((attQ.data ?? []).map(a => [a.employee_id, a])), [attQ.data]);

  const clockIn = useMutation({
    mutationFn: async (employee_id: string) => {
      const { error } = await supabase.from("ac_employee_attendance").upsert({
        branch_id: branchId, employee_id, work_date: today,
        clock_in: new Date().toISOString(), status: "present",
      } as any, { onConflict: "employee_id,work_date" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr-att"] }); toast.success(lang === "ar" ? "تم تسجيل الدخول" : "Clocked in"); },
    onError: (e: any) => toast.error(e.message),
  });
  const clockOut = useMutation({
    mutationFn: async (att: EmpAtt) => {
      const out = new Date();
      const hours = att.clock_in ? Math.round(((out.getTime() - new Date(att.clock_in).getTime()) / 3600000) * 100) / 100 : null;
      const { error } = await supabase.from("ac_employee_attendance").update({
        clock_out: out.toISOString(), hours_worked: hours,
      }).eq("id", att.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr-att"] }); toast.success(lang === "ar" ? "تم تسجيل الخروج" : "Clocked out"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card className="glass">
        <CardHeader><CardTitle className="text-sm">{lang === "ar" ? "حضور اليوم" : "Today's Attendance"}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(empQ.data ?? []).map((e: any) => {
              const a = attByEmp[e.id];
              return (
                <div key={e.id} className="rounded-lg border border-border bg-card/40 p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{e.full_name}</div>
                    <div className="text-xs text-muted-foreground">{e.employee_code}</div>
                    {a && <div className="text-xs text-cyan-glow mt-1">
                      <Clock3 className="inline h-3 w-3 mr-1" />
                      {a.clock_in ? new Date(a.clock_in).toLocaleTimeString() : "—"}
                      {a.clock_out && <> → {new Date(a.clock_out).toLocaleTimeString()} ({a.hours_worked}h)</>}
                    </div>}
                  </div>
                  {!a || !a.clock_in ? (
                    <Button size="sm" onClick={() => clockIn.mutate(e.id)}><LogIn className="h-3.5 w-3.5 mr-1" />{lang === "ar" ? "دخول" : "In"}</Button>
                  ) : !a.clock_out ? (
                    <Button size="sm" variant="outline" onClick={() => clockOut.mutate(a)}><LogOut className="h-3.5 w-3.5 mr-1" />{lang === "ar" ? "خروج" : "Out"}</Button>
                  ) : (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">✓</Badge>
                  )}
                </div>
              );
            })}
            {(empQ.data ?? []).length === 0 && <div className="col-span-full text-center text-muted-foreground py-6">{lang === "ar" ? "أضف موظفين أولاً" : "Add employees first"}</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Leaves ----------
function LeavesTab({ branchId, lang }: { branchId: string; lang: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const empQ = useQuery({ queryKey: ["hr-employees", branchId], queryFn: async () => {
    const { data, error } = await supabase.from("ac_employees").select("id,full_name").eq("branch_id", branchId);
    if (error) throw error; return data as any[];
  }});
  const q = useQuery({ queryKey: ["hr-leaves", branchId], queryFn: async () => {
    const { data, error } = await supabase.from("ac_leave_requests").select("*").eq("branch_id", branchId).order("created_at", { ascending: false });
    if (error) throw error; return data as Leave[];
  }});
  const empMap = useMemo(() => Object.fromEntries((empQ.data ?? []).map((e: any) => [e.id, e])), [empQ.data]);

  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await supabase.from("ac_leave_requests").insert({ ...p, branch_id: branchId } as any); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr-leaves"] }); setOpen(false); toast.success(lang === "ar" ? "تم الإرسال" : "Submitted"); },
    onError: (e: any) => toast.error(e.message),
  });
  const decide = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("ac_leave_requests").update({
        status, approved_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-leaves"] }),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />{lang === "ar" ? "طلب إجازة" : "New Request"}</Button></DialogTrigger>
          <LeaveDialog employees={empQ.data ?? []} onCreate={create.mutate} lang={lang} />
        </Dialog>
      </div>
      <Card className="glass"><CardContent className="overflow-x-auto pt-4">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground">
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2">{lang === "ar" ? "الموظف" : "Employee"}</th>
              <th className="text-left py-2 px-2">{lang === "ar" ? "النوع" : "Type"}</th>
              <th className="text-left py-2 px-2">{lang === "ar" ? "من" : "From"}</th>
              <th className="text-left py-2 px-2">{lang === "ar" ? "إلى" : "To"}</th>
              <th className="text-right py-2 px-2">{lang === "ar" ? "أيام" : "Days"}</th>
              <th className="text-left py-2 px-2">{lang === "ar" ? "الحالة" : "Status"}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map(l => (
              <tr key={l.id} className="border-b border-border/40">
                <td className="py-2 px-2">{empMap[l.employee_id]?.full_name ?? "—"}</td>
                <td className="py-2 px-2"><Badge variant="outline">{l.leave_type}</Badge></td>
                <td className="py-2 px-2 text-xs">{l.start_date}</td>
                <td className="py-2 px-2 text-xs">{l.end_date}</td>
                <td className="py-2 px-2 text-right">{l.days}</td>
                <td className="py-2 px-2">
                  <Badge className={l.status === "approved" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : l.status === "rejected" ? "bg-rose-500/20 text-rose-300 border-rose-500/40" : "bg-amber-500/20 text-amber-300 border-amber-500/40"}>{l.status}</Badge>
                </td>
                <td className="py-2 px-2">
                  {l.status === "pending" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: l.id, status: "approved" })}><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /></Button>
                      <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: l.id, status: "rejected" })}><XCircle className="h-3.5 w-3.5 text-rose-400" /></Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {(q.data ?? []).length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">{lang === "ar" ? "لا توجد طلبات" : "No requests"}</td></tr>}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}

function LeaveDialog({ employees, onCreate, lang }: { employees: any[]; onCreate: (p: any) => void; lang: string }) {
  const [form, setForm] = useState({
    employee_id: "", leave_type: "vacation",
    start_date: new Date().toISOString().slice(0, 10), end_date: new Date().toISOString().slice(0, 10),
    reason: "",
  });
  const days = useMemo(() => {
    const s = new Date(form.start_date), e = new Date(form.end_date);
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
  }, [form.start_date, form.end_date]);
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{lang === "ar" ? "طلب إجازة" : "Leave Request"}</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div><Label>{lang === "ar" ? "الموظف" : "Employee"}</Label>
          <Select value={form.employee_id} onValueChange={v => setForm({ ...form, employee_id: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>{lang === "ar" ? "النوع" : "Type"}</Label>
            <Select value={form.leave_type} onValueChange={v => setForm({ ...form, leave_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["vacation","sick","unpaid","other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{lang === "ar" ? "من" : "From"}</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "إلى" : "To"}</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
        </div>
        <div className="text-xs text-muted-foreground"><Calendar className="inline h-3 w-3 mr-1" />{lang === "ar" ? "عدد الأيام" : "Days"}: {days}</div>
        <div><Label>{lang === "ar" ? "السبب" : "Reason"}</Label><Input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button disabled={!form.employee_id} onClick={() => onCreate({ ...form, days, status: "pending", reason: form.reason || null })}>
          {lang === "ar" ? "إرسال" : "Submit"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ---------- Payroll ----------
function PayrollTab({ branchId, lang }: { branchId: string; lang: string }) {
  const qc = useQueryClient();
  const [selRun, setSelRun] = useState<string | null>(null);

  const runsQ = useQuery({ queryKey: ["hr-payroll", branchId], queryFn: async () => {
    const { data, error } = await supabase.from("ac_payroll_runs").select("*").eq("branch_id", branchId).order("period_year", { ascending: false }).order("period_month", { ascending: false });
    if (error) throw error; return data as PayrollRun[];
  }});
  const empQ = useQuery({ queryKey: ["hr-employees", branchId], queryFn: async () => {
    const { data, error } = await supabase.from("ac_employees").select("*").eq("branch_id", branchId).eq("status", "active");
    if (error) throw error; return data as Employee[];
  }});
  const itemsQ = useQuery({
    queryKey: ["hr-payroll-items", selRun],
    enabled: !!selRun,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_payroll_items").select("*").eq("payroll_run_id", selRun!);
      if (error) throw error; return data as PayrollItem[];
    },
  });

  const empMap = useMemo(() => Object.fromEntries((empQ.data ?? []).map(e => [e.id, e])), [empQ.data]);

  const createRun = useMutation({
    mutationFn: async ({ year, month }: { year: number; month: number }) => {
      const { data: run, error } = await supabase.from("ac_payroll_runs").insert({
        branch_id: branchId, period_year: year, period_month: month, status: "draft", total_amount: 0,
      } as any).select("id").single();
      if (error) throw error;
      const employees = empQ.data ?? [];
      if (employees.length > 0) {
        const items = employees.map(e => ({
          payroll_run_id: run!.id, branch_id: branchId, employee_id: e.id,
          base_salary: e.base_salary, allowances: e.allowances, deductions: 0, bonuses: 0,
          net_pay: Number(e.base_salary) + Number(e.allowances),
        }));
        const { error: e2 } = await supabase.from("ac_payroll_items").insert(items as any);
        if (e2) throw e2;
        const total = items.reduce((s, i) => s + i.net_pay, 0);
        await supabase.from("ac_payroll_runs").update({ total_amount: total }).eq("id", run!.id);
      }
      return run!.id;
    },
    onSuccess: (id) => { qc.invalidateQueries({ queryKey: ["hr-payroll"] }); setSelRun(id); toast.success(lang === "ar" ? "تم إنشاء الكشف" : "Run created"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateItem = useMutation({
    mutationFn: async (p: PayrollItem) => {
      const net = Number(p.base_salary) + Number(p.allowances) + Number(p.bonuses) - Number(p.deductions);
      const { error } = await supabase.from("ac_payroll_items").update({
        base_salary: p.base_salary, allowances: p.allowances, deductions: p.deductions, bonuses: p.bonuses, net_pay: net,
      }).eq("id", p.id);
      if (error) throw error;
      // recompute run total
      const { data: all } = await supabase.from("ac_payroll_items").select("net_pay").eq("payroll_run_id", selRun!);
      const total = (all ?? []).reduce((s: number, i: any) => s + Number(i.net_pay), 0);
      await supabase.from("ac_payroll_runs").update({ total_amount: total }).eq("id", selRun!);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr-payroll-items"] }); qc.invalidateQueries({ queryKey: ["hr-payroll"] }); },
  });

  const finalize = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ac_payroll_runs").update({ status: "finalized", finalized_at: new Date().toISOString() }).eq("id", selRun!);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr-payroll"] }); toast.success(lang === "ar" ? "تم اعتماد الكشف" : "Finalized"); },
  });

  const now = new Date();
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="glass md:col-span-1">
        <CardHeader><CardTitle className="text-sm">{lang === "ar" ? "كشوف الرواتب" : "Payroll runs"}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Input type="number" className="w-20" value={period.year} onChange={e => setPeriod({ ...period, year: Number(e.target.value) })} />
            <Input type="number" min={1} max={12} className="w-16" value={period.month} onChange={e => setPeriod({ ...period, month: Number(e.target.value) })} />
            <Button size="sm" onClick={() => createRun.mutate(period)}><Plus className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {(runsQ.data ?? []).map(r => (
              <button key={r.id} onClick={() => setSelRun(r.id)}
                className={"w-full text-left rounded-md border p-2 text-xs " + (selRun === r.id ? "border-teal/50 bg-teal/10" : "border-border")}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.period_year}-{String(r.period_month).padStart(2, "0")}</span>
                  <Badge variant="outline">{r.status}</Badge>
                </div>
                <div className="text-muted-foreground mt-1">{Number(r.total_amount).toLocaleString()} EGP</div>
              </button>
            ))}
            {(runsQ.data ?? []).length === 0 && <div className="text-center text-muted-foreground py-4 text-xs">{lang === "ar" ? "لا يوجد" : "None yet"}</div>}
          </div>
        </CardContent>
      </Card>

      <Card className="glass md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">{lang === "ar" ? "التفاصيل" : "Details"}</CardTitle>
          {selRun && <Button size="sm" onClick={() => finalize.mutate()}>{lang === "ar" ? "اعتماد" : "Finalize"}</Button>}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {!selRun ? (
            <div className="text-center text-muted-foreground py-8">{lang === "ar" ? "اختر كشف" : "Select a run"}</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2">{lang === "ar" ? "الموظف" : "Employee"}</th>
                  <th className="text-right py-2 px-2">Base</th>
                  <th className="text-right py-2 px-2">+Allow</th>
                  <th className="text-right py-2 px-2">+Bonus</th>
                  <th className="text-right py-2 px-2">-Deduct</th>
                  <th className="text-right py-2 px-2">Net</th>
                </tr>
              </thead>
              <tbody>
                {(itemsQ.data ?? []).map(i => (
                  <tr key={i.id} className="border-b border-border/40">
                    <td className="py-2 px-2">{empMap[i.employee_id]?.full_name ?? "—"}</td>
                    <td className="py-2 px-1"><Input type="number" className="h-7 text-xs" defaultValue={i.base_salary}
                      onBlur={e => updateItem.mutate({ ...i, base_salary: Number(e.target.value) })} /></td>
                    <td className="py-2 px-1"><Input type="number" className="h-7 text-xs" defaultValue={i.allowances}
                      onBlur={e => updateItem.mutate({ ...i, allowances: Number(e.target.value) })} /></td>
                    <td className="py-2 px-1"><Input type="number" className="h-7 text-xs" defaultValue={i.bonuses}
                      onBlur={e => updateItem.mutate({ ...i, bonuses: Number(e.target.value) })} /></td>
                    <td className="py-2 px-1"><Input type="number" className="h-7 text-xs" defaultValue={i.deductions}
                      onBlur={e => updateItem.mutate({ ...i, deductions: Number(e.target.value) })} /></td>
                    <td className="py-2 px-2 text-right font-semibold text-cyan-glow">{Number(i.net_pay).toLocaleString()}</td>
                  </tr>
                ))}
                {(itemsQ.data ?? []).length === 0 && <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">—</td></tr>}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
