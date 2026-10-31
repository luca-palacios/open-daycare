create type public.child_status as enum ('active', 'archived');

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  constraint rooms_name_not_blank check (length(btrim(name)) > 0),
  constraint rooms_daycare_id_name_key unique (daycare_id, name)
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete restrict,
  full_name text not null,
  birth_date date not null,
  enrolled_at date not null,
  medical_notes text,
  allergy_tags text[] not null default '{}'::text[],
  photo_consent boolean not null default true,
  status public.child_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint children_full_name_not_blank check (length(btrim(full_name)) > 0)
);

create index children_room_id_status_idx on public.children (room_id, status);

create trigger children_set_updated_at
  before update on public.children
  for each row execute function public.set_updated_at();

update public.daycares
set name = 'Estrellitas'
where id = '8f0e5c6a-1b2d-4c3e-9a10-2d3e4f5a6b70';

insert into public.rooms (daycare_id, name)
values
  ('8f0e5c6a-1b2d-4c3e-9a10-2d3e4f5a6b70', 'Soles'),
  ('8f0e5c6a-1b2d-4c3e-9a10-2d3e4f5a6b70', 'Lunas'),
  ('8f0e5c6a-1b2d-4c3e-9a10-2d3e4f5a6b70', 'Estrellas')
on conflict (daycare_id, name) do nothing;

alter table public.rooms enable row level security;
alter table public.children enable row level security;

revoke all privileges on table public.rooms, public.children from anon, authenticated;
grant select on table public.rooms to authenticated;
grant select on table public.children to authenticated;
grant insert (room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags)
  on table public.children to authenticated;

create policy "Active daycare staff can read rooms"
  on public.rooms
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.users
      where users.id = (select auth.uid())
        and users.daycare_id = rooms.daycare_id
        and users.role = 'staff'
        and users.status = 'active'
    )
  );

create policy "Active daycare staff can read children"
  on public.children
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.rooms
      join public.users on users.daycare_id = rooms.daycare_id
      where rooms.id = children.room_id
        and users.id = (select auth.uid())
        and users.role = 'staff'
        and users.status = 'active'
    )
  );

create policy "Active daycare staff can create children"
  on public.children
  for insert
  to authenticated
  with check (
    status = 'active'
    and exists (
      select 1
      from public.rooms
      join public.users on users.daycare_id = rooms.daycare_id
      where rooms.id = children.room_id
        and users.id = (select auth.uid())
        and users.role = 'staff'
        and users.status = 'active'
    )
  );
