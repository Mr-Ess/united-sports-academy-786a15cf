import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { Users, Wallet, CalendarCheck, TrendingUp, FileText, FileDown } from "lucide-react";
import { exportCSV, exportPDF } from "@/lib/legends/export-utils";

export const Route = createFileRoute("/_authenticated/admin/academy/analytics")({
  head: () => ({ meta: [{ title: "Analytics · United Sports Academy" }] }),
  component: AnalyticsPage,
});

const COLORS = ["#41C9E2", "#008DDA", "#22d3a5", "#f59e0b", "#ef4444", "#a78bfa"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07..22
const DOW_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function AnalyticsPage() {
  const { lang, t } = useI18n();
  const isAr = lang === "ar";
  const { currentBranchId } = useSession();

  const monthStart = useMemo(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
  }, []);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);

  const traineesQ = useQuery({
    queryKey: ["an-trainees", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { count } = await supabase.from("ac_trainees").select("id", { count: "exact", head: true })
        .eq("branch_id", currentBranchId!).eq("active", true);
      return count ?? 0;
    },
  });

  const txQ = useQuery({
    queryKey: ["an-tx", currentBranchId, from, to],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_transactions")
        .select("id, amount, kind, payment_method, tx_date")
        .eq("branch_id", currentBranchId!)
        .gte("tx_date", from).lte("tx_date", to);
      if (error) throw error;
      return data ?? [];
    },
  });

  const attQ = useQuery({
    queryKey: ["an-att", currentBranchId, from, to],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_attendance")
        .select("id, check_in_at, status")
        .eq("branch_id", currentBranchId!)
        .gte("check_in_at", `${from}T00:00:00`).lte("check_in_at", `${to}T23:59:59`);
      if (error) throw error;
      return data ?? [];
    },
  });

  const subsQ = useQuery({
    queryKey: ["an-subs", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_subscriptions")
        .select("id, status, price, paid_amount, start_date, end_date")
        .eq("branch_id", currentBranchId!).is("deleted_at", null);
      if (error) throw error;
      return data ?? [];
    },
  });

  const tx = txQ.data ?? [];
  const att = attQ.data ?? [];
  const subs = subsQ.data ?? [];

  const revenueIn = tx.filter((r: any) => r.kind === "income" || r.kind === "payment_in" || r.amount > 0);
  const totalRevenue = revenueIn.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

  const methodMap = new Map<string, number>();
  for (const r of revenueIn) {
    const m = (r.payment_method || "other").toLowerCase();
    methodMap.set(m, (methodMap.get(m) ?? 0) + Number(r.amount || 0));
  }
  const methodData = Array.from(methodMap.entries()).map(([k, v]) => ({
    name: k === "cash" ? (isAr ? "كاش" : "Cash")
      : k === "instapay" ? "InstaPay"
      : k === "wallet" ? (isAr ? "محفظة" : "Wallet")
      : k === "card" ? (isAr ? "بطاقة" : "Card")
      : k === "transfer" ? (isAr ? "تحويل" : "Transfer")
      : k,
    value: Math.round(v),
  }));

  const dayMap = new Map<string, number>();
  for (const r of revenueIn) {
    const d = String(r.tx_date).slice(0, 10);
    dayMap.set(d, (dayMap.get(d) ?? 0) + Number(r.amount || 0));
  }
  const dailyRevenue = Array.from(dayMap.entries()).sort().map(([d, v]) => ({ d, v: Math.round(v) }));

  // Attendance by Day-of-Week × Hour
  const hourMap = new Map<number, number>();
  const dowMap = new Map<number, number>();
  for (const a of att) {
    const dt = new Date(a.check_in_at);
    const h = dt.getHours();
    const dw = dt.getDay();
    hourMap.set(h, (hourMap.get(h) ?? 0) + 1);
    dowMap.set(dw, (dowMap.get(dw) ?? 0) + 1);
  }
  const hourData = HOURS.map(h => ({ h: `${h}:00`, count: hourMap.get(h) ?? 0 }));
  const dowData = (isAr ? DOW_AR : DOW_EN).map((label, i) => ({ d: label, count: dowMap.get(i) ?? 0 }));

  const activeSubs = subs.filter((s: any) => s.status === "active").length;
  const dueSubs = subs.filter((s: any) => Number(s.paid_amount || 0) < Number(s.price || 0)).length;

  const totalAtt = att.length;
  const avgPerDay = dailyRevenue.length ? Math.round(totalRevenue / Math.max(1, dailyRevenue.length)) : 0;

  const doExport = (kind: "csv" | "pdf") => {
    const fname = `analytics_${from}_${to}`;
    const sections = [
      {
        heading: isAr ? "الإيراد حسب طريقة الدفع" : "Revenue by Payment Method",
        rows: methodData.map(m => ({ [isAr ? "الطريقة" : "Method"]: m.name, [isAr ? "المبلغ" : "Amount"]: m.value })),
      },
      {
        heading: isAr ? "الحضور حسب اليوم" : "Attendance by Day",
        rows: dowData.map(d => ({ [isAr ? "اليوم" : "Day"]: d.d, [isAr ? "العدد" : "Count"]: d.count })),
      },
      {
        heading: isAr ? "الحضور حسب الساعة" : "Attendance by Hour",
        rows: hourData.map(h => ({ [isAr ? "الساعة" : "Hour"]: h.h, [isAr ? "العدد" : "Count"]: h.count })),
      },
    ];
    if (kind === "csv") {
      for (const s of sections) exportCSV(s.rows, `${fname}_${s.heading.replace(/\s+/g, "_")}`);
    } else {
      exportPDF({
        title: isAr ? "تقرير التحليلات" : "Analytics Report",
        subtitle: `${from} → ${to}`,
        sections, filename: fname,
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-xl bg-teal/15 p-2.5 ring-1 ring-teal/30"><TrendingUp className="h-5 w-5 text-cyan-glow" /></div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{isAr ? "تقارير وتحليلات" : "Analytics & KPIs"}</h2>
          <p className="text-xs text-muted-foreground">{isAr ? "مؤشرات الأداء والمخططات التفاعلية للفرع الحالي" : "Performance indicators and interactive charts for the current branch"}</p>
        </div>
        <div className="flex items-end gap-2">
          <div><Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "من" : "From"}</Label>
            <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="bg-background/30 h-9" /></div>
          <div><Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "إلى" : "To"}</Label>
            <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="bg-background/30 h-9" /></div>
          <Button variant="outline" onClick={() => doExport("csv")} className="border-teal/40 h-9"><FileText className="h-4 w-4" /> CSV</Button>
          <Button variant="outline" onClick={() => doExport("pdf")} className="border-mint/40 h-9"><FileDown className="h-4 w-4" /> PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard icon={<Users className="h-4 w-4" />} label={isAr ? "السباحون النشطون" : "Active Trainees"} value={traineesQ.data ?? 0} accent="from-teal/30 to-cyan-glow/20" />
        <KpiCard icon={<Wallet className="h-4 w-4" />} label={isAr ? "إيراد الفترة" : "Period Revenue"} value={`${totalRevenue.toLocaleString()} EGP`} accent="from-mint/30 to-emerald-500/10" />
        <KpiCard icon={<CalendarCheck className="h-4 w-4" />} label={isAr ? "إجمالي الحضور" : "Total Check-ins"} value={totalAtt} accent="from-cyan-glow/30 to-teal/20" />
        <KpiCard icon={<TrendingUp className="h-4 w-4" />} label={isAr ? "اشتراكات نشطة / مستحقة" : "Active / Due Subs"} value={`${activeSubs} / ${dueSubs}`} accent="from-warn/30 to-amber-500/10" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="glass p-4">
          <div className="mb-3 text-sm font-semibold">{isAr ? "الإيراد حسب طريقة الدفع" : "Revenue by Payment Method"}</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={methodData} dataKey="value" nameKey="name" outerRadius={90} label>
                {methodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0B192C", border: "1px solid #134e5e" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass p-4">
          <div className="mb-3 text-sm font-semibold">{isAr ? "الإيراد اليومي" : "Daily Revenue"}</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="d" stroke="#7BA0BD" fontSize={10} />
              <YAxis stroke="#7BA0BD" fontSize={10} />
              <Tooltip contentStyle={{ background: "#0B192C", border: "1px solid #134e5e" }} />
              <Line type="monotone" dataKey="v" stroke="#41C9E2" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 text-xs text-muted-foreground">{isAr ? "متوسط يومي:" : "Daily avg:"} <span className="text-foreground font-semibold">{avgPerDay.toLocaleString()} EGP</span></div>
        </Card>

        <Card className="glass p-4">
          <div className="mb-3 text-sm font-semibold">{isAr ? "الحضور حسب اليوم" : "Attendance by Day of Week"}</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="d" stroke="#7BA0BD" fontSize={11} />
              <YAxis stroke="#7BA0BD" fontSize={10} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0B192C", border: "1px solid #134e5e" }} />
              <Bar dataKey="count" fill="#008DDA" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass p-4">
          <div className="mb-3 text-sm font-semibold">{isAr ? "الحضور حسب الساعة" : "Attendance by Hour"}</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hourData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="h" stroke="#7BA0BD" fontSize={10} />
              <YAxis stroke="#7BA0BD" fontSize={10} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0B192C", border: "1px solid #134e5e" }} />
              <Bar dataKey="count" fill="#41C9E2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent: string }) {
  return (
    <Card className={`glass relative overflow-hidden p-4`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-40 pointer-events-none`} />
      <div className="relative">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
        <div className="mt-2 text-2xl font-bold">{value}</div>
      </div>
    </Card>
  );
}
