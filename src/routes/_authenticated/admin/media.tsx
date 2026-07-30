import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, Loader2, Upload, Image as ImageIcon, Video, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { listMedia, saveMedia, deleteMedia } from "@/lib/admin.functions";
import { uploadToMedia, signMany, removeFromMedia } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/media")({
  component: MediaPage,
});

type MediaItem = {
  id?: string;
  title?: string | null;
  title_ar?: string | null;
  url: string;
  thumbnail_url?: string | null;
  type: "image" | "video";
  category?: string | null;
  sort_order: number;
  published: boolean;
};

const empty: MediaItem = {
  title: "", title_ar: "", url: "", thumbnail_url: "",
  type: "image", category: "", sort_order: 0, published: true,
};

function MediaPage() {
  const qc = useQueryClient();
  const list = useServerFn(listMedia);
  const save = useServerFn(saveMedia);
  const del = useServerFn(deleteMedia);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-media"],
    queryFn: () => list() as any,
  });

  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [form, setForm] = useState<MediaItem>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => { if (editing) setForm(editing); }, [editing]);

  useEffect(() => {
    const paths = (items as MediaItem[]).flatMap((m) => [m.url, m.thumbnail_url]);
    signMany(paths).then(setUrls);
  }, [items]);

  const filtered = useMemo(
    () => (items as MediaItem[]).filter((m) => filter === "all" ? true : m.type === filter),
    [items, filter],
  );

  const saveMut = useMutation({
    mutationFn: (p: MediaItem) => save({ data: p }) as any,
    onSuccess: () => {
      toast.success("تم الحفظ");
      qc.invalidateQueries({ queryKey: ["admin-media"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message ?? "فشل الحفظ"),
  });

  const delMut = useMutation({
    mutationFn: async (item: MediaItem) => {
      await del({ data: { id: item.id! } });
      await removeFromMedia(item.url);
      await removeFromMedia(item.thumbnail_url);
    },
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin-media"] });
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message ?? "فشل الحذف"),
  });

  async function handleUpload(file: File, target: "url" | "thumbnail_url") {
    try {
      setUploading(true);
      const path = await uploadToMedia(file, target === "url" ? "media" : "thumbs");
      setForm((f) => ({
        ...f,
        [target]: path,
        type: target === "url" ? (file.type.startsWith("video") ? "video" : "image") : f.type,
      }));
      toast.success("تم الرفع");
    } catch (e: any) {
      toast.error(e.message ?? "فشل الرفع");
    } finally {
      setUploading(false);
    }
  }

  const resolvedFormUrl = form.url ? (form.url.startsWith("http") ? form.url : urls[form.url]) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-primary" /> إدارة الوسائط
          </h1>
          <p className="text-sm text-muted-foreground">ارفع الصور والفيديوهات اللي هتظهر في الموقع</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "image", "video"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "all" ? "الكل" : f === "image" ? "صور" : "فيديو"}
            </Button>
          ))}
          <Button onClick={() => { setForm(empty); setEditing({ ...empty }); }} className="gap-2 rounded-xl">
            <Plus className="h-4 w-4" /> إضافة وسائط
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="grid min-h-[40vh] place-items-center rounded-3xl border-2 border-dashed bg-card/50">
          <div className="text-center text-sm text-muted-foreground">لا يوجد وسائط بعد — أضف أول عنصر</div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((m) => {
            const src = m.url.startsWith("http") ? m.url : urls[m.url];
            const thumb = m.thumbnail_url
              ? (m.thumbnail_url.startsWith("http") ? m.thumbnail_url : urls[m.thumbnail_url])
              : null;
            return (
              <Card key={m.id} className="group overflow-hidden">
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {m.type === "image" && src ? (
                    <img src={src} alt={m.title ?? ""} className="h-full w-full object-cover" loading="lazy" />
                  ) : m.type === "video" ? (
                    thumb ? (
                      <img src={thumb} alt={m.title ?? ""} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-muted-foreground">
                        <Video className="h-10 w-10" />
                      </div>
                    )
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge variant="secondary" className="text-[10px] uppercase">{m.type}</Badge>
                    {!m.published && <Badge variant="outline" className="text-[10px]">مخفي</Badge>}
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  <div className="line-clamp-1 text-sm font-black">{m.title_ar || m.title || "بدون عنوان"}</div>
                  <div className="text-xs text-muted-foreground">{m.category || "—"} · ترتيب {m.sort_order}</div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => setEditing(m)}>
                      <Pencil className="h-3 w-3" /> تعديل
                    </Button>
                    {src && (
                      <Button size="icon" variant="ghost" asChild>
                        <a href={src} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(m.id!)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "تعديل وسائط" : "إضافة وسائط"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>العنوان (English)</Label>
              <Input dir="ltr" value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>العنوان (عربي)</Label>
              <Input value={form.title_ar ?? ""} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>النوع</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">صورة</SelectItem>
                  <SelectItem value="video">فيديو</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>التصنيف</Label>
              <Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="مثال: أحداث، تدريبات" />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label>الملف الأساسي</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="file"
                  accept={form.type === "video" ? "video/*" : "image/*"}
                  disabled={uploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "url"); }}
                  className="max-w-xs"
                />
                {uploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                <span className="text-xs text-muted-foreground truncate">{form.url || "—"}</span>
              </div>
              <Input
                dir="ltr" placeholder="أو الصق رابط خارجي (https://...)"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
              {resolvedFormUrl && form.type === "image" && (
                <img src={resolvedFormUrl} alt="" className="mt-2 h-32 rounded-lg border object-cover" />
              )}
            </div>

            {form.type === "video" && (
              <div className="sm:col-span-2 space-y-1.5">
                <Label>صورة مصغّرة (اختياري)</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="file" accept="image/*" disabled={uploading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "thumbnail_url"); }}
                    className="max-w-xs"
                  />
                  <span className="text-xs text-muted-foreground truncate">{form.thumbnail_url || "—"}</span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>الترتيب</Label>
              <Input type="number" value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value || "0", 10) })} />
            </div>
            <div className="flex items-end gap-3">
              <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
              <Label>منشور</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>إلغاء</Button>
            <Button
              onClick={() => saveMut.mutate(form)}
              disabled={saveMut.isPending || !form.url}
              className="gap-2"
            >
              {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الوسائط؟</AlertDialogTitle>
            <AlertDialogDescription>الملف هيتشال من الـ Storage والسجل من الجدول.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const item = (items as MediaItem[]).find((m) => m.id === deleteId);
                if (item) delMut.mutate(item);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
