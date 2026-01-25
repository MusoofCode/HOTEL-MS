-- Billing invoices (manual billing entries) + line items with computed totals

CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  reservation_id uuid NULL REFERENCES public.reservations(id) ON DELETE SET NULL,
  customer_id uuid NULL REFERENCES public.customers(id) ON DELETE SET NULL,

  invoice_no text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  notes text NULL,

  subtotal numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_created_at ON public.billing_invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_customer_id ON public.billing_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_reservation_id ON public.billing_invoices(reservation_id);

CREATE TABLE IF NOT EXISTS public.billing_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  invoice_id uuid NOT NULL REFERENCES public.billing_invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_billing_invoice_items_invoice_id ON public.billing_invoice_items(invoice_id);

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS set_billing_invoices_updated_at ON public.billing_invoices;
CREATE TRIGGER set_billing_invoices_updated_at
BEFORE UPDATE ON public.billing_invoices
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_billing_invoice_items_updated_at ON public.billing_invoice_items;
CREATE TRIGGER set_billing_invoice_items_updated_at
BEFORE UPDATE ON public.billing_invoice_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Compute totals from items (no manual math)
CREATE OR REPLACE FUNCTION public.recompute_invoice_totals(_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  v_subtotal numeric;
begin
  select coalesce(sum(round(coalesce(quantity,0) * coalesce(unit_price,0), 2)), 0)
    into v_subtotal
  from public.billing_invoice_items
  where invoice_id = _invoice_id;

  update public.billing_invoices
     set subtotal = round(v_subtotal, 2),
         total = round(v_subtotal, 2),
         updated_at = now()
   where id = _invoice_id;
end;
$$;

CREATE OR REPLACE FUNCTION public.sync_invoice_totals_from_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  if (tg_op = 'INSERT') then
    update public.billing_invoice_items
      set line_total = round(new.quantity * new.unit_price, 2),
          updated_at = now()
    where id = new.id;
    perform public.recompute_invoice_totals(new.invoice_id);
    return new;
  elsif (tg_op = 'UPDATE') then
    update public.billing_invoice_items
      set line_total = round(new.quantity * new.unit_price, 2),
          updated_at = now()
    where id = new.id;
    perform public.recompute_invoice_totals(new.invoice_id);
    return new;
  elsif (tg_op = 'DELETE') then
    perform public.recompute_invoice_totals(old.invoice_id);
    return old;
  end if;

  return null;
end;
$$;

DROP TRIGGER IF EXISTS trg_sync_invoice_items_totals ON public.billing_invoice_items;
CREATE TRIGGER trg_sync_invoice_items_totals
AFTER INSERT OR UPDATE OR DELETE ON public.billing_invoice_items
FOR EACH ROW EXECUTE FUNCTION public.sync_invoice_totals_from_items();

-- Enable RLS (admin-only)
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_billing_invoices ON public.billing_invoices;
CREATE POLICY admin_all_billing_invoices
ON public.billing_invoices
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS admin_all_billing_invoice_items ON public.billing_invoice_items;
CREATE POLICY admin_all_billing_invoice_items
ON public.billing_invoice_items
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());
