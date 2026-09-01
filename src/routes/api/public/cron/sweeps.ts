import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

/**
 * Public cron endpoint. Called by pg_cron with the project anon key in the
 * `apikey` header. Iterates every branch and runs the sweeps + outbox drain
 * with the service role client (server-only).
 */
export const Route = createFileRoute("/api/public/cron/sweeps")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: branches, error } = await supabaseAdmin.from("branches").select("id");
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

        const results: any[] = [];
        const now = new Date();
        const in7 = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
        const today = now.toISOString().slice(0, 10);

        for (const b of branches ?? []) {
          let created = 0;

          // Expiring subs
          const { data: subs } = await supabaseAdmin
            .from("ac_subscriptions")
            .select("id, end_date, trainees:ac_trainees!inner(full_name, branch_id)")
            .eq("status", "active")
            .gte("end_date", today)
            .lte("end_date", in7);
          for (const s of subs ?? []) {
            const tr: any = (s as any).trainees;
            if (!tr || tr.branch_id !== b.id) continue;
            const days = Math.max(0, Math.ceil((new Date(s.end_date as string).getTime() - now.getTime()) / 86400000));
            const { data: ex } = await supabaseAdmin
              .from("ac_notifications").select("id")
              .eq("branch_id", b.id).eq("kind", "subscription_expiry")
              .gte("created_at", today).contains("meta", { subscription_id: s.id }).maybeSingle();
            if (ex) continue;
            await supabaseAdmin.from("ac_notifications").insert({
              branch_id: b.id, kind: "subscription_expiry",
              severity: days <= 2 ? "critical" : "warning",
              title: `اشتراك ${tr.full_name} ينتهي خلال ${days} يوم`,
              body: `يرجى المتابعة قبل ${s.end_date}`,
              link: "/subscriptions",
              meta: { subscription_id: s.id, days },
            });
            created++;
          }

          // Low stock
          const { data: items } = await supabaseAdmin
            .from("ac_inventory_items").select("id, name, quantity, min_quantity")
            .eq("branch_id", b.id);
          for (const it of items ?? []) {
            if ((it.quantity ?? 0) > (it.min_quantity ?? 0)) continue;
            const { data: ex } = await supabaseAdmin
              .from("ac_notifications").select("id")
              .eq("branch_id", b.id).eq("kind", "low_stock")
              .gte("created_at", today).contains("meta", { item_id: it.id }).maybeSingle();
            if (ex) continue;
            await supabaseAdmin.from("ac_notifications").insert({
              branch_id: b.id, kind: "low_stock", severity: "warning",
              title: `مخزون منخفض: ${it.name}`,
              body: `الكمية ${it.quantity} (الحد ${it.min_quantity})`,
              link: "/inventory", meta: { item_id: it.id },
            });
            created++;
          }
          results.push({ branch_id: b.id, created });
        }
        return Response.json({ ok: true, results });
      },
    },
  },
});
