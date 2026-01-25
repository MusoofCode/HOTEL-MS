import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/pages/app/_ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

import { ReservationDialog } from "@/pages/app/reservations/ReservationDialog";
import { ReservationsTableCard, type ReservationRow } from "@/pages/app/reservations/ReservationsTableCard";
import type { ReservationFormValues } from "@/pages/app/reservations/schemas";

export default function Reservations() {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ReservationRow | null>(null);
  const [search, setSearch] = React.useState("");

  const editingReservation = useQuery({
    enabled: Boolean(editing?.id),
    queryKey: ["reservation", editing?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("id,customer_id,room_id,check_in_date,check_out_date,status,notes")
        .eq("id", editing!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const customers = useQuery({
    queryKey: ["customers_options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id,first_name,last_name")
        .order("last_name")
        .order("first_name");
      if (error) throw error;
      return (data ?? []).map((c) => ({ id: c.id, label: `${c.last_name}, ${c.first_name}` }));
    },
  });

  const rooms = useQuery({
    queryKey: ["rooms_options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id,room_number")
        .order("room_number");
      if (error) throw error;
      return (data ?? []).map((r) => ({ id: r.id, label: `Room ${r.room_number}` }));
    },
  });

  const reservations = useQuery({
    queryKey: ["reservation_details", search],
    queryFn: async () => {
      let q = supabase
        .from("reservation_details")
        .select(
          "id,status,first_name,last_name,room_number,check_in_date,check_out_date,nights,total_amount,balance_due",
        )
        .order("check_in_date", { ascending: false });

      const trimmed = search.trim();
      if (trimmed) {
        q = q.or(
          `first_name.ilike.%${trimmed}%,last_name.ilike.%${trimmed}%,room_number.ilike.%${trimmed}%`,
        );
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ReservationRow[];
    },
  });

  const createReservation = useMutation({
    mutationFn: async (values: ReservationFormValues) => {
      const payload = {
        customer_id: values.customer_id,
        room_id: values.room_id,
        check_in_date: values.check_in_date,
        check_out_date: values.check_out_date,
        status: values.status,
        notes: values.notes ? values.notes : null,
      };
      const { error } = await supabase.from("reservations").insert([payload]);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["reservation_details"] });
      toast("Reservation created");
      setOpen(false);
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  const updateReservation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ReservationFormValues }) => {
      const payload = {
        customer_id: values.customer_id,
        room_id: values.room_id,
        check_in_date: values.check_in_date,
        check_out_date: values.check_out_date,
        status: values.status,
        notes: values.notes ? values.notes : null,
      };
      const { error } = await supabase.from("reservations").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["reservation_details"] });
      toast("Reservation updated");
      setEditing(null);
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  const cancelReservation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reservations").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["reservation_details"] });
      toast("Reservation cancelled");
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reservations"
        subtitle="Create bookings with conflict-proof availability."
        actions={
          <Button
            variant="hero"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            New reservation
          </Button>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guest or room…" />
        </div>
        <div className="text-sm text-muted-foreground">
          {reservations.isLoading ? "Loading…" : `${(reservations.data ?? []).length} reservations`}
        </div>
      </div>

      <ReservationsTableCard
        rows={reservations.data ?? []}
        isLoading={reservations.isLoading}
        onEdit={(r) => setEditing(r)}
        onCancel={(r) => cancelReservation.mutate(r.id)}
      />

      <ReservationDialog
        mode="create"
        open={open}
        onOpenChange={setOpen}
        customers={customers.data ?? []}
        rooms={rooms.data ?? []}
        onSubmit={(v) => createReservation.mutate(v)}
        isSaving={createReservation.isPending}
      />

      <ReservationDialog
        mode="edit"
        open={Boolean(editing)}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
        customers={customers.data ?? []}
        rooms={rooms.data ?? []}
        initialValues={
          editingReservation.data
            ? ({
                customer_id: editingReservation.data.customer_id,
                room_id: editingReservation.data.room_id,
                check_in_date: editingReservation.data.check_in_date,
                check_out_date: editingReservation.data.check_out_date,
                status: editingReservation.data.status as any,
                notes: editingReservation.data.notes ?? "",
              } as ReservationFormValues)
            : undefined
        }
        onSubmit={(v) => {
          if (!editing) return;
          updateReservation.mutate({ id: editing.id, values: v });
        }}
        isSaving={updateReservation.isPending}
      />
    </div>
  );
}

