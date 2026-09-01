import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Plus, Pencil, Trash2, Boxes, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/academy/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance · United Sports Academy" }] }),
  component: MaintenancePage 
});

type Asset = { id: string; branch_id: string; code: string | null; name: string; name_ar: string | null; category: string | null; location: string | null; status: string; purchase_date: string | null; warranty_expiry: string | null; notes: string | null };
type Ticket = { id: string; branch_id: string; asset_id: string | null; title: string; description: string | null; priority: string; status: string; cost: number | null; resolved_at: string | null; resolution_notes: string | null; created_at: string };

const TICKET_STATUS: Record<string, string> = {
  open: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  in_progress: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  resolved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  cancelled: "bg-slate-500/20 text-slate-300 border-slate-500/40",
};
const PRIORITY: Record<string, string> = {
  low: "text-slate-300",
  medium: "text-cyan-300",
  high: "text-amber-300",
  urgent: "text-rose-300",
};
const ASSET_STATUS: Record<string, string> = {
  operational: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  needs_service: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  out_of_order: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  retired: "bg-slate-500/20 text-slate-300 border-slate-500/40",
};

function MaintenancePage() {
  const { lang } = useI18n();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Wrench className="h-6 w-6 text-cyan-glow" />
          {lang === "ar" ? "الصيانة" : "Maintenance"}
        </h2>
        <p className="text-sm text-muted-foreground">{lang === "ar" ? "أصول وتذاكر الصيانة" : "Assets & service tickets"}</p>
      </div>
      <Tabs defaultValue="tickets">
        <TabsList>
          <TabsTrigger value="tickets"><AlertCircle className="h-4 w-4 mr-1.5" />{lang === "ar" ? "التذاكر" : "Tickets"}</TabsTrigger>
          <TabsTrigger value="assets"><Boxes className="h-4 w-4 mr-1.5" />{lang === "ar" ? "الأصول" : "Assets"}</TabsTrigger>
        </TabsList>
        <TabsContent value="tickets" className="mt-4"><TicketsTab /></TabsContent>
        <TabsContent value="assets" className="mt-4"><AssetsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function AssetsTab() {
  const { currentBranchId } = useSession();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Asset | null>(null);
  const [open, setOpen] = useState(false);

  const { data: assets = [] } = useQuery({
    queryKey: ["m_assets", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_maintenance_assets").select("*").eq("branch_id", currentBranchId!).order("name");
      if (error) throw error; return data as Asset[];
    },
  });

  const save = useMutation({
    mutationFn: async (p: Partial<Asset>) => {
      if (p.id) { const { error } = await supabase.from("ac_maintenance_assets").update(p).eq("id", p.id); if (error) throw error; }
      else { const { error } = await supabase.from("ac_maintenance_assets").insert({ ...p, branch_id: currentBranchId } as any); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["m_assets"] }); setOpen(false); setEditing(null); toast.success(lang === "ar" ? "تم الحفظ" : "Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("ac_maintenance_assets").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["m_assets"] }); toast.success(lang === "ar" ? "تم الحذف" : "Deleted"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button onClick={() => setEditing(null)}><Plus className="h-4 w-4 mr-1.5" />{lang === "ar" ? "أصل جديد" : "New Asset"}</Button></DialogTrigger>
          <AssetDialog editing={editing} onSave={(p) => save.mutate(p)} lang={lang} />
        </Dialog>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {assets.map((a) => (
          <Card key={a.id} className="glass">
            <CardContent className="pt-5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{lang === "ar" ? (a.name_ar || a.name) : a.name}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{a.code || a.category || "—"}</div>
                </div>
                <Badge variant="outline" className={ASSET_STATUS[a.status]}>{a.status}</Badge>
              </div>
              {a.location && <div className="text-xs text-muted-foreground">📍 {a.location}</div>}
              {a.warranty_expiry && <div className="text-xs text-muted-foreground">{lang === "ar" ? "ضمان" : "Warranty"}: {a.warranty_expiry}</div>}
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => { setEditing(a); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                <Button size="sm" variant="outline" onClick={() => del.mutate(a.id)}><Trash2 className="h-3 w-3 text-rose-400" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {assets.length === 0 && <Card className="glass col-span-full"><CardContent className="py-10 text-center text-muted-foreground">{lang === "ar" ? "لا توجد أصول" : "No assets yet"}</CardContent></Card>}
      </div>
    </div>
  );
}

function AssetDialog({ editing, onSave, lang }: { editing: Asset | null; onSave: (p: any) => void; lang: string }) {
  const [form, setForm] = useState<any>(editing ?? { name: "", name_ar: "", code: "", category: "", location: "", status: "operational", purchase_date: "", warranty_expiry: "", notes: "" });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{editing ? (lang === "ar" ? "تعديل أصل" : "Edit Asset") : (lang === "ar" ? "أصل جديد" : "New Asset")}</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{lang === "ar" ? "الاسم" : "Name"}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "الاسم بالعربية" : "Name (AR)"}</Label><Input value={form.name_ar ?? ""} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>{lang === "ar" ? "الكود" : "Code"}</Label><Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "الفئة" : "Category"}</Label><Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "الموقع" : "Location"}</Label><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>{lang === "ar" ? "الحالة" : "Status"}</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.keys(ASSET_STATUS).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{lang === "ar" ? "تاريخ الشراء" : "Purchase"}</Label><Input type="date" value={form.purchase_date ?? ""} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "انتهاء الضمان" : "Warranty"}</Label><Input type="date" value={form.warranty_expiry ?? ""} onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })} /></div>
        </div>
      </div>
      <DialogFooter><Button onClick={() => onSave({
        id: editing?.id, name: form.name, name_ar: form.name_ar || null, code: form.code || null,
        category: form.category || null, location: form.location || null, status: form.status,
        purchase_date: form.purchase_date || null, warranty_expiry: form.warranty_expiry || null, notes: form.notes || null,
      })}>{lang === "ar" ? "حفظ" : "Save"}</Button></DialogFooter>
    </DialogContent>
  );
}

function TicketsTab() {
  const { currentBranchId } = useSession();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: tickets = [] } = useQuery({
    queryKey: ["m_tickets", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_maintenance_tickets").select("*").eq("branch_id", currentBranchId!).order("created_at", { ascending: false });
      if (error) throw error; return data as Ticket[];
    },
  });
  const { data: assets = [] } = useQuery({
    queryKey: ["m_assets_sel", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data } = await supabase.from("ac_maintenance_assets").select("id,name").eq("branch_id", currentBranchId!);
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  const save = useMutation({
    mutationFn: async (p: any) => {
      const { error } = await supabase.from("ac_maintenance_tickets").insert({ ...p, branch_id: currentBranchId } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["m_tickets"] }); setOpen(false); toast.success(lang === "ar" ? "تم الإنشاء" : "Created"); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const patch: any = { status };
      if (status === "resolved") patch.resolved_at = new Date().toISOString();
      const { error } = await supabase.from("ac_maintenance_tickets").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["m_tickets"] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("ac_maintenance_tickets").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["m_tickets"] }); toast.success(lang === "ar" ? "تم الحذف" : "Deleted"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />{lang === "ar" ? "تذكرة جديدة" : "New Ticket"}</Button></DialogTrigger>
          <TicketDialog assets={assets} onSave={(p) => save.mutate(p)} lang={lang} />
        </Dialog>
      </div>
      <Card className="glass">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-2 text-left">{lang === "ar" ? "العنوان" : "Title"}</th><th className="px-4 py-2">{lang === "ar" ? "الأصل" : "Asset"}</th><th className="px-4 py-2">{lang === "ar" ? "الأولوية" : "Priority"}</th><th className="px-4 py-2">{lang === "ar" ? "الحالة" : "Status"}</th><th className="px-4 py-2">{lang === "ar" ? "التكلفة" : "Cost"}</th><th className="px-4 py-2"></th></tr></thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-t border-border/40">
                  <td className="px-4 py-2"><div className="font-medium">{t.title}</div>{t.description && <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>}</td>
                  <td className="px-4 py-2 text-muted-foreground">{assets.find((a) => a.id === t.asset_id)?.name || "—"}</td>
                  <td className="px-4 py-2"><span className={`font-semibold ${PRIORITY[t.priority]}`}>{t.priority}</span></td>
                  <td className="px-4 py-2">
                    <Select value={t.status} onValueChange={(v) => updateStatus.mutate({ id: t.id, status: v })}>
                      <SelectTrigger className="h-7 w-36 text-xs"><Badge variant="outline" className={TICKET_STATUS[t.status]}>{t.status}</Badge></SelectTrigger>
                      <SelectContent>{Object.keys(TICKET_STATUS).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-2">{t.cost ? Number(t.cost).toFixed(2) : "—"}</td>
                  <td className="px-4 py-2 text-right"><Button size="sm" variant="outline" onClick={() => del.mutate(t.id)}><Trash2 className="h-3 w-3 text-rose-400" /></Button></td>
                </tr>
              ))}
              {tickets.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">{lang === "ar" ? "لا توجد تذاكر" : "No tickets"}</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function TicketDialog({ assets, onSave, lang }: { assets: { id: string; name: string }[]; onSave: (p: any) => void; lang: string }) {
  const [form, setForm] = useState<any>({ title: "", description: "", asset_id: "", priority: "medium", status: "open", cost: 0 });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{lang === "ar" ? "تذكرة صيانة جديدة" : "New Maintenance Ticket"}</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div><Label>{lang === "ar" ? "العنوان" : "Title"}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>{lang === "ar" ? "الوصف" : "Description"}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>{lang === "ar" ? "الأصل" : "Asset"}</Label>
            <Select value={form.asset_id} onValueChange={(v) => setForm({ ...form, asset_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{lang === "ar" ? "الأولوية" : "Priority"}</Label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.keys(PRIORITY).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{lang === "ar" ? "التكلفة" : "Cost"}</Label><Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
        </div>
      </div>
      <DialogFooter><Button disabled={!form.title} onClick={() => onSave({
        title: form.title, description: form.description || null,
        asset_id: form.asset_id || null, priority: form.priority, status: form.status, cost: Number(form.cost || 0),
      })}>{lang === "ar" ? "إنشاء" : "Create"}</Button></DialogFooter>
    </DialogContent>
  );
}
