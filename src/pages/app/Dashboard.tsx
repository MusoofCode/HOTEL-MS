import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatISO, startOfDay, startOfMonth, startOfYear } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import { subscribeTables } from "@/lib/realtime";
import { PageHeader, StatCard } from "@/pages/app/_ui";
import { Card, CardContent } from "@/components/ui/card";

function iso(d: Date) {
  return formatISO(d, { representation: "date" });
}

async function sumPaymentsSince(date: Date) {
  const { data, error } = await supabase
    .from("payments")
    .select("amount, paid_at")
    .gte("paid_at", date.toISOString());
  if (error) throw error;
  return (data ?? []).reduce((acc, r) => acc + Number(r.amount ?? 0), 0);
}

async function sumExpensesSince(date: Date) {
  const { data, error } = await supabase
    .from("expenses")
    .select("amount, expense_date")
    .gte("expense_date", iso(date));
  if (error) throw error;
  return (data ?? []).reduce((acc, r) => acc + Number(r.amount ?? 0), 0);
}

async function occupancyToday() {
  const today = iso(new Date());
  const { data, error } = await supabase
    .from("reservations")
    .select("id")
    .in("status", ["confirmed", "checked_in"])
    .lte("check_in_date", today)
    .gt("check_out_date", today);
  if (error) throw error;
  return data?.length ?? 0;
}

async function roomsTotal() {
  const { count, error } = await supabase.from("rooms").select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

async function upcomingCheckouts() {
  const today = iso(new Date());
  const in7 = iso(new Date(Date.now() + 7 * 86400000));
  const { data, error } = await supabase
    .from("reservation_details")
    .select("id, room_number, first_name, last_name, check_out_date")
    .eq("status", "checked_in")
    .gte("check_out_date", today)
    .lte("check_out_date", in7)
    .order("check_out_date", { ascending: true })
    .limit(5);
  if (error) throw error;
  return data ?? [];
}

async function lowStock() {
  const { data, error } = await supabase.from("low_stock_items").select("id,name,current_stock,reorder_level,unit").limit(5);
  if (error) throw error;
  return data ?? [];
}

export default function Dashboard() {
  const qc = useQueryClient();

  React.useEffect(() => {
    return subscribeTables("hms-dashboard", ["reservations", "payments", "expenses", "inventory_items"], () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    });
  }, [qc]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [incomeToday, incomeMonth, incomeYear, expensesMonth, occ, rooms, checkouts, low] = await Promise.all([
        sumPaymentsSince(startOfDay(new Date())),
        sumPaymentsSince(startOfMonth(new Date())),
        sumPaymentsSince(startOfYear(new Date())),
        sumExpensesSince(startOfMonth(new Date())),
        occupancyToday(),
        roomsTotal(),
        upcomingCheckouts(),
        lowStock(),
      ]);

      const available = Math.max(0, rooms - occ);
      const profitMonth = incomeMonth - expensesMonth;

      return { incomeToday, incomeMonth, incomeYear, expensesMonth, profitMonth, occ, rooms, available, checkouts, low };
    },
  });

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Real-time financial and occupancy command center." />

      {error ? (
        <Card className="shadow-soft">
          <CardContent className="p-6 text-sm text-muted-foreground">Failed to load KPIs: {(error as any).message}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Income (Today)" value={isLoading ? "—" : `$${data?.incomeToday.toFixed(2)}`} hint="Cashflow today" />
        <StatCard label="Income (Month)" value={isLoading ? "—" : `$${data?.incomeMonth.toFixed(2)}`} hint="Paid in full" />
        <StatCard label="Expenses (Month)" value={isLoading ? "—" : `$${data?.expensesMonth.toFixed(2)}`} hint="Operational spend" />
        <StatCard
          label="Net Profit (Month)"
          value={isLoading ? "—" : `$${data?.profitMonth.toFixed(2)}`}
          hint="Income − expenses"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <StatCard
          className="lg:col-span-1"
          label="Occupancy (Today)"
          value={isLoading ? "—" : `${data?.occ}/${data?.rooms}`}
          hint={isLoading ? "" : `${data?.available} available`}
        />

        <Card className="shadow-soft lg:col-span-1">
          <CardContent className="p-6">
            <div className="text-sm font-semibold">Upcoming check-outs (7 days)</div>
            <div className="mt-3 grid gap-2 text-sm">
              {(data?.checkouts?.length ?? 0) === 0 ? (
                <div className="text-muted-foreground">No upcoming check-outs.</div>
              ) : (
                data?.checkouts.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
                    <div className="min-w-0">
                      <div className="font-medium">Room {c.room_number}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {c.first_name} {c.last_name}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{c.check_out_date}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft lg:col-span-1">
          <CardContent className="p-6">
            <div className="text-sm font-semibold">Low inventory alerts</div>
            <div className="mt-3 grid gap-2 text-sm">
              {(data?.low?.length ?? 0) === 0 ? (
                <div className="text-muted-foreground">No low-stock items.</div>
              ) : (
                data?.low.map((i: any) => (
                  <div key={i.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
                    <div className="min-w-0">
                      <div className="font-medium">{i.name}</div>
                      <div className="text-xs text-muted-foreground">Reorder at {i.reorder_level} {i.unit}</div>
                    </div>
                    <div className="text-xs">{i.current_stock} {i.unit}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
