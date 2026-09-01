import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarRange, Plus, Tag, Users, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/seasons")({
  component: SeasonsPage,
});

type SeasonItem = {
  id: string;
  name: string;
  season: string;
  ages: string;
  price: number;
  earlyBird: number;
  seats: number;
  booked: number;
  active: boolean;
};

const SEED: SeasonItem[] = [
  { id: "s1", name: "Summer Academy 2026", season: "Summer", ages: "6-16", price: 899, earlyBird: 699, seats: 200, booked: 132, active: true },
  { id: "s2", name: "Winter Swim Clinic", season: "Winter", ages: "3-12", price: 449, earlyBird: 349, seats: 80, booked: 68, active: true },
  { id: "s3", name: "Spring Athletic Camp", season: "Spring", ages: "8-18", price: 649, earlyBird: 499, seats: 120, booked: 42, active: true },
  { id: "s4", name: "Autumn League — Basketball", season: "Autumn", ages: "13-17", price: 799, earlyBird: 599, seats: 60, booked: 60, active: false },
];

const emptyDraft: Omit<SeasonItem, "id"> = {
  name: "",
  season: "Summer",
  ages: "",
  price: 0,
  earlyBird: 0,
  seats: 0,
  booked: 0,
  active: true,
};

function SeasonsPage() {
  const [items, setItems] = useState<SeasonItem[]>(SEED);
  const [draft, setDraft] = useState<SeasonItem | null>(null);
  const [saving, setSaving] = useState(false);

  const totalSeats = useMemo(() => items.reduce((sum, item) => sum + item.seats, 0), [items]);
  const totalBooked = useMemo(() => items.reduce((sum, item) => sum + item.booked, 0), [items]);

  const openNew = () => setDraft({
    id: crypto.randomUUID(),
    ...emptyDraft,
  });

  const openEdit = (item: SeasonItem) => setDraft({ ...item });

  const saveDraft = () => {
    if (!draft) return;
    if (!draft.name.trim() || !draft.season.trim() || !draft.ages.trim()) {
      toast.error("الاسم والموسم والفئة العمرية مطلوبة");
      return;
    }

    setSaving(true);
    try {
      setItems((list) => {
        const exists = list.some((x) => x.id === draft.id);
        if (exists) {
          return list.map((x) => (x.id === draft.id ? draft : x));
        }
        return [draft, ...list];
      });
      toast.success(draft.id ? "تم تحديث البرنامج بنجاح" : "تم إضافة برنامج جديد");
      setDraft(null);
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ البرنامج");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = (id: string) => {
    setItems((list) => list.filter((item) => item.id !== id));
    toast.success("تم حذف البرنامج");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black">
            <CalendarRange className="h-6 w-6 text-primary" />
            المواسم والبرامج
          </h1>
          <p className="text-sm text-muted-foreground">
            {items.length} برنامج • {totalBooked} محجوز من {totalSeats} مكان
          </p>
        </div>
        <Button onClick={openNew} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" />
          برنامج جديد
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        {items.map((p) => {
          const pct = p.seats > 0 ? Math.round((p.booked / p.seats) * 100) : 0;
          const soldOut = p.booked >= p.seats;
          return (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="secondary" className="mb-2 rounded-full text-[10px] uppercase">
                    {p.season}
                  </Badge>
                  <div className="text-lg font-black">{p.name}</div>
                  <div className="text-xs text-muted-foreground">الأعمار: {p.ages}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => deleteItem(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Switch checked={p.active} onCheckedChange={(v) => setItems((list) => list.map((x) => x.id === p.id ? { ...x, active: v } : x))} />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Tag className="h-4 w-4 text-primary" />
                <div>
                  <span className="text-2xl font-black">${p.earlyBird}</span>
                  <span className="mr-2 text-sm text-muted-foreground line-through">${p.price}</span>
                </div>
                <Badge className="rounded-full bg-emerald-500/15 text-emerald-500">Early Bird</Badge>
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-3 w-3" /> الأماكن المحجوزة</span>
                  <span className="font-black">{p.booked} / {p.seats}</span>
                </div>
                <Progress value={pct} className={soldOut ? "[&>div]:bg-destructive" : ""} />
                {soldOut && <div className="text-xs font-black text-destructive">مكتمل العدد</div>}
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!draft} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent dir="rtl" className="max-w-2xl rounded-2xl border border-border/60 p-0 shadow-2xl">
          <div className="border-b border-border/60 px-6 py-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-right">
                {draft?.id ? "تعديل البرنامج" : "برنامج جديد"}
              </DialogTitle>
            </DialogHeader>
          </div>

          {draft && (
            <div className="space-y-5 px-6 py-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">اسم البرنامج</Label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="h-11 rounded-xl" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">الموسم</Label>
                  <Input value={draft.season} onChange={(e) => setDraft({ ...draft, season: e.target.value })} className="h-11 rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">الفئة العمرية</Label>
                  <Input value={draft.ages} onChange={(e) => setDraft({ ...draft, ages: e.target.value })} className="h-11 rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">السعر العادي</Label>
                  <Input type="number" min={0} value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value || 0) })} className="h-11 rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">سعر Early Bird</Label>
                  <Input type="number" min={0} value={draft.earlyBird} onChange={(e) => setDraft({ ...draft, earlyBird: Number(e.target.value || 0) })} className="h-11 rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">إجمالي الأماكن</Label>
                  <Input type="number" min={0} value={draft.seats} onChange={(e) => setDraft({ ...draft, seats: Number(e.target.value || 0) })} className="h-11 rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">المحجوز حاليًا</Label>
                  <Input type="number" min={0} value={draft.booked} onChange={(e) => setDraft({ ...draft, booked: Number(e.target.value || 0) })} className="h-11 rounded-xl" />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                <div>
                  <div className="font-medium">نشط</div>
                  <p className="text-xs text-muted-foreground">اظهار البرنامج في القائمة</p>
                </div>
                <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} />
              </div>
            </div>
          )}

          <div className="border-t border-border/60 px-6 py-4">
            <DialogFooter className="sm:justify-between">
              <Button variant="ghost" onClick={() => setDraft(null)} disabled={saving} className="rounded-xl">إلغاء</Button>
              <Button onClick={saveDraft} disabled={saving} className="gap-2 rounded-xl px-5">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                حفظ
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
