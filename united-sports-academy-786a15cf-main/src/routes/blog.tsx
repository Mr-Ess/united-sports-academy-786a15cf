import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SiteShell } from "@/components/site/SiteShell";
import { BLOG } from "@/lib/mock-data";
import { useT } from "@/lib/i18n";
import { SITE_CONFIG } from "@/lib/site-config";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: `Blog — ${SITE_CONFIG.brand.en}` },
      { name: "description", content: `Sports nutrition, workout routines, mental conditioning, and student spotlights from ${SITE_CONFIG.brand.en}.` },
      { property: "og:title", content: `Blog — ${SITE_CONFIG.brand.en}` },
      { property: "og:description", content: "Coach-written articles on training, nutrition, and student stories." },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  const { t } = useT();
  const cats = ["All", ...Array.from(new Set(BLOG.map((b) => b.cat)))];
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<(typeof BLOG)[number] | null>(null);

  const items = useMemo(
    () => BLOG.filter((b) => (cat === "All" || b.cat === cat) && (b.title.toLowerCase().includes(q.toLowerCase()) || b.excerpt.toLowerCase().includes(q.toLowerCase()))),
    [cat, q],
  );

  return (
    <SiteShell>
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> {t("sec_blog")}
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
              Coach <span className="gradient-text">insights</span>.
            </h1>
          </div>

          <div className="mx-auto mb-6 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles..." className="rounded-xl pl-9" />
            </div>
          </div>

          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  cat === c ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]" : "bg-secondary text-muted-foreground hover:bg-secondary/70"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((b, i) => (
              <button key={b.id} onClick={() => setOpen(b)} className="group overflow-hidden rounded-3xl border bg-card text-left shadow-[var(--shadow-card)] transition-all hover-lift">
                <div className={`h-40 bg-gradient-to-br ${["from-[var(--aqua)] to-[var(--aqua-glow)]", "from-[var(--orange)] to-[var(--crimson)]", "from-[var(--lime)] to-[var(--aqua-glow)]", "from-[var(--navy)] to-[var(--aqua)]"][i % 4]}`} />
                <div className="p-5">
                  <Badge variant="secondary" className="mb-2 rounded-full text-[10px] uppercase tracking-wider">{b.cat}</Badge>
                  <h3 className="line-clamp-2 text-lg font-black">{b.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{b.excerpt}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-[var(--orange)] to-[var(--crimson)] text-[10px] font-black text-white">
                        {b.author.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      {b.author}
                    </div>
                    <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{b.read}</div>
                  </div>
                </div>
              </button>
            ))}
            {items.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-muted-foreground">No articles found.</div>
            )}
          </div>

          <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
            <DialogContent className="max-w-2xl">
              {open && (
                <>
                  <DialogHeader>
                    <Badge variant="secondary" className="w-fit rounded-full text-[10px] uppercase tracking-wider">{open.cat}</Badge>
                    <DialogTitle className="text-2xl">{open.title}</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{open.author}</span> · <span>{open.date}</span> · <span>{open.read}</span>
                  </div>
                  <p className="text-muted-foreground">{open.excerpt}</p>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{open.body}</p>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </SiteShell>
  );
}
