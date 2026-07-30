import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { TrendingUp, Users, Wallet, ClipboardCheck, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useBranch } from "@/lib/branch-context";
import { BranchGuard } from "@/components/academy/BranchGuard";
import { listRows } from "@/lib/academy-crud.functions";

export const Route = createFileRoute("/_authenticated/admin/academy/analytics")({
  component: () => (
    <BranchGuard>
      <AnalyticsPage />
    </BranchGuard>
  ),
});

function AnalyticsPage() {
  const { currentBranchId } = useBranch();
  const list = useServerFn(listRows);
  const q = (t: string) => ({
    queryKey: ["a", t, currentBranchId] as const,
    queryFn: () => list({ data: { table: t, branch_id: currentBranchId, limit: 1000 } }),
    enabled: !!currentBranchId,
  });
  const clients = useQuery(q("clients")).data as { active: boolean }[] | undefined;
  const subs = useQuery(q("subscriptions")).data as { status: string; price: number }[] | undefined;
  const attendance = useQuery(q("attendance")).data as unknown[] | undefined;
  const coaches = useQuery(q("coaches")).data as { active: boolean }[] | undefined;
  const payments = useQuery(q("payments")).data as { amount: number }[] | undefined;

  const activeClients = (clients ?? []).filter((c) => c.active).length;
  const activeSubs = (subs ?? []).filter((s) => s.status === "active").length;
  const revenue = (payments ?? []).reduce((s, p) => s + Number(p.amount || 0), 0);
  const attCount = (attendance ?? []).length;
  const coachCount = (coaches ?? []).filter((c) => c.active).length;

  const kpis = [
    { label: "متدربين نشطين", value: activeClients, icon: Users, color: "text-primary bg-primary/10" },
    { label: "اشتراكات نشطة", value: activeSubs, icon: TrendingUp, color: "text-emerald-500 bg-emerald-500/10" },
    { label: "الإيرادات", value: revenue.toLocaleString(), icon: Wallet, color: "text-amber-500 bg-amber-500/10" },
    { label: "سجلات حضور", value: attCount, icon: ClipboardCheck, color: "text-blue-500 bg-blue-500/10" },
    { label: "مدربين نشطين", value: coachCount, icon: Award, color: "text-purple-500 bg-purple-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <TrendingUp className="h-6 w-6 text-primary" /> التحليلات (Analytics)
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">مؤشرات الأداء الرئيسية للفرع النشط</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${k.color}`}>
              <k.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-black">{k.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{k.label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
