import { z } from "zod";

export const inventoryItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Max 120 characters"),
  unit: z.string().trim().min(1, "Unit is required").max(20, "Max 20 characters"),
  reorder_level: z.coerce.number().min(0, "Must be ≥ 0"),
});

export type InventoryItemValues = z.infer<typeof inventoryItemSchema>;

export const stockMoveSchema = z.object({
  inventory_item_id: z.string().uuid("Select an item"),
  direction: z.enum(["in", "out"]),
  quantity: z.coerce.number().gt(0, "Must be > 0"),
  notes: z.string().trim().max(500, "Max 500 characters").optional().or(z.literal("")),
});

export type StockMoveValues = z.infer<typeof stockMoveSchema>;
