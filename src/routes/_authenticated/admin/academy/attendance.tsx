import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { useRequireBranch } from "@/components/legends/BranchGuard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Droplets, Search, Plus, Pencil, Trash2, LogOut, CalendarClock, FileText, FileDown, AlertOctagon, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AuditLogPanel } from "@/components/legends/AuditLogPanel";
import { exportCSV, exportPDF } from "@/lib/legends/export-utils";


export const Route = createFileRoute("/_authenticated/admin/academy/attendance")({
  head: () => ({ meta: [{ title: "Pool Attendance · United Sports Academy" }] }),
  component: AttendancePage,
});

type Trainee = { id: string; full_name: string; full_name_ar: string | null; client_code: string };
type Slot = { id: string; time_slot_id: string; lane_id: string; coach_id: string | null; capacity_override: number | null };
type Lane = { id: string; lane_number: number; default_capacity: number };
type TS = { id: string; label: string; day_of_week: number; start_time: string; end_time: string };
type Coach = { id: string; full_name: string; full_name_ar: string | null };
type Sub = { id: string; trainee_id: string; status: string; paid_amount: number; price: number };
type Att = {
  id: string;
  trainee_id: string;
  schedule_slot_id: string | null;
  subscription_id: string | null;
  coach_id: string | null;
  check_in_at: string;
  check_out_at: string | null;
  method: string;
  status: string;
  notes: string | null;
};


const DOW_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function AttendancePage() {
  const { lang, t } = useI18n();
  const isAr = lang === "ar";
  const { currentBranchId } = useSession();
  const { ensureBranch } = useRequireBranch();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [coachF, setCoachF] = useState("all");
  const [slotF, setSlotF] = useState("all");
  const [payF, setPayF] = useState<"all" | "paid" | "unpaid" | "no_sub">("all");
  const [dateFrom, setDateFrom] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState<string>(new Date().toISOString().slice(0, 10));
  const dateF = dateFrom; // back-compat for form default
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Att | null>(null);


  const traineesQ = useQuery({
    queryKey: ["att-trainees", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async (): Promise<Trainee[]> => {
      const { data, error } = await supabase.from("ac_trainees")
        .select("id, full_name, full_name_ar, client_code")
        .eq("branch_id", currentBranchId!).eq("active", true).order("full_name");
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const slotsQ = useQuery({
    queryKey: ["att-slots", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async (): Promise<Slot[]> => {
      const { data, error } = await supabase.from("ac_schedule_slots")
        .select("id, time_slot_id, lane_id, coach_id, capacity_override").eq("branch_id", currentBranchId!).eq("active", true);
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const lanesQ = useQuery({
    queryKey: ["att-lanes", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async (): Promise<Lane[]> => {
      const { data, error } = await supabase.from("ac_lanes")
        .select("id, lane_number, default_capacity").eq("branch_id", currentBranchId!);
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const coachesQ = useQuery({
    queryKey: ["att-coaches", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async (): Promise<Coach[]> => {
      const { data, error } = await supabase.from("ac_employees")
        .select("id, full_name, full_name_ar, role, status").eq("branch_id", currentBranchId!)
        .eq("status", "active").in("role", ["coach", "head_coach"]).order("full_name");
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const subsQ = useQuery({
    queryKey: ["att-subs", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async (): Promise<Sub[]> => {
      const { data, error } = await supabase.from("ac_subscriptions")
        .select("id, trainee_id, status, paid_amount, price").eq("branch_id", currentBranchId!).is("deleted_at", null);
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const tsQ = useQuery({
    queryKey: ["att-time-slots", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async (): Promise<TS[]> => {
      const { data, error } = await supabase.from("ac_time_slots")
        .select("id, label, day_of_week, start_time, end_time").eq("branch_id", currentBranchId!);
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const attQ = useQuery({
    queryKey: ["attendance", currentBranchId, dateFrom, dateTo],
    enabled: !!currentBranchId,
    queryFn: async (): Promise<Att[]> => {
      const start = `${dateFrom}T00:00:00`;
      const end = `${dateTo}T23:59:59`;
      const { data, error } = await supabase.from("ac_attendance")
        .select("id, trainee_id, schedule_slot_id, subscription_id, coach_id, check_in_at, check_out_at, method, status, notes")
        .eq("branch_id", currentBranchId!)
        .gte("check_in_at", start).lte("check_in_at", end)
        .order("check_in_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const trainees = traineesQ.data ?? [];
  const slots = slotsQ.data ?? [];
  const lanes = lanesQ.data ?? [];
  const coaches = coachesQ.data ?? [];
  const subs = subsQ.data ?? [];
  const timeslots = tsQ.data ?? [];
  const tById = Object.fromEntries(trainees.map(t => [t.id, t]));
  const sById = Object.fromEntries(slots.map(s => [s.id, s]));
  const lById = Object.fromEntries(lanes.map(l => [l.id, l]));
  const cById = Object.fromEntries(coaches.map(c => [c.id, c]));
  const subById = Object.fromEntries(subs.map(s => [s.id, s]));
  const tsById = Object.fromEntries(timeslots.map(t => [t.id, t]));
  const nameOf = (t: Trainee) => (isAr && t.full_name_ar) || t.full_name;
  const coachNameOf = (c: Coach) => (isAr && c.full_name_ar) || c.full_name;


  const subStatusOf = (a: Att) => {
    const subList = subs.filter(s => s.trainee_id === a.trainee_id);
    if (subList.length === 0) return "no_sub";
    const active = subList.find(s => s.id === a.subscription_id) ?? subList[0];
    if ((active.paid_amount ?? 0) >= (active.price ?? 0) && (active.price ?? 0) > 0) return "paid";
    return "unpaid";
  };

  const coachOfAtt = (a: Att) => {
    if (a.coach_id) return a.coach_id;
    if (a.schedule_slot_id) return sById[a.schedule_slot_id]?.coach_id ?? null;
    return null;
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (attQ.data ?? []).filter(a => {
      if (statusF !== "all" && a.status !== statusF) return false;
      if (slotF !== "all" && a.schedule_slot_id !== slotF) return false;
      if (coachF !== "all" && coachOfAtt(a) !== coachF) return false;
      if (payF !== "all" && subStatusOf(a) !== payF) return false;
      if (q) {
        const tr = tById[a.trainee_id];
        if (!tr) return false;
        if (!nameOf(tr).toLowerCase().includes(q) && !tr.client_code.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [attQ.data, statusF, slotF, coachF, payF, search, tById, sById, subs, isAr]);


  const empty = {
    trainee_id: "", schedule_slot_id: "", date: dateF,
    check_in: new Date().toTimeString().slice(0, 5), check_out: "",
    status: "checked_in", method: "manual", notes: "",
  };
  const [form, setForm] = useState(empty);

  const startNew = () => { setEditing(null); setForm({ ...empty, date: dateF }); setOpen(true); };
  const startEdit = (a: Att) => {
    setEditing(a);
    setForm({
      trainee_id: a.trainee_id,
      schedule_slot_id: a.schedule_slot_id ?? "",
      date: a.check_in_at.slice(0, 10),
      check_in: a.check_in_at.slice(11, 16),
      check_out: a.check_out_at ? a.check_out_at.slice(11, 16) : "",
      status: a.status, method: a.method, notes: a.notes ?? "",
    });
    setOpen(true);
  };

  const saveM = useMutation({
    mutationFn: async () => {
      const branchId = ensureBranch();
      if (!branchId) throw new Error("no-branch");
      if (!form.trainee_id) throw new Error(isAr ? "اختر متدربًا" : "Select a trainee");
      const checkIn = new Date(`${form.date}T${form.check_in}:00`).toISOString();
      const checkOut = form.check_out ? new Date(`${form.date}T${form.check_out}:00`).toISOString() : null;

      // Capacity check
      let warning: string | null = null;
      if (form.schedule_slot_id) {
        const slot = sById[form.schedule_slot_id];
        if (slot) {
          const lane = lById[slot.lane_id];
          const cap = slot.capacity_override ?? lane?.default_capacity ?? 0;
          const day = form.date;
          const { count } = await supabase.from("ac_attendance")
            .select("id", { count: "exact", head: true })
            .eq("branch_id", branchId)
            .eq("schedule_slot_id", form.schedule_slot_id)
            .gte("check_in_at", `${day}T00:00:00`).lte("check_in_at", `${day}T23:59:59`);
          const existing = count ?? 0;
          const occupiedAfter = existing + (editing ? 0 : 1);
          if (cap > 0 && occupiedAfter > cap) {
            warning = isAr
              ? `⚠️ تجاوز السعة (${occupiedAfter}/${cap}) — تم الحفظ مع التحذير`
              : `⚠️ Capacity exceeded (${occupiedAfter}/${cap}) — saved with warning`;
          } else if (cap > 0 && occupiedAfter === cap) {
            warning = isAr ? "تنبيه: هذه الجلسة الآن ممتلئة" : "Heads up: this slot is now FULL";
          }
        }
      }

      // Auto-link subscription (most recent active for this trainee)
      let subscription_id: string | null = null;
      if (!editing) {
        const { data: subs } = await supabase.from("ac_subscriptions")
          .select("id").eq("trainee_id", form.trainee_id).eq("status", "active")
          .is("deleted_at", null).order("created_at", { ascending: false }).limit(1);
        subscription_id = subs?.[0]?.id ?? null;
      }

      const payload: any = {
        branch_id: branchId,
        trainee_id: form.trainee_id,
        schedule_slot_id: form.schedule_slot_id || null,
        check_in_at: checkIn,
        check_out_at: checkOut,
        status: form.status,
        method: form.method,
        notes: form.notes || null,
      };
      if (!editing) payload.subscription_id = subscription_id;
      if (editing) {
        const { error } = await supabase.from("ac_attendance").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ac_attendance").insert(payload);
        if (error) throw error;
      }
      return warning;
    },
    onSuccess: (warning) => {
      if (warning) toast.warning(warning);
      else toast.success(isAr ? "تم الحفظ" : "Saved");
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["audit-log"] });
      setOpen(false); setEditing(null); setForm(empty);
    },
    onError: (e: any) => toast.error(e.message),
  });


  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ac_attendance").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(isAr ? "تم الحذف" : "Deleted");
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const checkoutM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ac_attendance")
        .update({ check_out_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(isAr ? "تم تسجيل الانصراف" : "Checked out");
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const slotLabel = (slotId: string | null) => {
    if (!slotId) return "—";
    const s = sById[slotId]; if (!s) return "—";
    const ts = tsById[s.time_slot_id]; if (!ts) return "—";
    const day = (isAr ? DOW_AR : DOW_EN)[ts.day_of_week];
    return `${day} · ${ts.label}`;
  };

  const statusColor = (s: string) =>
    s === "confirmed" ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/50"
      : s === "checked_in" ? "bg-yellow-500/25 text-yellow-300 border-yellow-500/50"
      : s === "present" ? "bg-mint/20 text-mint border-mint/40"
      : s === "late" ? "bg-warn/20 text-warn border-warn/40"
      : s === "absent" ? "bg-destructive/20 text-destructive-foreground border-destructive/40"
      : "bg-background/40 border-border";

  const confirmM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ac_attendance")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(isAr ? "تم التأكيد — تم خصم جلسة" : "Confirmed — 1 session deducted");
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["subs"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const fullSlots = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of (attQ.data ?? [])) {
      if (!a.schedule_slot_id) continue;
      counts.set(a.schedule_slot_id, (counts.get(a.schedule_slot_id) ?? 0) + 1);
    }
    const list: { id: string; label: string; current: number; cap: number; ratio: number }[] = [];
    counts.forEach((c, id) => {
      const s = sById[id]; if (!s) return;
      const cap = s.capacity_override ?? lById[s.lane_id]?.default_capacity ?? 0;
      if (cap > 0 && c / cap >= 0.8) list.push({ id, label: slotLabel(id), current: c, cap, ratio: c / cap });
    });
    return list.sort((a, b) => b.ratio - a.ratio);
  }, [attQ.data, sById, lById, tsById, isAr]);

  const exportRows = () => rows.map(a => {
    const tr = tById[a.trainee_id];
    const cid = coachOfAtt(a);
    const c = cid ? cById[cid] : null;
    return {
      [isAr ? "الكود" : "Code"]: tr?.client_code ?? "",
      [isAr ? "المتدرب" : "Trainee"]: tr ? nameOf(tr) : "",
      [isAr ? "الجلسة" : "Slot"]: slotLabel(a.schedule_slot_id),
      [isAr ? "المدرب" : "Coach"]: c ? coachNameOf(c) : "—",
      [isAr ? "الدخول" : "Check-in"]: new Date(a.check_in_at).toLocaleString(),
      [isAr ? "الخروج" : "Check-out"]: a.check_out_at ? new Date(a.check_out_at).toLocaleString() : "—",
      [isAr ? "الحالة" : "Status"]: a.status,
      [isAr ? "الطريقة" : "Method"]: a.method,
      [isAr ? "الدفع" : "Payment"]: subStatusOf(a),
    };
  });

  const doExport = (kind: "csv" | "pdf") => {
    const data = exportRows();
    if (data.length === 0) { toast.info(isAr ? "لا توجد بيانات" : "No data to export"); return; }
    const fname = `attendance_${dateFrom}_${dateTo}`;
    if (kind === "csv") exportCSV(data, fname);
    else exportPDF({
      title: isAr ? "تقرير الحضور" : "Attendance Report",
      subtitle: `${dateFrom} → ${dateTo}`,
      sections: [{ heading: isAr ? "السجلات" : "Records", rows: data }],
      filename: fname,
    });
  };


  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-teal/15 p-2.5 ring-1 ring-teal/30"><Droplets className="h-5 w-5 text-cyan-glow" /></div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{t("pg.attendance.h")}</h2>
          <p className="text-xs text-muted-foreground">{t("pg.attendance.s")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => doExport("csv")} className="border-teal/40"><FileText className="h-4 w-4" /> CSV</Button>
          <Button variant="outline" onClick={() => doExport("pdf")} className="border-mint/40"><FileDown className="h-4 w-4" /> PDF</Button>
          <Button onClick={startNew} className="bg-gradient-to-r from-teal to-cyan-glow text-primary-foreground">
            <Plus className="h-4 w-4" /> {isAr ? "تسجيل حضور" : "New Check-in"}
          </Button>
        </div>
      </div>

      <Card className="glass p-3 md:p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="relative col-span-full lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={isAr ? "ابحث باسم المتدرب أو الكود" : "Search trainee or code"} value={search}
              onChange={e => setSearch(e.target.value)} className="pl-9 bg-background/30" />
          </div>
          <div className="flex items-center gap-1">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-background/30" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{isAr ? "إلى" : "to"}</span>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-background/30" />
          </div>
          <Select value={statusF} onValueChange={setStatusF}>
            <SelectTrigger className="bg-background/30"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "كل الحالات" : "All statuses"}</SelectItem>
              <SelectItem value="checked_in">{isAr ? "دخل (أصفر)" : "Checked-in (yellow)"}</SelectItem>
              <SelectItem value="confirmed">{isAr ? "مؤكد (أخضر)" : "Confirmed (green)"}</SelectItem>
              <SelectItem value="present">{isAr ? "حاضر" : "Present"}</SelectItem>
              <SelectItem value="late">{isAr ? "متأخر" : "Late"}</SelectItem>
              <SelectItem value="absent">{isAr ? "غائب" : "Absent"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={coachF} onValueChange={setCoachF}>
            <SelectTrigger className="bg-background/30"><SelectValue placeholder={isAr ? "كل المدربين" : "All coaches"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "كل المدربين" : "All coaches"}</SelectItem>
              {coaches.map(c => <SelectItem key={c.id} value={c.id}>{coachNameOf(c)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={slotF} onValueChange={setSlotF}>
            <SelectTrigger className="bg-background/30"><SelectValue placeholder={isAr ? "كل الجلسات" : "All slots"} /></SelectTrigger>
            <SelectContent className="max-h-[280px]">
              <SelectItem value="all">{isAr ? "كل الجلسات" : "All slots"}</SelectItem>
              {slots.map(s => <SelectItem key={s.id} value={s.id}>{slotLabel(s.id)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={payF} onValueChange={(v: any) => setPayF(v)}>
            <SelectTrigger className="bg-background/30"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "كل حالات الدفع" : "All payment statuses"}</SelectItem>
              <SelectItem value="paid">{isAr ? "مدفوع" : "Paid"}</SelectItem>
              <SelectItem value="unpaid">{isAr ? "غير مدفوع" : "Unpaid"}</SelectItem>
              <SelectItem value="no_sub">{isAr ? "بدون اشتراك" : "No subscription"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {fullSlots.length > 0 && (
        <Card className={`glass p-4 border ${fullSlots[0].ratio >= 1 ? "border-destructive/50" : "border-warn/50"}`}>
          <div className="flex items-start gap-2">
            <AlertOctagon className={`h-5 w-5 mt-0.5 ${fullSlots[0].ratio >= 1 ? "text-destructive" : "text-warn"}`} />
            <div className="flex-1">
              <div className="font-semibold text-sm">{isAr ? "تنبيهات السعة" : "Capacity Alerts"}</div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs">
                {fullSlots.slice(0, 6).map(f => (
                  <div key={f.id} className="flex items-center justify-between rounded bg-background/30 px-2 py-1">
                    <span>{f.label}</span>
                    <Badge variant="outline" className={f.ratio >= 1 ? "border-destructive/50 text-destructive" : "border-warn/50 text-warn"}>
                      {f.current}/{f.cap}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="glass overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card/60">
              <tr>
                {[isAr ? "المتدرب" : "Trainee", isAr ? "كود العميل" : "Client", isAr ? "الجلسة" : "Slot",
                  isAr ? "دخول" : "In", isAr ? "خروج" : "Out", isAr ? "الحالة" : "Status",
                  isAr ? "الطريقة" : "Method", ""].map(h =>
                  <th key={h} className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map(a => {
                const tr = tById[a.trainee_id];
                return (
                  <tr key={a.id} className="border-b border-border/30 hover:bg-background/20">
                    <td className="px-3 py-2 font-medium">{tr ? nameOf(tr) : "—"}</td>
                    <td className="px-3 py-2 text-xs font-mono text-cyan-glow">{tr?.client_code ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">{slotLabel(a.schedule_slot_id)}</td>
                    <td className="px-3 py-2 tabular-nums text-xs">{a.check_in_at.slice(11, 16)}</td>
                    <td className="px-3 py-2 tabular-nums text-xs">{a.check_out_at ? a.check_out_at.slice(11, 16) : "—"}</td>
                    <td className="px-3 py-2"><Badge variant="outline" className={statusColor(a.status)}>{a.status}</Badge></td>
                    <td className="px-3 py-2 text-xs uppercase text-muted-foreground">{a.method}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        {a.status === "checked_in" && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-emerald-400 hover:bg-emerald-500/15" onClick={() => confirmM.mutate(a.id)} title={isAr ? "تأكيد" : "Confirm"}>
                            <CheckCircle2 className="h-3.5 w-3.5" /><span className="text-xs">{isAr ? "تأكيد" : "Confirm"}</span>
                          </Button>
                        )}
                        {!a.check_out_at && (
                          <Button size="sm" variant="ghost" onClick={() => checkoutM.mutate(a.id)} title={isAr ? "انصراف" : "Check out"}>
                            <LogOut className="h-3.5 w-3.5 text-cyan-glow" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => startEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteM.mutate(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">{isAr ? "لا توجد سجلات حضور لهذا اليوم." : "No attendance records for this day."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong max-w-lg">
          <DialogHeader><DialogTitle>{editing ? (isAr ? "تعديل حضور" : "Edit Attendance") : (isAr ? "تسجيل حضور" : "New Check-in")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label={isAr ? "المتدرب" : "Trainee"}>
              <Select value={form.trainee_id} onValueChange={v => setForm({ ...form, trainee_id: v })}>
                <SelectTrigger className="bg-background/30"><SelectValue placeholder={isAr ? "اختر متدربًا" : "Select trainee"} /></SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {trainees.map(tr => <SelectItem key={tr.id} value={tr.id}>{nameOf(tr)} · {tr.client_code}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={isAr ? "الجلسة (اختياري)" : "Schedule slot (optional)"}>
              <Select value={form.schedule_slot_id} onValueChange={v => setForm({ ...form, schedule_slot_id: v })}>
                <SelectTrigger className="bg-background/30"><SelectValue placeholder={isAr ? "بدون جلسة" : "None"} /></SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {slots.map(s => <SelectItem key={s.id} value={s.id}>{slotLabel(s.id)}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label={isAr ? "التاريخ" : "Date"}><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
              <Field label={isAr ? "دخول" : "Check-in"}><Input type="time" value={form.check_in} onChange={e => setForm({ ...form, check_in: e.target.value })} /></Field>
              <Field label={isAr ? "خروج" : "Check-out"}><Input type="time" value={form.check_out} onChange={e => setForm({ ...form, check_out: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label={isAr ? "الحالة" : "Status"}>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-background/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checked_in">{isAr ? "دخل (بانتظار التأكيد)" : "Checked-in (yellow)"}</SelectItem>
                    <SelectItem value="confirmed">{isAr ? "مؤكد (أخضر)" : "Confirmed (green)"}</SelectItem>
                    <SelectItem value="present">{isAr ? "حاضر" : "Present"}</SelectItem>
                    <SelectItem value="late">{isAr ? "متأخر" : "Late"}</SelectItem>
                    <SelectItem value="absent">{isAr ? "غائب" : "Absent"}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={isAr ? "الطريقة" : "Method"}>
                <Select value={form.method} onValueChange={v => setForm({ ...form, method: v })}>
                  <SelectTrigger className="bg-background/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">{isAr ? "يدوي" : "Manual"}</SelectItem>
                    <SelectItem value="qr">QR</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label={isAr ? "ملاحظات" : "Notes"}>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => saveM.mutate()} className="bg-gradient-to-r from-teal to-cyan-glow text-primary-foreground">{isAr ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AuditLogPanel tables={["attendance"]} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>{children}</div>;
}
