import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { useBranch } from "@/lib/branch-context";

export function OsHeader({
  icon: Icon,
  title,
  subtitle,
  count,
  actions,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  count?: string | number;
  actions?: ReactNode;
}) {
  const { currentBranch } = useBranch();
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold sm:text-2xl">
          {Icon ? <Icon className="h-6 w-6 text-primary" /> : null}
          {title}
          {count !== undefined && (
            <Badge className="bg-primary/15 text-primary border border-primary/40">{count}</Badge>
          )}
        </h1>
        {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
        {currentBranch ? (
          <p className="mt-1 text-[11px] text-primary/80">
            تعمل حالياً في الفرع {currentBranch.name_ar || currentBranch.name}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}

export function OsCard({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`os-card p-4 ${className}`}>{children}</div>;
}

export function StatusPill({ tone, children }: { tone: "cyan" | "green" | "red" | "orange" | "muted"; children: ReactNode }) {
  const tones: Record<string, string> = {
    cyan: "border-primary/50 bg-primary/10 text-primary",
    green: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
    red: "border-red-500/50 bg-red-500/10 text-red-400",
    orange: "border-amber-500/50 bg-amber-500/10 text-amber-400",
    muted: "border-white/15 bg-white/5 text-muted-foreground",
  };
  return <span className={`os-pill ${tones[tone]}`}>{children}</span>;
}
