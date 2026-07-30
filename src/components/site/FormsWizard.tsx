import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Briefcase, GraduationCap, HandHeart, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRANCHES, SEASONS, SPORTS } from "@/lib/mock-data";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

const submissionSchema = z.object({
  type: z.enum(["member", "coach", "volunteer", "workshop"]),
  full_name: z.string().trim().min(2, "الاسم مطلوب").max(200),
  email: z.string().trim().email("إيميل غير صحيح").max(200),
  phone: z.string().trim().max(40).optional().nullable(),
  age: z.number().int().min(1).max(120).nullable().optional(),
  gender: z.string().max(40).optional().nullable(),
  interest: z.string().max(200).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
  extra: z.record(z.string(), z.any()).default({}),
});

async function submitToDb(payload: unknown) {
  const parsed = submissionSchema.parse(payload);
  const { error } = await supabase.from("join_submissions").insert(parsed);
  if (error) throw error;
}

export function FormsWizard() {
  const { t } = useT();
  return (
    <section id="enroll" className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-3xl border bg-card shadow-[var(--shadow-card)]">
          <Tabs defaultValue="member" className="w-full">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-none border-b bg-muted/40 p-2 sm:grid-cols-4">
              <TabsTrigger value="member" className="gap-2 rounded-xl py-2.5">
                <UserPlus className="h-4 w-4" /> {t("tab_member")}
              </TabsTrigger>
              <TabsTrigger value="job" className="gap-2 rounded-xl py-2.5">
                <Briefcase className="h-4 w-4" /> {t("tab_job")}
              </TabsTrigger>
              <TabsTrigger value="volunteer" className="gap-2 rounded-xl py-2.5">
                <HandHeart className="h-4 w-4" /> {t("tab_volunteer")}
              </TabsTrigger>
              <TabsTrigger value="workshop" className="gap-2 rounded-xl py-2.5">
                <GraduationCap className="h-4 w-4" /> {t("tab_workshop")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="member" className="p-6 sm:p-10"><MemberWizard /></TabsContent>
            <TabsContent value="job" className="p-6 sm:p-10"><JobForm /></TabsContent>
            <TabsContent value="volunteer" className="p-6 sm:p-10"><VolunteerForm /></TabsContent>
            <TabsContent value="workshop" className="p-6 sm:p-10"><WorkshopForm /></TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}

function useSubmit() {
  const [loading, setLoading] = useState(false);
  const submit = async (payload: any, successMsg: string, successDesc: string) => {
    setLoading(true);
    try {
      await submitToDb(payload);
      toast.success(successMsg, { description: successDesc });
      return true;
    } catch (e: any) {
      toast.error(e.message ?? "حصل خطأ، حاول تاني");
      return false;
    } finally {
      setLoading(false);
    }
  };
  return { loading, submit };
}

function MemberWizard() {
  const [step, setStep] = useState(1);
  const [f, setF] = useState({
    branch: "", activity: "", season: "", level: "",
    full_name: "", dob: "", email: "", phone: "", medical: "",
    days: "", time: "", plan: "Season",
  });
  const { loading, submit } = useSubmit();
  const upd = (k: string, v: any) => setF((prev) => ({ ...prev, [k]: v }));
  const steps = ["البرنامج", "بيانات المتدرب", "الجدول"];

  const handleSubmit = async () => {
    const ok = await submit({
      type: "member",
      full_name: f.full_name,
      email: f.email,
      phone: f.phone || null,
      interest: f.activity || null,
      message: f.medical || null,
      extra: {
        branch: f.branch, season: f.season, level: f.level,
        dob: f.dob, days: f.days, time: f.time, plan: f.plan,
      },
    }, "تم تسجيل الاشتراك!", "هنبعتلك الجدول خلال 24 ساعة");
    if (ok) { setStep(1); setF({ ...f, full_name: "", email: "", phone: "", medical: "" }); }
  };

  return (
    <div>
      <StepBar current={step} labels={steps} />
      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="الفرع">
            <SelectWrap value={f.branch} onChange={(v) => upd("branch", v)} options={BRANCHES.map((b) => b.name)} placeholder="اختر فرع" />
          </Field>
          <Field label="النشاط">
            <SelectWrap value={f.activity} onChange={(v) => upd("activity", v)} options={SPORTS.map((s) => s.name)} placeholder="اختر رياضة" />
          </Field>
          <Field label="الموسم">
            <SelectWrap value={f.season} onChange={(v) => upd("season", v)} options={SEASONS.map((s) => s.label)} placeholder="الموسم" />
          </Field>
          <Field label="المستوى">
            <SelectWrap value={f.level} onChange={(v) => upd("level", v)} options={["مبتدئ", "متوسط", "متقدم"]} placeholder="المستوى" />
          </Field>
        </div>
      )}
      {step === 2 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم المتدرب"><Input value={f.full_name} onChange={(e) => upd("full_name", e.target.value)} placeholder="الاسم الكامل" /></Field>
          <Field label="تاريخ الميلاد"><Input type="date" value={f.dob} onChange={(e) => upd("dob", e.target.value)} /></Field>
          <Field label="إيميل ولي الأمر"><Input dir="ltr" type="email" value={f.email} onChange={(e) => upd("email", e.target.value)} placeholder="you@example.com" /></Field>
          <Field label="الهاتف"><Input dir="ltr" value={f.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="+971 50 000 0000" /></Field>
          <Field label="ملاحظات طبية" className="sm:col-span-2">
            <Textarea value={f.medical} onChange={(e) => upd("medical", e.target.value)} placeholder="حساسية، حالات، أو طلبات خاصة" rows={3} />
          </Field>
        </div>
      )}
      {step === 3 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="الأيام المفضلة">
            <SelectWrap value={f.days} onChange={(v) => upd("days", v)} options={["السبت/الاثنين", "الأحد/الثلاثاء", "نهاية الأسبوع", "أمسيات أيام الأسبوع"]} placeholder="الأيام" />
          </Field>
          <Field label="موعد الجلسة">
            <SelectWrap value={f.time} onChange={(v) => upd("time", v)} options={["صباحاً", "بعد الظهر", "مساءً"]} placeholder="الوقت" />
          </Field>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>
          ← السابق
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((s) => s + 1)} className="rounded-xl bg-gradient-to-r from-[var(--aqua)] to-[var(--aqua-glow)] text-[var(--navy)] shadow-[var(--shadow-glow)]">
            التالي →
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading || !f.full_name || !f.email}
            className="rounded-xl bg-gradient-to-r from-[var(--orange)] to-[var(--crimson)] text-white shadow-[var(--shadow-orange)]"
          >
            {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            إرسال الاشتراك
          </Button>
        )}
      </div>
    </div>
  );
}

function JobForm() {
  const [f, setF] = useState({ full_name: "", email: "", phone: "", position: "", years: "", availability: "", sport: "", cover: "" });
  const { loading, submit } = useSubmit();
  const upd = (k: string, v: any) => setF((prev) => ({ ...prev, [k]: v }));
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await submit({
          type: "coach",
          full_name: f.full_name, email: f.email, phone: f.phone || null,
          interest: f.position || null, message: f.cover || null,
          extra: { years: f.years, availability: f.availability, sport: f.sport },
        }, "تم استلام طلبك", "فريق التوظيف بيراجع خلال 5 أيام عمل");
        if (ok) setF({ full_name: "", email: "", phone: "", position: "", years: "", availability: "", sport: "", cover: "" });
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <Field label="الاسم الكامل"><Input required value={f.full_name} onChange={(e) => upd("full_name", e.target.value)} /></Field>
      <Field label="الإيميل"><Input dir="ltr" type="email" required value={f.email} onChange={(e) => upd("email", e.target.value)} /></Field>
      <Field label="الهاتف"><Input dir="ltr" value={f.phone} onChange={(e) => upd("phone", e.target.value)} /></Field>
      <Field label="الوظيفة">
        <SelectWrap value={f.position} onChange={(v) => upd("position", v)} options={["كوتش رئيسي", "كوتش مساعد", "منقذ", "استقبال", "مسعف رياضي", "مدرب لياقة"]} placeholder="الدور" />
      </Field>
      <Field label="سنوات الخبرة"><Input type="number" min={0} value={f.years} onChange={(e) => upd("years", e.target.value)} /></Field>
      <Field label="التوفر">
        <SelectWrap value={f.availability} onChange={(v) => upd("availability", v)} options={["دوام كامل", "دوام جزئي", "نهاية الأسبوع", "موسمي"]} placeholder="متى تقدر تشتغل" />
      </Field>
      <Field label="التخصص الرياضي" className="sm:col-span-2">
        <SelectWrap value={f.sport} onChange={(v) => upd("sport", v)} options={SPORTS.map((s) => s.name)} placeholder="الرياضة الأساسية" />
      </Field>
      <Field label="خطاب التقديم" className="sm:col-span-2">
        <Textarea rows={4} value={f.cover} onChange={(e) => upd("cover", e.target.value)} placeholder="اكتبلنا عن فلسفتك في التدريب..." />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={loading || !f.full_name || !f.email} className="w-full rounded-xl bg-gradient-to-r from-[var(--aqua)] to-[var(--aqua-glow)] text-[var(--navy)] shadow-[var(--shadow-glow)] sm:w-auto">
          {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          إرسال الطلب
        </Button>
      </div>
    </form>
  );
}

function VolunteerForm() {
  const [f, setF] = useState({ full_name: "", email: "", interest: "", hours: "", message: "" });
  const { loading, submit } = useSubmit();
  const upd = (k: string, v: any) => setF((prev) => ({ ...prev, [k]: v }));
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await submit({
          type: "volunteer",
          full_name: f.full_name, email: f.email,
          interest: f.interest || null, message: f.message || null,
          extra: { hours: f.hours },
        }, "شكراً لتطوعك!", "هنبعتلك دعوة التوجيه قريب");
        if (ok) setF({ full_name: "", email: "", interest: "", hours: "", message: "" });
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <Field label="الاسم الكامل"><Input required value={f.full_name} onChange={(e) => upd("full_name", e.target.value)} /></Field>
      <Field label="الإيميل"><Input dir="ltr" type="email" required value={f.email} onChange={(e) => upd("email", e.target.value)} /></Field>
      <Field label="مجال الاهتمام">
        <SelectWrap value={f.interest} onChange={(v) => upd("interest", v)} options={["الفعاليات", "توجيه الشباب", "الميديا والتصوير", "مساعد كوتش", "التواصل المجتمعي"]} placeholder="اختر" />
      </Field>
      <Field label="ساعات متاحة أسبوعياً">
        <SelectWrap value={f.hours} onChange={(v) => upd("hours", v)} options={["1-4", "5-10", "10-20", "20+"]} placeholder="التوفر" />
      </Field>
      <Field label="لماذا تريد التطوع معنا؟" className="sm:col-span-2">
        <Textarea rows={4} value={f.message} onChange={(e) => upd("message", e.target.value)} />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={loading || !f.full_name || !f.email} className="w-full rounded-xl bg-gradient-to-r from-[var(--lime)] to-[var(--aqua-glow)] text-[var(--navy)] shadow-[var(--shadow-glow)] sm:w-auto">
          {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          انضم لفريق التطوع
        </Button>
      </div>
    </form>
  );
}

function WorkshopForm() {
  const workshops = [
    { name: "ورشة السباحة الحرة النخبوية", when: "12 أغسطس · الحرم الساحلي", coach: "كوتش نينا" },
    { name: "ماستركلاس ذكاء كرة السلة", when: "4 سبتمبر · فرع الشرق", coach: "كوتش دييجو" },
    { name: "دورة الكاتا المتقدمة", when: "21 سبتمبر · غرب المدينة", coach: "سنسي كينجي" },
  ];
  const [f, setF] = useState({ workshop: workshops[0].name, full_name: "", email: "", level: "", tickets: "1" });
  const { loading, submit } = useSubmit();
  const upd = (k: string, v: any) => setF((prev) => ({ ...prev, [k]: v }));
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await submit({
          type: "workshop",
          full_name: f.full_name, email: f.email,
          interest: f.workshop,
          extra: { level: f.level, tickets: Number(f.tickets) || 1 },
        }, "تم الحجز!", "افحص إيميلك للجدول");
        if (ok) setF({ ...f, full_name: "", email: "" });
      }}
      className="space-y-6"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {workshops.map((w) => (
          <label
            key={w.name}
            className={`cursor-pointer rounded-2xl border p-4 transition-all hover:border-primary ${f.workshop === w.name ? "border-primary bg-primary/5" : ""}`}
          >
            <input type="radio" name="workshop" className="sr-only" checked={f.workshop === w.name} onChange={() => upd("workshop", w.name)} />
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">{w.when}</div>
            <div className="mt-1 text-base font-bold">{w.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">مع {w.coach}</div>
          </label>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="اسم الحاضر"><Input required value={f.full_name} onChange={(e) => upd("full_name", e.target.value)} /></Field>
        <Field label="الإيميل"><Input dir="ltr" type="email" required value={f.email} onChange={(e) => upd("email", e.target.value)} /></Field>
        <Field label="المستوى">
          <SelectWrap value={f.level} onChange={(v) => upd("level", v)} options={["مبتدئ", "متوسط", "متقدم"]} placeholder="المستوى" />
        </Field>
        <Field label="عدد التذاكر"><Input type="number" min={1} value={f.tickets} onChange={(e) => upd("tickets", e.target.value)} /></Field>
      </div>
      <Button type="submit" disabled={loading || !f.full_name || !f.email} className="rounded-xl bg-gradient-to-r from-[var(--orange)] to-[var(--crimson)] text-white shadow-[var(--shadow-orange)]">
        {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        احجز مكانك
      </Button>
    </form>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SelectWrap({ options, placeholder, value, onChange }: { options: string[]; placeholder: string; value?: string; onChange?: (v: string) => void }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StepBar({ current, labels }: { current: number; labels: string[] }) {
  return (
    <div className="mb-8 flex items-center gap-2">
      {labels.map((l, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <div key={l} className="flex flex-1 items-center gap-2">
            <div
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-all ${
                active
                  ? "bg-gradient-to-br from-[var(--orange)] to-[var(--crimson)] text-white shadow-[var(--shadow-orange)]"
                  : done
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {n}
            </div>
            <div className="min-w-0 flex-1">
              <div className={`truncate text-xs font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>
                {l}
              </div>
              {i < labels.length - 1 && (
                <div className="mt-2 h-0.5 rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: done ? "100%" : active ? "50%" : "0%" }} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
