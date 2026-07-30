import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { GitCompare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { listRows } from "@/lib/academy-crud.functions";
import { getMyAcademyContext } from "@/lib/academy.functions";

export const Route = createFileRoute("/_authenticated/admin/academy/branch-reports")({
  component: BranchReportsPage,
});

function BranchReportsPage() {
  const list = useServerFn(listRows);
  const ctx = useServerFn(getMyAcademyContext);
  const { data: academy } = useQuery({ queryKey: ["academy-ctx-br"], queryFn: () => ctx() });
  const branches = academy?.branches ?? [];

  const { data: allClients } = useQuery({
    queryKey: ["all-clients"],
    queryFn: () => list({ data: { table: "clients", limit: 5000 } }),
  });
  const { data: allPayments } = useQuery({
    queryKey: ["all-payments"],
    queryFn: () => list({ data: { table: "payments", limit: 5000 } }),
  });

  const clients = (allClients as { branch_id: string; active: boolean }[] | undefined) ?? [];
  const payments = (allPayments as { branch_id: string; amount: number }[] | undefined) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <GitCompare className="h-6 w-6 text-primary" /> مقارنة الفروع
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Super Admin — مقارنة KPIs بين الفروع</p>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs font-black">
            <tr>
              <th className="px-3 py-2.5 text-right">الفرع</th>
              <th className="px-3 py-2.5 text-right">متدربين نشطين</th>
              <th className="px-3 py-2.5 text-right">إجمالي المتدربين</th>
              <th className="px-3 py-2.5 text-right">إيرادات</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => {
              const bc = clients.filter((c) => c.branch_id === b.id);
              const bp = payments.filter((p) => p.branch_id === b.id);
              return (
                <tr key={b.id} className="border-t">
                  <td className="px-3 py-2 font-black">{b.name_ar || b.name}</td>
                  <td className="px-3 py-2">{bc.filter((c) => c.active).length}</td>
                  <td className="px-3 py-2">{bc.length}</td>
                  <td className="px-3 py-2 font-black text-emerald-600">
                    {bp.reduce((s, p) => s + Number(p.amount || 0), 0).toLocaleString()}
                  </td>
                </tr>
              );
            })}
            {branches.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">مافيش فروع</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
