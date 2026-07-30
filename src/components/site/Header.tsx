import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Languages, LayoutDashboard, LogIn, Menu, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

function useSession() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);
  return signedIn;
}

const navKeys = [
  { to: "/", key: "nav_home" as const },
  { to: "/about", key: "nav_about" as const },
  { to: "/programs", key: "nav_programs" as const },
  { to: "/courses", key: "nav_courses" as const },
  { to: "/media", key: "nav_media" as const },
  { to: "/partners", key: "nav_partners" as const },
  { to: "/blog", key: "nav_blog" as const },
  { to: "/contact", key: "nav_contact" as const },
];

export function Header() {
  const { t, lang, setLang } = useT();
  const signedIn = useSession();
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-auto mt-3 flex max-w-7xl items-center justify-between gap-4 rounded-2xl px-4 py-2.5 glass shadow-[var(--shadow-card)] sm:mx-6 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-animated-gradient text-white shadow-[var(--shadow-glow)]">
            <Zap className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-black tracking-tight">{t("brand")}</div>
            <div className="text-[10px] font-medium text-muted-foreground">{t("tagline")}</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navKeys.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              activeProps={{ className: "bg-primary/15 text-primary" }}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {t(n.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="gap-1.5 rounded-lg font-semibold"
          >
            <Languages className="h-4 w-4" />
            {lang === "en" ? "AR" : "EN"}
          </Button>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 rounded-lg font-semibold">
            <Link to={signedIn ? "/admin" : "/auth"}>
              {signedIn ? <LayoutDashboard className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
              {signedIn ? "لوحة التحكم" : "تسجيل الدخول"}
            </Link>
          </Button>
          <Button
            asChild
            className="rounded-xl bg-gradient-to-r from-[var(--orange)] to-[var(--crimson)] text-white shadow-[var(--shadow-orange)] hover:brightness-110"
          >
            <Link to="/join">{t("cta_register")}</Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="mt-8 flex flex-col gap-1">
              {navKeys.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="rounded-lg px-3 py-2 text-base font-medium hover:bg-secondary"
                >
                  {t(n.key)}
                </Link>
              ))}
              <Link to="/admin" className="rounded-lg px-3 py-2 text-base font-medium hover:bg-secondary">
                {t("nav_admin")}
              </Link>
              <Button
                variant="ghost"
                onClick={() => setLang(lang === "en" ? "ar" : "en")}
                className="justify-start gap-2 rounded-lg font-semibold"
              >
                <Languages className="h-4 w-4" />
                {lang === "en" ? "العربية" : "English"}
              </Button>
              <Button
                asChild
                className="mt-4 rounded-xl bg-gradient-to-r from-[var(--orange)] to-[var(--crimson)] text-white"
              >
                <Link to="/join">{t("cta_register")}</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
