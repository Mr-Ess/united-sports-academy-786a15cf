import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Clock,
  Filter,
  GraduationCap,
  MapPin,
  Sparkles,
  Star,
  Users,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteShell } from "@/components/site/SiteShell";
import {
  COURSES,
  COURSE_CATEGORIES,
  COURSE_LEVELS,
  COURSE_MODES,
  type Course,
} from "@/lib/courses-data";
import { useT } from "@/lib/i18n";
import { SITE_CONFIG } from "@/lib/site-config";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: `Professional Courses & Masterclasses — ${SITE_CONFIG.brand.en}` },
      {
        name: "description",
        content:
          "Elite masterclasses and professional certifications in swimming, basketball, karate, volleyball, fitness, and sports nutrition. Online, offline, and hybrid formats.",
      },
      { property: "og:title", content: `Courses & Masterclasses — ${SITE_CONFIG.brand.en}` },
      { property: "og:description", content: "Certified programs, elite coaches, seats limited." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const { lang } = useT();
  const [category, setCategory] = useState<string>("all");
  const [mode, setMode] = useState<string>("All");
  const [level, setLevel] = useState<string>("All");
  const [selected, setSelected] = useState<Course | null>(null);

  const filtered = useMemo(
    () =>
      COURSES.filter(
        (c) =>
          (category === "all" || c.category === category) &&
          (mode === "All" || c.mode === mode) &&
          (level === "All" || c.level === level),
      ),
    [category, mode, level],
  );

  return (
    <SiteShell>
      {/* Hero */}
      <section className="pt-16 sm:pt-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
            <GraduationCap className="h-3.5 w-3.5" />
            {lang === "ar" ? "الكورسات والورش التدريبية" : "Courses & Masterclasses"}
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            Level up with <span className="gradient-text">elite masterclasses</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Certified instructors. Online, offline, and hybrid formats. Real cohorts, real
            outcomes, and syllabuses built for measurable progress.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-3xl border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Filter className="h-3.5 w-3.5" /> Filter
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              <FilterGroup label="Category">
                {COURSE_CATEGORIES.map((c) => (
                  <Chip
                    key={c.id}
                    active={category === c.id}
                    onClick={() => setCategory(c.id)}
                  >
                    {lang === "ar" ? c.labelAr : c.label}
                  </Chip>
                ))}
              </FilterGroup>
              <FilterGroup label="Delivery Mode">
                {COURSE_MODES.map((m) => (
                  <Chip key={m} active={mode === m} onClick={() => setMode(m)}>
                    {m}
                  </Chip>
                ))}
              </FilterGroup>
              <FilterGroup label="Skill Level">
                {COURSE_LEVELS.map((l) => (
                  <Chip key={l} active={level === l} onClick={() => setLevel(l)}>
                    {l}
                  </Chip>
                ))}
              </FilterGroup>
            </div>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm font-semibold text-muted-foreground">
              {filtered.length} course{filtered.length === 1 ? "" : "s"} available
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed bg-card/40 p-16 text-center text-muted-foreground">
              <Sparkles className="mx-auto mb-3 h-8 w-8" />
              No courses match those filters yet. Try widening your search.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => (
                <CourseCard key={c.id} course={c} onOpen={() => setSelected(c)} />
              ))}
            </div>
          )}
        </div>
      </section>

      <CourseDetailDialog course={selected} onClose={() => setSelected(null)} />
    </SiteShell>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
        active
          ? "border-transparent bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
          : "border-border bg-secondary text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function CourseCard({ course, onOpen }: { course: Course; onOpen: () => void }) {
  const { lang } = useT();
  const urgent = course.seatsLeft <= 5;
  return (
    <button
      onClick={onOpen}
      className="group relative overflow-hidden rounded-3xl border bg-card p-6 text-left shadow-[var(--shadow-card)] transition-all hover-lift"
    >
      <div
        className={`absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br ${course.gradient} opacity-20 blur-2xl transition-all group-hover:opacity-40`}
      />
      <div className="relative">
        <div className="flex items-center gap-2">
          <Badge
            className={`bg-gradient-to-r ${course.gradient} border-0 text-white`}
          >
            {lang === "ar" ? course.categoryAr : course.category}
          </Badge>
          <Badge variant="outline" className="gap-1">
            {course.mode === "Online" ? (
              <Wifi className="h-3 w-3" />
            ) : course.mode === "Hybrid" ? (
              <Zap className="h-3 w-3" />
            ) : (
              <MapPin className="h-3 w-3" />
            )}
            {course.mode}
          </Badge>
          {course.featured && (
            <Badge className="border-0 bg-gradient-to-r from-[var(--orange)] to-[var(--crimson)] text-white">
              Featured
            </Badge>
          )}
        </div>
        <h3 className="mt-4 text-xl font-black tracking-tight leading-snug">
          {lang === "ar" ? course.titleAr : course.title}
        </h3>
        <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <Row icon={<Clock className="h-3.5 w-3.5" />}>{lang === "ar" ? course.durationAr : course.duration}</Row>
          <Row icon={<CalendarDays className="h-3.5 w-3.5" />}>{lang === "ar" ? course.scheduleAr : course.schedule}</Row>
          <Row icon={<MapPin className="h-3.5 w-3.5" />}>{lang === "ar" ? course.venueAr : course.venue}</Row>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs">
          <div className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 font-semibold">
            <Star className="h-3 w-3 fill-[var(--orange)] text-[var(--orange)]" />
            {course.rating} · {course.reviewsCount}
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 font-semibold text-muted-foreground">
            <Users className="h-3 w-3" /> {course.level}
          </div>
        </div>
        <div className="mt-5 flex items-end justify-between border-t pt-4">
          <div>
            <div className="text-2xl font-black">
              AED {course.price.toLocaleString()}
            </div>
            {course.originalPrice && (
              <div className="text-xs text-muted-foreground line-through">
                AED {course.originalPrice.toLocaleString()}
              </div>
            )}
          </div>
          <div
            className={`text-right text-xs font-bold ${
              urgent ? "text-[var(--crimson)]" : "text-muted-foreground"
            }`}
          >
            {urgent && "🔥 "}Only {course.seatsLeft} seat{course.seatsLeft === 1 ? "" : "s"} left
          </div>
        </div>
      </div>
    </button>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function CourseDetailDialog({
  course,
  onClose,
}: {
  course: Course | null;
  onClose: () => void;
}) {
  const { lang } = useT();
  return (
    <Dialog open={!!course} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0">
        {course && (
          <>
            <div
              className={`relative overflow-hidden bg-gradient-to-br ${course.gradient} p-8 text-white`}
            >
              <button
                onClick={onClose}
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-0 bg-white/20 text-white backdrop-blur">
                  {lang === "ar" ? course.categoryAr : course.category}
                </Badge>
                <Badge className="border-0 bg-white/20 text-white backdrop-blur">
                  {course.mode}
                </Badge>
                <Badge className="border-0 bg-white/20 text-white backdrop-blur">
                  {course.level}
                </Badge>
              </div>
              <DialogHeader className="mt-3">
                <DialogTitle className="text-3xl font-black leading-tight text-white">
                  {lang === "ar" ? course.titleAr : course.title}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-white" /> {course.rating} · {course.reviewsCount} reviews
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {course.seatsLeft}/{course.totalSeats} seats left
                </span>
              </div>
            </div>

            <div className="space-y-8 p-6 sm:p-8">
              {/* Key facts */}
              <div className="grid gap-3 sm:grid-cols-2">
                <FactCard icon={<Clock className="h-4 w-4" />} label="Duration">
                  {lang === "ar" ? course.durationAr : course.duration}
                </FactCard>
                <FactCard icon={<CalendarDays className="h-4 w-4" />} label="Schedule">
                  {lang === "ar" ? course.scheduleAr : course.schedule}
                </FactCard>
                <FactCard icon={<MapPin className="h-4 w-4" />} label="Venue">
                  {lang === "ar" ? course.venueAr : course.venue}
                </FactCard>
                <FactCard icon={<CalendarDays className="h-4 w-4" />} label="Dates">
                  {course.startDate} → {course.endDate}
                </FactCard>
              </div>

              {/* Instructor */}
              <div>
                <SectionTitle>Instructor</SectionTitle>
                <div className="rounded-2xl border bg-card p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${course.gradient} text-white shadow-lg`}
                    >
                      <BadgeCheck className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-black">
                        {lang === "ar" ? course.instructor.nameAr : course.instructor.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {lang === "ar" ? course.instructor.titleAr : course.instructor.title}
                      </div>
                      <p className="mt-2 text-sm">{course.instructor.experience}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {course.instructor.certs.map((c) => (
                          <Badge key={c} variant="secondary" className="font-semibold">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Syllabus */}
              <div>
                <SectionTitle>Syllabus &amp; Course Plan</SectionTitle>
                <Accordion type="single" collapsible className="rounded-2xl border bg-card">
                  {course.syllabus.map((s, i) => (
                    <AccordionItem key={i} value={`item-${i}`} className="border-b last:border-b-0 px-4">
                      <AccordionTrigger className="text-left">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-primary">
                            {s.week}
                          </div>
                          <div className="mt-0.5 font-bold">
                            {lang === "ar" ? s.topicAr : s.topic}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {s.details}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* Reviews */}
              {course.reviews.length > 0 && (
                <div>
                  <SectionTitle>Alumni Reviews</SectionTitle>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {course.reviews.map((r, i) => (
                      <div key={i} className="rounded-2xl border bg-card p-4">
                        <div className="flex items-center gap-1 text-[var(--orange)]">
                          {Array.from({ length: r.rating }).map((_, k) => (
                            <Star key={k} className="h-3.5 w-3.5 fill-current" />
                          ))}
                        </div>
                        <p className="mt-2 text-sm italic">"{r.quote}"</p>
                        <div className="mt-2 text-xs font-semibold text-muted-foreground">
                          — {r.name} · Verified alumni
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border neon-border p-5 sm:flex-row sm:items-center">
                <div>
                  <div className="text-3xl font-black">
                    AED {course.price.toLocaleString()}
                    {course.originalPrice && (
                      <span className="ml-2 text-base font-semibold text-muted-foreground line-through">
                        {course.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-[var(--crimson)]">
                    Only {course.seatsLeft} seat{course.seatsLeft === 1 ? "" : "s"} left in this cohort
                  </div>
                </div>
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl bg-gradient-to-r from-[var(--orange)] to-[var(--crimson)] text-white shadow-[var(--shadow-orange)]"
                >
                  <Link
                    to="/join"
                    search={{ course: course.id } as never}
                    onClick={onClose}
                  >
                    {lang === "ar" ? "انضم للكورس الآن" : "Enroll Now"}
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-lg font-black tracking-tight">{children}</h3>
  );
}

function FactCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="text-sm font-semibold">{children}</div>
    </div>
  );
}
