import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { CrudModule } from "@/components/academy/CrudModule";
import { BranchGuard } from "@/components/academy/BranchGuard";

export const Route = createFileRoute("/_authenticated/admin/academy/assessments")({
  component: () => (
    <BranchGuard>
      <CrudModule
        icon={ClipboardList}
        title="التقييمات (Assessments)"
        subtitle="تقييم فني/تحمل/سرعة/عام"
        table="assessments"
        orderBy={{ column: "assessed_at", ascending: false }}
        fields={[
          { key: "client_id", label: "المتدرب", type: "text", required: true },
          { key: "coach_id", label: "الكوتش", type: "text" },
          { key: "assessed_at", label: "التاريخ", type: "datetime" },
          { key: "technique", label: "التقنية (0-10)", type: "number" },
          { key: "endurance", label: "التحمل (0-10)", type: "number" },
          { key: "speed", label: "السرعة (0-10)", type: "number" },
          { key: "overall", label: "التقييم العام", type: "number" },
          { key: "passed", label: "ناجح؟", type: "boolean" },
          { key: "notes", label: "ملاحظات", type: "textarea", hideInTable: true },
        ]}
      />
    </BranchGuard>
  ),
});
