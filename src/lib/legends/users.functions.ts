import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { openAdminAccess as requireSupabaseAuth } from "@/lib/open-admin-middleware";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["academy_role"];

const createUserSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  display_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional().nullable(),
  role: z.string().min(1).max(40),
  branch_id: z.string().uuid().nullable().optional(),
});

export const createUserWithRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createUserSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Authorize: only super_admin or branch_admin can create users.
    const { data: isSuper } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin" as AppRole,
    });
    let allowed = !!isSuper;
    if (!allowed) {
      const { data: isBranchAdmin } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "branch_admin" as AppRole,
        ...(data.branch_id ? { _branch_id: data.branch_id } : {}),
      });
      allowed = !!isBranchAdmin;
    }
    if (!allowed) throw new Error("Forbidden");

    // Non-super admins cannot grant global roles or super_admin.
    if (!isSuper && (data.role === "super_admin" || !data.branch_id)) {
      throw new Error("Forbidden: branch admins must scope to their branch");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Create the auth user (email confirmed so they can sign in immediately).
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { display_name: data.display_name, phone: data.phone ?? null },
    });
    if (createErr || !created.user) {
      throw new Error(createErr?.message ?? "Failed to create user");
    }
    const newUserId = created.user.id;

    // Ensure profile (handle_new_user trigger should already insert; upsert to be safe).
    await supabaseAdmin.from("ac_profiles").upsert({
      id: newUserId,
      display_name: data.display_name,
      phone: data.phone ?? null,
    } as any);

    // Grant role.
    const { error: roleErr } = await supabaseAdmin.from("ac_user_roles").insert({
      user_id: newUserId,
      role: data.role as AppRole,
      branch_id: data.branch_id ?? null,
    } as any);
    if (roleErr) {
      // Best-effort: keep the user even if role insert fails — surface error to caller.
      throw new Error(`User created, but role grant failed: ${roleErr.message}`);
    }

    return { ok: true, user_id: newUserId };
  });

export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ user_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin" as AppRole,
    });
    if (!isSuper) throw new Error("Forbidden");
    if (data.user_id === context.userId) throw new Error("You cannot delete your own account");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
