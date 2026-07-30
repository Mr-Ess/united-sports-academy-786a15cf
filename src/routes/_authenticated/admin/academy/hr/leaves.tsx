import { createFileRoute } from "@tanstack/react-router";
import { PlaneTakeoff } from "lucide-react";
import { CrudModule } from "@/components/academy/CrudModule";

export const Route = createFileRoute("/_authenticated/admin/academy/hr/leaves")({
  component: () => (
    <CrudModule
      icon={PlaneTakeoff}
      title="طلبات الإجازة"
      subtitle="Workflow: pending → approved / rejected"
      table="hr_leaves"
      fields={[
        { key: "employee_id", label: "الموظف (ID)", type: "text", required: true },
        { key: "leave_type", label: "النوع", type: "select", options: [
          { value: "annual", label: "سنوية" },
          { value: "sick", label: "مرضية" },
          { value: "unpaid", label: "بدون راتب" },
          { value: "emergency", label: "طارئة" },
        ]},
        { key: "start_date", label: "من", type: "date", required: true },
        { key: "end_date", label: "إلى", type: "date", required: true },
        { key: "status", label: "الحالة", type: "select", options: [
          { value: "pending", label: "قيد المراجعة" },
          { value: "approved", label: "موافق" },
          { value: "rejected", label: "مرفوض" },
        ]},
        { key: "reason", label: "السبب", type: "textarea", hideInTable: true },
      ]}
      defaultValues={{ status: "pending", leave_type: "annual" }}
    />
  ),
});
