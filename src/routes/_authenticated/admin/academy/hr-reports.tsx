import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useBranch } from "@/lib/branch-context";
import { BranchGuard } from "@/components/academy/BranchGuard";
import { listRows } from "@/lib/academy-crud.functions";

export const Route = createFileRoute("/_authenticated/admin/academy/hr-reports")({
  component: () => (
    <BranchGuard>
      <HRReportsPage />
    </BranchGuard>
  ),
});

function HRReportsPage() {
  const { currentBranchId } = useBranch();
  const list = useServerFn(listRows);
  const { data: emps } = useQuery({
    queryKey: ["hr-emps", currentBranchId],
    queryFn: () => list({ data: { table: "hr_employees", branch_id: currentBranchId } }),
    enabled: !!currentBranchId,
  });
  const { data: leaves } = useQuery({
    queryKey: ["hr-leaves", currentBranchId],
    queryFn: () => list({ data: { table: "hr_leaves", branch_id: currentBranchId } }),
    enabled: !!currentBranchId,
  });

  const employees = (emps as { active: boolean; base_salary: number }[] | undefined) ?? [];
  const leavesList = (leaves as { status: string }[] | undefined) ?? [];

  const active = employees.filter((e) => e.active).length;
  const totalSalary = employees.reduce((s, e) => s + Number(e.base_salary || 0), 0);
  const pending = leavesList.filter((l) => l.status === "pending").length;
  const approved = leavesList.filter((l) => l.status === "approved").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <UsersRound className="h-6 w-6 text-primary" /> تقارير الموظفين
        </h1>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-5"><div className="text-xs text-muted-foreground">موظفين نشطين</div><div className="text-2xl font-black">{active}</div></Card>
        <Card className="p-5"><div className="text-xs text-muted-foreground">إجمالي الرواتب</div><div className="text-2xl font-black">{totalSalary.toLocaleString()}</div></Card>
        <Card className="p-5"><div className="text-xs text-muted-foreground">إجازات قيد المراجعة</div><div className="text-2xl font-black">{pending}</div></Card>
        <Card className="p-5"><div className="text-xs text-muted-foreground">إجازات معتمدة</div><div className="text-2xl font-black">{approved}</div></Card>
      </div>
    </div>
  );
}
