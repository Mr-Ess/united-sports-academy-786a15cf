import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Phone, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { listSubmissions, updateSubmissionStatus, deleteSubmission } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export const Route = createFileRoute("/_authenticated/admin/submissions")({
  component: SubmissionsPage,
});

const TYPE_LABELS: Record<string, string> = {
  member: "عضوية",
  coach: "توظيف",
  volunteer: "تطوع",
  workshop: "ورشة",
};
const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  approved: "مقبول",
  rejected: "مرفوض",
};
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  contacted: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

function SubmissionsPage() {
  const qc = useQueryClient();
  const list = useServerFn(listSubmissions);
  const upd = useServerFn(updateSubmissionStatus);
  const del = useServerFn(deleteSubmission);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-submissions"],
    queryFn: () => list(),
  });

  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState<any | null>(null);
  const [notes, setNotes] = useState("");

  const updMut = useMutation({
    mutationFn: (p: any) => upd({ data: p }),
    onSuccess: () => {
      toast.success("تم التحديث");
      qc.invalidateQueries({ queryKey: ["admin-submissions"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setOpen(null);
    },
    onError: (e: any) => toast.error(e.message ?? "فشل التحديث"),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin-submissions"] });
      setOpen(null);
    },
  });

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((r: any) => r.status === filter)),
    [rows, filter],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length, new: 0, contacted: 0, approved: 0, rejected: 0 };
    rows.forEach((r: any) => (c[r.status] = (c[r.status] ?? 0) + 1));
    return c;
  }, [rows]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">الطلبات الواردة</h1>
        <p className="text-sm text-muted-foreground">{rows.length} طلب إجمالي</p>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">الكل ({counts.all})</TabsTrigger>
          <TabsTrigger value="new">جديد ({counts.new ?? 0})</TabsTrigger>
          <TabsTrigger value="contacted">تم التواصل ({counts.contacted ?? 0})</TabsTrigger>
          <TabsTrigger value="approved">مقبول ({counts.approved ?? 0})</TabsTrigger>
          <TabsTrigger value="rejected">مرفوض ({counts.rejected ?? 0})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">مافيش طلبات</div>
        ) : (
          <div className="divide-y">
            {filtered.map((s: any) => (
              <button
                key={s.id}
                onClick={() => { setOpen(s); setNotes(s.notes ?? ""); }}
                className="flex w-full items-center justify-between gap-4 p-4 text-right hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{s.full_name}</span>
                    <Badge variant="outline">{TYPE_LABELS[s.type] ?? s.type}</Badge>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[s.status]}`}>
                      {STATUS_LABELS[s.status]}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground" dir="ltr">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</span>
                    {s.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</span>}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground" dir="ltr">
                  {new Date(s.created_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{open?.full_name}</DialogTitle>
          </DialogHeader>
          {open && (
            <div className="space-y-3 text-sm">
              <Row label="النوع" value={TYPE_LABELS[open.type] ?? open.type} />
              <Row label="الإيميل" value={open.email} ltr />
              {open.phone && <Row label="الهاتف" value={open.phone} ltr />}
              {open.age && <Row label="العمر" value={String(open.age)} />}
              {open.gender && <Row label="النوع" value={open.gender} />}
              {open.interest && <Row label="الاهتمام" value={open.interest} />}
              {open.message && (
                <div>
                  <div className="mb-1 text-xs font-bold text-muted-foreground">الرسالة</div>
                  <div className="rounded-xl border bg-muted/30 p-3 text-sm">{open.message}</div>
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-bold text-muted-foreground">الحالة</div>
                  <Select
                    value={open.status}
                    onValueChange={(v) => setOpen({ ...open, status: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([k, l]) => (
                        <SelectItem key={k} value={k}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs font-bold text-muted-foreground">ملاحظات داخلية</div>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between gap-2 sm:justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => open && delMut.mutate(open.id)}
              disabled={delMut.isPending}
            >
              <Trash2 className="ml-1 h-4 w-4" /> حذف
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setOpen(null)}>إغلاق</Button>
              <Button
                onClick={() => open && updMut.mutate({ id: open.id, status: open.status, notes })}
                disabled={updMut.isPending}
              >
                {updMut.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2">
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
      <span className="text-sm" dir={ltr ? "ltr" : "rtl"}>{value}</span>
    </div>
  );
}
