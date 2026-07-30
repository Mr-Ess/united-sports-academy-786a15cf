import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users, Plus, Search, Trash2, Pencil, X, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BranchGuard } from "@/components/academy/BranchGuard";
import { OsHeader, OsCard, StatusPill } from "@/components/academy/OsUI";
import { useAcademyTable, str, num, money, dmy, type Row } from "@/lib/use-academy-table";
import { useBranch } from "@/lib/branch-context";

export const Route = createFileRoute("/_authenticated/admin/academy/clients")({
  component: ClientsPage,
});

const PILLS = [
  { value: "upcoming", label: "دفع قادم" },
  { value: "late", label: "متأخر" },
  { value: "paid", label: "مدفوع بالكامل" },
  { value: "cancelled", label: "ملغي" },
  { value: "current", label: "مشترك حالي" },
  { value: "new", label: "جديد" },
];

const CATEGORIES = ["Kids", "Adults", "Ladies", "Diving", "Baby", "Para Swim"];
const LEVELS = ["Level 1", "Level 2", "Level 3", "Level 4"];
const STAFF = ["Mero", "Nada", "Abdelkader", "Mohamed Ali", "Salma"];

const EMPTY: Row = {
  full_name: "",
  phone: "",
  membership_id: "",
  category: "Kids",
  level: "Level 1",
  age: 8,
  assigned_staff: "Mero",
  address: "",
  emergency_contact: "",
  active: true,
};

function ClientsPage() {
  const { currentBranch } = useBranch();
  const clients = useAcademyTable("clients", { realtime: true });
  const subs = useAcademyTable("subscriptions", {});
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("الكل");
  const [pill, setPill] = useState("upcoming");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Row>(EMPTY);
  const [saving, setSaving] = useState(false);

  const subByClient = useMemo(() => {
    const m = new Map<string, Row>();
    subs.rows.forEach((s) => {
      if (s.client_id) m.set(str(s.client_id), s);
    });
    return m;
  }, [subs.rows]);

  const filtered = useMemo(
    () =>
      clients.rows.filter((c) => {
        const hit = !q || `${str(c.full_name)} ${str(c.phone)} ${str(c.client_code)} ${str(c.membership_id)}`.toLowerCase().includes(q.toLowerCase());
        const ct = cat === "الكل" || str(c.category) === cat;
        return hit && ct;
      }),
    [clients.rows, q, cat],
  );

  const total = useMemo(
    () => filtered.reduce((a, c) => a + num(subByClient.get(str(c.id))?.total_amount), 0),
    [filtered, subByClient],
  );

  async function submit() {
    if (!str(draft.full_name).trim()) {
      toast.error("الاسم مطلوب");
      return;
    }
    setSaving(true);
    const payload: Row = { ...draft, age: num(draft.age) };
    const ok = await clients.upsert(payload);
    setSaving(false);
    if (ok) {
      toast.success("تم الحفظ");
      setOpen(false);
    }
  }

  return (
    <BranchGuard>
      <OsHeader
        icon={Users}
        title="إدارة العملاء والمدفوعات"
        subtitle="ابحث بالاسم، الرقم، أو الهوية"
        count={money(total).replace("EGP ", "")}
        actions={
          <Button size="sm" onClick={() => { setDraft({ ...EMPTY }); setOpen(true); }}>
            <Plus className="ml-1 h-4 w-4" /> عميل جديد
          </Button>
        }
      />

      <OsCard className="mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pr-9" placeholder="ابحث بالاسم، الرقم، أو الهوية" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border border-input bg-background px-3 text-xs" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option>الكل</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {PILLS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPill(p.value)}
              className={`os-pill transition-colors ${pill === p.value ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </OsCard>

      {clients.isLoading ? (
        <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const s = subByClient.get(str(c.id));
            const totalAmt = num(s?.total_amount);
            const paid = num(s?.paid_amount);
            const remaining = Math.max(totalAmt - paid, 0);
            return (
              <div key={str(c.id)} className="os-card grid gap-3 p-4 lg:grid-cols-6">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-bold">{str(c.full_name)}</span>
                    <StatusPill tone={remaining > 0 ? "orange" : "cyan"}>{remaining > 0 ? "متأخر" : "دفع قادم"}</StatusPill>
                  </div>
                  <div className="text-xs text-muted-foreground" dir="ltr">{str(c.client_code)}</div>
                  <div className="text-xs text-muted-foreground" dir="ltr">{str(c.phone)}</div>
                </div>
                <div>
                  <Cell label="المبلغ الإجمالي" value={money(totalAmt)} />
                  <Cell label="المبلغ المتبقي" value={money(remaining)} />
                  <Button size="sm" variant="ghost" className="mt-1 h-7 px-2 text-[11px] text-primary">
                    <Wallet className="ml-1 h-3.5 w-3.5" /> ادفع الآن
                  </Button>
                </div>
                <div>
                  <Cell label="اسم الاشتراك" value={str(s?.name) || "—"} />
                  <Cell label="تاريخ الاشتراك" value={dmy(s?.start_date)} />
                  <Cell label="تاريخ الانتهاء" value={dmy(s?.end_date)} />
                </div>
                <div>
                  <Cell label="اسم الخدمة" value={str(s?.service_name) || str(c.category)} />
                  <Cell label="نوع الخدمة" value={str(s?.service_type) || str(c.level)} />
                </div>
                <div>
                  <Cell label="الفرع" value={currentBranch?.name_ar ?? "—"} />
                  <Cell label="الموظف المسؤول" value={str(c.assigned_staff) || "—"} />
                </div>
                <div className="flex items-start justify-end gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setDraft({ ...c }); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400" onClick={() => clients.destroy(str(c.id))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {!filtered.length && <div className="os-card p-10 text-center text-sm text-muted-foreground">لا توجد نتائج</div>}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-3" onClick={() => setOpen(false)}>
          <div dir="rtl" className="os-card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{draft.id ? "تعديل عميل" : "عميل جديد"}</h2>
              <Button size="icon" variant="ghost" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <F label="الاسم"><Input value={str(draft.full_name)} onChange={(e) => setDraft({ ...draft, full_name: e.target.value })} /></F>
              <F label="الهاتف"><Input value={str(draft.phone)} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></F>
              <F label="رقم العضوية"><Input value={str(draft.membership_id)} onChange={(e) => setDraft({ ...draft, membership_id: e.target.value })} /></F>
              <F label="الفئة">
                <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={str(draft.category)} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </F>
              <F label="المستوى">
                <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={str(draft.level)} onChange={(e) => setDraft({ ...draft, level: e.target.value })}>
                  {LEVELS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </F>
              <F label="العمر"><Input type="number" value={str(draft.age)} onChange={(e) => setDraft({ ...draft, age: e.target.value })} /></F>
              <F label="الموظف المسؤول">
                <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={str(draft.assigned_staff)} onChange={(e) => setDraft({ ...draft, assigned_staff: e.target.value })}>
                  {STAFF.map((c) => <option key={c}>{c}</option>)}
                </select>
              </F>
              <F label="جهة اتصال للطوارئ"><Input value={str(draft.emergency_contact)} onChange={(e) => setDraft({ ...draft, emergency_contact: e.target.value })} /></F>
              <F label="العنوان"><Input value={str(draft.address)} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></F>
            </div>
            <div className="mt-5 flex gap-2">
              <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} حفظ</Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>إلغاء</Button>
            </div>
          </div>
        </div>
      )}
    </BranchGuard>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-1">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-xs font-semibold">{value}</div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      {children}
    </div>
  );
}
