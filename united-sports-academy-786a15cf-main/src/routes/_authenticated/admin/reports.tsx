import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, TrendingUp, Users, MapPin, Flame } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";
import { ENROLLMENT_TREND } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: ReportsPage,
});

const FUNNEL = [
  { stage: "Visitors",   value: 12400 },
  { stage: "Applicants", value: 3120 },
  { stage: "Enrolled",   value: 1240 },
  { stage: "Paid",       value: 980 },
];
const SEASONAL = [
  { season: "Summer", revenue: 320000, signups: 620 },
  { season: "Autumn", revenue: 280000, signups: 540 },
  { season: "Winter", revenue: 240000, signups: 480 },
  { season: "Spring", revenue: 265000, signups: 510 },
];
const BRANCH = [
  { branch: "Main HQ",     registrations: 420, revenue: 210000 },
  { branch: "West City",   registrations: 310, revenue: 160000 },
  { branch: "Coastal",     registrations: 380, revenue: 195000 },
  { branch: "East Hub",    registrations: 260, revenue: 130000 },
];
const SPORT_POP = [
  { name: "Swim", value: 42 },
  { name: "Basketball", value: 22 },
  { name: "Fitness", value: 18 },
  { name: "Karate", value: 10 },
  { name: "Volleyball", value: 8 },
];
const JOBS = [
  { role: "Coach", value: 34 },
  { role: "Admin", value: 12 },
  { role: "Medic", value: 8 },
  { role: "Volunteer", value: 46 },
];
const RANGES = ["اليوم", "٧ أيام", "هذا الشهر", "الربع الموسمي", "مخصص"];
const COLORS = ["oklch(0.85 0.17 210)", "oklch(0.78 0.19 55)", "oklch(0.65 0.26 15)", "oklch(0.82 0.2 150)", "oklch(0.6 0.2 300)"];

function exportCsv(name: string, rows: any[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(","), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${name}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast.success("تم تنزيل الملف");
}

function ReportsPage() {
  const [range, setRange] = useState("هذا الشهر");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">التقارير والتحليلات</h1>
          <p className="text-sm text-muted-foreground">مؤشرات الأداء الرئيسية عبر الفروع والمواسم</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map(r => (
            <Button key={r} size="sm" variant={range === r ? "default" : "outline"} onClick={() => setRange(r)}>{r}</Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "زيارات الموقع", value: "12.4K", icon: TrendingUp, delta: "+18%" },
          { label: "تسجيلات جديدة", value: "1,240",  icon: Users,     delta: "+9%"  },
          { label: "الإيرادات",     value: "$1.1M", icon: BarChart3, delta: "+12%" },
          { label: "الفرع الأعلى",  value: "Main HQ", icon: MapPin, delta: "420 reg" },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-primary" />
                <Badge variant="secondary" className="text-[10px]">{k.delta}</Badge>
              </div>
              <div className="mt-3 text-2xl font-black">{k.value}</div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-black">قمع التسجيل والتحويل</h2>
          <Button size="sm" variant="outline" onClick={() => exportCsv("funnel", FUNNEL)}><Download className="ml-2 h-3.5 w-3.5" /> CSV</Button>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={FUNNEL} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" stroke="var(--muted-foreground)" />
            <YAxis type="category" dataKey="stage" stroke="var(--muted-foreground)" />
            <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
            <Bar dataKey="value" fill="var(--primary)" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-black">مقارنة النمو الموسمي</h2>
            <Button size="sm" variant="outline" onClick={() => exportCsv("seasonal", SEASONAL)}><Download className="ml-2 h-3.5 w-3.5" /> CSV</Button>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={SEASONAL}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="season" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Legend />
              <Bar dataKey="revenue" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="signups" fill="oklch(0.78 0.19 55)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-black">أداء الفروع</h2>
            <Button size="sm" variant="outline" onClick={() => exportCsv("branches", BRANCH)}><Download className="ml-2 h-3.5 w-3.5" /> CSV</Button>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={BRANCH}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="branch" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Bar dataKey="registrations" fill="oklch(0.82 0.2 150)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-black flex items-center gap-2"><Flame className="h-4 w-4 text-primary" /> الرياضات الأكثر طلباً</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={SPORT_POP} dataKey="value" nameKey="name" outerRadius={90} label>
                {SPORT_POP.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-black">قمع التوظيف والتطوع</h2>
            <Button size="sm" variant="outline" onClick={() => exportCsv("jobs", JOBS)}><Download className="ml-2 h-3.5 w-3.5" /> CSV</Button>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={JOBS}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="role" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Bar dataKey="value" fill="oklch(0.65 0.26 15)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-black">اتجاه التسجيل — حسب الرياضة</h2>
          <Button size="sm" variant="outline" onClick={() => exportCsv("trend", [...ENROLLMENT_TREND])}><Download className="ml-2 h-3.5 w-3.5" /> CSV</Button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={[...ENROLLMENT_TREND]}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
            <Legend />
            <Area type="monotone" dataKey="swim" stackId="1" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.5} />
            <Area type="monotone" dataKey="basketball" stackId="1" stroke="oklch(0.78 0.19 55)" fill="oklch(0.78 0.19 55)" fillOpacity={0.5} />
            <Area type="monotone" dataKey="volleyball" stackId="1" stroke="oklch(0.65 0.26 15)" fill="oklch(0.65 0.26 15)" fillOpacity={0.5} />
            <Area type="monotone" dataKey="karate" stackId="1" stroke="oklch(0.6 0.2 300)" fill="oklch(0.6 0.2 300)" fillOpacity={0.5} />
            <Area type="monotone" dataKey="fitness" stackId="1" stroke="oklch(0.82 0.2 150)" fill="oklch(0.82 0.2 150)" fillOpacity={0.5} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
