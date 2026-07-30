import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { CalendarRange, Plus, Tag, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/seasons")({
  component: SeasonsPage,
});

const SEED = [
  { id: "s1", name: "Summer Academy 2026",     season: "Summer", ages: "6-16", price: 899, earlyBird: 699, seats: 200, booked: 132, active: true },
  { id: "s2", name: "Winter Swim Clinic",      season: "Winter", ages: "3-12", price: 449, earlyBird: 349, seats: 80,  booked: 68,  active: true },
  { id: "s3", name: "Spring Athletic Camp",    season: "Spring", ages: "8-18", price: 649, earlyBird: 499, seats: 120, booked: 42,  active: true },
  { id: "s4", name: "Autumn League — Basketball", season: "Autumn", ages: "13-17", price: 799, earlyBird: 599, seats: 60, booked: 60, active: false },
];

function SeasonsPage() {
  const [items, setItems] = useState(SEED);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2"><CalendarRange className="h-6 w-6 text-primary" /> المواسم والبرامج</h1>
          <p className="text-sm text-muted-foreground">أنشئ برامج موسمية بأسعار مبكرة وعدّاد للأماكن المتاحة</p>
        </div>
        <Button onClick={() => toast.info("Mock: أضف موسم جديد")}><Plus className="ml-2 h-4 w-4" /> برنامج جديد</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        {items.map(p => {
          const pct = Math.round((p.booked / p.seats) * 100);
          const soldOut = p.booked >= p.seats;
          return (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="secondary" className="mb-2 rounded-full text-[10px] uppercase">{p.season}</Badge>
                  <div className="text-lg font-black">{p.name}</div>
                  <div className="text-xs text-muted-foreground">الأعمار: {p.ages}</div>
                </div>
                <Switch checked={p.active} onCheckedChange={(v) => setItems(list => list.map(x => x.id === p.id ? { ...x, active: v } : x))} />
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Tag className="h-4 w-4 text-primary" />
                <div>
                  <span className="text-2xl font-black">${p.earlyBird}</span>
                  <span className="mr-2 text-sm text-muted-foreground line-through">${p.price}</span>
                </div>
                <Badge className="rounded-full bg-emerald-500/15 text-emerald-500">Early Bird</Badge>
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-3 w-3" /> الأماكن المحجوزة</span>
                  <span className="font-black">{p.booked} / {p.seats}</span>
                </div>
                <Progress value={pct} className={soldOut ? "[&>div]:bg-destructive" : ""} />
                {soldOut && <div className="text-xs font-black text-destructive">مكتمل العدد</div>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
