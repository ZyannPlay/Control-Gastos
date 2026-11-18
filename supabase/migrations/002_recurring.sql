-- Gastos fijos mensuales y compras en cuotas. Re-ejecutable.

create table if not exists public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  kind text not null check (kind in ('fixed', 'installments')),
  type text not null check (type in ('expense', 'income')),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'ARS' check (currency in ('ARS', 'USD')),
  category_id uuid references public.categories on delete set null,
  note text,
  day_of_month int not null check (day_of_month between 1 and 28),
  start_month text not null check (start_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  installments_total int,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (
    (kind = 'installments' and installments_total between 2 and 120)
    or (kind = 'fixed' and installments_total is null)
  )
);

create index if not exists recurring_rules_user_idx on public.recurring_rules (user_id, active);

alter table public.transactions add column if not exists recurring_id uuid references public.recurring_rules on delete set null;
alter table public.transactions add column if not exists period text;
alter table public.transactions add column if not exists installment_number int;

-- Restricción única normal (no parcial) para que el upsert con onConflict de PostgREST funcione.
-- Los NULL no chocan entre sí, así que no afecta a los movimientos comunes.
drop index if exists public.transactions_recurring_period_uidx;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'transactions_recurring_period_key') then
    alter table public.transactions add constraint transactions_recurring_period_key unique (recurring_id, period);
  end if;
end $$;

-- RLS
alter table public.recurring_rules enable row level security;

drop policy if exists "recurring_rules_select" on public.recurring_rules;
drop policy if exists "recurring_rules_insert" on public.recurring_rules;
drop policy if exists "recurring_rules_update" on public.recurring_rules;
drop policy if exists "recurring_rules_delete" on public.recurring_rules;
create policy "recurring_rules_select" on public.recurring_rules for select to authenticated using ((select auth.uid()) = user_id);
create policy "recurring_rules_insert" on public.recurring_rules for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "recurring_rules_update" on public.recurring_rules for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "recurring_rules_delete" on public.recurring_rules for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.recurring_rules to authenticated;
