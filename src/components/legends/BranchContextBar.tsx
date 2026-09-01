import { Building2, AlertTriangle, ChevronsUpDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

/**
 * Persistent branch context bar shown on every authenticated page.
 * - Always visible so users see which branch every new record belongs to.
 * - Inline switcher so they can change the target branch before adding/editing.
 */
export function BranchContextBar() {
  const { branches, currentBranchId, setCurrentBranchId, isSuperAdmin } = useSession();
  const { lang } = useI18n();

  // No branches at all → blocking warning
  if (!branches.length) {
    return (
      <div className="mx-4 mt-3 lg:mx-8 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {lang === "ar"
              ? "لا توجد فروع متاحة. كل سجل يجب أن يتبع فرعًا — أضف فرعًا أولًا."
              : "No branches available. Every record must belong to a branch — add one first."}
          </span>
        </div>
        {isSuperAdmin && (
          <Button asChild size="sm" variant="destructive">
            <Link to="/admin/academy/branches">{lang === "ar" ? "إدارة الفروع" : "Manage branches"}</Link>
          </Button>
        )}
      </div>
    );
  }

  const selectValue = currentBranchId ?? branches[0].id;
  const current = branches.find((b) => b.id === selectValue) ?? branches[0];
  const currentName = current ? (lang === "ar" ? current.name_ar || current.name : current.name) : "—";

  return (
    <div className="mx-4 mt-3 lg:mx-8 rounded-xl border border-teal/30 bg-gradient-to-r from-teal/10 via-background/40 to-cyan-glow/5 px-3 py-2 flex flex-wrap items-center gap-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 min-w-0">
        <div className="rounded-md bg-teal/20 p-1.5 ring-1 ring-teal/40 shrink-0">
          <Building2 className="h-3.5 w-3.5 text-cyan-glow" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">
            {lang === "ar" ? "تعمل حاليًا في الفرع" : "Currently working in branch"}
          </div>
          <div className="text-sm font-semibold text-foreground truncate">{currentName}</div>
        </div>
      </div>

      <div className="ms-auto flex items-center gap-2">
        <span className="hidden md:inline text-[11px] text-muted-foreground">
          {lang === "ar"
            ? "كل سجل جديد سيتم ربطه بهذا الفرع"
            : "Every new record will be linked to this branch"}
        </span>
        <Select value={selectValue} onValueChange={setCurrentBranchId}>
          <SelectTrigger className="h-8 text-xs gap-1.5 min-w-[160px] bg-background/50 border-teal/40">
            <ChevronsUpDown className="h-3.5 w-3.5 text-cyan-glow shrink-0" />
            <SelectValue placeholder={lang === "ar" ? "اختر الفرع" : "Select branch"} />
          </SelectTrigger>
          <SelectContent>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {lang === "ar" ? b.name_ar || b.name : b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
