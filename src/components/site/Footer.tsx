import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SITE_CONFIG } from "@/lib/site-config";

export function Footer() {
  const { t } = useT();
  return (
    <footer className="mt-20 border-t border-white/10 bg-[oklch(0.11_0.03_260)] text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-animated-gradient">
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-base font-black text-white">{t("brand")}</div>
          </div>
          <p className="mt-4 text-sm text-white/60">
            {t("hero_sub")}
          </p>
        </div>
        <div>
          <div className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Explore</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-white">{t("nav_about")}</Link></li>
            <li><Link to="/programs" className="hover:text-white">{t("nav_programs")}</Link></li>
            <li><Link to="/media" className="hover:text-white">{t("nav_media")}</Link></li>
            <li><Link to="/partners" className="hover:text-white">{t("nav_partners")}</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Connect</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/blog" className="hover:text-white">{t("nav_blog")}</Link></li>
            <li><Link to="/join" className="hover:text-white">{t("nav_join")}</Link></li>
            <li><Link to="/contact" className="hover:text-white">{t("nav_contact")}</Link></li>
            <li><Link to="/admin" className="hover:text-white">{t("nav_admin")}</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Newsletter</div>
          <p className="text-sm text-white/60">{SITE_CONFIG.footer.newsletterText}</p>
          <form className="mt-3 flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[var(--aqua)] focus:outline-none"
            />
            <button className="rounded-lg bg-gradient-to-r from-[var(--aqua)] to-[var(--aqua-glow)] px-3 py-2 text-xs font-bold text-[var(--navy)]">
              {SITE_CONFIG.footer.newsletterButton}
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © 2026 {t("brand")}. Move. Compete. Belong.
      </div>
    </footer>
  );
}
