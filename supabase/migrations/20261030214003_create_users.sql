-- Enumeraciones de perfil.
create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

-- Un usuario pertenece a una sola guardería; una guardería agrupa varios usuarios.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  daycare_id uuid not null references public.daycares (id) on delete restrict,
  role public.user_role not null,
  status public.user_status not null default 'active',
  full_name text not null,
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_full_name_not_blank check (length(btrim(full_name)) > 0)
);

comment on table public.users is 'Application profile for Supabase Auth users; one daycare per user.';

-- Índice de la FK para listar los usuarios de una guardería.
create index users_daycare_id_idx on public.users (daycare_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Crea el perfil al dar de alta el usuario en Auth; falla si faltan datos obligatorios.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  new_daycare_id uuid := (metadata ->> 'daycare_id')::uuid;
  new_role public.user_role := (metadata ->> 'role')::public.user_role;
  new_full_name text := btrim(coalesce(metadata ->> 'full_name', ''));
begin
  if new_daycare_id is null or new_role is null or new_full_name = '' then
    raise exception 'Profile requires daycare_id, role and full_name in user metadata.';
  end if;

  insert into public.users (id, daycare_id, role, full_name)
  values (new.id, new_daycare_id, new_role, new_full_name);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Sin acceso de cliente: el aislamiento por guardería se define en otra spec.
alter table public.users enable row level security;
revoke all on table public.users from anon, authenticated;
grant select, insert, update, delete on table public.users to service_role;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
