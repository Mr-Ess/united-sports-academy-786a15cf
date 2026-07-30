import { createFileRoute } from "@tanstack/react-router";
import { UserCog } from "lucide-react";
import { CrudModule } from "@/components/academy/CrudModule";

export const Route = createFileRoute("/_authenticated/admin/academy/hr/")({
  component: () => (
    <CrudModule
      icon={UserCog}
      title="الموظفون (Employees)"
      subtitle="بيانات وظيفية وراتب أساسي"
      table="hr_employees"
      searchKeys={["full_name", "position", "phone"]}
      fields={[
        { key: "full_name", label: "الاسم", type: "text", required: true },
        { key: "position", label: "الوظيفة", type: "text" },
        { key: "phone", label: "الهاتف", type: "text" },
        { key: "email", label: "الإيميل", type: "text" },
        { key: "base_salary", label: "الراتب الأساسي", type: "number" },
        { key: "hired_at", label: "تاريخ التعيين", type: "date" },
        { key: "active", label: "نشط", type: "boolean" },
        { key: "notes", label: "ملاحظات", type: "textarea", hideInTable: true },
      ]}
      defaultValues={{ active: true, base_salary: 0 }}
    />
  ),
});
