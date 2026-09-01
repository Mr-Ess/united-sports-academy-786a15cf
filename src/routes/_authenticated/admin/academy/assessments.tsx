import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Plus, Trash2, GraduationCap, Pencil, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { AttachmentsPanel } from "@/components/legends/AttachmentsPanel";

export const Route = createFileRoute("/_authenticated/admin/academy/assessments")({
  head: () => ({ meta: [{ title: "Assessments · United Sports Academy" }] }),
  component: AssessmentsPage 
});

type SkillLevel = { id: string; branch_id: string | null; code: string; name: string; name_ar: string | null; rank: number; description: string | null };
type Assessment = {
  id: string; branch_id: string; trainee_id: string; coach_id: string | null; skill_level_id: string | null;
  assessment_date: string; technique_score: number | null; endurance_score: number | null; speed_score: number | null;
  overall_score: number | null; passed: boolean | null; notes: string | null;
};

function AssessmentsPage() {
  const { lang } = useI18n();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Award className="h-6 w-6 text-cyan-glow" />
          {lang === "ar" ? "التقييمات" : "Assessments"}
        </h2>
        <p className="text-sm text-muted-foreground">{lang === "ar" ? "مستويات المهارة وتقييمات المتدربين" : "Skill levels & trainee evaluations"}</p>
      </div>
      <Tabs defaultValue="evaluations">
        <TabsList>
          <TabsTrigger value="evaluations"><GraduationCap className="h-4 w-4 mr-1.5" />{lang === "ar" ? "التقييمات" : "Evaluations"}</TabsTrigger>
          <TabsTrigger value="levels"><Award className="h-4 w-4 mr-1.5" />{lang === "ar" ? "المستويات" : "Skill Levels"}</TabsTrigger>
        </TabsList>
        <TabsContent value="evaluations" className="mt-4"><EvaluationsTab /></TabsContent>
        <TabsContent value="levels" className="mt-4"><LevelsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function LevelsTab() {
  const { currentBranchId } = useSession();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<SkillLevel | null>(null);
  const [open, setOpen] = useState(false);

  const { data: levels = [] } = useQuery({
    queryKey: ["skill_levels", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_skill_levels").select("*")
        .or(`branch_id.eq.${currentBranchId},branch_id.is.null`).order("rank");
      if (error) throw error; return data as SkillLevel[];
    },
  });

  const save = useMutation({
    mutationFn: async (p: Partial<SkillLevel>) => {
      if (p.id) { const { error } = await supabase.from("ac_skill_levels").update(p).eq("id", p.id); if (error) throw error; }
      else { const { error } = await supabase.from("ac_skill_levels").insert({ ...p, branch_id: currentBranchId } as any); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skill_levels"] }); setOpen(false); setEditing(null); toast.success(lang === "ar" ? "تم الحفظ" : "Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("ac_skill_levels").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skill_levels"] }); toast.success(lang === "ar" ? "تم الحذف" : "Deleted"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button onClick={() => setEditing(null)}><Plus className="h-4 w-4 mr-1.5" />{lang === "ar" ? "مستوى جديد" : "New Level"}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? (lang === "ar" ? "تعديل مستوى" : "Edit Level") : (lang === "ar" ? "مستوى مهارة جديد" : "New Skill Level")}</DialogTitle></DialogHeader>
            <LevelForm editing={editing} onSave={(p) => save.mutate(p)} lang={lang} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {levels.map((l) => (
          <Card key={l.id} className="glass">
            <CardContent className="pt-5 space-y-2">
              <div className="flex items-start justify-between">
                <div><div className="text-[10px] uppercase text-cyan-glow">#{l.rank} · {l.code}</div><div className="font-semibold">{lang === "ar" ? (l.name_ar || l.name) : l.name}</div></div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(l); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="outline" onClick={() => del.mutate(l.id)}><Trash2 className="h-3 w-3 text-rose-400" /></Button>
                </div>
              </div>
              {l.description && <p className="text-xs text-muted-foreground">{l.description}</p>}
            </CardContent>
          </Card>
        ))}
        {levels.length === 0 && <Card className="glass col-span-full"><CardContent className="py-10 text-center text-muted-foreground">{lang === "ar" ? "لا توجد مستويات" : "No levels yet"}</CardContent></Card>}
      </div>
    </div>
  );
}

function LevelForm({ editing, onSave, lang }: { editing: SkillLevel | null; onSave: (p: any) => void; lang: string }) {
  const [form, setForm] = useState<any>(editing ?? { code: "", name: "", name_ar: "", rank: 0, description: "" });
  return (
    <>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{lang === "ar" ? "الكود" : "Code"}</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "الترتيب" : "Rank"}</Label><Input type="number" value={form.rank} onChange={(e) => setForm({ ...form, rank: Number(e.target.value) })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{lang === "ar" ? "الاسم" : "Name"}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>{lang === "ar" ? "بالعربية" : "Name (AR)"}</Label><Input value={form.name_ar ?? ""} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
        </div>
        <div><Label>{lang === "ar" ? "الوصف" : "Description"}</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      </div>
      <DialogFooter><Button onClick={() => onSave({ id: editing?.id, code: form.code, name: form.name, name_ar: form.name_ar || null, rank: Number(form.rank || 0), description: form.description || null })}>{lang === "ar" ? "حفظ" : "Save"}</Button></DialogFooter>
    </>
  );
}

function EvaluationsTab() {
  const { currentBranchId } = useSession();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: items = [] } = useQuery({
    queryKey: ["assessments", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_assessments").select("*").eq("branch_id", currentBranchId!).order("assessment_date", { ascending: false });
      if (error) throw error; return data as Assessment[];
    },
  });
  const { data: trainees = [] } = useQuery({
    queryKey: ["trainees_sel", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data } = await supabase.from("ac_trainees").select("id,full_name,client_code").eq("branch_id", currentBranchId!);
      return (data ?? []) as { id: string; full_name: string; client_code: string }[];
    },
  });
  const { data: coaches = [] } = useQuery({
    queryKey: ["coaches_sel", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data } = await supabase.from("ac_employees").select("id,full_name").eq("branch_id", currentBranchId!);
      return (data ?? []) as { id: string; full_name: string }[];
    },
  });
  const { data: levels = [] } = useQuery({
    queryKey: ["levels_sel", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data } = await supabase.from("ac_skill_levels").select("id,code,name,name_ar,rank").or(`branch_id.eq.${currentBranchId},branch_id.is.null`).order("rank");
      return (data ?? []) as { id: string; code: string; name: string; name_ar: string | null; rank: number }[];
    },
  });

  const save = useMutation({
    mutationFn: async (p: any) => {
      const { error } = await supabase.from("ac_assessments").insert({ ...p, branch_id: currentBranchId } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assessments"] }); setOpen(false); toast.success(lang === "ar" ? "تم الحفظ" : "Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("ac_assessments").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assessments"] }); toast.success(lang === "ar" ? "تم الحذف" : "Deleted"); },
  });

  const traineeMap = useMemo(() => Object.fromEntries(trainees.map((t) => [t.id, t])), [trainees]);
  const coachMap = useMemo(() => Object.fromEntries(coaches.map((c) => [c.id, c])), [coaches]);
  const levelMap = useMemo(() => Object.fromEntries(levels.map((l) => [l.id, l])), [levels]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />{lang === "ar" ? "تقييم جديد" : "New Evaluation"}</Button></DialogTrigger>
          <EvalDialog trainees={trainees} coaches={coaches} levels={levels} onSave={(p) => save.mutate(p)} lang={lang} />
        </Dialog>
      </div>
      <Card className="glass">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase text-muted-foreground">
              <tr><th className="px-3 py-2 text-left">{lang === "ar" ? "التاريخ" : "Date"}</th><th className="px-3 py-2">{lang === "ar" ? "المتدرب" : "Trainee"}</th><th className="px-3 py-2">{lang === "ar" ? "المدرب" : "Coach"}</th><th className="px-3 py-2">{lang === "ar" ? "المستوى" : "Level"}</th><th className="px-3 py-2">T</th><th className="px-3 py-2">E</th><th className="px-3 py-2">S</th><th className="px-3 py-2">{lang === "ar" ? "الكلي" : "Overall"}</th><th className="px-3 py-2">{lang === "ar" ? "نجح" : "Pass"}</th><th></th><th></th></tr>
            </thead>
            <tbody>
              {items.map((a) => {
                const tr = traineeMap[a.trainee_id];
                const co = a.coach_id ? coachMap[a.coach_id] : null;
                const lv = a.skill_level_id ? levelMap[a.skill_level_id] : null;
                const isOpen = expanded === a.id;
                return (
                  <Fragment key={a.id}>
                  <tr className="border-t border-border/40">
                    <td className="px-3 py-2 text-muted-foreground">{a.assessment_date}</td>
                    <td className="px-3 py-2"><div className="font-medium">{tr?.full_name || "—"}</div><div className="text-[10px] text-muted-foreground font-mono">{tr?.client_code}</div></td>
                    <td className="px-3 py-2 text-muted-foreground">{co?.full_name || "—"}</td>
                    <td className="px-3 py-2"><Badge variant="outline" className="border-cyan-500/40 text-cyan-300 bg-cyan-500/10">{lv ? (lang === "ar" ? (lv.name_ar || lv.name) : lv.name) : "—"}</Badge></td>
                    <td className="px-3 py-2 text-center">{a.technique_score ?? "—"}</td>
                    <td className="px-3 py-2 text-center">{a.endurance_score ?? "—"}</td>
                    <td className="px-3 py-2 text-center">{a.speed_score ?? "—"}</td>
                    <td className="px-3 py-2 text-center font-semibold text-cyan-glow">{a.overall_score ?? "—"}</td>
                    <td className="px-3 py-2 text-center">{a.passed ? "✅" : "—"}</td>
                    <td className="px-3 py-2"><Button size="sm" variant="ghost" onClick={() => setExpanded(isOpen ? null : a.id)} title={lang === "ar" ? "المرفقات" : "Attachments"}><Paperclip className={`h-3.5 w-3.5 ${isOpen ? "text-cyan-glow" : ""}`} /></Button></td>
                    <td className="px-3 py-2"><Button size="sm" variant="ghost" onClick={() => del.mutate(a.id)}><Trash2 className="h-3 w-3 text-rose-400" /></Button></td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-background/30 border-t border-border/30">
                      <td colSpan={11} className="p-4">
                        {a.notes && <div className="mb-3 text-xs text-muted-foreground italic">"{a.notes}"</div>}
                        <AttachmentsPanel entityType="assessment" entityId={a.id} />
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}
              {items.length === 0 && <tr><td colSpan={11} className="py-10 text-center text-muted-foreground">{lang === "ar" ? "لا توجد تقييمات" : "No assessments yet"}</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function EvalDialog({ trainees, coaches, levels, onSave, lang }: { trainees: any[]; coaches: any[]; levels: any[]; onSave: (p: any) => void; lang: string }) {
  const [form, setForm] = useState<any>({
    trainee_id: "", coach_id: "", skill_level_id: "",
    assessment_date: new Date().toISOString().slice(0, 10),
    technique_score: 7, endurance_score: 7, speed_score: 7, overall_score: 7, passed: false, notes: "",
  });
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{lang === "ar" ? "تقييم متدرب" : "Trainee Evaluation"}</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{lang === "ar" ? "المتدرب" : "Trainee"}</Label>
            <Select value={form.trainee_id} onValueChange={(v) => setForm({ ...form, trainee_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{trainees.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name} ({t.client_code})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{lang === "ar" ? "المدرب" : "Coach"}</Label>
            <Select value={form.coach_id} onValueChange={(v) => setForm({ ...form, coach_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{coaches.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{lang === "ar" ? "المستوى" : "Skill Level"}</Label>
            <Select value={form.skill_level_id} onValueChange={(v) => setForm({ ...form, skill_level_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{levels.map((l) => <SelectItem key={l.id} value={l.id}>{lang === "ar" ? (l.name_ar || l.name) : l.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{lang === "ar" ? "التاريخ" : "Date"}</Label><Input type="date" value={form.assessment_date} onChange={(e) => setForm({ ...form, assessment_date: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div><Label className="text-xs">{lang === "ar" ? "الأسلوب" : "Technique"}</Label><Input type="number" min={0} max={10} step="0.5" value={form.technique_score} onChange={(e) => setForm({ ...form, technique_score: Number(e.target.value) })} /></div>
          <div><Label className="text-xs">{lang === "ar" ? "التحمل" : "Endurance"}</Label><Input type="number" min={0} max={10} step="0.5" value={form.endurance_score} onChange={(e) => setForm({ ...form, endurance_score: Number(e.target.value) })} /></div>
          <div><Label className="text-xs">{lang === "ar" ? "السرعة" : "Speed"}</Label><Input type="number" min={0} max={10} step="0.5" value={form.speed_score} onChange={(e) => setForm({ ...form, speed_score: Number(e.target.value) })} /></div>
          <div><Label className="text-xs">{lang === "ar" ? "الكلي" : "Overall"}</Label><Input type="number" min={0} max={10} step="0.5" value={form.overall_score} onChange={(e) => setForm({ ...form, overall_score: Number(e.target.value) })} /></div>
        </div>
        <div className="flex items-center gap-2"><input id="passed" type="checkbox" checked={form.passed} onChange={(e) => setForm({ ...form, passed: e.target.checked })} /><Label htmlFor="passed">{lang === "ar" ? "اجتاز التقييم" : "Passed assessment"}</Label></div>
        <div><Label>{lang === "ar" ? "ملاحظات" : "Notes"}</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter><Button disabled={!form.trainee_id} onClick={() => onSave({
        trainee_id: form.trainee_id, coach_id: form.coach_id || null, skill_level_id: form.skill_level_id || null,
        assessment_date: form.assessment_date,
        technique_score: form.technique_score, endurance_score: form.endurance_score,
        speed_score: form.speed_score, overall_score: form.overall_score,
        passed: form.passed, notes: form.notes || null,
      })}>{lang === "ar" ? "حفظ" : "Save"}</Button></DialogFooter>
    </DialogContent>
  );
}
