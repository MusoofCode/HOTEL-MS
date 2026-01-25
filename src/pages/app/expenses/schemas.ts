import { z } from "zod";

export const expenseSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(200, "Max 200 characters"),
  amount: z.coerce.number().gt(0, "Amount must be > 0"),
  category: z.enum(["utilities", "supplies", "maintenance", "payroll", "marketing", "other"]),
  expense_date: z.string().min(1, "Date is required"),
});

export type ExpenseValues = z.infer<typeof expenseSchema>;
