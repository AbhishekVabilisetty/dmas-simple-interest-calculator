create extension if not exists pgcrypto;

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  entries jsonb not null default '[]'::jsonb,
  end_date text not null default '',
  use_entry_return_dates boolean not null default false,
  rounding_adjustment numeric not null default 0,
  bill_rule_mode text not null default 'global',
  bill_calc_rules jsonb,
  statement_language text not null default 'te',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bills_bill_rule_mode_check
    check (bill_rule_mode in ('global', 'custom')),
  constraint bills_statement_language_check
    check (statement_language in ('en', 'te'))
);

alter table public.bills
  add column if not exists use_entry_return_dates boolean not null default false;

update public.bills
set use_entry_return_dates = true
where exists (
  select 1
  from jsonb_array_elements(entries) as entry
  where coalesce(entry ->> 'endDate', entry ->> 'returnDate', '') <> ''
);

create index if not exists bills_user_updated_idx
  on public.bills (user_id, updated_at desc);

create or replace function public.set_bills_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists bills_set_updated_at on public.bills;

create trigger bills_set_updated_at
before update on public.bills
for each row
execute function public.set_bills_updated_at();

alter table public.bills enable row level security;

drop policy if exists "Users can view their own bills" on public.bills;
create policy "Users can view their own bills"
on public.bills
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own bills" on public.bills;
create policy "Users can insert their own bills"
on public.bills
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own bills" on public.bills;
create policy "Users can update their own bills"
on public.bills
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own bills" on public.bills;
create policy "Users can delete their own bills"
on public.bills
for delete
using (auth.uid() = user_id);
