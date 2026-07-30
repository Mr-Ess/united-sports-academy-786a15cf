import { Link, useRouterState } from "@tanstack/react-router";

export type SubNavItem = { to: string; label: string };

export function SubNav({ items }: { items: SubNavItem[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="mb-4 flex flex-wrap gap-1 rounded-2xl border bg-card p-1">
      {items.map((it) => {
        const active = pathname === it.to || pathname.startsWith(it.to + "/");
        return (
          <Link
            key={it.to}
            to={it.to}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </div>
  );
}
