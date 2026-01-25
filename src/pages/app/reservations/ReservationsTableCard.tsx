import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";

export type ReservationRow = {
  id: string;
  status: string;
  first_name: string | null;
  last_name: string | null;
  room_number: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  nights: number | null;
  total_amount: number | null;
  balance_due: number | null;
};

export function ReservationsTableCard({
  rows,
  isLoading,
  onEdit,
  onCancel,
}: {
  rows: ReservationRow[];
  isLoading: boolean;
  onEdit: (r: ReservationRow) => void;
  onCancel: (r: ReservationRow) => void | Promise<void>;
}) {
  return (
    <Card className="shadow-soft animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Reservations</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  {(r.first_name || "") + " " + (r.last_name || "")}
                </TableCell>
                <TableCell>{r.room_number ?? "—"}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {r.check_in_date ?? "—"} → {r.check_out_date ?? "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.nights ?? 0} nights</div>
                </TableCell>
                <TableCell className="capitalize">{(r.status || "").replace("_", " ")}</TableCell>
                <TableCell className="text-right">${Number(r.total_amount ?? 0).toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(r)}>
                      Edit
                    </Button>
                    <ConfirmDialog
                      title="Cancel reservation?"
                      description="This marks the reservation as cancelled (keeps history)."
                      confirmLabel="Cancel"
                      onConfirm={() => onCancel(r)}
                    >
                      <Button variant="destructive" size="sm">
                        Cancel
                      </Button>
                    </ConfirmDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {!isLoading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No reservations yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
