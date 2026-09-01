import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Plus, Pencil, Trash2, FileText, Building } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/academy/procurement")({
  head: () => ({ meta: [{ title: "Procurement · United Sports Academy" }] }),
  component: ProcurementPage 
});

type Supplier = { id: string; branch_id: string; name: string; contact_name: string | null; phone: string | null; email: string | null; address: string | null; active: boolean };
type PO = { id: string; branch_id: string; po_number: string | null; supplier_id: string | null; status: string; order_date: string; expected_date: string | null; total: number; notes: string | null };
type POI = { id: string; po_id: string; description: string; quantity: number; unit_cost: number; line_total: number; received_quantity: number };

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  submitted: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  approved: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  received: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  cancelled: "bg-rose-500/20 text-rose-300 border-rose-500/40",
};

function ProcurementPage() {
  const { lang } = useI18n();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Truck className="h-6 w-6 text-cyan-glow" />
          {lang === "ar" ? "المشتريات" : "Procurement"}
        </h2>
        <p className="text-sm text-muted-foreground">{lang === "ar" ? "إدارة الموردين وأوامر الشراء" : "Suppliers and purchase orders"}</p>
      </div>
      <Tabs defaultValue="po">
        <TabsList>
          <TabsTrigger value="po"><FileText className="h-4 w-4 mr-1.5" />{lang === "ar" ? "أوامر الشراء" : "Purchase Orders"}</TabsTrigger>
          <TabsTrigger value="suppliers"><Building className="h-4 w-4 mr-1.5" />{lang === "ar" ? "الموردون" : "Suppliers"}</TabsTrigger>
        </TabsList>
        <TabsContent value="po" className="mt-4"><POTab /></TabsContent>
        <TabsContent value="suppliers" className="mt-4"><SuppliersTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function SuppliersTab() {
  const { currentBranchId } = useSession();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [open, setOpen] = useState(false);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_suppliers").select("*").eq("branch_id", currentBranchId!).order("name");
      if (error) throw error; return data as Supplier[];
    },
  });

  const save = useMutation({
    mutationFn: async (p: Partial<Supplier>) => {
      if (p.id) { const { error } = await supabase.from("ac_suppliers").update(p).eq("id", p.id); if (error) throw error; }
      else { const { error } = await supabase.from("ac_suppliers").insert({ ...p, branch_id: currentBranchId } as any); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); setOpen(false); setEditing(null); toast.success(lang === "ar" ? "تم الحفظ" : "Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("ac_suppliers").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); toast.success(lang === "ar" ? "تم الحذف" : "Deleted"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button onClick={() => setEditing(null)}><Plus className="h-4 w-4 mr-1.5" />{lang === "ar" ? "مورد جديد" : "New Supplier"}</Button></DialogTrigger>
          <SupplierDialog editing={editing} onSave={(p) => save.mutate(p)} lang={lang} />
        </Dialog>
      </div>
      <Card className="glass">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-2 text-left">{lang === "ar" ? "الاسم" : "Name"}</th><th className="px-4 py-2">{lang === "ar" ? "جهة الاتصال" : "Contact"}</th><th className="px-4 py-2">{lang === "ar" ? "الهاتف" : "Phone"}</th><th className="px-4 py-2">Email</th><th className="px-4 py-2"></th></tr></thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-t border-border/40">
                  <td className="px-4 py-2 font-medium">{s.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{s.contact_name || "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{s.phone || "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{s.email || "—"}</td>
                  <td className="px-4 py-2"><div className="flex gap-1 justify-end">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => del.mutate(s.id)}><Trash2 className="h-3 w-3 text-rose-400" /></Button>
                  </div></td>
                </tr>
              ))}
              {suppliers.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">{lang === "ar" ? "لا يوجد موردون" : "No suppliers"}</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function SupplierDialog({ editing, onSave, lang }: { editing: Supplier | null; onSave: (p: any) => void; lang: string }) {
  const [form, setForm] = useState<any>(editing ?? { name: "", contact_name: "", phone: "", email: "", address: "", active: true });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{editing ? (lang === "ar" ? "تعديل مورد" : "Edit Supplier") : (lang === "ar" ? "مورد جديد" : "New Supplier")}</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div><Label>{lang === "ar" ? "الاسم" : "Name"}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{lang === "ar" ? "جهة الاتصال" : "Contact"}</Label><Input value={form.contact_name ?? ""} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "الهاتف" : "Phone"}</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        </div>
        <div><Label>Email</Label><Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><Label>{lang === "ar" ? "العنوان" : "Address"}</Label><Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
      </div>
      <DialogFooter><Button onClick={() => onSave({ id: editing?.id, ...form })}>{lang === "ar" ? "حفظ" : "Save"}</Button></DialogFooter>
    </DialogContent>
  );
}

function POTab() {
  const { currentBranchId } = useSession();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [activePO, setActivePO] = useState<PO | null>(null);

  const { data: pos = [] } = useQuery({
    queryKey: ["purchase_orders", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_purchase_orders").select("*").eq("branch_id", currentBranchId!).order("order_date", { ascending: false });
      if (error) throw error; return data as PO[];
    },
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers_sel", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data } = await supabase.from("ac_suppliers").select("id,name").eq("branch_id", currentBranchId!).eq("active", true);
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  const create = useMutation({
    mutationFn: async (p: any) => {
      const { data, error } = await supabase.from("ac_purchase_orders").insert({
        branch_id: currentBranchId, po_number: p.po_number || `PO-${Date.now().toString(36).toUpperCase()}`,
        supplier_id: p.supplier_id || null, status: p.status, order_date: p.order_date,
        expected_date: p.expected_date || null, notes: p.notes || null,
      } as any).select().single();
      if (error) throw error;
      return data as PO;
    },
    onSuccess: (po) => { qc.invalidateQueries({ queryKey: ["purchase_orders"] }); setActivePO(po); setOpen(false); toast.success(lang === "ar" ? "تم الإنشاء" : "Created"); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("ac_purchase_orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["purchase_orders"] }); toast.success(lang === "ar" ? "تم التحديث" : "Updated"); },
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("ac_purchase_orders").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["purchase_orders"] }); toast.success(lang === "ar" ? "تم الحذف" : "Deleted"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />{lang === "ar" ? "أمر شراء جديد" : "New PO"}</Button></DialogTrigger>
          <PODialog suppliers={suppliers} onSave={(p) => create.mutate(p)} lang={lang} />
        </Dialog>
      </div>
      <Card className="glass">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-2 text-left">PO #</th><th className="px-4 py-2">{lang === "ar" ? "المورد" : "Supplier"}</th><th className="px-4 py-2">{lang === "ar" ? "التاريخ" : "Date"}</th><th className="px-4 py-2">{lang === "ar" ? "الإجمالي" : "Total"}</th><th className="px-4 py-2">{lang === "ar" ? "الحالة" : "Status"}</th><th className="px-4 py-2"></th></tr></thead>
            <tbody>
              {pos.map((p) => (
                <tr key={p.id} className="border-t border-border/40">
                  <td className="px-4 py-2 font-mono text-xs">{p.po_number}</td>
                  <td className="px-4 py-2 text-muted-foreground">{suppliers.find((s) => s.id === p.supplier_id)?.name || "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{p.order_date}</td>
                  <td className="px-4 py-2">{Number(p.total).toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <Select value={p.status} onValueChange={(v) => updateStatus.mutate({ id: p.id, status: v })}>
                      <SelectTrigger className="h-7 w-32 text-xs"><Badge variant="outline" className={STATUS_COLOR[p.status]}>{p.status}</Badge></SelectTrigger>
                      <SelectContent>{["draft", "submitted", "approved", "received", "cancelled"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-2"><div className="flex gap-1 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setActivePO(p)}>{lang === "ar" ? "بنود" : "Items"}</Button>
                    <Button size="sm" variant="outline" onClick={() => del.mutate(p.id)}><Trash2 className="h-3 w-3 text-rose-400" /></Button>
                  </div></td>
                </tr>
              ))}
              {pos.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">{lang === "ar" ? "لا توجد أوامر شراء" : "No purchase orders"}</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!activePO} onOpenChange={(o) => { if (!o) setActivePO(null); }}>
        {activePO && <POItemsDialog po={activePO} lang={lang} />}
      </Dialog>
    </div>
  );
}

function PODialog({ suppliers, onSave, lang }: { suppliers: { id: string; name: string }[]; onSave: (p: any) => void; lang: string }) {
  const [form, setForm] = useState<any>({ po_number: "", supplier_id: "", status: "draft", order_date: new Date().toISOString().slice(0, 10), expected_date: "", notes: "" });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{lang === "ar" ? "أمر شراء جديد" : "New Purchase Order"}</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>PO #</Label><Input value={form.po_number} onChange={(e) => setForm({ ...form, po_number: e.target.value })} placeholder="auto" /></div>
          <div><Label>{lang === "ar" ? "المورد" : "Supplier"}</Label>
            <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{lang === "ar" ? "تاريخ الطلب" : "Order Date"}</Label><Input type="date" value={form.order_date} onChange={(e) => setForm({ ...form, order_date: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "التاريخ المتوقع" : "Expected"}</Label><Input type="date" value={form.expected_date} onChange={(e) => setForm({ ...form, expected_date: e.target.value })} /></div>
        </div>
        <div><Label>{lang === "ar" ? "ملاحظات" : "Notes"}</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter><Button onClick={() => onSave(form)}>{lang === "ar" ? "إنشاء" : "Create"}</Button></DialogFooter>
    </DialogContent>
  );
}

function POItemsDialog({ po, lang }: { po: PO; lang: string }) {
  const qc = useQueryClient();
  const { currentBranchId } = useSession();
  const [form, setForm] = useState({ description: "", quantity: 1, unit_cost: 0 });

  const { data: items = [] } = useQuery({
    queryKey: ["po_items", po.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_purchase_order_items").select("*").eq("po_id", po.id).order("created_at");
      if (error) throw error; return data as POI[];
    },
  });
  const { data: invItems = [] } = useQuery({
    queryKey: ["inv_items_sel", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data } = await supabase.from("ac_inventory_items").select("id,name").eq("branch_id", currentBranchId!);
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  const total = useMemo(() => items.reduce((s, i) => s + Number(i.line_total), 0), [items]);

  const recalc = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ac_purchase_orders").update({ total }).eq("id", po.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase_orders"] }),
  });

  const addItem = useMutation({
    mutationFn: async () => {
      const line_total = Number(form.quantity) * Number(form.unit_cost);
      const { error } = await supabase.from("ac_purchase_order_items").insert({
        po_id: po.id, description: form.description, quantity: Number(form.quantity),
        unit_cost: Number(form.unit_cost), line_total,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["po_items", po.id] }); setForm({ description: "", quantity: 1, unit_cost: 0 }); recalc.mutate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("ac_purchase_order_items").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["po_items", po.id] }); recalc.mutate(); },
  });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>{po.po_number} — {lang === "ar" ? "بنود الأمر" : "PO Items"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="rounded-md border border-border/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-xs"><tr><th className="px-3 py-2 text-left">{lang === "ar" ? "الوصف" : "Description"}</th><th className="px-3 py-2">{lang === "ar" ? "الكمية" : "Qty"}</th><th className="px-3 py-2">{lang === "ar" ? "السعر" : "Cost"}</th><th className="px-3 py-2">{lang === "ar" ? "الإجمالي" : "Total"}</th><th></th></tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-border/40">
                  <td className="px-3 py-2">{it.description}</td>
                  <td className="px-3 py-2 text-center">{it.quantity}</td>
                  <td className="px-3 py-2 text-center">{Number(it.unit_cost).toFixed(2)}</td>
                  <td className="px-3 py-2 text-center font-semibold">{Number(it.line_total).toFixed(2)}</td>
                  <td className="px-3 py-2"><Button size="sm" variant="ghost" onClick={() => remove.mutate(it.id)}><Trash2 className="h-3 w-3 text-rose-400" /></Button></td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground text-xs">{lang === "ar" ? "لا توجد بنود" : "No items"}</td></tr>}
            </tbody>
            <tfoot><tr className="border-t border-border/60 bg-white/5"><td colSpan={3} className="px-3 py-2 text-right text-xs uppercase text-muted-foreground">{lang === "ar" ? "الإجمالي" : "Total"}</td><td className="px-3 py-2 text-center font-bold text-cyan-glow">{total.toFixed(2)}</td><td></td></tr></tfoot>
          </table>
        </div>
        <div className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-6"><Label className="text-xs">{lang === "ar" ? "الوصف / صنف" : "Description / Item"}</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} list="invlist" />
            <datalist id="invlist">{invItems.map((i) => <option key={i.id} value={i.name} />)}</datalist>
          </div>
          <div className="col-span-2"><Label className="text-xs">Qty</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
          <div className="col-span-2"><Label className="text-xs">Cost</Label><Input type="number" step="0.01" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: Number(e.target.value) })} /></div>
          <div className="col-span-2"><Button className="w-full" disabled={!form.description} onClick={() => addItem.mutate()}><Plus className="h-3 w-3 mr-1" />{lang === "ar" ? "أضف" : "Add"}</Button></div>
        </div>
      </div>
    </DialogContent>
  );
}
