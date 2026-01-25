import { z } from "zod";

export const customerSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  email: z
    .string()
    .trim()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
