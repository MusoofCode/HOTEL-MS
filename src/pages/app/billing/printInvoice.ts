import { supabase } from "@/integrations/supabase/client";
import { renderPrintWindow, type PrintWindowHandle } from "@/lib/print";
import { logActivity } from "@/lib/activityLog";

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
            ${r.map((c, i) => `<td class="${right.has(i) ? "num" : ""}">${esc(String(c))}</td>`).join("")}
          </tr>`,
          )
          .join("\n")}
      </tbody>
    </table>
  `;
}

export async function printInvoice({
  invoiceId,
  w,
}: {
  invoiceId: string;
  w: PrintWindowHandle;
}) {
  // Fetch invoice + items.
  const [invRes, itemsRes, settingsRes] = await Promise.all([
    supabase.from("billing_invoices").select("id,invoice_no,status,total,subtotal,notes,created_at,customer_id,reservation_id").eq("id", invoiceId).single(),
    supabase.from("billing_invoice_items").select("description,quantity,unit_price,line_total").eq("invoice_id", invoiceId).order("created_at"),
    supabase.from("hotel_settings").select("hotel_name,legal_name,address,phone,email,currency_code").order("created_at", { ascending: true }).limit(1).maybeSingle(),
  ]);
  if (invRes.error) throw invRes.error;
  if (itemsRes.error) throw itemsRes.error;

  const inv = invRes.data;
  const items = itemsRes.data ?? [];
  const settings = settingsRes.data ?? null;

  const [custRes, resvRes] = await Promise.all([
    inv.customer_id
      ? supabase.from("customers").select("first_name,last_name,email,phone,address").eq("id", inv.customer_id).maybeSingle()
      : Promise.resolve({ data: null, error: null } as any),
    inv.reservation_id
      ? supabase
          .from("reservation_details")
          .select("id,first_name,last_name,room_number,check_in_date,check_out_date")
          .eq("id", inv.reservation_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null } as any),
  ]);

  if (custRes.error) throw custRes.error;
  if (resvRes.error) throw resvRes.error;

  const customer = custRes.data;
  const reservation = resvRes.data;

  const currency = String(settings?.currency_code ?? "USD");
  const created = String(inv.created_at ?? "").slice(0, 10);

  const itemsRows = items.map((it: any) => [
    String(it.description ?? ""),
    Number(it.quantity ?? 0),
    `${currency} ${Number(it.unit_price ?? 0).toFixed(2)}`,
    `${currency} ${Number(it.line_total ?? Number(it.quantity ?? 0) * Number(it.unit_price ?? 0)).toFixed(2)}`,
  ]);

  const metaHtml = `
    <div style="padding:12px">
      <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <div>
          <div style="font-weight:700">Bill to</div>
          <div class="muted" style="margin-top:4px">
            ${esc(
              customer
                ? `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || "Customer"
                : reservation
                  ? `${reservation.first_name ?? ""} ${reservation.last_name ?? ""}`.trim() || "Guest"
                  : "—",
            )}
          </div>
          ${customer?.email ? `<div class="muted">${esc(String(customer.email))}</div>` : ""}
          ${customer?.phone ? `<div class="muted">${esc(String(customer.phone))}</div>` : ""}
          ${customer?.address ? `<div class="muted">${esc(String(customer.address))}</div>` : ""}
        </div>

        <div style="min-width:220px">
          <div class="badge">Status: ${esc(String(inv.status ?? "draft"))}</div>
          <div style="margin-top:10px" class="muted">
            <div><strong>Invoice #</strong> ${esc(inv.invoice_no || "—")}</div>
            <div><strong>Date</strong> ${esc(created)}</div>
            ${reservation ? `<div><strong>Room</strong> ${esc(String(reservation.room_number ?? "—"))}</div>` : ""}
          </div>
        </div>
      </div>

      ${inv.notes ? `<div style="margin-top:12px" class="muted"><strong>Notes:</strong> ${esc(String(inv.notes))}</div>` : ""}
    </div>
  `;

  const totalsHtml = `
    <div style="padding:12px;display:flex;justify-content:flex-end">
      <div style="min-width:260px;display:grid;gap:6px">
        <div style="display:flex;justify-content:space-between" class="muted"><span>Subtotal</span><span>${currency} ${Number(inv.subtotal ?? inv.total ?? 0).toFixed(2)}</span></div>
        <div style="display:flex;justify-content:space-between;font-weight:700"><span>Total</span><span>${currency} ${Number(inv.total ?? 0).toFixed(2)}</span></div>
      </div>
    </div>
  `;

  const footerHtml = `
    <div style="padding:12px" class="muted">
      ${settings?.legal_name ? `<div><strong>${esc(String(settings.legal_name))}</strong></div>` : ""}
      ${settings?.address ? `<div>${esc(String(settings.address))}</div>` : ""}
      <div style="margin-top:6px">
        ${settings?.email ? esc(String(settings.email)) : ""}${settings?.email && settings?.phone ? " · " : ""}${settings?.phone ? esc(String(settings.phone)) : ""}
      </div>
      <div style="margin-top:10px">Thank you for your business.</div>
    </div>
  `;

  renderPrintWindow(w, {
    title: settings?.hotel_name ? String(settings.hotel_name) : "Invoice",
    subtitle: "Invoice",
    sections: [
      {
        title: "Invoice",
        html: metaHtml,
      },
      {
        title: "Line items",
        html: `${table(["Description", "Qty", "Unit", "Line total"], itemsRows, [1, 2, 3])}${totalsHtml}${footerHtml}`,
      },
    ],
  });

  await logActivity({
    action: "invoice_printed",
    entity: "billing_invoices",
    entity_id: invoiceId,
    metadata: { invoice_no: inv.invoice_no || null },
  });
}
