import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/pages/app/_ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

import { PaymentDialog, type PaymentValues } from "@/pages/app/billing/PaymentDialog";

export default function Billing() {
  const qc = useQueryClient();
  const [paying, setPaying] = React.useState<{
    id: string;
    label: string;
    total: number;
  } | null>(null);

  const due = useQuery({
    queryKey: ["billing_due"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservation_details")
        .select("id,first_name,last_name,room_number,total_amount,balance_due,status")
        .gt("balance_due", 0)
        .in("status", ["confirmed", "checked_in", "checked_out"])
        .order("balance_due", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const recordPayment = useMutation({
    mutationFn: async ({ reservationId, total, values }: { reservationId: string; total: number; values: PaymentValues }) => {
      const payload = {
        reservation_id: reservationId,
        method: values.method,
        amount: total,
        reference: values.reference ? values.reference : undefined,
      };
      const { error } = await supabase.from("payments").insert([payload]);
      if (error) throw error;

      // Mark balance as paid (single-payment system)
      const { error: upErr } = await supabase.from("reservations").update({ balance_due: 0 }).eq("id", reservationId);
      if (upErr) throw upErr;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["billing_due"] });
      await qc.invalidateQueries({ queryKey: ["reservation_details"] });
      toast("Payment recorded");
      setPaying(null);
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Billing" subtitle="Full-only payments, invoices, and balances." />

      <Card className="shadow-soft animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Balances due</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(due.data ?? []).map((r: any) => {
                const label = `${r.last_name ?? ""}, ${r.first_name ?? ""} · Room ${r.room_number ?? "—"}`;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{`${r.first_name ?? ""} ${r.last_name ?? ""}`}</TableCell>
                    <TableCell>{r.room_number ?? "—"}</TableCell>
                    <TableCell className="capitalize">{String(r.status ?? "").replace("_", " ")}</TableCell>
                    <TableCell className="text-right">${Number(r.balance_due ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="hero"
                        size="sm"
                        onClick={() => setPaying({ id: r.id, label, total: Number(r.total_amount ?? r.balance_due ?? 0) })}
                      >
                        Record payment
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {!due.isLoading && (due.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No balances due.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PaymentDialog
        open={Boolean(paying)}
        onOpenChange={(v) => {
          if (!v) setPaying(null);
        }}
        reservationLabel={paying?.label ?? ""}
        totalAmount={paying?.total ?? 0}
        onSubmit={(values) => {
          if (!paying) return;
          recordPayment.mutate({ reservationId: paying.id, total: paying.total, values });
        }}
        isSaving={recordPayment.isPending}
      />
    </div>
  );
}
