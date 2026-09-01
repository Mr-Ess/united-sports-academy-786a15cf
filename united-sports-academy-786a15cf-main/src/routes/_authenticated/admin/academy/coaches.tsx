import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useAcademy, DAY_GROUPS, TIME_SLOTS } from "@/lib/legends/academy-store";
import { Card } from "@/components/ui/card";
import { Timer, Users, Award, Plus, Trash2, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useI18n } from "@/lib/legends/i18n";

export const Route = createFileRoute("/_authenticated/admin/academy/coaches")({
  head: () => ({ meta: [{ title: "Coach Manager · United Sports Academy" }] }),
  component: CoachesPage,
});

const PALETTE = ["#41C9E2", "#22D3EE", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#84CC16"];

type Employee = {
  id: string;
  full_name: string;
  full_name_ar: string | null;
  title: string | null;
  department: string | null;
  status: string;
};

function useCoaches() {
  const { currentBranchId } = useSession();
  return useQuery({
    queryKey: ["employees-coaches", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async (): Promise<Employee[]> => {
      const { data, error } = await supabase
        .from("ac_employees")
        .select("id, full_name, full_name_ar, title, department, status")
        .eq("branch_id", currentBranchId!)
        .eq("status", "active")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as unknown as Employee[];
    },
  });
}

type ScheduleSlotRow = {
  coach_id: string | null;
  time_slots: { start_time: string; end_time: string } | null;
};

function useScheduleHours() {
  const { currentBranchId } = useSession();
  return useQuery({
    queryKey: ["schedule-hours", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ac_schedule_slots")
        .select("coach_id, time_slots:ac_time_slots ( start_time, end_time )")
        .eq("branch_id", currentBranchId!)
        .eq("active", true)
        .not("coach_id", "is", null);
      if (error) throw error;
      const hoursByCoach: Record<string, number> = {};
      for (const r of (data ?? []) as unknown as ScheduleSlotRow[]) {
        if (!r.coach_id || !r.time_slots) continue;
        const [sh, sm] = r.time_slots.start_time.split(":").map(Number);
        const [eh, em] = r.time_slots.end_time.split(":").map(Number);
        const hrs = (eh + em / 60) - (sh + sm / 60);
        if (hrs > 0) hoursByCoach[r.coach_id] = (hoursByCoach[r.coach_id] ?? 0) + hrs;
      }
      return hoursByCoach;
    },
  });
}

function CoachesPage() {
  const { t, lang } = useI18n();
  const isAr = lang === "ar";
  const coachesQ = useCoaches();
  const { shifts, setShift, coachEvaluations, addCoachEvaluation, deleteCoachEvaluation, addTraineeEvaluation, receipts } = useAcademy();
  const employees = coachesQ.data ?? [];
  const nameOf = (e: Employee) => (isAr && e.full_name_ar) || e.full_name;
  const colorOf = (i: number) => PALETTE[i % PALETTE.length];

  const [dayGroup, setDayGroup] = useState<string>(DAY_GROUPS[0]);
  const [open, setOpen] = useState(false);
  const [evForm, setEvForm] = useState({ coachId: "", date: new Date().toISOString().slice(0, 10), punctuality: 4, communication: 4, technique: 4, studentFeedback: 4, notes: "" });

  const [tOpen, setTOpen] = useState(false);
  const [tForm, setTForm] = useState({
    receiptId: "", evaluator: "", date: new Date().toISOString().slice(0, 10),
    rating: 7, endurance: 4, technique: 4, notes: "",
  });

  const totalFor = (coachId: string) =>
    Object.entries(shifts).filter(([k]) => k.startsWith(coachId + "__")).reduce((s, [, v]) => s + Number(v), 0);

  const submitEval = () => {
    if (!evForm.coachId) return toast.error(isAr ? "اختر مدربًا" : "Select a coach");
    addCoachEvaluation(evForm);
    toast.success(isAr ? "تم حفظ التقييم" : "Evaluation added");
    setOpen(false);
    setEvForm({ coachId: "", date: new Date().toISOString().slice(0, 10), punctuality: 4, communication: 4, technique: 4, studentFeedback: 4, notes: "" });
  };

  const submitTraineeEval = () => {
    if (!tForm.receiptId) return toast.error(isAr ? "اختر متدربًا" : "Select a trainee");
    if (!tForm.evaluator.trim()) return toast.error(isAr ? "اسم المُقَيِّم مطلوب" : "Evaluator name required");
    addTraineeEvaluation(tForm.receiptId, {
      date: tForm.date, rating: tForm.rating, endurance: tForm.endurance,
      technique: tForm.technique, notes: tForm.notes, evaluator: tForm.evaluator,
    });
    toast.success(isAr ? "تم حفظ التقييم" : "Trainee evaluation saved");
    setTOpen(false);
    setTForm({ receiptId: "", evaluator: "", date: new Date().toISOString().slice(0, 10), rating: 7, endurance: 4, technique: 4, notes: "" });
  };

  const coachStats = useMemo(() => employees.map((c, i) => {
    const evals = coachEvaluations.filter(e => e.coachId === c.id);
    const avg = evals.length ? evals.reduce((s, e) => s + (e.punctuality + e.communication + e.technique + e.studentFeedback) / 4, 0) / evals.length : 0;
    return { coach: c, avg, evals, color: colorOf(i) };
  }), [employees, coachEvaluations]);

  if (!coachesQ.isFetched) {
    return <Card className="glass p-6 text-sm text-muted-foreground">{isAr ? "تحميل…" : "Loading…"}</Card>;
  }
  if (employees.length === 0) {
    return (
      <Card className="glass p-6 text-sm text-muted-foreground">
        {isAr ? "لا يوجد موظفون نشطون في هذا الفرع. أضف موظفين من قسم الموارد البشرية." : "No active employees in this branch. Add staff from the HR section."}
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-teal/15 p-2.5 ring-1 ring-teal/30"><Timer className="h-5 w-5 text-cyan-glow" /></div>
        <div>
          <h2 className="text-xl font-bold">{t("pg.coaches.h")}</h2>
          <p className="text-xs text-muted-foreground">{t("pg.coaches.s")}</p>
        </div>
      </div>

      <Tabs defaultValue="hours">
        <TabsList className="bg-card/40 flex-wrap h-auto">
          <TabsTrigger value="hours">{isAr ? "الساعات والرواتب" : "Hours & Payroll"}</TabsTrigger>
          <TabsTrigger value="performance">{isAr ? "الأداء" : "Performance"}</TabsTrigger>
          <TabsTrigger value="evaluations">{isAr ? "تقييمات المدربين" : "Coach Evaluations"}</TabsTrigger>
          <TabsTrigger value="trainees">{isAr ? "تقييمات المتدربين" : "Trainee Evaluations"}</TabsTrigger>
        </TabsList>

        <TabsContent value="hours" className="mt-4 space-y-4">
          <AutoPayrollPanel employees={employees} nameOf={nameOf} isAr={isAr} />

          <div className="flex justify-end">
            <Select value={dayGroup} onValueChange={setDayGroup}>
              <SelectTrigger className="w-[220px] bg-background/30"><SelectValue /></SelectTrigger>
              <SelectContent>{DAY_GROUPS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Card className="glass overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left">
                    <th className="sticky left-0 z-10 bg-card/80 backdrop-blur px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">{isAr ? "المدرب" : "Coach"}</th>
                    {TIME_SLOTS.map(ts => <th key={ts} className="px-2 py-3 text-center text-xs uppercase tracking-wider text-muted-foreground">{ts.replace(":00 ", "")}</th>)}
                    <th className="px-3 py-3 text-right text-xs uppercase tracking-wider text-cyan-glow">{isAr ? "إجمالي اليوم" : "Day Total"}</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(c => {
                    const dayTotal = TIME_SLOTS.reduce((s, ts) => s + (Number(shifts[`${c.id}__${dayGroup}__${ts}`]) || 0), 0);
                    return (
                      <tr key={c.id} className="border-b border-border/30 hover:bg-background/20">
                        <td className="sticky left-0 z-10 bg-card/60 backdrop-blur px-4 py-2 font-medium whitespace-nowrap">{nameOf(c)}</td>
                        {TIME_SLOTS.map(ts => {
                          const key = `${c.id}__${dayGroup}__${ts}`;
                          const val = Number(shifts[key]) || 0;
                          return (
                            <td key={ts} className="px-1 py-1.5 text-center">
                              <input type="number" min={0} step={0.5} value={val || ""}
                                onChange={e => setShift(key, Number(e.target.value))}
                                placeholder="—"
                                className={
                                  "h-9 w-14 rounded-md border bg-background/40 text-center text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-cyan-glow/40 " +
                                  (val > 0 ? "border-teal/50 text-cyan-glow font-semibold" : "border-border text-muted-foreground")
                                } />
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-right font-bold text-cyan-glow tabular-nums">{dayTotal}h</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Users className="h-4 w-4 text-cyan-glow" /> {isAr ? "إجماليات الساعات الشهرية" : "Monthly Hour Totals"}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {employees.map(c => {
                const total = totalFor(c.id);
                return (
                  <Card key={c.id} className="glass flex items-center justify-between p-4">
                    <div>
                      <div className="font-semibold">{nameOf(c)}</div>
                      <div className="text-xs text-muted-foreground">{c.title || (isAr ? "موظف" : "Staff")}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gradient-aqua tabular-nums">{total}h</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "للرواتب" : "payroll"}</div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {coachStats.map(({ coach, avg, evals, color }) => (
              <Card key={coach.id} className="glass p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ background: color }} />
                    <div>
                      <div className="font-semibold">{nameOf(coach)}</div>
                      <div className="text-xs text-muted-foreground">{coach.title || coach.department || "—"}</div>
                    </div>
                  </div>
                  <Award className="h-4 w-4 text-cyan-glow opacity-70" />
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "متوسط" : "Avg score"}</div>
                    <div className="text-3xl font-bold text-cyan-glow flex items-center gap-1">
                      <Star className="h-5 w-5 fill-current" />{avg ? avg.toFixed(1) : "—"}<span className="text-xs text-muted-foreground">/5</span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">{evals.length} {isAr ? "تقييم" : "eval(s)"}</div>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-background/40">
                  <div className="h-full bg-gradient-to-r from-mint to-cyan-glow transition-all" style={{ width: `${(avg / 5) * 100}%` }} />
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="evaluations" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-teal to-cyan-glow text-primary-foreground"><Plus className="h-4 w-4" /> {isAr ? "تقييم جديد" : "New Evaluation"}</Button>
              </DialogTrigger>
              <DialogContent className="glass-strong max-w-lg">
                <DialogHeader><DialogTitle>{isAr ? "تقييم أداء المدرب" : "Coach Performance Evaluation"}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Field label={isAr ? "المدرب" : "Coach"}>
                    <Select value={evForm.coachId} onValueChange={v => setEvForm({ ...evForm, coachId: v })}>
                      <SelectTrigger className="bg-background/30"><SelectValue placeholder={isAr ? "اختر مدربًا" : "Select coach"} /></SelectTrigger>
                      <SelectContent>{employees.map(c => <SelectItem key={c.id} value={c.id}>{nameOf(c)}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label={isAr ? "التاريخ" : "Date"}><Input type="date" value={evForm.date} onChange={e => setEvForm({ ...evForm, date: e.target.value })} /></Field>
                  {(["punctuality", "communication", "technique", "studentFeedback"] as const).map(k => (
                    <Field key={k} label={`${k.replace(/([A-Z])/g, " $1")} (1-5)`}>
                      <Input type="number" min={1} max={5} value={evForm[k]} onChange={e => setEvForm({ ...evForm, [k]: Number(e.target.value) })} />
                    </Field>
                  ))}
                  <Field label={isAr ? "ملاحظات" : "Notes"}><Textarea value={evForm.notes} onChange={e => setEvForm({ ...evForm, notes: e.target.value })} /></Field>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                  <Button onClick={submitEval} className="bg-gradient-to-r from-teal to-cyan-glow text-primary-foreground">{isAr ? "حفظ" : "Save"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="glass overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-card/60">
                <tr>
                  {[isAr ? "التاريخ" : "Date", isAr ? "المدرب" : "Coach", isAr ? "الالتزام" : "Punctuality", isAr ? "التواصل" : "Communication", isAr ? "التقنية" : "Technique", isAr ? "الطلاب" : "Student", isAr ? "ملاحظات" : "Notes", ""].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coachEvaluations.map(e => {
                  const c = employees.find(emp => emp.id === e.coachId);
                  return (
                    <tr key={e.id} className="border-b border-border/30">
                      <td className="px-3 py-2 text-xs">{e.date}</td>
                      <td className="px-3 py-2 font-medium">{c ? nameOf(c) : "—"}</td>
                      <td className="px-3 py-2 text-cyan-glow">{e.punctuality}</td>
                      <td className="px-3 py-2 text-cyan-glow">{e.communication}</td>
                      <td className="px-3 py-2 text-cyan-glow">{e.technique}</td>
                      <td className="px-3 py-2 text-cyan-glow">{e.studentFeedback}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground max-w-xs truncate">{e.notes}</td>
                      <td className="px-3 py-2 text-right">
                        <Button size="sm" variant="ghost" onClick={() => deleteCoachEvaluation(e.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </td>
                    </tr>
                  );
                })}
                {coachEvaluations.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">{isAr ? "لا توجد تقييمات بعد." : "No evaluations recorded yet."}</td></tr>}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="trainees" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{isAr ? "يمكن للمدربين تقييم المتدربين المسندين إليهم." : "Coaches can submit skill evaluations for any assigned trainee."}</p>
            <Dialog open={tOpen} onOpenChange={setTOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-teal to-cyan-glow text-primary-foreground"><Plus className="h-4 w-4" /> {isAr ? "تقييم متدرب" : "New Trainee Evaluation"}</Button>
              </DialogTrigger>
              <DialogContent className="glass-strong max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{isAr ? "تقييم مهارة المتدرب" : "Evaluate Trainee Skill"}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Field label={isAr ? "المتدرب" : "Trainee"}>
                    <Select value={tForm.receiptId} onValueChange={v => setTForm({ ...tForm, receiptId: v })}>
                      <SelectTrigger className="bg-background/30"><SelectValue placeholder={isAr ? "اختر متدربًا" : "Select trainee"} /></SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {receipts.map(r => <SelectItem key={r.id} value={r.id}>{r.studentName} · {r.clientId}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label={isAr ? "المُقَيِّم (المدرب)" : "Evaluator (Coach)"}>
                    <Select value={tForm.evaluator} onValueChange={v => setTForm({ ...tForm, evaluator: v })}>
                      <SelectTrigger className="bg-background/30"><SelectValue placeholder={isAr ? "اختر مدربًا" : "Select coach"} /></SelectTrigger>
                      <SelectContent>{employees.map(c => <SelectItem key={c.id} value={nameOf(c)}>{nameOf(c)}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label={isAr ? "التاريخ" : "Date"}><Input type="date" value={tForm.date} onChange={e => setTForm({ ...tForm, date: e.target.value })} /></Field>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label={isAr ? "العام (1-10)" : "Overall (1-10)"}><Input type="number" min={1} max={10} value={tForm.rating} onChange={e => setTForm({ ...tForm, rating: Number(e.target.value) })} /></Field>
                    <Field label={isAr ? "تحمل (1-5)" : "Endurance (1-5)"}><Input type="number" min={1} max={5} value={tForm.endurance} onChange={e => setTForm({ ...tForm, endurance: Number(e.target.value) })} /></Field>
                    <Field label={isAr ? "تقنية (1-5)" : "Technique (1-5)"}><Input type="number" min={1} max={5} value={tForm.technique} onChange={e => setTForm({ ...tForm, technique: Number(e.target.value) })} /></Field>
                  </div>
                  <Field label={isAr ? "ملاحظات" : "Notes"}><Textarea value={tForm.notes} onChange={e => setTForm({ ...tForm, notes: e.target.value })} placeholder={isAr ? "ملاحظات وتوصيات…" : "Progress notes, recommendations…"} /></Field>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setTOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                  <Button onClick={submitTraineeEval} className="bg-gradient-to-r from-teal to-cyan-glow text-primary-foreground">{isAr ? "حفظ التقييم" : "Save Evaluation"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="glass overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-card/60">
                <tr>
                  {[isAr ? "التاريخ" : "Date", isAr ? "المتدرب" : "Trainee", isAr ? "كود العميل" : "Client ID", isAr ? "المُقَيِّم" : "Coach (Eval.)", isAr ? "العام" : "Overall", isAr ? "تحمل" : "Endurance", isAr ? "تقنية" : "Technique", isAr ? "ملاحظات" : "Notes"].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {receipts.flatMap(r => (r.evaluations ?? []).map(e => ({ r, e })))
                  .sort((a, b) => b.e.date.localeCompare(a.e.date))
                  .map(({ r, e }) => (
                    <tr key={e.id} className="border-b border-border/30">
                      <td className="px-3 py-2 text-xs">{e.date}</td>
                      <td className="px-3 py-2 font-medium">{r.studentName}</td>
                      <td className="px-3 py-2 text-xs font-mono text-cyan-glow">{r.clientId}</td>
                      <td className="px-3 py-2 text-xs">{e.evaluator}</td>
                      <td className="px-3 py-2 text-cyan-glow font-bold">{e.rating}/10</td>
                      <td className="px-3 py-2">{e.endurance}/5</td>
                      <td className="px-3 py-2">{e.technique}/5</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground max-w-xs truncate">{e.notes}</td>
                    </tr>
                  ))}
                {receipts.every(r => !(r.evaluations ?? []).length) && (
                  <tr><td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">{isAr ? "لا توجد تقييمات للمتدربين بعد." : "No trainee evaluations yet."}</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground capitalize">{label}</Label>{children}</div>;
}

function AutoPayrollPanel({ employees, nameOf, isAr }: { employees: Employee[]; nameOf: (e: Employee) => string; isAr: boolean }) {
  const hoursQ = useScheduleHours();
  const map = hoursQ.data ?? {};
  const weeksPerMonth = 4.345;
  const rows = employees
    .map(e => ({ e, weekly: map[e.id] ?? 0 }))
    .filter(r => r.weekly > 0)
    .sort((a, b) => b.weekly - a.weekly);

  return (
    <Card className="glass p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Award className="h-4 w-4 text-cyan-glow" />
        {isAr ? "الساعات الشهرية التلقائية (من الجدول)" : "Auto Monthly Hours (from Schedule)"}
        <span className="text-xs font-normal text-muted-foreground ms-2">
          {isAr ? "محسوبة تلقائياً من schedule_slots × 4.345 أسبوع/شهر" : "computed from schedule_slots × 4.345 weeks/month"}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-3">{isAr ? "لا توجد جلسات مجدولة للمدربين بعد." : "No coach assignments in the schedule yet."}</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ e, weekly }) => {
            const monthly = weekly * weeksPerMonth;
            return (
              <div key={e.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-background/20 p-3">
                <div>
                  <div className="font-semibold">{nameOf(e)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {weekly.toFixed(1)} {isAr ? "س/أسبوع" : "h/wk"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gradient-aqua tabular-nums">{monthly.toFixed(1)}h</div>
                  <div className="text-[10px] uppercase tracking-wider text-cyan-glow">{isAr ? "شهرياً" : "monthly"}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
