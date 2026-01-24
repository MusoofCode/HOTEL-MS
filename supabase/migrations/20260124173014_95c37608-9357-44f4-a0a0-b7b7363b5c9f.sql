-- Fix security linter findings

-- 1) Move extensions out of public schema
create schema if not exists extensions;

DO $$ BEGIN
  alter extension pgcrypto set schema extensions;
EXCEPTION when undefined_object then null; END $$;

DO $$ BEGIN
  alter extension btree_gist set schema extensions;
EXCEPTION when undefined_object then null; END $$;

-- 2) Ensure views run with invoker privileges (not SECURITY DEFINER)
-- Postgres supports SECURITY INVOKER; this satisfies the linter.
DO $$ BEGIN
  execute 'drop view if exists public.low_stock_items';
EXCEPTION when undefined_table then null; END $$;

create view public.low_stock_items
with (security_invoker = true)
as
select * from public.inventory_items where current_stock <= reorder_level;

DO $$ BEGIN
  execute 'drop view if exists public.reservation_details';
EXCEPTION when undefined_table then null; END $$;

create view public.reservation_details
with (security_invoker = true)
as
select
  res.*, 
  r.room_number,
  rt.name as room_type_name,
  c.first_name,
  c.last_name,
  c.email as customer_email,
  c.phone as customer_phone
from public.reservations res
join public.rooms r on r.id = res.room_id
join public.room_types rt on rt.id = r.room_type_id
join public.customers c on c.id = res.customer_id;
