import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { CrudModule } from "@/components/academy/CrudModule";

export const Route = createFileRoute("/_authenticated/admin/academy/finance/invoicing")({
  component: () => (
    <CrudModule
      icon={FileText}
      title="الفوترة (Invoices)"
      subtitle="فواتير المتدربين"
      table="invoices"
      searchKeys={["invoice_no", "description"]}
      fields={[
        { key: "invoice_no", label: "رقم الفاتورة", type: "text" },
        { key: "client_id", label: "المتدرب (ID)", type: "text" },
        { key: "amount", label: "المبلغ", type: "number", required: true },
        { key: "status", label: "الحالة", type: "select", options: [
          { value: "unpaid", label: "غير مدفوعة" },
          { value: "paid", label: "مدفوعة" },
          { value: "partial", label: "جزئية" },
          { value: "cancelled", label: "ملغاة" },
        ]},
        { key: "due_date", label: "تاريخ الاستحقاق", type: "date" },
        { key: "description", label: "الوصف", type: "textarea", hideInTable: true },
      ]}
      defaultValues={{ status: "unpaid", amount: 0 }}
    />
  ),
});
