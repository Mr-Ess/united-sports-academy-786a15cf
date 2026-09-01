import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Shield, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { branchEmail } from "@/lib/site-config";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPage,
});

type Role = "super_admin" | "branch_manager" | "head_coach" | "editor";

const ROLES: { id: Role; label: string; labelEn: string; color: string }[] = [
  { id: "super_admin",    label: "أدمن رئيسي",   labelEn: "Super Admin",     color: "bg-primary/15 text-primary" },
  { id: "branch_manager", label: "مدير فرع",     labelEn: "Branch Manager",  color: "bg-[oklch(0.78_0.19_55/0.15)] text-[oklch(0.78_0.19_55)]" },
  { id: "head_coach",     label: "مدرب رئيسي",   labelEn: "Head Coach",      color: "bg-[oklch(0.82_0.2_150/0.15)] text-[oklch(0.82_0.2_150)]" },
  { id: "editor",         label: "محرر محتوى",   labelEn: "Content Editor",  color: "bg-[oklch(0.65_0.26_15/0.15)] text-[oklch(0.65_0.26_15)]" },
];

const PERMISSIONS = [
  { id: "finance",       label: "الماليات والتقارير" },
  { id: "theme",         label: "المظهر والهوية" },
  { id: "users",         label: "المستخدمين والصلاحيات" },
  { id: "cms_all",       label: "إدارة المحتوى بالكامل" },
  { id: "branch_ops",    label: "إدارة الفرع" },
  { id: "schedules",     label: "الجداول والحضور" },
  { id: "students",      label: "متابعة الطلاب" },
  { id: "notes_upload",  label: "رفع المذكرات والموارد" },
  { id: "gallery",       label: "الصور والفيديوهات" },
  { id: "blog",          label: "المدونة" },
  { id: "partners",      label: "الشركاء" },
];

const DEFAULT_MATRIX: Record<Role, string[]> = {
  super_admin: PERMISSIONS.map(p => p.id),
  branch_manager: ["branch_ops", "schedules", "students"],
  head_coach: ["schedules", "students", "notes_upload"],
  editor: ["cms_all", "gallery", "blog", "partners"],
};

const MOCK_USERS = [
  { id: "u1", name: "Reem Al-Hashimi", email: branchEmail("reem"), role: "super_admin" as Role, branch: "Main HQ", active: true },
  { id: "u2", name: "Marcus Feld",      email: branchEmail("marcus"), role: "branch_manager" as Role, branch: "West City", active: true },
  { id: "u3", name: "Nina Kovač",       email: branchEmail("nina"),   role: "head_coach" as Role,     branch: "Coastal Campus", active: true },
  { id: "u4", name: "Diego Alvarez",    email: branchEmail("diego"),  role: "head_coach" as Role,     branch: "East Hub", active: true },
  { id: "u5", name: "Zoe Bennett",      email: branchEmail("zoe"),    role: "editor" as Role,         branch: "Main HQ", active: false },
];

function UsersPage() {
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX);
  const [users, setUsers] = useState(MOCK_USERS);
  const [q, setQ] = useState("");

  const filtered = users.filter(u => (u.name + u.email).toLowerCase().includes(q.toLowerCase()));

  const toggle = (role: Role, perm: string) => {
    setMatrix((m) => {
      const has = m[role].includes(perm);
      return { ...m, [role]: has ? m[role].filter(x => x !== perm) : [...m[role], perm] };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">المستخدمون والصلاحيات</h1>
        <p className="text-sm text-muted-foreground">إدارة الأدوار وصلاحيات الوصول (RBAC)</p>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="font-black">قائمة المستخدمين</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم أو الإيميل" className="pr-9 w-64" />
            </div>
            <Button size="sm" onClick={() => toast.info("Mock: أضف مستخدم جديد")}>
              <UserPlus className="ml-2 h-4 w-4" /> إضافة
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">الإيميل</TableHead>
                <TableHead className="text-right">الدور</TableHead>
                <TableHead className="text-right">الفرع</TableHead>
                <TableHead className="text-right">نشط</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const role = ROLES.find(r => r.id === u.role)!;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-semibold">{u.name}</TableCell>
                    <TableCell dir="ltr" className="text-xs text-muted-foreground">{u.email}</TableCell>
                    <TableCell><Badge className={role.color + " rounded-full"}>{role.label}</Badge></TableCell>
                    <TableCell className="text-sm">{u.branch}</TableCell>
                    <TableCell>
                      <Switch checked={u.active} onCheckedChange={(v) => setUsers(us => us.map(x => x.id === u.id ? { ...x, active: v } : x))} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="font-black">مصفوفة الصلاحيات</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الصلاحية</TableHead>
                {ROLES.map(r => <TableHead key={r.id} className="text-center">{r.label}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERMISSIONS.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-semibold">{p.label}</TableCell>
                  {ROLES.map(r => (
                    <TableCell key={r.id} className="text-center">
                      <Switch checked={matrix[r.id].includes(p.id)} onCheckedChange={() => toggle(r.id, p.id)} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
