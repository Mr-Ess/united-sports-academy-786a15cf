import { Link, useRouterState } from "@tanstack/react-router";
import type { ComponentType } from "react";

export type SubNavItem = { to: string; label: string; icon?: ComponentType<{ className?: string }> };

export function SubNav({ items }: { items: SubNavItem[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="glass flex flex-wrap gap-1 rounded-lg p-1 mb-4">
      {items.map((it) => {
        const active = pathname === it.to || pathname.startsWith(it.to + "/");
        const Icon = it.icon;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition " +
              (active
                ? "bg-gradient-to-r from-teal to-cyan-glow text-primary-foreground shadow"
                : "text-muted-foreground hover:bg-accent hover:text-foreground")
            }
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {it.label}
          </Link>
        );
      })}
    </div>
  );
}

import { Wallet, Receipt, CreditCard, Waves, Grid3x3, Users2 } from "lucide-react";
import { useI18n } from "@/lib/legends/i18n";

export function FinanceSubNav() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  return (
    <SubNav
      items={[
        { to: "/admin/academy/finance", label: ar ? "المالية" : "Finance", icon: Wallet },
        { to: "/admin/academy/receipts", label: ar ? "الإيصالات" : "Receipts", icon: Receipt },
        { to: "/admin/academy/subscriptions", label: ar ? "الاشتراكات" : "Subscriptions", icon: CreditCard },
      ]}
    />
  );
}

export function PoolsConfigSubNav() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  return (
    <SubNav
      items={[
        { to: "/admin/academy/pools", label: ar ? "المسابح" : "Pools", icon: Waves },
        { to: "/admin/academy/lanes", label: ar ? "الحارات" : "Lanes", icon: Grid3x3 },
        { to: "/admin/academy/groups", label: ar ? "المجموعات" : "Groups", icon: Users2 },
        { to: "/admin/academy/capacity", label: ar ? "ساعات الحارات" : "Lane Hours", icon: Grid3x3 },
      ]}
    />
  );
}
