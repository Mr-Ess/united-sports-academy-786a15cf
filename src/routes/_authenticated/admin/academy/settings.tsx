import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { CrudModule } from "@/components/academy/CrudModule";

export const Route = createFileRoute("/_authenticated/admin/academy/settings")({
  component: () => (
    <CrudModule
      icon={Settings}
      title="إعدادات الأكاديمية"
      subtitle="مستويات المهارة والإعدادات العامة"
      table="skill_levels"
      branchScoped={false}
      orderBy={{ column: "sort_order", ascending: true }}
      fields={[
        { key: "name_ar", label: "الاسم بالعربي", type: "text", required: true },
        { key: "name", label: "الاسم بالإنجليزي", type: "text", required: true },
        { key: "sort_order", label: "الترتيب", type: "number" },
      ]}
      defaultValues={{ sort_order: 1 }}
    />
  ),
});
