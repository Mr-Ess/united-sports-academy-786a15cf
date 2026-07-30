import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, type LucideIcon, Search } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranch } from "@/lib/branch-context";
import { listRows, upsertRow, deleteRow } from "@/lib/academy-crud.functions";

export type FieldType = "text" | "textarea" | "number" | "date" | "datetime" | "select" | "boolean";
export type Field = {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  hideInTable?: boolean;
  render?: (row: Record<string, unknown>) => React.ReactNode;
};

type Props = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  table: string;
  fields: Field[];
  branchScoped?: boolean;
  searchKeys?: string[];
  orderBy?: { column: string; ascending?: boolean };
  defaultValues?: Record<string, unknown>;
};

export function CrudModule({
  icon: Icon,
  title,
  subtitle,
  table,
  fields,
  branchScoped = true,
  searchKeys = [],
  orderBy,
  defaultValues = {},
}: Props) {
  const { currentBranchId } = useBranch();
  const qc = useQueryClient();
  const list = useServerFn(listRows);
  const save = useServerFn(upsertRow);
  const del = useServerFn(deleteRow);

  const queryKey = ["crud", table, branchScoped ? currentBranchId : "all"];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      list({
        data: {
          table,
          branch_id: branchScoped ? currentBranchId : null,
          order: orderBy ?? { column: "created_at", ascending: false },
        },
      }),
    enabled: branchScoped ? !!currentBranchId : true,
  });

  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const list = (data ?? []) as Record<string, unknown>[];
    if (!q || !searchKeys.length) return list;
    const needle = q.toLowerCase();
    return list.filter((r) => searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(needle)));
  }, [data, q, searchKeys]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});

  function openNew() {
    setEditing(null);
    setForm({ ...defaultValues });
    setOpen(true);
  }
  function openEdit(row: Record<string, unknown>) {
    setEditing(row);
    setForm({ ...row });
    setOpen(true);
  }

  async function handleSave() {
    const payload: Record<string, unknown> = { ...form };
    if (branchScoped && currentBranchId && !payload.branch_id) payload.branch_id = currentBranchId;
    for (const f of fields) {
      if (f.type === "number" && payload[f.key] !== undefined && payload[f.key] !== null && payload[f.key] !== "") {
        payload[f.key] = Number(payload[f.key]);
      }
      if (payload[f.key] === "") payload[f.key] = null;
    }
    try {
      await save({ data: { table, payload } });
      toast.success(editing ? "تم التحديث" : "تم الحفظ");
      setOpen(false);
      qc.invalidateQueries({ queryKey });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف السجل؟")) return;
    try {
      await del({ data: { table, id } });
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const tableFields = fields.filter((f) => !f.hideInTable);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black">
            <Icon className="h-6 w-6 text-primary" /> {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {searchKeys.length > 0 && (
            <div className="relative">
              <Search className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث..."
                className="w-56 pr-8"
              />
            </div>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>
                <Plus className="ml-2 h-4 w-4" /> إضافة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? "تعديل" : "إضافة جديد"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map((f) => (
                  <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                    <Label className="mb-1.5 block text-xs font-black">
                      {f.label} {f.required && <span className="text-destructive">*</span>}
                    </Label>
                    {f.type === "textarea" ? (
                      <Textarea
                        rows={3}
                        value={(form[f.key] as string) ?? ""}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                      />
                    ) : f.type === "select" ? (
                      <Select
                        value={(form[f.key] as string) ?? ""}
                        onValueChange={(v) => setForm({ ...form, [f.key]: v })}
                      >
                        <SelectTrigger><SelectValue placeholder={f.placeholder ?? "اختر..."} /></SelectTrigger>
                        <SelectContent>
                          {(f.options ?? []).map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : f.type === "boolean" ? (
                      <Select
                        value={form[f.key] === undefined ? "" : String(form[f.key])}
                        onValueChange={(v) => setForm({ ...form, [f.key]: v === "true" })}
                      >
                        <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">نعم</SelectItem>
                          <SelectItem value="false">لا</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "datetime" ? "datetime-local" : "text"}
                        value={(form[f.key] as string | number | undefined) ?? ""}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button onClick={handleSave}>حفظ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs font-black">
            <tr>
              {tableFields.map((f) => (
                <th key={f.key} className="px-3 py-2.5 text-right">{f.label}</th>
              ))}
              <th className="px-3 py-2.5 text-right w-24">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={tableFields.length + 1} className="p-6 text-center text-muted-foreground">تحميل...</td></tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={tableFields.length + 1} className="p-6 text-center text-muted-foreground">مافيش بيانات</td></tr>
            )}
            {rows.map((row) => (
              <tr key={row.id as string} className="border-t hover:bg-muted/20">
                {tableFields.map((f) => (
                  <td key={f.key} className="px-3 py-2 align-middle">
                    {f.render ? f.render(row) : renderCell(row[f.key], f)}
                  </td>
                ))}
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(row)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(row.id as string)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function renderCell(v: unknown, f: Field) {
  if (v === null || v === undefined || v === "") return <span className="text-muted-foreground">—</span>;
  if (f.type === "boolean") return <Badge variant={v ? "default" : "secondary"}>{v ? "نعم" : "لا"}</Badge>;
  if (f.type === "select") {
    const opt = f.options?.find((o) => o.value === v);
    return <Badge variant="secondary">{opt?.label ?? String(v)}</Badge>;
  }
  if (f.type === "date" && typeof v === "string") return v.slice(0, 10);
  if (f.type === "datetime" && typeof v === "string") return new Date(v).toLocaleString("ar-EG");
  const s = String(v);
  return s.length > 60 ? s.slice(0, 60) + "…" : s;
}
