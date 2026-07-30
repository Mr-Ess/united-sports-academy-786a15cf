import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Filter, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/site/SiteShell";
import { SEASONS, SPORTS } from "@/lib/mock-data";
import { useT } from "@/lib/i18n";
import { SITE_CONFIG } from "@/lib/site-config";

export const Route = createFileRoute("/programs")({
  head: () => ({
    meta: [
      { title: `Programs & Seasonal Camps — ${SITE_CONFIG.brand.en}` },
      { name: "description", content: "All sports and seasonal clinics — filter by season, sport, age, and skill level." },
      { property: "og:title", content: `Programs — ${SITE_CONFIG.brand.en}` },
      { property: "og:description", content: "Every discipline. Every season. Every level." },
    ],
  }),
  component: ProgramsPage,
});

const AGES = ["All", "3-5", "6-12", "13-17", "Adult"];
const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];

function ProgramsPage() {
  const { t, lang } = useT();
  const [age, setAge] = useState("All");
  const [level, setLevel] = useState("All");
  const [season, setSeason] = useState("Summer");
  const [sportFilter, setSportFilter] = useState("all");

  const filtered = useMemo(
    () =>
      SPORTS.filter(
        (s) =>
          (age === "All" || (s.ageGroups as readonly string[]).includes(age)) &&
          (level === "All" || (s.levels as readonly string[]).includes(level)) &&
          (s.seasons as readonly string[]).includes(season) &&
          (sportFilter === "all" || s.id === sportFilter),
      ),
    [age, level, season, sportFilter],
  );

  return (
    <SiteShell>
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> {t("sec_programs")}
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
              Every <span className="gradient-text">discipline</span>. Every season.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{t("sec_programs_sub")}</p>
          </div>

          {/* Season strip */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex flex-wrap justify-center gap-2 rounded-2xl p-2 glass">
              {SEASONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSeason(s.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    season === s.id
                      ? "bg-gradient-to-r from-[var(--orange)] to-[var(--crimson)] text-white shadow-[var(--shadow-orange)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="mx-1.5">{s.emoji}</span>{lang === "ar" ? s.labelAr : s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2 rounded-2xl p-2 glass">
            <Filter className="mx-2 h-4 w-4 text-muted-foreground" />
            <FilterGroup label="Sport" value={sportFilter} setValue={setSportFilter} options={["all", ...SPORTS.map((s) => s.id)]} labels={{ all: "All", ...Object.fromEntries(SPORTS.map((s) => [s.id, s.name])) }} />
            <div className="hidden h-6 w-px bg-border sm:block" />
            <FilterGroup label="Age" value={age} setValue={setAge} options={AGES} />
            <div className="hidden h-6 w-px bg-border sm:block" />
            <FilterGroup label="Level" value={level} setValue={setLevel} options={LEVELS} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={s.id} className="group relative overflow-hidden rounded-3xl border bg-card p-6 shadow-[var(--shadow-card)] transition-all hover-lift" style={{ animationDelay: `${idx * 80}ms` }}>
                  <div className={`absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${s.gradient} opacity-20 blur-2xl transition-all group-hover:opacity-40`} />
                  <div className={`relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.gradient} text-white shadow-lg`}>
                    <Icon className="h-7 w-7" strokeWidth={2.2} />
                  </div>
                  <h3 className="mt-5 text-2xl font-black tracking-tight">{lang === "ar" ? s.nameAr : s.name}</h3>
                  <p className="text-sm font-medium text-muted-foreground">{s.tagline}</p>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/80">{s.description}</p>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {s.levels.map((l) => (
                      <Badge key={l} variant="secondary" className="rounded-full text-[10px] font-semibold uppercase tracking-wider">{l}</Badge>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> {s.students.toLocaleString()} enrolled
                    </div>
                    <Button asChild size="sm" className="rounded-lg bg-gradient-to-r from-[var(--orange)] to-[var(--crimson)] text-xs text-white">
                      <a href="/join">{t("cta_register")}</a>
                    </Button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
                No programs match those filters this {season}. Try widening age or level.
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function FilterGroup({ label, value, setValue, options, labels }: { label: string; value: string; setValue: (v: string) => void; options: string[]; labels?: Record<string, string> }) {
  return (
    <div className="flex items-center gap-1">
      <span className="mx-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => setValue(o)}
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
            value === o ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          {labels?.[o] ?? o}
        </button>
      ))}
    </div>
  );
}
