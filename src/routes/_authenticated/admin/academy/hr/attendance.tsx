import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck } from "lucide-react";
import { CrudModule } from "@/components/academy/CrudModule";

export const Route = createFileRoute("/_authenticated/admin/academy/hr/attendance")({
  component: () => (
    <CrudModule
      icon={CalendarCheck}
      title="حضور الموظفين"
      subtitle="سجل حضور/انصراف يومي"
      table="hr_attendance"
      orderBy={{ column: "work_date", ascending: false }}
      fields={[
        { key: "employee_id", label: "الموظف (ID)", type: "text", required: true },
        { key: "work_date", label: "التاريخ", type: "date", required: true },
        { key: "check_in", label: "الدخول", type: "datetime" },
        { key: "check_out", label: "الخروج", type: "datetime" },
        { key: "hours", label: "الساعات", type: "number" },
        { key: "notes", label: "ملاحظات", type: "textarea", hideInTable: true },
      ]}
    />
  ),
});
