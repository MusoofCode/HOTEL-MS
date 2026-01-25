import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function InvoicesTableCard({
  invoices,
  isLoading,
}: {
  invoices: Array<any>;
  isLoading: boolean;
}) {
  return (
    <Card className="shadow-soft animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Invoices</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(invoices ?? []).map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.invoice_no || "—"}</TableCell>
                <TableCell className="capitalize">{String(inv.status ?? "draft")}</TableCell>
                <TableCell className="text-right">${Number(inv.total ?? 0).toFixed(2)}</TableCell>
                <TableCell className="text-right">{String(inv.created_at ?? "").slice(0, 10)}</TableCell>
              </TableRow>
            ))}

            {!isLoading && (invoices ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No invoices yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
