import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Accent = "aqua" | "orange" | "crimson" | "emerald";
export type Mode = "dark" | "light";
export type SeasonMode = "off" | "auto" | "winter" | "spring" | "summer" | "autumn";

export const ACCENTS: Record<Accent, { label: string; labelAr: string; hex: string; oklch: string; ring: string }> = {
  aqua:    { label: "Neon Aqua",       labelAr: "أزرق نيون",  hex: "#00f2fe", oklch: "0.85 0.17 210", ring: "0.85 0.17 210" },
  orange:  { label: "Energetic Orange", labelAr: "برتقالي حيوي", hex: "#ff7a00", oklch: "0.78 0.19 55",  ring: "0.78 0.19 55" },
  crimson: { label: "Crimson Red",      labelAr: "أحمر قرمزي",  hex: "#ff2a5f", oklch: "0.65 0.26 15",  ring: "0.65 0.26 15" },
  emerald: { label: "Emerald Green",    labelAr: "أخضر زمردي",  hex: "#00e676", oklch: "0.82 0.2 150",  ring: "0.82 0.2 150" },
};

export type Branding = {
  logoText: string;
  favicon: string;
  bannerHeadline: string;
  bannerHeadlineAr: string;
  typewriter: string; // comma-separated
};

const DEFAULT_BRANDING: Branding = {
  logoText: "United Sport Academy",
  favicon: "/favicon.ico",
  bannerHeadline: "Master the art of",
  bannerHeadlineAr: "أتقن فن",
  typewriter: "swimming,basketball,karate,volleyball,fitness",
};

type ThemeState = {
  accent: Accent;
  mode: Mode;
  season: SeasonMode;
  branding: Branding;
  setAccent: (a: Accent) => void;
  setMode: (m: Mode) => void;
  setSeason: (s: SeasonMode) => void;
  setBranding: (b: Partial<Branding>) => void;
  reset: () => void;
};

const ThemeCtx = createContext<ThemeState | null>(null);
const LS_KEY = "usa-theme-v1";

function currentSeason(): "winter" | "spring" | "summer" | "autumn" {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

const SEASON_ACCENT: Record<"winter"|"spring"|"summer"|"autumn", Accent> = {
  winter: "aqua",
  spring: "emerald",
  summer: "orange",
  autumn: "crimson",
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<Accent>("aqua");
  const [mode, setModeState] = useState<Mode>("dark");
  const [season, setSeasonState] = useState<SeasonMode>("off");
  const [branding, setBrandingState] = useState<Branding>(DEFAULT_BRANDING);

  // hydrate
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.accent) setAccentState(s.accent);
        if (s.mode) setModeState(s.mode);
        if (s.season) setSeasonState(s.season);
        if (s.branding) setBrandingState({ ...DEFAULT_BRANDING, ...s.branding });
      }
    } catch {}
  }, []);

  // effective accent (season overrides)
  const effectiveAccent: Accent = useMemo(() => {
    if (season === "off") return accent;
    if (season === "auto") return SEASON_ACCENT[currentSeason()];
    return SEASON_ACCENT[season];
  }, [accent, season]);

  // apply CSS vars + classes
  useEffect(() => {
    const root = document.documentElement;
    const a = ACCENTS[effectiveAccent];
    root.style.setProperty("--primary", `oklch(${a.oklch})`);
    root.style.setProperty("--ring", `oklch(${a.ring})`);
    root.style.setProperty("--accent", `oklch(${a.oklch})`);
    root.classList.toggle("light", mode === "light");
    root.classList.toggle("dark", mode === "dark");
    root.dataset.season = season === "off" ? "" : season === "auto" ? currentSeason() : season;
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify({ accent, mode, season, branding }));
    } catch {}
  }, [effectiveAccent, mode, season, accent, branding]);

  const value: ThemeState = {
    accent, mode, season, branding,
    setAccent: setAccentState,
    setMode: setModeState,
    setSeason: setSeasonState,
    setBranding: (b) => setBrandingState((prev) => ({ ...prev, ...b })),
    reset: () => {
      setAccentState("aqua"); setModeState("dark"); setSeasonState("off");
      setBrandingState(DEFAULT_BRANDING);
    },
  };
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
