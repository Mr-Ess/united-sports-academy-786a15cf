import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Waves, Droplets, AlertTriangle, Search, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/legends/PermissionGate";
import { BranchGuard } from "@/components/legends/BranchGuard";

export const Route = createFileRoute("/_authenticated/admin/academy/lane-log")({
  head: () => ({ meta: [{ title: "Pool Attendance · Lane Log · United Sports Academy" }] }),
  component: () => (
    <PermissionGate path="/lane-log">
      <BranchGuard>
        <LaneLogPage />
      </BranchGuard>
    </PermissionGate>
  ),
});

const DAY_GROUPS = ["Sat-Thu", "Sun-Tue", "Mon-Wed", "Mon-Wed Ladies", "Sat-Wed Aqua Baby"];
const TIME_SLOTS = [
  "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM",
];

type PendingAtt = { id: string; check_in_at: string };
type Row = {
  id: string; // subscription id
  studentName: string;
  dayGroup: string;
  timeSlot: string;
  level: string;
  totalSessions: number;
  sessionsUsed: number;
  pending: PendingAtt[]; // checked_in (yellow) attendances
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function LaneLogPage() {
  const { currentBranchId } = useSession();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [dayF, setDayF] = useState("all");
  const [timeF, setTimeF] = useState("all");

  const dataQ = useQuery({
    queryKey: ["lane-log", currentBranchId],
    enabled: !!currentBranchId,
    refetchInterval: 5000,
    queryFn: async () => {
      const [subsRes, trRes, slotsRes, tsRes, attRes] = await Promise.all([
        supabase
          .from("ac_subscriptions")
          .select("id,trainee_id,schedule_slot_id,package_name,package_type,total_sessions,used_sessions,status")
          .eq("branch_id", currentBranchId!)
          .is("deleted_at", null)
          .neq("status", "cancelled"),
        supabase
          .from("ac_trainees")
          .select("id,full_name,skill_level")
          .eq("branch_id", currentBranchId!)
          .is("deleted_at", null),
        supabase
          .from("ac_schedule_slots")
          .select("id,time_slot_id")
          .eq("branch_id", currentBranchId!),
        supabase
          .from("ac_time_slots")
          .select("id,label,day_of_week,start_time")
          .eq("branch_id", currentBranchId!),
        supabase
          .from("ac_attendance")
          .select("id,subscription_id,status,check_in_at")
          .eq("branch_id", currentBranchId!)
          .eq("status", "checked_in")
          .order("check_in_at", { ascending: true }),
      ]);
      if (subsRes.error) throw subsRes.error;
      if (trRes.error) throw trRes.error;
      if (slotsRes.error) throw slotsRes.error;
      if (tsRes.error) throw tsRes.error;
      if (attRes.error) throw attRes.error;

      const trMap = new Map((trRes.data ?? []).map((t: any) => [t.id, t]));
      const tsMap = new Map((tsRes.data ?? []).map((x: any) => [x.id, x]));
      const slotMap = new Map((slotsRes.data ?? []).map((s: any) => [s.id, s]));
      const pendingBySub = new Map<string, PendingAtt[]>();
      for (const a of (attRes.data ?? []) as any[]) {
        if (!a.subscription_id) continue;
        const arr = pendingBySub.get(a.subscription_id) ?? [];
        arr.push({ id: a.id, check_in_at: a.check_in_at });
        pendingBySub.set(a.subscription_id, arr);
      }
      const rows: Row[] = (subsRes.data ?? []).map((s: any) => {
        const t: any = trMap.get(s.trainee_id) ?? {};
        const slot: any = slotMap.get(s.schedule_slot_id) ?? {};
        const ts: any = tsMap.get(slot.time_slot_id) ?? {};
        return {
          id: s.id,
          studentName: t.full_name ?? "—",
          dayGroup: ts.day_of_week ?? "—",
          timeSlot: ts.label ?? ts.start_time ?? "—",
          level: t.skill_level ?? s.package_type ?? s.package_name ?? "—",
          totalSessions: Number(s.total_sessions ?? 0),
          sessionsUsed: Number(s.used_sessions ?? 0),
          pending: pendingBySub.get(s.id) ?? [],
        };
      });
      return rows;
    },
  });

  const confirmMut = useMutation({
    mutationFn: async ({ attendanceId }: { attendanceId: string }) => {
      const { error } = await supabase
        .from("ac_attendance")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("id", attendanceId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Confirmed — 1 session deducted");
      qc.invalidateQueries({ queryKey: ["lane-log", currentBranchId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to confirm"),
  });

  const unconfirmMut = useMutation({
    mutationFn: async ({ subId }: { subId: string }) => {
      // Revert most recent confirmed attendance for this subscription
      const { data, error } = await supabase
        .from("ac_attendance")
        .select("id")
        .eq("subscription_id", subId)
        .eq("status", "confirmed")
        .order("check_in_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      const target = data?.[0];
      if (!target) throw new Error("No confirmed attendance to revert");
      const { error: uerr } = await supabase
        .from("ac_attendance")
        .update({ status: "checked_in", confirmed_at: null })
        .eq("id", target.id);
      if (uerr) throw uerr;
    },
    onSuccess: () => {
      toast.success("Reverted to pending");
      qc.invalidateQueries({ queryKey: ["lane-log", currentBranchId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to revert"),
  });

  const rows = dataQ.data ?? [];
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (needle && !r.studentName.toLowerCase().includes(needle)) return false;
      if (dayF !== "all" && r.dayGroup !== dayF) return false;
      if (timeF !== "all" && r.timeSlot !== timeF) return false;
      return true;
    });
  }, [rows, q, dayF, timeF]);

  return (
    <div className="min-h-screen bg-[#0B192C] text-slate-100 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
          <Droplets className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">Pool Attendance · Lane Log</h1>
          <p className="text-sm text-slate-400">
            Yellow = checked-in awaiting confirmation. Click a yellow wave to confirm — it turns green and deducts a session.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardContent className="p-4 grid gap-3 sm:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by student name"
              className="pl-9 bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500"
            />
          </div>
          <Select value={dayF} onValueChange={setDayF}>
            <SelectTrigger className="bg-white/5 border-white/10 text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All days</SelectItem>
              {DAY_GROUPS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeF} onValueChange={setTimeF}>
            <SelectTrigger className="bg-white/5 border-white/10 text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All slots</SelectItem>
              {TIME_SLOTS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Cards grid */}
      {dataQ.isLoading ? (
        <div className="text-center text-slate-400 py-16">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-12 text-center text-slate-400">
            No swimmers match these filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <StudentCard
              key={r.id}
              row={r}
              onConfirmPending={(attId) => confirmMut.mutate({ attendanceId: attId })}
              onUnconfirm={() => unconfirmMut.mutate({ subId: r.id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StudentCard({
  row,
  onConfirmPending,
  onUnconfirm,
}: {
  row: Row;
  onConfirmPending: (attendanceId: string) => void;
  onUnconfirm: () => void;
}) {
  const confirmedCount = Math.min(row.sessionsUsed, row.totalSessions);
  const pendingCount = Math.min(row.pending.length, Math.max(0, row.totalSessions - confirmedCount));
  const left = Math.max(0, row.totalSessions - confirmedCount);
  const needsRenewal = left <= 0;

  return (
    <Card
      className={`bg-white/5 backdrop-blur-xl border-white/10 transition-all ${
        needsRenewal ? "ring-2 ring-red-500/60 shadow-[0_0_30px_-8px_rgba(239,68,68,0.5)]" : ""
      }`}
    >
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 text-white font-bold">
            {initials(row.studentName)}
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate text-slate-100">{row.studentName}</div>
            <div className="text-xs text-slate-400 truncate">
              {row.dayGroup} · {row.timeSlot} · {row.level}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
              Used: <span className="ml-1 font-bold">{confirmedCount}</span>
            </Badge>
            {pendingCount > 0 && (
              <Badge className="bg-yellow-500/15 text-yellow-300 border border-yellow-400/40">
                Pending: <span className="ml-1 font-bold">{pendingCount}</span>
              </Badge>
            )}
            <Badge
              className={`border ${
                left > 0
                  ? "bg-cyan-500/15 text-cyan-300 border-cyan-400/30"
                  : "bg-red-500/15 text-red-300 border-red-400/40"
              }`}
            >
              Left: <span className="ml-1 font-bold">{left}</span>
            </Badge>
          </div>
        </div>

        {needsRenewal && (
          <div className="flex items-center gap-2 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-red-300 text-xs animate-pulse">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-semibold">Needs Renewal</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {Array.from({ length: row.totalSessions }).map((_, i) => {
            const isConfirmed = i < confirmedCount;
            const pendingIndex = i - confirmedCount;
            const isPending = !isConfirmed && pendingIndex < pendingCount;
            const pendingAtt = isPending ? row.pending[pendingIndex] : null;

            let className =
              "border-white/10 bg-white/5 text-slate-500 hover:border-cyan-400/60";
            let title = "No attendance yet";
            let icon = <Waves className="h-4 w-4" />;

            if (isConfirmed) {
              className =
                "border-transparent bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-[0_0_14px_-2px_rgba(16,185,129,0.7)]";
              title = "Confirmed — click to revert";
              icon = <CheckCircle2 className="h-4 w-4" />;
            } else if (isPending) {
              className =
                "border-transparent bg-gradient-to-br from-yellow-300 to-amber-500 text-slate-900 shadow-[0_0_14px_-2px_rgba(234,179,8,0.8)] animate-pulse";
              title = "Checked in — click to confirm";
            }

            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (isPending && pendingAtt) onConfirmPending(pendingAtt.id);
                  else if (isConfirmed) onUnconfirm();
                }}
                disabled={!isConfirmed && !isPending}
                className={`group relative flex h-10 w-10 flex-col items-center justify-center rounded-lg border transition-all duration-150 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100 ${className}`}
                aria-label={title}
                title={title}
              >
                {icon}
                <span className="absolute -bottom-4 text-[10px] text-slate-500">{i + 1}</span>
              </button>
            );
          })}
        </div>
        <div className="h-3" />
      </CardContent>
    </Card>
  );
}
