import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, KanbanSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/pipeline")({
  component: PipelinePage,
});

const STAGES = [
  { id: "new",       label: "استفسار جديد",       color: "bg-primary/10 text-primary" },
  { id: "contact",   label: "تم التواصل",          color: "bg-[oklch(0.78_0.19_55/0.15)] text-[oklch(0.78_0.19_55)]" },
  { id: "trial",     label: "موعد تجربة",         color: "bg-[oklch(0.65_0.26_15/0.15)] text-[oklch(0.65_0.26_15)]" },
  { id: "enrolled",  label: "مسجّل",               color: "bg-[oklch(0.82_0.2_150/0.15)] text-[oklch(0.82_0.2_150)]" },
  { id: "active",    label: "عضو نشط",             color: "bg-emerald-500/15 text-emerald-500" },
];

const SEED = [
  { id: "L1", name: "Aiden Chen",     sport: "Swim",       stage: "new" },
  { id: "L2", name: "Sofia Martins",  sport: "Basketball", stage: "contact" },
  { id: "L3", name: "Liam O'Connor",  sport: "Karate",     stage: "trial" },
  { id: "L4", name: "Priya Shah",     sport: "Fitness",    stage: "enrolled" },
  { id: "L5", name: "Noah Kim",       sport: "Volleyball", stage: "new" },
  { id: "L6", name: "Ella Rossi",     sport: "Swim",       stage: "contact" },
  { id: "L7", name: "Marcus Hall",    sport: "Basketball", stage: "active" },
  { id: "L8", name: "Layla Nassar",   sport: "Swim",       stage: "trial" },
  { id: "L9", name: "Omar Farouk",    sport: "Karate",     stage: "enrolled" },
];

function PipelinePage() {
  const [leads, setLeads] = useState(SEED);

  const move = (id: string, dir: -1 | 1) => {
    setLeads(list => list.map(l => {
      if (l.id !== id) return l;
      const idx = STAGES.findIndex(s => s.id === l.stage);
      const next = Math.max(0, Math.min(STAGES.length - 1, idx + dir));
      return { ...l, stage: STAGES[next].id };
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2"><KanbanSquare className="h-6 w-6 text-primary" /> خط التسجيل</h1>
        <p className="text-sm text-muted-foreground">حرّك المستفسر بين المراحل حتى يصبح عضواً نشطاً</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2">
        {STAGES.map(s => {
          const items = leads.filter(l => l.stage === s.id);
          return (
            <Card key={s.id} className="p-3">
              <div className="mb-3 flex items-center justify-between">
                <Badge className={s.color + " rounded-full"}>{s.label}</Badge>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map(l => (
                  <div key={l.id} className="rounded-xl border bg-background p-3">
                    <div className="text-sm font-black">{l.name}</div>
                    <div className="text-xs text-muted-foreground">{l.sport} · {l.id}</div>
                    <div className="mt-2 flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => move(l.id, -1)} disabled={s.id === STAGES[0].id}><ChevronRight className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => move(l.id, 1)} disabled={s.id === STAGES[STAGES.length - 1].id}><ChevronLeft className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div className="grid h-24 place-items-center text-xs text-muted-foreground">فارغ</div>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
