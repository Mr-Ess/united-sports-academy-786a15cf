import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ReactNode } from "react";
import type { AcademyRole } from "@/lib/academy.functions";

type Props = {
  roles: AcademyRole[];
  userRoles: AcademyRole[];
  isSuperAdmin?: boolean;
  children: ReactNode;
};

export function PermissionGate({ roles, userRoles, isSuperAdmin, children }: Props) {
  const allowed = isSuperAdmin || roles.some((r) => userRoles.includes(r));
  if (!allowed) {
    return (
      <Card className="border-dashed p-8 text-center">
        <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-destructive" />
        <h3 className="mb-1 font-black">ماعندكش صلاحية</h3>
        <p className="text-sm text-muted-foreground">حسابك مش مصرح له بدخول الصفحة دي.</p>
      </Card>
    );
  }
  return <>{children}</>;
}
