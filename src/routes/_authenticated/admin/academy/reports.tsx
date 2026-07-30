import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileBarChart, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBranch } from "@/lib/branch-context";
import { BranchGuard } from "@/components/academy/BranchGuard";
import { listRows } from "@/lib/academy-crud.functions";

export const Route = createFileRoute("/_authenticated/admin/academy/reports")({
  component: () => (
    <BranchGuard>
      <ReportsPage />
    </BranchGuard>
  ),
});

function ReportsPage() {
  const { currentBranchId } = useBranch();
  const list = useServerFn(listRows);

  const tables = ["leads", "clients", "subscriptions", "invoices", "payments", "attendance", "assessments"];

  async function exportCsv(table: string) {
    const rows = (await list({ data: { table, branch_id: currentBranchId, limit: 5000 } })) as Record<string, unknown>[];
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${table}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <FileBarChart className="h-6 w-6 text-primary" /> التقارير (Reports)
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">تصدير بيانات الفرع النشط بصيغة CSV</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {tables.map((t) => (
          <Card key={t} className="flex items-center justify-between p-4">
            <div>
              <div className="font-black">{t}</div>
              <div className="text-xs text-muted-foreground">تصدير جميع السجلات</div>
            </div>
            <Button size="sm" onClick={() => exportCsv(t)}>
              <Download className="ml-2 h-4 w-4" /> CSV
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
