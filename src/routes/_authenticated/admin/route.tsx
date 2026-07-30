import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard,
  GraduationCap,
  Inbox,
  FileText,
  Handshake,
  Image as ImageIcon,
  Settings,
  LogOut,
  Menu,
  Zap,
  ExternalLink,
  Users,
  MapPin,
  BarChart3,
  Palette,
  KanbanSquare,
  Bell,
  CalendarRange,
  ChevronDown,
  Search,
  BookOpen,
  Receipt,
  Repeat,
  Waves,
  QrCode,
  ClipboardCheck,
  CalendarDays,
  Award,
  ClipboardList,
  UserCog,
  TrendingUp,
  FileBarChart,
  UsersRound,
  GitCompare,
  ShieldCheck,
  MapPinned,
  Globe2,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getMyRoles } from "@/lib/admin.functions";
import { getMyAcademyContext } from "@/lib/academy.functions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { BranchProvider } from "@/lib/branch-context";
import { BranchContextBar } from "@/components/academy/BranchContextBar";
import { SITE_CONFIG } from "@/lib/site-config";
import { OPEN_ACCESS, OPEN_ACCESS_ROLES } from "@/lib/access";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Array<"admin" | "editor" | "moderator">;
};

const SITE_NAV: NavItem[] = [
  { to: "/admin", label: "الرئيسية", icon: LayoutDashboard },
  { to: "/admin/reports", label: "التقارير والتحليلات", icon: BarChart3, roles: ["admin"] },
  { to: "/admin/pipeline", label: "خط التسجيل", icon: KanbanSquare, roles: ["admin", "moderator"] },
  { to: "/admin/submissions", label: "الطلبات", icon: Inbox, roles: ["admin", "moderator"] },
  { to: "/admin/courses", label: "الكورسات", icon: GraduationCap, roles: ["admin", "editor"] },
  { to: "/admin/seasons", label: "المواسم", icon: CalendarRange, roles: ["admin", "editor"] },
  { to: "/admin/posts", label: "المدونة", icon: FileText, roles: ["admin", "editor"] },
  { to: "/admin/partners", label: "الشركاء", icon: Handshake, roles: ["admin", "editor"] },
  { to: "/admin/media", label: "الوسائط", icon: ImageIcon, roles: ["admin", "editor"] },
  { to: "/admin/branches", label: "الفروع (Mock)", icon: MapPin, roles: ["admin"] },
  { to: "/admin/users", label: "المستخدمين والصلاحيات", icon: Users, roles: ["admin"] },
  { to: "/admin/notifications", label: "الإشعارات", icon: Bell, roles: ["admin"] },
  { to: "/admin/settings/theme", label: "المظهر والهوية", icon: Palette, roles: ["admin"] },
  { to: "/admin/settings", label: "الإعدادات", icon: Settings, roles: ["admin"] },
];

type AcademyGroup = { label: string; items: { to: string; label: string; icon: React.ComponentType<{ className?: string }> }[] };

const ACADEMY_GROUPS: AcademyGroup[] = [
  {
    label: "نظرة عامة",
    items: [{ to: "/admin/academy", label: "لوحة الأكاديمية", icon: LayoutDashboard }],
  },
  {
    label: "CRM",
    items: [
      { to: "/admin/academy/leads", label: "العملاء المحتملين", icon: Users },
      { to: "/admin/academy/clients", label: "بحث العملاء", icon: Search },
    ],
  },
  {
    label: "المالية",
    items: [
      { to: "/admin/academy/finance/ledger", label: "الدفتر", icon: BookOpen },
      { to: "/admin/academy/finance/receipts", label: "الإيصالات", icon: Receipt },
      { to: "/admin/academy/finance/subscriptions", label: "الاشتراكات", icon: Repeat },
      { to: "/admin/academy/finance/invoicing", label: "الفوترة", icon: FileText },
    ],
  },
  {
    label: "تشغيل المسبح",
    items: [
      { to: "/admin/academy/pool-operations", label: "لوحة التشغيل", icon: Waves },
      { to: "/admin/academy/qr-attendance", label: "حضور QR", icon: QrCode },
      { to: "/admin/academy/lane-log", label: "سجل الحارات", icon: Waves },
      { to: "/admin/academy/attendance", label: "الحضور", icon: ClipboardCheck },
    ],
  },
  {
    label: "الجداول",
    items: [
      { to: "/admin/academy/schedule", label: "الجداول", icon: CalendarDays },
      { to: "/admin/academy/coaches", label: "المدربين", icon: Award },
    ],
  },
  {
    label: "أكاديمي",
    items: [{ to: "/admin/academy/assessments", label: "التقييمات", icon: ClipboardList }],
  },
  {
    label: "الموارد البشرية",
    items: [
      { to: "/admin/academy/hr", label: "الموظفون", icon: UserCog },
      { to: "/admin/academy/hr/attendance", label: "حضور الموظفين", icon: ClipboardCheck },
      { to: "/admin/academy/hr/leaves", label: "الإجازات", icon: CalendarRange },
      { to: "/admin/academy/hr/payroll", label: "الرواتب", icon: Receipt },
    ],
  },
  {
    label: "التقارير",
    items: [
      { to: "/admin/academy/analytics", label: "التحليلات", icon: TrendingUp },
      { to: "/admin/academy/reports", label: "التقارير", icon: FileBarChart },
      { to: "/admin/academy/hr-reports", label: "تقارير الموظفين", icon: UsersRound },
      { to: "/admin/academy/branch-reports", label: "مقارنة الفروع", icon: GitCompare },
    ],
  },
  {
    label: "النظام",
    items: [
      { to: "/admin/academy/permissions", label: "الأدوار والصلاحيات", icon: ShieldCheck },
      { to: "/admin/academy/audit-log", label: "سجل التدقيق", icon: ClipboardList },
      { to: "/admin/academy/branches", label: "الفروع", icon: MapPinned },
      { to: "/admin/academy/settings", label: "الإعدادات", icon: Settings },
    ],
  },
];

function AdminLayout() {
  const navigate = useNavigate();
  const fetchRoles = useServerFn(getMyRoles);
  const fetchAcademy = useServerFn(getMyAcademyContext);
  const { data: me, isLoading } = useQuery({
    queryKey: ["me-roles"],
    queryFn: () => fetchRoles(),
    retry: false,
  });
  const { data: academy } = useQuery({
    queryKey: ["academy-context"],
    queryFn: () => fetchAcademy(),
    retry: false,
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onAcademy = pathname.startsWith("/admin/academy");

  useEffect(() => setMobileOpen(false), [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    navigate({ to: "/auth", replace: true });
  };

  const roles = me?.roles?.length ? me.roles : OPEN_ACCESS ? [...OPEN_ACCESS_ROLES] : [];
  const isAdmin = roles.includes("admin");
  const visibleSiteNav = SITE_NAV.filter(
    (n) => !n.roles || isAdmin || n.roles.some((r) => roles.includes(r)),
  );

  if (isLoading && !OPEN_ACCESS) {
    return (
      <div dir="rtl" className="grid min-h-screen place-items-center text-muted-foreground" style={{ fontFamily: "'Cairo', sans-serif" }}>
        جاري التحميل...
      </div>
    );
  }

  if (!roles.length) {
    return (
      <div dir="rtl" className="grid min-h-screen place-items-center p-6 text-center" style={{ fontFamily: "'Cairo', sans-serif" }}>
        <div className="max-w-md space-y-4">
          <h2 className="text-2xl font-black">ماعندكش صلاحية دخول</h2>
          <p className="text-muted-foreground">
            الحساب ده مش معاه صلاحية دخول لوحة التحكم. لازم أدمن يديك دور.
          </p>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="ml-2 h-4 w-4" /> تسجيل الخروج
          </Button>
        </div>
      </div>
    );
  }


  const SidebarBody = () => {
    const [siteOpen, setSiteOpen] = useState(!onAcademy);
    const [academyOpen, setAcademyOpen] = useState(onAcademy);
    return (
      <div className="flex h-full flex-col">
        <Link to="/admin" className="flex items-center gap-2 border-b p-4">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow">
            <Zap className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-black leading-none">لوحة التحكم</div>
            <div className="mt-1 text-[10px] text-muted-foreground">{SITE_CONFIG.admin.sidebarLabel}</div>
          </div>
        </Link>

        <nav className="flex-1 space-y-2 overflow-y-auto p-3">
          {/* ============ إدارة الموقع ============ */}
          <button
            onClick={() => setSiteOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-xl bg-secondary/40 px-3 py-2 text-xs font-black text-foreground"
          >
            <span className="flex items-center gap-2"><Globe2 className="h-3.5 w-3.5" /> إدارة الموقع</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${siteOpen ? "" : "-rotate-90"}`} />
          </button>
          {siteOpen && (
            <div className="space-y-0.5 pt-1">
              {visibleSiteNav.map((item) => {
                const active = item.to === "/admin" ? pathname === "/admin" : pathname === item.to || pathname.startsWith(item.to + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* ============ إدارة الأكاديمية ============ */}
          <button
            onClick={() => setAcademyOpen((v) => !v)}
            className="mt-2 flex w-full items-center justify-between gap-2 rounded-xl bg-secondary/40 px-3 py-2 text-xs font-black text-foreground"
          >
            <span className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> إدارة الأكاديمية</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${academyOpen ? "" : "-rotate-90"}`} />
          </button>
          {academyOpen && (
            <div className="space-y-3 pt-1">
              {ACADEMY_GROUPS.map((g) => (
                <div key={g.label} className="space-y-0.5">
                  <div className="px-3 pt-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
                    {g.label}
                  </div>
                  {g.items.map((item) => {
                    const active =
                      item.to === "/admin/academy"
                        ? pathname === "/admin/academy"
                        : pathname === item.to || pathname.startsWith(item.to + "/");
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </nav>

        <div className="space-y-2 border-t p-3">
          <div className="rounded-xl bg-secondary/50 p-3">
            <div className="truncate text-xs font-semibold" dir="ltr">
              {me?.email ?? me?.userId}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {roles.map((r) => (
                <Badge key={r} variant="secondary" className="text-[10px]">
                  {r === "admin" ? "أدمن" : r === "editor" ? "محرر" : "مشرف"}
                </Badge>
              ))}
              {academy?.isSuperAdmin && (
                <Badge className="text-[10px]">Super Admin</Badge>
              )}
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
          >
            <ExternalLink className="h-3.5 w-3.5" /> عرض الموقع
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-3.5 w-3.5" /> تسجيل الخروج
          </button>
        </div>
      </div>
    );
  };

  return (
    <BranchProvider
      branches={academy?.branches ?? []}
      defaultBranchId={academy?.profile?.default_branch_id ?? null}
    >
      <div dir="rtl" className="academy-os flex min-h-screen" style={{ fontFamily: "'Readex Pro', 'Tajawal', 'Cairo', sans-serif" }}>
        <aside className="hidden w-64 shrink-0 border-l bg-card lg:block">
          <SidebarBody />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-card/80 px-4 py-3 backdrop-blur lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0">
                <SidebarBody />
              </SheetContent>
            </Sheet>
            <div className="text-sm font-black">لوحة التحكم</div>
            <div className="w-9" />
          </header>

          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
            {onAcademy && <BranchContextBar />}
            <Outlet />
          </main>
        </div>
      </div>
    </BranchProvider>
  );
}
