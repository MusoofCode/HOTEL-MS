-- Bootstrap roles table + admin helpers (previous migration rolled back)

create extension if not exists pgcrypto;

DO $$ BEGIN
  create type public.app_role as enum ('admin');
EXCEPTION when duplicate_object then null; END $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(auth.uid(), 'admin')
$$;

drop policy if exists "Admin can read roles" on public.user_roles;
create policy "Admin can read roles"
on public.user_roles
for select
to authenticated
using (public.is_admin());

drop policy if exists "No direct role writes" on public.user_roles;
create policy "No direct role writes"
on public.user_roles
for all
to authenticated
using (false)
with check (false);
