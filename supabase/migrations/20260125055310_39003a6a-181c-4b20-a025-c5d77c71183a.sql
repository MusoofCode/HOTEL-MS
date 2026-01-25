-- Integrity + automation triggers

-- 1) Reservations: compute amounts + validate dates
DROP TRIGGER IF EXISTS reservations_compute_amounts ON public.reservations;
CREATE TRIGGER reservations_compute_amounts
BEFORE INSERT OR UPDATE OF room_id, check_in_date, check_out_date
ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.compute_reservation_amounts();

-- 2) Payments: enforce full-only payment
DROP TRIGGER IF EXISTS payments_validate_full_payment ON public.payments;
CREATE TRIGGER payments_validate_full_payment
BEFORE INSERT OR UPDATE OF amount, reservation_id
ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.validate_full_payment();

-- 3) Inventory transactions: apply stock delta atomically
DROP TRIGGER IF EXISTS inventory_transactions_apply ON public.inventory_transactions;
CREATE TRIGGER inventory_transactions_apply
BEFORE INSERT
ON public.inventory_transactions
FOR EACH ROW
EXECUTE FUNCTION public.apply_inventory_transaction();

-- 4) Hard block double-bookings for same room when confirmed/checked_in
-- Uses daterange overlap (&&) with an exclusion constraint.
-- Note: relies on btree_gist extension already present in this project.
ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_no_overlap;

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_no_overlap
  EXCLUDE USING gist (
    room_id WITH =,
    daterange(check_in_date, check_out_date, '[)') WITH &&
  )
  WHERE (status IN ('confirmed','checked_in'));
