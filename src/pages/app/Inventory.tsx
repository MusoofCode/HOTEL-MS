import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/pages/app/_ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

import { InventoryItemDialog } from "@/pages/app/inventory/InventoryItemDialog";
import { StockMoveDialog } from "@/pages/app/inventory/StockMoveDialog";
import { InventoryItemsCard, type InventoryItemRow } from "@/pages/app/inventory/InventoryItemsCard";
import { LowStockCard, type LowStockRow } from "@/pages/app/inventory/LowStockCard";
import type { InventoryItemValues, StockMoveValues } from "@/pages/app/inventory/schemas";

export default function Inventory() {
  const qc = useQueryClient();
  const [q, setQ] = React.useState("");
  const [openItem, setOpenItem] = React.useState(false);
  const [editing, setEditing] = React.useState<InventoryItemRow | null>(null);
  const [openMove, setOpenMove] = React.useState(false);

  const items = useQuery({
    queryKey: ["inventory_items", q],
    queryFn: async () => {
      let query = supabase
        .from("inventory_items")
        .select("id,name,unit,current_stock,reorder_level,updated_at")
        .order("name");
      const trimmed = q.trim();
      if (trimmed) query = query.ilike("name", `%${trimmed}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as InventoryItemRow[];
    },
  });

  const lowStock = useQuery({
    queryKey: ["low_stock_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("low_stock_items")
        .select("id,name,unit,current_stock,reorder_level")
        .order("current_stock", { ascending: true })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as LowStockRow[];
    },
  });

  const createItem = useMutation({
    mutationFn: async (values: InventoryItemValues) => {
      const payload = {
        name: values.name,
        unit: values.unit,
        reorder_level: Number(values.reorder_level),
      };
      const { error } = await supabase.from("inventory_items").insert([payload]);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["inventory_items"] });
      await qc.invalidateQueries({ queryKey: ["low_stock_items"] });
      toast("Item created");
      setOpenItem(false);
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: InventoryItemValues }) => {
      const payload = {
        name: values.name,
        unit: values.unit,
        reorder_level: Number(values.reorder_level),
      };
      const { error } = await supabase.from("inventory_items").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["inventory_items"] });
      await qc.invalidateQueries({ queryKey: ["low_stock_items"] });
      toast("Item updated");
      setEditing(null);
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["inventory_items"] });
      await qc.invalidateQueries({ queryKey: ["low_stock_items"] });
      toast("Item deleted");
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  const createMove = useMutation({
    mutationFn: async (values: StockMoveValues) => {
      const payload = {
        inventory_item_id: values.inventory_item_id,
        direction: values.direction,
        quantity: Number(values.quantity),
        notes: values.notes ? values.notes : null,
      };
      const { error } = await supabase.from("inventory_transactions").insert([payload]);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["inventory_items"] });
      await qc.invalidateQueries({ queryKey: ["low_stock_items"] });
      toast("Stock updated");
      setOpenMove(false);
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Inventory"
        subtitle="Stock levels, movements, and low-stock alerts."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpenMove(true);
              }}
            >
              Stock in/out
            </Button>
            <Button
              variant="hero"
              onClick={() => {
                setEditing(null);
                setOpenItem(true);
              }}
            >
              New item
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="max-w-md">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search inventory items…" />
            </div>
            <div className="text-sm text-muted-foreground">
              {items.isLoading ? "Loading…" : `${(items.data ?? []).length} items`}
            </div>
          </div>

          <InventoryItemsCard
            items={items.data ?? []}
            isLoading={items.isLoading}
            onEdit={(i) => setEditing(i)}
            onDelete={(i) => deleteItem.mutate(i.id)}
          />
        </div>

        <div className="space-y-4">
          <LowStockCard rows={lowStock.data ?? []} isLoading={lowStock.isLoading} />
        </div>
      </div>

      <InventoryItemDialog
        mode="create"
        open={openItem}
        onOpenChange={setOpenItem}
        onSubmit={(v) => createItem.mutate(v)}
        isSaving={createItem.isPending}
      />

      <InventoryItemDialog
        mode="edit"
        open={Boolean(editing)}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
        initialValues={
          editing
            ? {
                name: editing.name,
                unit: editing.unit,
                reorder_level: editing.reorder_level,
              }
            : undefined
        }
        onSubmit={(v) => {
          if (!editing) return;
          updateItem.mutate({ id: editing.id, values: v });
        }}
        isSaving={updateItem.isPending}
      />

      <StockMoveDialog
        open={openMove}
        onOpenChange={setOpenMove}
        items={(items.data ?? []).map((i) => ({ id: i.id, label: `${i.name} (${i.unit})` }))}
        onSubmit={(v) => createMove.mutate(v)}
        isSaving={createMove.isPending}
      />
    </div>
  );
}
