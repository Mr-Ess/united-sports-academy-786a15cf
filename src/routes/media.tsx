import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Camera, FileText, Play, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteShell } from "@/components/site/SiteShell";
import { GALLERY, RESOURCES, SPORTS, VIDEOS } from "@/lib/mock-data";
import { useT } from "@/lib/i18n";
import { SITE_CONFIG } from "@/lib/site-config";

export const Route = createFileRoute("/media")({
  head: () => ({
    meta: [
      { title: "Media Library — United Sport Academy" },
      { name: "description", content: "Behind the scenes photos, video reels, and downloadable training guides from United Sport Academy." },
      { property: "og:title", content: "Behind the Scenes — United Sport Academy" },
      { property: "og:description", content: "Photos, videos, and PDF library from every branch and season." },
    ],
  }),
  component: MediaPage,
});

function MediaPage() {
  const { t } = useT();
  return (
    <SiteShell>
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> {t("sec_behind")}
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
              Photos, reels & <span className="gradient-text">study notes</span>.
            </h1>
          </div>

          <Tabs defaultValue="photos" className="w-full">
            <TabsList className="mx-auto mb-8 grid w-full max-w-2xl grid-cols-3 rounded-2xl p-1.5">
              <TabsTrigger value="photos" className="gap-2 rounded-xl">
                <Camera className="h-4 w-4" /> {t("sec_photos")}
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-2 rounded-xl">
                <Play className="h-4 w-4" /> {t("sec_videos")}
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2 rounded-xl">
                <FileText className="h-4 w-4" /> {t("sec_notes")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photos"><PhotoAlbum /></TabsContent>
            <TabsContent value="videos"><VideoLib /></TabsContent>
            <TabsContent value="notes"><NotesLib /></TabsContent>
          </Tabs>
        </div>
      </section>
    </SiteShell>
  );
}

const PHOTO_CATS = ["All", "Camps", "Competitions", "Daily Practice", "Celebrations", "Behind the Scenes"];

function PhotoAlbum() {
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState<(typeof GALLERY)[number] | null>(null);
  const items = cat === "All" ? GALLERY : GALLERY.filter((g) => g.cat === cat);

  return (
    <div>
      <Pills value={cat} setValue={setCat} options={PHOTO_CATS} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((g, i) => (
          <button
            key={g.id}
            onClick={() => setOpen(g)}
            className="group relative aspect-square overflow-hidden rounded-2xl shadow-[var(--shadow-card)] transition-all hover:scale-[1.03] hover:shadow-[var(--shadow-glow)]"
            style={{
              background: `linear-gradient(135deg, hsl(${g.color}) 0%, hsl(${g.color} / 0.4) 100%)`,
              animationDelay: `${i * 40}ms`,
            }}
          >
            <div
              className="absolute inset-0 opacity-40 mix-blend-overlay"
              style={{ backgroundImage: `radial-gradient(circle at ${(i * 37) % 100}% ${(i * 53) % 100}%, white, transparent 60%)` }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">{g.cat} · {g.season}</div>
              <div className="text-sm font-bold text-white">{g.title}</div>
            </div>
          </button>
        ))}
      </div>
      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-3xl overflow-hidden border-0 bg-transparent p-0 shadow-none">
          {open && (
            <div className="overflow-hidden rounded-2xl">
              <div
                className="aspect-video w-full"
                style={{ background: `linear-gradient(135deg, hsl(${open.color}) 0%, hsl(${open.color} / 0.4) 100%)` }}
              />
              <div className="glass-dark p-5 text-white">
                <Badge className="bg-white/15 text-white">{open.cat} · {open.season}</Badge>
                <h3 className="mt-2 text-xl font-bold">{open.title}</h3>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const VIDEO_CATS = ["All", "Technical", "Behind the Scenes", "Match Highlights"];

function VideoLib() {
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState<(typeof VIDEOS)[number] | null>(null);
  const items = cat === "All" ? VIDEOS : VIDEOS.filter((v) => v.cat === cat);

  return (
    <div>
      <Pills value={cat} setValue={setCat} options={VIDEO_CATS} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((v) => {
          const sport = SPORTS.find((s) => s.id === v.sport)!;
          return (
            <button
              key={v.id}
              onClick={() => setOpen(v)}
              className="group overflow-hidden rounded-2xl border bg-card text-left shadow-[var(--shadow-card)] transition-all hover-lift"
            >
              <div className={`relative aspect-video bg-gradient-to-br ${sport.gradient}`}>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-primary shadow-xl transition-transform group-hover:scale-110">
                    <Play className="ml-0.5 h-6 w-6 fill-current" />
                  </div>
                </div>
                <div className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-bold text-white">{v.duration}</div>
                <div className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">{v.cat}</div>
              </div>
              <div className="p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{sport.name} · {v.views} views</div>
                <div className="mt-1 font-bold">{v.title}</div>
              </div>
            </button>
          );
        })}
      </div>
      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-3xl overflow-hidden border-0 bg-black p-0">
          {open && (
            <>
              <div className="aspect-video w-full bg-gradient-to-br from-[var(--navy)] to-[var(--aqua)]">
                <div className="grid h-full place-items-center text-white/70">
                  <Play className="h-16 w-16 fill-current opacity-40" />
                </div>
              </div>
              <div className="p-5 text-white">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/60">{open.duration} · {open.views} views · {open.cat}</div>
                <h3 className="mt-1 text-xl font-bold">{open.title}</h3>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NotesLib() {
  const { t } = useT();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const cats = ["All", ...Array.from(new Set(RESOURCES.map((r) => r.cat)))];
  const items = useMemo(
    () =>
      RESOURCES.filter(
        (r) => (cat === "All" || r.cat === cat) && r.title.toLowerCase().includes(q.toLowerCase()),
      ),
    [q, cat],
  );

  return (
    <div>
      <div className="mx-auto mb-6 flex max-w-md items-center gap-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search notes, guides..." value={q} onChange={(e) => setQ(e.target.value)} className="rounded-xl pl-9" />
        </div>
      </div>
      <Pills value={cat} setValue={setCat} options={cats} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => {
          const sport = SPORTS.find((s) => s.id === r.sport)!;
          return (
            <div key={r.id} className="group flex items-start gap-4 rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)] transition-all hover-lift">
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${sport.gradient} text-white`}>
                <span className="text-[10px] font-black">{r.type}</span>
              </div>
              <div className="min-w-0 flex-1">
                <Badge variant="secondary" className="mb-1 rounded-full text-[10px] uppercase tracking-wider">{r.cat}</Badge>
                <div className="truncate font-bold">{r.title}</div>
                <div className="text-xs text-muted-foreground">{sport.name} · {r.size}</div>
              </div>
              <Button size="sm" variant="ghost" className="shrink-0 text-xs font-semibold">{t("cta_download")}</Button>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
            No resources found for "{q}".
          </div>
        )}
      </div>
    </div>
  );
}

function Pills({ value, setValue, options }: { value: string; setValue: (v: string) => void; options: string[] }) {
  return (
    <div className="mb-6 flex flex-wrap justify-center gap-2">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => setValue(o)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
            value === o ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]" : "bg-secondary text-muted-foreground hover:bg-secondary/70"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
