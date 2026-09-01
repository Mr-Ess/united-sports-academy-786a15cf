import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BranchGuard } from "@/components/legends/BranchGuard";
import { Waves, Users, CalendarDays, UserCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/academy/pool-operations")({
  head: () => ({ meta: [{ title: "Pool Operations · United Sports Academy" }] }),
  component: PoolOps,
});

const DOW_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

type Slot = { id: string; time_slot_id: string; lane_id: string; coach_id: string | null; group_id: string | null; capacity_override: number | null };
type TS = { id: string; label: string; day_of_week: number; start_time: string };
type Lane = { id: string; lane_number: number; name: string | null; default_capacity: number };
type Coach = { id: string; full_name: string };
type Group = { id: string; name: string; color: string | null; max_capacity: number };
type Sub = { id: string; trainee_id: string; time_slot_id: string | null; lane_id: string | null; group_id: string | null; coach_id: string | null; status: string; package_name: string };
type Tr = { id: string; full_name: string; client_code: string };

function PoolOps() {
  const { currentBranchId } = useSession();
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [view, setView] = useState<"day" | "coach" | "lane">("day");

  const q = <T,>(key: string, fn: () => Promise<T>) =>
    useQuery({ queryKey: [key, currentBranchId], enabled: !!currentBranchId, queryFn: fn });

  const slotsQ = q<Slot[]>("ops-slots", async () => {
    const { data, error } = await supabase.from("ac_schedule_slots")
      .select("id,time_slot_id,lane_id,coach_id,group_id,capacity_override")
      .eq("branch_id", currentBranchId!).eq("active", true);
    if (error) throw error;
    return (data ?? []) as Slot[];
  });
  const tsQ = q<TS[]>("ops-ts", async () => {
    const { data, error } = await supabase.from("ac_time_slots")
      .select("id,label,day_of_week,start_time").eq("branch_id", currentBranchId!);
    if (error) throw error;
    return (data ?? []) as TS[];
  });
  const lanesQ = q<Lane[]>("ops-lanes", async () => {
    const { data, error } = await supabase.from("ac_lanes")
      .select("id,lane_number,name,default_capacity").eq("branch_id", currentBranchId!).order("lane_number");
    if (error) throw error;
    return (data ?? []) as Lane[];
  });
  const coachesQ = q<Coach[]>("ops-coaches", async () => {
    const { data, error } = await supabase.from("ac_employees")
      .select("id,full_name").eq("branch_id", currentBranchId!).order("full_name");
    if (error) throw error;
    return (data ?? []) as Coach[];
  });
  const groupsQ = q<Group[]>("ops-groups", async () => {
    const { data, error } = await supabase.from("ac_groups")
      .select("id,name,color,max_capacity").eq("branch_id", currentBranchId!);
    if (error) throw error;
    return (data ?? []) as Group[];
  });
  const subsQ = q<Sub[]>("ops-subs", async () => {
    const { data, error } = await supabase.from("ac_subscriptions")
      .select("id,trainee_id,time_slot_id,lane_id,group_id,coach_id,status,package_name")
      .eq("branch_id", currentBranchId!).is("deleted_at", null).eq("status", "active");
    if (error) throw error;
    return (data ?? []) as Sub[];
  });
  const trQ = q<Tr[]>("ops-trainees", async () => {
    const { data, error } = await supabase.from("ac_trainees")
      .select("id,full_name,client_code").eq("branch_id", currentBranchId!).is("deleted_at", null);
    if (error) throw error;
    return (data ?? []) as Tr[];
  });

  const timeslots = tsQ.data ?? [];
  const lanes = lanesQ.data ?? [];
  const coaches = coachesQ.data ?? [];
  const groups = groupsQ.data ?? [];
  const subs = subsQ.data ?? [];
  const trainees = trQ.data ?? [];

  const tsById = Object.fromEntries(timeslots.map(t => [t.id, t]));
  const laneById = Object.fromEntries(lanes.map(l => [l.id, l]));
  const coachById = Object.fromEntries(coaches.map(c => [c.id, c]));
  const groupById = Object.fromEntries(groups.map(g => [g.id, g]));
  const trById = Object.fromEntries(trainees.map(t => [t.id, t]));

  // Group subs by time_slot for capacity coloring
  const subsBySlot = useMemo(() => {
    const map = new Map<string, Sub[]>();
    for (const s of subs) {
      if (!s.time_slot_id) continue;
      const arr = map.get(s.time_slot_id) ?? [];
      arr.push(s); map.set(s.time_slot_id, arr);
    }
    return map;
  }, [subs]);

  const capBadge = (occ: number, cap: number) => {
    if (cap === 0) return "bg-background/40 text-muted-foreground";
    const r = occ / cap;
    if (r >= 1) return "bg-destructive/25 text-destructive border-destructive/50";
    if (r >= 0.7) return "bg-warn/25 text-warn border-warn/50";
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-teal/15 p-2.5 ring-1 ring-teal/30"><Waves className="h-5 w-5 text-cyan-glow" /></div>
        <div>
          <h2 className="text-xl font-bold">{isAr ? "لوحة تشغيل المسبح" : "Pool Operations"}</h2>
          <p className="text-xs text-muted-foreground">{isAr ? "عرض ديناميكي حسب اليوم، المدرب، أو الحارة" : "Dynamic dashboards by day, coach, or lane"}</p>
        </div>
      </div>

      <BranchGuard>
        <Tabs value={view} onValueChange={(v: any) => setView(v)}>
          <TabsList className="glass">
            <TabsTrigger value="day"><CalendarDays className="h-4 w-4 me-1.5" />{isAr ? "حسب اليوم" : "By Day"}</TabsTrigger>
            <TabsTrigger value="coach"><UserCircle2 className="h-4 w-4 me-1.5" />{isAr ? "حسب المدرب" : "By Coach"}</TabsTrigger>
            <TabsTrigger value="lane"><Users className="h-4 w-4 me-1.5" />{isAr ? "حسب الحارة" : "By Lane"}</TabsTrigger>
          </TabsList>

          {/* BY DAY */}
          <TabsContent value="day" className="mt-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
                const daySlots = timeslots.filter(t => t.day_of_week === dow).sort((a, b) => a.start_time.localeCompare(b.start_time));
                if (daySlots.length === 0) return null;
                return (
                  <Card key={dow} className="glass p-4">
                    <div className="font-bold text-cyan-glow mb-2">{(isAr ? DOW_AR : DOW_EN)[dow]}</div>
                    <div className="space-y-1.5">
                      {daySlots.map(ts => {
                        const sList = subsBySlot.get(ts.id) ?? [];
                        const cap = groups.reduce((sum, g) => sum + (sList.some(s => s.group_id === g.id) ? g.max_capacity : 0), 0)
                                    || lanes.reduce((s, l) => s + l.default_capacity, 0);
                        return (
                          <div key={ts.id} className="flex items-center justify-between rounded border border-border/40 bg-background/20 px-2 py-1.5 text-xs">
                            <span className="font-medium">{ts.label} <span className="text-muted-foreground">{ts.start_time?.slice(0, 5)}</span></span>
                            <Badge variant="outline" className={capBadge(sList.length, cap)}>{sList.length}{cap ? `/${cap}` : ""}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* BY COACH */}
          <TabsContent value="coach" className="mt-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {coaches.map(c => {
                const bookings = subs.filter(s => s.coach_id === c.id);
                if (bookings.length === 0) return null;
                return (
                  <Card key={c.id} className="glass p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold flex items-center gap-1.5"><UserCircle2 className="h-4 w-4 text-cyan-glow" />{c.full_name}</div>
                      <Badge variant="outline">{bookings.length}</Badge>
                    </div>
                    <div className="space-y-1">
                      {bookings.map(s => {
                        const ts = s.time_slot_id ? tsById[s.time_slot_id] : null;
                        const t = trById[s.trainee_id];
                        return (
                          <div key={s.id} className="text-xs flex items-center justify-between rounded bg-background/20 px-2 py-1">
                            <span>{t?.full_name ?? "—"}</span>
                            <span className="text-muted-foreground">{ts ? `${(isAr ? DOW_AR : DOW_EN)[ts.day_of_week]} · ${ts.label}` : "—"}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
              {coaches.every(c => subs.every(s => s.coach_id !== c.id)) && (
                <Card className="glass p-8 text-center text-muted-foreground text-sm md:col-span-2 xl:col-span-3">
                  {isAr ? "لا توجد تعيينات مدربين حالياً" : "No coach assignments yet"}
                </Card>
              )}
            </div>
          </TabsContent>

          {/* BY LANE */}
          <TabsContent value="lane" className="mt-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {lanes.map(l => {
                const bookings = subs.filter(s => s.lane_id === l.id);
                return (
                  <Card key={l.id} className="glass p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold flex items-center gap-1.5"><Waves className="h-4 w-4 text-cyan-glow" />{l.name ?? `Lane ${l.lane_number}`}</div>
                      <Badge variant="outline" className={capBadge(bookings.length, l.default_capacity)}>{bookings.length}/{l.default_capacity}</Badge>
                    </div>
                    <div className="space-y-1">
                      {bookings.length === 0 && <div className="text-xs text-muted-foreground italic">{isAr ? "لا يوجد" : "No bookings"}</div>}
                      {bookings.map(s => {
                        const ts = s.time_slot_id ? tsById[s.time_slot_id] : null;
                        const t = trById[s.trainee_id];
                        const co = s.coach_id ? coachById[s.coach_id] : null;
                        const g = s.group_id ? groupById[s.group_id] : null;
                        return (
                          <div key={s.id} className="text-xs rounded bg-background/20 px-2 py-1.5 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{t?.full_name ?? "—"}</span>
                              {g && <span className="h-2 w-2 rounded-full" style={{ background: g.color ?? "#41C9E2" }} />}
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>{ts ? `${(isAr ? DOW_AR : DOW_EN)[ts.day_of_week]} · ${ts.label}` : "—"}</span>
                              <span>{co?.full_name ?? ""}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </BranchGuard>
    </div>
  );
}
