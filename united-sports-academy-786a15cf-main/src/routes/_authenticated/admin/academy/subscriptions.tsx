import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Search, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { fetchNewClientCode } from "@/lib/legends/phase2-helpers";
import { toast } from "sonner";

import { PermissionGate } from "@/components/legends/PermissionGate";
import { FinanceSubNav } from "@/components/legends/SubNav";


export const Route = createFileRoute("/_authenticated/admin/academy/subscriptions")({
  head: () => ({ meta: [{ title: "Subscriptions · United Sports Academy" }] }),
  component: () => <PermissionGate path="/subscriptions"><SubsPage /></PermissionGate>,
});

type Sub = {
  id: string; branch_id: string; trainee_id: string; coach_id: string | null; schedule_slot_id: string | null;
  lane_id: string | null; group_id: string | null; time_slot_id: string | null;
  package_name: string; package_type: string | null; total_sessions: number; used_sessions: number;
  start_date: string; end_date: string | null; status: string;
  price: number; paid_amount: number; payment_method: string | null; receipt_number: string | null;
};
type Trainee = { id: string; client_code: string; full_name: string; phone: string | null };
type TS = { id: string; label: string; day_of_week: number; start_time: string; end_time: string };
type Lane = { id: string; lane_number: number; name: string | null };
type GroupRow = { id: string; name: string; name_ar: string | null; category: string | null; level: string | null; max_capacity: number };
type AvailCoach = { id: string; full_name: string; title: string | null; department: string | null };
type AvailGroup = { id: string; name: string; name_ar: string | null; category: string | null; level: string | null; max_capacity: number; current_count: number; color: string | null };

const DOW_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function SubsPage() {
  const { currentBranchId } = useSession();
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("all");

  const subsQ = useQuery({
    queryKey: ["subs", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_subscriptions").select("*")
        .eq("branch_id", currentBranchId!).is("deleted_at", null).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Sub[];
    },
  });
  const trQ = useQuery({
    queryKey: ["trainees", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_trainees").select("id,client_code,full_name,phone")
        .eq("branch_id", currentBranchId!).is("deleted_at", null).order("full_name");
      if (error) throw error;
      return data as Trainee[];
    },
  });
  const tsQ = useQuery({
    queryKey: ["ts-list", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_time_slots").select("id,label,day_of_week,start_time,end_time")
        .eq("branch_id", currentBranchId!).eq("active", true).order("day_of_week").order("start_time");
      if (error) throw error;
      return data as TS[];
    },
  });
  const lanesQ = useQuery({
    queryKey: ["lanes-list", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_lanes").select("id,lane_number,name")
        .eq("branch_id", currentBranchId!).order("lane_number");
      if (error) throw error;
      return data as Lane[];
    },
  });
  const groupsQ = useQuery({
    queryKey: ["groups-list", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_groups").select("id,name,name_ar,category,level,max_capacity")
        .eq("branch_id", currentBranchId!).eq("active", true).order("name");
      if (error) throw error;
      return data as GroupRow[];
    },
  });

  const traineeMap = useMemo(() => Object.fromEntries((trQ.data ?? []).map((t) => [t.id, t])), [trQ.data]);
  const tsMap = useMemo(() => Object.fromEntries((tsQ.data ?? []).map((t) => [t.id, t])), [tsQ.data]);
  const laneMap = useMemo(() => Object.fromEntries((lanesQ.data ?? []).map((l) => [l.id, l])), [lanesQ.data]);
  const groupMap = useMemo(() => Object.fromEntries((groupsQ.data ?? []).map((g) => [g.id, g])), [groupsQ.data]);

  const filtered = useMemo(() => {
    return (subsQ.data ?? []).filter((s) => {
      if (statusF !== "all" && s.status !== statusF) return false;
      if (!q) return true;
      const t = traineeMap[s.trainee_id];
      const hay = [s.package_name, s.receipt_number, t?.full_name, t?.client_code, t?.phone].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [subsQ.data, q, statusF, traineeMap]);

  const create = useMutation({
    mutationFn: async (p: any) => {
      const { error } = await supabase.from("ac_subscriptions").insert({ ...p, branch_id: currentBranchId } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subs"] }); setOpen(false); toast.success(isAr ? "تم إنشاء الاشتراك" : "Subscription created"); },
    onError: (e: any) => {
      const msg = String(e?.message ?? e);
      if (msg.includes("GROUP_FULL")) toast.error(isAr ? "المجموعة مقفولة — لا توجد سعة متاحة" : "Group is FULL — capacity reached");
      else toast.error(msg);
    },
  });

  const updStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("ac_subscriptions").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subs"] }),
  });

  const tsLabel = (id: string | null) => {
    if (!id) return "—";
    const ts = tsMap[id]; if (!ts) return "—";
    return `${(isAr ? DOW_AR : DOW_EN)[ts.day_of_week]} · ${ts.label}`;
  };

  return (
    <div className="space-y-6">
      <FinanceSubNav />
      <div className="flex items-center justify-between flex-wrap gap-3">

        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="h-6 w-6 text-cyan-glow" />{isAr ? "الاشتراكات" : "Subscriptions"}</h2>
          <p className="text-sm text-muted-foreground">{isAr ? "التسكين الذكي: مدرب + حارة + مجموعة + معاد" : "Smart assignment: coach + lane + group + slot"}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />{isAr ? "اشتراك جديد" : "New Subscription"}</Button></DialogTrigger>
          <NewSubDialog
            trainees={trQ.data ?? []}
            timeSlots={tsQ.data ?? []}
            lanes={lanesQ.data ?? []}
            allGroups={groupsQ.data ?? []}
            branchId={currentBranchId}
            onCreate={create.mutate}
            isAr={isAr}
          />
        </Dialog>
      </div>

      <Card className="glass">
        <CardContent className="pt-4 flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={isAr ? "ابحث بالاسم / كود العميل / رقم الإيصال" : "Search by name / client code / receipt"}
              value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusF} onValueChange={setStatusF}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "كل الحالات" : "All statuses"}</SelectItem>
              <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
              <SelectItem value="expired">{isAr ? "منتهي" : "Expired"}</SelectItem>
              <SelectItem value="paused">{isAr ? "متوقف" : "Paused"}</SelectItem>
              <SelectItem value="cancelled">{isAr ? "ملغي" : "Cancelled"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader><CardTitle className="text-sm">{filtered.length} {isAr ? "اشتراك" : "subscriptions"}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2">{isAr ? "المتدرب" : "Trainee"}</th>
                <th className="text-left py-2 px-2">{isAr ? "الحزمة" : "Package"}</th>
                <th className="text-left py-2 px-2">{isAr ? "الموعد" : "Slot"}</th>
                <th className="text-left py-2 px-2">{isAr ? "الحارة" : "Lane"}</th>
                <th className="text-left py-2 px-2">{isAr ? "المجموعة" : "Group"}</th>
                <th className="text-left py-2 px-2">{isAr ? "الجلسات" : "Sessions"}</th>
                <th className="text-left py-2 px-2">{isAr ? "المبلغ" : "Paid"}</th>
                <th className="text-left py-2 px-2">{isAr ? "الحالة" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const t = traineeMap[s.trainee_id];
                const remaining = s.total_sessions - s.used_sessions;
                const lane = s.lane_id ? laneMap[s.lane_id] : null;
                const grp = s.group_id ? groupMap[s.group_id] : null;
                return (
                  <tr key={s.id} className="border-b border-border/40 hover:bg-accent/20">
                    <td className="py-2 px-2">
                      <div className="font-medium">{t?.full_name ?? "—"}</div>
                      <div className="text-xs text-cyan-glow font-mono">{t?.client_code}</div>
                    </td>
                    <td className="py-2 px-2">{s.package_name}<div className="text-xs text-muted-foreground">{s.package_type}</div></td>
                    <td className="py-2 px-2 text-xs">{tsLabel(s.time_slot_id)}</td>
                    <td className="py-2 px-2 text-xs">{lane ? (lane.name ?? `Lane ${lane.lane_number}`) : "—"}</td>
                    <td className="py-2 px-2 text-xs">{grp ? (isAr && grp.name_ar ? grp.name_ar : grp.name) : "—"}</td>
                    <td className="py-2 px-2"><Badge variant="outline">{remaining}/{s.total_sessions}</Badge></td>
                    <td className="py-2 px-2">{Number(s.paid_amount).toFixed(0)} / {Number(s.price).toFixed(0)}</td>
                    <td className="py-2 px-2">
                      <Select value={s.status} onValueChange={(v) => updStatus.mutate({ id: s.id, status: v })}>
                        <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد نتائج" : "No results"}</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function NewSubDialog({ trainees, timeSlots, lanes, allGroups, branchId, onCreate, isAr }: {
  trainees: Trainee[]; timeSlots: TS[]; lanes: Lane[]; allGroups: GroupRow[];
  branchId: string | null; onCreate: (p: any) => void; isAr: boolean;
}) {
  const [traineeId, setTraineeId] = useState("");
  const [newClient, setNewClient] = useState({ full_name: "", phone: "" });
  const [mode, setMode] = useState<"existing" | "new">("existing");

  const [category, setCategory] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [timeSlotId, setTimeSlotId] = useState<string>("");
  const [laneId, setLaneId] = useState<string>("");
  const [groupId, setGroupId] = useState<string>("");
  const [coachId, setCoachId] = useState<string>("");

  const [form, setForm] = useState({
    package_name: "", package_type: "Group", total_sessions: 8, price: 0, paid_amount: 0,
    payment_method: "Cash", receipt_number: "", start_date: new Date().toISOString().slice(0, 10),
    end_date: "",
  });

  const availCoachesQ = useQuery({
    queryKey: ["avail-coaches", branchId, timeSlotId],
    enabled: !!branchId && !!timeSlotId,
    queryFn: async (): Promise<AvailCoach[]> => {
      const { data, error } = await supabase.rpc("ac_available_coaches", {
        _branch_id: branchId!, _time_slot_id: timeSlotId,
      });
      if (error) throw error;
      return (data ?? []) as AvailCoach[];
    },
  });

  const availGroupsQ = useQuery({
    queryKey: ["avail-groups", branchId, timeSlotId, category, level],
    enabled: !!branchId && !!timeSlotId,
    queryFn: async (): Promise<AvailGroup[]> => {
      const { data, error } = await supabase.rpc("ac_available_groups", {
        _branch_id: branchId!, _time_slot_id: timeSlotId,
        _category: category || undefined, _level: level || undefined,
      });
      if (error) throw error;
      return (data ?? []) as AvailGroup[];
    },
  });

  const categories = useMemo(() => Array.from(new Set(allGroups.map(g => g.category).filter(Boolean))) as string[], [allGroups]);
  const levels = useMemo(() => Array.from(new Set(allGroups.map(g => g.level).filter(Boolean))) as string[], [allGroups]);

  // reset group when time slot / category / level changes
  useEffect(() => { setGroupId(""); setCoachId(""); }, [timeSlotId]);

  const selectedGroup = availGroupsQ.data?.find(g => g.id === groupId);
  const groupIsFull = selectedGroup ? Number(selectedGroup.current_count) >= selectedGroup.max_capacity : false;
  const alternatives = (availGroupsQ.data ?? []).filter(g => g.id !== groupId && Number(g.current_count) < g.max_capacity).slice(0, 4);

  const handleCreate = async () => {
    let tid = traineeId;
    if (mode === "new") {
      if (!newClient.full_name) return toast.error(isAr ? "أدخل اسم المتدرب" : "Enter trainee name");
      const code = await fetchNewClientCode();
      const { data, error } = await supabase.from("ac_trainees").insert({
        branch_id: branchId, client_code: code, full_name: newClient.full_name, phone: newClient.phone || null,
      } as any).select("id").single();
      if (error) return toast.error(error.message);
      tid = data!.id;
    }
    if (!tid) return toast.error(isAr ? "اختر المتدرب" : "Choose a trainee");
    if (groupIsFull) return toast.error(isAr ? "المجموعة مقفولة — اختر بديلاً" : "Group is FULL — pick an alternative");

    onCreate({
      trainee_id: tid,
      coach_id: coachId || null,
      lane_id: laneId || null,
      group_id: groupId || null,
      time_slot_id: timeSlotId || null,
      package_name: form.package_name, package_type: form.package_type,
      total_sessions: Number(form.total_sessions), used_sessions: 0,
      start_date: form.start_date, end_date: form.end_date || null,
      price: Number(form.price), paid_amount: Number(form.paid_amount),
      payment_method: form.payment_method, receipt_number: form.receipt_number || null,
      status: "active",
    });
  };

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{isAr ? "اشتراك جديد — تسكين ذكي" : "New Subscription — Smart Assignment"}</DialogTitle></DialogHeader>
      <div className="grid gap-4">
        {/* Trainee */}
        <div className="rounded-lg border border-border/40 p-3 space-y-3">
          <div className="flex gap-2">
            <Button size="sm" variant={mode === "existing" ? "default" : "outline"} onClick={() => setMode("existing")}>{isAr ? "متدرب موجود" : "Existing trainee"}</Button>
            <Button size="sm" variant={mode === "new" ? "default" : "outline"} onClick={() => setMode("new")}>{isAr ? "متدرب جديد" : "New trainee"}</Button>
          </div>
          {mode === "existing" ? (
            <div><Label>{isAr ? "المتدرب" : "Trainee"}</Label>
              <Select value={traineeId} onValueChange={setTraineeId}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Choose"} /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {trainees.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name} · {t.client_code}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{isAr ? "الاسم" : "Name"}</Label><Input value={newClient.full_name} onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value })} /></div>
              <div><Label>{isAr ? "الهاتف" : "Phone"}</Label><Input value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} /></div>
            </div>
          )}
        </div>

        {/* Smart assignment */}
        <div className="rounded-lg border border-teal/30 bg-teal/5 p-3 space-y-3">
          <div className="text-xs uppercase tracking-wider text-cyan-glow font-semibold">
            {isAr ? "التسكين الذكي" : "Smart Assignment"}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isAr ? "الفئة" : "Category"}</Label>
              <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Any"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "Any"}</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? "المستوى" : "Level"}</Label>
              <Select value={level || "all"} onValueChange={(v) => setLevel(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Any"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "Any"}</SelectItem>
                  {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>{isAr ? "اليوم والوقت" : "Day & Time Slot"}</Label>
              <Select value={timeSlotId} onValueChange={setTimeSlotId}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر الميعاد" : "Select time slot"} /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {timeSlots.map(ts => (
                    <SelectItem key={ts.id} value={ts.id}>
                      {(isAr ? DOW_AR : DOW_EN)[ts.day_of_week]} · {ts.label} ({ts.start_time?.slice(0, 5)}–{ts.end_time?.slice(0, 5)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center gap-1">
                {isAr ? "المدرب المتاح" : "Available Coach"}
                {timeSlotId && <Badge variant="outline" className="text-[10px] h-4">{availCoachesQ.data?.length ?? 0}</Badge>}
              </Label>
              <Select value={coachId || "none"} onValueChange={(v) => setCoachId(v === "none" ? "" : v)} disabled={!timeSlotId}>
                <SelectTrigger>
                  <SelectValue placeholder={timeSlotId ? (isAr ? "اختر مدربًا" : "Choose coach") : (isAr ? "اختر الميعاد أولاً" : "Pick slot first")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {(availCoachesQ.data ?? []).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name}{c.title ? ` · ${c.title}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {timeSlotId && !availCoachesQ.isLoading && (availCoachesQ.data?.length ?? 0) === 0 && (
                <div className="text-[11px] text-warn mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{isAr ? "لا يوجد مدرب متاح في هذا الميعاد" : "No coach available at this slot"}</div>
              )}
            </div>

            <div>
              <Label>{isAr ? "الحارة" : "Lane"}</Label>
              <Select value={laneId || "none"} onValueChange={(v) => setLaneId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر حارة" : "Choose lane"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {lanes.map(l => <SelectItem key={l.id} value={l.id}>{l.name ?? `Lane ${l.lane_number}`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label className="flex items-center gap-1">
                {isAr ? "المجموعة" : "Group"}
                {selectedGroup && (
                  groupIsFull
                    ? <Badge className="bg-destructive/20 text-destructive border-destructive/40 text-[10px] h-4"><Lock className="h-2.5 w-2.5 mr-1" />{isAr ? "مقفولة" : "FULL"}</Badge>
                    : <Badge className="bg-mint/20 text-mint border-mint/40 text-[10px] h-4"><CheckCircle2 className="h-2.5 w-2.5 mr-1" />{Number(selectedGroup.current_count)}/{selectedGroup.max_capacity}</Badge>
                )}
              </Label>
              <Select value={groupId || "none"} onValueChange={(v) => setGroupId(v === "none" ? "" : v)} disabled={!timeSlotId}>
                <SelectTrigger>
                  <SelectValue placeholder={timeSlotId ? (isAr ? "اختر مجموعة" : "Choose group") : (isAr ? "اختر الميعاد أولاً" : "Pick slot first")} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="none">—</SelectItem>
                  {(availGroupsQ.data ?? []).map(g => {
                    const full = Number(g.current_count) >= g.max_capacity;
                    return (
                      <SelectItem key={g.id} value={g.id} disabled={full}>
                        {(isAr && g.name_ar) ? g.name_ar : g.name} · {g.category ?? "—"}/{g.level ?? "—"} · {Number(g.current_count)}/{g.max_capacity} {full ? (isAr ? "(مقفولة)" : "(FULL)") : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {groupIsFull && alternatives.length > 0 && (
                <div className="mt-2 rounded border border-warn/40 bg-warn/10 p-2 text-xs space-y-1.5">
                  <div className="font-semibold text-warn flex items-center gap-1"><AlertCircle className="h-3 w-3" />{isAr ? "مقترحات مجموعات متاحة" : "Suggested available groups"}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {alternatives.map(g => (
                      <Button key={g.id} size="sm" variant="outline" className="h-7 text-xs border-mint/40"
                        onClick={() => setGroupId(g.id)}>
                        {(isAr && g.name_ar) ? g.name_ar : g.name} ({Number(g.current_count)}/{g.max_capacity})
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Package & payment */}
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{isAr ? "اسم الحزمة" : "Package name"}</Label><Input value={form.package_name} onChange={(e) => setForm({ ...form, package_name: e.target.value })} /></div>
          <div><Label>{isAr ? "نوع الحزمة" : "Type"}</Label>
            <Select value={form.package_type} onValueChange={(v) => setForm({ ...form, package_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Private">Private</SelectItem><SelectItem value="Semi-Private">Semi-Private</SelectItem>
                <SelectItem value="Group">Group</SelectItem><SelectItem value="Hourly">Hourly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>{isAr ? "عدد الجلسات" : "Total sessions"}</Label><Input type="number" min={1} value={form.total_sessions} onChange={(e) => setForm({ ...form, total_sessions: Number(e.target.value) })} /></div>
          <div><Label>{isAr ? "طريقة الدفع" : "Method"}</Label>
            <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem><SelectItem value="InstaPay">InstaPay</SelectItem><SelectItem value="Wallet">Wallet</SelectItem><SelectItem value="Card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>{isAr ? "السعر" : "Price"}</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
          <div><Label>{isAr ? "المدفوع" : "Paid"}</Label><Input type="number" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: Number(e.target.value) })} /></div>
          <div><Label>{isAr ? "البداية" : "Start"}</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
          <div><Label>{isAr ? "النهاية" : "End"}</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
          <div className="col-span-2"><Label>{isAr ? "رقم الإيصال" : "Receipt #"}</Label><Input value={form.receipt_number} onChange={(e) => setForm({ ...form, receipt_number: e.target.value })} /></div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleCreate} disabled={groupIsFull}>
          {isAr ? "إنشاء" : "Create"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
