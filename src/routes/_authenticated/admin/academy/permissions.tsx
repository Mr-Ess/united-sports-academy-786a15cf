import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { listRows, upsertRow, deleteRow } from "@/lib/academy-crud.functions";

export const Route = createFileRoute("/_authenticated/admin/academy/permissions")({
  component: PermissionsPage,
});

const ROLES = [
  { value: "super_admin", label: "Super Admin" },
  { value: "top_management", label: "الإدارة العليا" },
  { value: "branch_admin", label: "مدير فرع" },
  { value: "finance", label: "مالية" },
  { value: "hr", label: "موارد بشرية" },
  { value: "coach", label: "مدرب" },
  { value: "receptionist", label: "استقبال" },
  { value: "warehouse", label: "مخازن" },
  { value: "procurement", label: "مشتريات" },
  { value: "maintenance", label: "صيانة" },
  { value: "tenant", label: "مستأجر" },
  { value: "trainee", label: "متدرب" },
];

type Row = { id: string; path: string; label_ar: string | null; allowed_roles: string[]; is_public: boolean };

function PermissionsPage() {
  const qc = useQueryClient();
  const list = useServerFn(listRows);
  const save = useServerFn(upsertRow);
  const del = useServerFn(deleteRow);

  const queryKey = ["page_permissions"];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => list({ data: { table: "page_permissions", branch_id: null, order: { column: "path", ascending: true } } }),
  });

  const [local, setLocal] = useState<Record<string, Row>>({});
  useEffect(() => {
    const map: Record<string, Row> = {};
    ((data ?? []) as Row[]).forEach((r) => (map[r.id] = { ...r, allowed_roles: r.allowed_roles ?? [] }));
    setLocal(map);
  }, [data]);

  function toggleRole(id: string, role: string) {
    setLocal((m) => {
      const cur = m[id];
      const has = cur.allowed_roles.includes(role);
      return { ...m, [id]: { ...cur, allowed_roles: has ? cur.allowed_roles.filter((r) => r !== role) : [...cur.allowed_roles, role] } };
    });
  }

  async function persist(row: Row) {
    try {
      await save({ data: { table: "page_permissions", payload: row } });
      toast.success("تم الحفظ");
      qc.invalidateQueries({ queryKey });
    } catch (e) { toast.error((e as Error).message); }
  }

  async function remove(id: string) {
    if (!confirm("حذف الصفحة من القائمة؟")) return;
    await del({ data: { table: "page_permissions", id } });
    qc.invalidateQueries({ queryKey });
  }

  const [open, setOpen] = useState(false);
  const [newRow, setNewRow] = useState({ path: "", label_ar: "" });

  async function addPage() {
    if (!newRow.path) return;
    await save({ data: { table: "page_permissions", payload: { path: newRow.path, label_ar: newRow.label_ar || null, allowed_roles: [], is_public: false } } });
    setNewRow({ path: "", label_ar: "" }); setOpen(false);
    qc.invalidateQueries({ queryKey });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <ShieldCheck className="h-6 w-6 text-primary" /> الأدوار والصلاحيات
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="ml-2 h-4 w-4" /> صفحة جديدة</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إضافة صفحة</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>المسار</Label><Input value={newRow.path} onChange={(e) => setNewRow({ ...newRow, path: e.target.value })} placeholder="/admin/academy/leads" /></div>
              <div><Label>الاسم بالعربي</Label><Input value={newRow.label_ar} onChange={(e) => setNewRow({ ...newRow, label_ar: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={addPage}>حفظ</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <div className="p-8 text-center text-muted-foreground">تحميل...</div>}

      <div className="space-y-3">
        {Object.values(local).map((row) => (
          <Card key={row.id} className="border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-black">{row.label_ar ?? row.path}</div>
                <div className="text-xs text-muted-foreground">{row.path}</div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-black">
                  <Checkbox checked={row.is_public} onCheckedChange={(v) => setLocal((m) => ({ ...m, [row.id]: { ...m[row.id], is_public: !!v } }))} />
                  عام (بدون تسجيل دخول)
                </label>
                <Button size="sm" onClick={() => persist(row)}><Save className="ml-1 h-3 w-3" /> حفظ</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {ROLES.map((r) => (
                <label key={r.value} className="flex items-center gap-2 rounded border p-2 text-xs">
                  <Checkbox checked={row.allowed_roles.includes(r.value)} onCheckedChange={() => toggleRole(row.id, r.value)} />
                  {r.label}
                </label>
              ))}
            </div>
          </Card>
        ))}
        {!isLoading && !Object.keys(local).length && (
          <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
            مافيش صفحات مسجلة. اضغط "صفحة جديدة" عشان تبدأ.
          </Card>
        )}
      </div>
    </div>
  );
}
