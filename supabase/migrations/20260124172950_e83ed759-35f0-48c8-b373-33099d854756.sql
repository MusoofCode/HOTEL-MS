-- Core HMS schema (admin-only)

create extension if not exists btree_gist;

DO $$ BEGIN
  create type public.room_status as enum ('active','maintenance','out_of_service');
EXCEPTION when duplicate_object then null; END $$;

DO $$ BEGIN
  create type public.reservation_status as enum ('draft','confirmed','checked_in','checked_out','cancelled');
EXCEPTION when duplicate_object then null; END $$;

DO $$ BEGIN
  create type public.payment_method as enum ('cash','transfer','card','other');
EXCEPTION when duplicate_object then null; END $$;

DO $$ BEGIN
  create type public.expense_category as enum ('utilities','maintenance','supplies','payroll','marketing','taxes','other');
EXCEPTION when duplicate_object then null; END $$;

create table if not exists public.hotel_settings (
  id uuid primary key default gen_random_uuid(),
  hotel_name text not null,
  legal_name text,
  address text,
  phone text,
  email text,
  currency_code text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_rate numeric(12,2) not null,
  max_occupancy int not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_number text not null,
  room_type_id uuid not null references public.room_types(id) on delete restrict,
  rate_override numeric(12,2),
  status public.room_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_number)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  check_in_date date not null,
  check_out_date date not null,
  status public.reservation_status not null default 'draft',
  nightly_rate_used numeric(12,2) not null default 0,
  nights int not null default 0,
  total_amount numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reservations drop constraint if exists reservations_no_overlap;
alter table public.reservations
  add constraint reservations_no_overlap
  exclude using gist (
    room_id with =,
    daterange(check_in_date, check_out_date, '[)') with &&
  )
  where (status in ('confirmed','checked_in'));

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  method public.payment_method not null,
  amount numeric(12,2) not null,
  paid_at timestamptz not null default now(),
  reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reservation_id)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category public.expense_category not null default 'other',
  description text not null,
  amount numeric(12,2) not null,
  expense_date date not null default (now()::date),
  receipt_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null default 'unit',
  current_stock numeric(12,2) not null default 0,
  reorder_level numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  quantity numeric(12,2) not null,
  direction text not null,
  occurred_at timestamptz not null default now(),
  related_reservation_id uuid references public.reservations(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_records (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role_title text,
  phone text,
  email text,
  start_date date,
  end_date date,
  salary_monthly numeric(12,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null,
  action text not null,
  entity text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.compute_reservation_amounts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rate numeric(12,2);
  v_nights int;
begin
  if (new.check_out_date <= new.check_in_date) then
    raise exception 'check_out_date must be after check_in_date';
  end if;

  select coalesce(r.rate_override, rt.base_rate)
    into v_rate
  from public.rooms r
  join public.room_types rt on rt.id = r.room_type_id
  where r.id = new.room_id;

  if v_rate is null then
    raise exception 'Invalid room_id or missing rate';
  end if;

  v_nights := (new.check_out_date - new.check_in_date);

  new.nightly_rate_used := v_rate;
  new.nights := v_nights;
  new.total_amount := round(v_rate * v_nights, 2);
  new.balance_due := new.total_amount;

  return new;
end;
$$;

create or replace function public.validate_full_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric(12,2);
begin
  select total_amount into v_total from public.reservations where id = new.reservation_id;
  if v_total is null then
    raise exception 'Invalid reservation_id';
  end if;
  if round(new.amount, 2) <> round(v_total, 2) then
    raise exception 'Payment amount must equal reservation total (%).', v_total;
  end if;
  return new;
end;
$$;

create or replace function public.apply_inventory_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delta numeric(12,2);
  v_new numeric(12,2);
begin
  if new.quantity <= 0 then
    raise exception 'quantity must be > 0';
  end if;
  if new.direction not in ('in','out') then
    raise exception 'direction must be in or out';
  end if;

  v_delta := case when new.direction = 'in' then new.quantity else -new.quantity end;

  update public.inventory_items
     set current_stock = current_stock + v_delta,
         updated_at = now()
   where id = new.inventory_item_id
   returning current_stock into v_new;

  if v_new is null then
    raise exception 'Invalid inventory_item_id';
  end if;

  if v_new < 0 then
    raise exception 'Stock cannot go negative';
  end if;

  return new;
end;
$$;

DO $$ BEGIN
  drop trigger if exists trg_room_types_updated_at on public.room_types;
  create trigger trg_room_types_updated_at before update on public.room_types
  for each row execute function public.set_updated_at();

  drop trigger if exists trg_rooms_updated_at on public.rooms;
  create trigger trg_rooms_updated_at before update on public.rooms
  for each row execute function public.set_updated_at();

  drop trigger if exists trg_customers_updated_at on public.customers;
  create trigger trg_customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

  drop trigger if exists trg_reservations_updated_at on public.reservations;
  create trigger trg_reservations_updated_at before update on public.reservations
  for each row execute function public.set_updated_at();

  drop trigger if exists trg_reservations_amounts on public.reservations;
  create trigger trg_reservations_amounts before insert or update of room_id, check_in_date, check_out_date
  on public.reservations for each row execute function public.compute_reservation_amounts();

  drop trigger if exists trg_payments_updated_at on public.payments;
  create trigger trg_payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

  drop trigger if exists trg_payments_full_only on public.payments;
  create trigger trg_payments_full_only before insert or update of amount, reservation_id
  on public.payments for each row execute function public.validate_full_payment();

  drop trigger if exists trg_expenses_updated_at on public.expenses;
  create trigger trg_expenses_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

  drop trigger if exists trg_inventory_items_updated_at on public.inventory_items;
  create trigger trg_inventory_items_updated_at before update on public.inventory_items
  for each row execute function public.set_updated_at();

  drop trigger if exists trg_hr_records_updated_at on public.hr_records;
  create trigger trg_hr_records_updated_at before update on public.hr_records
  for each row execute function public.set_updated_at();

  drop trigger if exists trg_inventory_apply_tx on public.inventory_transactions;
  create trigger trg_inventory_apply_tx after insert on public.inventory_transactions
  for each row execute function public.apply_inventory_transaction();
EXCEPTION when undefined_table then null; END $$;

create or replace view public.low_stock_items as
select * from public.inventory_items where current_stock <= reorder_level;

create or replace view public.reservation_details as
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

-- RLS
alter table public.hotel_settings enable row level security;
alter table public.room_types enable row level security;
alter table public.rooms enable row level security;
alter table public.customers enable row level security;
alter table public.reservations enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.hr_records enable row level security;
alter table public.activity_logs enable row level security;

DO $$
declare
  t text;
begin
  foreach t in array array[
    'hotel_settings','room_types','rooms','customers','reservations','payments','expenses','inventory_items','inventory_transactions','hr_records','activity_logs'
  ]
  loop
    execute format('drop policy if exists "admin_all_%s" on public.%I', t, t);
    execute format('create policy "admin_all_%s" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;

-- Realtime
DO $$ BEGIN
  alter publication supabase_realtime add table public.reservations;
EXCEPTION when duplicate_object then null; END $$;
DO $$ BEGIN
  alter publication supabase_realtime add table public.payments;
EXCEPTION when duplicate_object then null; END $$;
DO $$ BEGIN
  alter publication supabase_realtime add table public.expenses;
EXCEPTION when duplicate_object then null; END $$;
DO $$ BEGIN
  alter publication supabase_realtime add table public.inventory_items;
EXCEPTION when duplicate_object then null; END $$;

-- Storage buckets
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('customer_docs', 'customer_docs', false)
on conflict (id) do nothing;

drop policy if exists "Admin can access hotel files" on storage.objects;
create policy "Admin can access hotel files"
on storage.objects
for all
to authenticated
using (bucket_id in ('receipts','customer_docs') and public.is_admin())
with check (bucket_id in ('receipts','customer_docs') and public.is_admin());
