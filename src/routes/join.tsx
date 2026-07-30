import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { FormsWizard } from "@/components/site/FormsWizard";
import { useT } from "@/lib/i18n";
import { SITE_CONFIG } from "@/lib/site-config";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join — United Sport Academy" },
      { name: "description", content: "Enroll as a member, apply for a coaching or staff role, volunteer, or sign up for a seasonal workshop." },
      { property: "og:title", content: "Join United Sport Academy" },
      { property: "og:description", content: "One portal for members, careers, volunteers, and workshops." },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const { t } = useT();
  return (
    <SiteShell>
      <section className="pt-16 sm:pt-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> {t("sec_join")}
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            One form. <span className="gradient-text">Every pathway</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Enroll as a member, apply to coach, volunteer, or sign up for a seasonal masterclass.
          </p>
        </div>
      </section>
      <FormsWizard />
    </SiteShell>
  );
}
