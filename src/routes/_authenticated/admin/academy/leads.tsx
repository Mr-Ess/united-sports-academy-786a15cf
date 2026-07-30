import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users, Plus, Search, Trash2, Pencil, X, Loader2, LayoutGrid, KanbanSquare, ArrowRightLeft } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BranchGuard } from "@/components/academy/BranchGuard";
import { OsHeader, OsCard, StatusPill } from "@/components/academy/OsUI";
import { useAcademyTable, str, type Row } from "@/lib/use-academy-table";
import { convertLead } from "@/lib/leads.functions";
import { exportCSV, exportExcel, exportPDF } from "@/lib/export-utils";

export const Route = createFileRoute("/_authenticated/admin/academy/leads")({
  component: LeadsPage,
});

const STATUSES = [
  { value: "warm", label: "بانتظار المتابعة", tone: "orange" as const },
  { value: "hot", label: "مهتم جداً", tone: "cyan" as const },
  { value: "converted", label: "عميل دائم", tone: "cyan" as const },
  { value: "cold", label: "بارد", tone: "muted" as const },
  { value: "lost", label: "مفقود", tone: "red" as const },
];

const SERVICES = ["Kids", "Adults", "Ladies only", "Diving", "Aqua Baby", "Para Swim", "Open Pool", "Hydrotherapy"];
const SOURCES = ["Social media", "Call", "WhatsApp", "Referral", "Walk-in"];
const SUBSCRIPTIONS = ["Sessions 8", "Sessions 12", "Sessions 16", "Monthly", "Quarterly"];
const OFFERS = ["None", "5%", "10%", "15%", "20%", "25%"];
const STAFF = ["Mero", "Nada", "Abdelkader", "Mohamed Ali", "Salma"];

const EMPTY: Row = {
  full_name: "",
  phone: "",
  service: "Kids",
  source: "Social media",
  evaluation_date: "",
  attended: false,
  subscription_type: "Sessions 8",
  offer_label: "None",
  status: "warm",
  assigned_staff: "Mero",
  notes: "",
};

function statusMeta(v: unknown) {
  return STATUSES.find((s) => s.value === str(v)) ?? STATUSES[0];
}

function LeadsPage() {
  const { rows, isLoading, upsert, destroy, invalidate } = useAcademyTable("leads", { realtime: true });
  const convert = useServerFn(convertLead);
  const [q, setQ] = useState("");
  const [fService, setFService] = useState("الكل");
  const [fStatus, setFStatus] = useState("الكل");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Row>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const hit = !q || `${str(r.full_name)} ${str(r.phone)}`.toLowerCase().includes(q.toLowerCase());
        const s = fService === "الكل" || str(r.service) === fService;
        const st = fStatus === "الكل" || str(r.status) === fStatus;
        return hit && s && st;
      }),
    [rows, q, fService, fStatus],
  );

  function openNew() {
    setDraft({ ...EMPTY });
    setOpen(true);
  }
  function openEdit(r: Row) {
    setDraft({ ...r });
    setOpen(true);
  }

  async function submit() {
    if (!str(draft.full_name).trim()) {
      toast.error("الاسم مطلوب");
      return;
    }
    setSaving(true);
    const payload: Row = { ...draft };
    if (!payload.evaluation_date) delete payload.evaluation_date;
    const ok = await upsert(payload);
    setSaving(false);
    if (ok) {
      toast.success("تم الحفظ");
      setOpen(false);
    }
  }

  async function handleConvert(id: string) {
    setBusy(id);
    try {
      await convert({ data: { leadId: id } });
      toast.success("تم تحويل العميل المحتمل لمتدرب");
      invalidate();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  function doExport(kind: "csv" | "xlsx" | "pdf") {
    const flat = filtered.map((r) => ({
      name: str(r.full_name),
      phone: str(r.phone),
      service: str(r.service),
      source: str(r.source),
      staff: str(r.assigned_staff),
      offer: str(r.offer_label),
      subscription: str(r.subscription_type),
      status: statusMeta(r.status).label,
    }));
    if (kind === "csv") exportCSV(flat, "leads");
    if (kind === "xlsx") exportExcel(flat, "leads", "Leads");
    if (kind === "pdf") exportPDF(flat, "leads", "Leads");
  }

  return (
    <BranchGuard>
      <OsHeader
        icon={Users}
        title="العملاء المحتملون وإدارة العلاقات"
        subtitle="كل سجل جديد سيتم ربطه بالفرع النشط"
        count={filtered.length}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => doExport("csv")}>CSV</Button>
            <Button variant="outline" size="sm" onClick={() => doExport("xlsx")}>Excel</Button>
            <Button variant="outline" size="sm" onClick={() => doExport("pdf")}>PDF</Button>
            <Button size="sm" onClick={openNew}>
              <Plus className="ml-1 h-4 w-4" /> عميل جديد
            </Button>
          </>
        }
      />

      <OsCard className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pr-9" placeholder="ابحث بالاسم أو الهاتف" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-xs"
            value={fService}
            onChange={(e) => setFService(e.target.value)}
          >
            <option>الكل</option>
            {SERVICES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-xs"
            value={fStatus}
            onChange={(e) => setFStatus(e.target.value)}
          >
            <option value="الكل">الكل</option>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </OsCard>

      {isLoading ? (
        <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const m = statusMeta(r.status);
            return (
              <div key={str(r.id)} className="os-card p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-bold">{str(r.full_name)}</div>
                    <div className="text-xs text-muted-foreground" dir="ltr">{str(r.phone) || "—"}</div>
                  </div>
                  <StatusPill tone={m.tone}>{m.label}</StatusPill>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Field label="الخدمة" value={str(r.service)} />
                  <Field label="المصدر" value={str(r.source)} />
                  <Field label="الموظف المسؤول" value={str(r.assigned_staff)} />
                  <Field label="العرض / الخصم" value={str(r.offer_label) || "None"} />
                  <Field label="التقييم" value={str(r.evaluation_date) || "—"} />
                  <Field label="الاشتراك" value={str(r.subscription_type)} />
                </div>
                {r.notes ? (
                  <p className="mt-3 border-t border-white/5 pt-2 text-[11px] italic text-muted-foreground">"{str(r.notes)}"</p>
                ) : null}
                <div className="mt-3 flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300"
                    onClick={() => destroy(str(r.id))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(r)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {str(r.status) !== "converted" && (
                    <Button size="sm" variant="ghost" className="h-8 px-2 text-[11px] text-primary"
                      disabled={busy === str(r.id)} onClick={() => handleConvert(str(r.id))}>
                      <ArrowRightLeft className="ml-1 h-3.5 w-3.5" /> تحويل لمتدرب
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {!filtered.length && (
            <div className="os-card col-span-full p-10 text-center text-sm text-muted-foreground">
              <LayoutGrid className="mx-auto mb-2 h-6 w-6" /> لا توجد نتائج
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-3" onClick={() => setOpen(false)}>
          <div
            dir="rtl"
            className="os-card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <KanbanSquare className="h-5 w-5 text-primary" /> {draft.id ? "تعديل عميل" : "عميل جديد"}
              </h2>
              <Button size="icon" variant="ghost" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Text label="الاسم" value={str(draft.full_name)} onChange={(v) => setDraft({ ...draft, full_name: v })} />
              <Text label="رقم التواصل" value={str(draft.phone)} onChange={(v) => setDraft({ ...draft, phone: v })} />
              <Sel label="الخدمة" value={str(draft.service)} options={SERVICES} onChange={(v) => setDraft({ ...draft, service: v })} />
              <Sel label="المصدر" value={str(draft.source)} options={SOURCES} onChange={(v) => setDraft({ ...draft, source: v })} />
              <div>
                <Label className="mb-1.5 block text-xs">تاريخ التقييم</Label>
                <Input type="date" value={str(draft.evaluation_date)} onChange={(e) => setDraft({ ...draft, evaluation_date: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">حضر التقييم</Label>
                <div className="flex gap-2">
                  {[{ v: false, l: "لا" }, { v: true, l: "نعم" }].map((o) => (
                    <Button key={o.l} type="button" size="sm" variant={draft.attended === o.v ? "default" : "outline"}
                      onClick={() => setDraft({ ...draft, attended: o.v })}>{o.l}</Button>
                  ))}
                </div>
              </div>
              <Sel label="نوع الاشتراك" value={str(draft.subscription_type)} options={SUBSCRIPTIONS} onChange={(v) => setDraft({ ...draft, subscription_type: v })} />
              <Sel label="العرض / الخصم" value={str(draft.offer_label)} options={OFFERS} onChange={(v) => setDraft({ ...draft, offer_label: v })} />
              <div>
                <Label className="mb-1.5 block text-xs">الحالة</Label>
                <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={str(draft.status)} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <Sel label="الموظف المسؤول" value={str(draft.assigned_staff)} options={STAFF} onChange={(v) => setDraft({ ...draft, assigned_staff: v })} />
              <div className="sm:col-span-2">
                <Label className="mb-1.5 block text-xs">ملاحظات</Label>
                <Textarea rows={3} value={str(draft.notes)} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <Button onClick={submit} disabled={saving}>
                {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} {draft.id ? "حفظ" : "إضافة"}
              </Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>إلغاء</Button>
            </div>
          </div>
        </div>
      )}
    </BranchGuard>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="truncate font-semibold">{value || "—"}</div>
    </div>
  );
}

function Text({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Sel({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
