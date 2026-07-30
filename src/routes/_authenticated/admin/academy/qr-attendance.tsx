import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { QrCode, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BranchGuard } from "@/components/academy/BranchGuard";
import { QrScanner } from "@/components/academy/QrScanner";
import { useBranch } from "@/lib/branch-context";
import { listRows, upsertRow } from "@/lib/academy-crud.functions";
import { lookupClientByCode } from "@/lib/leads.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/academy/qr-attendance")({
  component: QrAttendancePage,
});

function QrAttendancePage() {
  const { currentBranchId } = useBranch();
  const qc = useQueryClient();
  const list = useServerFn(listRows);
  const save = useServerFn(upsertRow);
  const lookup = useServerFn(lookupClientByCode);
  const [manual, setManual] = useState("");

  const queryKey = ["attendance-live", currentBranchId];
  const { data } = useQuery({
    queryKey,
    queryFn: () => list({ data: { table: "attendance", branch_id: currentBranchId, order: { column: "checked_in_at", ascending: false }, limit: 50 } }),
    enabled: !!currentBranchId,
  });

  useEffect(() => {
    if (!currentBranchId) return;
    const ch = supabase.channel(`att-${currentBranchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance", filter: `branch_id=eq.${currentBranchId}` }, (payload) => {
        qc.invalidateQueries({ queryKey });
        if (payload.eventType === "INSERT") toast.success("حضور جديد سُجّل");
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [currentBranchId, qc, queryKey]);

  async function registerCheckIn(code: string) {
    if (!currentBranchId) { toast.error("اختر فرع أولاً"); return; }
    try {
      const found = await lookup({ data: { code } });
      const client = found[0];
      if (!client) { toast.error(`ماحدش بالكود: ${code}`); return; }
      await save({ data: { table: "attendance", payload: {
        branch_id: currentBranchId, client_id: client.id, method: "qr",
        checked_in_at: new Date().toISOString(),
      }}});
      toast.success(`تم تسجيل حضور ${client.full_name}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function confirmAttendance(id: string) {
    try {
      await save({ data: { table: "attendance", payload: { id, confirmed_at: new Date().toISOString() } } });
      toast.success("تم تأكيد الحضور");
      qc.invalidateQueries({ queryKey });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <BranchGuard>
      <div className="space-y-4">
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <QrCode className="h-6 w-6 text-primary" /> حضور QR
        </h1>

        <div className="grid gap-4 lg:grid-cols-2">
          <QrScanner
            onScan={(text) => { registerCheckIn(text.trim()); }}
            onError={(e) => toast.error(e)}
          />

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-black">إدخال يدوي</h3>
            <div className="flex gap-2">
              <Input placeholder="Client Code (مثال: CL-A1B2C3)" value={manual} onChange={(e) => setManual(e.target.value)} />
              <Button onClick={() => { if (manual) { registerCheckIn(manual); setManual(""); } }}>تسجيل</Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">اكتب كود المتدرب أو رقم تليفونه أو جزء من اسمه</p>
          </Card>
        </div>

        <Card className="p-0">
          <div className="border-b p-3">
            <h3 className="text-sm font-black">آخر الحضور (Realtime)</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {((data ?? []) as Array<Record<string, unknown>>).map((row) => (
              <div key={row.id as string} className="flex items-center justify-between border-b px-3 py-2 last:border-0">
                <div>
                  <div className="text-sm font-bold">{(row.client_id as string)?.slice(0, 8)}…</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(row.checked_in_at as string).toLocaleString("ar-EG")}
                  </div>
                </div>
                {row.confirmed_at ? (
                  <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/40" variant="outline">
                    <CheckCircle2 className="ml-1 h-3 w-3" /> مؤكد
                  </Badge>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => confirmAttendance(row.id as string)}>
                    <Clock className="ml-1 h-3 w-3" /> تأكيد
                  </Button>
                )}
              </div>
            ))}
            {!((data as unknown[])?.length) && (
              <div className="p-6 text-center text-sm text-muted-foreground">لا حضور بعد</div>
            )}
          </div>
        </Card>
      </div>
    </BranchGuard>
  );
}
