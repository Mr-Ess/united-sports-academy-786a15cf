import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SERVICES, LEAD_SOURCES, OFFERS, LEAD_STATUSES, AGENTS } from "@/lib/legends/academy-types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/legends/i18n";
import { useSession } from "@/lib/legends/session";
import { BranchGuard, useRequireBranch } from "@/components/legends/BranchGuard";

export const Route = createFileRoute("/_authenticated/admin/academy/leads")({
  head: () => ({ meta: [{ title: "Leads CRM · United Sports Academy" }] }),
  component: LeadsPage,
});

type LeadRow = {
  id: string;
  branch_id: string;
  name: string;
  contact: string;
  service: string;
  source: string;
  assessment_date: string | null;
  assessment_attended: boolean;
  subscription_type: string;
  offer: string;
  status: string;
  agent: string;
  comments: string;
};

type LeadForm = Omit<LeadRow, "id" | "branch_id">;

const empty: LeadForm = {
  name: "", contact: "", service: "Kids", source: "Social media",
  assessment_date: new Date().toISOString().slice(0, 10), assessment_attended: false,
  subscription_type: "", offer: "None", status: "Pending Follow-up", agent: "Mero", comments: "",
};

const statusColor: Record<string, string> = {
  "Interested": "bg-mint/20 text-mint border-mint/40",
  "Long-time customer": "bg-teal/20 text-cyan-glow border-teal/40",
  "Refused": "bg-destructive/20 text-destructive-foreground border-destructive/40",
  "Pending Follow-up": "bg-warn/20 text-warn border-warn/40",
};

function LeadsPage() {
  const { t } = useI18n();
  const { currentBranchId } = useSession();
  const { ensureBranch } = useRequireBranch();
  const qc = useQueryClient();

  const leadsQ = useQuery({
    queryKey: ["leads", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async (): Promise<LeadRow[]> => {
      const { data, error } = await supabase
        .from("leads" as any)
        .select("*")
        .eq("branch_id", currentBranchId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LeadRow[];
    },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LeadRow | null>(null);
  const [form, setForm] = useState<LeadForm>(empty);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAgent, setFilterAgent] = useState<string>("all");

  const tStatus = (s: string) => t(`ls.${s}`) !== `ls.${s}` ? t(`ls.${s}`) : s;

  const start = (l?: LeadRow) => {
    if (l) {
      setEditing(l);
      setForm({
        name: l.name, contact: l.contact, service: l.service, source: l.source,
        assessment_date: l.assessment_date, assessment_attended: l.assessment_attended,
        subscription_type: l.subscription_type, offer: l.offer, status: l.status,
        agent: l.agent, comments: l.comments,
      });
    } else { setEditing(null); setForm(empty); }
    setOpen(true);
  };

  const saveM = useMutation({
    mutationFn: async () => {
      const branchId = ensureBranch();
      if (!branchId) throw new Error("no-branch");
      if (!form.name.trim()) throw new Error(t("lead.nameRequired"));
      if (editing) {
        const { error } = await supabase.from("leads" as any).update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("leads" as any).insert({ ...form, branch_id: branchId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? t("lead.updated") : t("lead.added"));
      qc.invalidateQueries({ queryKey: ["leads", currentBranchId] });
      setOpen(false);
    },
    onError: (e: any) => { if (e?.message !== "no-branch") toast.error(e?.message ?? "Error"); },
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("lead.deleted"));
      qc.invalidateQueries({ queryKey: ["leads", currentBranchId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Error"),
  });

  const leads = leadsQ.data ?? [];
  const filtered = leads.filter(l => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.contact.includes(search)) return false;
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    if (filterAgent !== "all" && l.agent !== filterAgent) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal/15 p-2.5 ring-1 ring-teal/30"><Users className="h-5 w-5 text-cyan-glow" /></div>
          <div>
            <h2 className="text-xl font-bold">{t("pg.leads.h")}</h2>
            <p className="text-xs text-muted-foreground">{leads.length} · {filtered.length}</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => start()} disabled={!currentBranchId} className="bg-gradient-to-r from-teal to-cyan-glow text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4" /> {t("lead.new")}
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? t("lead.edit") : t("lead.new")}</DialogTitle></DialogHeader>
            <BranchGuard compact>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label={t("c.name")}><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label={t("lead.contact")}><Input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} /></Field>
                <Field label={t("lead.service")}><Picker value={form.service} options={SERVICES} onChange={v => setForm({ ...form, service: v })} /></Field>
                <Field label={t("lead.source")}><Picker value={form.source} options={LEAD_SOURCES} onChange={v => setForm({ ...form, source: v })} /></Field>
                <Field label={t("lead.assessmentDate")}><Input type="date" value={form.assessment_date ?? ""} onChange={e => setForm({ ...form, assessment_date: e.target.value || null })} /></Field>
                <Field label={t("lead.assessmentAttended")}>
                  <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-background/30 px-3">
                    <Switch checked={form.assessment_attended} onCheckedChange={v => setForm({ ...form, assessment_attended: v })} />
                    <span className="text-sm text-muted-foreground">{form.assessment_attended ? t("c.yes") : t("c.no")}</span>
                  </div>
                </Field>
                <Field label={t("lead.subType")}><Input value={form.subscription_type} onChange={e => setForm({ ...form, subscription_type: e.target.value })} placeholder="8 Sessions" /></Field>
                <Field label={t("lead.offer")}><Picker value={form.offer} options={OFFERS} onChange={v => setForm({ ...form, offer: v })} /></Field>
                <Field label={t("c.status")}><Picker value={form.status} options={LEAD_STATUSES} onChange={v => setForm({ ...form, status: v })} translate={tStatus} /></Field>
                <Field label={t("lead.agent")}><Picker value={form.agent} options={AGENTS} onChange={v => setForm({ ...form, agent: v })} /></Field>
                <div className="md:col-span-2"><Field label={t("lead.comments")}><Textarea rows={3} value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })} /></Field></div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>{t("c.cancel")}</Button>
                <Button onClick={() => saveM.mutate()} disabled={saveM.isPending} className="bg-gradient-to-r from-teal to-cyan-glow text-primary-foreground">{editing ? t("c.save") : t("c.add")}</Button>
              </div>
            </BranchGuard>
          </DialogContent>
        </Dialog>
      </div>

      <BranchGuard compact>
        <Card className="glass p-3 md:p-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
              <Input placeholder={t("lead.searchPh")} value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rtl:pl-3 rtl:pr-9 bg-background/30" />
            </div>
            <Picker value={filterStatus} options={["all", ...LEAD_STATUSES]} onChange={setFilterStatus} className="w-[200px]" translate={tStatus} />
            <Picker value={filterAgent} options={["all", ...AGENTS]} onChange={setFilterAgent} className="w-[160px]" />
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 mt-3">
          {filtered.map(l => (
            <Card key={l.id} className="glass group relative p-4 transition-all hover:ring-1 hover:ring-teal/40">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-foreground">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.contact}</div>
                </div>
                <Badge className={"rounded-full border " + (statusColor[l.status] ?? "")}>{tStatus(l.status)}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Info k={t("lead.service")} v={l.service} />
                <Info k={t("lead.source")} v={l.source} />
                <Info k={t("lead.agent")} v={l.agent} />
                <Info k={t("lead.offer")} v={l.offer} />
                <Info k={t("lead.assessment")} v={`${l.assessment_date ?? "—"} ${l.assessment_attended ? "✓" : "—"}`} />
                <Info k={t("lead.sub")} v={l.subscription_type || "—"} />
              </div>
              {l.comments && <p className="mt-3 line-clamp-2 text-xs text-muted-foreground/90">"{l.comments}"</p>}
              <div className="mt-3 flex justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                <Button size="sm" variant="ghost" onClick={() => start(l)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => deleteM.mutate(l.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && !leadsQ.isLoading && (
            <Card className="glass col-span-full grid place-items-center p-10 text-sm text-muted-foreground">{t("lead.empty")}</Card>
          )}
        </div>
      </BranchGuard>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md bg-background/30 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="text-xs font-medium text-foreground/95 truncate">{v}</div>
    </div>
  );
}
function Picker({ value, options, onChange, className, translate }: { value: string; options: readonly string[] | string[]; onChange: (v: string) => void; className?: string; translate?: (s: string) => string }) {
  const { t } = useI18n();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={"bg-background/30 " + (className ?? "")}><SelectValue /></SelectTrigger>
      <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o === "all" ? t("c.all") : (translate ? translate(o) : o)}</SelectItem>)}</SelectContent>
    </Select>
  );
}
