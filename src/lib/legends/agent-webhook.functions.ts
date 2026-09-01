import { createServerFn } from "@tanstack/react-start";
import { openAdminAccess as requireSupabaseAuth } from "@/lib/open-admin-middleware";

export const getAgentWebhookInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const token = process.env.AGENT_WEBHOOK_TOKEN ?? "";
    return {
      configured: !!token,
      token,
    };
  });
