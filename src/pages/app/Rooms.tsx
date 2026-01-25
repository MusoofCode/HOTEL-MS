import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/pages/app/_ui";
import { toast } from "@/components/ui/sonner";

import { RoomTypeDialog } from "@/pages/app/rooms/RoomTypeDialog";
import { RoomDialog } from "@/pages/app/rooms/RoomDialog";
import { RoomTypesCard } from "@/pages/app/rooms/RoomTypesCard";
import { RoomsCard } from "@/pages/app/rooms/RoomsCard";
import type { RoomFormValues, RoomTypeValues } from "@/pages/app/rooms/schemas";

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
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  const createRoom = useMutation({
    mutationFn: async (values: RoomFormValues) => {
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
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Rooms"
        subtitle="Room types, nightly pricing, and room availability status."
        actions={
          <>
            <RoomTypeDialog
              open={openType}
              onOpenChange={setOpenType}
              onCreate={(v) => createType.mutate(v)}
              isCreating={createType.isPending}
            />
            <RoomDialog
              open={openRoom}
              onOpenChange={setOpenRoom}
              roomTypes={(types.data ?? []).map((t: any) => ({ id: t.id, name: t.name }))}
              onCreate={(v) => createRoom.mutate(v)}
              isCreating={createRoom.isPending}
            />
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <RoomTypesCard types={(types.data ?? []) as any} isLoading={types.isLoading} />
        <RoomsCard rooms={(rooms.data ?? []) as any} isLoading={rooms.isLoading} />
      </div>
    </div>
  );
}
