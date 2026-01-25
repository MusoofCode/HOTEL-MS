import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function RoomsCard({
  rooms,
  isLoading,
}: {
  rooms: Array<{
    id: string;
    room_number: string;
    rate_override: number | null;
    room_types?: { name: string; base_rate: number } | null;
  }>;
  isLoading: boolean;
}) {
  return (
    <Card className="shadow-soft">
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.room_number}</TableCell>
                <TableCell>{r.room_types?.name ?? "—"}</TableCell>
                <TableCell className="text-right">${Number(r.rate_override ?? r.room_types?.base_rate ?? 0).toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {!isLoading && rooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
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
