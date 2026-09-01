import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Grid3x3, Plus, Trash2 } from "lucide-react";
import { statusColor } from "@/lib/legends/phase2-helpers";
import { toast } from "sonner";
import { PoolsConfigSubNav } from "@/components/legends/SubNav";


export const Route = createFileRoute("/_authenticated/admin/academy/lanes")({
  head: () => ({ meta: [{ title: "Lanes · United Sports Academy" }] }),
  component: LanesPage 
});

type Lane = { id: string; pool_id: string; branch_id: string; lane_number: number; name: string | null; default_capacity: number; status: string };
type Pool = { id: string; name: string; name_ar: string | null };
type Occ = { schedule_slot_id: string; lane_id: string; capacity: number; occupied: number };

function LanesPage() {
  const { currentBranchId } = useSession();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const poolsQ = useQuery({
    queryKey: ["pools", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_pools").select("id,name,name_ar")
        .eq("branch_id", currentBranchId!).is("deleted_at", null).order("name");
      if (error) throw error;
      return data as Pool[];
    },
  });
  const lanesQ = useQuery({
    queryKey: ["lanes", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_lanes").select("*")
        .eq("branch_id", currentBranchId!).order("pool_id").order("lane_number");
      if (error) throw error;
      return data as Lane[];
    },
  });
  const occQ = useQuery({
    queryKey: ["lane_occupancy", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_lane_occupancy").select("schedule_slot_id,lane_id,capacity,occupied")
        .eq("branch_id", currentBranchId!);
      if (error) throw error;
      return data as Occ[];
    },
  });

  const occByLane = useMemo(() => {
    const m: Record<string, { capacity: number; occupied: number }> = {};
    (occQ.data ?? []).forEach((o) => {
      const cur = m[o.lane_id] ?? { capacity: 0, occupied: 0 };
      m[o.lane_id] = { capacity: Math.max(cur.capacity, Number(o.capacity) || 0), occupied: cur.occupied + (Number(o.occupied) || 0) };
    });
    return m;
  }, [occQ.data]);

  const create = useMutation({
    mutationFn: async (p: { pool_id: string; lane_number: number; default_capacity: number; name: string | null }) => {
      const { error } = await supabase.from("ac_lanes").insert({ ...p, branch_id: currentBranchId } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lanes"] }); setOpen(false); toast.success(lang === "ar" ? "تمت الإضافة" : "Created"); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateCap = useMutation({
    mutationFn: async ({ id, default_capacity }: { id: string; default_capacity: number }) => {
      const { error } = await supabase.from("ac_lanes").update({ default_capacity }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lanes"] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("ac_lanes").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lanes"] }),
  });

  const byPool = useMemo(() => {
    const m: Record<string, Lane[]> = {};
    (lanesQ.data ?? []).forEach((l) => { (m[l.pool_id] ||= []).push(l); });
    return m;
  }, [lanesQ.data]);

  return (
    <div className="space-y-6">
      <PoolsConfigSubNav />
      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Grid3x3 className="h-6 w-6 text-cyan-glow" />{lang === "ar" ? "الحارات" : "Lanes"}</h2>
          <p className="text-sm text-muted-foreground">{lang === "ar" ? "تعريف الحارات والسعة الافتراضية لكل مسبح" : "Lanes & default capacity per pool"}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />{lang === "ar" ? "حارة جديدة" : "New Lane"}</Button></DialogTrigger>
          <NewLaneDialog pools={poolsQ.data ?? []} onCreate={create.mutate} lang={lang} />
        </Dialog>
      </div>

      {(poolsQ.data ?? []).length === 0 && (
        <Card className="glass"><CardContent className="py-10 text-center text-muted-foreground">{lang === "ar" ? "أضف مسبحًا أولاً من قائمة المسابح" : "Add a pool first from the Pools page"}</CardContent></Card>
      )}

      <div className="space-y-6">
        {(poolsQ.data ?? []).map((p) => (
          <Card key={p.id} className="glass">
            <CardHeader><CardTitle className="text-base">{lang === "ar" ? (p.name_ar || p.name) : p.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {(byPool[p.id] ?? []).map((l) => {
                  const occ = occByLane[l.id];
                  const cap = occ?.capacity || l.default_capacity;
                  const used = occ?.occupied ?? 0;
                  return (
                    <div key={l.id} className={"rounded-xl border p-3 " + statusColor(used, cap)}>
                      <div className="flex items-center justify-between">
                        <div className="text-xs uppercase tracking-wider opacity-80">{lang === "ar" ? "حارة" : "Lane"}</div>
                        <button onClick={() => del.mutate(l.id)} className="opacity-50 hover:opacity-100"><Trash2 className="h-3 w-3" /></button>
                      </div>
                      <div className="text-2xl font-bold">{l.lane_number}</div>
                      <div className="text-xs mt-1">{used}/{cap}</div>
                      <div className="mt-2 flex items-center gap-1">
                        <Label className="text-[10px] opacity-70">Cap</Label>
                        <Input
                          type="number" min={1} defaultValue={l.default_capacity}
                          className="h-6 text-xs px-1"
                          onBlur={(e) => {
                            const v = Number(e.target.value);
                            if (v && v !== l.default_capacity) updateCap.mutate({ id: l.id, default_capacity: v });
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {(byPool[p.id] ?? []).length === 0 && (
                  <div className="col-span-full text-sm text-muted-foreground py-4">{lang === "ar" ? "لا توجد حارات" : "No lanes yet"}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2">{lang === "ar" ? "مفتاح الألوان" : "Legend"}</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-xs">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">{lang === "ar" ? "متاح" : "Available"}</Badge>
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">{lang === "ar" ? "تمتلئ" : "Filling"}</Badge>
          <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40">{lang === "ar" ? "ممتلئة" : "Full"}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}

function NewLaneDialog({ pools, onCreate, lang }: { pools: Pool[]; onCreate: (p: any) => void; lang: string }) {
  const [poolId, setPoolId] = useState<string>(pools[0]?.id ?? "");
  const [num, setNum] = useState(1);
  const [cap, setCap] = useState(5);
  const [name, setName] = useState("");
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{lang === "ar" ? "حارة جديدة" : "New Lane"}</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div><Label>{lang === "ar" ? "المسبح" : "Pool"}</Label>
          <Select value={poolId} onValueChange={setPoolId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{pools.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{lang === "ar" ? "رقم الحارة" : "Lane #"}</Label><Input type="number" min={1} value={num} onChange={(e) => setNum(Number(e.target.value))} /></div>
          <div><Label>{lang === "ar" ? "السعة" : "Default capacity"}</Label><Input type="number" min={1} value={cap} onChange={(e) => setCap(Number(e.target.value))} /></div>
        </div>
        <div><Label>{lang === "ar" ? "تسمية (اختياري)" : "Label (optional)"}</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      </div>
      <DialogFooter>
        <Button onClick={() => onCreate({ pool_id: poolId, lane_number: num, default_capacity: cap, name: name || null })} disabled={!poolId}>{lang === "ar" ? "حفظ" : "Save"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
