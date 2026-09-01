import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Waves, Plus, Trash2, Pencil, Thermometer, Ruler } from "lucide-react";
import { toast } from "sonner";
import { PoolsConfigSubNav } from "@/components/legends/SubNav";


export const Route = createFileRoute("/_authenticated/admin/academy/pools")({
  head: () => ({ meta: [{ title: "Pools · United Sports Academy" }] }),
  component: PoolsPage 
});

type Pool = {
  id: string; branch_id: string; name: string; name_ar: string | null;
  depth_m: number | null; length_m: number | null; temperature_c: number | null;
  status: string; notes: string | null;
};

function PoolsPage() {
  const { currentBranchId } = useSession();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Pool | null>(null);
  const [open, setOpen] = useState(false);

  const { data: pools = [], isLoading } = useQuery({
    queryKey: ["pools", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_pools").select("*")
        .eq("branch_id", currentBranchId!).is("deleted_at", null).order("name");
      if (error) throw error;
      return data as Pool[];
    },
  });

  const save = useMutation({
    mutationFn: async (p: Partial<Pool>) => {
      if (p.id) {
        const { error } = await supabase.from("ac_pools").update(p).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ac_pools").insert({ ...p, branch_id: currentBranchId } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pools"] }); setOpen(false); setEditing(null); toast.success(lang === "ar" ? "تم الحفظ" : "Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ac_pools").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pools"] }); toast.success(lang === "ar" ? "تم الحذف" : "Deleted"); },
  });

  return (
    <div className="space-y-6">
      <PoolsConfigSubNav />
      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Waves className="h-6 w-6 text-cyan-glow" />
            {lang === "ar" ? "المسابح" : "Pools"}
          </h2>
          <p className="text-sm text-muted-foreground">{lang === "ar" ? "إدارة المسابح حسب الفرع" : "Manage pools per branch"}</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4 mr-1.5" />{lang === "ar" ? "مسبح جديد" : "New Pool"}</Button>
          </DialogTrigger>
          <PoolDialog editing={editing} onSave={(p) => save.mutate(p)} lang={lang} />
        </Dialog>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pools.length === 0 && (
            <Card className="col-span-full glass"><CardContent className="py-10 text-center text-muted-foreground">{lang === "ar" ? "لا يوجد مسبح حتى الآن" : "No pools yet"}</CardContent></Card>
          )}
          {pools.map((p) => (
            <Card key={p.id} className="glass">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{lang === "ar" ? (p.name_ar || p.name) : p.name}</CardTitle>
                  <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/40 text-emerald-300">{p.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {p.length_m && <div className="flex items-center gap-1.5"><Ruler className="h-3.5 w-3.5" />{p.length_m}m</div>}
                  {p.depth_m && <div>↓ {p.depth_m}m</div>}
                  {p.temperature_c && <div className="flex items-center gap-1.5"><Thermometer className="h-3.5 w-3.5" />{p.temperature_c}°C</div>}
                </div>
                {p.notes && <p className="text-xs">{p.notes}</p>}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="outline" onClick={() => del.mutate(p.id)}><Trash2 className="h-3 w-3 text-rose-400" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PoolDialog({ editing, onSave, lang }: { editing: Pool | null; onSave: (p: any) => void; lang: string }) {
  const [form, setForm] = useState<any>(editing ?? { name: "", name_ar: "", depth_m: "", length_m: "", temperature_c: "", status: "active", notes: "" });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{editing ? (lang === "ar" ? "تعديل مسبح" : "Edit Pool") : (lang === "ar" ? "مسبح جديد" : "New Pool")}</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{lang === "ar" ? "الاسم" : "Name"}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "الاسم بالعربية" : "Name (AR)"}</Label><Input value={form.name_ar ?? ""} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>{lang === "ar" ? "الطول (م)" : "Length (m)"}</Label><Input type="number" step="0.1" value={form.length_m ?? ""} onChange={(e) => setForm({ ...form, length_m: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "العمق (م)" : "Depth (m)"}</Label><Input type="number" step="0.1" value={form.depth_m ?? ""} onChange={(e) => setForm({ ...form, depth_m: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "الحرارة" : "Temp °C"}</Label><Input type="number" step="0.1" value={form.temperature_c ?? ""} onChange={(e) => setForm({ ...form, temperature_c: e.target.value })} /></div>
        </div>
        <div><Label>{lang === "ar" ? "ملاحظات" : "Notes"}</Label><Input value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSave({
          id: editing?.id,
          name: form.name, name_ar: form.name_ar || null,
          length_m: form.length_m ? Number(form.length_m) : null,
          depth_m: form.depth_m ? Number(form.depth_m) : null,
          temperature_c: form.temperature_c ? Number(form.temperature_c) : null,
          status: form.status, notes: form.notes || null,
        })}>{lang === "ar" ? "حفظ" : "Save"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
