import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CalendarDays, Plus, Pencil, Trash2, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/legends/i18n";
import { useSession } from "@/lib/legends/session";
import { BranchGuard, useRequireBranch } from "@/components/legends/BranchGuard";

export const Route = createFileRoute("/_authenticated/admin/academy/schedule")({
  head: () => ({ meta: [{ title: "Scheduling · United Sports Academy" }] }),
  component: SchedulePage,
});

const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

type Slot = {
  id: string;
  branch_id: string;
  lane_id: string;
  group_id: string | null;
  coach_id: string | null;
  time_slot_id: string;
  capacity_override: number | null;
  notes: string | null;
  active: boolean;
};
type SlotForm = Omit<Slot, "id" | "branch_id">;

const empty: SlotForm = {
  lane_id: "", group_id: null, coach_id: null, time_slot_id: "",
  capacity_override: null, notes: "", active: true,
};

function SchedulePage() {
  const { lang } = useI18n();
  const isAr = lang === "ar";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-teal/15 p-2.5 ring-1 ring-teal/30">
          <CalendarDays className="h-5 w-5 text-cyan-glow" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{isAr ? "الجدولة" : "Scheduling"}</h2>
          <p className="text-xs text-muted-foreground">
            {isAr ? "ربط الحارات بالمدربين والمجموعات والأوقات" : "Map lanes to coaches, groups, and time slots"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="grid">
        <TabsList className="bg-card/60 backdrop-blur ring-1 ring-border">
          <TabsTrigger value="grid">{isAr ? "الجدول" : "Timetable"}</TabsTrigger>
          <TabsTrigger value="list">{isAr ? "كل المواعيد" : "All slots"}</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-5"><ScheduleBoard /></TabsContent>
        <TabsContent value="list" className="mt-5"><SlotsList /></TabsContent>
      </Tabs>
    </div>
  );
}

function useScheduleData() {
  const { currentBranchId } = useSession();
  const slotsQ = useQuery({
    queryKey: ["schedule_slots", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async (): Promise<Slot[]> => {
      const { data, error } = await supabase
        .from("ac_schedule_slots")
        .select("*")
        .eq("branch_id", currentBranchId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Slot[];
    },
  });
  const lanesQ = useQuery({
    queryKey: ["lanes", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_lanes")
        .select("id, lane_number, name, pool_id, default_capacity")
        .eq("branch_id", currentBranchId!).order("lane_number");
      if (error) throw error;
      return data ?? [];
    },
  });
  const timeSlotsQ = useQuery({
    queryKey: ["time_slots", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_time_slots")
        .select("id, label, start_time, end_time, day_of_week, active")
        .eq("branch_id", currentBranchId!).eq("active", true)
        .order("day_of_week").order("start_time");
      if (error) throw error;
      return data ?? [];
    },
  });
  const groupsQ = useQuery({
    queryKey: ["groups", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_groups")
        .select("id, name, name_ar, max_capacity, color, active")
        .eq("branch_id", currentBranchId!).eq("active", true).order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const coachesQ = useQuery({
    queryKey: ["employees-coaches", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_employees")
        .select("id, full_name, full_name_ar, title, department, status")
        .eq("branch_id", currentBranchId!).eq("status", "active").order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });
  return { slotsQ, lanesQ, timeSlotsQ, groupsQ, coachesQ };
}

function ScheduleBoard() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const { slotsQ, lanesQ, timeSlotsQ, groupsQ, coachesQ } = useScheduleData();
  const slots = slotsQ.data ?? [];
  const lanes = lanesQ.data ?? [];
  const timeSlots = timeSlotsQ.data ?? [];
  const groups = groupsQ.data ?? [];
  const coaches = coachesQ.data ?? [];

  const groupById = useMemo(() => Object.fromEntries(groups.map((g: any) => [g.id, g])), [groups]);
  const coachById = useMemo(() => Object.fromEntries(coaches.map((c: any) => [c.id, c])), [coaches]);
  const laneLabel = (l: any) => l.name || `${isAr ? "حارة" : "Lane"} ${l.lane_number}`;
  const coachLabel = (c: any) => (isAr && c.full_name_ar) || c.full_name;
  const groupLabel = (g: any) => (isAr && g.name_ar) || g.name;
  const dayLabel = (d: number) => (isAr ? DAYS_AR : DAYS_EN)[d] ?? String(d);

  const [day, setDay] = useState<number>(new Date().getDay());
  const daySlots = timeSlots.filter((t: any) => t.day_of_week === day);

  if (!slotsQ.isFetched) return <Card className="glass p-6 text-sm text-muted-foreground">{isAr ? "تحميل…" : "Loading…"}</Card>;

  if (lanes.length === 0 || timeSlots.length === 0) {
    return (
      <Card className="glass p-6 text-sm text-muted-foreground">
        {isAr
          ? "أضف حارات وأوقات أولًا من صفحتي الحارات والإعدادات."
          : "Add lanes and time slots first from the Lanes and Settings pages."}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(isAr ? DAYS_AR : DAYS_EN).map((d, i) => (
          <button key={i} onClick={() => setDay(i)}
            className={"rounded-full border px-3 py-1.5 text-xs font-medium " +
              (i === day ? "border-cyan-glow/60 bg-cyan-glow/15 text-cyan-glow" : "border-border text-muted-foreground")}>
            {d}
          </button>
        ))}
      </div>

      <Card className="glass overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left">
                <th className="sticky left-0 z-10 bg-card/80 backdrop-blur px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">
                  {isAr ? "الوقت" : "Time"}
                </th>
                {lanes.map((l: any) => (
                  <th key={l.id} className="px-3 py-3 text-left text-xs font-semibold text-cyan-glow whitespace-nowrap">
                    {laneLabel(l)}
                    <div className="text-[10px] font-normal text-muted-foreground">cap {l.default_capacity}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daySlots.length === 0 && (
                <tr><td colSpan={lanes.length + 1} className="p-8 text-center text-sm text-muted-foreground">
                  {isAr ? `لا توجد أوقات ليوم ${dayLabel(day)}` : `No time slots for ${dayLabel(day)}`}
                </td></tr>
              )}
              {daySlots.map((ts: any) => (
                <tr key={ts.id} className="border-b border-border/30 align-top">
                  <td className="sticky left-0 z-10 bg-card/60 backdrop-blur px-4 py-3 font-medium whitespace-nowrap text-xs uppercase tracking-wider text-cyan-glow">
                    {ts.label}
                  </td>
                  {lanes.map((l: any) => {
                    const cell = slots.filter(s => s.lane_id === l.id && s.time_slot_id === ts.id && s.active);
                    return (
                      <td key={l.id} className="min-w-[180px] px-2 py-2">
                        {cell.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-border/40 bg-background/10 px-2 py-3 text-center text-[11px] text-muted-foreground/70">
                            —
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {cell.map(s => {
                              const g = s.group_id ? groupById[s.group_id] : null;
                              const c = s.coach_id ? coachById[s.coach_id] : null;
                              const color = g?.color || "#41C9E2";
                              return (
                                <div key={s.id} className="rounded-lg p-2 ring-1"
                                  style={{ background: `${color}14`, borderColor: color, color }}>
                                  <div className="flex items-center justify-between gap-1">
                                    <Badge variant="outline" className="border-current text-[10px]">
                                      {g ? groupLabel(g) : (isAr ? "بدون مجموعة" : "No group")}
                                    </Badge>
                                    <span className="text-[10px] tabular-nums">
                                      cap {s.capacity_override ?? g?.max_capacity ?? l.default_capacity}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-[11px] text-foreground/90 truncate">
                                    {c ? coachLabel(c) : (isAr ? "بدون مدرب" : "No coach")}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SlotsList() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const { currentBranchId } = useSession();
  const { ensureBranch } = useRequireBranch();
  const qc = useQueryClient();
  const { slotsQ, lanesQ, timeSlotsQ, groupsQ, coachesQ } = useScheduleData();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Slot | null>(null);
  const [form, setForm] = useState<SlotForm>(empty);

  const saveM = useMutation({
    mutationFn: async () => {
      const branchId = ensureBranch();
      if (!branchId) throw new Error("no-branch");
      if (!form.lane_id || !form.time_slot_id) throw new Error(isAr ? "اختر الحارة والوقت" : "Select lane and time slot");
      const payload = {
        branch_id: branchId,
        lane_id: form.lane_id,
        time_slot_id: form.time_slot_id,
        coach_id: form.coach_id || null,
        group_id: form.group_id || null,
        capacity_override: form.capacity_override,
        notes: form.notes || null,
        active: form.active,
      };
      if (editing) {
        const { error } = await supabase.from("ac_schedule_slots").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ac_schedule_slots").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isAr ? "تم الحفظ" : "Saved");
      qc.invalidateQueries({ queryKey: ["schedule_slots"] });
      setOpen(false); setEditing(null); setForm(empty);
    },
    onError: (e: any) => {
      const msg = String(e?.message ?? e ?? "");
      if (e?.code === "23505" || /duplicate|unique/i.test(msg)) {
        if (/coach/i.test(msg)) toast.error(isAr ? "تعارض: هذا المدرب محجوز بالفعل في نفس الوقت بهذا الفرع" : "Conflict: this coach is already booked for the same time slot in this branch");
        else if (/lane/i.test(msg)) toast.error(isAr ? "تعارض: هذه الحارة محجوزة في نفس الوقت" : "Conflict: this lane is already booked for the same time slot");
        else toast.error(isAr ? "تعارض في الحجز" : "Booking conflict");
      } else toast.error(msg || (isAr ? "حدث خطأ" : "Error"));
    },
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ac_schedule_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(isAr ? "تم الحذف" : "Deleted");
      qc.invalidateQueries({ queryKey: ["schedule_slots"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const lanes = lanesQ.data ?? [];
  const timeSlots = timeSlotsQ.data ?? [];
  const groups = groupsQ.data ?? [];
  const coaches = coachesQ.data ?? [];
  const slots = slotsQ.data ?? [];

  const laneById = Object.fromEntries(lanes.map((l: any) => [l.id, l]));
  const tsById = Object.fromEntries(timeSlots.map((t: any) => [t.id, t]));
  const groupById = Object.fromEntries(groups.map((g: any) => [g.id, g]));
  const coachById = Object.fromEntries(coaches.map((c: any) => [c.id, c]));

  const startNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const startEdit = (s: Slot) => {
    setEditing(s);
    setForm({
      lane_id: s.lane_id, time_slot_id: s.time_slot_id, coach_id: s.coach_id,
      group_id: s.group_id, capacity_override: s.capacity_override, notes: s.notes ?? "", active: s.active,
    });
    setOpen(true);
  };

  const [fDay, setFDay] = useState<string>("all");
  const [fLane, setFLane] = useState<string>("all");
  const [fCoach, setFCoach] = useState<string>("all");
  const [fTime, setFTime] = useState<string>("all");

  // Unique time-slot labels for the filter, optionally scoped by selected day
  const timeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of timeSlots as any[]) {
      if (fDay !== "all" && String(t.day_of_week) !== fDay) continue;
      const label = t.label || `${t.start_time ?? ""}${t.end_time ? "–" + t.end_time : ""}`;
      if (!seen.has(label)) seen.set(label, label);
    }
    return Array.from(seen.keys()).sort();
  }, [timeSlots, fDay]);

  const filteredSlots = slots.filter((s) => {
    if (fLane !== "all" && s.lane_id !== fLane) return false;
    if (fCoach !== "all" && s.coach_id !== fCoach) return false;
    const ts: any = tsById[s.time_slot_id];
    if (fDay !== "all") {
      if (!ts || String(ts.day_of_week) !== fDay) return false;
    }
    if (fTime !== "all") {
      const label = ts?.label || `${ts?.start_time ?? ""}${ts?.end_time ? "–" + ts.end_time : ""}`;
      if (label !== fTime) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <BranchGuard>
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex flex-wrap gap-2">
            <Select value={fDay} onValueChange={(v) => { setFDay(v); setFTime("all"); }}>
              <SelectTrigger className="w-[140px] bg-background/30"><SelectValue placeholder={isAr ? "اليوم" : "Day"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل الأيام" : "All days"}</SelectItem>
                {(isAr ? DAYS_AR : DAYS_EN).map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fTime} onValueChange={setFTime}>
              <SelectTrigger className="w-[150px] bg-background/30"><SelectValue placeholder={isAr ? "الوقت" : "Time"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل المواعيد" : "All times"}</SelectItem>
                {timeOptions.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fLane} onValueChange={setFLane}>
              <SelectTrigger className="w-[160px] bg-background/30"><SelectValue placeholder={isAr ? "الحارة" : "Lane"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل الحارات" : "All lanes"}</SelectItem>
                {lanes.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name || `${isAr ? "حارة" : "Lane"} ${l.lane_number}`}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fCoach} onValueChange={setFCoach}>
              <SelectTrigger className="w-[180px] bg-background/30"><SelectValue placeholder={isAr ? "المدرب" : "Coach"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل المدربين" : "All coaches"}</SelectItem>
                {coaches.map((c: any) => <SelectItem key={c.id} value={c.id}>{(isAr && c.full_name_ar) || c.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={startNew} className="bg-gradient-to-r from-cyan-glow to-teal text-primary-foreground">
            <Plus className="mr-1.5 h-4 w-4" /> {isAr ? "موعد جديد" : "New slot"}
          </Button>
        </div>
      </BranchGuard>


      <Card className="glass overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card/60">
              <tr>
                {[
                  isAr ? "اليوم" : "Day",
                  isAr ? "الوقت" : "Time",
                  isAr ? "الحارة" : "Lane",
                  isAr ? "المجموعة" : "Group",
                  isAr ? "المدرب" : "Coach",
                  isAr ? "السعة" : "Capacity",
                  isAr ? "الحالة" : "Status",
                  "",
                ].map(h => <th key={h} className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredSlots.map(s => {
                const ts: any = tsById[s.time_slot_id];
                const l: any = laneById[s.lane_id];
                const g: any = s.group_id ? groupById[s.group_id] : null;
                const c: any = s.coach_id ? coachById[s.coach_id] : null;
                return (
                  <tr key={s.id} className="border-b border-border/30">
                    <td className="px-3 py-2 text-xs">{ts ? (isAr ? DAYS_AR : DAYS_EN)[ts.day_of_week] : "—"}</td>
                    <td className="px-3 py-2 text-xs">{ts?.label ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">{l ? (l.name || `${isAr ? "حارة" : "Lane"} ${l.lane_number}`) : "—"}</td>
                    <td className="px-3 py-2 text-xs">{g ? ((isAr && g.name_ar) || g.name) : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2 text-xs">{c ? ((isAr && c.full_name_ar) || c.full_name) : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2 text-xs tabular-nums">{s.capacity_override ?? g?.max_capacity ?? l?.default_capacity ?? "—"}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className={s.active
                        ? "border-mint/40 text-mint" : "border-border text-muted-foreground"}>
                        {s.active ? (isAr ? "نشط" : "Active") : (isAr ? "متوقف" : "Off")}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteM.mutate(s.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {slots.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">
                  {isAr ? "لا توجد مواعيد بعد." : "No schedule slots yet."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(empty); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? (isAr ? "تعديل موعد" : "Edit slot") : (isAr ? "موعد جديد" : "New slot")}</DialogTitle>
          </DialogHeader>
          <BranchGuard>
            <div className="grid gap-3">
              <Field label={isAr ? "الحارة" : "Lane"}>
                <Select value={form.lane_id} onValueChange={(v) => setForm({ ...form, lane_id: v })}>
                  <SelectTrigger className="bg-background/30"><SelectValue placeholder={isAr ? "اختر الحارة" : "Select lane"} /></SelectTrigger>
                  <SelectContent>
                    {lanes.map((l: any) => (
                      <SelectItem key={l.id} value={l.id}>{l.name || `${isAr ? "حارة" : "Lane"} ${l.lane_number}`} · cap {l.default_capacity}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={isAr ? "الوقت" : "Time slot"}>
                <Select value={form.time_slot_id} onValueChange={(v) => setForm({ ...form, time_slot_id: v })}>
                  <SelectTrigger className="bg-background/30"><SelectValue placeholder={isAr ? "اختر الوقت" : "Select time"} /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {timeSlots.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {(isAr ? DAYS_AR : DAYS_EN)[t.day_of_week]} · {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={isAr ? "المجموعة" : "Group"}>
                <Select value={form.group_id ?? "_none"} onValueChange={(v) => setForm({ ...form, group_id: v === "_none" ? null : v })}>
                  <SelectTrigger className="bg-background/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">{isAr ? "بدون" : "None"}</SelectItem>
                    {groups.map((g: any) => (
                      <SelectItem key={g.id} value={g.id}>{(isAr && g.name_ar) || g.name} · cap {g.max_capacity}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={isAr ? "المدرب" : "Coach"}>
                <Select value={form.coach_id ?? "_none"} onValueChange={(v) => setForm({ ...form, coach_id: v === "_none" ? null : v })}>
                  <SelectTrigger className="bg-background/30"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="_none">{isAr ? "بدون" : "None"}</SelectItem>
                    {coaches.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{(isAr && c.full_name_ar) || c.full_name}{c.title ? ` · ${c.title}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={isAr ? "تجاوز السعة (اختياري)" : "Capacity override (optional)"}>
                <Input type="number" min={1} value={form.capacity_override ?? ""}
                  onChange={(e) => setForm({ ...form, capacity_override: e.target.value ? Number(e.target.value) : null })}
                  className="bg-background/30" />
              </Field>
              <Field label={isAr ? "ملاحظات" : "Notes"}>
                <Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-background/30" />
              </Field>
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/20 px-3 py-2">
                <Label className="text-xs">{isAr ? "نشط" : "Active"}</Label>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>
            </div>
          </BranchGuard>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => saveM.mutate()} disabled={saveM.isPending}
              className="bg-gradient-to-r from-cyan-glow to-teal text-primary-foreground">
              <Clock className="mr-1.5 h-4 w-4" /> {isAr ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5" /> {slots.length} {isAr ? "موعد" : "slot(s)"} · {coaches.length} {isAr ? "مدرب نشط" : "active coaches"}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
