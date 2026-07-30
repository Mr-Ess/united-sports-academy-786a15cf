import { Building2, ChevronDown } from "lucide-react";
import { useBranch } from "@/lib/branch-context";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function BranchContextBar() {
  const { branches, currentBranch, setCurrentBranchId } = useBranch();
  return (
    <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3">
      <div className="flex items-center gap-2 text-sm">
        <Building2 className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground">الفرع النشط:</span>
        <span className="font-black">
          {currentBranch?.name_ar ?? currentBranch?.name ?? "لم يُختر"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-[10px]">{branches.length} فرع</Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              تبديل الفرع <ChevronDown className="mr-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {branches.map((b) => (
              <DropdownMenuItem key={b.id} onClick={() => setCurrentBranchId(b.id)}>
                {b.name_ar || b.name}
              </DropdownMenuItem>
            ))}
            {branches.length === 0 && (
              <DropdownMenuItem disabled>مافيش فروع متاحة</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
