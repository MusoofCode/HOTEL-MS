import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { addDays } from "date-fns";

import { PageHeader } from "@/pages/app/_ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { PaymentDialog, type PaymentValues } from "@/pages/app/billing/PaymentDialog";
import { InvoiceDialog } from "@/pages/app/billing/InvoiceDialog";
import type { InvoiceValues } from "@/pages/app/billing/invoiceSchemas";
import { printInvoice } from "@/pages/app/billing/printInvoice";
import { logActivity } from "@/lib/activityLog";

const ALL_VALUE = "__all__";

type InvoiceStatusFilter = "all" | "paid" | "unpaid" | "overdue";

export default function Billing() {
  const qc = useQueryClient();
  const [paying, setPaying] = React.useState<{
    id: string;
    label: string;
    total: number;
  } | null>(null);

  const [creatingInvoice, setCreatingInvoice] = React.useState(false);

  // Invoice filters
  const [invSearch, setInvSearch] = React.useState("");
  const [invStatus, setInvStatus] = React.useState<InvoiceStatusFilter>("all");
  const [invFrom, setInvFrom] = React.useState("");
  const [invTo, setInvTo] = React.useState("");
  const [invCustomerId, setInvCustomerId] = React.useState<string>("");

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
        .select("id,invoice_no,status,total,created_at,customer_id")
        .order("created_at", { ascending: false })
        .limit(250);
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

      await logActivity({
        action: "invoice_created",
        entity: "billing_invoices",
        entity_id: inv.id,
        metadata: { invoice_no: invPayload.invoice_no || null, status: invPayload.status },
      });
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

      await logActivity({
        action: "payment_recorded",
        entity: "payments",
        entity_id: reservationId,
        metadata: { amount: total, method: values.method },
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["billing_due"] });
      await qc.invalidateQueries({ queryKey: ["reservation_details"] });
      toast("Payment recorded");
      setPaying(null);
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  const printInv = useMutation({
    mutationFn: async ({ invoiceId, w }: { invoiceId: string; w: Window }) => {
      await printInvoice({ invoiceId, w });
    },
    onError: (e: any) => toast("Print failed", { description: e.message }),
  });

  const customerLabelById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of customers.data ?? []) map.set(c.id, c.label);
    return map;
  }, [customers.data]);

  const filteredInvoices = React.useMemo(() => {
    const q = invSearch.trim().toLowerCase();
    const fromD = invFrom ? new Date(invFrom) : null;
    const toD = invTo ? addDays(new Date(invTo), 1) : null;

    return (invoices.data ?? []).filter((inv: any) => {
      const createdAt = inv.created_at ? new Date(inv.created_at) : null;
      if (fromD && createdAt && createdAt < fromD) return false;
      if (toD && createdAt && createdAt >= toD) return false;

      if (invCustomerId) {
        if (String(inv.customer_id ?? "") !== invCustomerId) return false;
      }

      if (invStatus !== "all") {
        const st = String(inv.status ?? "draft");
        const createdMs = createdAt ? createdAt.getTime() : 0;
        const overdueMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const isPaid = st === "paid";
        const isVoid = st === "void";
        const isUnpaid = !isPaid && !isVoid;
        const isOverdue = isUnpaid && createdMs > 0 && createdMs < overdueMs;

        if (invStatus === "paid" && !isPaid) return false;
        if (invStatus === "unpaid" && !isUnpaid) return false;
        if (invStatus === "overdue" && !isOverdue) return false;
      }

      if (q) {
        const invoiceNo = String(inv.invoice_no ?? "").toLowerCase();
        const cust = inv.customer_id ? (customerLabelById.get(String(inv.customer_id)) ?? "") : "";
        const custStr = cust.toLowerCase();
        if (!invoiceNo.includes(q) && !custStr.includes(q)) return false;
      }

      return true;
    });
  }, [invSearch, invFrom, invTo, invCustomerId, invStatus, invoices.data, customerLabelById]);

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

      <Card className="shadow-soft animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Invoices</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-3 rounded-2xl border bg-card/70 p-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <div className="text-xs text-muted-foreground">Search</div>
              <Input
                value={invSearch}
                onChange={(e) => setInvSearch(e.target.value)}
                placeholder="Invoice # or customer"
              />
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-muted-foreground">Status</div>
              <Select value={invStatus} onValueChange={(v) => setInvStatus(v as InvoiceStatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-muted-foreground">From</div>
              <Input type="date" value={invFrom} onChange={(e) => setInvFrom(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-muted-foreground">To</div>
              <Input type="date" value={invTo} onChange={(e) => setInvTo(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-muted-foreground">Customer</div>
              <Select
                value={invCustomerId ? invCustomerId : ALL_VALUE}
                onValueChange={(v) => setInvCustomerId(v === ALL_VALUE ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All</SelectItem>
                  {(customers.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-12 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Showing: {filteredInvoices.length}</div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInvSearch("");
                  setInvStatus("all");
                  setInvFrom("");
                  setInvTo("");
                  setInvCustomerId("");
                }}
              >
                Reset filters
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-card/70 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(filteredInvoices ?? []).map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoice_no || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {inv.customer_id ? customerLabelById.get(String(inv.customer_id)) ?? "—" : "—"}
                    </TableCell>
                    <TableCell className="capitalize">{String(inv.status ?? "draft")}</TableCell>
                    <TableCell className="text-right">${Number(inv.total ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{String(inv.created_at ?? "").slice(0, 10)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={printInv.isPending}
                        onClick={() => {
                          const w = window.open("", "_blank");
                          if (!w) {
                            toast("Popup blocked", { description: "Allow popups to print." });
                            return;
                          }
                          try {
                            w.focus();
                          } catch {
                            // ignore
                          }
                          printInv.mutate({ invoiceId: inv.id, w });
                        }}
                      >
                        View / Print
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {!invoices.isLoading && filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground">
                      No invoices match your filters.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
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
