import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";

export type HrRow = {
  id: string;
  full_name: string;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  salary_monthly: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export function HrTableCard({
  rows,
  isLoading,
  onEdit,
  onDelete,
}: {
  rows: HrRow[];
  isLoading: boolean;
  onEdit: (r: HrRow) => void;
  onDelete: (r: HrRow) => void | Promise<void>;
}) {
  return (
    <Card className="shadow-soft animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Staff records</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.full_name}</TableCell>
                <TableCell>{r.role_title ?? "—"}</TableCell>
                <TableCell>{r.email ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(r)}>
                      Edit
                    </Button>
                    <ConfirmDialog
                      title="Delete staff record?"
                      description="This permanently deletes the staff record."
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
                <TableCell colSpan={4} className="text-muted-foreground">
                  No HR records yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
