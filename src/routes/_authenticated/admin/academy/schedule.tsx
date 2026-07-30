import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { CrudModule } from "@/components/academy/CrudModule";
import { BranchGuard } from "@/components/academy/BranchGuard";

export const Route = createFileRoute("/_authenticated/admin/academy/schedule")({
  component: () => (
    <BranchGuard>
      <CrudModule
        icon={CalendarDays}
        title="الجداول (Schedule)"
        subtitle="حصص التدريب اليومية والأسبوعية"
        table="schedule_sessions"
        searchKeys={["title"]}
        orderBy={{ column: "start_at", ascending: true }}
        fields={[
          { key: "title", label: "العنوان", type: "text", required: true },
          { key: "start_at", label: "من", type: "datetime", required: true },
          { key: "end_at", label: "إلى", type: "datetime", required: true },
          { key: "pool_lane", label: "الحارة", type: "number" },
          { key: "capacity", label: "السعة", type: "number" },
          { key: "notes", label: "ملاحظات", type: "textarea", hideInTable: true },
        ]}
        defaultValues={{ capacity: 10 }}
      />
    </BranchGuard>
  ),
});
