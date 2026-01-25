import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { roomTypeSchema, type RoomTypeValues } from "@/pages/app/rooms/schemas";

export function RoomTypeDialog({
  mode = "create",
  open,
  onOpenChange,
  initialValues,
  onCreate,
  onUpdate,
  isCreating,
}: {
  mode?: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: RoomTypeValues;
  onCreate: (values: RoomTypeValues) => void;
  onUpdate?: (values: RoomTypeValues) => void;
  isCreating: boolean;
}) {
  const form = useForm<z.infer<typeof roomTypeSchema>>({
    resolver: zodResolver(roomTypeSchema),
    defaultValues: initialValues ?? { name: "", base_rate: 0, max_occupancy: 2 },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(initialValues ?? { name: "", base_rate: 0, max_occupancy: 2 });
  }, [open, initialValues, form]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) form.reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create room type" : "Edit room type"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit((v) => {
              const values = v as unknown as RoomTypeValues;
              if (mode === "create") onCreate(values);
              else onUpdate?.(values);
            })}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Deluxe King" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="base_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nightly rate</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="250.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_occupancy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max occupancy</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end">
              <Button variant="hero" type="submit" disabled={isCreating}>
                {mode === "create" ? "Create" : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
