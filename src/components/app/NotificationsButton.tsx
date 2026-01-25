import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type ActivityRow = {
  id: string;
  action: string;
  entity: string | null;
  entity_id: string | null;
  metadata: any;
  created_at: string;
};

function fmtTime(ts: string) {
  const d = new Date(ts);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}

function describe(a: ActivityRow) {
  const meta = a.metadata ?? {};
  switch (a.action) {
    case "invoice_created":
      return `Invoice created${meta.invoice_no ? ` (${meta.invoice_no})` : ""}`;
    case "invoice_printed":
      return `Invoice printed${meta.invoice_no ? ` (${meta.invoice_no})` : ""}`;
    case "payment_recorded":
      return `Payment recorded${meta.amount ? ` ($${Number(meta.amount).toFixed(2)})` : ""}`;
    case "report_printed":
      return `Report printed${meta.sections ? ` (${String(meta.sections)})` : ""}`;
    default:
      return `${a.action}${a.entity ? ` · ${a.entity}` : ""}`;
  }
}

const LS_KEY = "notif_last_seen";

export function NotificationsButton() {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const lastSeen = React.useMemo(() => {
    const v = window.localStorage.getItem(LS_KEY);
    return v ? Number(v) : 0;
  }, [open]);

  const logs = useQuery({
    queryKey: ["activity_logs", "latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("id,action,entity,entity_id,metadata,created_at")
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return (data ?? []) as ActivityRow[];
    },
    refetchInterval: 30_000,
  });

  React.useEffect(() => {
    const channel = supabase
      .channel("activity_logs_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_logs" },
        () => {
          qc.invalidateQueries({ queryKey: ["activity_logs", "latest"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const unread = React.useMemo(() => {
    const rows = logs.data ?? [];
    return rows.filter((r) => {
      const t = new Date(r.created_at).getTime();
      return t > lastSeen;
    }).length;
  }, [logs.data, lastSeen]);

  React.useEffect(() => {
    if (!open) return;
    window.localStorage.setItem(LS_KEY, String(Date.now()));
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell />
          {unread > 0 ? (
            <span
              className={cn(
                "absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border bg-primary px-1 text-[11px] font-semibold text-primary-foreground",
              )}
              aria-label={`${unread} unread notifications`}
            >
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="text-sm font-semibold">Notifications</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.localStorage.setItem(LS_KEY, String(Date.now()));
              qc.invalidateQueries({ queryKey: ["activity_logs", "latest"] });
            }}
          >
            <CheckCheck />
            Mark read
          </Button>
        </div>

        <div className="max-h-[360px] overflow-auto">
          {(logs.data ?? []).length === 0 && !logs.isLoading ? (
            <div className="p-3 text-sm text-muted-foreground">No activity yet.</div>
          ) : null}

          {(logs.data ?? []).map((r) => {
            const isUnread = new Date(r.created_at).getTime() > lastSeen;
            return (
              <div key={r.id} className="border-b px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm">
                    <div className={cn("font-medium", isUnread && "text-foreground")}>{describe(r)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{fmtTime(r.created_at)}</div>
                  </div>
                  {isUnread ? <span className="mt-1 h-2 w-2 rounded-full bg-primary" /> : null}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
