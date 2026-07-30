import { createFileRoute } from "@tanstack/react-router";
import { MapPinned } from "lucide-react";
import { CrudModule } from "@/components/academy/CrudModule";

export const Route = createFileRoute("/_authenticated/admin/academy/branches")({
  component: () => (
    <CrudModule
      icon={MapPinned}
      title="الفروع (Branches)"
      subtitle="Super Admin — إدارة الفروع"
      table="branches"
      branchScoped={false}
      searchKeys={["name", "name_ar"]}
      orderBy={{ column: "sort_order", ascending: true }}
      fields={[
        { key: "name_ar", label: "الاسم (عربي)", type: "text", required: true },
        { key: "name", label: "الاسم (إنجليزي)", type: "text", required: true },
        { key: "address", label: "العنوان", type: "text" },
        { key: "phone", label: "الهاتف", type: "text" },
        { key: "email", label: "الإيميل", type: "text" },
        { key: "active", label: "نشط", type: "boolean" },
        { key: "sort_order", label: "الترتيب", type: "number" },
      ]}
      defaultValues={{ active: true, sort_order: 0 }}
    />
  ),
});
