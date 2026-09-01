import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, LEVELS, SESSION_TYPES, SESSION_COUNTS, PAYMENT_METHODS, DAY_GROUPS, TIME_SLOTS, sessionsForCount } from "@/lib/legends/academy-types";
import { useI18n } from "@/lib/legends/i18n";
import { useSession } from "@/lib/legends/session";
import { BranchGuard, useRequireBranch } from "@/components/legends/BranchGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, Receipt as ReceiptIcon, ShieldCheck, Star, Zap } from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/legends/PermissionGate";
import { FinanceSubNav } from "@/components/legends/SubNav";
import { fetchNewClientCode } from "@/lib/legends/phase2-helpers";


export const Route = createFileRoute("/_authenticated/admin/academy/receipts")({
  head: () => ({ meta: [{ title: "Receipts · United Sports Academy" }] }),
  component: () => <PermissionGate path="/receipts"><ReceiptsPage /></PermissionGate>,
});

// Receipt-specific metadata stored inside invoices.items (jsonb)
type ReceiptMeta = {
  clientId: string;
  studentName: string;
  membershipId: string;
  phone: string;
  address?: string;
  emergencyContact?: string;
  category: string;
  age: number;
  level: string;
  type: string;
  sessionsCount: string;
  totalSessions: number;
  sessionsUsed: number;
  paymentMethod: string;
  dayGroup: string;
  timeSlot: string;
  coachId?: string | null;
  skillRating?: number;
  notes?: string;
};

type InvoiceRow = {
  id: string;
  branch_id: string;
  invoice_number: string;
  issue_date: string;
  total: number;
  paid_amount: number;
  status: string;
  items: any; // ReceiptMeta wrapped
};

type FormState = ReceiptMeta & { receiptNumber: string; amountPaid: number; paymentDate: string };

const blank: FormState = {
  clientId: "", studentName: "", membershipId: "", phone: "", address: "", emergencyContact: "",
  category: "Kids", age: 8, level: "Level 1",
  type: "Group", sessionsCount: "8", totalSessions: 8, sessionsUsed: 0,
  receiptNumber: "", amountPaid: 0,
  paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: "Cash",
  dayGroup: "Sat-Thu", timeSlot: "5:00 PM", coachId: null, skillRating: 5, notes: "",
};

function genClientId() {
  return "CL-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}
function genReceiptNum() {
  return "R-" + Date.now().toString().slice(-7);
}
function metaOf(inv: InvoiceRow): ReceiptMeta {
  const it = inv.items;
  const m = (it && typeof it === "object" && !Array.isArray(it)) ? it : (Array.isArray(it) && it[0]) || {};
  return m as ReceiptMeta;
}

function ReceiptsPage() {
  const { t } = useI18n();
  const { currentBranchId, branches, setCurrentBranchId } = useSession();
  const { ensureBranch } = useRequireBranch();
  const qc = useQueryClient();

  const invQ = useQuery({
    queryKey: ["invoices", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async (): Promise<InvoiceRow[]> => {
      const { data, error } = await supabase
        .from("ac_invoices")
        .select("id, branch_id, invoice_number, issue_date, total, paid_amount, status, items")
        .eq("branch_id", currentBranchId!)
        .is("deleted_at", null)
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as InvoiceRow[];
    },
  });

  const coachesQ = useQuery({
    queryKey: ["employees-coaches", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ac_employees")
        .select("id, full_name")
        .eq("branch_id", currentBranchId!)
        .eq("status", "active");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Map coach_id -> set of time_slot labels where they are scheduled (for smart filtering in the receipt form)
  const coachSlotsQ = useQuery({
    queryKey: ["coach-slots-by-label", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ac_schedule_slots")
        .select("coach_id, time_slot:ac_time_slots(label)")
        .eq("branch_id", currentBranchId!)
        .eq("active", true);
      if (error) throw error;
      const m = new Map<string, Set<string>>();
      for (const r of (data ?? []) as any[]) {
        if (!r.coach_id || !r.time_slot?.label) continue;
        if (!m.has(r.coach_id)) m.set(r.coach_id, new Set());
        m.get(r.coach_id)!.add(r.time_slot.label);
      }
      return m;
    },
  });


  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InvoiceRow | null>(null);
  const [form, setForm] = useState<FormState>(blank);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired">("all");
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [filterCoach, setFilterCoach] = useState<string>("all");
  const [lookup, setLookup] = useState("");

  const coachName = (id?: string | null) => coachesQ.data?.find(c => c.id === id)?.full_name ?? "—";

  const start = (r?: InvoiceRow) => {
    if (r) {
      const m = metaOf(r);
      setEditing(r);
      setForm({
        ...blank,
        ...m,
        receiptNumber: r.invoice_number,
        amountPaid: Number(r.total),
        paymentDate: r.issue_date,
      });
    } else {
      setEditing(null);
      setForm({ ...blank, clientId: genClientId(), receiptNumber: genReceiptNum() });
      setLookup("");
    }
    setOpen(true);
  };

  const doLookup = () => {
    const code = lookup.trim().toUpperCase();
    if (!code) return;
    const matches = (invQ.data ?? [])
      .map(inv => ({ inv, meta: metaOf(inv) }))
      .filter(x => (x.meta.clientId ?? "").toUpperCase() === code)
      .sort((a, b) => b.inv.issue_date.localeCompare(a.inv.issue_date));
    if (!matches.length) return toast.error(t("rec.clientNotFound"));
    const m = matches[0].meta;
    setForm(f => ({
      ...f, clientId: m.clientId, studentName: m.studentName, membershipId: m.membershipId,
      phone: m.phone, address: m.address ?? "", emergencyContact: m.emergencyContact ?? "",
      category: m.category, age: m.age, level: m.level, coachId: m.coachId ?? null,
      dayGroup: m.dayGroup, timeSlot: m.timeSlot, skillRating: m.skillRating ?? 5,
    }));
    toast.success(t("rec.autofilled") + ` · ${m.studentName}`);
  };

  const saveM = useMutation({
    mutationFn: async () => {
      const branchId = ensureBranch();
      if (!branchId) throw new Error("no-branch");
      if (!form.studentName.trim()) throw new Error(t("rec.studentRequired"));

      const totalSessions = sessionsForCount(form.sessionsCount as any);
      const clientCode = (form.clientId || "").trim().toUpperCase() || (await fetchNewClientCode());
      const active = form.sessionsUsed < totalSessions;

      const meta: ReceiptMeta = {
        clientId: clientCode,
        studentName: form.studentName, membershipId: form.membershipId, phone: form.phone,
        address: form.address, emergencyContact: form.emergencyContact,
        category: form.category, age: form.age, level: form.level, type: form.type,
        sessionsCount: form.sessionsCount, totalSessions, sessionsUsed: form.sessionsUsed,
        paymentMethod: form.paymentMethod, dayGroup: form.dayGroup, timeSlot: form.timeSlot,
        coachId: form.coachId ?? null, skillRating: form.skillRating, notes: form.notes,
      };

      const invoiceNumber = form.receiptNumber || genReceiptNum();

      const { data: existingTrainee, error: traineeLookupError } = await supabase
        .from("ac_trainees")
        .select("id")
        .eq("branch_id", branchId)
        .eq("client_code", clientCode)
        .maybeSingle();

      if (traineeLookupError && traineeLookupError.code !== "PGRST116") throw traineeLookupError;

      let traineeId = existingTrainee?.id ?? null;
      if (!traineeId) {
        const { data: insertedTrainee, error: insertTraineeError } = await supabase
          .from("ac_trainees")
          .insert({
            branch_id: branchId,
            client_code: clientCode,
            full_name: form.studentName,
            phone: form.phone || null,
            category: form.category,
            skill_level: form.level,
            active: true,
          } as any)
          .select("id")
          .single();

        if (insertTraineeError) throw insertTraineeError;
        traineeId = insertedTrainee.id;
      } else {
        const { error: updateTraineeError } = await supabase
          .from("ac_trainees")
          .update({
            full_name: form.studentName,
            phone: form.phone || null,
            category: form.category,
            skill_level: form.level,
            active: true,
          })
          .eq("id", traineeId);

        if (updateTraineeError) throw updateTraineeError;
      }

      const subPayload = {
        branch_id: branchId,
        trainee_id: traineeId,
        package_name: `${form.category} - ${form.type}`,
        package_type: form.type,
        total_sessions: totalSessions,
        used_sessions: form.sessionsUsed,
        start_date: form.paymentDate,
        end_date: null,
        status: active ? "active" : "expired",
        price: Number(form.amountPaid || 0),
        paid_amount: Number(form.amountPaid || 0),
        payment_method: form.paymentMethod,
        receipt_number: invoiceNumber,
        coach_id: form.coachId ?? null,
        time_slot_id: null,
        lane_id: null,
        group_id: null,
      };

      const { data: existingSub, error: subLookupError } = await supabase
        .from("ac_subscriptions")
        .select("id")
        .eq("branch_id", branchId)
        .eq("trainee_id", traineeId)
        .eq("receipt_number", invoiceNumber)
        .maybeSingle();

      if (subLookupError && subLookupError.code !== "PGRST116") throw subLookupError;

      let subscriptionId: string | null = existingSub?.id ?? null;
      if (subscriptionId) {
        const { error: updateSubError } = await supabase.from("ac_subscriptions").update(subPayload).eq("id", subscriptionId);
        if (updateSubError) throw updateSubError;
      } else {
        const { data: insertedSub, error: insertSubError } = await supabase.from("ac_subscriptions").insert(subPayload as any).select("id").single();
        if (insertSubError) throw insertSubError;
        subscriptionId = insertedSub.id;
      }

      const payload = {
        branch_id: branchId,
        trainee_id: traineeId,
        subscription_id: subscriptionId,
        invoice_number: invoiceNumber,
        issue_date: form.paymentDate,
        subtotal: Number(form.amountPaid || 0),
        total: Number(form.amountPaid || 0),
        paid_amount: Number(form.amountPaid || 0),
        status: active ? "paid" : "expired",
        items: meta as any,
      };

      if (editing) {
        const { error } = await supabase.from("ac_invoices").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ac_invoices").insert(payload as any);
        if (error) throw error;
      }

      return clientCode;
    },
    onSuccess: (clientId) => {
      toast.success(editing ? t("rec.updated") : `${t("rec.added")} · ${clientId}`);
      qc.invalidateQueries({ queryKey: ["invoices", currentBranchId] });
      qc.invalidateQueries({ queryKey: ["clients-trainees", currentBranchId] });
      qc.invalidateQueries({ queryKey: ["clients-subs", currentBranchId] });
      qc.invalidateQueries({ queryKey: ["clients-invoices", currentBranchId] });
      qc.invalidateQueries({ queryKey: ["attendance-today", currentBranchId] });
      qc.invalidateQueries({ queryKey: ["attendance", currentBranchId] });
      qc.invalidateQueries({ queryKey: ["subs", currentBranchId] });
      setOpen(false);
    },
    onError: (e: any) => { if (e?.message !== "no-branch") toast.error(e?.message ?? "Error"); },
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ac_invoices").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(t("rec.deleted")); qc.invalidateQueries({ queryKey: ["invoices", currentBranchId] }); },
    onError: (e: any) => toast.error(e?.message ?? "Error"),
  });

  const rows = (invQ.data ?? []).map(inv => ({ inv, meta: metaOf(inv) }));
  const filtered = rows.filter(({ inv, meta }) => {
    const active = (meta.sessionsUsed ?? 0) < (meta.totalSessions ?? 0);
    if (filterStatus === "active" && !active) return false;
    if (filterStatus === "expired" && active) return false;
    if (filterMethod !== "all" && meta.paymentMethod !== filterMethod) return false;
    if (filterCoach !== "all" && meta.coachId !== filterCoach) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(meta.studentName ?? "").toLowerCase().includes(q)
        && !(meta.phone ?? "").includes(search)
        && !(inv.invoice_number ?? "").toLowerCase().includes(q)
        && !(meta.clientId ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const totalAmt = filtered.reduce((s, r) => s + Number(r.inv.total), 0);

  return (
    <div className="space-y-5">
      <FinanceSubNav />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0b1723]/80 p-3 shadow-[0_0_0_1px_rgba(45,212,191,0.08)] backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/15 ring-1 ring-teal/30">
            <ReceiptIcon className="h-5 w-5 text-cyan-glow" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white">{t("rec.title")}</h2>
            <p className="text-xs text-slate-300">{filtered.length} · EGP {totalAmt.toLocaleString()}</p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2 min-w-0">
          {branches.length > 1 && (
            <Select value={currentBranchId ?? ""} onValueChange={setCurrentBranchId}>
              <SelectTrigger className="h-12 w-[200px] min-w-[200px] rounded-xl border border-white/10 bg-slate-900/70 text-sm text-slate-100 shadow-inner shadow-black/20">
                <SelectValue placeholder={t("c.branch") ?? "Branch"} />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>{branch.name_ar ?? branch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => start()}
                disabled={!currentBranchId}
                className="h-12 min-w-[190px] rounded-xl bg-gradient-to-r from-[#3ec6c2] via-[#23b0d8] to-[#17a5b8] px-5 text-base font-bold text-white shadow-[0_10px_20px_rgba(27,188,196,0.35)] transition-all hover:scale-[1.01] hover:shadow-[0_14px_24px_rgba(27,188,196,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" /> {t("rec.new")}
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong max-h-[90vh] max-w-3xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? `${t("rec.edit")} · ${metaOf(editing).clientId}` : t("rec.new")}</DialogTitle>
              </DialogHeader>

              <BranchGuard compact>
                {!editing && (
                  <div className="rounded-lg border border-teal/30 bg-teal/5 p-3 mb-2">
                    <Label className="text-xs uppercase tracking-wider text-cyan-glow flex items-center gap-1.5"><Zap className="h-3 w-3" />{t("rec.clientLookup")}</Label>
                    <div className="mt-1.5 flex gap-2">
                      <Input value={lookup} onChange={e => setLookup(e.target.value)} placeholder="CL-XXXXXX" className="bg-background/40 font-mono"
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); doLookup(); } }} />
                      <Button type="button" onClick={doLookup} variant="outline" className="border-teal/40"><Search className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <F label={t("rec.studentName")}><Input value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })} /></F>
                  <F label={t("rec.clientId")}><Input value={form.clientId} placeholder="CL-XXXXXX" onChange={e => setForm({ ...form, clientId: e.target.value })} /></F>
                  <F label={t("rec.membershipId")}><Input value={form.membershipId} onChange={e => setForm({ ...form, membershipId: e.target.value })} /></F>
                  <F label={t("rec.phone")}><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></F>
                  <F label={t("rec.emergency")}><Input value={form.emergencyContact ?? ""} onChange={e => setForm({ ...form, emergencyContact: e.target.value })} /></F>
                  <F label={t("rec.address")}><Textarea rows={1} value={form.address ?? ""} onChange={e => setForm({ ...form, address: e.target.value })} /></F>
                  <F label={t("rec.category")}><P value={form.category} options={CATEGORIES} onChange={v => setForm({ ...form, category: v })} /></F>
                  <F label={t("rec.age")}><Input type="number" value={form.age} onChange={e => setForm({ ...form, age: Number(e.target.value) })} /></F>
                  <F label={t("rec.level")}><P value={form.level} options={LEVELS} onChange={v => setForm({ ...form, level: v })} /></F>
                  <F label={t("rec.type")}><P value={form.type} options={SESSION_TYPES} onChange={v => setForm({ ...form, type: v })} /></F>
                  <F label={t("rec.sessions")}><P value={form.sessionsCount} options={SESSION_COUNTS} onChange={v => setForm({ ...form, sessionsCount: v })} /></F>
                  <F label={t("rec.receiptNum")}><Input value={form.receiptNumber} onChange={e => setForm({ ...form, receiptNumber: e.target.value })} /></F>
                  <F label={t("rec.amount")}><Input type="number" value={form.amountPaid} onChange={e => setForm({ ...form, amountPaid: Number(e.target.value) })} /></F>
                  <F label={t("rec.payDate")}><Input type="date" value={form.paymentDate} onChange={e => setForm({ ...form, paymentDate: e.target.value })} /></F>
                  <F label={t("rec.payMethod")}><P value={form.paymentMethod} options={PAYMENT_METHODS} onChange={v => setForm({ ...form, paymentMethod: v })} /></F>
                  <F label={t("rec.daySchedule")}><P value={form.dayGroup} options={DAY_GROUPS} onChange={v => setForm({ ...form, dayGroup: v })} /></F>
                  <F label={t("rec.timeSlot")}><P value={form.timeSlot} options={TIME_SLOTS} onChange={v => setForm({ ...form, timeSlot: v })} /></F>
                  <F label={t("rec.coach")}>
                    <Select value={form.coachId ?? "none"} onValueChange={v => setForm({ ...form, coachId: v === "none" ? null : v })}>
                      <SelectTrigger className="bg-background/30"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("c.unassigned")}</SelectItem>
                        {(coachesQ.data ?? [])
                          .filter(c => {
                            if (!form.timeSlot) return true;
                            const m = coachSlotsQ.data;
                            if (!m || m.size === 0) return true;
                            const s = m.get(c.id);
                            return s ? s.has(form.timeSlot) : false;
                          })
                          .map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </F>
                  <F label={t("rec.skill")}><Input type="number" min={1} max={10} value={form.skillRating ?? 5} onChange={e => setForm({ ...form, skillRating: Number(e.target.value) })} /></F>
                  <F label={t("rec.sessionsUsed")}><Input type="number" min={0} value={form.sessionsUsed} onChange={e => setForm({ ...form, sessionsUsed: Number(e.target.value) })} /></F>
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setOpen(false)}>{t("c.cancel")}</Button>
                  <Button onClick={() => saveM.mutate()} disabled={saveM.isPending} className="bg-gradient-to-r from-teal to-cyan-glow text-primary-foreground">{editing ? t("c.save") : t("c.add")}</Button>
                </div>
              </BranchGuard>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <BranchGuard compact>
        <Card className="glass p-3 md:p-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={t("rec.searchPh")} value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background/30" />
            </div>
            <P value={filterStatus} options={["all", "active", "expired"]} onChange={v => setFilterStatus(v as any)} className="w-[140px]" />
            <P value={filterMethod} options={["all", ...PAYMENT_METHODS]} onChange={setFilterMethod} className="w-[160px]" />
            <Select value={filterCoach} onValueChange={setFilterCoach}>
              <SelectTrigger className="w-[200px] bg-background/30"><SelectValue placeholder={t("rec.coach")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("c.allCoaches")}</SelectItem>
                {(coachesQ.data ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="glass overflow-hidden p-0 mt-3">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>ID</TableHead>
                  <TableHead>{t("rec.student")}</TableHead>
                  <TableHead>{t("rec.category")}</TableHead>
                  <TableHead>{t("rec.schedule")}</TableHead>
                  <TableHead>{t("rec.coach")}</TableHead>
                  <TableHead>{t("rec.skill").split(" ")[0]}</TableHead>
                  <TableHead>{t("rec.sessions")}</TableHead>
                  <TableHead>{t("rec.amount").split(" ")[0]}</TableHead>
                  <TableHead>{t("c.status")}</TableHead>
                  <TableHead className="text-right">{t("rec.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(({ inv, meta }) => {
                  const left = (meta.totalSessions ?? 0) - (meta.sessionsUsed ?? 0);
                  const active = left > 0;
                  return (
                    <TableRow key={inv.id} className="border-border/40">
                      <TableCell><Badge variant="outline" className="font-mono text-[10px] tracking-wider bg-teal/10 text-cyan-glow border-teal/30">{meta.clientId}</Badge></TableCell>
                      <TableCell>
                        <div className="font-medium">{meta.studentName}</div>
                        <div className="text-xs text-muted-foreground">{meta.membershipId} · {meta.phone}</div>
                      </TableCell>
                      <TableCell>
                        <div>{meta.category}</div>
                        <div className="text-xs text-muted-foreground">{meta.level} · {meta.type}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{meta.dayGroup}</div>
                        <div className="text-xs text-muted-foreground">{meta.timeSlot}</div>
                      </TableCell>
                      <TableCell className="text-xs">{coachName(meta.coachId)}</TableCell>
                      <TableCell><span className="inline-flex items-center gap-1 text-cyan-glow font-semibold"><Star className="h-3 w-3 fill-current" />{meta.skillRating ?? "—"}</span></TableCell>
                      <TableCell className="tabular-nums text-sm">
                        <span className="text-cyan-glow font-semibold">{meta.sessionsUsed ?? 0}</span>
                        <span className="text-muted-foreground"> / {meta.totalSessions ?? 0}</span>
                        <div className="text-xs text-muted-foreground">{left} {t("c.left")}</div>
                      </TableCell>
                      <TableCell className="tabular-nums">EGP {Number(inv.total).toLocaleString()}</TableCell>
                      <TableCell>
                        {active
                          ? <Badge className="bg-mint/20 text-mint border border-mint/40"><ShieldCheck className="mr-1 h-3 w-3" />{t("c.active")}</Badge>
                          : <Badge className="bg-destructive/25 text-destructive-foreground border border-destructive/40">{t("c.expired")}</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => start(inv)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteM.mutate(inv.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && !invQ.isLoading && (
                  <TableRow><TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">{t("rec.empty")}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </BranchGuard>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>{children}</div>;
}

function P({ value, options, onChange, className }: { value: string; options: readonly string[] | string[]; onChange: (v: string) => void; className?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={"bg-background/30 " + (className ?? "")}><SelectValue /></SelectTrigger>
      <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o === "all" ? "All" : o}</SelectItem>)}</SelectContent>
    </Select>
  );
}
