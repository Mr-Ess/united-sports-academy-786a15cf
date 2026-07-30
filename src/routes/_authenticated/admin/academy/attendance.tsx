import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck } from "lucide-react";
import { CrudModule } from "@/components/academy/CrudModule";
import { BranchGuard } from "@/components/academy/BranchGuard";

export const Route = createFileRoute("/_authenticated/admin/academy/attendance")({
  component: () => (
    <BranchGuard>
      <CrudModule
        icon={ClipboardCheck}
        title="الحضور (Attendance)"
        subtitle="سجلات حضور المتدربين"
        table="attendance"
        orderBy={{ column: "checked_in_at", ascending: false }}
        fields={[
          { key: "client_id", label: "معرف المتدرب", type: "text", required: true },
          { key: "session_id", label: "معرف الحصة", type: "text" },
          { key: "method", label: "الطريقة", type: "select", options: [
            { value: "manual", label: "يدوي" },
            { value: "qr", label: "QR" },
            { value: "coach", label: "الكوتش" },
          ]},
          { key: "checked_in_at", label: "وقت الحضور", type: "datetime" },
          { key: "notes", label: "ملاحظات", type: "textarea", hideInTable: true },
        ]}
        defaultValues={{ method: "manual" }}
      />
    </BranchGuard>
  ),
});
