/**
 * Central site configuration.
 * Edit values here to rebrand the public website, meta tags, contact info,
 * and shared academy copy in one place.
 */

export type Localized = { en: string; ar: string };

export const SITE_CONFIG = {
  /** Public brand name shown in header, footer, meta tags, and admin shell. */
  brand: {
    en: "United Sport Academy",
    ar: "أكاديمية يونايتد الرياضية",
  } satisfies Localized,

  /** Short tagline under the logo. */
  tagline: {
    en: "Multi-Sport · All Season",
    ar: "متعدد الرياضات · كل الفصول",
  } satisfies Localized,

  /** Domain used for branch and staff email addresses. */
  domain: "unitedsport.ac",

  /** Phone/WhatsApp number prefixes used across branch contact cards. */
  contact: {
    phonePrefix: "+971 4 555",
    whatsappPrefix: "+971 50 555",
  },

  /** Default homepage / root meta information. */
  meta: {
    defaultTitle: "Multi-Sport & All-Season Training",
    defaultDescription:
      "One academy. Every sport. Every season. Elite coaching for swimming, basketball, karate, volleyball, and fitness — under one roof.",
  },

  /** Hero section copy. */
  hero: {
    kicker: {
      en: "2026 Season Enrollment Now Open",
      ar: "التسجيل مفتوح لموسم ٢٠٢٦",
    } satisfies Localized,
    sub: {
      en: "One academy. Every sport. Every season. Elite coaching for swimming, basketball, karate, volleyball, and fitness — under one roof.",
      ar: "أكاديمية واحدة. كل الرياضات. كل الفصول. تدريب نخبة للسباحة وكرة السلة والكاراتيه والكرة الطائرة واللياقة تحت سقف واحد.",
    } satisfies Localized,
  },

  /** Footer / newsletter copy. */
  footer: {
    newsletterText: "Season previews, athlete stories, and open enrollment alerts.",
    newsletterButton: "Join",
  },

  /** Admin shell sidebar label. */
  admin: {
    sidebarLabel: "United Sport Academy",
  },
} as const;

/** Build a page-specific meta title: "Page — Brand Name". */
export function pageTitle(pageName: string, lang: "en" | "ar" = "en"): string {
  const brand = SITE_CONFIG.brand[lang];
  return lang === "ar" ? `${brand} — ${pageName}` : `${pageName} — ${brand}`;
}

/** Build a branch email address from a local part and the configured domain. */
export function branchEmail(localPart: string): string {
  return `${localPart}@${SITE_CONFIG.domain}`;
}
