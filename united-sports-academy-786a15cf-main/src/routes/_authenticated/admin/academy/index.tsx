import { createFileRoute } from "@tanstack/react-router";
import { useAcademy, CATEGORIES, PAYMENT_METHODS, TIME_SLOTS } from "@/lib/legends/academy-store";
import { Card } from "@/components/ui/card";
import { Users, Waves, DollarSign, AlertCircle, Activity, Sparkles, Database, CreditCard, Package, Wrench, Wifi, WifiOff, Loader2, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/legends/i18n";

export const Route = createFileRoute("/_authenticated/admin/academy/")({
  head: () => ({ meta: [{ title: "Dashboard · United Sports Academy" }] }),
  component: Dashboard,
});

function StatCard({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: string; sub?: string; accent?: string }) {
  return (
    <Card className="glass relative overflow-hidden p-5">
      <div className={"absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-50 " + (accent ?? "bg-teal/30")} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-bold text-foreground tabular-nums">{value}</div>
          {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
        </div>
        <div className="rounded-lg bg-teal/15 p-2.5 ring-1 ring-teal/30">
          <Icon className="h-5 w-5 text-cyan-glow" />
        </div>
      </div>
    </Card>
  );
}

function Dashboard() {
  const { t } = useI18n();
  const { receipts, leads } = useAcademy();
  const active = receipts.filter(r => r.sessionsUsed < r.totalSessions);
  const expired = receipts.length - active.length;

  const byMethod = PAYMENT_METHODS.map(m => ({
    method: m,
    total: receipts.filter(r => r.paymentMethod === m).reduce((s, r) => s + r.amountPaid, 0),
  }));
  const totalRev = byMethod.reduce((s, x) => s + x.total, 0);
  const pendingLeads = leads.filter(l => l.status === "Pending Follow-up" || l.status === "Interested").length;

  const slotCounts = TIME_SLOTS.map(ts => ({
    slot: ts.replace(":00 ", ""),
    count: active.filter(r => r.timeSlot === ts).length,
  }));
  const peak = [...slotCounts].sort((a, b) => b.count - a.count)[0];

  const catData = CATEGORIES.map((c, i) => ({
    name: c,
    value: active.filter(r => r.category === c).length,
    color: ["oklch(0.72 0.15 215)", "oklch(0.82 0.18 165)", "oklch(0.65 0.18 195)", "oklch(0.55 0.18 250)"][i],
  })).filter(x => x.value > 0);

  // mock 7-day trend
  const trend = Array.from({ length: 7 }).map((_, i) => ({
    day: ["Sat","Sun","Mon","Tue","Wed","Thu","Fri"][i],
    revenue: Math.round(totalRev * (0.1 + Math.random() * 0.2)),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            <span className="text-gradient-aqua">{t("pg.dashboard.h")}</span>
          </h2>
          <p className="text-sm text-muted-foreground">{t("pg.dashboard.s")}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-cyan-glow" /> {t("c.live")}
        </div>
      </div>

      <LiveBackendOverview />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Active Swimmers" value={String(active.length)} sub={`${expired} expired`} />
        <StatCard icon={DollarSign} label="Monthly Revenue" value={`EGP ${totalRev.toLocaleString()}`} sub={byMethod.map(b => `${b.method}: ${b.total.toLocaleString()}`).join(" · ")} accent="bg-mint/30" />
        <StatCard icon={AlertCircle} label="Pending Leads" value={String(pendingLeads)} sub={`${leads.length} total`} accent="bg-warn/30" />
        <StatCard icon={Activity} label="Peak Hour" value={peak?.slot ?? "—"} sub={peak ? `${peak.count} swimmers` : ""} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="glass p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Weekly Revenue Trend</div>
              <div className="text-xs text-muted-foreground">Smoothed teal gradient</div>
            </div>
            <Waves className="h-4 w-4 text-cyan-glow" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="oklch(0.72 0.15 215)" />
                  <stop offset="100%" stopColor="oklch(0.82 0.18 165)" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(1 0 0 / 0.06)" />
              <XAxis dataKey="day" stroke="oklch(0.72 0.04 220)" fontSize={12} />
              <YAxis stroke="oklch(0.72 0.04 220)" fontSize={12} />
              <Tooltip contentStyle={{ background: "oklch(0.22 0.05 240)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="revenue" stroke="url(#g1)" strokeWidth={3} dot={{ r: 4, fill: "oklch(0.82 0.18 210)" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass p-5">
          <div className="mb-4 text-sm font-semibold">Category Distribution</div>
          {catData.length === 0 ? (
            <div className="grid h-[240px] place-items-center text-sm text-muted-foreground">No active swimmers</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={catData} dataKey="value" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {catData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.22 0.05 240)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
            {catData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="ml-auto font-semibold tabular-nums">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="glass p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold">Pool Hour Occupancy</div>
          <div className="text-xs text-muted-foreground">Active swimmers per slot</div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={slotCounts}>
            <defs>
              <linearGradient id="bar1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.82 0.18 210)" />
                <stop offset="100%" stopColor="oklch(0.5 0.15 215)" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
            <XAxis dataKey="slot" stroke="oklch(0.72 0.04 220)" fontSize={11} />
            <YAxis stroke="oklch(0.72 0.04 220)" fontSize={11} />
            <Tooltip contentStyle={{ background: "oklch(0.22 0.05 240)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
            <Bar dataKey="count" fill="url(#bar1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function LiveStat({ icon: Icon, label, value, sub, tone }: { icon: any; label: string; value: string | number; sub?: string; tone?: string }) {
  return (
    <Card className="glass p-4 flex items-center gap-3">
      <div className={"rounded-lg p-2.5 ring-1 " + (tone ?? "bg-teal/15 ring-teal/30 text-cyan-glow")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-xl font-bold tabular-nums">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground truncate">{sub}</div>}
      </div>
    </Card>
  );
}

function LiveBackendOverview() {
  const { currentBranchId } = useSession();
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["dashboard-live", currentBranchId],
    enabled: !!currentBranchId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      const [trainees, subs, expiring, items, tickets, txIn, txOut, notifs] = await Promise.all([
        supabase.from("ac_trainees").select("id", { count: "exact", head: true }).eq("branch_id", currentBranchId!).eq("active", true),
        supabase.from("ac_subscriptions").select("id", { count: "exact", head: true }).eq("branch_id", currentBranchId!).eq("status", "active"),
        supabase.from("ac_subscriptions").select("id", { count: "exact", head: true }).eq("branch_id", currentBranchId!).eq("status", "active").gte("end_date", today).lte("end_date", in7),
        supabase.from("ac_inventory_items").select("id, quantity, min_quantity").eq("branch_id", currentBranchId!),
        supabase.from("ac_maintenance_tickets").select("id", { count: "exact", head: true }).eq("branch_id", currentBranchId!).in("status", ["open", "in_progress"]),
        supabase.from("ac_transactions").select("amount").eq("branch_id", currentBranchId!).eq("kind", "income"),
        supabase.from("ac_transactions").select("amount").eq("branch_id", currentBranchId!).eq("kind", "expense"),
        supabase.from("ac_notifications").select("id", { count: "exact", head: true }).eq("branch_id", currentBranchId!).is("read_at", null),
      ]);
      const lowStock = (items.data ?? []).filter((i: any) => (i.quantity ?? 0) <= (i.min_quantity ?? 0)).length;
      const income = (txIn.data ?? []).reduce((s: number, t: any) => s + Number(t.amount ?? 0), 0);
      const expense = (txOut.data ?? []).reduce((s: number, t: any) => s + Number(t.amount ?? 0), 0);
      return {
        trainees: trainees.count ?? 0,
        activeSubs: subs.count ?? 0,
        expiring: expiring.count ?? 0,
        lowStock,
        openTickets: tickets.count ?? 0,
        net: income - expense,
        unread: notifs.count ?? 0,
      };
    },
  });

  // Realtime connection status: connecting | connected | disconnected | error
  type RTStatus = "connecting" | "connected" | "disconnected" | "error";
  const [rtStatus, setRtStatus] = useState<RTStatus>("connecting");
  const [rtError, setRtError] = useState<string | null>(null);
  const [rtAttempt, setRtAttempt] = useState(0);

  // Realtime: subscribe to all dashboard-relevant tables for this branch and
  // invalidate the query when anything changes. Tear down on unmount.
  useEffect(() => {
    if (!currentBranchId) return;
    const tables = [
      "trainees",
      "subscriptions",
      "transactions",
      "inventory_items",
      "maintenance_tickets",
      "attendance",
      "notifications",
    ] as const;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const bump = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["dashboard-live", currentBranchId] });
      }, 250);
    };
    setRtStatus("connecting");
    setRtError(null);
    const channel = supabase.channel(`dashboard-live:${currentBranchId}:${Math.random().toString(36).slice(2, 10)}`);
    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `branch_id=eq.${currentBranchId}` },
        bump,
      );
    });
    channel.subscribe((status, err) => {
      if (status === "SUBSCRIBED") {
        setRtStatus("connected");
        setRtError(null);
      } else if (status === "CHANNEL_ERROR") {
        setRtStatus("error");
        setRtError(err?.message || "Failed to subscribe to realtime channel. Check network or table publication.");
      } else if (status === "TIMED_OUT") {
        setRtStatus("error");
        setRtError("Realtime subscription timed out. The server did not respond in time.");
      } else if (status === "CLOSED") {
        setRtStatus("disconnected");
      }
    });
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [currentBranchId, queryClient, rtAttempt]);


  if (!currentBranchId) return null;
  const d = q.data;

  const statusMeta: Record<RTStatus, { label: string; cls: string; Icon: any; dot: string }> = {
    connecting: { label: "Connecting…", cls: "bg-amber-500/15 ring-amber-500/30 text-amber-300", Icon: Loader2, dot: "bg-amber-400" },
    connected: { label: "Realtime · Connected", cls: "bg-emerald-500/15 ring-emerald-500/30 text-emerald-300", Icon: Wifi, dot: "bg-emerald-500" },
    disconnected: { label: "Disconnected", cls: "bg-muted/30 ring-muted/40 text-muted-foreground", Icon: WifiOff, dot: "bg-muted-foreground" },
    error: { label: "Subscription Failed", cls: "bg-destructive/15 ring-destructive/30 text-destructive", Icon: WifiOff, dot: "bg-destructive" },
  };
  const sm = statusMeta[rtStatus];

  return (
    <Card className="glass p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Database className="h-4 w-4 text-cyan-glow" />
        <div className="text-sm font-semibold">Live Backend Snapshot</div>
        <div className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${sm.cls}`}>
          <span className="relative flex h-2 w-2">
            {rtStatus === "connected" && (
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${sm.dot}`} />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${sm.dot}`} />
          </span>
          <sm.Icon className={`h-3 w-3 ${rtStatus === "connecting" ? "animate-spin" : ""}`} />
          {sm.label}
        </div>
        {(rtStatus === "error" || rtStatus === "disconnected") && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setRtAttempt((n) => n + 1)}>
            <RefreshCw className="h-3 w-3 mr-1" /> Retry
          </Button>
        )}
      </div>

      {rtStatus === "error" && (
        <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <div className="font-semibold mb-0.5">Realtime subscription failed</div>
          <div className="text-destructive/80">{rtError ?? "Live updates are paused. Data shown may be stale — use Retry or refresh the page."}</div>
        </div>
      )}
      {rtStatus === "disconnected" && (
        <div className="mb-3 rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Realtime channel is closed. Live updates are paused.
        </div>
      )}


      {q.isLoading || !d ? (
        <div className="text-xs text-muted-foreground">Loading live data…</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <LiveStat icon={Users} label="Trainees" value={d.trainees} />
          <LiveStat icon={CreditCard} label="Active Subs" value={d.activeSubs} />
          <LiveStat icon={AlertCircle} label="Expiring ≤7d" value={d.expiring} tone="bg-amber-500/15 ring-amber-500/30 text-amber-300" />
          <LiveStat icon={Package} label="Low Stock" value={d.lowStock} tone={d.lowStock > 0 ? "bg-destructive/15 ring-destructive/30 text-destructive" : undefined} />
          <LiveStat icon={Wrench} label="Open Tickets" value={d.openTickets} />
          <LiveStat icon={DollarSign} label="Net (EGP)" value={d.net.toLocaleString()} tone={d.net >= 0 ? "bg-emerald-500/15 ring-emerald-500/30 text-emerald-300" : "bg-destructive/15 ring-destructive/30 text-destructive"} />
          <LiveStat icon={Sparkles} label="Unread Alerts" value={d.unread} />
        </div>
      )}
    </Card>
  );
}
