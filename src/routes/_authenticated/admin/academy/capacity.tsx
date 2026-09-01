import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Grid3x3, Waves, TriangleAlert, Pencil, Check, CalendarClock, AlertOctagon } from "lucide-react";
import { toast } from "sonner";
import { AuditLogPanel } from "@/components/legends/AuditLogPanel";
import { PoolsConfigSubNav } from "@/components/legends/SubNav";



export const Route = createFileRoute("/_authenticated/admin/academy/capacity")({
  head: () => ({ meta: [{ title: "Lane Capacity · United Sports Academy" }] }),
  component: CapacityPage,
});

type Lane = { id: string; lane_number: number; name: string | null; default_capacity: number };
type TS = { id: string; label: string; day_of_week: number; start_time: string; end_time: string; active: boolean };
type Slot = { id: string; lane_id: string; time_slot_id: string; capacity_override: number | null };
type Att = { schedule_slot_id: string | null };

const DOW_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function CapacityPage() {
  const { lang, t } = useI18n();
  const isAr = lang === "ar";
  const { currentBranchId } = useSession();
  const qc = useQueryClient();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<number>(0);

  const lanesQ = useQuery({
    queryKey: ["cap-lanes", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async (): Promise<Lane[]> => {
      const { data, error } = await supabase.from("ac_lanes").select("id, lane_number, name, default_capacity")
        .eq("branch_id", currentBranchId!).eq("status", "active").order("lane_number");
      if (error) throw error; return (data ?? []) as any;
    },
  });

  const tsQ = useQuery({
    queryKey: ["cap-ts", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async (): Promise<TS[]> => {
      const { data, error } = await supabase.from("ac_time_slots").select("id, label, day_of_week, start_time, end_time, active")
        .eq("branch_id", currentBranchId!).eq("active", true).order("day_of_week").order("start_time");
      if (error) throw error; return (data ?? []) as any;
    },
  });

  const slotsQ = useQuery({
    queryKey: ["cap-slots", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async (): Promise<Slot[]> => {
      const { data, error } = await supabase.from("ac_schedule_slots").select("id, lane_id, time_slot_id, capacity_override")
        .eq("branch_id", currentBranchId!).eq("active", true);
      if (error) throw error; return (data ?? []) as any;
    },
  });

  const attQ = useQuery({
    queryKey: ["cap-att", currentBranchId, date],
    enabled: !!currentBranchId,
    queryFn: async (): Promise<Att[]> => {
      const start = `${date}T00:00:00`, end = `${date}T23:59:59`;
      const { data, error } = await supabase.from("ac_attendance").select("schedule_slot_id")
        .eq("branch_id", currentBranchId!).gte("check_in_at", start).lte("check_in_at", end);
      if (error) throw error; return (data ?? []) as any;
    },
  });

  const lanes = lanesQ.data ?? [];
  const timeslots = tsQ.data ?? [];
  const slots = slotsQ.data ?? [];
  const attRows = attQ.data ?? [];

  // dayOfWeek of selected date
  const selectedDow = new Date(date + "T00:00:00").getDay();
  const dayTimeSlots = timeslots.filter(ts => ts.day_of_week === selectedDow);

  const occBySlot = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of attRows) { if (a.schedule_slot_id) m[a.schedule_slot_id] = (m[a.schedule_slot_id] ?? 0) + 1; }
    return m;
  }, [attRows]);

  const slotFor = (laneId: string, tsId: string) => slots.find(s => s.lane_id === laneId && s.time_slot_id === tsId);

  // Warnings: slots at or near capacity for the selected day
  const warnings = useMemo(() => {
    const out: { slotId: string; lane: number; label: string; count: number; cap: number; full: boolean }[] = [];
    for (const l of lanes) {
      for (const ts of dayTimeSlots) {
        const slot = slotFor(l.id, ts.id);
        if (!slot) continue;
        const cap = slot.capacity_override ?? l.default_capacity;
        const count = occBySlot[slot.id] ?? 0;
        if (count >= cap) out.push({ slotId: slot.id, lane: l.lane_number, label: ts.label, count, cap, full: true });
        else if (cap - count <= 2) out.push({ slotId: slot.id, lane: l.lane_number, label: ts.label, count, cap, full: false });
      }
    }
    return out.sort((a, b) => Number(b.full) - Number(a.full));
  }, [lanes, dayTimeSlots, slots, occBySlot]);


  const capacityM = useMutation({
    mutationFn: async ({ slotId, value }: { slotId: string; value: number | null }) => {
      const { error } = await supabase.from("ac_schedule_slots").update({ capacity_override: value }).eq("id", slotId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cap-slots"] }); toast.success(isAr ? "تم تحديث السعة" : "Capacity updated"); setEditing(null); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <PoolsConfigSubNav />
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-teal/15 p-2.5 ring-1 ring-teal/30"><Grid3x3 className="h-5 w-5 text-cyan-glow" /></div>

        <div className="flex-1">
          <h2 className="text-xl font-bold">{t("pg.capacity.h")}</h2>
          <p className="text-xs text-muted-foreground">{isAr ? "الإشغال الحالي مستمد تلقائياً من سجلات الحضور لكل جدول." : "Live occupancy derived from attendance per schedule slot."}</p>
        </div>
        <div className="flex items-center gap-1">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-[170px] bg-background/30" />
        </div>
      </div>

      {warnings.length > 0 && (
        <Card className={"glass p-4 border " + (warnings.some(w => w.full) ? "border-destructive/50 bg-destructive/10" : "border-warn/40 bg-warn/10")}>
          <div className="flex items-start gap-3">
            <AlertOctagon className={"h-5 w-5 mt-0.5 " + (warnings.some(w => w.full) ? "text-destructive" : "text-warn")} />
            <div className="flex-1">
              <div className="text-sm font-semibold mb-1">
                {warnings.some(w => w.full)
                  ? (isAr ? "⚠️ بعض الحارات وصلت إلى السعة القصوى" : "⚠️ Some lanes have reached full capacity")
                  : (isAr ? "تنبيه: حارات تقترب من الامتلاء" : "Heads up: lanes nearing capacity")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {warnings.map(w => (
                  <span key={w.slotId} className={"rounded-md border px-2 py-0.5 text-xs " + (w.full ? "border-destructive/60 bg-destructive/20 text-destructive-foreground" : "border-warn/50 bg-warn/15 text-warn")}>
                    {isAr ? `حارة ${w.lane}` : `Lane ${w.lane}`} · {w.label} · {w.count}/{w.cap}
                    {w.full ? (isAr ? " · ممتلئة" : " · FULL") : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="glass p-5">

        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold flex items-center gap-2">
            <Waves className="h-4 w-4 text-cyan-glow" /> {(isAr ? DOW_AR : DOW_EN)[selectedDow]} · {date}
          </div>
          <div className="text-xs text-muted-foreground">
            {attRows.length} {isAr ? "حضور مسجل" : "check-ins recorded"}
          </div>
        </div>

        {dayTimeSlots.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">{isAr ? "لا توجد فترات زمنية لهذا اليوم." : "No time slots configured for this day."}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="sticky left-0 z-10 bg-card/80 px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground">{isAr ? "الحارة" : "Lane"}</th>
                  {dayTimeSlots.map(ts => (
                    <th key={ts.id} className="px-2 py-2 text-center text-xs uppercase tracking-wider text-muted-foreground min-w-[110px]">{ts.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lanes.map(l => (
                  <tr key={l.id} className="border-b border-border/30">
                    <td className="sticky left-0 z-10 bg-card/60 px-3 py-2 font-medium whitespace-nowrap">
                      {isAr ? `حارة ${l.lane_number}` : `Lane ${l.lane_number}`}
                      {l.name && <span className="ms-1 text-xs text-muted-foreground">· {l.name}</span>}
                    </td>
                    {dayTimeSlots.map(ts => {
                      const slot = slotFor(l.id, ts.id);
                      if (!slot) {
                        return <td key={ts.id} className="px-1 py-1.5 text-center">
                          <div className="rounded-lg border border-dashed border-border/40 px-2 py-3 text-[10px] text-muted-foreground/60">—</div>
                        </td>;
                      }
                      const cap = slot.capacity_override ?? l.default_capacity;
                      const count = occBySlot[slot.id] ?? 0;
                      const left = cap - count;
                      const full = left <= 0;
                      const tight = left > 0 && left <= 2;
                      const pct = Math.min(100, (count / Math.max(1, cap)) * 100);
                      const isEditing = editing === slot.id;
                      return (
                        <td key={ts.id} className="px-1 py-1.5 text-center">
                          <div className={
                            "relative rounded-lg border p-2 transition-all " +
                            (full ? "border-destructive/60 bg-destructive/15"
                              : tight ? "border-warn/50 bg-warn/10"
                                : "border-mint/40 bg-mint/10")
                          }>
                            <div className="flex items-center justify-between">
                              <div className="text-base font-bold tabular-nums">
                                {count}<span className="text-xs text-muted-foreground">/{cap}</span>
                                {slot.capacity_override != null && <span className="text-[8px] text-cyan-glow ms-0.5">★</span>}
                              </div>
                              {!isEditing && (
                                <button onClick={() => { setEditing(slot.id); setDraft(cap); }} className="text-muted-foreground hover:text-cyan-glow">
                                  <Pencil className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            {isEditing && (
                              <div className="mt-1 flex items-center justify-center gap-1">
                                <Input autoFocus type="number" min={1} max={50} value={draft}
                                  onChange={e => setDraft(Number(e.target.value))}
                                  onKeyDown={e => { if (e.key === "Enter") capacityM.mutate({ slotId: slot.id, value: draft }); }}
                                  className="h-6 w-12 text-center text-xs bg-background/50" />
                                <Button size="icon" variant="ghost" className="h-5 w-5"
                                  onClick={() => capacityM.mutate({ slotId: slot.id, value: draft })}>
                                  <Check className="h-3 w-3 text-mint" />
                                </Button>
                              </div>
                            )}
                            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider">
                              {full ? <span className="text-destructive-foreground flex items-center justify-center gap-1"><TriangleAlert className="h-3 w-3" /> {isAr ? "ممتلئ" : "Full"}</span>
                                : tight ? <span className="text-warn">{left} {isAr ? "متبقي" : "left"}</span>
                                  : <span className="text-mint">{left} {isAr ? "متاح" : "open"}</span>}
                            </div>
                            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-background/40">
                              <div className={"h-full transition-all " + (full ? "bg-destructive" : tight ? "bg-warn" : "bg-gradient-to-r from-mint to-cyan-glow")} style={{ width: pct + "%" }} />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {lanes.length === 0 && (
                  <tr><td colSpan={dayTimeSlots.length + 1} className="p-6 text-center text-sm text-muted-foreground">{isAr ? "لا توجد حارات في هذا الفرع." : "No lanes in this branch."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AuditLogPanel tables={["schedule_slots"]} />
    </div>
  );
}
