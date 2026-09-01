import type { ReactNode } from "react";

// PERMISSIONS TEMPORARILY DISABLED — every signed-in user can open every page.
// Re-enable by restoring the role check below (useSession + canAccess/canAccessDynamic).
export function PermissionGate({ path: _path, children }: { path: string; children: ReactNode }) {
  return <>{children}</>;
}

