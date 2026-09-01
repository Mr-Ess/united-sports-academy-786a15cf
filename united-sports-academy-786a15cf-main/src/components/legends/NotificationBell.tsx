import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { useNavigate } from "@tanstack/react-router";

type N = {
  id: string;
  kind: string;
  severity: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell() {
  const { currentBranchId, userId } = useSession();
  const [items, setItems] = useState<N[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    if (!currentBranchId) return;
    const { data } = await supabase
      .from("ac_notifications")
      .select("id, kind, severity, title, body, link, read_at, created_at")
      .or(`branch_id.eq.${currentBranchId},user_id.eq.${userId ?? ""}`)
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data ?? []) as N[]);
  };

  useEffect(() => {
    load();
    if (!currentBranchId) return;
    const topic = `notif-${currentBranchId}-${Math.random().toString(36).slice(2, 10)}`;
    const ch = supabase.channel(topic);
    ch.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications", filter: `branch_id=eq.${currentBranchId}` },
      () => load(),
    );
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBranchId, userId]);


  const unread = items.filter((n) => !n.read_at).length;

  const markAllRead = async () => {
    if (!currentBranchId) return;
    const ids = items.filter((n) => !n.read_at).map((n) => n.id);
    if (!ids.length) return;
    await supabase.from("ac_notifications").update({ read_at: new Date().toISOString() }).in("id", ids);
    load();
  };

  const click = async (n: N) => {
    if (!n.read_at) await supabase.from("ac_notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id);
    setOpen(false);
    if (n.link) navigate({ to: n.link });
    load();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-teal/40 bg-background/30 text-cyan-glow hover:bg-teal/10 transition"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground grid place-items-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="text-sm font-semibold">الإشعارات</div>
          <button onClick={markAllRead} className="text-xs text-cyan-glow flex items-center gap-1 hover:underline">
            <CheckCheck className="h-3 w-3" /> تعليم الكل كمقروء
          </button>
        </div>
        {items.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-muted-foreground">لا توجد إشعارات</div>
        ) : (
          <ul className="divide-y">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => click(n)}
                  className={"w-full text-start px-3 py-2.5 hover:bg-accent/40 transition " + (!n.read_at ? "bg-accent/20" : "")}
                >
                  <div className="flex items-start gap-2">
                    <span className={
                      "mt-1 h-2 w-2 rounded-full shrink-0 " +
                      (n.severity === "critical" ? "bg-destructive" : n.severity === "warning" ? "bg-amber-400" : "bg-cyan-glow")
                    } />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-foreground truncate">{n.title}</div>
                      {n.body && <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</div>}
                      <div className="text-[10px] text-muted-foreground/70 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
