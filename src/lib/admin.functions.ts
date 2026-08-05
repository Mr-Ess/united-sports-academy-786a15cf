import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { openAdminAccess } from "@/lib/open-admin-middleware";

// ============ ROLE / IDENTITY ============
export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([openAdminAccess])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw error;
    return {
      userId: context.userId,
      email: context.claims.email as string | undefined,
      roles: context.userId === "00000000-0000-0000-0000-000000000000" ? ["admin", "editor", "moderator"] : (data ?? []).map((r) => r.role as "admin" | "editor" | "moderator"),
    };
  });

// ============ DASHBOARD STATS ============
export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([openAdminAccess])
  .handler(async ({ context }) => {
    const [courses, subs, posts, partners] = await Promise.all([
      context.supabase.from("courses").select("id, published", { count: "exact", head: false }),
      context.supabase.from("join_submissions").select("id, status, created_at, type").order("created_at", { ascending: false }).limit(10),
      context.supabase.from("blog_posts").select("id, published", { count: "exact", head: false }),
      context.supabase.from("partners").select("id", { count: "exact", head: true }),
    ]);
    const newCount = (subs.data ?? []).filter((s) => s.status === "new").length;
    return {
      counts: {
        courses: courses.data?.length ?? 0,
        publishedCourses: (courses.data ?? []).filter((c) => c.published).length,
        posts: posts.data?.length ?? 0,
        publishedPosts: (posts.data ?? []).filter((p) => p.published).length,
        partners: partners.count ?? 0,
        newSubmissions: newCount,
      },
      recentSubmissions: subs.data ?? [],
    };
  });

// ============ COURSES ============
const courseSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  title_ar: z.string().min(1).max(200),
  category: z.string().min(1),
  category_ar: z.string().min(1),
  mode: z.enum(["Online", "Offline", "Hybrid"]),
  level: z.enum(["Beginner", "Intermediate", "Advanced", "All Levels"]),
  duration: z.string().optional().nullable(),
  duration_ar: z.string().optional().nullable(),
  schedule: z.string().optional().nullable(),
  schedule_ar: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  venue_ar: z.string().optional().nullable(),
  price: z.number().min(0),
  original_price: z.number().min(0).nullable().optional(),
  seats_left: z.number().int().min(0),
  total_seats: z.number().int().min(0),
  gradient: z.string().default("from-blue-500 to-indigo-500"),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
});

export const listCourses = createServerFn({ method: "GET" })
  .middleware([openAdminAccess])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  });

export const saveCourse = createServerFn({ method: "POST" })
  .middleware([openAdminAccess])
  .inputValidator((d: unknown) => courseSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...fields } = data;
    if (id) {
      const { error } = await context.supabase.from("courses").update(fields).eq("id", id);
      if (error) throw error;
      return { id };
    }
    const { data: inserted, error } = await context.supabase
      .from("courses")
      .insert(fields)
      .select("id")
      .single();
    if (error) throw error;
    return { id: inserted.id };
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .middleware([openAdminAccess])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("courses").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ SUBMISSIONS ============
export const listSubmissions = createServerFn({ method: "GET" })
  .middleware([openAdminAccess])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("join_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  });

export const updateSubmissionStatus = createServerFn({ method: "POST" })
  .middleware([openAdminAccess])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "contacted", "approved", "rejected"]),
      notes: z.string().max(2000).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("join_submissions")
      .update({ status: data.status, notes: data.notes ?? null })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteSubmission = createServerFn({ method: "POST" })
  .middleware([openAdminAccess])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("join_submissions").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ BLOG POSTS ============
const postSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  title_ar: z.string().max(200).optional().nullable(),
  excerpt: z.string().max(500).optional().nullable(),
  excerpt_ar: z.string().max(500).optional().nullable(),
  content: z.string().optional().nullable(),
  content_ar: z.string().optional().nullable(),
  cover_image: z.string().url().optional().nullable().or(z.literal("")),
  author_name: z.string().max(120).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  published: z.boolean().default(false),
});

export const listPosts = createServerFn({ method: "GET" })
  .middleware([openAdminAccess])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  });

export const savePost = createServerFn({ method: "POST" })
  .middleware([openAdminAccess])
  .inputValidator((d: unknown) => postSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...fields } = data;
    const payload = {
      ...fields,
      published_at: fields.published ? new Date().toISOString() : null,
    };
    if (id) {
      const { error } = await context.supabase.from("blog_posts").update(payload).eq("id", id);
      if (error) throw error;
      return { id };
    }
    const { data: inserted, error } = await context.supabase
      .from("blog_posts")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    return { id: inserted.id };
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([openAdminAccess])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("blog_posts").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ SETTINGS ============
export const getSiteSettings = createServerFn({ method: "GET" })
  .middleware([openAdminAccess])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("site_settings").select("*");
    if (error) throw error;
    return data;
  });

export const saveSetting = createServerFn({ method: "POST" })
  .middleware([openAdminAccess])
  .inputValidator((d: unknown) =>
    z.object({ key: z.string().min(1).max(80), value: z.record(z.string(), z.any()) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() });
    if (error) throw error;
    return { ok: true };
  });

// ============ MEDIA ITEMS ============
const mediaSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().max(200).optional().nullable(),
  title_ar: z.string().max(200).optional().nullable(),
  url: z.string().min(1),
  thumbnail_url: z.string().optional().nullable(),
  type: z.enum(["image", "video"]),
  category: z.string().max(80).optional().nullable(),
  sort_order: z.number().int().default(0),
  published: z.boolean().default(true),
});

export const listMedia = createServerFn({ method: "GET" })
  .middleware([openAdminAccess])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("media_items").select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  });

export const saveMedia = createServerFn({ method: "POST" })
  .middleware([openAdminAccess])
  .inputValidator((d: unknown) => mediaSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...fields } = data;
    if (id) {
      const { error } = await context.supabase.from("media_items").update(fields).eq("id", id);
      if (error) throw error;
      return { id };
    }
    const { data: inserted, error } = await context.supabase
      .from("media_items").insert(fields).select("id").single();
    if (error) throw error;
    return { id: inserted.id };
  });

export const deleteMedia = createServerFn({ method: "POST" })
  .middleware([openAdminAccess])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("media_items").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ PARTNERS ============
const partnerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  logo_url: z.string().optional().nullable(),
  website_url: z.string().url().optional().nullable().or(z.literal("")),
  tier: z.enum(["platinum", "gold", "silver", "bronze", "community"]).default("community"),
  sort_order: z.number().int().default(0),
  published: z.boolean().default(true),
});

export const listPartners = createServerFn({ method: "GET" })
  .middleware([openAdminAccess])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("partners").select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  });

export const savePartner = createServerFn({ method: "POST" })
  .middleware([openAdminAccess])
  .inputValidator((d: unknown) => partnerSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...fields } = data;
    const payload = { ...fields, website_url: fields.website_url || null };
    if (id) {
      const { error } = await context.supabase.from("partners").update(payload).eq("id", id);
      if (error) throw error;
      return { id };
    }
    const { data: inserted, error } = await context.supabase
      .from("partners").insert(payload).select("id").single();
    if (error) throw error;
    return { id: inserted.id };
  });

export const deletePartner = createServerFn({ method: "POST" })
  .middleware([openAdminAccess])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("partners").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

