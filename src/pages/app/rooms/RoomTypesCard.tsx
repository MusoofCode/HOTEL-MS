import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";

export function RoomTypesCard({
  types,
  isLoading,
  onEdit,
  onDelete,
  usageByTypeId,
}: {
  types: Array<{ id: string; name: string; base_rate: number; max_occupancy: number }>;
  isLoading: boolean;
  onEdit?: (t: { id: string; name: string; base_rate: number; max_occupancy: number }) => void;
  onDelete?: (t: { id: string; name: string; base_rate: number; max_occupancy: number }) => void | Promise<void>;
  usageByTypeId?: Map<string, number>;
}) {
  return (
    <Card className="shadow-soft animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Room types</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead className="text-right">Max</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <div className="font-medium">{t.name}</div>
                  {usageByTypeId?.get(t.id) ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      In use by {usageByTypeId.get(t.id)} room(s)
                    </div>
                  ) : null}
                  <div className="mt-1 break-all text-xs text-muted-foreground">{t.id}</div>
                </TableCell>
                <TableCell>${Number(t.base_rate).toFixed(2)}</TableCell>
                <TableCell className="text-right">{t.max_occupancy}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit?.(t)}>
                      Edit
                    </Button>
                    {usageByTypeId?.get(t.id) ? (
                      <Button variant="destructive" size="sm" disabled>
                        Delete
                      </Button>
                    ) : (
                      <ConfirmDialog
                        title="Delete room type?"
                        description="This removes the room type. You may need to delete rooms using it first."
                        confirmLabel="Delete"
                        onConfirm={() => onDelete?.(t)}
                      >
                        <Button variant="destructive" size="sm">
                          Delete
                        </Button>
                      </ConfirmDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {!isLoading && types.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No room types yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
