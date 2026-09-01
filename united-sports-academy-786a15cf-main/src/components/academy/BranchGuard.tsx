import { AlertCircle } from "lucide-react";
import { useBranch } from "@/lib/branch-context";
import { Card } from "@/components/ui/card";
import type { ReactNode } from "react";

export function BranchGuard({ children }: { children: ReactNode }) {
  const { currentBranchId, branches } = useBranch();
  if (!currentBranchId) {
    return (
      <Card className="border-dashed p-8 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <h3 className="mb-1 font-black">لازم تختار فرع الأول</h3>
        <p className="text-sm text-muted-foreground">
          {branches.length
            ? "استخدم مبدل الفروع من أعلى الصفحة لاختيار الفرع النشط."
            : "ماعندكش فروع مربوطة بالحساب. تواصل مع الـ Super Admin."}
        </p>
      </Card>
    );
  }
  return <>{children}</>;
}
