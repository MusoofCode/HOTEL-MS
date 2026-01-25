import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type LowStockRow = {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  reorder_level: number;
};

export function LowStockCard({ rows, isLoading }: { rows: LowStockRow[]; isLoading: boolean }) {
  return (
    <Card className="shadow-soft animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Low stock</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Reorder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-right">
                  {Number(r.current_stock).toFixed(2)} <span className="text-muted-foreground">{r.unit}</span>
                </TableCell>
                <TableCell className="text-right">
                  {Number(r.reorder_level).toFixed(2)} <span className="text-muted-foreground">{r.unit}</span>
                </TableCell>
              </TableRow>
            ))}

            {!isLoading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  No low stock items.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
