-- Íconos de categorías: de emojis a claves de lucide (ver src/lib/categoryIcons.ts). Re-ejecutable.

-- 1. Migrar emojis conocidos y mandar a 'tag' todo lo que no sea una clave válida.
update public.categories
set icon = case icon
  when '🍔' then 'utensils'
  when '🛒' then 'shopping-cart'
  when '🚌' then 'bus'
  when '🏠' then 'house'
  when '💡' then 'lightbulb'
  when '💊' then 'pill'
  when '🎉' then 'ticket'
  when '👕' then 'shirt'
  when '📚' then 'graduation-cap'
  when '📦' then 'package'
  when '💼' then 'briefcase'
  when '💻' then 'laptop'
  when '💰' then 'wallet'
  else 'tag'
end
where icon not in (
  'utensils', 'shopping-cart', 'bus', 'house', 'lightbulb', 'pill',
  'ticket', 'shirt', 'graduation-cap', 'package', 'briefcase',
  'laptop', 'wallet', 'car', 'fuel', 'plane', 'gift', 'dog', 'heart-pulse',
  'smartphone', 'wifi', 'baby', 'dumbbell', 'coffee', 'receipt',
  'book-open', 'shopping-bag', 'piggy-bank', 'trending-up',
  'bike', 'wrench', 'tag'
);

alter table public.categories alter column icon set default 'package';

-- 2. Semilla para usuarios nuevos: claves lucide y paleta sobria.
create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, icon, color, type) values
    (new.id, 'Comida',          'utensils',       '#f76b15', 'expense'),
    (new.id, 'Supermercado',    'shopping-cart',  '#30a46c', 'expense'),
    (new.id, 'Transporte',      'bus',            '#0090ff', 'expense'),
    (new.id, 'Casa/Alquiler',   'house',          '#6e56cf', 'expense'),
    (new.id, 'Servicios',       'lightbulb',      '#d6a000', 'expense'),
    (new.id, 'Salud',           'pill',           '#e5484d', 'expense'),
    (new.id, 'Ocio',            'ticket',         '#d6409f', 'expense'),
    (new.id, 'Ropa',            'shirt',          '#12a594', 'expense'),
    (new.id, 'Educación',       'graduation-cap', '#0090ff', 'expense'),
    (new.id, 'Otros',           'package',        '#8d8d8d', 'expense'),
    (new.id, 'Sueldo',          'briefcase',      '#30a46c', 'income'),
    (new.id, 'Freelance',       'laptop',         '#0090ff', 'income'),
    (new.id, 'Otros ingresos',  'wallet',         '#8d8d8d', 'income');
  return new;
end;
$$;

-- 3. Colores de las categorías por defecto existentes: solo si siguen con el color viejo de 001.
update public.categories c
set color = m.new_color
from (values
  ('Comida',         'expense', '#f97316', '#f76b15'),
  ('Supermercado',   'expense', '#22c55e', '#30a46c'),
  ('Transporte',     'expense', '#3b82f6', '#0090ff'),
  ('Casa/Alquiler',  'expense', '#8b5cf6', '#6e56cf'),
  ('Servicios',      'expense', '#eab308', '#d6a000'),
  ('Salud',          'expense', '#ef4444', '#e5484d'),
  ('Ocio',           'expense', '#ec4899', '#d6409f'),
  ('Ropa',           'expense', '#14b8a6', '#12a594'),
  ('Educación',      'expense', '#6366f1', '#0090ff'),
  ('Otros',          'expense', '#64748b', '#8d8d8d'),
  ('Sueldo',         'income',  '#16a34a', '#30a46c'),
  ('Freelance',      'income',  '#0ea5e9', '#0090ff'),
  ('Otros ingresos', 'income',  '#84cc16', '#8d8d8d')
) as m(name, type, old_color, new_color)
where c.name = m.name
  and c.type = m.type
  and lower(c.color) = m.old_color;
