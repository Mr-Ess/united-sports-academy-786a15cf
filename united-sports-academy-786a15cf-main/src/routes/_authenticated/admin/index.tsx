import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { GraduationCap, Inbox, FileText, Handshake, TrendingUp, Clock } from "lucide-react";
import { getDashboardStats } from "@/lib/admin.functions";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: DashboardPage,
});

const TYPE_LABELS: Record<string, string> = {
  member: "عضوية",
  coach: "توظيف",
  volunteer: "تطوع",
  workshop: "ورشة",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  contacted: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

function DashboardPage() {
  const fetchStats = useServerFn(getDashboardStats);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-stats"], queryFn: () => fetchStats() });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">أهلاً بيك 👋</h1>
        <p className="text-sm text-muted-foreground">نظرة سريعة على الموقع</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="الكورسات المنشورة"
          value={`${data?.counts.publishedCourses ?? 0} / ${data?.counts.courses ?? 0}`}
          icon={GraduationCap}
          gradient="from-blue-500 to-indigo-500"
          loading={isLoading}
        />
        <StatCard
          label="طلبات جديدة"
          value={String(data?.counts.newSubmissions ?? 0)}
          icon={Inbox}
          gradient="from-orange-500 to-rose-500"
          loading={isLoading}
          href="/admin/submissions"
        />
        <StatCard
          label="المقالات المنشورة"
          value={`${data?.counts.publishedPosts ?? 0} / ${data?.counts.posts ?? 0}`}
          icon={FileText}
          gradient="from-emerald-500 to-teal-500"
          loading={isLoading}
        />
        <StatCard
          label="الشركاء"
          value={String(data?.counts.partners ?? 0)}
          icon={Handshake}
          gradient="from-purple-500 to-fuchsia-500"
          loading={isLoading}
        />
      </div>

      <div className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <Clock className="h-4 w-4 text-primary" /> آخر الطلبات
          </h2>
          <Link to="/admin/submissions" className="text-xs font-semibold text-primary hover:underline">
            عرض الكل ←
          </Link>
        </div>
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">جاري التحميل...</div>
        ) : (data?.recentSubmissions ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            مافيش طلبات لسه
          </div>
        ) : (
          <div className="space-y-2">
            {data!.recentSubmissions.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border bg-background/50 p-3 text-sm">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{TYPE_LABELS[s.type] ?? s.type}</Badge>
                  <span className="font-semibold">طلب جديد</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[s.status]}`}>
                    {s.status === "new" ? "جديد" : s.status === "contacted" ? "تم التواصل" : s.status === "approved" ? "مقبول" : "مرفوض"}
                  </span>
                  <span className="text-xs text-muted-foreground" dir="ltr">
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border bg-gradient-to-br from-primary/5 to-primary/10 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black">ابدأ بسرعة</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              أضف كورس جديد، انشر مقال، أو راجع الطلبات الواردة من الزوار.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <QuickAction to="/admin/courses" label="إضافة كورس" />
              <QuickAction to="/admin/posts" label="كتابة مقال" />
              <QuickAction to="/admin/submissions" label="مراجعة الطلبات" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, gradient, loading, href }: any) {
  const content = (
    <div className="relative overflow-hidden rounded-3xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
      <div className={`absolute -left-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-muted-foreground">{label}</div>
          <div className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${gradient} text-white`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 text-3xl font-black">
          {loading ? "..." : value}
        </div>
      </div>
    </div>
  );
  return href ? <Link to={href}>{content}</Link> : content;
}

function QuickAction({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:brightness-110"
    >
      {label}
    </Link>
  );
}
