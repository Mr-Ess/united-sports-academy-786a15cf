import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Clock, Mail, MapPin, MessageCircle, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SiteShell } from "@/components/site/SiteShell";
import { BRANCHES } from "@/lib/mock-data";
import { useT } from "@/lib/i18n";
import { SITE_CONFIG } from "@/lib/site-config";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Branches — United Sport Academy" },
      { name: "description", content: "Reach any United Sport Academy branch — phone, WhatsApp, email, hours, and location." },
      { property: "og:title", content: "Contact — United Sport Academy" },
      { property: "og:description", content: "Get in touch with any of our branches." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t, lang } = useT();
  const [branchId, setBranchId] = useState<string>(BRANCHES[0].id);
  const branch = BRANCHES.find((b) => b.id === branchId)!;

  return (
    <SiteShell>
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> {t("sec_contact")}
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
              Visit a <span className="gradient-text">branch</span>.
            </h1>
          </div>

          {/* Branch tabs */}
          <div className="mb-8 flex flex-wrap justify-center gap-2 rounded-2xl p-2 glass">
            {BRANCHES.map((b) => (
              <button
                key={b.id}
                onClick={() => setBranchId(b.id)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  branchId === b.id
                    ? "bg-gradient-to-r from-[var(--aqua)] to-[var(--aqua-glow)] text-[var(--navy)] shadow-[var(--shadow-glow)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang === "ar" ? b.nameAr : b.name}
              </button>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Info card */}
            <div className="rounded-3xl border neon-border bg-card p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-2xl font-black">{lang === "ar" ? branch.nameAr : branch.name}</h2>
              <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--aqua)]" />
                {branch.address}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoRow icon={<Phone className="h-4 w-4" />} label={t("phone")} value={branch.phone} href={`tel:${branch.phone.replace(/\s/g, "")}`} />
                <InfoRow icon={<MessageCircle className="h-4 w-4" />} label={t("whatsapp")} value={branch.whatsapp} href={`https://wa.me/${branch.whatsapp.replace(/[^\d]/g, "")}`} />
                <InfoRow icon={<Mail className="h-4 w-4" />} label={t("email")} value={branch.email} href={`mailto:${branch.email}`} />
                <InfoRow icon={<Clock className="h-4 w-4" />} label={t("hours")} value={branch.hours} />
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border">
                <iframe
                  title={branch.name}
                  src={branch.map}
                  className="h-64 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Message form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Message sent!", { description: "We'll reply within one business day." });
              }}
              className="rounded-3xl border bg-card p-6 shadow-[var(--shadow-card)]"
            >
              <h3 className="text-xl font-black">Send us a message</h3>
              <p className="mt-1 text-sm text-muted-foreground">Question, tour request, or partnership inquiry.</p>
              <div className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("msg_name")}</Label>
                  <Input required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("msg_email")}</Label>
                  <Input type="email" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("msg_message")}</Label>
                  <Textarea rows={6} required />
                </div>
                <Button type="submit" className="w-full rounded-xl bg-gradient-to-r from-[var(--orange)] to-[var(--crimson)] text-white shadow-[var(--shadow-orange)]">
                  {t("msg_send")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function InfoRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const content = (
    <div className="rounded-2xl border bg-background/40 p-3 transition-colors hover:border-[var(--aqua)]">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <span className="text-[var(--aqua)]">{icon}</span> {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noreferrer">{content}</a> : content;
}
