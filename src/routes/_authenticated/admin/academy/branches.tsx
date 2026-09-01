import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/legends/PermissionGate";

export const Route = createFileRoute("/_authenticated/admin/academy/branches")({
  head: () => ({ meta: [{ title: "Branches · United Sports Academy" }] }),
  component: () => <PermissionGate path="/branches"><BranchesPage /></PermissionGate>,
});

type Branch = {
  id: string; name: string; name_ar: string | null;
  address: string | null; phone: string | null; active: boolean;
};

const blank = { name: "", name_ar: "", address: "", phone: "", active: true };

function BranchesPage() {
  const qc = useQueryClient();
  const { lang } = useI18n();
  const { isSuperAdmin } = useSession();
  const L = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState(blank);

  const branchesQ = useQuery({
    queryKey: ["all-branches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("branches")
        .select("id, name, name_ar, address, phone, active")
        .is("deleted_at", null).order("name");
      if (error) throw error;
      return data as Branch[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error(L("Name required", "الاسم مطلوب"));
      if (editing) {
        const { error } = await supabase.from("branches").update({
          name: form.name, name_ar: form.name_ar || null,
          address: form.address || null, phone: form.phone || null, active: form.active,
        }).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("branches").insert({
          name: form.name, name_ar: form.name_ar || null,
          address: form.address || null, phone: form.phone || null, active: form.active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-branches"] });
      qc.invalidateQueries({ queryKey: ["my-branches"] });
      toast.success(L("Saved", "تم الحفظ"));
      setOpen(false); setEditing(null); setForm(blank);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("branches")
        .update({ deleted_at: new Date().toISOString(), active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-branches"] });
      qc.invalidateQueries({ queryKey: ["my-branches"] });
      toast.success(L("Branch removed", "تم حذف الفرع"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const start = (b?: Branch) => {
    if (b) {
      setEditing(b);
      setForm({
        name: b.name, name_ar: b.name_ar ?? "",
        address: b.address ?? "", phone: b.phone ?? "", active: b.active,
      });
    } else {
      setEditing(null); setForm(blank);
    }
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <Building2 className="h-7 w-7 text-cyan-glow mt-1" />
          <div>
            <h2 className="text-2xl font-bold">{L("Branches", "الفروع")}</h2>
            <p className="text-sm text-muted-foreground">
              {L("Manage academy branches and locations", "إدارة فروع الأكاديمية")}
            </p>
          </div>
        </div>
        {isSuperAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => start()}><Plus className="h-4 w-4 mr-1" />{L("New Branch", "فرع جديد")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? L("Edit Branch", "تعديل الفرع") : L("New Branch", "فرع جديد")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Field label={L("Name (EN)", "الاسم (إنجليزي)")}>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <Field label={L("Name (AR)", "الاسم (عربي)")}>
                  <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
                </Field>
                <Field label={L("Address", "العنوان")}>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </Field>
                <Field label={L("Phone", "الهاتف")}>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Field>
                <div className="flex items-center gap-3 pt-2">
                  <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                  <Label>{L("Active", "نشط")}</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>{L("Cancel", "إلغاء")}</Button>
                <Button onClick={() => save.mutate()} disabled={save.isPending}>
                  {L("Save", "حفظ")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="glass">
        <CardHeader><CardTitle className="text-base">{L("All Branches", "كل الفروع")}</CardTitle></CardHeader>
        <CardContent>
          {branchesQ.isLoading ? (
            <div className="py-8 text-center text-muted-foreground">{L("Loading...", "تحميل...")}</div>
          ) : (branchesQ.data ?? []).length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">{L("No branches yet.", "لا توجد فروع.")}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{L("Name", "الاسم")}</TableHead>
                    <TableHead>{L("Arabic", "عربي")}</TableHead>
                    <TableHead>{L("Phone", "الهاتف")}</TableHead>
                    <TableHead>{L("Address", "العنوان")}</TableHead>
                    <TableHead>{L("Status", "الحالة")}</TableHead>
                    <TableHead className="text-right">{L("Actions", "إجراءات")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(branchesQ.data ?? []).map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell>{b.name_ar ?? "—"}</TableCell>
                      <TableCell>{b.phone ?? "—"}</TableCell>
                      <TableCell className="max-w-xs truncate">{b.address ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={b.active ? "default" : "outline"}>
                          {b.active ? L("Active", "نشط") : L("Inactive", "غير نشط")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isSuperAdmin && (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => start(b)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost"
                              onClick={() => { if (confirm(L("Delete branch?", "حذف الفرع؟"))) del.mutate(b.id); }}>
                              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}
