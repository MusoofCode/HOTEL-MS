import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/pages/app/_ui";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

import { RoomTypeDialog } from "@/pages/app/rooms/RoomTypeDialog";
import { RoomDialog } from "@/pages/app/rooms/RoomDialog";
import { RoomTypesCard } from "@/pages/app/rooms/RoomTypesCard";
import { RoomsCard } from "@/pages/app/rooms/RoomsCard";
import type { RoomFormValues, RoomTypeValues } from "@/pages/app/rooms/schemas";

export default function Rooms() {
  const qc = useQueryClient();
  const [openType, setOpenType] = React.useState(false);
  const [openRoom, setOpenRoom] = React.useState(false);
  const [editingType, setEditingType] = React.useState<any | null>(null);
  const [editingRoom, setEditingRoom] = React.useState<any | null>(null);

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

  const roomTypeUsage = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rooms.data ?? []) {
      const typeId = (r as any).room_type_id as string | undefined;
      if (!typeId) continue;
      map.set(typeId, (map.get(typeId) ?? 0) + 1);
    }
    return map;
  }, [rooms.data]);

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

  const updateType = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: RoomTypeValues }) => {
      const payload = {
        name: values.name,
        base_rate: Number(values.base_rate),
        max_occupancy: Number(values.max_occupancy),
      };
      const { error } = await supabase.from("room_types").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["room_types"] });
      toast("Room type updated");
      setEditingType(null);
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  const deleteType = useMutation({
    mutationFn: async (id: string) => {
      const { count, error: countError } = await supabase
        .from("rooms")
        .select("id", { count: "exact", head: true })
        .eq("room_type_id", id);
      if (countError) throw countError;
      if ((count ?? 0) > 0) {
        throw new Error("This room type is still used by one or more rooms.");
      }

      const { error } = await supabase.from("room_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["room_types"] });
      toast("Room type deleted");
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

  const updateRoom = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: RoomFormValues }) => {
      const payload: any = {
        room_number: values.room_number,
        room_type_id: values.room_type_id,
      };
      if (typeof values.rate_override === "number" && !Number.isNaN(values.rate_override)) payload.rate_override = values.rate_override;
      else payload.rate_override = null;
      const { error } = await supabase.from("rooms").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["rooms"] });
      toast("Room updated");
      setEditingRoom(null);
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  const deleteRoom = useMutation({
    mutationFn: async (id: string) => {
      const { count, error: countError } = await supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("room_id", id);
      if (countError) throw countError;
      if ((count ?? 0) > 0) {
        throw new Error("This room has reservations and cannot be deleted.");
      }

      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["rooms"] });
      toast("Room deleted");
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
            <Button variant="outline" onClick={() => setOpenType(true)}>
              <Plus />
              Add room type
            </Button>
            <Button variant="hero" onClick={() => setOpenRoom(true)}>
              <Plus />
              Add room
            </Button>
            <RoomTypeDialog
              mode="create"
              open={openType}
              onOpenChange={setOpenType}
              onCreate={(v) => createType.mutate(v)}
              isCreating={createType.isPending}
            />
            <RoomDialog
              mode="create"
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
        <RoomTypesCard
          types={(types.data ?? []) as any}
          isLoading={types.isLoading}
          onEdit={(t) => setEditingType(t)}
          onDelete={(t) => deleteType.mutateAsync(t.id)}
          usageByTypeId={roomTypeUsage}
        />
        <RoomsCard
          rooms={(rooms.data ?? []) as any}
          isLoading={rooms.isLoading}
          onEdit={(r) => setEditingRoom(r)}
          onDelete={(r) => deleteRoom.mutateAsync(r.id)}
        />
      </div>

      {/* Edit dialogs */}
      <RoomTypeDialog
        mode="edit"
        open={Boolean(editingType)}
        onOpenChange={(v) => {
          if (!v) setEditingType(null);
        }}
        initialValues={
          editingType
            ? {
                name: editingType.name,
                base_rate: Number(editingType.base_rate),
                max_occupancy: Number(editingType.max_occupancy),
              }
            : undefined
        }
        onCreate={() => void 0}
        onUpdate={(v) => {
          if (!editingType) return;
          updateType.mutate({ id: editingType.id, values: v });
        }}
        isCreating={updateType.isPending}
      />

      <RoomDialog
        mode="edit"
        open={Boolean(editingRoom)}
        onOpenChange={(v) => {
          if (!v) setEditingRoom(null);
        }}
        roomTypes={(types.data ?? []).map((t: any) => ({ id: t.id, name: t.name }))}
        initialValues={
          editingRoom
            ? {
                room_number: editingRoom.room_number,
                room_type_id: editingRoom.room_type_id,
                rate_override: editingRoom.rate_override ?? undefined,
              }
            : undefined
        }
        onCreate={() => void 0}
        onUpdate={(v) => {
          if (!editingRoom) return;
          updateRoom.mutate({ id: editingRoom.id, values: v });
        }}
        isCreating={updateRoom.isPending}
      />
    </div>
  );
}
