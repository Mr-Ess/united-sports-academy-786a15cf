import { createFileRoute } from "@tanstack/react-router";
import { Award, Compass, Eye, Flag, Heart, ShieldCheck, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SiteShell } from "@/components/site/SiteShell";
import { TEAM } from "@/lib/mock-data";
import { useT } from "@/lib/i18n";
import { SITE_CONFIG } from "@/lib/site-config";
import { useState } from "react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About — ${SITE_CONFIG.brand.en}` },
      { name: "description", content: `Our origin story, vision, values, and the leadership team behind ${SITE_CONFIG.brand.en}.` },
      { property: "og:title", content: `About ${SITE_CONFIG.brand.en}` },
      { property: "og:description", content: "Meet the team building the region's premier multi-sport academy." },
    ],
  }),
  component: About,
});

function About() {
  const { t, lang } = useT();
  const [open, setOpen] = useState<(typeof TEAM)[number] | null>(null);

  return (
    <SiteShell>
      <section className="relative py-20 sm:py-28">
        <div className="absolute inset-0 -z-10 mesh-bg" />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Kicker>{t("sec_who")}</Kicker>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            Built for <span className="gradient-text">every athlete</span>.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            {SITE_CONFIG.brand.en} was founded in 2014 by a coalition of Olympic-level coaches and community leaders who believed elite sports education shouldn't be a privilege reserved for the few. A decade later, we run 15+ branches training thousands of athletes across five disciplines every season.
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Kicker>{t("sec_vision")}</Kicker>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { icon: Eye, title: "Vision", body: "To be the region's most trusted multi-sport academy — where every child, teen, and adult finds a discipline they love and a community that lifts them." },
              { icon: Target, title: "Mission", body: "Deliver international-standard coaching in swimming, basketball, karate, volleyball, and fitness across every season, with pathways from beginner to professional." },
            ].map((v) => (
              <div key={v.title} className="rounded-3xl border neon-border bg-card p-8 shadow-[var(--shadow-card)]">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[var(--aqua)] to-[var(--aqua-glow)] text-[var(--navy)] shadow-[var(--shadow-glow)]">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-2xl font-black">{v.title}</h3>
                <p className="mt-2 text-muted-foreground">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Kicker>{t("sec_values")}</Kicker>
          <h2 className="mb-10 text-3xl font-black sm:text-4xl">The five pillars we coach by.</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { icon: Flag, key: "val_discipline" as const, tone: "aqua" },
              { icon: Heart, key: "val_sportsmanship" as const, tone: "orange" },
              { icon: Award, key: "val_excellence" as const, tone: "crimson" },
              { icon: Compass, key: "val_inclusivity" as const, tone: "lime" },
              { icon: ShieldCheck, key: "val_safety" as const, tone: "aqua" },
            ].map((v) => (
              <div key={v.key} className="rounded-2xl border bg-card p-5 text-center shadow-[var(--shadow-card)] transition-all hover-lift">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[var(--navy)] text-[var(--aqua)]">
                  <v.icon className="h-6 w-6" />
                </div>
                <div className="mt-3 text-sm font-black">{t(v.key)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Kicker>{t("sec_team")}</Kicker>
          <h2 className="mb-10 text-3xl font-black sm:text-4xl">Coaches, directors, and specialists.</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((p) => (
              <button
                key={p.id}
                onClick={() => setOpen(p)}
                className="group text-left rounded-3xl border bg-card p-6 shadow-[var(--shadow-card)] transition-all hover-lift"
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--orange)] to-[var(--crimson)] text-xl font-black text-white shadow-[var(--shadow-orange)]">
                    {p.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div className="text-lg font-black">{lang === "ar" ? p.nameAr : p.name}</div>
                    <div className="text-xs font-semibold text-primary">{p.role}</div>
                  </div>
                </div>
                <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{p.bio}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="rounded-full text-[10px] uppercase tracking-wider">{tag}</Badge>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
            <DialogContent className="max-w-lg">
              {open && (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-2xl">{lang === "ar" ? open.nameAr : open.name}</DialogTitle>
                  </DialogHeader>
                  <div className="text-sm font-semibold text-primary">{open.role}</div>
                  <p className="text-sm text-muted-foreground">{open.bio}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {open.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="rounded-full">{tag}</Badge>
                    ))}
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </SiteShell>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
      <Sparkles className="h-3.5 w-3.5" /> {children}
    </div>
  );
}
