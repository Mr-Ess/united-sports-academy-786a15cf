import { createMiddleware } from "@tanstack/react-start";
import { OPEN_ACCESS } from "@/lib/access";

export const openAdminAccess = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    if (OPEN_ACCESS) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      return next({
        context: {
          supabase: supabaseAdmin,
          userId: "00000000-0000-0000-0000-000000000000",
          claims: { email: "guest@example.com" },
          isOpenAccess: true,
        },
      });
    }

    throw new Error("Authentication required. The app is running in secure mode.");
  },
);
