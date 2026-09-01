import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Building2 } from "lucide-react";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Wrap any create/edit form. If no branch is selected, blocks the children
 * and renders a clear warning so the user can pick a branch first.
 */
export function BranchGuard({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  const { currentBranchId, branches } = useSession();
  const { t, lang } = useI18n();
  if (currentBranchId) return <>{children}</>;

  const title = lang === "ar" ? "اختر فرعًا أولًا" : "Select a branch first";
  const desc = branches.length === 0
    ? (lang === "ar" ? "لا توجد فروع متاحة لحسابك. تواصل مع المسؤول." : "No branches available for your account. Contact an administrator.")
    : (lang === "ar" ? "كل عملية إضافة أو تعديل يجب أن تكون مرتبطة بفرع محدد." : "Every create or update must be linked to a specific branch.");

  return (
    <Alert variant="destructive" className={compact ? "py-3" : ""}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" />{title}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{desc}</p>
        {branches.length === 0 && (
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/academy/branches">{lang === "ar" ? "إدارة الفروع" : "Manage branches"}</Link>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Imperative check. Use inside submit handlers:
 *   if (!ensureBranch()) return;
 */
export function useRequireBranch() {
  const { currentBranchId } = useSession();
  const { lang } = useI18n();
  return {
    branchId: currentBranchId,
    ensureBranch: (): string | null => {
      if (!currentBranchId) {
        toast.error(
          lang === "ar"
            ? "اختر فرعًا قبل المتابعة — كل عملية يجب أن تتبع فرعًا."
            : "Select a branch before continuing — every record must belong to a branch.",
        );
        return null;
      }
      return currentBranchId;
    },
  };
}
