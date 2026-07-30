import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SubNav } from "@/components/academy/SubNav";
import { BranchGuard } from "@/components/academy/BranchGuard";

export const Route = createFileRoute("/_authenticated/admin/academy/hr")({
  component: HRLayout,
});

function HRLayout() {
  return (
    <BranchGuard>
      <SubNav
        items={[
          { to: "/admin/academy/hr", label: "الموظفون" },
          { to: "/admin/academy/hr/attendance", label: "الحضور" },
          { to: "/admin/academy/hr/leaves", label: "الإجازات" },
          { to: "/admin/academy/hr/payroll", label: "الرواتب" },
        ]}
      />
      <Outlet />
    </BranchGuard>
  );
}
