import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";

export type InventoryItemRow = {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  reorder_level: number;
  updated_at: string;
};

export function InventoryItemsCard({
  items,
  isLoading,
  onEdit,
  onDelete,
}: {
  items: InventoryItemRow[];
  isLoading: boolean;
  onEdit: (item: InventoryItemRow) => void;
  onDelete: (item: InventoryItemRow) => void | Promise<void>;
}) {
  return (
    <Card className="shadow-soft animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Items</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Reorder</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">
                  {i.name}
                  <div className="mt-1 text-xs text-muted-foreground">Unit: {i.unit}</div>
                </TableCell>
                <TableCell>
                  {Number(i.current_stock).toFixed(2)} <span className="text-muted-foreground">{i.unit}</span>
                </TableCell>
                <TableCell>
                  {Number(i.reorder_level).toFixed(2)} <span className="text-muted-foreground">{i.unit}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(i)}>
                      Edit
                    </Button>
                    <ConfirmDialog
                      title="Delete item?"
                      description="This removes the inventory item. Stock history remains in transactions."
                      confirmLabel="Delete"
                      onConfirm={() => onDelete(i)}
                    >
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </ConfirmDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {!isLoading && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No items yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
