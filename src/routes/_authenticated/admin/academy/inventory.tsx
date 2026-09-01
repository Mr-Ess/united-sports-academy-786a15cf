import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, Pencil, Trash2, ArrowDownToLine, ArrowUpFromLine, Settings2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/academy/inventory")({
  head: () => ({ meta: [{ title: "Inventory · United Sports Academy" }] }),
  component: InventoryPage 
});

type Item = {
  id: string; branch_id: string; sku: string | null; name: string; name_ar: string | null;
  category: string | null; unit: string | null; quantity: number; min_quantity: number;
  unit_cost: number; location: string | null; notes: string | null;
};
type Movement = {
  id: string; item_id: string; movement_type: "in" | "out" | "adjust" | "transfer";
  quantity: number; unit_cost: number | null; reference: string | null; notes: string | null;
  created_at: string;
};

function InventoryPage() {
  const { currentBranchId } = useSession();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const [moveItem, setMoveItem] = useState<Item | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["inventory_items", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_inventory_items").select("*")
        .eq("branch_id", currentBranchId!).order("name");
      if (error) throw error;
      return data as Item[];
    },
  });

  const { data: movements = [] } = useQuery({
    queryKey: ["inventory_movements", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_inventory_movements").select("*")
        .eq("branch_id", currentBranchId!).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data as Movement[];
    },
  });

  const lowStock = useMemo(() => items.filter((i) => Number(i.quantity) <= Number(i.min_quantity)), [items]);
  const totalValue = useMemo(() => items.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_cost), 0), [items]);

  const save = useMutation({
    mutationFn: async (p: Partial<Item>) => {
      if (p.id) {
        const { error } = await supabase.from("ac_inventory_items").update(p).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ac_inventory_items").insert({ ...p, branch_id: currentBranchId } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory_items"] }); setOpen(false); setEditing(null); toast.success(lang === "ar" ? "تم الحفظ" : "Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("ac_inventory_items").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory_items"] }); toast.success(lang === "ar" ? "تم الحذف" : "Deleted"); },
  });
  const move = useMutation({
    mutationFn: async (m: { item_id: string; type: string; quantity: number; unit_cost?: number; reference?: string; notes?: string }) => {
      const { error } = await supabase.from("ac_inventory_movements").insert({
        branch_id: currentBranchId, item_id: m.item_id, movement_type: m.type,
        quantity: m.quantity, unit_cost: m.unit_cost ?? 0, reference: m.reference ?? null, notes: m.notes ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory_items"] });
      qc.invalidateQueries({ queryKey: ["inventory_movements"] });
      setMoveOpen(false); setMoveItem(null);
      toast.success(lang === "ar" ? "تم تسجيل الحركة" : "Movement recorded");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-cyan-glow" />
            {lang === "ar" ? "المخزون" : "Inventory"}
          </h2>
          <p className="text-sm text-muted-foreground">{lang === "ar" ? "إدارة الأصناف وحركات المخزون" : "Manage stock items & movements"}</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4 mr-1.5" />{lang === "ar" ? "صنف جديد" : "New Item"}</Button>
          </DialogTrigger>
          <ItemDialog editing={editing} onSave={(p) => save.mutate(p)} lang={lang} />
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="glass"><CardContent className="pt-6"><div className="text-xs text-muted-foreground">{lang === "ar" ? "الأصناف" : "Items"}</div><div className="text-2xl font-bold">{items.length}</div></CardContent></Card>
        <Card className="glass"><CardContent className="pt-6"><div className="text-xs text-muted-foreground">{lang === "ar" ? "قيمة المخزون" : "Stock Value"}</div><div className="text-2xl font-bold text-cyan-glow">{totalValue.toFixed(2)}</div></CardContent></Card>
        <Card className="glass"><CardContent className="pt-6"><div className="text-xs text-muted-foreground flex items-center gap-1.5"><AlertTriangle className="h-3 w-3 text-amber-400" />{lang === "ar" ? "أصناف منخفضة" : "Low Stock"}</div><div className="text-2xl font-bold text-amber-400">{lowStock.length}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">{lang === "ar" ? "الأصناف" : "Items"}</TabsTrigger>
          <TabsTrigger value="movements">{lang === "ar" ? "الحركات" : "Movements"}</TabsTrigger>
        </TabsList>
        <TabsContent value="items" className="mt-4">
          <Card className="glass">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-xs uppercase text-muted-foreground">
                  <tr><th className="px-4 py-2 text-left">{lang === "ar" ? "الاسم" : "Name"}</th><th className="px-4 py-2">SKU</th><th className="px-4 py-2">{lang === "ar" ? "الفئة" : "Category"}</th><th className="px-4 py-2">{lang === "ar" ? "الكمية" : "Qty"}</th><th className="px-4 py-2">{lang === "ar" ? "التكلفة" : "Cost"}</th><th className="px-4 py-2">{lang === "ar" ? "الموقع" : "Location"}</th><th className="px-4 py-2"></th></tr>
                </thead>
                <tbody>
                  {items.map((i) => {
                    const low = Number(i.quantity) <= Number(i.min_quantity);
                    return (
                      <tr key={i.id} className="border-t border-border/40">
                        <td className="px-4 py-2 font-medium">{lang === "ar" ? (i.name_ar || i.name) : i.name}</td>
                        <td className="px-4 py-2 text-muted-foreground">{i.sku || "—"}</td>
                        <td className="px-4 py-2 text-muted-foreground">{i.category || "—"}</td>
                        <td className="px-4 py-2"><Badge variant="outline" className={low ? "border-amber-500/40 text-amber-300 bg-amber-500/10" : "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"}>{i.quantity} {i.unit}</Badge></td>
                        <td className="px-4 py-2">{Number(i.unit_cost).toFixed(2)}</td>
                        <td className="px-4 py-2 text-muted-foreground">{i.location || "—"}</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="outline" title="In" onClick={() => { setMoveItem(i); setMoveOpen(true); }}><ArrowDownToLine className="h-3 w-3 text-emerald-400" /></Button>
                            <Button size="sm" variant="outline" onClick={() => { setEditing(i); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                            <Button size="sm" variant="outline" onClick={() => del.mutate(i.id)}><Trash2 className="h-3 w-3 text-rose-400" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">{lang === "ar" ? "لا توجد أصناف" : "No items yet"}</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="movements" className="mt-4">
          <Card className="glass">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-xs uppercase text-muted-foreground">
                  <tr><th className="px-4 py-2 text-left">{lang === "ar" ? "التاريخ" : "Date"}</th><th className="px-4 py-2">{lang === "ar" ? "الصنف" : "Item"}</th><th className="px-4 py-2">{lang === "ar" ? "النوع" : "Type"}</th><th className="px-4 py-2">{lang === "ar" ? "الكمية" : "Qty"}</th><th className="px-4 py-2">{lang === "ar" ? "المرجع" : "Ref"}</th></tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const item = items.find((x) => x.id === m.item_id);
                    const color = m.movement_type === "in" ? "text-emerald-300" : m.movement_type === "out" ? "text-rose-300" : "text-cyan-glow";
                    return (
                      <tr key={m.id} className="border-t border-border/40">
                        <td className="px-4 py-2 text-muted-foreground">{new Date(m.created_at).toLocaleString()}</td>
                        <td className="px-4 py-2">{item ? (lang === "ar" ? (item.name_ar || item.name) : item.name) : "—"}</td>
                        <td className={`px-4 py-2 font-semibold ${color}`}>{m.movement_type.toUpperCase()}</td>
                        <td className="px-4 py-2">{m.quantity}</td>
                        <td className="px-4 py-2 text-muted-foreground">{m.reference || m.notes || "—"}</td>
                      </tr>
                    );
                  })}
                  {movements.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">{lang === "ar" ? "لا توجد حركات" : "No movements"}</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={moveOpen} onOpenChange={(o) => { setMoveOpen(o); if (!o) setMoveItem(null); }}>
        <MovementDialog item={moveItem} onSave={(m) => move.mutate(m)} lang={lang} />
      </Dialog>
    </div>
  );
}

function ItemDialog({ editing, onSave, lang }: { editing: Item | null; onSave: (p: any) => void; lang: string }) {
  const [form, setForm] = useState<any>(editing ?? { name: "", name_ar: "", sku: "", category: "", unit: "pcs", quantity: 0, min_quantity: 0, unit_cost: 0, location: "", notes: "" });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{editing ? (lang === "ar" ? "تعديل صنف" : "Edit Item") : (lang === "ar" ? "صنف جديد" : "New Item")}</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{lang === "ar" ? "الاسم" : "Name"}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "الاسم بالعربية" : "Name (AR)"}</Label><Input value={form.name_ar ?? ""} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>SKU</Label><Input value={form.sku ?? ""} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "الفئة" : "Category"}</Label><Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "الوحدة" : "Unit"}</Label><Input value={form.unit ?? "pcs"} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>{lang === "ar" ? "الكمية" : "Quantity"}</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "حد التنبيه" : "Min Qty"}</Label><Input type="number" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "التكلفة" : "Unit Cost"}</Label><Input type="number" step="0.01" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} /></div>
        </div>
        <div><Label>{lang === "ar" ? "الموقع" : "Location"}</Label><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSave({
          id: editing?.id, name: form.name, name_ar: form.name_ar || null, sku: form.sku || null,
          category: form.category || null, unit: form.unit || "pcs",
          quantity: Number(form.quantity || 0), min_quantity: Number(form.min_quantity || 0),
          unit_cost: Number(form.unit_cost || 0), location: form.location || null, notes: form.notes || null,
        })}>{lang === "ar" ? "حفظ" : "Save"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function MovementDialog({ item, onSave, lang }: { item: Item | null; onSave: (m: any) => void; lang: string }) {
  const [form, setForm] = useState<any>({ type: "in", quantity: 1, unit_cost: 0, reference: "", notes: "" });
  if (!item) return null;
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{lang === "ar" ? `حركة مخزون — ${item.name_ar || item.name}` : `Stock Movement — ${item.name}`}</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div><Label>{lang === "ar" ? "النوع" : "Type"}</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="in"><span className="inline-flex items-center gap-2"><ArrowDownToLine className="h-3.5 w-3.5 text-emerald-400" />{lang === "ar" ? "إدخال" : "Stock In"}</span></SelectItem>
              <SelectItem value="out"><span className="inline-flex items-center gap-2"><ArrowUpFromLine className="h-3.5 w-3.5 text-rose-400" />{lang === "ar" ? "إخراج" : "Stock Out"}</span></SelectItem>
              <SelectItem value="adjust"><span className="inline-flex items-center gap-2"><Settings2 className="h-3.5 w-3.5 text-cyan-glow" />{lang === "ar" ? "تسوية (الرصيد النهائي)" : "Adjust (set total)"}</span></SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{lang === "ar" ? "الكمية" : "Quantity"}</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "تكلفة الوحدة" : "Unit Cost"}</Label><Input type="number" step="0.01" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} /></div>
        </div>
        <div><Label>{lang === "ar" ? "المرجع" : "Reference"}</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
        <div><Label>{lang === "ar" ? "ملاحظات" : "Notes"}</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSave({ item_id: item.id, type: form.type, quantity: Number(form.quantity), unit_cost: Number(form.unit_cost), reference: form.reference, notes: form.notes })}>{lang === "ar" ? "تسجيل" : "Record"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
