import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { listCourses, saveCourse, deleteCourse } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/courses")({
  component: AdminCoursesPage,
});

const emptyCourse = {
  slug: "",
  title: "",
  title_ar: "",
  category: "Swimming",
  category_ar: "سباحة",
  mode: "Offline" as const,
  level: "Beginner" as const,
  duration: "",
  duration_ar: "",
  schedule: "",
  schedule_ar: "",
  venue: "",
  venue_ar: "",
  price: 0,
  original_price: null as number | null,
  seats_left: 20,
  total_seats: 20,
  gradient: "from-blue-500 to-indigo-500",
  featured: false,
  published: true,
  start_date: null as string | null,
  end_date: null as string | null,
};

function AdminCoursesPage() {
  const qc = useQueryClient();
  const list = useServerFn(listCourses);
  const save = useServerFn(saveCourse);
  const remove = useServerFn(deleteCourse);

  const { data: courses = [], isLoading } = useQuery({ queryKey: ["admin-courses"], queryFn: () => list() });

  const [editing, setEditing] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const saveMut = useMutation({
    mutationFn: (payload: any) => save({ data: payload }),
    onSuccess: () => {
      toast.success("تم الحفظ");
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message ?? "فشل الحفظ"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message ?? "فشل الحذف"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">الكورسات</h1>
          <p className="text-sm text-muted-foreground">{courses.length} كورس</p>
        </div>
        <Button onClick={() => setEditing({ ...emptyCourse })} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> كورس جديد
        </Button>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">جاري التحميل...</div>
        ) : courses.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            مافيش كورسات لسه. اضغط "كورس جديد" للبدء.
          </div>
        ) : (
          <div className="divide-y">
            {courses.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/30">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-bold">{c.title_ar || c.title}</div>
                    {c.featured && (
                      <Badge className="gap-1 border-0 bg-gradient-to-r from-orange-500 to-rose-500 text-white">
                        <Star className="h-3 w-3" /> مميز
                      </Badge>
                    )}
                    <Badge variant={c.published ? "default" : "secondary"}>
                      {c.published ? "منشور" : "مخفي"}
                    </Badge>
                    <Badge variant="outline">{c.mode}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {c.category_ar} • AED {c.price} • {c.seats_left}/{c.total_seats} مقعد
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(c.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CourseDialog
        course={editing}
        onClose={() => setEditing(null)}
        onSave={(payload) => saveMut.mutate(payload)}
        saving={saveMut.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الكورس؟</AlertDialogTitle>
            <AlertDialogDescription>
              الإجراء ده مش هيرجع. الكورس هيتشال من الموقع نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CourseDialog({
  course,
  onClose,
  onSave,
  saving,
}: {
  course: any | null;
  onClose: () => void;
  onSave: (p: any) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<any>(course);
  // reset when opening
  if (course && form?.id !== course.id && form?.slug !== course.slug) {
    // Use effect-like init on open
  }

  // Re-initialize form each time a new course is opened
  useSyncOnOpen(course, setForm);

  if (!form) return null;

  const upd = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    const payload = {
      ...form,
      price: Number(form.price) || 0,
      original_price: form.original_price ? Number(form.original_price) : null,
      seats_left: Number(form.seats_left) || 0,
      total_seats: Number(form.total_seats) || 0,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };
    onSave(payload);
  };

  return (
    <Dialog open={!!course} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? "تعديل الكورس" : "كورس جديد"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="الاسم بالعربي">
            <Input value={form.title_ar} onChange={(e) => upd("title_ar", e.target.value)} />
          </FormField>
          <FormField label="Name (English)">
            <Input dir="ltr" value={form.title} onChange={(e) => upd("title", e.target.value)} />
          </FormField>
          <FormField label="المعرّف (Slug)">
            <Input dir="ltr" value={form.slug} onChange={(e) => upd("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="my-course" />
          </FormField>
          <FormField label="التصنيف بالعربي">
            <Input value={form.category_ar} onChange={(e) => upd("category_ar", e.target.value)} />
          </FormField>
          <FormField label="Category (English)">
            <Input dir="ltr" value={form.category} onChange={(e) => upd("category", e.target.value)} />
          </FormField>
          <FormField label="طريقة التقديم">
            <Select value={form.mode} onValueChange={(v) => upd("mode", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Offline">حضوري</SelectItem>
                <SelectItem value="Online">أونلاين</SelectItem>
                <SelectItem value="Hybrid">مختلط</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="المستوى">
            <Select value={form.level} onValueChange={(v) => upd("level", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">مبتدئ</SelectItem>
                <SelectItem value="Intermediate">متوسط</SelectItem>
                <SelectItem value="Advanced">متقدم</SelectItem>
                <SelectItem value="All Levels">كل المستويات</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="السعر (AED)">
            <Input type="number" min={0} value={form.price} onChange={(e) => upd("price", e.target.value)} />
          </FormField>
          <FormField label="السعر الأصلي (اختياري)">
            <Input type="number" min={0} value={form.original_price ?? ""} onChange={(e) => upd("original_price", e.target.value || null)} />
          </FormField>
          <FormField label="المقاعد المتاحة">
            <Input type="number" min={0} value={form.seats_left} onChange={(e) => upd("seats_left", e.target.value)} />
          </FormField>
          <FormField label="إجمالي المقاعد">
            <Input type="number" min={0} value={form.total_seats} onChange={(e) => upd("total_seats", e.target.value)} />
          </FormField>
          <FormField label="المدة (عربي)">
            <Input value={form.duration_ar ?? ""} onChange={(e) => upd("duration_ar", e.target.value)} />
          </FormField>
          <FormField label="Duration (English)">
            <Input dir="ltr" value={form.duration ?? ""} onChange={(e) => upd("duration", e.target.value)} />
          </FormField>
          <FormField label="الجدول (عربي)">
            <Input value={form.schedule_ar ?? ""} onChange={(e) => upd("schedule_ar", e.target.value)} />
          </FormField>
          <FormField label="Schedule (English)">
            <Input dir="ltr" value={form.schedule ?? ""} onChange={(e) => upd("schedule", e.target.value)} />
          </FormField>
          <FormField label="المكان (عربي)">
            <Input value={form.venue_ar ?? ""} onChange={(e) => upd("venue_ar", e.target.value)} />
          </FormField>
          <FormField label="Venue (English)">
            <Input dir="ltr" value={form.venue ?? ""} onChange={(e) => upd("venue", e.target.value)} />
          </FormField>
          <FormField label="تاريخ البداية">
            <Input type="date" value={form.start_date ?? ""} onChange={(e) => upd("start_date", e.target.value)} />
          </FormField>
          <FormField label="تاريخ النهاية">
            <Input type="date" value={form.end_date ?? ""} onChange={(e) => upd("end_date", e.target.value)} />
          </FormField>
          <FormField label="تدرج الألوان (CSS)" className="sm:col-span-2">
            <Input dir="ltr" value={form.gradient} onChange={(e) => upd("gradient", e.target.value)} placeholder="from-blue-500 to-indigo-500" />
          </FormField>

          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <Label>منشور</Label>
              <p className="text-xs text-muted-foreground">يظهر على الموقع</p>
            </div>
            <Switch checked={form.published} onCheckedChange={(v) => upd("published", v)} />
          </div>
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <Label>مميز</Label>
              <p className="text-xs text-muted-foreground">شارة "Featured"</p>
            </div>
            <Switch checked={form.featured} onCheckedChange={(v) => upd("featured", v)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.title || !form.title_ar || !form.slug}>
            {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function useSyncOnOpen(course: any, setForm: (v: any) => void) {
  const key = course?.id ?? (course ? "new" : null);
  const [lastKey, setLastKey] = useStateSafe(key);
  if (key !== lastKey) {
    setLastKey(key);
    setForm(course);
  }
}

function useStateSafe<T>(initial: T): [T, (v: T) => void] {
  const [v, s] = useState(initial);
  return [v, s];
}

function FormField({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs font-bold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
