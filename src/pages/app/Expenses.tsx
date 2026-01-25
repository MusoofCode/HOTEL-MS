import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/pages/app/_ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

import { ExpenseDialog } from "@/pages/app/expenses/ExpenseDialog";
import { ExpensesTableCard, type ExpenseRow } from "@/pages/app/expenses/ExpensesTableCard";
import type { ExpenseValues } from "@/pages/app/expenses/schemas";

export default function Expenses() {
  const qc = useQueryClient();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ExpenseRow | null>(null);

  const expenses = useQuery({
    queryKey: ["expenses", q],
    queryFn: async () => {
      let query = supabase
        .from("expenses")
        .select("id,description,amount,category,expense_date,receipt_path,created_at")
        .order("expense_date", { ascending: false });
      const trimmed = q.trim();
      if (trimmed) query = query.ilike("description", `%${trimmed}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ExpenseRow[];
    },
  });

  const createExpense = useMutation({
    mutationFn: async (values: ExpenseValues) => {
      const payload = {
        description: values.description,
        amount: Number(values.amount),
        category: values.category,
        expense_date: values.expense_date,
      };
      const { error } = await supabase.from("expenses").insert([payload]);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["expenses"] });
      toast("Expense created");
      setOpen(false);
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ExpenseValues }) => {
      const payload = {
        description: values.description,
        amount: Number(values.amount),
        category: values.category,
        expense_date: values.expense_date,
      };
      const { error } = await supabase.from("expenses").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["expenses"] });
      toast("Expense updated");
      setEditing(null);
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["expenses"] });
      toast("Expense deleted");
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  const attachReceipt = useMutation({
    mutationFn: async ({ id, path }: { id: string; path: string }) => {
      const { error } = await supabase.from("expenses").update({ receipt_path: path }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Expenses"
        subtitle="Categorized operational expenses with receipts."
        actions={
          <Button
            variant="hero"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            New expense
          </Button>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search expenses…" />
        </div>
        <div className="text-sm text-muted-foreground">
          {expenses.isLoading ? "Loading…" : `${(expenses.data ?? []).length} expenses`}
        </div>
      </div>

      <ExpensesTableCard
        rows={expenses.data ?? []}
        isLoading={expenses.isLoading}
        onEdit={(r) => setEditing(r)}
        onDelete={(r) => deleteExpense.mutate(r.id)}
        onReceiptUploaded={(id, path) => attachReceipt.mutate({ id, path })}
      />

      <ExpenseDialog
        mode="create"
        open={open}
        onOpenChange={setOpen}
        onSubmit={(v) => createExpense.mutate(v)}
        isSaving={createExpense.isPending}
      />

      <ExpenseDialog
        mode="edit"
        open={Boolean(editing)}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
        initialValues={
          editing
            ? {
                description: editing.description,
                amount: editing.amount,
                category: editing.category as any,
                expense_date: editing.expense_date,
              }
            : undefined
        }
        onSubmit={(v) => {
          if (!editing) return;
          updateExpense.mutate({ id: editing.id, values: v });
        }}
        isSaving={updateExpense.isPending}
      />
    </div>
  );
}
