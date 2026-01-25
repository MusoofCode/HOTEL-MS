import * as React from "react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { renderPrintWindow, type PrintWindowHandle } from "@/lib/print";
import { logActivity } from "@/lib/activityLog";

type DailyRow = {
  date: string;
  income: number;
  expenses: number;
  net: number;
  payments_count: number;
  expenses_count: number;
};

type SectionKey = "financial" | "expenses" | "hr" | "inventory" | "billing";

const sectionLabels: Record<SectionKey, string> = {
  financial: "Financial summary",
  expenses: "Expenses list",
  hr: "HR list",
  inventory: "Inventory list",
  billing: "Billing overview",
};

function esc(s: string) {
  return s
    .split("&")
    .join("&amp;")
    .split("<")
    .join("&lt;")
    .split(">")
    .join("&gt;")
    .split('"')
    .join("&quot;");
}

function table(headers: string[], rows: Array<Array<string | number>>, rightAlignedCols: number[] = []) {
  const right = new Set(rightAlignedCols);
  return `
    <table>
      <thead>
        <tr>
          ${headers.map((h, i) => `<th class="${right.has(i) ? "num" : ""}">${esc(h)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (r) => `
          <tr>
            ${r
              .map((c, i) => `<td class="${right.has(i) ? "num" : ""}">${esc(String(c))}</td>`)
              .join("")}
          </tr>`,
          )
          .join("\n")}
      </tbody>
    </table>
  `;
}

export function PrintReportDialog({
  open,
  onOpenChange,
  from,
  to,
  dailyRows,
  totals,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  from: string;
  to: string;
  dailyRows: DailyRow[];
  totals: { income: number; expenses: number; net: number };
}) {
  const [selected, setSelected] = React.useState<Record<SectionKey, boolean>>({
    financial: true,
    expenses: false,
    hr: false,
    inventory: false,
    billing: false,
  });

  React.useEffect(() => {
    if (open) {
      setSelected({ financial: true, expenses: false, hr: false, inventory: false, billing: false });
    }
  }, [open]);

  const printMutation = useMutation({
    mutationFn: async (w: PrintWindowHandle) => {
      const keys = (Object.keys(selected) as SectionKey[]).filter((k) => selected[k]);
      if (keys.length === 0) throw new Error("Select at least one section");

      const sections: Array<{ title: string; html: string }> = [];

      if (selected.financial) {
        sections.push({
          title: sectionLabels.financial,
          html: `
            <div style="padding:12px 12px 0 12px" class="muted">Range: ${esc(from)} → ${esc(to)}</div>
            ${table(
              ["Date", "Income", "Expenses", "Net"],
              dailyRows.map((r) => [r.date, `$${r.income.toFixed(2)}`, `$${r.expenses.toFixed(2)}`, `$${r.net.toFixed(2)}`]),
              [1, 2, 3],
            )}
            <div style="padding:12px" class="muted">
              <span class="badge">Total income: $${totals.income.toFixed(2)}</span>
              <span style="margin-left:8px" class="badge">Total expenses: $${totals.expenses.toFixed(2)}</span>
              <span style="margin-left:8px" class="badge">Net: $${totals.net.toFixed(2)}</span>
            </div>
          `,
        });
      }

      const promises: Array<Promise<any>> = [];
      const wantExpenses = selected.expenses;
      const wantHr = selected.hr;
      const wantInventory = selected.inventory;
      const wantBilling = selected.billing;

      if (wantExpenses) {
        promises.push(
          supabase
            .from("expenses")
            .select("expense_date,category,description,amount")
            .gte("expense_date", from)
            .lte("expense_date", to)
            .order("expense_date", { ascending: false }) as unknown as Promise<any>,
        );
      }
      if (wantHr) {
        promises.push(
          supabase
            .from("hr_records")
            .select("full_name,role_title,email,phone,start_date,end_date")
            .order("full_name") as unknown as Promise<any>,
        );
      }
      if (wantInventory) {
        promises.push(
          supabase
            .from("inventory_items")
            .select("name,current_stock,reorder_level,unit")
            .order("name") as unknown as Promise<any>,
        );
        promises.push(
          supabase
            .from("low_stock_items")
            .select("name,current_stock,reorder_level,unit")
            .order("name") as unknown as Promise<any>,
        );
      }
      if (wantBilling) {
        promises.push(
          supabase
            .from("reservation_details")
            .select("id,first_name,last_name,room_number,total_amount,balance_due,status")
            .gt("balance_due", 0)
            .in("status", ["confirmed", "checked_in", "checked_out"])
            .order("balance_due", { ascending: false }) as unknown as Promise<any>,
        );
        promises.push(
          supabase
            .from("billing_invoices")
            .select("invoice_no,status,total,created_at")
            .order("created_at", { ascending: false })
            .limit(50) as unknown as Promise<any>,
        );
      }

      const results = await Promise.all(promises);
      let cursor = 0;

      if (wantExpenses) {
        const res = results[cursor++];
        if (res.error) throw res.error;
        const rows = (res.data ?? []).map((e: any) => [
          e.expense_date,
          String(e.category ?? "other"),
          String(e.description ?? ""),
          `$${Number(e.amount ?? 0).toFixed(2)}`,
        ]);
        sections.push({
          title: sectionLabels.expenses,
          html: table(["Date", "Category", "Description", "Amount"], rows, [3]),
        });
      }

      if (wantHr) {
        const res = results[cursor++];
        if (res.error) throw res.error;
        const rows = (res.data ?? []).map((h: any) => [
          String(h.full_name ?? ""),
          String(h.role_title ?? ""),
          String(h.email ?? ""),
          String(h.phone ?? ""),
          String(h.start_date ?? ""),
          String(h.end_date ?? ""),
        ]);
        sections.push({
          title: sectionLabels.hr,
          html: table(["Name", "Role", "Email", "Phone", "Start", "End"], rows),
        });
      }

      if (wantInventory) {
        const items = results[cursor++];
        const low = results[cursor++];
        if (items.error) throw items.error;
        if (low.error) throw low.error;

        const itemsRows = (items.data ?? []).map((i: any) => [
          String(i.name ?? ""),
          `${Number(i.current_stock ?? 0)} ${String(i.unit ?? "")}`,
          `${Number(i.reorder_level ?? 0)} ${String(i.unit ?? "")}`,
        ]);
        const lowRows = (low.data ?? []).map((i: any) => [
          String(i.name ?? ""),
          `${Number(i.current_stock ?? 0)} ${String(i.unit ?? "")}`,
          `${Number(i.reorder_level ?? 0)} ${String(i.unit ?? "")}`,
        ]);

        sections.push({
          title: sectionLabels.inventory,
          html: `
            <div style="padding:12px" class="muted">Inventory items</div>
            ${table(["Item", "Current", "Reorder level"], itemsRows, [1, 2])}
            <div style="padding:12px" class="muted">Low stock</div>
            ${table(["Item", "Current", "Reorder level"], lowRows, [1, 2])}
          `,
        });
      }

      if (wantBilling) {
        const due = results[cursor++];
        const inv = results[cursor++];
        if (due.error) throw due.error;
        if (inv.error) throw inv.error;

        const dueRows = (due.data ?? []).map((r: any) => [
          `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(),
          String(r.room_number ?? "—"),
          String(r.status ?? ""),
          `$${Number(r.balance_due ?? 0).toFixed(2)}`,
        ]);

        const invRows = (inv.data ?? []).map((r: any) => [
          r.invoice_no || "—",
          String(r.status ?? "draft"),
          `$${Number(r.total ?? 0).toFixed(2)}`,
          String(r.created_at ?? "").slice(0, 10),
        ]);

        sections.push({
          title: sectionLabels.billing,
          html: `
            <div style="padding:12px" class="muted">Balances due</div>
            ${table(["Guest", "Room", "Status", "Balance"], dueRows, [3])}
            <div style="padding:12px" class="muted">Latest invoices</div>
            ${table(["Invoice #", "Status", "Total", "Created"], invRows, [2, 3])}
          `,
        });
      }

      renderPrintWindow(w, {
        title: "System Report",
        subtitle: "Selected sections",
        sections,
      });

      await logActivity({
        action: "report_printed",
        entity: "reports",
        metadata: { sections: keys.join(",") },
      });
    },
    onError: (e: any) => toast("Print failed", { description: e.message }),
  });

  const selectedCount = (Object.keys(selected) as SectionKey[]).filter((k) => selected[k]).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="animate-enter">
        <DialogHeader>
          <DialogTitle>Print report</DialogTitle>
        </DialogHeader>

        <div className="rounded-2xl border bg-card/70 p-3 text-sm">
          <div className="font-medium">Choose what to print</div>
          <div className="mt-1 text-xs text-muted-foreground">Range used for financial + expenses: {from} → {to}</div>
        </div>

        <ScrollArea className="h-[220px] rounded-2xl border">
          <div className="grid gap-3 p-3">
            {(Object.keys(sectionLabels) as SectionKey[]).map((k) => (
              <label key={k} className="flex items-center justify-between gap-3 rounded-2xl border bg-background/40 px-3 py-2">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selected[k]}
                    onCheckedChange={(v) => setSelected((s) => ({ ...s, [k]: Boolean(v) }))}
                  />
                  <div className="text-sm font-medium">{sectionLabels[k]}</div>
                </div>
                <div className="text-xs text-muted-foreground">{selected[k] ? "Selected" : ""}</div>
              </label>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">Selected: {selectedCount}</div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="hero"
              disabled={printMutation.isPending}
              onClick={() => {
                // Open the window synchronously to avoid popup blockers.
                const w = window.open("", "_blank", "noopener,noreferrer");
                if (!w) {
                  toast("Popup blocked", { description: "Allow popups to print." });
                  return;
                }
                printMutation.mutate(w);
              }}
            >
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
