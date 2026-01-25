import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { roomSchema, type RoomFormValues } from "@/pages/app/rooms/schemas";

type RoomTypeOption = { id: string; name: string };

export function RoomDialog({
  mode = "create",
  open,
  onOpenChange,
  roomTypes,
  onCreate,
  onUpdate,
  initialValues,
  isCreating,
}: {
  mode?: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomTypes: RoomTypeOption[];
  onCreate: (values: RoomFormValues) => void;
  onUpdate?: (values: RoomFormValues) => void;
  initialValues?: RoomFormValues;
  isCreating: boolean;
}) {
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: initialValues ?? { room_number: "", room_type_id: "", rate_override: undefined },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(initialValues ?? { room_number: "", room_type_id: "", rate_override: undefined });
  }, [open, initialValues, form]);

  const typeNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const t of roomTypes) map.set(t.id, t.name);
    return map;
  }, [roomTypes]);

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
          <DialogTitle>{mode === "create" ? "Create room" : "Edit room"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit((v) => {
              if (mode === "create") onCreate(v);
              else onUpdate?.(v);
            })}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="room_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room number</FormLabel>
                    <FormControl>
                      <Input placeholder="101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rate_override"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate override</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="(optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="room_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a room type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roomTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground">Selected: {typeNameById.get(field.value) ?? "—"}</div>
                  <FormMessage />
                </FormItem>
              )}
            />

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
