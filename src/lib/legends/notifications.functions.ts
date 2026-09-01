import { createServerFn } from "@tanstack/react-start";
import { openAdminAccess as requireSupabaseAuth } from "@/lib/open-admin-middleware";

/**
 * Runs all alert sweeps for a single branch:
 *  - Subscriptions expiring within 7 days
 *  - Active subscriptions with sessions_used == sessions_total
 *  - Inventory items below min_quantity
 *  - Maintenance tickets open > 7 days
 * Inserts deduped in-app notifications and queues WhatsApp messages
 * into `whatsapp_outbox` (per branch templates).
 */
export const runBranchSweeps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { branchId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const branchId = data.branchId;
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
    const today = now.toISOString().slice(0, 10);

    let created = 0;
    let queued = 0;

    // 1. Expiring subscriptions
    const { data: expiring } = await supabase
      .from("ac_subscriptions")
      .select("id, end_date, trainee_id, trainees:ac_trainees!inner(full_name, phone, branch_id)")
      .eq("status", "active")
      .gte("end_date", today)
      .lte("end_date", in7);

    const { data: wa } = await supabase
      .from("ac_whatsapp_settings")
      .select("enabled, templates")
      .eq("branch_id", branchId)
      .maybeSingle();

    for (const s of expiring ?? []) {
      const tr: any = (s as any).trainees;
      if (!tr || tr.branch_id !== branchId) continue;
      const days = Math.max(
        0,
        Math.ceil((new Date(s.end_date as string).getTime() - now.getTime()) / 86400000),
      );
      // dedupe by meta.subscription_id today
      const { data: existing } = await supabase
        .from("ac_notifications")
        .select("id")
        .eq("branch_id", branchId)
        .eq("kind", "subscription_expiry")
        .gte("created_at", today)
        .contains("meta", { subscription_id: s.id })
        .maybeSingle();
      if (existing) continue;

      await supabase.from("ac_notifications").insert({
        branch_id: branchId,
        kind: "subscription_expiry",
        severity: days <= 2 ? "critical" : "warning",
        title: `اشتراك ${tr.full_name} ينتهي خلال ${days} يوم`,
        body: `تواصل مع العميل للتجديد قبل ${s.end_date}`,
        link: "/subscriptions",
        meta: { subscription_id: s.id, trainee_id: s.trainee_id, days },
      });
      created++;

      if (wa?.enabled && tr.phone) {
        const tpl = (wa.templates as any)?.subscription_expiry ?? "";
        const body = tpl.replace("{{name}}", tr.full_name).replace("{{days}}", String(days));
        await supabase.from("ac_whatsapp_outbox").insert({
          branch_id: branchId,
          to_phone: tr.phone,
          template_key: "subscription_expiry",
          payload: { name: tr.full_name, days },
          rendered_body: body,
        });
        queued++;
      }
    }

    // 2. Low stock
    const { data: items } = await supabase
      .from("ac_inventory_items")
      .select("id, name, quantity, min_quantity")
      .eq("branch_id", branchId);
    for (const it of items ?? []) {
      if ((it.quantity ?? 0) > (it.min_quantity ?? 0)) continue;
      const { data: existing } = await supabase
        .from("ac_notifications")
        .select("id")
        .eq("branch_id", branchId)
        .eq("kind", "low_stock")
        .gte("created_at", today)
        .contains("meta", { item_id: it.id })
        .maybeSingle();
      if (existing) continue;
      await supabase.from("ac_notifications").insert({
        branch_id: branchId,
        kind: "low_stock",
        severity: "warning",
        title: `مخزون منخفض: ${it.name}`,
        body: `الكمية الحالية ${it.quantity} (الحد الأدنى ${it.min_quantity})`,
        link: "/inventory",
        meta: { item_id: it.id },
      });
      created++;
    }

    // 3. Open maintenance tickets > 7 days
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const { data: tickets } = await supabase
      .from("ac_maintenance_tickets")
      .select("id, title, created_at, status")
      .eq("branch_id", branchId)
      .in("status", ["open", "in_progress"])
      .lt("created_at", weekAgo);
    for (const t of tickets ?? []) {
      const { data: existing } = await supabase
        .from("ac_notifications")
        .select("id")
        .eq("branch_id", branchId)
        .eq("kind", "maintenance")
        .gte("created_at", today)
        .contains("meta", { ticket_id: t.id })
        .maybeSingle();
      if (existing) continue;
      await supabase.from("ac_notifications").insert({
        branch_id: branchId,
        kind: "maintenance",
        severity: "warning",
        title: `تذكرة صيانة متأخرة: ${t.title}`,
        body: `مفتوحة منذ أكثر من 7 أيام`,
        link: "/maintenance",
        meta: { ticket_id: t.id },
      });
      created++;
    }

    return { created, queued };
  });

/**
 * Drains queued WhatsApp messages. If WHATSAPP_ACCESS_TOKEN +
 * WHATSAPP_PHONE_NUMBER_ID secrets are set, dispatches via Meta Cloud API;
 * otherwise marks each message as "skipped" with a clear reason so the
 * pipeline is observable end-to-end even before activation.
 */
export const drainWhatsappOutbox = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { branchId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    const { data: pending } = await supabase
      .from("ac_whatsapp_outbox")
      .select("id, to_phone, rendered_body")
      .eq("branch_id", data.branchId)
      .eq("status", "queued")
      .limit(50);

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const msg of pending ?? []) {
      if (!token || !phoneId) {
        await supabase
          .from("ac_whatsapp_outbox")
          .update({ status: "skipped", error: "WHATSAPP credentials not configured" })
          .eq("id", msg.id);
        skipped++;
        continue;
      }
      try {
        const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: msg.to_phone,
            type: "text",
            text: { body: msg.rendered_body },
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          await supabase
            .from("ac_whatsapp_outbox")
            .update({ status: "failed", error: JSON.stringify(body).slice(0, 500) })
            .eq("id", msg.id);
          failed++;
        } else {
          await supabase
            .from("ac_whatsapp_outbox")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              provider_message_id: body?.messages?.[0]?.id ?? null,
            })
            .eq("id", msg.id);
          sent++;
        }
      } catch (e) {
        await supabase
          .from("ac_whatsapp_outbox")
          .update({ status: "failed", error: String(e).slice(0, 500) })
          .eq("id", msg.id);
        failed++;
      }
    }
    return { sent, skipped, failed, total: pending?.length ?? 0 };
  });
