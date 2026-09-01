import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Play, Sparkles, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEASONS } from "@/lib/mock-data";
import { useT } from "@/lib/i18n";

const wordsEn = ["Swimming", "Basketball", "Karate", "Fitness", "Volleyball"];
const wordsAr = ["السباحة", "كرة السلة", "الكاراتيه", "اللياقة", "الكرة الطائرة"];

export function Hero({
  season,
  setSeason,
}: {
  season: string;
  setSeason: (s: string) => void;
}) {
  const { t, lang } = useT();
  const words = lang === "ar" ? wordsAr : wordsEn;
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % words.length), 2200);
    return () => clearInterval(t);
  }, [words.length]);

  return (
    <section className="relative overflow-hidden pt-10 pb-24 sm:pt-16 sm:pb-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 mesh-bg" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="absolute left-[6%] top-[22%] hidden animate-float rounded-2xl px-3 py-2 text-xs font-semibold text-white glass-dark md:block">
          🏊 200+ Swim Lanes / Week
        </div>
        <div
          className="absolute right-[8%] top-[30%] hidden animate-float rounded-2xl px-3 py-2 text-xs font-semibold text-white glass-dark md:block"
          style={{ animationDelay: "1.2s" }}
        >
          🏀 League MVPs 12×
        </div>
        <div
          className="absolute right-[16%] bottom-[14%] hidden animate-float rounded-2xl px-3 py-2 text-xs font-semibold text-white glass-dark md:block"
          style={{ animationDelay: "2s" }}
        >
          🥋 Black Belts 340+
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 text-foreground sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[var(--orange)]" />
            {t("hero_kicker")}
          </div>

          <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            {t("hero_master")}
            <br />
            <span className="relative inline-block">
              <span
                key={words[i]}
                className="animate-fade-up gradient-text"
              >
                {words[i]}
              </span>
              <span className="ml-1 inline-block h-[0.9em] w-1 translate-y-1 bg-[var(--aqua)] align-middle animate-pulse-glow" />
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {t("hero_sub")}
          </p>

          <div className="mt-8 inline-flex flex-wrap justify-center gap-2 rounded-2xl p-2 glass-dark">
            {SEASONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSeason(s.id)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  season === s.id
                    ? "bg-gradient-to-r from-[var(--orange)] to-[var(--crimson)] text-white shadow-[var(--shadow-orange)]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <span className="mx-1.5">{s.emoji}</span>
                {lang === "ar" ? s.labelAr : s.label}
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="group h-12 rounded-2xl bg-gradient-to-r from-[var(--orange)] to-[var(--crimson)] px-6 text-base font-semibold text-white shadow-[var(--shadow-orange)] hover:brightness-110 shine"
            >
              <Link to="/join">
                {t("cta_join")}
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1 rtl-flip" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-2xl border-white/25 bg-white/5 px-6 text-base font-semibold text-white backdrop-blur hover:bg-white/10 hover:text-white"
            >
              <Link to="/programs">
                <Play className="mr-1 h-4 w-4" />
                {t("cta_explore")}
              </Link>
            </Button>
          </div>

          <div className="mt-14 grid w-full grid-cols-3 gap-3 sm:gap-6">
            {[
              { icon: Users, label: t("m_athletes"), value: "5,000+" },
              { icon: Trophy, label: t("m_titles"), value: "128" },
              { icon: Sparkles, label: t("m_coaches"), value: "40+" },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl p-4 text-start glass-dark sm:p-6">
                <m.icon className="mb-2 h-5 w-5 text-[var(--aqua)]" />
                <div className="text-2xl font-black sm:text-3xl">{m.value}</div>
                <div className="text-xs text-muted-foreground sm:text-sm">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
