import { createFileRoute } from "@tanstack/react-router";
import { Waves } from "lucide-react";
import { CrudModule } from "@/components/academy/CrudModule";
import { BranchGuard } from "@/components/academy/BranchGuard";

export const Route = createFileRoute("/_authenticated/admin/academy/pool-operations")({
  component: () => (
    <BranchGuard>
      <CrudModule
        icon={Waves}
        title="تشغيل المسبح (Pool Operations)"
        subtitle="قياسات جودة المياه اليومية"
        table="pool_sessions"
        orderBy={{ column: "measured_at", ascending: false }}
        fields={[
          { key: "measured_at", label: "وقت القياس", type: "datetime", required: true },
          { key: "chlorine", label: "الكلور (mg/L)", type: "number" },
          { key: "ph", label: "الأس الهيدروجيني", type: "number" },
          { key: "temperature", label: "الحرارة (°C)", type: "number" },
          { key: "turbidity", label: "العكارة (NTU)", type: "number" },
          { key: "notes", label: "ملاحظات", type: "textarea", hideInTable: true },
        ]}
      />
    </BranchGuard>
  ),
});
