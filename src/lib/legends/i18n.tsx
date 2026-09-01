import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

const DICT: Record<string, { en: string; ar: string }> = {
  // App
  "app.title": { en: "United Sports Academy", ar: "يونايتد سبورت أكاديمي" },
  "app.subtitle": { en: "Swim Academy", ar: "أكاديمية السباحة" },
  "app.console": { en: "Swimming Academy Management Console", ar: "لوحة إدارة أكاديمية السباحة" },
  "app.poolStatus": { en: "Pool Status", ar: "حالة المسبح" },
  "app.poolOpen": { en: "Open · 4:00 PM – 11:00 PM", ar: "مفتوح · ٤:٠٠ م – ١١:٠٠ م" },

  // Nav
  "nav.dashboard": { en: "Dashboard", ar: "الرئيسية" },
  "nav.leads": { en: "Leads CRM", ar: "العملاء المحتملون" },
  "nav.clients": { en: "Client Lookup", ar: "بحث العملاء" },
  "nav.receipts": { en: "Receipts", ar: "الإيصالات" },
  "nav.attendance": { en: "Pool Attendance", ar: "الحضور" },
  "nav.poolOps": { en: "Pool Operations", ar: "لوحة تشغيل المسبح" },
  "nav.laneLog": { en: "Lane Log", ar: "سجل الحارات" },
  "nav.capacity": { en: "Lane Capacity", ar: "سعة الحارات" },
  "nav.schedule": { en: "Scheduling", ar: "الجداول" },
  "nav.coaches": { en: "Coach Manager", ar: "إدارة المدربين" },
  "nav.reports": { en: "Reports", ar: "التقارير" },
  "nav.analytics": { en: "Analytics & KPIs", ar: "تحليلات ومؤشرات" },
  "nav.pools": { en: "Pools", ar: "المسابح" },
  "nav.lanes": { en: "Lanes", ar: "الحارات" },
  "nav.groups": { en: "Groups", ar: "المجموعات" },
  "nav.subscriptions": { en: "Subscriptions", ar: "الاشتراكات" },
  "nav.qr": { en: "QR Attendance", ar: "حضور QR" },
  "nav.finance": { en: "Finance", ar: "المالية" },
  "nav.hr": { en: "HR", ar: "الموارد البشرية" },
  "nav.inventory": { en: "Inventory", ar: "المخزون" },
  "nav.procurement": { en: "Procurement", ar: "المشتريات" },
  "nav.maintenance": { en: "Maintenance", ar: "الصيانة" },
  "nav.assessments": { en: "Assessments", ar: "التقييمات" },
  "nav.hrReports": { en: "HR Reports", ar: "تقارير الموظفين" },
  "nav.branches": { en: "Branches", ar: "الفروع" },
  "nav.settings": { en: "Settings", ar: "الإعدادات" },
  // Sidebar section labels
  "sec.overview": { en: "Overview", ar: "نظرة عامة" },
  "sec.crm": { en: "CRM & Clients", ar: "العملاء" },
  "sec.payments": { en: "Payments & Subscriptions", ar: "المدفوعات والاشتراكات" },
  "sec.finance": { en: "Finance", ar: "المالية" },
  "sec.ops": { en: "Pool Operations", ar: "تشغيل المسبح" },
  "sec.poolsConfig": { en: "Pools Config", ar: "إدادة المسابح" },

  "sec.schedule": { en: "Scheduling", ar: "الجدولة" },
  "sec.back": { en: "HR & Back Office", ar: "الموارد البشرية والإدارة" },
  "sec.reports": { en: "Reports & Analytics", ar: "التقارير والتحليلات" },
  "sec.system": { en: "System", ar: "النظام" },
  "sec.ai": { en: "AI Agents", ar: "الذكاء الاصطناعي" },
  "nav.aiAgents": { en: "AI Agents", ar: "وكلاء الذكاء" },
  "nav.branchReports": { en: "Branch Comparison", ar: "مقارنة الفروع" },
  "nav.permissions": { en: "Roles & Permissions", ar: "الأدوار والصلاحيات" },

  // Permissions page
  "perm.title": { en: "Roles & Permissions", ar: "الأدوار والصلاحيات" },
  "perm.subtitle": { en: "Grant or revoke roles per user. Changes apply instantly.", ar: "منح أو سحب الأدوار لكل مستخدم. التغييرات تُطبّق فورًا." },
  "perm.tab.users": { en: "Users", ar: "المستخدمون" },
  "perm.tab.roles": { en: "Roles", ar: "الأدوار" },
  "perm.tab.matrix": { en: "Access Matrix", ar: "مصفوفة الوصول" },
  "perm.user": { en: "User", ar: "المستخدم" },
  "perm.email": { en: "Email", ar: "البريد" },
  "perm.assignedRoles": { en: "Assigned Roles", ar: "الأدوار الممنوحة" },
  "perm.grantRole": { en: "Grant Role", ar: "منح دور" },
  "perm.revoke": { en: "Revoke", ar: "سحب" },
  "perm.scope": { en: "Scope", ar: "النطاق" },
  "perm.global": { en: "All branches", ar: "كل الفروع" },
  "perm.thisBranch": { en: "Current branch", ar: "الفرع الحالي" },
  "perm.searchUser": { en: "Search by email or name", ar: "ابحث بالبريد أو الاسم" },
  "perm.role": { en: "Role", ar: "الدور" },
  "perm.page": { en: "Page", ar: "الصفحة" },
  "perm.allowed": { en: "Allowed", ar: "مسموح" },
  "perm.denied": { en: "Denied", ar: "ممنوع" },
  "perm.noUsers": { en: "No users found in the system.", ar: "لا يوجد مستخدمون." },

  // Branch comparison
  "br.compareTitle": { en: "Branch Comparison Report", ar: "تقرير مقارنة الفروع" },
  "br.compareSub": { en: "Live KPIs across every active branch.", ar: "مؤشرات حية لكل فرع نشط." },
  "br.trainees": { en: "Trainees", ar: "المتدربون" },
  "br.employees": { en: "Employees", ar: "الموظفون" },
  "br.activeSubs": { en: "Active Subscriptions", ar: "الاشتراكات النشطة" },
  "br.monthRevenue": { en: "This Month Revenue", ar: "إيراد الشهر" },
  "br.todayAttendance": { en: "Today's Attendance", ar: "حضور اليوم" },

  // QR attendance — employee mode
  "qr.mode.trainee": { en: "Trainees", ar: "المتدربون" },
  "qr.mode.employee": { en: "Employees", ar: "الموظفون" },
  "qr.employeeCode": { en: "Employee code (EMP-XXXX)", ar: "كود الموظف (EMP-XXXX)" },
  "qr.employeeChoose": { en: "Choose employee", ar: "اختر موظف" },
  "qr.empGenerate": { en: "Generate QR for employee", ar: "إنشاء QR للموظف" },
  "qr.clockIn": { en: "Clock In", ar: "تسجيل دخول" },
  "qr.clockOut": { en: "Clock Out", ar: "تسجيل خروج" },
  "qr.clockedIn": { en: "Clocked in", ar: "تم تسجيل الدخول" },
  "qr.clockedOut": { en: "Clocked out", ar: "تم تسجيل الخروج" },
  "qr.alreadyToday": { en: "Already clocked in today", ar: "تم تسجيل الدخول اليوم بالفعل" },
  "qr.notClockedIn": { en: "Employee has not clocked in today", ar: "لم يسجل الموظف دخوله اليوم" },
  "qr.unknownEmp": { en: "Unknown employee code", ar: "كود موظف غير معروف" },


  // Receipts
  "rec.title": { en: "Receipts & Financials", ar: "الإيصالات والماليات" },
  "rec.new": { en: "New Receipt", ar: "إيصال جديد" },
  "rec.edit": { en: "Edit Receipt", ar: "تعديل إيصال" },
  "rec.studentName": { en: "Student Name", ar: "اسم المتدرب" },
  "rec.clientId": { en: "Client ID (auto if blank)", ar: "رقم العميل (تلقائي إذا فارغ)" },
  "rec.clientLookup": { en: "Quick lookup — type ID to auto-fill", ar: "بحث سريع — أدخل الرقم للتعبئة التلقائية" },
  "rec.autofilled": { en: "Auto-filled from existing client", ar: "تمت التعبئة من ملف العميل" },
  "rec.membershipId": { en: "Membership ID", ar: "رقم العضوية" },
  "rec.phone": { en: "Phone", ar: "الهاتف" },
  "rec.address": { en: "Address", ar: "العنوان" },
  "rec.emergency": { en: "Emergency Contact", ar: "جهة اتصال للطوارئ" },
  "rec.category": { en: "Category", ar: "الفئة" },
  "rec.age": { en: "Age", ar: "العمر" },
  "rec.level": { en: "Level", ar: "المستوى" },
  "rec.type": { en: "Type", ar: "النوع" },
  "rec.sessions": { en: "Sessions", ar: "الحصص" },
  "rec.receiptNum": { en: "Receipt #", ar: "رقم الإيصال" },
  "rec.amount": { en: "Amount Paid (EGP)", ar: "المبلغ المدفوع (ج.م)" },
  "rec.payDate": { en: "Payment Date", ar: "تاريخ الدفع" },
  "rec.payMethod": { en: "Payment Method", ar: "طريقة الدفع" },
  "rec.daySchedule": { en: "Day Schedule", ar: "أيام التدريب" },
  "rec.timeSlot": { en: "Time Slot", ar: "موعد الحصة" },
  "rec.coach": { en: "Assigned Coach", ar: "المدرب المخصص" },
  "rec.skill": { en: "Skill Rating (1-10)", ar: "تقييم المهارة (1-10)" },
  "rec.sessionsUsed": { en: "Sessions Used", ar: "الحصص المستخدمة" },
  "rec.searchPh": { en: "Search by name, phone, client ID or receipt #", ar: "ابحث بالاسم أو الهاتف أو رقم العميل" },

  // Coach
  "coach.evalTrainee": { en: "Evaluate Trainee", ar: "تقييم المتدرب" },
  "coach.newTraineeEval": { en: "New Trainee Evaluation", ar: "تقييم متدرب جديد" },
  "coach.selectTrainee": { en: "Select Trainee", ar: "اختر المتدرب" },
  "coach.evaluator": { en: "Evaluator (Coach)", ar: "المُقيِّم (المدرب)" },
  "coach.endurance": { en: "Endurance (1-5)", ar: "التحمل (1-5)" },
  "coach.technique": { en: "Technique (1-5)", ar: "الأسلوب (1-5)" },
  "coach.overallSkill": { en: "Overall skill (1-10)", ar: "التقييم الكلي (1-10)" },
  "coach.notes": { en: "Notes", ar: "ملاحظات" },

  // Common
  "c.cancel": { en: "Cancel", ar: "إلغاء" },
  "c.save": { en: "Save", ar: "حفظ" },
  "c.add": { en: "Add", ar: "إضافة" },
  "c.edit": { en: "Edit", ar: "تعديل" },
  "c.delete": { en: "Delete", ar: "حذف" },
  "c.search": { en: "Search", ar: "بحث" },
  "c.export": { en: "Export", ar: "تصدير" },
  "c.filter": { en: "Filter", ar: "تصفية" },
  "c.all": { en: "All", ar: "الكل" },
  "c.from": { en: "From", ar: "من" },
  "c.to": { en: "To", ar: "إلى" },
  "c.status": { en: "Status", ar: "الحالة" },
  "c.name": { en: "Name", ar: "الاسم" },
  "c.notes": { en: "Notes", ar: "ملاحظات" },
  "c.language": { en: "Language", ar: "اللغة" },
  "c.actions": { en: "Actions", ar: "إجراءات" },
  "c.confirm": { en: "Confirm", ar: "تأكيد" },
  "c.live": { en: "Live · Lovable Cloud", ar: "مباشر · لوفابل كلاود" },

  // Page headers — H2 + subtitle pairs
  "pg.dashboard.h": { en: "Pool Command Center", ar: "مركز قيادة المسبح" },
  "pg.dashboard.s": { en: "Real-time operations across every lane.", ar: "تشغيل لحظي عبر كل حارات المسبح." },
  "pg.leads.h": { en: "Leads & CRM", ar: "العملاء المحتملون وإدارة العلاقات" },
  "pg.clients.h": { en: "Client Identification & Lookup", ar: "تعريف العملاء والبحث" },
  "pg.clients.s": { en: "Every client gets a unique ID. Search to load history, subscriptions, evaluations and assigned coach.", ar: "كل عميل له رقم فريد. ابحث لعرض السجل والاشتراكات والتقييمات والمدرب." },
  "pg.attendance.h": { en: "Pool Attendance · Lane Log", ar: "حضور المسبح · سجل الحارات" },
  "pg.attendance.s": { en: "Tap a wave to mark a session. Drains right to left on uncheck.", ar: "اضغط على الموجة لتسجيل الحصة. تُمسح بإلغاء التأشير." },
  "pg.capacity.h": { en: "Lane Capacity Monitor", ar: "مراقبة سعة الحارات" },
  "pg.capacity.s": { en: "Click the pencil to override capacity per lane.", ar: "اضغط على القلم لتعديل السعة لكل حارة." },
  "pg.schedule.h": { en: "Scheduling & Capacity", ar: "الجداول والسعة" },
  "pg.schedule.s": { en: "Manage coaches, time slots, group types, and book against live availability.", ar: "إدارة المدربين والمواعيد وأنواع المجموعات والحجز وفق التوفر اللحظي." },
  "pg.coaches.h": { en: "Coach Manager", ar: "إدارة المدربين" },
  "pg.coaches.s": { en: "Track hours, monitor performance, and run periodic evaluations.", ar: "تتبّع الساعات وقياس الأداء وإجراء تقييمات دورية." },
  "pg.reports.h": { en: "Reports & Exports", ar: "التقارير والتصدير" },
  "pg.reports.s": { en: "Generate detailed PDF / Excel / CSV reports across every module.", ar: "توليد تقارير PDF / Excel / CSV تفصيلية لكل الوحدات." },
  "pg.settings.h": { en: "System Settings", ar: "إعدادات النظام" },
  "pg.settings.s": { en: "Automated notifications, WhatsApp templates, and manual job triggers.", ar: "الإشعارات الآلية وقوالب واتساب وتشغيل المهام يدوياً." },

  // Common extras
  "c.yes": { en: "Yes", ar: "نعم" },
  "c.no": { en: "No", ar: "لا" },
  "c.none": { en: "None", ar: "بدون" },
  "c.unassigned": { en: "Unassigned", ar: "غير محدد" },
  "c.active": { en: "Active", ar: "نشط" },
  "c.expired": { en: "Expired", ar: "منتهي" },
  "c.required": { en: "Required", ar: "مطلوب" },
  "c.notFound": { en: "No results found.", ar: "لا توجد نتائج." },
  "c.branch": { en: "Branch", ar: "الفرع" },
  "c.selectBranch": { en: "Select a branch first", ar: "اختر فرعًا أولًا" },
  "c.allCoaches": { en: "All Coaches", ar: "كل المدربين" },
  "c.left": { en: "left", ar: "متبقي" },
  "c.total": { en: "total", ar: "إجمالي" },
  "c.allBranches": { en: "All Branches", ar: "كل الفروع" },

  // Leads
  "lead.new": { en: "New Lead", ar: "عميل جديد" },
  "lead.edit": { en: "Edit Lead", ar: "تعديل العميل" },
  "lead.contact": { en: "Contact Number", ar: "رقم التواصل" },
  "lead.service": { en: "Service", ar: "الخدمة" },
  "lead.source": { en: "Source", ar: "المصدر" },
  "lead.assessmentDate": { en: "Assessment Date", ar: "تاريخ التقييم" },
  "lead.assessmentAttended": { en: "Assessment Attended", ar: "حضر التقييم" },
  "lead.subType": { en: "Subscription Type", ar: "نوع الاشتراك" },
  "lead.offer": { en: "Offer / Discount", ar: "العرض / الخصم" },
  "lead.agent": { en: "Assigned Agent", ar: "الموظف المسؤول" },
  "lead.comments": { en: "Comments", ar: "ملاحظات" },
  "lead.searchPh": { en: "Search by name or phone", ar: "ابحث بالاسم أو الهاتف" },
  "lead.assessment": { en: "Assessment", ar: "التقييم" },
  "lead.sub": { en: "Subscription", ar: "الاشتراك" },
  "lead.nameRequired": { en: "Name is required", ar: "الاسم مطلوب" },
  "lead.added": { en: "Lead added", ar: "تم إضافة العميل" },
  "lead.updated": { en: "Lead updated", ar: "تم تحديث العميل" },
  "lead.deleted": { en: "Lead removed", ar: "تم حذف العميل" },
  "lead.empty": { en: "No leads match the current filters.", ar: "لا يوجد عملاء يطابقون التصفية." },

  // Lead status / source values
  "ls.Interested": { en: "Interested", ar: "مهتم" },
  "ls.Long-time customer": { en: "Long-time customer", ar: "عميل دائم" },
  "ls.Refused": { en: "Refused", ar: "رفض" },
  "ls.Pending Follow-up": { en: "Pending Follow-up", ar: "بانتظار المتابعة" },

  // Receipts extras
  "rec.actions": { en: "Actions", ar: "إجراءات" },
  "rec.student": { en: "Student", ar: "المتدرب" },
  "rec.schedule": { en: "Schedule", ar: "الجدول" },
  "rec.empty": { en: "No receipts found.", ar: "لا توجد إيصالات." },
  "rec.deleted": { en: "Receipt removed", ar: "تم حذف الإيصال" },
  "rec.added": { en: "Receipt added", ar: "تم إضافة الإيصال" },
  "rec.updated": { en: "Receipt updated", ar: "تم تحديث الإيصال" },
  "rec.studentRequired": { en: "Student name required", ar: "اسم المتدرب مطلوب" },
  "rec.clientNotFound": { en: "No client found", ar: "لم يتم العثور على العميل" },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("aquapro-lang") as Lang | null;
      if (stored === "ar" || stored === "en") setLangState(stored);
    } catch {}
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    try { window.localStorage.setItem("aquapro-lang", l); } catch {}
  };
  const t = (key: string) => DICT[key]?.[lang] ?? key;
  const dir = lang === "ar" ? "rtl" : "ltr";
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
    }
  }, [lang, dir]);
  return <Ctx.Provider value={{ lang, setLang, t, dir }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used within I18nProvider");
  return v;
}
