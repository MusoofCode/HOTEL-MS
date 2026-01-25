import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { inventoryItemSchema, type InventoryItemValues } from "@/pages/app/inventory/schemas";

export function InventoryItemDialog({
  mode,
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  isSaving,
}: {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: InventoryItemValues;
  onSubmit: (values: InventoryItemValues) => void;
  isSaving: boolean;
}) {
  const form = useForm<InventoryItemValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: initialValues ?? { name: "", unit: "unit", reorder_level: 0 },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(initialValues ?? { name: "", unit: "unit", reorder_level: 0 });
  }, [open, initialValues, form]);

  const title = mode === "create" ? "New inventory item" : "Edit inventory item";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="animate-enter">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit((v) => onSubmit(v))}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Towels" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="pcs / bottles / boxes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reorder_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder level</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="hero" disabled={isSaving}>
                {mode === "create" ? "Create" : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
