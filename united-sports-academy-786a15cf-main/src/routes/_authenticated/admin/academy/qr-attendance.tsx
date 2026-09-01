import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { QrCode, ScanLine, UserCheck, Clock, LogIn, LogOut as LogOutIcon } from "lucide-react";
import { genCode } from "@/lib/legends/phase2-helpers";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/academy/qr-attendance")({
  head: () => ({ meta: [{ title: "QR Attendance · United Sports Academy" }] }),
  component: QRAttendancePage,
});

type Trainee = { id: string; client_code: string; full_name: string; phone: string | null };
type Att = { id: string; trainee_id: string; check_in_at: string; status: string; method: string; schedule_slot_id: string | null };
type Slot = { id: string; lane_id: string; coach_id: string | null };
type Employee = { id: string; employee_code: string; full_name: string; full_name_ar: string | null; department: string | null; title: string | null };
type EmpAtt = { id: string; employee_id: string; work_date: string; clock_in: string | null; clock_out: string | null; hours_worked: number | null; status: string };

function QRAttendancePage() {
  const { lang, t } = useI18n();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><QrCode className="h-6 w-6 text-cyan-glow" />{lang === "ar" ? "حضور QR" : "QR Attendance"}</h2>
        <p className="text-sm text-muted-foreground">{lang === "ar" ? "حضور المتدربين والموظفين عبر QR أو يدويًا" : "Trainee & employee attendance — QR or manual"}</p>
      </div>
      <Tabs defaultValue="trainee">
        <TabsList className="glass">
          <TabsTrigger value="trainee">{t("qr.mode.trainee")}</TabsTrigger>
          <TabsTrigger value="employee">{t("qr.mode.employee")}</TabsTrigger>
        </TabsList>
        <TabsContent value="trainee" className="mt-4"><TraineeMode /></TabsContent>
        <TabsContent value="employee" className="mt-4"><EmployeeMode /></TabsContent>
      </Tabs>
    </div>
  );
}

function TraineeMode() {
  const { currentBranchId } = useSession();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [scanInput, setScanInput] = useState("");
  const [selectedTrainee, setSelectedTrainee] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrTrainee, setQrTrainee] = useState<string>("");

  const trQ = useQuery({
    queryKey: ["trainees-att", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_trainees").select("id,client_code,full_name,phone")
        .eq("branch_id", currentBranchId!).is("deleted_at", null).order("full_name");
      if (error) throw error;
      return data as Trainee[];
    },
  });
  const slotsQ = useQuery({
    queryKey: ["sched-slots-att", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_schedule_slots").select("id,lane_id,coach_id")
        .eq("branch_id", currentBranchId!).eq("active", true);
      if (error) throw error;
      return data as Slot[];
    },
  });
  const attQ = useQuery({
    queryKey: ["attendance-today", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const { data, error } = await supabase.from("ac_attendance").select("id,trainee_id,check_in_at,status,method,schedule_slot_id")
        .eq("branch_id", currentBranchId!).gte("check_in_at", startOfDay.toISOString())
        .order("check_in_at", { ascending: false });
      if (error) throw error;
      return data as Att[];
    },
  });

  const trMap = useMemo(() => Object.fromEntries((trQ.data ?? []).map((t) => [t.id, t])), [trQ.data]);
  const trByCode = useMemo(() => Object.fromEntries((trQ.data ?? []).map((t) => [t.client_code, t])), [trQ.data]);

  const checkIn = useMutation({
    mutationFn: async ({ trainee_id, method }: { trainee_id: string; method: "manual" | "qr" }) => {
      const { data: subs } = await supabase.from("ac_subscriptions").select("id,total_sessions,used_sessions")
        .eq("trainee_id", trainee_id).eq("status", "active").order("created_at", { ascending: false }).limit(1);
      const sub = subs?.[0];
      const { error } = await supabase.from("ac_attendance").insert({
        branch_id: currentBranchId, trainee_id, method,
        subscription_id: sub?.id ?? null,
        schedule_slot_id: slotId || null,
        status: "checked_in",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-today"] });
      qc.invalidateQueries({ queryKey: ["subs"] });
      qc.invalidateQueries({ queryKey: ["lane_occupancy"] });
      toast.success(lang === "ar" ? "تم تسجيل الحضور" : "Checked in");
      setScanInput(""); setSelectedTrainee(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  useEffect(() => {
    if (!qrTrainee) { setQrDataUrl(""); return; }
    const t = trMap[qrTrainee]; if (!t) return;
    const token = genCode("QR");
    const payload = JSON.stringify({ type: "trainee", code: t.client_code, token });
    QRCode.toDataURL(payload, { width: 256, margin: 1, color: { dark: "#0B192C", light: "#E0FCFFFF" } })
      .then(setQrDataUrl).catch(() => setQrDataUrl(""));
  }, [qrTrainee, trMap]);

  const handleScan = (raw: string) => {
    const txt = raw.trim();
    if (!txt) return;
    let code = txt;
    try { const p = JSON.parse(txt); if (p?.code) code = p.code; } catch {}
    const tr = trByCode[code];
    if (!tr) return toast.error(lang === "ar" ? "كود غير معروف" : "Unknown code");
    checkIn.mutate({ trainee_id: tr.id, method: "qr" });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ScanLine className="h-4 w-4" />{lang === "ar" ? "مسح / إدخال" : "Scan / Enter"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{lang === "ar" ? "كود العميل (CL-XXXXXX)" : "Client code (CL-XXXXXX)"}</Label>
              <div className="flex gap-2">
                <Input autoFocus value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleScan(scanInput); }}
                  placeholder="CL-XXXXXX" />
                <Button onClick={() => handleScan(scanInput)}><UserCheck className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <Label>{lang === "ar" ? "تسجيل يدوي" : "Manual check-in"}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={selectedTrainee ?? ""} onValueChange={setSelectedTrainee}>
                  <SelectTrigger><SelectValue placeholder={lang === "ar" ? "اختر متدرب" : "Choose trainee"} /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {(trQ.data ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name} · {t.client_code}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={slotId || "none"} onValueChange={(v) => setSlotId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder={lang === "ar" ? "جلسة (اختياري)" : "Slot (optional)"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {(slotsQ.data ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.id.slice(0, 8)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button className="mt-2 w-full" disabled={!selectedTrainee} onClick={() => selectedTrainee && checkIn.mutate({ trainee_id: selectedTrainee, method: "manual" })}>
                {lang === "ar" ? "تسجيل حضور" : "Check in"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><QrCode className="h-4 w-4" />{lang === "ar" ? "إنشاء QR للمتدرب" : "Generate QR for trainee"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={qrTrainee} onValueChange={setQrTrainee}>
              <SelectTrigger><SelectValue placeholder={lang === "ar" ? "اختر متدرب" : "Choose trainee"} /></SelectTrigger>
              <SelectContent className="max-h-72">
                {(trQ.data ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name} · {t.client_code}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center justify-center min-h-[260px] bg-white/5 rounded-lg p-4">
              {qrDataUrl ? <img src={qrDataUrl} alt="QR" className="rounded-md" /> : <span className="text-muted-foreground text-sm">{lang === "ar" ? "اختر متدربًا لتوليد QR" : "Choose a trainee to generate QR"}</span>}
            </div>
            {qrDataUrl && qrTrainee && (
              <a href={qrDataUrl} download={`qr-${trMap[qrTrainee]?.client_code}.png`} className="block text-center text-xs text-cyan-glow hover:underline">
                {lang === "ar" ? "تحميل QR" : "Download QR"}
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />{lang === "ar" ? "حضور اليوم" : "Today's check-ins"} <Badge variant="outline">{(attQ.data ?? []).length}</Badge></CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-start py-2 px-2">{lang === "ar" ? "الوقت" : "Time"}</th>
                <th className="text-start py-2 px-2">{lang === "ar" ? "المتدرب" : "Trainee"}</th>
                <th className="text-start py-2 px-2">{lang === "ar" ? "كود" : "Code"}</th>
                <th className="text-start py-2 px-2">{lang === "ar" ? "الطريقة" : "Method"}</th>
                <th className="text-start py-2 px-2">{lang === "ar" ? "الحالة" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              {(attQ.data ?? []).map((a) => {
                const t = trMap[a.trainee_id];
                return (
                  <tr key={a.id} className="border-b border-border/40">
                    <td className="py-2 px-2 text-xs">{new Date(a.check_in_at).toLocaleTimeString()}</td>
                    <td className="py-2 px-2">{t?.full_name ?? "—"}</td>
                    <td className="py-2 px-2 text-xs text-cyan-glow">{t?.client_code}</td>
                    <td className="py-2 px-2"><Badge variant="outline">{a.method}</Badge></td>
                    <td className="py-2 px-2"><Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">{a.status}</Badge></td>
                  </tr>
                );
              })}
              {(attQ.data ?? []).length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">{lang === "ar" ? "لا يوجد حضور اليوم" : "No check-ins yet today"}</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function EmployeeMode() {
  const { currentBranchId } = useSession();
  const { lang, t } = useI18n();
  const qc = useQueryClient();
  const [scanInput, setScanInput] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<string>("");
  const [qrEmp, setQrEmp] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const empQ = useQuery({
    queryKey: ["emp-att", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_employees")
        .select("id,employee_code,full_name,full_name_ar,department,title")
        .eq("branch_id", currentBranchId!).eq("status", "active").order("full_name");
      if (error) throw error;
      return data as Employee[];
    },
  });

  const attQ = useQuery({
    queryKey: ["emp-att-today", currentBranchId, todayStr],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_employee_attendance")
        .select("id,employee_id,work_date,clock_in,clock_out,hours_worked,status")
        .eq("branch_id", currentBranchId!).eq("work_date", todayStr)
        .order("clock_in", { ascending: false });
      if (error) throw error;
      return data as EmpAtt[];
    },
  });

  const empMap = useMemo(() => Object.fromEntries((empQ.data ?? []).map((e) => [e.id, e])), [empQ.data]);
  const empByCode = useMemo(() => Object.fromEntries((empQ.data ?? []).map((e) => [e.employee_code, e])), [empQ.data]);
  const todayByEmp = useMemo(() => Object.fromEntries((attQ.data ?? []).map((a) => [a.employee_id, a])), [attQ.data]);

  const clockIn = useMutation({
    mutationFn: async (employee_id: string) => {
      const existing = todayByEmp[employee_id];
      if (existing && existing.clock_in) throw new Error(t("qr.alreadyToday"));
      const now = new Date().toISOString();
      if (existing) {
        const { error } = await supabase.from("ac_employee_attendance").update({ clock_in: now, status: "present" }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ac_employee_attendance").insert({
          branch_id: currentBranchId, employee_id, work_date: todayStr, clock_in: now, status: "present",
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["emp-att-today"] }); toast.success(t("qr.clockedIn")); setScanInput(""); setSelectedEmp(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const clockOut = useMutation({
    mutationFn: async (employee_id: string) => {
      const existing = todayByEmp[employee_id];
      if (!existing || !existing.clock_in) throw new Error(t("qr.notClockedIn"));
      const now = new Date();
      const inTs = new Date(existing.clock_in);
      const hours = Math.max(0, Math.round(((now.getTime() - inTs.getTime()) / 3600000) * 100) / 100);
      const { error } = await supabase.from("ac_employee_attendance")
        .update({ clock_out: now.toISOString(), hours_worked: hours }).eq("id", existing.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["emp-att-today"] }); toast.success(t("qr.clockedOut")); setScanInput(""); setSelectedEmp(""); },
    onError: (e: any) => toast.error(e.message),
  });

  useEffect(() => {
    if (!qrEmp) { setQrDataUrl(""); return; }
    const e = empMap[qrEmp]; if (!e) return;
    const payload = JSON.stringify({ type: "employee", code: e.employee_code, token: genCode("EQR") });
    QRCode.toDataURL(payload, { width: 256, margin: 1, color: { dark: "#0B192C", light: "#E0FCFFFF" } })
      .then(setQrDataUrl).catch(() => setQrDataUrl(""));
  }, [qrEmp, empMap]);

  const handleScan = (raw: string, action: "in" | "out") => {
    const txt = raw.trim(); if (!txt) return;
    let code = txt;
    try { const p = JSON.parse(txt); if (p?.code) code = p.code; } catch {}
    const e = empByCode[code];
    if (!e) return toast.error(t("qr.unknownEmp"));
    (action === "in" ? clockIn : clockOut).mutate(e.id);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ScanLine className="h-4 w-4" />{lang === "ar" ? "مسح / إدخال" : "Scan / Enter"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t("qr.employeeCode")}</Label>
              <div className="flex gap-2">
                <Input value={scanInput} onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleScan(scanInput, "in"); }}
                  placeholder="EMP-XXXX" />
                <Button onClick={() => handleScan(scanInput, "in")} className="gap-1"><LogIn className="h-4 w-4" />{t("qr.clockIn")}</Button>
                <Button variant="outline" onClick={() => handleScan(scanInput, "out")} className="gap-1"><LogOutIcon className="h-4 w-4" />{t("qr.clockOut")}</Button>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <Label>{lang === "ar" ? "تسجيل يدوي" : "Manual"}</Label>
              <Select value={selectedEmp} onValueChange={setSelectedEmp}>
                <SelectTrigger><SelectValue placeholder={t("qr.employeeChoose")} /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {(empQ.data ?? []).map((e) => <SelectItem key={e.id} value={e.id}>{(lang === "ar" && e.full_name_ar) || e.full_name} · {e.employee_code}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button disabled={!selectedEmp} onClick={() => clockIn.mutate(selectedEmp)} className="gap-1"><LogIn className="h-4 w-4" />{t("qr.clockIn")}</Button>
                <Button disabled={!selectedEmp} variant="outline" onClick={() => clockOut.mutate(selectedEmp)} className="gap-1"><LogOutIcon className="h-4 w-4" />{t("qr.clockOut")}</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><QrCode className="h-4 w-4" />{t("qr.empGenerate")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={qrEmp} onValueChange={setQrEmp}>
              <SelectTrigger><SelectValue placeholder={t("qr.employeeChoose")} /></SelectTrigger>
              <SelectContent className="max-h-72">
                {(empQ.data ?? []).map((e) => <SelectItem key={e.id} value={e.id}>{(lang === "ar" && e.full_name_ar) || e.full_name} · {e.employee_code}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center justify-center min-h-[260px] bg-white/5 rounded-lg p-4">
              {qrDataUrl ? <img src={qrDataUrl} alt="QR" className="rounded-md" /> : <span className="text-muted-foreground text-sm">{t("qr.employeeChoose")}</span>}
            </div>
            {qrDataUrl && qrEmp && (
              <a href={qrDataUrl} download={`qr-${empMap[qrEmp]?.employee_code}.png`} className="block text-center text-xs text-cyan-glow hover:underline">
                {lang === "ar" ? "تحميل QR" : "Download QR"}
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />{lang === "ar" ? "حضور الموظفين اليوم" : "Today's employee attendance"} <Badge variant="outline">{(attQ.data ?? []).length}</Badge></CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-start py-2 px-2">{lang === "ar" ? "الموظف" : "Employee"}</th>
                <th className="text-start py-2 px-2">{lang === "ar" ? "الكود" : "Code"}</th>
                <th className="text-start py-2 px-2">{lang === "ar" ? "القسم" : "Department"}</th>
                <th className="text-start py-2 px-2">{lang === "ar" ? "دخول" : "Clock In"}</th>
                <th className="text-start py-2 px-2">{lang === "ar" ? "خروج" : "Clock Out"}</th>
                <th className="text-start py-2 px-2">{lang === "ar" ? "ساعات" : "Hours"}</th>
              </tr>
            </thead>
            <tbody>
              {(attQ.data ?? []).map((a) => {
                const e = empMap[a.employee_id];
                return (
                  <tr key={a.id} className="border-b border-border/40">
                    <td className="py-2 px-2">{(lang === "ar" && e?.full_name_ar) || e?.full_name || "—"}</td>
                    <td className="py-2 px-2 text-xs text-cyan-glow">{e?.employee_code}</td>
                    <td className="py-2 px-2 text-xs">{e?.department ?? "—"}</td>
                    <td className="py-2 px-2 text-xs">{a.clock_in ? new Date(a.clock_in).toLocaleTimeString() : "—"}</td>
                    <td className="py-2 px-2 text-xs">{a.clock_out ? new Date(a.clock_out).toLocaleTimeString() : "—"}</td>
                    <td className="py-2 px-2 text-xs">{a.hours_worked ?? "—"}</td>
                  </tr>
                );
              })}
              {(attQ.data ?? []).length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">{lang === "ar" ? "لا توجد سجلات اليوم" : "No records today"}</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
