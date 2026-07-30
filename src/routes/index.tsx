import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Camera, Play, Sparkles, Trophy, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/site/SiteShell";
import { Hero } from "@/components/site/Hero";
import { GALLERY, SPORTS, VIDEOS } from "@/lib/mock-data";
import { useT } from "@/lib/i18n";
import { SITE_CONFIG } from "@/lib/site-config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${SITE_CONFIG.brand.en} — ${SITE_CONFIG.meta.defaultTitle}` },
      { name: "description", content: SITE_CONFIG.meta.defaultDescription },
      { property: "og:title", content: SITE_CONFIG.brand.en },
      { property: "og:description", content: "One academy. Every sport. Every season." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [season, setSeason] = useState<string>("Summer");
  const { t } = useT();
  return (
    <SiteShell>
      <Hero season={season} setSeason={setSeason} />

      {/* Sports quick grid */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionKicker icon={<Zap className="h-3.5 w-3.5" />} label={t("sec_programs")} />
          <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
              Find your <span className="gradient-text">discipline</span>.
            </h2>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/programs">{t("cta_explore")} <ArrowRight className="ml-1 h-4 w-4 rtl-flip" /></Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SPORTS.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  to="/programs"
                  key={s.id}
                  className="group relative overflow-hidden rounded-3xl border bg-card p-6 shadow-[var(--shadow-card)] transition-all hover-lift"
                >
                  <div className={`absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${s.gradient} opacity-20 blur-2xl transition-all group-hover:opacity-40`} />
                  <div className={`relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.gradient} text-white shadow-lg`}>
                    <Icon className="h-7 w-7" strokeWidth={2.2} />
                  </div>
                  <h3 className="mt-5 text-2xl font-black tracking-tight">{s.name}</h3>
                  <p className="text-sm text-muted-foreground">{s.tagline}</p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Users className="h-3.5 w-3.5" /> {s.students.toLocaleString()} enrolled
                  </div>
                </Link>
              );
            })}
            <Link to="/programs" className="grid place-items-center rounded-3xl border border-dashed bg-card/40 p-6 text-center text-muted-foreground transition-all hover:text-foreground">
              <div>
                <Sparkles className="mx-auto mb-2 h-6 w-6" />
                <div className="font-bold">+ Seasonal Camps</div>
                <div className="text-xs">Summer · Autumn · Winter · Spring</div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Behind the scenes teaser */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionKicker icon={<Camera className="h-3.5 w-3.5" />} label={t("sec_behind")} />
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
              Behind the <span className="gradient-text">scenes</span>.
            </h2>
            <Button asChild className="rounded-xl bg-gradient-to-r from-[var(--aqua)] to-[var(--aqua-glow)] text-[var(--navy)] shadow-[var(--shadow-glow)]">
              <Link to="/media">{t("cta_view_media")} <ArrowRight className="ml-1 h-4 w-4 rtl-flip" /></Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-5">
            {GALLERY.slice(0, 3).map((g) => (
              <Link
                to="/media"
                key={g.id}
                className="group relative aspect-square overflow-hidden rounded-2xl shadow-[var(--shadow-card)] transition-all hover:scale-[1.02] hover:shadow-[var(--shadow-glow)] sm:aspect-auto sm:h-64"
                style={{
                  background: `linear-gradient(135deg, hsl(${g.color}) 0%, hsl(${g.color} / 0.4) 100%)`,
                }}
              >
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">{g.season}</div>
                  <div className="text-sm font-bold text-white">{g.title}</div>
                </div>
              </Link>
            ))}
            {VIDEOS.slice(0, 2).map((v) => {
              const sp = SPORTS.find((s) => s.id === v.sport)!;
              return (
                <Link
                  to="/media"
                  key={v.id}
                  className={`group relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br ${sp.gradient} shadow-[var(--shadow-card)] transition-all hover:scale-[1.02] hover:shadow-[var(--shadow-glow)] sm:aspect-auto sm:h-64`}
                >
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-white/95 text-primary shadow-xl transition-transform group-hover:scale-110">
                      <Play className="ml-0.5 h-5 w-5 fill-current" />
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">{v.duration}</div>
                    <div className="text-sm font-bold text-white">{v.title}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionKicker icon={<Trophy className="h-3.5 w-3.5" />} label={t("sec_impact")} />
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { v: "5,000+", l: t("m_athletes") },
              { v: "15+", l: t("m_branches") },
              { v: "40+", l: t("m_coaches") },
              { v: "128", l: t("m_titles") },
            ].map((s) => (
              <div key={s.l} className="rounded-3xl border bg-card p-8 text-center shadow-[var(--shadow-card)]">
                <div className="gradient-text text-4xl font-black sm:text-5xl">{s.v}</div>
                <div className="mt-2 text-sm text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border neon-border p-10 text-center sm:p-16">
            <div className="absolute inset-0 -z-10 mesh-bg" />
            <h2 className="text-3xl font-black sm:text-5xl">
              Ready to <span className="gradient-text">move</span>?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Join thousands of athletes training every season across our branches.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="rounded-xl bg-gradient-to-r from-[var(--orange)] to-[var(--crimson)] text-white shadow-[var(--shadow-orange)]">
                <Link to="/join">{t("cta_register")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <Link to="/contact">{t("nav_contact")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function SectionKicker({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
      {icon} {label}
    </div>
  );
}
