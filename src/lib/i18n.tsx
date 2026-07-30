import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { SITE_CONFIG } from "./site-config";

export type Lang = "en" | "ar";

type Dict = Record<string, { en: string; ar: string }>;

export const DICT: Dict = {
  // Brand
  brand: { en: "United Sport Academy", ar: "أكاديمية يونايتد الرياضية" },
  tagline: { en: "Multi-Sport · All Season", ar: "متعدد الرياضات · كل الفصول" },

  // Nav
  nav_home: { en: "Home", ar: "الرئيسية" },
  nav_about: { en: "About", ar: "من نحن" },
  nav_media: { en: "Media", ar: "الكواليس والمكتبة" },
  nav_programs: { en: "Programs", ar: "البرامج" },
  nav_courses: { en: "Courses", ar: "الكورسات" },
  nav_partners: { en: "Partners", ar: "شركاء النجاح" },
  nav_blog: { en: "Blog", ar: "المدونة" },
  nav_join: { en: "Join", ar: "الانضمام" },
  nav_contact: { en: "Contact", ar: "اتصل بنا" },
  nav_admin: { en: "Admin", ar: "الإدارة" },

  // CTAs
  cta_join: { en: "Join Academy", ar: "انضم للأكاديمية" },
  cta_explore: { en: "Explore Programs", ar: "استكشف البرامج" },
  cta_register: { en: "Register Now", ar: "سجل الآن" },
  cta_view_media: { en: "View Full Behind The Scenes Library", ar: "المزيد من كواليس الأكاديمية" },
  cta_download: { en: "Download", ar: "تحميل" },
  cta_submit: { en: "Submit", ar: "إرسال" },
  cta_learn_more: { en: "Learn more", ar: "اعرف المزيد" },

  // Hero
  hero_kicker: { en: "2026 Season Enrollment Now Open", ar: "التسجيل مفتوح لموسم ٢٠٢٦" },
  hero_master: { en: "Master the art of", ar: "أتقن فن" },
  hero_sub: {
    en: "One academy. Every sport. Every season. Elite coaching for swimming, basketball, karate, volleyball, and fitness — under one roof.",
    ar: "أكاديمية واحدة. كل الرياضات. كل الفصول. تدريب نخبة للسباحة وكرة السلة والكاراتيه والكرة الطائرة واللياقة تحت سقف واحد.",
  },

  // Sections
  sec_programs: { en: "Our Programs", ar: "برامجنا" },
  sec_programs_sub: { en: "Filter by age, level, and season. Certified coaches, tiny class ratios.", ar: "اختر حسب العمر والمستوى والفصل. مدربون معتمدون ومجموعات صغيرة." },
  sec_who: { en: "Who We Are", ar: "من نحن" },
  sec_vision: { en: "Vision & Mission", ar: "الرؤية والهدف" },
  sec_values: { en: "Core Principles & Values", ar: "المبادئ والقيم" },
  sec_team: { en: "Team & Leadership", ar: "فريق العمل والقيادة" },
  sec_photos: { en: "Photos Album", ar: "ألبوم الصور" },
  sec_videos: { en: "Video Reels", ar: "مكتبة الفيديو" },
  sec_notes: { en: "Study Notes & Guides", ar: "مكتبة المذكرات والموارد" },
  sec_partners: { en: "Success Partners", ar: "شركاء النجاح" },
  sec_partners_sub: { en: "Federations, sponsors, and institutional partners advancing our mission.", ar: "الاتحادات والرعاة والشركاء المؤسسيون الذين يعززون مهمتنا." },
  sec_blog: { en: "Academy Blog", ar: "مدونة الأكاديمية" },
  sec_impact: { en: "Academy Impact", ar: "أثر الأكاديمية" },
  sec_behind: { en: "Behind the Scenes", ar: "من كواليس الأكاديمية" },
  sec_join: { en: "Join United Sport", ar: "انضم إلى الأكاديمية" },
  sec_contact: { en: "Contact & Branches", ar: "التواصل والفروع" },

  // Metrics
  m_athletes: { en: "Champions trained", ar: "أبطال تم تدريبهم" },
  m_branches: { en: "Branches", ar: "فروع" },
  m_coaches: { en: "Certified coaches", ar: "مدربون معتمدون" },
  m_titles: { en: "Regional titles", ar: "ألقاب إقليمية" },

  // Values
  val_discipline: { en: "Discipline", ar: "الانضباط" },
  val_sportsmanship: { en: "Sportsmanship", ar: "الروح الرياضية" },
  val_excellence: { en: "Excellence", ar: "التميز" },
  val_inclusivity: { en: "Inclusivity", ar: "الشمولية" },
  val_safety: { en: "Safety First", ar: "السلامة أولاً" },

  // Contact
  phone: { en: "Phone", ar: "هاتف" },
  whatsapp: { en: "WhatsApp", ar: "واتساب" },
  email: { en: "Email", ar: "البريد" },
  hours: { en: "Hours", ar: "المواعيد" },
  branch_select: { en: "Select branch", ar: "اختر الفرع" },
  msg_name: { en: "Your name", ar: "الاسم" },
  msg_email: { en: "Your email", ar: "البريد" },
  msg_message: { en: "Message", ar: "الرسالة" },
  msg_send: { en: "Send message", ar: "إرسال الرسالة" },

  // Join tabs
  tab_member: { en: "Member", ar: "عضو" },
  tab_job: { en: "Career", ar: "توظيف" },
  tab_volunteer: { en: "Volunteer", ar: "تطوع" },
  tab_workshop: { en: "Workshop", ar: "ورشة" },
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof DICT) => string;
  dir: "ltr" | "rtl";
};

const LangCtx = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("usa-lang") as Lang | null;
      if (saved === "ar" || saved === "en") setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
    try { window.localStorage.setItem("usa-lang", lang); } catch {}
  }, [lang]);

  const value: Ctx = {
    lang,
    setLang: setLangState,
    t: (k) => DICT[k]?.[lang] ?? String(k),
    dir: lang === "ar" ? "rtl" : "ltr",
  };
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useT() {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useT must be used within LangProvider");
  return ctx;
}
