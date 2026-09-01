import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Feature = { title: string; description?: string };

export function PlaceholderPage({
  icon: Icon,
  title,
  subtitle,
  features = [],
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  features?: Feature[];
  children?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black">
            <Icon className="h-6 w-6 text-primary" /> {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <Badge variant="secondary" className="gap-1">
          <Construction className="h-3 w-3" /> قيد التطوير
        </Badge>
      </div>

      {features.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 font-black">المزايا المخططة</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {features.map((f, i) => (
              <li key={i} className="rounded-xl border bg-muted/30 p-3">
                <div className="text-sm font-black">{f.title}</div>
                {f.description && (
                  <div className="mt-1 text-xs text-muted-foreground">{f.description}</div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {children}
    </div>
  );
}
