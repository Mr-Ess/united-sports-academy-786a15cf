import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Plus, Pencil, Trash2, Phone, Clock } from "lucide-react";
import { BRANCHES } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/branches")({
  component: BranchesPage,
});

type Branch = { id: string; name: string; nameAr: string; phone: string; email: string; hours: string; address: string; map: string };

function BranchesPage() {
  const [items, setItems] = useState<Branch[]>(BRANCHES.map(b => ({ ...b })));
  const [editing, setEditing] = useState<Branch | null>(null);
  const [open, setOpen] = useState(false);

  const openNew = () => {
    setEditing({ id: `b-${Date.now()}`, name: "", nameAr: "", phone: "", email: "", hours: "", address: "", map: "" });
    setOpen(true);
  };
  const openEdit = (b: Branch) => { setEditing({ ...b }); setOpen(true); };
  const save = () => {
    if (!editing) return;
    setItems(list => list.find(x => x.id === editing.id) ? list.map(x => x.id === editing.id ? editing : x) : [...list, editing]);
    setOpen(false);
    toast.success("تم الحفظ");
  };
  const remove = (id: string) => {
    setItems(list => list.filter(x => x.id !== id));
    toast.success("تم الحذف");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">إدارة الفروع</h1>
          <p className="text-sm text-muted-foreground">أضف الفروع، المواعيد، خرائط جوجل، وصور المنشآت</p>
        </div>
        <Button onClick={openNew}><Plus className="ml-2 h-4 w-4" /> فرع جديد</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map(b => (
          <Card key={b.id} className="overflow-hidden">
            <div className="aspect-video w-full bg-muted">
              {b.map ? (
                <iframe src={b.map} className="h-full w-full" title={b.name} loading="lazy" />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground"><MapPin className="h-8 w-8" /></div>
              )}
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-black">{b.nameAr}</div>
                  <div className="text-xs text-muted-foreground" dir="ltr">{b.name}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {b.address}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground" dir="ltr"><Phone className="h-3 w-3" /> {b.phone}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {b.hours}</div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.name ? "تعديل فرع" : "فرع جديد"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>الاسم (عربي)</Label><Input value={editing.nameAr} onChange={e => setEditing({ ...editing, nameAr: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Name (EN)</Label><Input dir="ltr" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>هاتف</Label><Input dir="ltr" value={editing.phone} onChange={e => setEditing({ ...editing, phone: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>إيميل</Label><Input dir="ltr" value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>العنوان</Label><Input value={editing.address} onChange={e => setEditing({ ...editing, address: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>ساعات العمل</Label><Input value={editing.hours} onChange={e => setEditing({ ...editing, hours: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Google Maps embed URL</Label><Textarea dir="ltr" rows={2} value={editing.map} onChange={e => setEditing({ ...editing, map: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={save}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
