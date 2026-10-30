-- Guarderías: entidad raíz del modelo.
create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  constraint daycares_name_not_blank check (length(btrim(name)) > 0)
);

-- Sin políticas todavía: ningún cliente debe poder leer todas las guarderías.
alter table public.daycares enable row level security;
revoke all on table public.daycares from anon, authenticated;

-- Carga inicial repetible: UUID fijos y sin sobrescribir filas existentes.
insert into public.daycares (id, name) values
  ('8f0e5c6a-1b2d-4c3e-9a10-2d3e4f5a6b70', 'Sala Soles'),
  ('8f0e5c6a-1b2d-4c3e-9a10-2d3e4f5a6b71', 'Jardín Arcoíris'),
  ('8f0e5c6a-1b2d-4c3e-9a10-2d3e4f5a6b72', 'Pequeños Exploradores'),
  ('8f0e5c6a-1b2d-4c3e-9a10-2d3e4f5a6b73', 'Bosque de Sueños')
on conflict (id) do nothing;

-- Elimina la tabla de prueba creada por la migración create_test_table.
drop table if exists public.test_table;
