import { createFileRoute } from "@tanstack/react-router";
import { Waves } from "lucide-react";
import { CrudModule } from "@/components/academy/CrudModule";
import { BranchGuard } from "@/components/academy/BranchGuard";

export const Route = createFileRoute("/_authenticated/admin/academy/lane-log")({
  component: () => (
    <BranchGuard>
      <CrudModule
        icon={Waves}
        title="سجل الحارات (Lane Log)"
        subtitle="استخدام حارات المسبح"
        table="lane_logs"
        orderBy={{ column: "start_at", ascending: false }}
        fields={[
          { key: "pool_lane", label: "رقم الحارة", type: "number", required: true },
          { key: "start_at", label: "من", type: "datetime", required: true },
          { key: "end_at", label: "إلى", type: "datetime" },
          { key: "activity", label: "النشاط", type: "text" },
          { key: "notes", label: "ملاحظات", type: "textarea", hideInTable: true },
        ]}
      />
    </BranchGuard>
  ),
});
