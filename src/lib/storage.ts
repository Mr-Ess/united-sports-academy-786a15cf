import { supabase } from "@/integrations/supabase/client";

const BUCKET = "site-media";
const YEAR = 60 * 60 * 24 * 365;

export async function uploadToMedia(file: File, folder = "uploads"): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

export async function signMediaUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, YEAR);
  if (error) return null;
  return data.signedUrl;
}

export async function signMany(paths: (string | null | undefined)[]): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  const uniq = Array.from(new Set(paths.filter((p): p is string => !!p && !p.startsWith("http"))));
  if (!uniq.length) return map;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(uniq, YEAR);
  (data ?? []).forEach((r, i) => {
    if (r.signedUrl) map[uniq[i]] = r.signedUrl;
  });
  return map;
}

export async function removeFromMedia(path: string | null | undefined) {
  if (!path || path.startsWith("http")) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
