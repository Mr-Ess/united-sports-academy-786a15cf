import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, TrendingUp, TrendingDown, Trash2, Banknote } from "lucide-react";
import { toast } from "sonner";
import { FinanceSubNav } from "@/components/legends/SubNav";


export const Route = createFileRoute("/_authenticated/admin/academy/finance")({
  head: () => ({ meta: [{ title: "Finance · United Sports Academy" }] }),
  component: FinancePage 
});

type Account = { id: string; name: string; name_ar: string | null; kind: string; currency: string; opening_balance: number; active: boolean };
type Category = { id: string; name: string; name_ar: string | null; kind: string; color: string | null };
type Tx = { id: string; account_id: string | null; category_id: string | null; kind: string; amount: number; description: string | null; tx_date: string; payment_method: string | null; reference: string | null };

function FinancePage() {
  const { currentBranchId } = useSession();
  const { lang } = useI18n();

  return (
    <div className="space-y-6">
      <FinanceSubNav />
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Wallet className="h-6 w-6 text-cyan-glow" />{lang === "ar" ? "المالية والخزينة" : "Finance & Treasury"}</h2>
        <p className="text-sm text-muted-foreground">{lang === "ar" ? "الحسابات والمعاملات والتقارير المالية" : "Accounts, ledger, and financial reports"}</p>
      </div>


      {!currentBranchId ? (
        <Card className="glass"><CardContent className="py-10 text-center text-muted-foreground">{lang === "ar" ? "اختر فرعًا أولاً" : "Select a branch first"}</CardContent></Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <Link to="/admin/academy/receipts" className="block">
              <Card className="glass hover:border-cyan-glow/50 transition h-full">
                <CardContent className="pt-5">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{lang === "ar" ? "المدفوعات والفواتير" : "Payments & Invoices"}</div>
                  <div className="mt-1 text-lg font-bold">{lang === "ar" ? "فواتير العملاء" : "Client Invoices"}</div>
                  <div className="text-xs text-muted-foreground mt-1">{lang === "ar" ? "إنشاء وتتبع الفواتير" : "Create & track invoices"}</div>
                </CardContent>
              </Card>
            </Link>
            <Link to="/admin/academy/subscriptions" className="block">
              <Card className="glass hover:border-cyan-glow/50 transition h-full">
                <CardContent className="pt-5">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{lang === "ar" ? "الاشتراكات" : "Subscriptions"}</div>
                  <div className="mt-1 text-lg font-bold">{lang === "ar" ? "الباقات النشطة" : "Active Packages"}</div>
                  <div className="text-xs text-muted-foreground mt-1">{lang === "ar" ? "تسكين ذكي + سعة" : "Smart assignment + capacity"}</div>
                </CardContent>
              </Card>
            </Link>
            <Link to="/admin/academy/subscriptions" search={{ view: "renewals" } as any} className="block">
              <Card className="glass hover:border-cyan-glow/50 transition h-full">
                <CardContent className="pt-5">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{lang === "ar" ? "التجديدات" : "Renewals"}</div>
                  <div className="mt-1 text-lg font-bold">{lang === "ar" ? "قرب الانتهاء" : "Near expiry"}</div>
                  <div className="text-xs text-muted-foreground mt-1">{lang === "ar" ? "خلال 14 يومًا" : "Within 14 days"}</div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <Tabs defaultValue="ledger" className="space-y-4">
            <TabsList>
              <TabsTrigger value="ledger">{lang === "ar" ? "السجل" : "Ledger"}</TabsTrigger>
              <TabsTrigger value="accounts">{lang === "ar" ? "الحسابات" : "Accounts"}</TabsTrigger>
              <TabsTrigger value="categories">{lang === "ar" ? "الفئات" : "Categories"}</TabsTrigger>
            </TabsList>
            <TabsContent value="ledger"><LedgerTab branchId={currentBranchId} lang={lang} /></TabsContent>
            <TabsContent value="accounts"><AccountsTab branchId={currentBranchId} lang={lang} /></TabsContent>
            <TabsContent value="categories"><CategoriesTab branchId={currentBranchId} lang={lang} /></TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function LedgerTab({ branchId, lang }: { branchId: string; lang: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [kindFilter, setKindFilter] = useState("all");

  const accountsQ = useQuery({ queryKey: ["fin-accounts", branchId], queryFn: async () => {
    const { data, error } = await supabase.from("ac_accounts").select("*").eq("branch_id", branchId).order("name");
    if (error) throw error; return data as Account[];
  }});
  const catsQ = useQuery({ queryKey: ["fin-cats", branchId], queryFn: async () => {
    const { data, error } = await supabase.from("ac_expense_categories").select("*").eq("branch_id", branchId).order("name");
    if (error) throw error; return data as Category[];
  }});
  const txQ = useQuery({ queryKey: ["fin-tx", branchId], queryFn: async () => {
    const { data, error } = await supabase.from("ac_transactions").select("*").eq("branch_id", branchId).order("tx_date", { ascending: false }).limit(200);
    if (error) throw error; return data as Tx[];
  }});

  const accMap = useMemo(() => Object.fromEntries((accountsQ.data ?? []).map(a => [a.id, a])), [accountsQ.data]);
  const catMap = useMemo(() => Object.fromEntries((catsQ.data ?? []).map(c => [c.id, c])), [catsQ.data]);

  const filtered = useMemo(() =>
    (txQ.data ?? []).filter(t => kindFilter === "all" || t.kind === kindFilter),
  [txQ.data, kindFilter]);

  const totals = useMemo(() => {
    let income = 0, expense = 0;
    (txQ.data ?? []).forEach(t => {
      const a = Number(t.amount) || 0;
      if (t.kind === "income") income += a;
      else if (t.kind === "expense") expense += a;
    });
    return { income, expense, net: income - expense };
  }, [txQ.data]);

  const create = useMutation({
    mutationFn: async (p: any) => {
      const { error } = await supabase.from("ac_transactions").insert({ ...p, branch_id: branchId } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-tx"] }); setOpen(false); toast.success(lang === "ar" ? "تم التسجيل" : "Recorded"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("ac_transactions").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fin-tx"] }),
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="glass border-emerald-500/30">
          <CardContent className="pt-5 flex items-center justify-between">
            <div><div className="text-xs text-muted-foreground">{lang === "ar" ? "الإيرادات" : "Income"}</div><div className="text-2xl font-bold text-emerald-300">{totals.income.toLocaleString()}</div></div>
            <TrendingUp className="h-7 w-7 text-emerald-400" />
          </CardContent>
        </Card>
        <Card className="glass border-rose-500/30">
          <CardContent className="pt-5 flex items-center justify-between">
            <div><div className="text-xs text-muted-foreground">{lang === "ar" ? "المصروفات" : "Expenses"}</div><div className="text-2xl font-bold text-rose-300">{totals.expense.toLocaleString()}</div></div>
            <TrendingDown className="h-7 w-7 text-rose-400" />
          </CardContent>
        </Card>
        <Card className="glass border-cyan-500/30">
          <CardContent className="pt-5 flex items-center justify-between">
            <div><div className="text-xs text-muted-foreground">{lang === "ar" ? "الصافي" : "Net"}</div><div className={"text-2xl font-bold " + (totals.net >= 0 ? "text-cyan-glow" : "text-rose-300")}>{totals.net.toLocaleString()}</div></div>
            <Banknote className="h-7 w-7 text-cyan-glow" />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Select value={kindFilter} onValueChange={setKindFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === "ar" ? "الكل" : "All"}</SelectItem>
            <SelectItem value="income">{lang === "ar" ? "إيراد" : "Income"}</SelectItem>
            <SelectItem value="expense">{lang === "ar" ? "مصروف" : "Expense"}</SelectItem>
            <SelectItem value="transfer">{lang === "ar" ? "تحويل" : "Transfer"}</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />{lang === "ar" ? "معاملة جديدة" : "New Transaction"}</Button></DialogTrigger>
          <TxDialog accounts={accountsQ.data ?? []} cats={catsQ.data ?? []} onCreate={create.mutate} lang={lang} />
        </Dialog>
      </div>

      <Card className="glass">
        <CardContent className="overflow-x-auto pt-4">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2">{lang === "ar" ? "التاريخ" : "Date"}</th>
                <th className="text-left py-2 px-2">{lang === "ar" ? "النوع" : "Kind"}</th>
                <th className="text-left py-2 px-2">{lang === "ar" ? "الفئة" : "Category"}</th>
                <th className="text-left py-2 px-2">{lang === "ar" ? "الحساب" : "Account"}</th>
                <th className="text-left py-2 px-2">{lang === "ar" ? "الوصف" : "Description"}</th>
                <th className="text-right py-2 px-2">{lang === "ar" ? "المبلغ" : "Amount"}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-b border-border/40">
                  <td className="py-2 px-2 text-xs">{t.tx_date}</td>
                  <td className="py-2 px-2">
                    <Badge variant="outline" className={t.kind === "income" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/40" : t.kind === "expense" ? "bg-rose-500/10 text-rose-300 border-rose-500/40" : "bg-cyan-500/10 text-cyan-300 border-cyan-500/40"}>{t.kind}</Badge>
                  </td>
                  <td className="py-2 px-2">{t.category_id ? catMap[t.category_id]?.name : "—"}</td>
                  <td className="py-2 px-2">{t.account_id ? accMap[t.account_id]?.name : "—"}</td>
                  <td className="py-2 px-2 text-xs">{t.description ?? "—"}</td>
                  <td className={"py-2 px-2 text-right font-semibold " + (t.kind === "income" ? "text-emerald-300" : t.kind === "expense" ? "text-rose-300" : "")}>{Number(t.amount).toLocaleString()}</td>
                  <td className="py-2 px-2"><button onClick={() => del.mutate(t.id)} className="opacity-50 hover:opacity-100"><Trash2 className="h-3 w-3 text-rose-400" /></button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">{lang === "ar" ? "لا توجد معاملات" : "No transactions"}</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function TxDialog({ accounts, cats, onCreate, lang }: { accounts: Account[]; cats: Category[]; onCreate: (p: any) => void; lang: string }) {
  const [form, setForm] = useState({
    kind: "expense", amount: 0, account_id: "", category_id: "",
    description: "", reference: "", tx_date: new Date().toISOString().slice(0, 10), payment_method: "Cash",
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{lang === "ar" ? "معاملة جديدة" : "New Transaction"}</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{lang === "ar" ? "النوع" : "Kind"}</Label>
            <Select value={form.kind} onValueChange={v => setForm({ ...form, kind: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="income">{lang === "ar" ? "إيراد" : "Income"}</SelectItem>
                <SelectItem value="expense">{lang === "ar" ? "مصروف" : "Expense"}</SelectItem>
                <SelectItem value="transfer">{lang === "ar" ? "تحويل" : "Transfer"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>{lang === "ar" ? "المبلغ" : "Amount"}</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></div>
          <div><Label>{lang === "ar" ? "الحساب" : "Account"}</Label>
            <Select value={form.account_id || "none"} onValueChange={v => setForm({ ...form, account_id: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="none">—</SelectItem>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{lang === "ar" ? "الفئة" : "Category"}</Label>
            <Select value={form.category_id || "none"} onValueChange={v => setForm({ ...form, category_id: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="none">—</SelectItem>{cats.filter(c => form.kind === "transfer" || c.kind === form.kind).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{lang === "ar" ? "التاريخ" : "Date"}</Label><Input type="date" value={form.tx_date} onChange={e => setForm({ ...form, tx_date: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "طريقة الدفع" : "Method"}</Label>
            <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Cash","InstaPay","Wallet","Card","Bank Transfer"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>{lang === "ar" ? "الوصف" : "Description"}</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <div><Label>{lang === "ar" ? "المرجع" : "Reference"}</Label><Input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button disabled={!form.amount} onClick={() => onCreate({
          kind: form.kind, amount: Number(form.amount),
          account_id: form.account_id || null, category_id: form.category_id || null,
          description: form.description || null, reference: form.reference || null,
          tx_date: form.tx_date, payment_method: form.payment_method,
        })}>{lang === "ar" ? "حفظ" : "Save"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function AccountsTab({ branchId, lang }: { branchId: string; lang: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ["fin-accounts", branchId], queryFn: async () => {
    const { data, error } = await supabase.from("ac_accounts").select("*").eq("branch_id", branchId).order("name");
    if (error) throw error; return data as Account[];
  }});
  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await supabase.from("ac_accounts").insert({ ...p, branch_id: branchId } as any); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-accounts"] }); setOpen(false); toast.success(lang === "ar" ? "تم" : "Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("ac_accounts").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fin-accounts"] }),
  });
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" />{lang === "ar" ? "حساب جديد" : "New Account"}</Button></DialogTrigger>
          <SimpleNameDialog title={lang === "ar" ? "حساب جديد" : "New Account"} lang={lang} kinds={["cash","bank","wallet"]} onCreate={create.mutate} kindLabel={lang === "ar" ? "النوع" : "Kind"} />
        </Dialog>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {(q.data ?? []).map(a => (
          <Card key={a.id} className="glass">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center justify-between">
              <span>{lang === "ar" ? (a.name_ar || a.name) : a.name}</span>
              <Badge variant="outline">{a.kind}</Badge>
            </CardTitle></CardHeader>
            <CardContent className="text-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">{lang === "ar" ? "الرصيد الافتتاحي" : "Opening"}</div>
                <div className="text-lg font-bold">{Number(a.opening_balance).toLocaleString()} {a.currency}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => del.mutate(a.id)}><Trash2 className="h-3.5 w-3.5 text-rose-400" /></Button>
            </CardContent>
          </Card>
        ))}
        {(q.data ?? []).length === 0 && <Card className="glass col-span-full"><CardContent className="py-8 text-center text-muted-foreground">{lang === "ar" ? "لا توجد حسابات" : "No accounts"}</CardContent></Card>}
      </div>
    </div>
  );
}

function CategoriesTab({ branchId, lang }: { branchId: string; lang: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ["fin-cats", branchId], queryFn: async () => {
    const { data, error } = await supabase.from("ac_expense_categories").select("*").eq("branch_id", branchId).order("kind").order("name");
    if (error) throw error; return data as Category[];
  }});
  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await supabase.from("ac_expense_categories").insert({ ...p, branch_id: branchId } as any); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-cats"] }); setOpen(false); toast.success(lang === "ar" ? "تم" : "Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("ac_expense_categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fin-cats"] }),
  });
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" />{lang === "ar" ? "فئة جديدة" : "New Category"}</Button></DialogTrigger>
          <SimpleNameDialog title={lang === "ar" ? "فئة جديدة" : "New Category"} lang={lang} kinds={["expense","income"]} onCreate={create.mutate} kindLabel={lang === "ar" ? "النوع" : "Kind"} />
        </Dialog>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {(q.data ?? []).map(c => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-card/40 p-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: c.color ?? "#41C9E2" }} />
              <span className="text-sm">{lang === "ar" ? (c.name_ar || c.name) : c.name}</span>
              <Badge variant="outline" className="text-xs">{c.kind}</Badge>
            </div>
            <Button size="sm" variant="ghost" onClick={() => del.mutate(c.id)}><Trash2 className="h-3.5 w-3.5 text-rose-400" /></Button>
          </div>
        ))}
        {(q.data ?? []).length === 0 && <div className="col-span-full text-center text-muted-foreground py-6">{lang === "ar" ? "لا توجد فئات" : "No categories"}</div>}
      </div>
    </div>
  );
}

function SimpleNameDialog({ title, lang, kinds, kindLabel, onCreate }: {
  title: string; lang: string; kinds: string[]; kindLabel: string; onCreate: (p: any) => void;
}) {
  const [form, setForm] = useState({ name: "", name_ar: "", kind: kinds[0], opening_balance: 0, color: "#41C9E2" });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{lang === "ar" ? "الاسم" : "Name"}</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "بالعربية" : "Name (AR)"}</Label><Input value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{kindLabel}</Label>
            <Select value={form.kind} onValueChange={v => setForm({ ...form, kind: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{kinds.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {kinds.includes("cash") && (
            <div><Label>{lang === "ar" ? "الرصيد الافتتاحي" : "Opening balance"}</Label><Input type="number" value={form.opening_balance} onChange={e => setForm({ ...form, opening_balance: Number(e.target.value) })} /></div>
          )}
          {!kinds.includes("cash") && (
            <div><Label>{lang === "ar" ? "اللون" : "Color"}</Label><Input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></div>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button disabled={!form.name} onClick={() => onCreate({
          name: form.name, name_ar: form.name_ar || null, kind: form.kind,
          opening_balance: form.opening_balance, color: form.color,
        })}>{lang === "ar" ? "حفظ" : "Save"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
