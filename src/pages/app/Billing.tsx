import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { PageHeader } from "@/pages/app/_ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

import { PaymentDialog, type PaymentValues } from "@/pages/app/billing/PaymentDialog";
import { InvoiceDialog } from "@/pages/app/billing/InvoiceDialog";
import { InvoicesTableCard } from "@/pages/app/billing/InvoicesTableCard";
import type { InvoiceValues } from "@/pages/app/billing/invoiceSchemas";

export default function Billing() {
  const qc = useQueryClient();
  const [paying, setPaying] = React.useState<{
    id: string;
    label: string;
    total: number;
  } | null>(null);

  const [creatingInvoice, setCreatingInvoice] = React.useState(false);

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

  const invoices = useQuery({
    queryKey: ["billing_invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_invoices")
        .select("id,invoice_no,status,total,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const customers = useQuery({
    queryKey: ["customers_for_invoice"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id,first_name,last_name,email").order("last_name");
      if (error) throw error;
      return (data ?? []).map((c: any) => ({
        id: c.id,
        label: `${c.last_name ?? ""}, ${c.first_name ?? ""}${c.email ? ` • ${c.email}` : ""}`,
      }));
    },
  });

  const reservations = useQuery({
    queryKey: ["reservations_for_invoice"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservation_details")
        .select("id,first_name,last_name,room_number,check_in_date,check_out_date,status")
        .in("status", ["confirmed", "checked_in", "checked_out"])
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        label: `${r.last_name ?? ""}, ${r.first_name ?? ""} • Room ${r.room_number ?? "—"} • ${r.check_in_date ?? ""}→${r.check_out_date ?? ""}`,
      }));
    },
  });

  const createInvoice = useMutation({
    mutationFn: async (values: InvoiceValues) => {
      const invPayload: any = {
        invoice_no: values.invoice_no?.trim() || "",
        status: values.status,
        notes: values.notes?.trim() || null,
      };
      if (values.customer_id) invPayload.customer_id = values.customer_id;
      if (values.reservation_id) invPayload.reservation_id = values.reservation_id;

      const { data: inv, error: invErr } = await supabase
        .from("billing_invoices")
        .insert([invPayload])
        .select("id")
        .single();
      if (invErr) throw invErr;

      const itemsPayload = values.items.map((it) => ({
        invoice_id: inv.id,
        description: it.description,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
      }));

      const { error: itemsErr } = await supabase.from("billing_invoice_items").insert(itemsPayload);
      if (itemsErr) throw itemsErr;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["billing_invoices"] });
      toast("Invoice created");
      setCreatingInvoice(false);
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
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
      <PageHeader
        title="Billing"
        subtitle="Full-only payments, invoices, and balances."
        actions={
          <Button variant="hero" onClick={() => setCreatingInvoice(true)}>
            <Plus />
            Add invoice
          </Button>
        }
      />

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

      <InvoicesTableCard invoices={invoices.data ?? []} isLoading={invoices.isLoading} />

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

      <InvoiceDialog
        open={creatingInvoice}
        onOpenChange={(v) => setCreatingInvoice(v)}
        customers={customers.data ?? []}
        reservations={reservations.data ?? []}
        onSubmit={(values) => createInvoice.mutate(values)}
        isSaving={createInvoice.isPending}
      />
    </div>
  );
}
