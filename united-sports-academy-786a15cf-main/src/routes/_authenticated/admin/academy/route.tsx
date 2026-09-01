import { createFileRoute, Outlet } from "@tanstack/react-router";
import { I18nProvider } from "@/lib/legends/i18n";
import { SessionProvider } from "@/lib/legends/session";
import { BranchContextBar } from "@/components/legends/BranchContextBar";

export const Route = createFileRoute("/_authenticated/admin/academy")({
  component: AcademyLayout,
});

function AcademyLayout() {
  return (
    <I18nProvider>
      <SessionProvider>
        <div className="space-y-4">
          <BranchContextBar />
          <Outlet />
        </div>
      </SessionProvider>
    </I18nProvider>
  );
}
