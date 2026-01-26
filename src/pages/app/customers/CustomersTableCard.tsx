import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { Eye } from "lucide-react";

export type CustomerRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
};

export function CustomersTableCard({
  customers,
  isLoading,
  onEdit,
  onDelete,
  onViewDetails,
}: {
  customers: CustomerRow[];
  isLoading: boolean;
  onEdit: (customer: CustomerRow) => void;
  onDelete: (customer: CustomerRow) => void | Promise<void>;
  onViewDetails?: (customer: CustomerRow) => void;
}) {
  return (
    <Card className="shadow-soft animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Customers</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow 
                key={c.id}
                className="cursor-pointer"
                onClick={() => onViewDetails?.(c)}
              >
                <TableCell className="font-medium">
                  {c.first_name} {c.last_name}
                </TableCell>
                <TableCell>{c.email ?? "—"}</TableCell>
                <TableCell>{c.phone ?? "—"}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails?.(c)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onEdit(c)}>
                      Edit
                    </Button>
                    <ConfirmDialog
                      title="Delete customer?"
                      description="This permanently removes the customer record."
                      confirmLabel="Delete"
                      onConfirm={() => onDelete(c)}
                    >
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </ConfirmDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {!isLoading && customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No customers yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
