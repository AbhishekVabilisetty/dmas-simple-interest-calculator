alter table public.bills
  add column if not exists use_entry_return_dates boolean not null default false;

update public.bills
set use_entry_return_dates = true
where exists (
  select 1
  from jsonb_array_elements(entries) as entry
  where coalesce(entry ->> 'endDate', entry ->> 'returnDate', '') <> ''
);
