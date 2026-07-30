import { createFileRoute } from "@tanstack/react-router";
import { ACCENTS, useTheme, type Accent, type Mode, type SeasonMode } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Sun, Moon, RotateCcw, Palette, Snowflake, Sprout, Flame, Leaf, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/settings/theme")({
  component: ThemePage,
});

const SEASONS: { id: SeasonMode; label: string; labelAr: string; icon: any }[] = [
  { id: "off", label: "Off", labelAr: "إيقاف", icon: Palette },
  { id: "auto", label: "Auto (by month)", labelAr: "تلقائي حسب الشهر", icon: Sparkles },
  { id: "winter", label: "Winter Frost", labelAr: "شتاء", icon: Snowflake },
  { id: "spring", label: "Spring Bloom", labelAr: "ربيع", icon: Sprout },
  { id: "summer", label: "Summer Energy", labelAr: "صيف", icon: Flame },
  { id: "autumn", label: "Autumn Warmth", labelAr: "خريف", icon: Leaf },
];

function ThemePage() {
  const { accent, mode, season, branding, setAccent, setMode, setSeason, setBranding, reset } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">المظهر والهوية</h1>
          <p className="text-sm text-muted-foreground">تحكم في ألوان الموقع، الوضع الليلي، والهوية البصرية</p>
        </div>
        <Button variant="outline" onClick={() => { reset(); toast.success("تم استرجاع الافتراضي"); }}>
          <RotateCcw className="ml-2 h-4 w-4" /> استرجاع الافتراضي
        </Button>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <h2 className="font-black">لون التمييز الأساسي</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(ACCENTS) as Accent[]).map((k) => {
            const a = ACCENTS[k];
            const active = accent === k && season === "off";
            return (
              <button
                key={k}
                onClick={() => { setAccent(k); setSeason("off"); }}
                className={`rounded-2xl border-2 p-4 text-right transition-all ${active ? "border-primary shadow-[var(--shadow-glow)]" : "border-border hover:border-primary/50"}`}
              >
                <div className="mb-3 h-12 w-full rounded-xl" style={{ background: a.hex, boxShadow: `0 10px 30px -10px ${a.hex}80` }} />
                <div className="font-black">{a.labelAr}</div>
                <div className="text-xs text-muted-foreground" dir="ltr">{a.label} · {a.hex}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-black">الوضع الموسمي التلقائي</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SEASONS.map((s) => {
            const Icon = s.icon;
            const active = season === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSeason(s.id)}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <Icon className="h-5 w-5" />
                <div className="text-xs font-bold">{s.labelAr}</div>
              </button>
            );
          })}
        </div>
        {season !== "off" && (
          <p className="mt-3 text-xs text-muted-foreground">اللون الأساسي يتغير تلقائياً حسب الموسم. اختر "إيقاف" للعودة للتحكم اليدوي.</p>
        )}
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          {mode === "dark" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
          <h2 className="font-black">وضع الشاشة</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["dark", "light"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-right transition-all ${mode === m ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
            >
              {m === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <div>
                <div className="font-black">{m === "dark" ? "داكن" : "فاتح"}</div>
                <div className="text-xs text-muted-foreground">{m === "dark" ? "الوضع الافتراضي" : "خلفية بيضاء"}</div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4">
          <h2 className="font-black">الهوية والعلامة</h2>
          <p className="text-xs text-muted-foreground">نصوص وشعارات تظهر في الموقع</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>اسم/شعار المؤسسة</Label>
            <Input value={branding.logoText} onChange={(e) => setBranding({ logoText: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>الفافيكون (رابط)</Label>
            <Input dir="ltr" value={branding.favicon} onChange={(e) => setBranding({ favicon: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>عنوان البانر (English)</Label>
            <Input dir="ltr" value={branding.bannerHeadline} onChange={(e) => setBranding({ bannerHeadline: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>عنوان البانر (عربي)</Label>
            <Input value={branding.bannerHeadlineAr} onChange={(e) => setBranding({ bannerHeadlineAr: e.target.value })} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>كلمات الآلة الكاتبة (Typewriter) — افصل بفاصلة</Label>
            <Input dir="ltr" value={branding.typewriter} onChange={(e) => setBranding({ typewriter: e.target.value })} />
          </div>
        </div>
      </Card>

      <p className="text-center text-xs text-muted-foreground">جميع التغييرات محفوظة محلياً في متصفحك تلقائياً</p>
    </div>
  );
}
