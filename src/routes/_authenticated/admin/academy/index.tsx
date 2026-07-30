import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { PlaceholderPage } from "@/components/academy/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/admin/academy/")({
  component: () => (
    <PlaceholderPage
      icon={LayoutDashboard}
      title="نظرة عامة على الأكاديمية"
      subtitle="KPIs حية لكل الوحدات مع تبديل الفرع النشط"
      features={[
        { title: "متدربين نشطين", description: "عدد الاشتراكات النشطة اليوم" },
        { title: "إيرادات الشهر", description: "من جدول الإيصالات مع Realtime" },
        { title: "حضور اليوم", description: "من QR + Manual + Coach" },
        { title: "إشغال الحارات", description: "نسبة الحارات المشغولة الآن" },
        { title: "Leads Funnel", description: "Hot/Warm/Cold/Converted/Lost" },
        { title: "أفضل الفروع", description: "مقارنة سريعة للفروع (Super Admin)" },
      ]}
    />
  ),
});
