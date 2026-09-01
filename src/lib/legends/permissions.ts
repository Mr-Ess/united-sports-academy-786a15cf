import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["academy_role"];

// Roles allowed to access each route. "*" = any authenticated user.
export const PAGE_PERMS: Record<string, AppRole[] | "*"> = {
  "/": "*",
  "/leads": ["super_admin", "branch_admin", "receptionist"],
  "/clients": ["super_admin", "branch_admin", "receptionist", "finance"],
  "/receipts": ["super_admin", "branch_admin", "finance", "receptionist"],
  "/subscriptions": ["super_admin", "branch_admin", "receptionist", "finance"],
  "/finance": ["super_admin", "branch_admin", "finance"],
  "/pools": ["super_admin", "branch_admin"],
  "/lanes": ["super_admin", "branch_admin"],
  "/groups": ["super_admin", "branch_admin"],
  "/capacity": ["super_admin", "branch_admin"],
  "/attendance": ["super_admin", "branch_admin", "receptionist", "coach"],
  "/qr-attendance": ["super_admin", "branch_admin", "receptionist", "coach", "hr"],
  "/schedule": ["super_admin", "branch_admin", "coach"],
  "/coaches": ["super_admin", "branch_admin", "hr"],
  "/assessments": ["super_admin", "branch_admin", "coach", "hr"],
  "/hr": ["super_admin", "branch_admin", "hr"],
  "/hr-reports": ["super_admin", "branch_admin", "hr"],
  "/inventory": ["super_admin", "branch_admin"],
  "/procurement": ["super_admin", "branch_admin"],
  "/maintenance": ["super_admin", "branch_admin"],
  "/reports": ["super_admin", "branch_admin", "finance", "hr"],
  "/branch-reports": ["super_admin"],
  "/branches": ["super_admin", "branch_admin"],
  "/permissions": ["super_admin", "branch_admin"],
  "/settings": ["super_admin", "branch_admin"],
  "/ai-agents": ["super_admin", "branch_admin"],
};

// Role display metadata
export const ROLE_META: Record<AppRole, { en: string; ar: string; desc_en: string; desc_ar: string }> = {
  super_admin:    { en: "Super Admin",    ar: "سوبر أدمن",        desc_en: "Full access across every branch & module.", desc_ar: "صلاحية كاملة على كل الفروع والوحدات." },
  top_management: { en: "Top Management", ar: "الإدارة العليا",   desc_en: "Strategic view of all branches & finance.",  desc_ar: "رؤية استراتيجية لجميع الفروع والمالية." },
  branch_admin:   { en: "Branch Admin",   ar: "مدير الفرع",       desc_en: "Manages a single branch end-to-end.",       desc_ar: "يدير فرعًا واحدًا بالكامل." },
  finance:        { en: "Finance",        ar: "المالية",          desc_en: "Receipts, invoices, ledger & financial reports.", desc_ar: "إيصالات وفواتير وقيود وتقارير مالية." },
  hr:             { en: "HR",             ar: "الموارد البشرية",  desc_en: "Employees, leaves, payroll, HR reports.",   desc_ar: "الموظفون والإجازات والرواتب وتقارير الموظفين." },
  coach:          { en: "Coach",          ar: "مدرب",             desc_en: "Schedules, attendance & trainee assessments.", desc_ar: "الجداول والحضور وتقييم المتدربين." },
  receptionist:   { en: "Receptionist",   ar: "موظف الاستقبال",   desc_en: "Leads, receipts, attendance check-in.",     desc_ar: "العملاء المحتملون والإيصالات وتسجيل الحضور." },
  warehouse:      { en: "Warehouse",      ar: "المخازن",          desc_en: "Inventory & stock movements.",              desc_ar: "المخزون وحركات الأصناف." },
  procurement:    { en: "Procurement",    ar: "المشتريات",        desc_en: "Suppliers & purchase orders.",              desc_ar: "الموردون وأوامر الشراء." },
  maintenance:    { en: "Maintenance",    ar: "الصيانة",          desc_en: "Pool & facility maintenance assets.",       desc_ar: "صيانة المسابح والمرافق." },
  tenant:         { en: "Tenant Owner",   ar: "مالك الحساب",      desc_en: "Top-level tenant owner.",                   desc_ar: "المالك الأعلى للحساب." },
  trainee:        { en: "Trainee",        ar: "متدرب",            desc_en: "Self-service: schedule & evaluations.",     desc_ar: "خدمة ذاتية: الجداول والتقييمات." },
};

export const ALL_ROLES: AppRole[] = [
  "super_admin", "top_management", "branch_admin", "finance", "hr", "coach", "receptionist", "warehouse", "procurement", "maintenance", "tenant", "trainee",
];



// PERMISSIONS TEMPORARILY DISABLED — always allow.
export function canAccess(
  _path: string,
  _roles: { role: AppRole; branch_id: string | null }[],
  _isSuperAdmin: boolean,
): boolean {
  return true;
}

