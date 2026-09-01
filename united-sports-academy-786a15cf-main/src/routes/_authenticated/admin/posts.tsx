import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { listPosts, savePost, deletePost } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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

export const Route = createFileRoute("/_authenticated/admin/posts")({
  component: PostsPage,
});

const empty = {
  slug: "",
  title: "",
  title_ar: "",
  excerpt: "",
  excerpt_ar: "",
  content: "",
  content_ar: "",
  cover_image: "",
  author_name: "",
  category: "",
  published: false,
};

function PostsPage() {
  const qc = useQueryClient();
  const list = useServerFn(listPosts);
  const save = useServerFn(savePost);
  const del = useServerFn(deletePost);

  const { data: posts = [], isLoading } = useQuery({ queryKey: ["admin-posts"], queryFn: () => list() });

  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { if (editing) setForm(editing); }, [editing]);

  const saveMut = useMutation({
    mutationFn: (p: any) => save({ data: p }),
    onSuccess: () => {
      toast.success("تم الحفظ");
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message ?? "فشل الحفظ"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      setDeleteId(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">المدونة</h1>
          <p className="text-sm text-muted-foreground">{posts.length} مقال</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> مقال جديد
        </Button>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">جاري التحميل...</div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            مافيش مقالات لسه.
          </div>
        ) : (
          <div className="divide-y">
            {posts.map((p: any) => (
              <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-muted/30">
                {p.cover_image && (
                  <img src={p.cover_image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-bold">{p.title_ar || p.title}</div>
                    <Badge variant={p.published ? "default" : "secondary"}>
                      {p.published ? "منشور" : "مسودة"}
                    </Badge>
                    {p.category && <Badge variant="outline">{p.category}</Badge>}
                  </div>
                  <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {p.excerpt_ar || p.excerpt || "بدون وصف"}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent dir="rtl" className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "تعديل المقال" : "مقال جديد"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="العنوان بالعربي" full>
              <Input value={form.title_ar ?? ""} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} />
            </FormField>
            <FormField label="Title (English)" full>
              <Input dir="ltr" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </FormField>
            <FormField label="المعرّف (Slug)">
              <Input dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} />
            </FormField>
            <FormField label="التصنيف">
              <Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="News / Tips" />
            </FormField>
            <FormField label="اسم الكاتب">
              <Input value={form.author_name ?? ""} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
            </FormField>
            <FormField label="صورة الغلاف (URL)">
              <Input dir="ltr" value={form.cover_image ?? ""} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} placeholder="https://..." />
            </FormField>
            <FormField label="مقتطف بالعربي" full>
              <Textarea rows={2} value={form.excerpt_ar ?? ""} onChange={(e) => setForm({ ...form, excerpt_ar: e.target.value })} />
            </FormField>
            <FormField label="Excerpt (English)" full>
              <Textarea dir="ltr" rows={2} value={form.excerpt ?? ""} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            </FormField>
            <FormField label="المحتوى بالعربي (Markdown)" full>
              <Textarea rows={8} value={form.content_ar ?? ""} onChange={(e) => setForm({ ...form, content_ar: e.target.value })} />
            </FormField>
            <FormField label="Content (English, Markdown)" full>
              <Textarea dir="ltr" rows={8} value={form.content ?? ""} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </FormField>
            <div className="flex items-center justify-between rounded-xl border p-3 sm:col-span-2">
              <div>
                <Label>نشر المقال</Label>
                <p className="text-xs text-muted-foreground">لما يكون شغال هيظهر على الموقع</p>
              </div>
              <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>إلغاء</Button>
            <Button
              onClick={() => saveMut.mutate(form)}
              disabled={saveMut.isPending || !form.title || !form.slug}
            >
              {saveMut.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المقال؟</AlertDialogTitle>
            <AlertDialogDescription>الإجراء نهائي.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && delMut.mutate(deleteId)}
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

function FormField({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs font-bold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
