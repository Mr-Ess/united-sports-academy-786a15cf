import { createFileRoute } from "@tanstack/react-router";
import { Repeat } from "lucide-react";
import { CrudModule } from "@/components/academy/CrudModule";

export const Route = createFileRoute("/_authenticated/admin/academy/finance/subscriptions")({
  component: () => (
    <CrudModule
      icon={Repeat}
      title="الاشتراكات (Subscriptions)"
      subtitle="خطط الاشتراك للمتدربين"
      table="subscriptions"
      searchKeys={["plan"]}
      fields={[
        { key: "client_id", label: "المتدرب (ID)", type: "text", required: true },
        { key: "plan", label: "الخطة", type: "text", required: true },
        { key: "start_date", label: "من", type: "date", required: true },
        { key: "end_date", label: "إلى", type: "date" },
        { key: "price", label: "السعر", type: "number", required: true },
        { key: "status", label: "الحالة", type: "select", options: [
          { value: "active", label: "نشط" },
          { value: "paused", label: "متوقف" },
          { value: "expired", label: "منتهي" },
          { value: "cancelled", label: "ملغي" },
        ]},
        { key: "notes", label: "ملاحظات", type: "textarea", hideInTable: true },
      ]}
      defaultValues={{ status: "active", price: 0 }}
    />
  ),
});
