import { createMiddleware } from "@tanstack/react-start";
import { OPEN_ACCESS } from "./access";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const openAdminAccess = createMiddleware({ type: "function" }).server(async (options) => {
  if (OPEN_ACCESS) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return options.next({
      context: {
        supabase: supabaseAdmin,
        userId: "00000000-0000-0000-0000-000000000000",
        claims: { email: "guest@example.com" },
        isOpenAccess: true,
      },
    });
  }

  return requireSupabaseAuth.options.server!(options);
});
