import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { CrudModule } from "@/components/academy/CrudModule";

export const Route = createFileRoute("/_authenticated/admin/academy/hr/payroll")({
  component: () => (
    <CrudModule
      icon={Wallet}
      title="الرواتب (Payroll Runs)"
      subtitle="دفعات الرواتب الشهرية"
      table="payroll_runs"
      orderBy={{ column: "period_start", ascending: false }}
      fields={[
        { key: "period_start", label: "من", type: "date", required: true },
        { key: "period_end", label: "إلى", type: "date", required: true },
        { key: "status", label: "الحالة", type: "select", options: [
          { value: "draft", label: "مسودة" },
          { value: "approved", label: "معتمد" },
          { value: "paid", label: "مدفوع" },
        ]},
        { key: "notes", label: "ملاحظات", type: "textarea", hideInTable: true },
      ]}
      defaultValues={{ status: "draft" }}
    />
  ),
});
