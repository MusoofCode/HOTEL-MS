import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { ReceiptUploadButton } from "@/pages/app/expenses/ReceiptUploadButton";
import { Eye } from "lucide-react";

export type ExpenseRow = {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  receipt_path: string | null;
  created_at: string;
};

export function ExpensesTableCard({
  rows,
  isLoading,
  onEdit,
  onDelete,
  onReceiptUploaded,
  onViewDetails,
}: {
  rows: ExpenseRow[];
  isLoading: boolean;
  onEdit: (r: ExpenseRow) => void;
  onDelete: (r: ExpenseRow) => void | Promise<void>;
  onReceiptUploaded: (id: string, receiptPath: string) => void;
  onViewDetails?: (r: ExpenseRow) => void;
}) {
  return (
    <Card className="shadow-soft animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Expenses</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow 
                key={r.id}
                className="cursor-pointer"
                onClick={() => onViewDetails?.(r)}
              >
                <TableCell className="font-medium">
                  {r.description}
                  <div className="mt-1 text-xs text-muted-foreground">{r.receipt_path ? "Receipt attached" : "No receipt"}</div>
                </TableCell>
                <TableCell className="capitalize">{String(r.category).replace("_", " ")}</TableCell>
                <TableCell>{r.expense_date}</TableCell>
                <TableCell className="text-right">${Number(r.amount).toFixed(2)}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails?.(r)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <ReceiptUploadButton expenseId={r.id} onUploaded={(p) => onReceiptUploaded(r.id, p)} />
                    <Button variant="outline" size="sm" onClick={() => onEdit(r)}>
                      Edit
                    </Button>
                    <ConfirmDialog
                      title="Delete expense?"
                      description="This permanently deletes the expense record."
                      confirmLabel="Delete"
                      onConfirm={() => onDelete(r)}
                    >
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </ConfirmDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {!isLoading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No expenses yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
