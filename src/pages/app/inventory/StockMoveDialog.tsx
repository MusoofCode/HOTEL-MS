import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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

import { stockMoveSchema, type StockMoveValues } from "@/pages/app/inventory/schemas";

type ItemOption = { id: string; label: string };

export function StockMoveDialog({
  open,
  onOpenChange,
  items,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ItemOption[];
  onSubmit: (values: StockMoveValues) => void;
  isSaving: boolean;
}) {
  const form = useForm<StockMoveValues>({
    resolver: zodResolver(stockMoveSchema),
    defaultValues: { inventory_item_id: "", direction: "in", quantity: 1, notes: "" },
  });

  React.useEffect(() => {
    if (open) form.reset({ inventory_item_id: "", direction: "in", quantity: 1, notes: "" });
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="animate-enter">
        <DialogHeader>
          <DialogTitle>Stock movement</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit((v) => onSubmit(v))}>
            <FormField
              control={form.control}
              name="inventory_item_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {items.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Direction</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in">Stock in</SelectItem>
                        <SelectItem value="out">Stock out</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Reason / supplier / usage…" {...field} />
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
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
