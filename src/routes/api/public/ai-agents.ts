import { createFileRoute } from "@tanstack/react-router";

/**
 * Public read endpoint for AI Agents configuration.
 * Used by external tools (n8n, automation workers) to fetch the latest
 * agent configs maintained from the dashboard.
 *
 * Auth: x-api-key header must equal AI_AGENTS_API_KEY.
 * Query params:
 *   - branch_id: filter by branch (optional)
 *   - agent_type: filter by type (optional)
 *   - active_only: "true" to return only is_active=true (default true)
 *   - id: fetch a single agent by id
 */
export const Route = createFileRoute("/api/public/ai-agents")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const expected = process.env.AI_AGENTS_API_KEY;
        if (!expected) {
          return Response.json({ ok: false, error: "Server key not configured" }, { status: 500 });
        }
        const key = request.headers.get("x-api-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!key || key !== expected) {
          return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        const branchId = url.searchParams.get("branch_id");
        const agentType = url.searchParams.get("agent_type");
        const activeOnly = url.searchParams.get("active_only") !== "false";

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let q = supabaseAdmin
          .from("ai_agents")
          .select("id, branch_id, name, name_ar, description, description_ar, agent_type, system_prompt, model, temperature, max_tokens, tools, webhook_url, n8n_workflow_id, trigger_event, schedule_cron, config, is_active, last_run_at, updated_at");

        if (id) q = q.eq("id", id);
        if (branchId) q = q.eq("branch_id", branchId);
        if (agentType) q = q.eq("agent_type", agentType);
        if (activeOnly) q = q.eq("is_active", true);

        const { data, error } = await q.order("updated_at", { ascending: false });
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        return Response.json({ ok: true, agents: data ?? [] });
      },

      // Allow n8n to update last_run_at after executing the workflow
      POST: async ({ request }) => {
        const expected = process.env.AI_AGENTS_API_KEY;
        if (!expected) return Response.json({ ok: false }, { status: 500 });
        const key = request.headers.get("x-api-key");
        if (key !== expected) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

        const body = (await request.json().catch(() => null)) as { id?: string } | null;
        if (!body?.id) return Response.json({ ok: false, error: "id required" }, { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("ai_agents")
          .update({ last_run_at: new Date().toISOString() })
          .eq("id", body.id);
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
