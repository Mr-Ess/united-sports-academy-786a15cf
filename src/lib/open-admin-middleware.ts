import { createMiddleware } from "@tanstack/react-start";

export const openAdminAccess = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  return next({
    context: {
      supabase: supabaseAdmin,
      userId: "00000000-0000-0000-0000-000000000000",
      claims: { email: undefined },
    },
  });
});