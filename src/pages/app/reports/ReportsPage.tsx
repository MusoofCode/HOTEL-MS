import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays } from "date-fns";

import { PageHeader } from "@/pages/app/_ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv } from "@/lib/csv";

type DailyRow = {
  date: string;
  income: number;
  expenses: number;
  net: number;
  payments_count: number;
  expenses_count: number;
};

function yyyyMmDd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function rangeDates(start: string, end: string) {
  const a = new Date(start);
  const b = new Date(end);
  const days: string[] = [];
  for (let d = a; d <= b; d = addDays(d, 1)) days.push(yyyyMmDd(d));
  return days;
}

export default function ReportsPage() {
  const [from, setFrom] = React.useState(() => yyyyMmDd(addDays(new Date(), -30)));
  const [to, setTo] = React.useState(() => yyyyMmDd(new Date()));

  const report = useQuery({
    queryKey: ["reports", from, to],
    queryFn: async () => {
      const dates = rangeDates(from, to);

      const [pay, exp] = await Promise.all([
        supabase
          .from("payments")
          .select("amount,paid_at")
          .gte("paid_at", new Date(from).toISOString())
          .lt("paid_at", addDays(new Date(to), 1).toISOString()),
        supabase
          .from("expenses")
          .select("amount,expense_date")
          .gte("expense_date", from)
          .lte("expense_date", to),
      ]);

      if (pay.error) throw pay.error;
      if (exp.error) throw exp.error;

      const incomeByDay = new Map<string, { sum: number; count: number }>();
      for (const r of pay.data ?? []) {
        const day = String(r.paid_at).slice(0, 10);
        const cur = incomeByDay.get(day) ?? { sum: 0, count: 0 };
        cur.sum += Number(r.amount ?? 0);
        cur.count += 1;
        incomeByDay.set(day, cur);
      }

      const expByDay = new Map<string, { sum: number; count: number }>();
      for (const r of exp.data ?? []) {
        const day = String(r.expense_date);
        const cur = expByDay.get(day) ?? { sum: 0, count: 0 };
        cur.sum += Number(r.amount ?? 0);
        cur.count += 1;
        expByDay.set(day, cur);
      }

      const rows: DailyRow[] = dates.map((d) => {
        const i = incomeByDay.get(d) ?? { sum: 0, count: 0 };
        const e = expByDay.get(d) ?? { sum: 0, count: 0 };
        return {
          date: d,
          income: Number(i.sum.toFixed(2)),
          expenses: Number(e.sum.toFixed(2)),
          net: Number((i.sum - e.sum).toFixed(2)),
          payments_count: i.count,
          expenses_count: e.count,
        };
      });

      const totals = rows.reduce(
        (acc, r) => {
          acc.income += r.income;
          acc.expenses += r.expenses;
          acc.net += r.net;
          return acc;
        },
        { income: 0, expenses: 0, net: 0 },
      );

      return { rows, totals };
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        subtitle="Daily performance with export-ready output."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              downloadCsv(`report_${from}_to_${to}.csv`, report.data?.rows ?? []);
            }}
            disabled={!report.data?.rows?.length}
          >
            Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-12">
        <Card className="shadow-soft md:col-span-4 animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2">
              <div className="text-xs text-muted-foreground">From</div>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <div className="text-xs text-muted-foreground">To</div>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="rounded-2xl border bg-card px-4 py-3">
              <div className="text-xs text-muted-foreground">Totals</div>
              <div className="mt-2 grid gap-1 text-sm">
                <div className="flex items-center justify-between"><span>Income</span><span className="font-mono">${Number(report.data?.totals.income ?? 0).toFixed(2)}</span></div>
                <div className="flex items-center justify-between"><span>Expenses</span><span className="font-mono">${Number(report.data?.totals.expenses ?? 0).toFixed(2)}</span></div>
                <div className="flex items-center justify-between"><span>Net</span><span className="font-mono">${Number(report.data?.totals.net ?? 0).toFixed(2)}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft md:col-span-8 animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Daily summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Income</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(report.data?.rows ?? []).map((r) => (
                  <TableRow key={r.date}>
                    <TableCell className="font-medium">{r.date}</TableCell>
                    <TableCell className="text-right">${r.income.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${r.expenses.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${r.net.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {!report.isLoading && (report.data?.rows?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">No rows.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
