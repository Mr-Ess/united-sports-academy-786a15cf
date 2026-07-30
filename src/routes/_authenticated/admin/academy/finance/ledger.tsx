import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useBranch } from "@/lib/branch-context";
import { listRows } from "@/lib/academy-crud.functions";

export const Route = createFileRoute("/_authenticated/admin/academy/finance/ledger")({
  component: LedgerPage,
});

function LedgerPage() {
  const { currentBranchId } = useBranch();
  const list = useServerFn(listRows);
  const { data: payments } = useQuery({
    queryKey: ["ledger-payments", currentBranchId],
    queryFn: () => list({ data: { table: "payments", branch_id: currentBranchId, limit: 1000 } }),
    enabled: !!currentBranchId,
  });
  const { data: invoices } = useQuery({
    queryKey: ["ledger-invoices", currentBranchId],
    queryFn: () => list({ data: { table: "invoices", branch_id: currentBranchId, limit: 1000 } }),
    enabled: !!currentBranchId,
  });

  const paymentsList = (payments as { amount: number; paid_at: string; method: string; receipt_no: string }[] | undefined) ?? [];
  const invoicesList = (invoices as { amount: number; status: string }[] | undefined) ?? [];

  const totalReceived = paymentsList.reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalInvoiced = invoicesList.reduce((s, i) => s + Number(i.amount || 0), 0);
  const unpaid = invoicesList.filter((i) => i.status === "unpaid").reduce((s, i) => s + Number(i.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <BookOpen className="h-6 w-6 text-primary" /> الدفتر (Ledger)
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">ملخص مالي للفرع النشط</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">إجمالي المقبوض</div>
              <div className="text-2xl font-black">{totalReceived.toLocaleString()}</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">إجمالي المفوتر</div>
              <div className="text-2xl font-black">{totalInvoiced.toLocaleString()}</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">مستحقات غير مدفوعة</div>
              <div className="text-2xl font-black">{unpaid.toLocaleString()}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 font-black">آخر الدفعات</h2>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs font-black">
            <tr>
              <th className="px-3 py-2 text-right">رقم الإيصال</th>
              <th className="px-3 py-2 text-right">المبلغ</th>
              <th className="px-3 py-2 text-right">طريقة الدفع</th>
              <th className="px-3 py-2 text-right">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {paymentsList.slice(0, 10).map((p, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2 font-mono text-xs">{p.receipt_no}</td>
                <td className="px-3 py-2 font-black">{Number(p.amount).toLocaleString()}</td>
                <td className="px-3 py-2">{p.method}</td>
                <td className="px-3 py-2 text-muted-foreground">{new Date(p.paid_at).toLocaleDateString("ar-EG")}</td>
              </tr>
            ))}
            {paymentsList.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">مافيش دفعات</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
