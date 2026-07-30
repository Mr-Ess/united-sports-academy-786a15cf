import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { getSiteSettings, saveSetting } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

const SECTIONS = [
  {
    key: "general",
    title: "بيانات عامة",
    fields: [
      { name: "site_name", label: "اسم الموقع (English)", ltr: true },
      { name: "site_name_ar", label: "اسم الموقع (عربي)" },
      { name: "tagline", label: "الشعار (English)", ltr: true },
      { name: "tagline_ar", label: "الشعار (عربي)" },
    ],
  },
  {
    key: "contact",
    title: "بيانات التواصل",
    fields: [
      { name: "email", label: "الإيميل", ltr: true },
      { name: "phone", label: "الهاتف", ltr: true },
      { name: "whatsapp", label: "واتساب", ltr: true },
      { name: "address", label: "العنوان" },
    ],
  },
  {
    key: "social",
    title: "السوشيال ميديا",
    fields: [
      { name: "instagram", label: "Instagram URL", ltr: true },
      { name: "facebook", label: "Facebook URL", ltr: true },
      { name: "twitter", label: "Twitter / X URL", ltr: true },
      { name: "youtube", label: "YouTube URL", ltr: true },
      { name: "tiktok", label: "TikTok URL", ltr: true },
    ],
  },
];

function SettingsPage() {
  const qc = useQueryClient();
  const load = useServerFn(getSiteSettings);
  const save = useServerFn(saveSetting);
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["site-settings"], queryFn: () => load() });

  const [values, setValues] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    const map: any = {};
    (rows as any[]).forEach((r) => { map[r.key] = r.value ?? {}; });
    setValues(map);
  }, [rows]);

  const saveMut = useMutation({
    mutationFn: (p: any) => save({ data: p }),
    onSuccess: () => {
      toast.success("تم الحفظ");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e: any) => toast.error(e.message ?? "فشل الحفظ"),
  });

  if (isLoading) {
    return <div className="text-center text-sm text-muted-foreground">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">إعدادات الموقع</h1>
        <p className="text-sm text-muted-foreground">البيانات دي تظهر في الموقع العام</p>
      </div>

      <div className="grid gap-6">
        {SECTIONS.map((section) => (
          <div key={section.key} className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-black">{section.title}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {section.fields.map((f) => (
                <div key={f.name} className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">{f.label}</Label>
                  <Input
                    dir={f.ltr ? "ltr" : "rtl"}
                    value={values[section.key]?.[f.name] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        [section.key]: { ...(v[section.key] ?? {}), [f.name]: e.target.value },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => saveMut.mutate({ key: section.key, value: values[section.key] ?? {} })}
                disabled={saveMut.isPending}
                className="gap-2 rounded-xl"
              >
                {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                حفظ
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
