import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const schema = z.object({
  method: z.enum(["cash", "card", "transfer", "other"]),
  reference: z.string().trim().max(255, "Max 255 characters").optional().or(z.literal("")),
});

export type PaymentValues = z.infer<typeof schema>;

export function PaymentDialog({
  open,
  onOpenChange,
  reservationLabel,
  totalAmount,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationLabel: string;
  totalAmount: number;
  onSubmit: (values: PaymentValues) => void;
  isSaving: boolean;
}) {
  const form = useForm<PaymentValues>({
    resolver: zodResolver(schema),
    defaultValues: { method: "card", reference: "" },
  });

  React.useEffect(() => {
    if (open) form.reset({ method: "card", reference: "" });
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="animate-enter">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>

        <div className="rounded-lg border bg-card/70 p-3 text-sm">
          <div className="font-medium">{reservationLabel}</div>
          <div className="mt-1 text-muted-foreground">Amount (full-only): ${Number(totalAmount).toFixed(2)}</div>
        </div>

        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit((v) => onSubmit(v))}>
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Method</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="transfer">Bank transfer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Receipt / transaction ref" {...field} />
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
                Save payment
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
