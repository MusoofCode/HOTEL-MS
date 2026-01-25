import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, formatISO, startOfDay, startOfMonth, startOfYear } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import { subscribeTables } from "@/lib/realtime";
import { PageHeader, StatCard } from "@/pages/app/_ui";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

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

function dateKeyFromIsoTimestamp(ts: string) {
  return ts.slice(0, 10);
}

async function analyticsLastNDays(days: number) {
  const to = new Date();
  const from = startOfDay(addDays(to, -days + 1));
  const fromIso = from.toISOString();
  const toIso = addDays(to, 1).toISOString();

  const [pay, exp, res] = await Promise.all([
    supabase.from("payments").select("amount,paid_at").gte("paid_at", fromIso).lt("paid_at", toIso),
    supabase.from("expenses").select("amount,expense_date").gte("expense_date", iso(from)).lte("expense_date", iso(to)),
    supabase
      .from("reservations")
      .select("created_at,check_in_date,check_out_date,status")
      .gte("created_at", fromIso)
      .lt("created_at", toIso)
      .in("status", ["confirmed", "checked_in"]),
  ]);
  if (pay.error) throw pay.error;
  if (exp.error) throw exp.error;
  if (res.error) throw res.error;

  const daysList: string[] = [];
  for (let d = new Date(from); d <= to; d = addDays(d, 1)) daysList.push(iso(d));

  const incomeByDay = new Map<string, number>();
  for (const r of pay.data ?? []) {
    const k = dateKeyFromIsoTimestamp(String(r.paid_at));
    incomeByDay.set(k, (incomeByDay.get(k) ?? 0) + Number(r.amount ?? 0));
  }

  const expByDay = new Map<string, number>();
  for (const r of exp.data ?? []) {
    const k = String(r.expense_date);
    expByDay.set(k, (expByDay.get(k) ?? 0) + Number(r.amount ?? 0));
  }

  const createdByDay = new Map<string, number>();
  const activeReservations: Array<{ check_in_date: string; check_out_date: string; status: string }> = [];
  for (const r of res.data ?? []) {
    const k = dateKeyFromIsoTimestamp(String(r.created_at));
    createdByDay.set(k, (createdByDay.get(k) ?? 0) + 1);
    // For occupancy we need all active reservations overlapping the day.
    if (r.status === "confirmed" || r.status === "checked_in") {
      activeReservations.push({
        check_in_date: String((r as any).check_in_date),
        check_out_date: String((r as any).check_out_date),
        status: String(r.status),
      });
    }
  }

  return daysList.map((d) => ({
    day: d.slice(5),
    income: Number(((incomeByDay.get(d) ?? 0) as number).toFixed(2)),
    expenses: Number(((expByDay.get(d) ?? 0) as number).toFixed(2)),
    net: Number((((incomeByDay.get(d) ?? 0) - (expByDay.get(d) ?? 0)) as number).toFixed(2)),
    bookings: createdByDay.get(d) ?? 0,
    occupancy: activeReservations.reduce((acc, r) => {
      // Overlap: [check_in, check_out)
      return r.check_in_date <= d && r.check_out_date > d ? acc + 1 : acc;
    }, 0),
  }));
}

async function expenseCategoriesThisMonth() {
  const from = iso(startOfMonth(new Date()));
  const to = iso(new Date());
  const { data, error } = await supabase
    .from("expenses")
    .select("amount,category,expense_date")
    .gte("expense_date", from)
    .lte("expense_date", to);
  if (error) throw error;

  const by = new Map<string, number>();
  for (const r of data ?? []) {
    const k = String(r.category ?? "other");
    by.set(k, (by.get(k) ?? 0) + Number(r.amount ?? 0));
  }

  return Array.from(by.entries())
    .map(([category, total]) => ({ category, total: Number(total.toFixed(2)) }))
    .sort((a, b) => b.total - a.total);
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
      const [incomeToday, incomeMonth, incomeYear, expensesMonth, occ, rooms, checkouts, low, series30, expCats] = await Promise.all([
        sumPaymentsSince(startOfDay(new Date())),
        sumPaymentsSince(startOfMonth(new Date())),
        sumPaymentsSince(startOfYear(new Date())),
        sumExpensesSince(startOfMonth(new Date())),
        occupancyToday(),
        roomsTotal(),
        upcomingCheckouts(),
        lowStock(),
        analyticsLastNDays(30),
        expenseCategoriesThisMonth(),
      ]);

      const available = Math.max(0, rooms - occ);
      const profitMonth = incomeMonth - expensesMonth;

      return { incomeToday, incomeMonth, incomeYear, expensesMonth, profitMonth, occ, rooms, available, checkouts, low, series30, expCats };
    },
  });

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Statistical summary and live operations." />

      {error ? (
        <Card className="shadow-soft">
          <CardContent className="p-6 text-sm text-muted-foreground">Failed to load KPIs: {(error as any).message}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Main */}
        <section className="lg:col-span-9">
          <div className="mb-3 text-sm font-semibold text-muted-foreground">Statistical Summary</div>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Income (Today)" value={isLoading ? "—" : `$${data?.incomeToday.toFixed(2)}`} hint="Cashflow today" />
            <StatCard label="Income (Month)" value={isLoading ? "—" : `$${data?.incomeMonth.toFixed(2)}`} hint="Paid in full" />
            <StatCard label="Room Capacity" value={isLoading ? "—" : `${data?.available} available`} hint={isLoading ? "" : `${data?.occ} occupied • ${data?.rooms} total`} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Analytics (last 30 days)</div>
                    <div className="mt-1 text-xs text-muted-foreground">Income vs expenses with net trend</div>
                  </div>
                  <div className="text-xs text-muted-foreground">Updates live</div>
                </div>

                <div className="mt-4">
                  <ChartContainer
                    className="h-[240px] w-full"
                    config={{
                      income: { label: "Income", color: "hsl(var(--primary))" },
                      expenses: { label: "Expenses", color: "hsl(var(--destructive))" },
                      net: { label: "Net", color: "hsl(var(--foreground))" },
                    }}
                  >
                    {/* ChartContainer already wraps ResponsiveContainer, but we keep it simple and pass children */}
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={(data as any)?.series30 ?? []} margin={{ left: 4, right: 8, top: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" tickMargin={8} />
                        <YAxis tickMargin={8} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                          type="monotone"
                          dataKey="income"
                          stroke="var(--color-income)"
                          fill="var(--color-income)"
                          fillOpacity={0.12}
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="expenses"
                          stroke="var(--color-expenses)"
                          fill="var(--color-expenses)"
                          fillOpacity={0.10}
                          strokeWidth={2}
                        />
                        <Area type="monotone" dataKey="net" stroke="var(--color-net)" fillOpacity={0} strokeWidth={1.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-semibold">Occupancy & bookings</div>
                <div className="mt-1 text-xs text-muted-foreground">Last 30 days</div>
                <div className="mt-4">
                  <ChartContainer
                    className="h-[220px] w-full"
                    config={{
                      occupancy: { label: "Occupancy", color: "hsl(var(--primary))" },
                      bookings: { label: "Bookings", color: "hsl(var(--muted-foreground))" },
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(data as any)?.series30 ?? []} margin={{ left: 4, right: 8, top: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" tickMargin={8} />
                        <YAxis tickMargin={8} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="occupancy" fill="var(--color-occupancy)" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-semibold">Expenses by category</div>
                <div className="mt-1 text-xs text-muted-foreground">This month</div>
                <div className="mt-4">
                  <ChartContainer
                    className="h-[220px] w-full"
                    config={{
                      total: { label: "Total", color: "hsl(var(--destructive))" },
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(data as any)?.expCats ?? []} margin={{ left: 4, right: 8, top: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" tickMargin={8} />
                        <YAxis tickMargin={8} />
                        <ChartTooltip content={<ChartTooltipContent nameKey="category" />} />
                        <Bar dataKey="total" fill="var(--color-total)" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-semibold">Upcoming check-outs</div>
                <div className="mt-3 grid gap-2 text-sm">
                  {(data?.checkouts?.length ?? 0) === 0 ? (
                    <div className="text-muted-foreground">No upcoming check-outs.</div>
                  ) : (
                    data?.checkouts.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between gap-3 rounded-2xl border bg-card px-3 py-2">
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

            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-semibold">Low inventory alerts</div>
                <div className="mt-3 grid gap-2 text-sm">
                  {(data?.low?.length ?? 0) === 0 ? (
                    <div className="text-muted-foreground">No low-stock items.</div>
                  ) : (
                    data?.low.map((i: any) => (
                      <div key={i.id} className="flex items-center justify-between gap-3 rounded-2xl border bg-card px-3 py-2">
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
        </section>

        {/* Right rail */}
        <aside className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <div className="text-sm font-semibold">This month</div>
              <div className="mt-3 grid gap-3">
                <div className="rounded-2xl border bg-card px-4 py-3">
                  <div className="text-xs text-muted-foreground">Net profit</div>
                  <div className="mt-1 text-lg font-semibold">{isLoading ? "—" : `$${data?.profitMonth.toFixed(2)}`}</div>
                </div>
                <div className="rounded-2xl border bg-card px-4 py-3">
                  <div className="text-xs text-muted-foreground">Expenses</div>
                  <div className="mt-1 text-lg font-semibold">{isLoading ? "—" : `$${data?.expensesMonth.toFixed(2)}`}</div>
                </div>
                <div className="rounded-2xl border bg-card px-4 py-3">
                  <div className="text-xs text-muted-foreground">Income</div>
                  <div className="mt-1 text-lg font-semibold">{isLoading ? "—" : `$${data?.incomeMonth.toFixed(2)}`}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
