import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/pages/app/_ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

import { CustomersTableCard, type CustomerRow } from "@/pages/app/customers/CustomersTableCard";
import { CustomerDialog } from "@/pages/app/customers/CustomerDialog";
import { CustomerDetailDialog } from "@/pages/app/customers/CustomerDetailDialog";
import type { CustomerFormValues } from "@/pages/app/customers/schemas";

export default function Customers() {
  const qc = useQueryClient();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CustomerRow | null>(null);
  const [viewing, setViewing] = React.useState<CustomerRow | null>(null);

  const customers = useQuery({
    queryKey: ["customers", query],
    queryFn: async () => {
      let q = supabase
        .from("customers")
        .select("id,first_name,last_name,email,phone,created_at")
        .order("created_at", { ascending: false });

      const trimmed = query.trim();
      if (trimmed) {
        // Simple search across name/email/phone
        q = q.or(
          `first_name.ilike.%${trimmed}%,last_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`,
        );
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CustomerRow[];
    },
  });

  const createCustomer = useMutation({
    mutationFn: async (values: CustomerFormValues) => {
      const payload = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email ? values.email : null,
        phone: values.phone ? values.phone : null,
      };
      const { error } = await supabase.from("customers").insert([payload]);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["customers"] });
      toast("Customer created");
      setOpen(false);
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  const updateCustomer = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: CustomerFormValues }) => {
      const payload = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email ? values.email : null,
        phone: values.phone ? values.phone : null,
      };
      const { error } = await supabase.from("customers").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["customers"] });
      toast("Customer updated");
      setEditing(null);
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["customers"] });
      toast("Customer deleted");
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customers"
        subtitle="Customer profiles and booking history."
        actions={
          <Button
            variant="hero"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            New customer
          </Button>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers (name, email, phone)…"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {customers.isLoading ? "Loading…" : `${(customers.data ?? []).length} customers`}
        </div>
      </div>

      <CustomersTableCard
        customers={customers.data ?? []}
        isLoading={customers.isLoading}
        onEdit={(c) => setEditing(c)}
        onDelete={(c) => deleteCustomer.mutateAsync(c.id)}
        onViewDetails={(c) => setViewing(c)}
      />

      <CustomerDetailDialog
        customer={viewing}
        open={Boolean(viewing)}
        onOpenChange={(v) => {
          if (!v) setViewing(null);
        }}
      />

      {/* Create */}
      <CustomerDialog
        mode="create"
        open={open}
        onOpenChange={setOpen}
        onSubmit={(v) => createCustomer.mutate(v)}
        isSaving={createCustomer.isPending}
      />

      {/* Edit */}
      <CustomerDialog
        mode="edit"
        open={Boolean(editing)}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
        initialValues={
          editing
            ? {
                first_name: editing.first_name,
                last_name: editing.last_name,
                email: editing.email ?? "",
                phone: editing.phone ?? "",
              }
            : undefined
        }
        onSubmit={(v) => {
          if (!editing) return;
          updateCustomer.mutate({ id: editing.id, values: v });
        }}
        isSaving={updateCustomer.isPending}
      />
    </div>
  );
}

