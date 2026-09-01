import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Upload, Trash2, Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

type EntityType = "assessment" | "trainee" | "lead";
type Attachment = {
  id: string;
  branch_id: string;
  entity_type: EntityType;
  entity_id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  comment: string | null;
  created_at: string;
};

export function AttachmentsPanel({
  entityType,
  entityId,
  compact = false,
}: {
  entityType: EntityType;
  entityId: string;
  compact?: boolean;
}) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const { currentBranchId } = useSession();
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);

  const listQ = useQuery({
    queryKey: ["attachments", entityType, entityId],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ac_attachments")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Attachment[];
    },
  });

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!currentBranchId) {
      toast.error(isAr ? "اختر فرعًا أولًا" : "Select a branch first");
      return;
    }
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      for (const file of Array.from(files)) {
        const safe = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${currentBranchId}/${entityType}/${entityId}/${Date.now()}_${safe}`;
        const { error: upErr } = await supabase.storage.from("ac_attachments").upload(path, file, {
          contentType: file.type || undefined,
          upsert: false,
        });
        if (upErr) throw upErr;
        const { error: insErr } = await supabase.from("ac_attachments").insert({
          branch_id: currentBranchId,
          entity_type: entityType,
          entity_id: entityId,
          file_path: path,
          file_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
          comment: comment || null,
          uploaded_by: uid,
        } as any);
        if (insErr) throw insErr;
      }
      setComment("");
      if (fileInput.current) fileInput.current.value = "";
      qc.invalidateQueries({ queryKey: ["attachments", entityType, entityId] });
      toast.success(isAr ? "تم الرفع" : "Uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const download = async (a: Attachment) => {
    const { data, error } = await supabase.storage.from("ac_attachments").createSignedUrl(a.file_path, 300);
    if (error || !data?.signedUrl) {
      toast.error(error?.message || "Failed");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const del = useMutation({
    mutationFn: async (a: Attachment) => {
      await supabase.storage.from("ac_attachments").remove([a.file_path]);
      const { error } = await supabase.from("ac_attachments").delete().eq("id", a.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attachments", entityType, entityId] });
      toast.success(isAr ? "تم الحذف" : "Deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const editComment = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
      const { error } = await supabase.from("ac_attachments").update({ comment }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attachments", entityType, entityId] }),
  });

  const items = listQ.data ?? [];

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Paperclip className="h-3.5 w-3.5" />
        {isAr ? "المرفقات والتعليقات" : "Attachments & Comments"}
        <span className="text-cyan-glow">({items.length})</span>
      </div>

      <div className="rounded-lg border border-border/40 bg-background/30 p-2 space-y-2">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={isAr ? "تعليق (اختياري) يُطبَّق على الملفات المرفوعة الآن…" : "Comment (optional) — applied to the files uploaded now…"}
          className="min-h-[54px] text-xs"
        />
        <div className="flex items-center gap-2">
          <Input
            ref={fileInput}
            type="file"
            multiple
            onChange={(e) => upload(e.target.files)}
            disabled={uploading}
            className="text-xs"
          />
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-cyan-glow" />
          ) : (
            <Upload className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {isAr ? "يمكنك رفع أكثر من ملف (طبي، صوت، مستند…)" : "You can upload multiple files (medical, audio, docs…)"}
        </p>
      </div>

      {listQ.isLoading ? (
        <div className="text-xs text-muted-foreground">{isAr ? "جارٍ التحميل…" : "Loading…"}</div>
      ) : items.length === 0 ? (
        <div className="text-xs text-muted-foreground">{isAr ? "لا توجد مرفقات" : "No attachments yet"}</div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((a) => (
            <li key={a.id} className="rounded-md border border-border/40 bg-card/40 p-2 text-xs">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-cyan-glow shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{a.file_name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                    {a.size_bytes ? ` · ${Math.round(a.size_bytes / 1024)} KB` : ""}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => download(a)} title={isAr ? "تنزيل" : "Download"}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => del.mutate(a)} title={isAr ? "حذف" : "Delete"}>
                  <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                </Button>
              </div>
              <Input
                defaultValue={a.comment ?? ""}
                placeholder={isAr ? "تعليق…" : "Comment…"}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (v !== (a.comment ?? "")) editComment.mutate({ id: a.id, comment: v });
                }}
                className="mt-1.5 h-7 text-xs"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
