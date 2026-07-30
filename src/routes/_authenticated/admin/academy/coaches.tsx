import { createFileRoute } from "@tanstack/react-router";
import { Award } from "lucide-react";
import { CrudModule } from "@/components/academy/CrudModule";
import { BranchGuard } from "@/components/academy/BranchGuard";

export const Route = createFileRoute("/_authenticated/admin/academy/coaches")({
  component: () => (
    <BranchGuard>
      <CrudModule
        icon={Award}
        title="المدربين (Coaches)"
        subtitle="إدارة الكوتشات وتخصصاتهم"
        table="coaches"
        searchKeys={["full_name", "phone", "specialty"]}
        fields={[
          { key: "full_name", label: "الاسم", type: "text", required: true },
          { key: "phone", label: "الهاتف", type: "text" },
          { key: "email", label: "الإيميل", type: "text" },
          { key: "specialty", label: "التخصص", type: "text" },
          { key: "certifications", label: "الشهادات", type: "textarea", hideInTable: true },
          { key: "max_sessions", label: "أقصى حصص", type: "number" },
          { key: "active", label: "نشط", type: "boolean" },
          { key: "notes", label: "ملاحظات", type: "textarea", hideInTable: true },
        ]}
        defaultValues={{ active: true, max_sessions: 20 }}
      />
    </BranchGuard>
  ),
});
