import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageSquare, Send, History } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  component: NotificationsPage,
});

type Ch = "sms" | "email" | "whatsapp";
const CHANNELS: { id: Ch; label: string; icon: any }[] = [
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "email", label: "Email", icon: Mail },
  { id: "whatsapp", label: "WhatsApp", icon: Send },
];

const SEED = [
  { id: "t1", name: "تأكيد التسجيل",       channel: "whatsapp" as Ch, subject: "أهلاً {{name}}", body: "تم استلام تسجيلك في {{program}} — {{branch}}. سنتواصل خلال ٢٤ ساعة." },
  { id: "t2", name: "قبول طلب توظيف",       channel: "email"    as Ch, subject: "تهانينا {{name}}", body: "يسعدنا إبلاغك بقبول طلبك لدور {{role}}. مرفق تفاصيل الخطوة التالية." },
  { id: "t3", name: "تذكير الحصة",          channel: "sms"      as Ch, subject: "",                body: "تذكير: حصة {{sport}} غداً {{time}} في {{branch}}." },
  { id: "t4", name: "تأكيد الدفع",          channel: "email"    as Ch, subject: "إيصال الدفع",     body: "تم استلام مبلغ {{amount}} — شكراً {{name}}." },
];

const AUDIT = [
  { at: "2026-07-25 14:32", who: "reem@usa", what: "عدّل قالب تأكيد التسجيل" },
  { at: "2026-07-25 12:10", who: "marcus@usa", what: "أضاف فرع West City" },
  { at: "2026-07-24 18:44", who: "zoe@usa", what: "نشر مقال جديد في المدونة" },
  { at: "2026-07-24 09:20", who: "reem@usa", what: "غيّر لون الهوية إلى Emerald" },
];

function NotificationsPage() {
  const [templates, setTemplates] = useState(SEED);
  const [selected, setSelected] = useState(SEED[0].id);
  const cur = templates.find(t => t.id === selected)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2"><Bell className="h-6 w-6 text-primary" /> مركز الإشعارات</h1>
        <p className="text-sm text-muted-foreground">قوالب SMS / Email / WhatsApp وسجل النشاط</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px,1fr]">
        <Card className="p-3">
          <div className="mb-2 text-xs font-black text-muted-foreground">القوالب</div>
          <div className="space-y-1">
            {templates.map(t => {
              const Icon = CHANNELS.find(c => c.id === t.channel)!.icon;
              return (
                <button key={t.id} onClick={() => setSelected(t.id)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-right text-sm ${selected === t.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 font-semibold">{t.name}</span>
                  <Badge variant="secondary" className="text-[10px] uppercase">{t.channel}</Badge>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-black">{cur.name}</div>
              <div className="text-xs text-muted-foreground">استخدم {"{{name}}"} و {"{{branch}}"} كمتغيرات</div>
            </div>
            <div className="flex gap-2">
              {CHANNELS.map(c => (
                <Button key={c.id} size="sm" variant={cur.channel === c.id ? "default" : "outline"}
                  onClick={() => setTemplates(ts => ts.map(t => t.id === cur.id ? { ...t, channel: c.id } : t))}>
                  <c.icon className="ml-2 h-3.5 w-3.5" /> {c.label}
                </Button>
              ))}
            </div>
          </div>
          {cur.channel === "email" && (
            <div className="mb-3 space-y-1.5">
              <Label>الموضوع</Label>
              <Input value={cur.subject} onChange={e => setTemplates(ts => ts.map(t => t.id === cur.id ? { ...t, subject: e.target.value } : t))} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>نص الرسالة</Label>
            <Textarea rows={8} value={cur.body} onChange={e => setTemplates(ts => ts.map(t => t.id === cur.id ? { ...t, body: e.target.value } : t))} />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => toast.success("تم إرسال رسالة اختبار (mock)")}>إرسال تجريبي</Button>
            <Button onClick={() => toast.success("تم الحفظ")}>حفظ القالب</Button>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h2 className="font-black">سجل النشاط</h2>
        </div>
        <div className="space-y-2">
          {AUDIT.map((a, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm">
              <div><span className="font-black">{a.who}</span> <span className="text-muted-foreground">— {a.what}</span></div>
              <div className="text-xs text-muted-foreground" dir="ltr">{a.at}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
