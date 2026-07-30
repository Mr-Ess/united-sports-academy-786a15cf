import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SubNav } from "@/components/academy/SubNav";
import { BranchGuard } from "@/components/academy/BranchGuard";

export const Route = createFileRoute("/_authenticated/admin/academy/finance")({
  component: FinanceLayout,
});

function FinanceLayout() {
  return (
    <BranchGuard>
      <SubNav
        items={[
          { to: "/admin/academy/finance/ledger", label: "الدفتر" },
          { to: "/admin/academy/finance/receipts", label: "الإيصالات" },
          { to: "/admin/academy/finance/subscriptions", label: "الاشتراكات" },
          { to: "/admin/academy/finance/invoicing", label: "الفوترة" },
        ]}
      />
      <Outlet />
    </BranchGuard>
  );
}
