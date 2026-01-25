import { z } from "zod";

export const reservationSchema = z
  .object({
    customer_id: z.string().uuid("Select a customer"),
    room_id: z.string().uuid("Select a room"),
    check_in_date: z.string().min(1, "Check-in is required"),
    check_out_date: z.string().min(1, "Check-out is required"),
    status: z.enum(["draft", "confirmed", "checked_in", "checked_out", "cancelled"]),
    notes: z.string().trim().max(2000, "Max 2000 characters").optional().or(z.literal("")),
  })
  .refine(
    (v) => {
      const a = new Date(v.check_in_date);
      const b = new Date(v.check_out_date);
      return Number.isFinite(a.getTime()) && Number.isFinite(b.getTime()) && b > a;
    },
    { message: "Check-out must be after check-in", path: ["check_out_date"] },
  );

export type ReservationFormValues = z.infer<typeof reservationSchema>;
