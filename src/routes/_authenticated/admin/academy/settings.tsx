import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { runBranchSweeps, drainWhatsappOutbox } from "@/lib/legends/notifications.functions";
import { seedDemoData, seedDemoModules } from "@/lib/legends/seed.functions";
import { MessageCircle, Bell, PlayCircle, Send, Database, RefreshCw, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/legends/i18n";

export const Route = createFileRoute("/_authenticated/admin/academy/settings")({
  head: () => ({ meta: [{ title: "Settings · United Sports Academy" }] }),
  component: SettingsPage,
});

type Wa = {
  id?: string;
  branch_id: string;
  enabled: boolean;
  phone_display: string | null;
  templates: Record<string, string>;
};

function SettingsPage() {
  const { t } = useI18n();
  const { currentBranchId } = useSession();
  const [wa, setWa] = useState<Wa | null>(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<"sweeps" | "drain" | "seed" | "topup" | "reset" | null>(null);
  const [outboxCount, setOutboxCount] = useState({ queued: 0, sent: 0, failed: 0, skipped: 0 });
  const [selectedMods, setSelectedMods] = useState<Record<string, boolean>>({
    trainees: false, receipts: true, attendance: true, employees: false,
    transactions: true, leads: true, payroll: false,
  });
  const runSweeps = useServerFn(runBranchSweeps);
  const drainOutbox = useServerFn(drainWhatsappOutbox);
  const runSeed = useServerFn(seedDemoData);
  const runModules = useServerFn(seedDemoModules);

  const load = async () => {
    if (!currentBranchId) return;
    const { data } = await supabase
      .from("ac_whatsapp_settings")
      .select("*")
      .eq("branch_id", currentBranchId)
      .maybeSingle();
    if (data) {
      setWa({
        id: data.id,
        branch_id: data.branch_id,
        enabled: data.enabled,
        phone_display: data.phone_display,
        templates: (data.templates as Record<string, string>) ?? {},
      });
    } else {
      setWa({
        branch_id: currentBranchId,
        enabled: false,
        phone_display: "",
        templates: {
          subscription_expiry: "مرحباً {{name}}، اشتراكك ينتهي خلال {{days}} أيام.",
          absence_alert: "مرحباً {{name}}، لاحظنا غيابك عن {{count}} جلسات.",
          session_reminder: "تذكير: جلستك القادمة في {{time}} مع {{coach}}.",
          welcome: "أهلاً بك {{name}} في الأكاديمية! كود العميل: {{code}}",
        },
      });
    }

    const { data: ob } = await supabase
      .from("ac_whatsapp_outbox")
      .select("status")
      .eq("branch_id", currentBranchId);
    const counts = { queued: 0, sent: 0, failed: 0, skipped: 0 };
    (ob ?? []).forEach((m: any) => { counts[m.status as keyof typeof counts] = (counts[m.status as keyof typeof counts] ?? 0) + 1; });
    setOutboxCount(counts);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [currentBranchId]);

  const save = async () => {
    if (!wa || !currentBranchId) return;
    setSaving(true);
    const payload = {
      branch_id: currentBranchId,
      enabled: wa.enabled,
      phone_display: wa.phone_display,
      templates: wa.templates,
    };
    const { error } = wa.id
      ? await supabase.from("ac_whatsapp_settings").update(payload).eq("id", wa.id)
      : await supabase.from("ac_whatsapp_settings").insert(payload);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("تم الحفظ"); load(); }
  };

  const onSweeps = async () => {
    if (!currentBranchId) return;
    setBusy("sweeps");
    try {
      const res = await runSweeps({ data: { branchId: currentBranchId } });
      toast.success(`تم إنشاء ${res.created} إشعار، وأُضيف ${res.queued} للطابور`);
      load();
    } catch (e: any) { toast.error(e?.message ?? "خطأ"); }
    setBusy(null);
  };

  const onDrain = async () => {
    if (!currentBranchId) return;
    setBusy("drain");
    try {
      const res = await drainOutbox({ data: { branchId: currentBranchId } });
      toast.success(`تم: ${res.sent} مرسل، ${res.skipped} متخطى، ${res.failed} فشل`);
      load();
    } catch (e: any) { toast.error(e?.message ?? "خطأ"); }
    setBusy(null);
  };

  const onSeed = async () => {
    if (!currentBranchId) return;
    setBusy("seed");
    try {
      const res = await runSeed({ data: { branchId: currentBranchId } });
      if (res.skipped) toast.info("الفرع يحتوي بيانات مسبقاً — لم يتم الإضافة");
      else toast.success("تمت تعبئة البيانات التجريبية بنجاح");
    } catch (e: any) { toast.error(e?.message ?? "خطأ"); }
    setBusy(null);
  };

  const selectedList = () =>
    Object.entries(selectedMods).filter(([, v]) => v).map(([k]) => k) as any[];

  const runDemo = async (mode: "topup" | "reset") => {
    if (!currentBranchId) return;
    const mods = selectedList();
    if (!mods.length) { toast.error("اختر وحدة واحدة على الأقل"); return; }
    if (mode === "reset" && !confirm(`سيتم حذف بيانات الوحدات المحددة (${mods.join(", ")}) لهذا الفرع ثم إعادة توليدها. متابعة؟`)) return;
    setBusy(mode);
    try {
      const res = await runModules({ data: { branchId: currentBranchId, modules: mods, mode } });
      const summary = Object.entries(res.summary ?? {}).map(([k, v]) => `${k}: ${v}`).join(" · ") || "تم";
      toast.success(`${mode === "reset" ? "إعادة الضبط" : "تحديث البيانات"} — ${summary}`);
    } catch (e: any) { toast.error(e?.message ?? "خطأ"); }
    setBusy(null);
  };


  if (!wa) return <div className="p-8 text-muted-foreground">جاري التحميل…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("pg.settings.h")}</h2>
        <p className="text-sm text-muted-foreground">{t("pg.settings.s")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-cyan-glow" /> مهام الإشعارات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            يفحص الاشتراكات المنتهية، المخزون المنخفض، وتذاكر الصيانة المتأخرة — ثم ينشئ إشعارات داخل التطبيق ويُجهّز رسائل واتساب.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onSweeps} disabled={busy === "sweeps"}>
              <PlayCircle className="h-4 w-4 me-2" />
              {busy === "sweeps" ? "جاري…" : "تشغيل الفحص الآن"}
            </Button>
            <Button onClick={onDrain} variant="secondary" disabled={busy === "drain"}>
              <Send className="h-4 w-4 me-2" />
              {busy === "drain" ? "جاري…" : "إرسال رسائل واتساب المعلقة"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline">معلق: {outboxCount.queued}</Badge>
            <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">مرسل: {outboxCount.sent}</Badge>
            <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30">متخطى: {outboxCount.skipped}</Badge>
            <Badge variant="destructive">فشل: {outboxCount.failed}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-cyan-glow" /> البيانات التجريبية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            تعبئة سريعة لبيانات الفرع الحالي. آمن للتشغيل المتكرر — لا يحذف الموجود.
          </p>
          <Button onClick={onSeed} disabled={busy === "seed"} variant="secondary">
            <Database className="h-4 w-4 me-2" />
            {busy === "seed" ? "جاري التعبئة…" : "تعبئة أولية (يتخطى لو فيه بيانات)"}
          </Button>

          <div className="border-t border-border/40 pt-4 space-y-3">
            <div className="text-sm font-medium">تحديث / إعادة ضبط حسب الوحدة</div>
            <p className="text-xs text-muted-foreground">
              اختر الوحدات اللي عايز تعبّيها بسجلات جديدة، أو امسحها وأعد توليدها بالكامل. التحديث لا يمس البيانات الموجودة، أما إعادة الضبط فتحذف بيانات الوحدة لهذا الفرع فقط.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                ["trainees", "متدربين"],
                ["receipts", "فواتير/إيصالات"],
                ["attendance", "حضور"],
                ["employees", "موظفين"],
                ["transactions", "معاملات مالية"],
                ["leads", "Leads"],
                ["payroll", "مرتبات"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-md border border-border/50 bg-background/30 px-2 py-1.5 text-xs cursor-pointer hover:border-teal/40">
                  <input
                    type="checkbox"
                    checked={!!selectedMods[key]}
                    onChange={(e) => setSelectedMods((s) => ({ ...s, [key]: e.target.checked }))}
                    className="accent-cyan-400"
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => runDemo("topup")} disabled={busy === "topup"} className="bg-gradient-to-r from-teal to-cyan-glow text-primary-foreground hover:opacity-90">
                <RefreshCw className="h-4 w-4 me-2" />
                {busy === "topup" ? "جاري…" : "تحديث (إضافة بيانات جديدة)"}
              </Button>
              <Button onClick={() => runDemo("reset")} disabled={busy === "reset"} variant="destructive">
                <Trash2 className="h-4 w-4 me-2" />
                {busy === "reset" ? "جاري…" : "إعادة ضبط الوحدات المختارة"}
              </Button>
              <Button onClick={() => setSelectedMods({ trainees: true, receipts: true, attendance: true, employees: true, transactions: true, leads: true, payroll: true })} variant="ghost" size="sm">
                تحديد الكل
              </Button>
              <Button onClick={() => setSelectedMods({ trainees: false, receipts: false, attendance: false, employees: false, transactions: false, leads: false, payroll: false })} variant="ghost" size="sm">
                إفراغ التحديد
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-cyan-glow" /> واتساب الأعمال</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <div className="font-medium">تفعيل الإرسال الفعلي</div>
              <div className="text-xs text-muted-foreground">
                يتطلب ضبط المفاتيح: WHATSAPP_ACCESS_TOKEN و WHATSAPP_PHONE_NUMBER_ID في إعدادات السحابة.
                بدونها سيتم تعليم الرسائل كـ "متخطاة" بدون إرسال.
              </div>
            </div>
            <Switch checked={wa.enabled} onCheckedChange={(v) => setWa({ ...wa, enabled: v })} />
          </div>

          <div>
            <Label>رقم الواتساب الظاهر للعملاء</Label>
            <Input
              value={wa.phone_display ?? ""}
              onChange={(e) => setWa({ ...wa, phone_display: e.target.value })}
              placeholder="+20 100 000 0000"
            />
          </div>

          <div className="space-y-3">
            <Label>قوالب الرسائل</Label>
            {Object.entries(wa.templates).map(([key, value]) => (
              <div key={key}>
                <div className="text-xs text-muted-foreground mb-1 font-mono">{key}</div>
                <Textarea
                  rows={2}
                  value={value}
                  onChange={(e) => setWa({ ...wa, templates: { ...wa.templates, [key]: e.target.value } })}
                />
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground">
              المتغيرات المتاحة: <code>{"{{name}}"}</code> <code>{"{{days}}"}</code> <code>{"{{count}}"}</code> <code>{"{{time}}"}</code> <code>{"{{coach}}"}</code> <code>{"{{code}}"}</code>
            </p>
          </div>

          <Button onClick={save} disabled={saving}>{saving ? "جاري الحفظ…" : "حفظ الإعدادات"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
