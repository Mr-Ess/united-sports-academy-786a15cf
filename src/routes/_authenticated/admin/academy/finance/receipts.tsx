import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Receipt, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BranchGuard } from "@/components/academy/BranchGuard";
import { useBranch } from "@/lib/branch-context";
import { listRows, upsertRow, deleteRow } from "@/lib/academy-crud.functions";
import { lookupClientByCode } from "@/lib/leads.functions";
import { exportCSV, exportExcel, exportPDF } from "@/lib/export-utils";

export const Route = createFileRoute("/_authenticated/admin/academy/finance/receipts")({
  component: ReceiptsPage,
});

type Client = { id: string; client_code: string; full_name: string; phone: string | null; email: string | null; branch_id: string };

function ReceiptsPage() {
  const { currentBranchId } = useBranch();
  const qc = useQueryClient();
  const list = useServerFn(listRows);
  const save = useServerFn(upsertRow);
  const del = useServerFn(deleteRow);
  const lookup = useServerFn(lookupClientByCode);

  const queryKey = ["receipts", currentBranchId];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => list({ data: { table: "payments", branch_id: currentBranchId, order: { column: "paid_at", ascending: false } } }),
    enabled: !!currentBranchId,
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    receipt_no: "", client_id: "", amount: "", method: "cash", notes: "",
  });
  const [clientSearch, setClientSearch] = useState("");
  const [matches, setMatches] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searching, setSearching] = useState(false);

  async function doLookup(v: string) {
    setClientSearch(v);
    if (v.length < 2) { setMatches([]); return; }
    setSearching(true);
    try {
      const rows = await lookup({ data: { code: v } });
      setMatches(rows as Client[]);
    } finally { setSearching(false); }
  }

  function pickClient(c: Client) {
    setSelectedClient(c);
    setForm((f) => ({ ...f, client_id: c.id }));
    setClientSearch(`${c.client_code} — ${c.full_name}`);
    setMatches([]);
  }

  function reset() {
    setForm({ receipt_no: "", client_id: "", amount: "", method: "cash", notes: "" });
    setSelectedClient(null); setClientSearch(""); setMatches([]);
  }

  async function handleSave() {
    if (!currentBranchId) { toast.error("اختر فرع أولاً"); return; }
    if (!form.client_id) { toast.error("اختر متدرب"); return; }
    if (!form.amount) { toast.error("أدخل المبلغ"); return; }
    try {
      const receipt_no = form.receipt_no || `R-${Date.now()}`;
      await save({ data: { table: "payments", payload: {
        branch_id: currentBranchId,
        receipt_no, client_id: form.client_id,
        amount: Number(form.amount), method: form.method,
        paid_at: new Date().toISOString(),
        notes: form.notes || null,
      }}});
      toast.success("تم حفظ الإيصال");
      setOpen(false); reset();
      qc.invalidateQueries({ queryKey });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف الإيصال؟")) return;
    try { await del({ data: { table: "payments", id } }); qc.invalidateQueries({ queryKey }); }
    catch (e) { toast.error((e as Error).message); }
  }

  function doExport(kind: "csv" | "xlsx" | "pdf") {
    const rows = ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
      receipt_no: r.receipt_no, amount: r.amount, method: r.method,
      paid_at: r.paid_at, client_id: r.client_id,
    }));
    if (kind === "csv") exportCSV(rows, "receipts");
    if (kind === "xlsx") exportExcel(rows, "receipts", "Receipts");
    if (kind === "pdf") exportPDF(rows, "receipts", "الإيصالات");
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const total = rows.reduce((s, r) => s + Number(r.amount ?? 0), 0);

  return (
    <BranchGuard>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-black">
              <Receipt className="h-6 w-6 text-primary" /> الإيصالات
            </h1>
            <p className="text-sm text-muted-foreground">
              الإجمالي: <span className="font-bold">{total.toLocaleString()} EGP</span> — <span>{rows.length}</span> إيصال
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => doExport("csv")}>CSV</Button>
            <Button size="sm" variant="outline" onClick={() => doExport("xlsx")}>Excel</Button>
            <Button size="sm" variant="outline" onClick={() => doExport("pdf")}>PDF</Button>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
              <DialogTrigger asChild><Button>+ إيصال جديد</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>إيصال جديد</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="relative">
                    <Label className="mb-1.5 block text-xs font-black">المتدرب (بحث بالكود / الاسم / الهاتف)</Label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input className="pr-8" value={clientSearch} onChange={(e) => doLookup(e.target.value)} placeholder="CL-XXXXXX" />
                      {searching && <Loader2 className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />}
                    </div>
                    {matches.length > 0 && (
                      <Card className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto p-1">
                        {matches.map((c) => (
                          <button key={c.id} type="button" onClick={() => pickClient(c)}
                            className="block w-full rounded px-2 py-1.5 text-right text-sm hover:bg-muted">
                            <span className="font-bold">{c.client_code}</span> — {c.full_name} <span className="text-xs text-muted-foreground">{c.phone ?? ""}</span>
                          </button>
                        ))}
                      </Card>
                    )}
                    {selectedClient && (
                      <Badge className="mt-2" variant="secondary">{selectedClient.client_code} • {selectedClient.full_name}</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1.5 block text-xs font-black">رقم الإيصال (اختياري)</Label>
                      <Input value={form.receipt_no} onChange={(e) => setForm({ ...form, receipt_no: e.target.value })} placeholder="تلقائي" />
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-xs font-black">المبلغ *</Label>
                      <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs font-black">طريقة الدفع</Label>
                    <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">نقدي</SelectItem>
                        <SelectItem value="instapay">InstaPay</SelectItem>
                        <SelectItem value="wallet">محفظة</SelectItem>
                        <SelectItem value="card">بطاقة</SelectItem>
                        <SelectItem value="transfer">تحويل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs font-black">ملاحظات</Label>
                    <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                  <Button onClick={handleSave}>حفظ</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs font-black">
              <tr>
                <th className="px-3 py-2 text-right">رقم الإيصال</th>
                <th className="px-3 py-2 text-right">المبلغ</th>
                <th className="px-3 py-2 text-right">الطريقة</th>
                <th className="px-3 py-2 text-right">التاريخ</th>
                <th className="px-3 py-2 text-right w-24">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">تحميل...</td></tr>}
              {!isLoading && !rows.length && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">مافيش إيصالات</td></tr>}
              {rows.map((r) => (
                <tr key={r.id as string} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 font-bold">{r.receipt_no as string}</td>
                  <td className="px-3 py-2">{Number(r.amount).toLocaleString()} EGP</td>
                  <td className="px-3 py-2"><Badge variant="secondary">{r.method as string}</Badge></td>
                  <td className="px-3 py-2 text-xs">{new Date(r.paid_at as string).toLocaleString("ar-EG")}</td>
                  <td className="px-3 py-2">
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id as string)}>حذف</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </BranchGuard>
  );
}
