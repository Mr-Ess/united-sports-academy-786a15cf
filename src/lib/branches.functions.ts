import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const branchSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(200),
  name_ar: z.string().max(200).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  active: z.boolean().default(true),
  deleted_at: z.string().nullable().optional(),
});

export const listBranches = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("branches")
      .select("id, name, name_ar, address, phone, active")
      .is("deleted_at", null)
      .order("name");

    if (error) throw error;
    return data ?? [];
  });

export const saveBranch = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => branchSchema.parse(payload))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...fields } = data;

    const payload = {
      ...fields,
      name_ar: fields.name_ar || fields.name,
      address: fields.address || null,
      phone: fields.phone || null,
      active: fields.active ?? true,
    };

    if (id) {
      const { data: updated, error } = await supabaseAdmin
        .from("branches")
        .update(payload)
        .eq("id", id)
        .select("id, name, name_ar, address, phone, active")
        .single();

      if (error) throw error;
      return updated;
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("branches")
      .insert(payload)
      .select("id, name, name_ar, address, phone, active")
      .single();

    if (error) throw error;
    return inserted;
  });

export const deleteBranch = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => z.object({ id: z.string().uuid() }).parse(payload))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("branches")
      .update({ deleted_at: new Date().toISOString(), active: false })
      .eq("id", data.id);

    if (error) throw error;
    return { ok: true };
  });
