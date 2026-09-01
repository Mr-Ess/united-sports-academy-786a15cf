import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BranchGuard } from "@/components/legends/BranchGuard";
import { IdCard, Search, Waves, Calendar, Phone, User, ReceiptText, Building2 } from "lucide-react";
import { AttachmentsPanel } from "@/components/legends/AttachmentsPanel";

export const Route = createFileRoute("/_authenticated/admin/academy/clients")({
  head: () => ({ meta: [{ title: "Client Lookup · United Sports Academy" }] }),
  component: ClientsPage,
});

type Trainee = {
  id: string; branch_id: string; client_code: string; full_name: string; full_name_ar: string | null;
  phone: string | null; category: string | null; skill_level: string | null; active: boolean;
};
type Sub = {
  id: string; branch_id: string; trainee_id: string; package_name: string; package_type: string | null;
  total_sessions: number; used_sessions: number; price: number; paid_amount: number;
  payment_method: string | null; start_date: string; end_date: string | null; status: string;
  coach_id: string | null; receipt_number: string | null;
};

function ClientsPage() {
  const { t, lang } = useI18n();
  const { currentBranchId } = useSession();
  const [q, setQ] = useState("");

  const traineesQ = useQuery({
    queryKey: ["clients-trainees", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async (): Promise<Trainee[]> => {
      const { data, error } = await supabase
        .from("ac_trainees")
        .select("id, branch_id, client_code, full_name, full_name_ar, phone, category, skill_level, active")
        .eq("branch_id", currentBranchId!)
        .is("deleted_at", null)
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as Trainee[];
    },
  });

  const subsQ = useQuery({
    queryKey: ["clients-subs", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async (): Promise<Sub[]> => {
      const { data, error } = await supabase
        .from("ac_subscriptions")
        .select("id, branch_id, trainee_id, package_name, package_type, total_sessions, used_sessions, price, paid_amount, payment_method, start_date, end_date, status, coach_id, receipt_number")
        .eq("branch_id", currentBranchId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Sub[];
    },
  });

  const invoicesQ = useQuery({
    queryKey: ["clients-invoices", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ac_invoices")
        .select("id, trainee_id, invoice_number, issue_date, total, paid_amount, status")
        .eq("branch_id", currentBranchId!)
        .is("deleted_at", null)
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; trainee_id: string | null; invoice_number: string; issue_date: string; total: number; paid_amount: number; status: string }>;
    },
  });

  const trainees = traineesQ.data ?? [];
  const subs = subsQ.data ?? [];
  const invoices = invoicesQ.data ?? [];

  const subsByTrainee = new Map<string, Sub[]>();
  for (const s of subs) {
    const list = subsByTrainee.get(s.trainee_id) ?? [];
    list.push(s);
    subsByTrainee.set(s.trainee_id, list);
  }
  const invoicesByTrainee = new Map<string, typeof invoices>();
  for (const inv of invoices) {
    if (!inv.trainee_id) continue;
    const list = invoicesByTrainee.get(inv.trainee_id) ?? [];
    list.push(inv);
    invoicesByTrainee.set(inv.trainee_id, list);
  }

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? trainees.filter((tr) =>
        tr.client_code.toLowerCase().includes(needle) ||
        tr.full_name.toLowerCase().includes(needle) ||
        (tr.full_name_ar ?? "").toLowerCase().includes(needle) ||
        (tr.phone ?? "").includes(needle),
      )
    : trainees;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-teal/15 p-2.5 ring-1 ring-teal/30"><IdCard className="h-5 w-5 text-cyan-glow" /></div>
        <div>
          <h2 className="text-xl font-bold">{t("pg.clients.h")}</h2>
          <p className="text-xs text-muted-foreground">{t("pg.clients.s")}</p>
        </div>
      </div>

      <BranchGuard>
        <Card className="glass p-4">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder={lang === "ar"
                ? "ابحث بكود العميل (CL-XXXXXX)، الاسم أو الهاتف"
                : "Search by Client ID (CL-XXXXXX), name, or phone"}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="ps-10 h-12 text-base bg-background/30"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {filtered.length} {lang === "ar" ? "نتيجة" : (filtered.length === 1 ? "client" : "clients")}
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3 w-3" />
              {lang === "ar" ? "نطاق البحث: الفرع الحالي" : "Scope: current branch only"}
            </span>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((tr) => {
            const traineeSubs = subsByTrainee.get(tr.id) ?? [];
            const traineeInvs = invoicesByTrainee.get(tr.id) ?? [];
            const active = traineeSubs.filter((r) => r.used_sessions < r.total_sessions && r.status !== "cancelled");
            const totalSpent = traineeSubs.reduce((s, r) => s + Number(r.paid_amount || 0), 0);
            const invTotal = traineeInvs.reduce((s, i) => s + Number(i.total || 0), 0);
            const invPaid = traineeInvs.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
            const invOutstanding = invTotal - invPaid;
            const displayName = lang === "ar" ? (tr.full_name_ar || tr.full_name) : tr.full_name;
            return (
              <Card key={tr.id} className="glass overflow-hidden p-0">
                <div className="bg-gradient-to-r from-teal/20 to-cyan-glow/10 p-4 border-b border-border/40">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono tracking-wider bg-background/40 text-cyan-glow border-teal/40">{tr.client_code}</Badge>
                        {active.length > 0
                          ? <Badge className="bg-mint/20 text-mint border border-mint/40">{lang === "ar" ? "نشط" : "Active"}</Badge>
                          : <Badge className="bg-muted/30 text-muted-foreground">{lang === "ar" ? "غير نشط" : "Inactive"}</Badge>}
                      </div>
                      <div className="mt-2 text-lg font-bold flex items-center gap-2 truncate">
                        <User className="h-4 w-4 text-cyan-glow shrink-0" />{displayName}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{tr.phone ?? "—"}</span>
                        <span>{tr.category ?? "—"} · {tr.skill_level ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-border/40 text-center text-xs">
                  <div><div className="font-bold text-base text-foreground">{traineeSubs.length}</div><div className="text-muted-foreground">{lang === "ar" ? "اشتراكات" : "Subscriptions"}</div></div>
                  <div><div className="font-bold text-base text-mint">{active.length}</div><div className="text-muted-foreground">{lang === "ar" ? "نشطة الآن" : "Active"}</div></div>
                  <div><div className="font-bold text-base text-cyan-glow">EGP {totalSpent.toLocaleString()}</div><div className="text-muted-foreground">{lang === "ar" ? "الإجمالي" : "Lifetime"}</div></div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ReceiptText className="h-3 w-3" />{lang === "ar" ? "سجل الاشتراكات" : "Subscription history"}
                  </div>
                  {traineeSubs.length === 0 && (
                    <div className="text-xs text-muted-foreground italic">{lang === "ar" ? "لا توجد اشتراكات" : "No subscriptions yet"}</div>
                  )}
                  {traineeSubs.map((r) => {
                    const left = r.total_sessions - r.used_sessions;
                    const isActive = left > 0 && r.status !== "cancelled";
                    return (
                      <div key={r.id} className="rounded-lg border border-border/40 bg-background/20 p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium truncate">{r.package_name}{r.package_type ? ` · ${r.package_type}` : ""}</div>
                          <Badge variant="outline" className={isActive ? "bg-mint/15 text-mint border-mint/30" : "bg-muted/30 text-muted-foreground"}>
                            {isActive ? `${left} ${lang === "ar" ? "متبقي" : "left"}` : (lang === "ar" ? "منتهي" : "Expired")}
                          </Badge>
                        </div>
                        <div className="mt-1 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                          <span><Calendar className="inline h-3 w-3 me-1" />{r.start_date}</span>
                          <span><Waves className="inline h-3 w-3 me-1" />{r.used_sessions}/{r.total_sessions}</span>
                          <span>EGP {Number(r.paid_amount).toLocaleString()} · {r.payment_method ?? "—"}</span>
                          <span className="truncate">{r.receipt_number ?? ""}</span>
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1.5"><ReceiptText className="h-3 w-3" />{lang === "ar" ? "الفواتير" : "Invoices"}</span>
                    {traineeInvs.length > 0 && (
                      <span className="normal-case text-muted-foreground/80">
                        {lang === "ar" ? "المستحق: " : "Outstanding: "}
                        <span className={invOutstanding > 0 ? "text-warn font-bold" : "text-mint font-bold"}>EGP {invOutstanding.toLocaleString()}</span>
                      </span>
                    )}
                  </div>
                  {traineeInvs.length === 0 && (
                    <div className="text-xs text-muted-foreground italic">{lang === "ar" ? "لا توجد فواتير" : "No invoices"}</div>
                  )}
                  {traineeInvs.slice(0, 5).map((inv) => {
                    const due = Number(inv.total) - Number(inv.paid_amount);
                    return (
                      <div key={inv.id} className="rounded-lg border border-border/40 bg-background/20 p-2.5 text-xs flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-mono">{inv.invoice_number}</div>
                          <div className="text-muted-foreground">{inv.issue_date} · {inv.status}</div>
                        </div>
                        <div className="text-end">
                          <div className="font-semibold">EGP {Number(inv.total).toLocaleString()}</div>
                          <div className={due > 0 ? "text-warn" : "text-mint"}>{due > 0 ? (lang === "ar" ? `متبقي ${due.toLocaleString()}` : `Due ${due.toLocaleString()}`) : (lang === "ar" ? "مدفوع" : "Paid")}</div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-3 border-t border-border/30">
                    <AttachmentsPanel entityType="trainee" entityId={tr.id} compact />
                  </div>
                </div>
              </Card>
            );
          })}
          {filtered.length === 0 && !traineesQ.isLoading && (
            <Card className="glass p-10 text-center text-sm text-muted-foreground lg:col-span-2">
              {lang === "ar" ? "لا يوجد عميل مطابق في هذا الفرع." : "No matching client in this branch."}
            </Card>
          )}
        </div>
      </BranchGuard>
    </div>
  );
}
