import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, Loader2, Handshake, ExternalLink, Upload } from "lucide-react";
import { toast } from "sonner";
import { listPartners, savePartner, deletePartner } from "@/lib/admin.functions";
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

export const Route = createFileRoute("/_authenticated/admin/partners")({
  component: PartnersPage,
});

type Partner = {
  id?: string;
  name: string;
  logo_url?: string | null;
  website_url?: string | null;
  tier: "platinum" | "gold" | "silver" | "bronze" | "community";
  sort_order: number;
  published: boolean;
};

const empty: Partner = {
  name: "", logo_url: "", website_url: "", tier: "community", sort_order: 0, published: true,
};

const TIER_META: Record<Partner["tier"], { label: string; className: string }> = {
  platinum:  { label: "بلاتيني", className: "bg-slate-300/20 text-slate-200 border-slate-300/30" },
  gold:      { label: "ذهبي",    className: "bg-amber-400/20 text-amber-300 border-amber-400/30" },
  silver:    { label: "فضي",     className: "bg-zinc-400/20 text-zinc-300 border-zinc-400/30" },
  bronze:    { label: "برونزي",  className: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  community: { label: "مجتمعي",  className: "bg-primary/15 text-primary border-primary/30" },
};

function PartnersPage() {
  const qc = useQueryClient();
  const list = useServerFn(listPartners);
  const save = useServerFn(savePartner);
  const del = useServerFn(deletePartner);

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["admin-partners"],
    queryFn: () => list() as any,
  });

  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState<Partner>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => { if (editing) setForm(editing); }, [editing]);

  useEffect(() => {
    const paths = (partners as Partner[]).map((p) => p.logo_url);
    signMany(paths).then(setUrls);
  }, [partners]);

  const saveMut = useMutation({
    mutationFn: (p: Partner) => save({ data: p }) as any,
    onSuccess: () => {
      toast.success("تم الحفظ");
      qc.invalidateQueries({ queryKey: ["admin-partners"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message ?? "فشل الحفظ"),
  });

  const delMut = useMutation({
    mutationFn: async (item: Partner) => {
      await del({ data: { id: item.id! } });
      await removeFromMedia(item.logo_url);
    },
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin-partners"] });
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message ?? "فشل الحذف"),
  });

  async function handleLogoUpload(file: File) {
    try {
      setUploading(true);
      const path = await uploadToMedia(file, "partners");
      setForm((f) => ({ ...f, logo_url: path }));
      toast.success("تم رفع الشعار");
    } catch (e: any) {
      toast.error(e.message ?? "فشل الرفع");
    } finally {
      setUploading(false);
    }
  }

  const formLogoUrl = form.logo_url
    ? (form.logo_url.startsWith("http") ? form.logo_url : urls[form.logo_url])
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Handshake className="h-6 w-6 text-primary" /> إدارة الشركاء
          </h1>
          <p className="text-sm text-muted-foreground">أضف الشركاء والرعاة وحدّد مستوياتهم</p>
        </div>
        <Button onClick={() => { setForm(empty); setEditing({ ...empty }); }} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> إضافة شريك
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (partners as Partner[]).length === 0 ? (
        <div className="grid min-h-[40vh] place-items-center rounded-3xl border-2 border-dashed bg-card/50">
          <div className="text-center text-sm text-muted-foreground">لا يوجد شركاء بعد</div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {(partners as Partner[]).map((p) => {
            const logo = p.logo_url
              ? (p.logo_url.startsWith("http") ? p.logo_url : urls[p.logo_url])
              : null;
            const meta = TIER_META[p.tier];
            return (
              <Card key={p.id} className="overflow-hidden">
                <div className="grid aspect-[3/2] w-full place-items-center bg-muted/40 p-6">
                  {logo ? (
                    <img src={logo} alt={p.name} className="max-h-full max-w-full object-contain" loading="lazy" />
                  ) : (
                    <Handshake className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="line-clamp-1 text-sm font-black">{p.name}</div>
                    {!p.published && <Badge variant="outline" className="text-[10px]">مخفي</Badge>}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={"rounded-full border " + meta.className}>{meta.label}</Badge>
                    <span className="text-xs text-muted-foreground">#{p.sort_order}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => setEditing(p)}>
                      <Pencil className="h-3 w-3" /> تعديل
                    </Button>
                    {p.website_url && (
                      <Button size="icon" variant="ghost" asChild>
                        <a href={p.website_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(p.id!)}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "تعديل شريك" : "إضافة شريك"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label>الاسم *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <Label>الشعار</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="file" accept="image/*" disabled={uploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }}
                  className="max-w-xs"
                />
                {uploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              </div>
              {formLogoUrl && (
                <div className="mt-2 grid place-items-center rounded-lg border bg-muted/40 p-4">
                  <img src={formLogoUrl} alt="" className="max-h-24 object-contain" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>رابط الموقع</Label>
              <Input dir="ltr" placeholder="https://..." value={form.website_url ?? ""}
                onChange={(e) => setForm({ ...form, website_url: e.target.value })} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>المستوى</Label>
                <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TIER_META) as Partner["tier"][]).map((t) => (
                      <SelectItem key={t} value={t}>{TIER_META[t].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الترتيب</Label>
                <Input type="number" value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value || "0", 10) })} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
              <Label>منشور</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>إلغاء</Button>
            <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending || !form.name} className="gap-2">
              {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الشريك؟</AlertDialogTitle>
            <AlertDialogDescription>هيتشال الشعار من الـ Storage والسجل من الجدول.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const item = (partners as Partner[]).find((p) => p.id === deleteId);
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
