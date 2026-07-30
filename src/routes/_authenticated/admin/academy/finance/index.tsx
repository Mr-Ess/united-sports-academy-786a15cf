import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/academy/finance/")({
  beforeLoad: () => { throw redirect({ to: "/admin/academy/finance/ledger" }); },
});
