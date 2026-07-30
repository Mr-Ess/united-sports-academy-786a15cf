import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Handshake, Sparkles, Trophy, Calendar, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SiteShell } from "@/components/site/SiteShell";
import { PARTNERS } from "@/lib/mock-data";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "Success Partners — United Sport Academy" },
      { name: "description", content: "Federations, sponsors, and institutional partners powering United Sport Academy." },
      { property: "og:title", content: "Success Partners — United Sport Academy" },
      { property: "og:description", content: "Meet the organizations advancing our mission." },
    ],
  }),
  component: PartnersPage,
});

const CATEGORIES = [
  { id: "all",          label: "All",                     labelAr: "الكل" },
  { id: "Federation",   label: "Sports Federations",       labelAr: "اتحادات رياضية" },
  { id: "League",       label: "Leagues",                  labelAr: "دوريات" },
  { id: "Sponsor",      label: "Corporate Sponsors",       labelAr: "رعاة" },
  { id: "Institutional",label: "Institutional Partners",   labelAr: "شركاء مؤسسيون" },
];

// enrichment layer over mock data
const ENRICH: Record<string, {
  level: string; levelAr: string;
  bullets: { en: string; ar: string }[];
  timeline: { year: string; en: string; ar: string }[];
  perks: { en: string; ar: string }[];
}> = {};

function pickLevel(idx: number) {
  const levels = [
    { level: "Gold Sponsor",           labelAr: "راعي ذهبي" },
    { level: "Strategic Partner",      labelAr: "شريك استراتيجي" },
    { level: "Official Equipment Supplier", labelAr: "المورد الرسمي للمعدات" },
    { level: "Platinum Partner",       labelAr: "شريك بلاتيني" },
  ];
  return levels[idx % levels.length];
}

function PartnersPage() {
  const { t, lang } = useT();
  const [cat, setCat] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const enriched = useMemo(() => PARTNERS.map((p, i) => {
    const lvl = pickLevel(i);
    return {
      ...p,
      level: lvl.level,
      levelAr: lvl.labelAr,
      bullets: [
        { en: "Multi-year strategic collaboration with 3 flagship programs.", ar: "تعاون استراتيجي متعدد السنوات في ٣ برامج رئيسية." },
        { en: "Co-funded 5+ national tournaments and clinics.", ar: "تمويل مشترك لأكثر من ٥ بطولات وعيادات وطنية." },
        { en: "200+ students benefited from joint initiatives.", ar: "أكثر من ٢٠٠ طالب استفادوا من المبادرات المشتركة." },
      ],
      timeline: [
        { year: "2024", en: "Partnership signed", ar: "توقيع الشراكة" },
        { year: "2025", en: "First joint championship", ar: "أول بطولة مشتركة" },
        { year: "2026", en: "Scholarship program launched", ar: "إطلاق برنامج المنح" },
      ],
      perks: [
        { en: "15% discount on select programs for members.", ar: "خصم ١٥٪ على برامج مختارة للأعضاء." },
        { en: "Priority seat for annual summer camp.", ar: "أولوية حجز مقاعد المعسكر الصيفي." },
      ],
    };
  }), []);

  const filtered = cat === "all" ? enriched : enriched.filter(p => p.cat === cat);
  const active = openId ? enriched.find(p => p.id === openId) : null;

  return (
    <SiteShell>
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> {t("sec_partners")}
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
              Partners of <span className="gradient-text">success</span>.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t("sec_partners_sub")}</p>
          </div>

          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map(c => (
              <Button key={c.id} size="sm" variant={cat === c.id ? "default" : "outline"} onClick={() => setCat(c.id)} className="rounded-full">
                {lang === "ar" ? c.labelAr : c.label}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setOpenId(p.id)}
                className="group overflow-hidden rounded-3xl border bg-card text-right shadow-[var(--shadow-card)] transition-all hover-lift"
              >
                <div className="grid h-32 place-items-center border-b" style={{ background: `linear-gradient(135deg, hsl(${p.color}) 0%, hsl(${p.color} / 0.35) 100%)` }}>
                  <div className="rounded-xl bg-black/40 px-4 py-2 text-lg font-black tracking-wider text-white backdrop-blur">
                    {(lang === "ar" ? p.nameAr : p.name).split(" ").slice(0, 3).map((w) => w[0]).join("")}
                  </div>
                </div>
                <div className="p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-full text-[10px] uppercase tracking-wider">{p.cat}</Badge>
                    <Badge className="rounded-full bg-primary/15 text-primary text-[10px]">{lang === "ar" ? p.levelAr : p.level}</Badge>
                  </div>
                  <div className="text-lg font-black">{lang === "ar" ? p.nameAr : p.name}</div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.collab}</p>
                </div>
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="grid place-items-center rounded-3xl border bg-card p-12 text-muted-foreground">
              <Handshake className="mb-3 h-10 w-10" /> لا يوجد شركاء في هذه الفئة بعد.
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!openId} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-w-2xl">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">{lang === "ar" ? active.nameAr : active.name}</DialogTitle>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full">{active.cat}</Badge>
                  <Badge className="rounded-full bg-primary/15 text-primary">{lang === "ar" ? active.levelAr : active.level}</Badge>
                </div>
              </DialogHeader>

              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex items-center gap-2 font-black"><Handshake className="h-4 w-4 text-primary" /> نطاق التعاون</div>
                  <p className="text-sm text-muted-foreground">{active.collab}</p>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {active.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{lang === "ar" ? b.ar : b.en}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2 font-black"><Calendar className="h-4 w-4 text-primary" /> الجدول الزمني للفعاليات المشتركة</div>
                  <div className="relative space-y-3 pr-4">
                    <div className="absolute right-1.5 top-0 h-full w-px bg-border" />
                    {active.timeline.map((e, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -right-[7px] top-1.5 h-3 w-3 rounded-full bg-primary" />
                        <div className="pr-3">
                          <div className="text-xs font-black text-primary">{e.year}</div>
                          <div className="text-sm">{lang === "ar" ? e.ar : e.en}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2 font-black"><Gift className="h-4 w-4 text-primary" /> برامج وخصومات مشتركة</div>
                  <ul className="space-y-1.5 text-sm">
                    {active.perks.map((p, i) => (
                      <li key={i} className="flex items-start gap-2"><Trophy className="mt-0.5 h-4 w-4 text-primary shrink-0" />{lang === "ar" ? p.ar : p.en}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SiteShell>
  );
}
