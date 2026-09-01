import { supabase } from "@/integrations/supabase/client";

export const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function genCode(prefix = "TK"): string {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${prefix}-${rand}-${Date.now().toString(36).toUpperCase()}`;
}

export async function fetchNewClientCode(): Promise<string> {
  const { data, error } = await supabase.rpc("ac_generate_client_code");
  if (error) throw error;
  return data as unknown as string;
}

export function fmtTime(hhmmss: string | null | undefined) {
  if (!hhmmss) return "";
  const [h, m] = hhmmss.split(":");
  const hh = Number(h);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${m} ${ampm}`;
}

export function statusColor(occupied: number, capacity: number): string {
  if (occupied >= capacity) return "bg-rose-500/20 text-rose-300 border-rose-500/40";
  if (occupied / Math.max(capacity, 1) >= 0.7) return "bg-amber-500/20 text-amber-300 border-amber-500/40";
  return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
}
