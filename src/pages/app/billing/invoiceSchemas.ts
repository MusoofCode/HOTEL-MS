import { z } from "zod";

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Required").max(255),
  quantity: z.coerce.number().positive().default(1),
  unit_price: z.coerce.number().min(0).default(0),
});

export const invoiceSchema = z.object({
  invoice_no: z.string().trim().max(64).optional().or(z.literal("")),
  status: z.enum(["draft", "issued", "paid", "void"]).default("draft"),
  customer_id: z.string().uuid().optional().or(z.literal("")),
  reservation_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  items: z.array(invoiceItemSchema).min(1, "Add at least one item"),
});

export type InvoiceValues = z.infer<typeof invoiceSchema>;
