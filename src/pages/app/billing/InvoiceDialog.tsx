import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { invoiceSchema, type InvoiceValues } from "@/pages/app/billing/invoiceSchemas";

type Option = { id: string; label: string };

export function InvoiceDialog({
  open,
  onOpenChange,
  customers,
  reservations,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Option[];
  reservations: Option[];
  onSubmit: (values: InvoiceValues) => void;
  isSaving: boolean;
}) {
  const form = useForm<InvoiceValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoice_no: "",
      status: "draft",
      customer_id: "",
      reservation_id: "",
      notes: "",
      items: [{ description: "", quantity: 1, unit_price: 0 }],
    },
  });

  const items = useFieldArray({ control: form.control, name: "items" });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      invoice_no: "",
      status: "draft",
      customer_id: "",
      reservation_id: "",
      notes: "",
      items: [{ description: "", quantity: 1, unit_price: 0 }],
    });
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="animate-enter max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create invoice</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit((v) => onSubmit(v))}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="invoice_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice # (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="INV-0001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="issued">Issued</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="void">Void</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer (optional)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reservation_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reservation (optional)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reservation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {reservations.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-2xl border bg-card/70 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Line items</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => items.append({ description: "", quantity: 1, unit_price: 0 })}
                >
                  <Plus />
                  Add item
                </Button>
              </div>

              <div className="mt-3 grid gap-3">
                {items.fields.map((f, idx) => (
                  <div key={f.id} className="grid gap-3 rounded-2xl border bg-background/40 p-3 md:grid-cols-12">
                    <div className="md:col-span-6">
                      <FormField
                        control={form.control}
                        name={`items.${idx}.description` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input placeholder="Room service" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${idx}.quantity` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qty</FormLabel>
                            <FormControl>
                              <Input type="number" step="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <FormField
                        control={form.control}
                        name={`items.${idx}.unit_price` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit price</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-1 md:flex md:items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Remove item"
                        onClick={() => items.remove(idx)}
                        disabled={items.fields.length <= 1}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Extra details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="hero" disabled={isSaving}>
                Create invoice
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
