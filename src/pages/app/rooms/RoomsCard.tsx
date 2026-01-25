import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";

export function RoomsCard({
  rooms,
  isLoading,
  onEdit,
  onDelete,
}: {
  rooms: Array<{
    id: string;
    room_number: string;
    rate_override: number | null;
    room_types?: { name: string; base_rate: number } | null;
    room_type_id?: string;
  }>;
  isLoading: boolean;
  onEdit?: (r: any) => void;
  onDelete?: (r: any) => void | Promise<void>;
}) {
  return (
    <Card className="shadow-soft animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Rooms</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.room_number}</TableCell>
                <TableCell>{r.room_types?.name ?? "—"}</TableCell>
                <TableCell className="text-right">${Number(r.rate_override ?? r.room_types?.base_rate ?? 0).toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit?.(r)}>
                      Edit
                    </Button>
                    <ConfirmDialog
                      title="Delete room?"
                      description="This removes the room record. Existing reservation history remains."
                      confirmLabel="Delete"
                      onConfirm={() => onDelete?.(r)}
                    >
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </ConfirmDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && rooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No rooms yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
