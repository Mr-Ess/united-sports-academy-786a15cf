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
import { Users2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PoolsConfigSubNav } from "@/components/legends/SubNav";


export const Route = createFileRoute("/_authenticated/admin/academy/groups")({
  head: () => ({ meta: [{ title: "Groups · United Sports Academy" }] }),
  component: GroupsPage 
});

type Grp = { id: string; branch_id: string; name: string; name_ar: string | null; category: string | null; level: string | null; max_capacity: number; color: string | null; active: boolean };

function GroupsPage() {
  const { currentBranchId } = useSession();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Grp | null>(null);

  const q = useQuery({
    queryKey: ["groups", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_groups").select("*")
        .eq("branch_id", currentBranchId!).order("name");
      if (error) throw error;
      return data as Grp[];
    },
  });

  const save = useMutation({
    mutationFn: async (p: Partial<Grp>) => {
      if (p.id) {
        const { error } = await supabase.from("ac_groups").update(p).eq("id", p.id); if (error) throw error;
      } else {
        const { error } = await supabase.from("ac_groups").insert({ ...p, branch_id: currentBranchId } as any); if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["groups"] }); setOpen(false); setEdit(null); toast.success(lang === "ar" ? "تم الحفظ" : "Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("ac_groups").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });

  return (
    <div className="space-y-6">
      <PoolsConfigSubNav />
      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users2 className="h-6 w-6 text-cyan-glow" />{lang === "ar" ? "المجموعات / الفصول" : "Groups & Classes"}</h2>
          <p className="text-sm text-muted-foreground">{lang === "ar" ? "أنواع الجلسات وسعاتها (خاصة / مجموعة)" : "Session types & capacities (Private / Group / etc.)"}</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEdit(null); }}>
          <DialogTrigger asChild><Button onClick={() => setEdit(null)}><Plus className="h-4 w-4 mr-1.5" />{lang === "ar" ? "مجموعة جديدة" : "New Group"}</Button></DialogTrigger>
          <GroupDialog editing={edit} onSave={save.mutate} lang={lang} />
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(q.data ?? []).length === 0 && (
          <Card className="col-span-full glass"><CardContent className="py-10 text-center text-muted-foreground">{lang === "ar" ? "لا توجد مجموعات" : "No groups yet"}</CardContent></Card>
        )}
        {(q.data ?? []).map((g) => (
          <Card key={g.id} className="glass cursor-pointer" onClick={() => { setEdit(g); setOpen(true); }}>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: g.color ?? "#41C9E2" }} />
              {lang === "ar" ? (g.name_ar || g.name) : g.name}
            </CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <div className="flex justify-between"><span>{lang === "ar" ? "الفئة" : "Category"}</span><span className="text-foreground">{g.category ?? "—"}</span></div>
              <div className="flex justify-between"><span>{lang === "ar" ? "المستوى" : "Level"}</span><span className="text-foreground">{g.level ?? "—"}</span></div>
              <div className="flex justify-between"><span>{lang === "ar" ? "السعة" : "Max capacity"}</span><span className="text-foreground font-semibold">{g.max_capacity}</span></div>
              <div className="pt-2"><Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); del.mutate(g.id); }}><Trash2 className="h-3 w-3 text-rose-400" /></Button></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GroupDialog({ editing, onSave, lang }: { editing: Grp | null; onSave: (p: any) => void; lang: string }) {
  const [form, setForm] = useState<any>(editing ?? { name: "", name_ar: "", category: "", level: "", max_capacity: 10, color: "#41C9E2", active: true });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{editing ? (lang === "ar" ? "تعديل" : "Edit") : (lang === "ar" ? "مجموعة جديدة" : "New Group")}</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{lang === "ar" ? "الاسم" : "Name"}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "بالعربية" : "Name (AR)"}</Label><Input value={form.name_ar ?? ""} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{lang === "ar" ? "الفئة" : "Category"}</Label><Input placeholder="Kids / Adults / Ladies" value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "المستوى" : "Level"}</Label><Input placeholder="Level 1, 2…" value={form.level ?? ""} onChange={(e) => setForm({ ...form, level: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{lang === "ar" ? "السعة القصوى" : "Max capacity"}</Label><Input type="number" min={1} value={form.max_capacity} onChange={(e) => setForm({ ...form, max_capacity: Number(e.target.value) })} /></div>
          <div><Label>{lang === "ar" ? "اللون" : "Color"}</Label><Input type="color" value={form.color ?? "#41C9E2"} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSave({
          id: editing?.id, name: form.name, name_ar: form.name_ar || null,
          category: form.category || null, level: form.level || null,
          max_capacity: Number(form.max_capacity) || 1, color: form.color, active: form.active,
        })}>{lang === "ar" ? "حفظ" : "Save"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
