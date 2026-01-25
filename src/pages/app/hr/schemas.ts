import { z } from "zod";

export const hrSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required").max(120, "Max 120 characters"),
  role_title: z.string().trim().max(120, "Max 120 characters").optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().trim().max(50, "Max 50 characters").optional().or(z.literal("")),
  salary_monthly: z.coerce.number().min(0, "Must be ≥ 0").optional().or(z.nan()),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(2000, "Max 2000 characters").optional().or(z.literal("")),
});

export type HrValues = z.infer<typeof hrSchema>;
