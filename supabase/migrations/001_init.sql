-- Esquema inicial: categorías, movimientos y presupuestos con RLS.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  name text not null,
  icon text not null default '📦',
  color text not null default '#64748b',
  type text not null check (type in ('expense', 'income')),
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  type text not null check (type in ('expense', 'income')),
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'ARS' check (currency in ('ARS', 'USD')),
  fx_rate numeric not null default 1,
  category_id uuid references public.categories on delete set null,
  date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  category_id uuid not null references public.categories on delete cascade,
  month text not null check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'ARS' check (currency in ('ARS', 'USD')),
  created_at timestamptz not null default now(),
  unique (user_id, category_id, month)
);

create index categories_user_idx on public.categories (user_id, type);
create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index transactions_category_idx on public.transactions (category_id);
create index budgets_user_month_idx on public.budgets (user_id, month);

-- RLS
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

create policy "categories_select" on public.categories for select to authenticated using ((select auth.uid()) = user_id);
create policy "categories_insert" on public.categories for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "categories_update" on public.categories for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "categories_delete" on public.categories for delete to authenticated using ((select auth.uid()) = user_id);

create policy "transactions_select" on public.transactions for select to authenticated using ((select auth.uid()) = user_id);
create policy "transactions_insert" on public.transactions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "transactions_update" on public.transactions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "transactions_delete" on public.transactions for delete to authenticated using ((select auth.uid()) = user_id);

create policy "budgets_select" on public.budgets for select to authenticated using ((select auth.uid()) = user_id);
create policy "budgets_insert" on public.budgets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "budgets_update" on public.budgets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "budgets_delete" on public.budgets for delete to authenticated using ((select auth.uid()) = user_id);

-- Categorías por defecto para cada usuario nuevo
create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, icon, color, type) values
    (new.id, 'Comida',          '🍔', '#f97316', 'expense'),
    (new.id, 'Supermercado',    '🛒', '#22c55e', 'expense'),
    (new.id, 'Transporte',      '🚌', '#3b82f6', 'expense'),
    (new.id, 'Casa/Alquiler',   '🏠', '#8b5cf6', 'expense'),
    (new.id, 'Servicios',       '💡', '#eab308', 'expense'),
    (new.id, 'Salud',           '💊', '#ef4444', 'expense'),
    (new.id, 'Ocio',            '🎉', '#ec4899', 'expense'),
    (new.id, 'Ropa',            '👕', '#14b8a6', 'expense'),
    (new.id, 'Educación',       '📚', '#6366f1', 'expense'),
    (new.id, 'Otros',           '📦', '#64748b', 'expense'),
    (new.id, 'Sueldo',          '💼', '#16a34a', 'income'),
    (new.id, 'Freelance',       '💻', '#0ea5e9', 'income'),
    (new.id, 'Otros ingresos',  '💰', '#84cc16', 'income');
  return new;
end;
$$;

create trigger on_auth_user_created_seed_categories
  after insert on auth.users
  for each row execute function public.seed_default_categories();

-- Permisos de la Data API (los proyectos nuevos de Supabase no los otorgan automáticamente).
-- RLS sigue limitando cada fila a su dueño.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.categories, public.transactions, public.budgets to authenticated;
