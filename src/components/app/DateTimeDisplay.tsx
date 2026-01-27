import * as React from "react";
import { CalendarDays } from "lucide-react";

function formatNow(d: Date) {
  const weekday = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(d);
  const date = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);

  return { weekday, date, time };
}

export function DateTimeDisplay() {
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const { weekday, date, time } = React.useMemo(() => formatNow(now), [now]);

  return (
    <div className="hidden items-center gap-2 rounded-2xl border bg-card/70 px-3 py-2 text-sm shadow-soft md:inline-flex">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border bg-background">
        <CalendarDays className="h-4 w-4" />
      </span>
      <div className="leading-tight">
        <div className="font-medium">
          {weekday} • {date}
        </div>
        <div className="text-muted-foreground tabular-nums">{time}</div>
      </div>
    </div>
  );
}
