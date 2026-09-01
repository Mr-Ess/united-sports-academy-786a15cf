import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAgentWebhookInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const token = process.env.AGENT_WEBHOOK_TOKEN ?? "";
    return {
      configured: !!token,
      token,
    };
  });
