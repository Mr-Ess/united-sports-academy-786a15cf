import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const convertLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { leadId: string }) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: clientId, error } = await context.supabase.rpc("convert_lead_to_client", {
      _lead_id: data.leadId,
    });
    if (error) throw error;
    return { clientId: clientId as string };
  });

export const updateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: string }) =>
    z.object({ id: z.string().uuid(), status: z.string() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("leads")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const lookupClientByCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { code: string }) => z.object({ code: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("clients")
      .select("id, client_code, full_name, phone, email, branch_id")
      .or(`client_code.ilike.${data.code}%,phone.ilike.%${data.code}%,full_name.ilike.%${data.code}%`)
      .limit(10);
    if (error) throw error;
    return rows ?? [];
  });
