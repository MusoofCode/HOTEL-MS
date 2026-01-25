import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function RoomTypesCard({
  types,
  isLoading,
}: {
  types: Array<{ id: string; name: string; base_rate: number; max_occupancy: number }>;
  isLoading: boolean;
}) {
  return (
    <Card className="shadow-soft">
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <div className="font-medium">{t.name}</div>
                  <div className="mt-1 break-all text-xs text-muted-foreground">{t.id}</div>
                </TableCell>
                <TableCell>${Number(t.base_rate).toFixed(2)}</TableCell>
                <TableCell className="text-right">{t.max_occupancy}</TableCell>
              </TableRow>
            ))}

            {!isLoading && types.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
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
