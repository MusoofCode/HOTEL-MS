import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/pages/app/_ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";

const roomTypeSchema = z.object({
  name: z.string().trim().min(1),
  base_rate: z.coerce.number().positive(),
  max_occupancy: z.coerce.number().int().min(1),
});

type RoomTypeValues = {
  name: string;
  base_rate: number;
  max_occupancy: number;
};

const roomSchema = z.object({
  room_number: z.string().trim().min(1),
  room_type_id: z.string().uuid(),
  rate_override: z.union([z.coerce.number().positive(), z.nan()]).optional(),
});

export default function Rooms() {
  const qc = useQueryClient();
  const [openType, setOpenType] = React.useState(false);
  const [openRoom, setOpenRoom] = React.useState(false);

  const types = useQuery({
    queryKey: ["room_types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("room_types").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const rooms = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id,room_number,status,rate_override,room_type_id,room_types(name,base_rate)")
        .order("room_number");
      if (error) throw error;
      return data ?? [];
    },
  });

  const typeForm = useForm<z.infer<typeof roomTypeSchema>>({
    resolver: zodResolver(roomTypeSchema),
    defaultValues: { name: "", base_rate: 0, max_occupancy: 2 },
  });
  const roomForm = useForm<z.infer<typeof roomSchema>>({
    resolver: zodResolver(roomSchema),
    defaultValues: { room_number: "", room_type_id: "", rate_override: undefined },
  });

  const createType = useMutation({
    mutationFn: async (values: RoomTypeValues) => {
      // Build a strict payload so the generated Insert type requirements are satisfied.
      const payload = {
        name: values.name,
        base_rate: Number(values.base_rate),
        max_occupancy: Number(values.max_occupancy),
      };

      const { error } = await supabase.from("room_types").insert([payload]);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["room_types"] });
      toast("Room type created");
      setOpenType(false);
      typeForm.reset();
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  const createRoom = useMutation({
    mutationFn: async (values: z.infer<typeof roomSchema>) => {
      const payload: any = {
        room_number: values.room_number,
        room_type_id: values.room_type_id,
      };
      if (typeof values.rate_override === "number" && !Number.isNaN(values.rate_override)) payload.rate_override = values.rate_override;
      const { error } = await supabase.from("rooms").insert([payload]);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["rooms"] });
      toast("Room created");
      setOpenRoom(false);
      roomForm.reset();
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  return (
    <div>
      <PageHeader
        title="Rooms"
        subtitle="Room types, nightly pricing, and room availability status."
        actions={
          <>
            <Dialog open={openType} onOpenChange={setOpenType}>
              <DialogTrigger asChild>
                <Button variant="outline">New Room Type</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create room type</DialogTitle>
                </DialogHeader>
                <Form {...typeForm}>
                  <form
                    className="grid gap-4"
                    onSubmit={typeForm.handleSubmit((v) => createType.mutate(v as unknown as RoomTypeValues))}
                  >
                    <FormField control={typeForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl><Input placeholder="Deluxe King" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={typeForm.control} name="base_rate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nightly rate</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="250.00" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={typeForm.control} name="max_occupancy" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max occupancy</FormLabel>
                        <FormControl><Input type="number" step="1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="flex justify-end">
                      <Button variant="hero" type="submit" disabled={createType.isPending}>Create</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={openRoom} onOpenChange={setOpenRoom}>
              <DialogTrigger asChild>
                <Button variant="hero">New Room</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create room</DialogTitle>
                </DialogHeader>
                <Form {...roomForm}>
                  <form className="grid gap-4" onSubmit={roomForm.handleSubmit((v) => createRoom.mutate(v))}>
                    <FormField control={roomForm.control} name="room_number" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room number</FormLabel>
                        <FormControl><Input placeholder="101" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={roomForm.control} name="room_type_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room type (ID)</FormLabel>
                        <FormControl><Input placeholder="Select a type from the list below" {...field} /></FormControl>
                        <div className="text-xs text-muted-foreground">(UI select will be added next; for now paste the UUID from Room Types table.)</div>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={roomForm.control} name="rate_override" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate override (optional)</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="flex justify-end">
                      <Button variant="hero" type="submit" disabled={createRoom.isPending}>Create</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardContent className="p-0">
            <div className="p-6 text-sm font-semibold">Room types</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Max</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(types.data ?? []).map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium">{t.name}</div>
                      <div className="mt-1 break-all text-xs text-muted-foreground">{t.id}</div>
                    </TableCell>
                    <TableCell>${Number(t.base_rate).toFixed(2)}</TableCell>
                    <TableCell>{t.max_occupancy}</TableCell>
                  </TableRow>
                ))}
                {(types.data?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">No room types yet.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-0">
            <div className="p-6 text-sm font-semibold">Rooms</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rooms.data ?? []).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.room_number}</TableCell>
                    <TableCell>{r.room_types?.name ?? "—"}</TableCell>
                    <TableCell>
                      ${Number(r.rate_override ?? r.room_types?.base_rate ?? 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {(rooms.data?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">No rooms yet.</TableCell>
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
