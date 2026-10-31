create type public.relationship_type as enum ('father', 'mother', 'guardian');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  relationship public.relationship_type not null,
  created_at timestamptz not null default now(),
  constraint parent_children_parent_id_child_id_key unique (parent_id, child_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  invited_by uuid not null references public.users (id) on delete restrict,
  full_name text not null,
  email text not null,
  relationship public.relationship_type not null,
  code text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint invitations_full_name_not_blank check (length(btrim(full_name)) > 0),
  constraint invitations_email_not_blank check (length(btrim(email)) > 0),
  constraint invitations_code_format check (code ~ '^[A-Z0-9]{8}$')
);

create index invitations_child_id_status_idx on public.invitations (child_id, status);
create index invitations_code_status_idx on public.invitations (code, status);
create unique index invitations_child_email_active_key
  on public.invitations (child_id, lower(btrim(email)))
  where status in ('pending', 'accepted');

alter table public.parent_children enable row level security;
alter table public.invitations enable row level security;

revoke all privileges on table public.parent_children, public.invitations from anon, authenticated;
grant select on table public.parent_children to authenticated;
grant select, insert on table public.invitations to authenticated;

create policy "Active daycare staff can read parent links"
  on public.parent_children for select to authenticated
  using (
    exists (
      select 1
      from public.children
      join public.rooms on rooms.id = parent_children.child_id
      join public.users on users.daycare_id = rooms.daycare_id
      where parent_children.child_id = children.id
        and users.id = (select auth.uid())
        and users.role = 'staff'
        and users.status = 'active'
    )
  );

create policy "Active daycare staff can read invitations"
  on public.invitations for select to authenticated
  using (
    exists (
      select 1
      from public.children
      join public.rooms on rooms.id = children.room_id
      join public.users on users.daycare_id = rooms.daycare_id
      where children.id = invitations.child_id
        and users.id = (select auth.uid())
        and users.role = 'staff'
        and users.status = 'active'
    )
  );

create policy "Active daycare staff can create invitations"
  on public.invitations for insert to authenticated
  with check (
    invited_by = (select auth.uid())
    and status = 'pending'
    and exists (
      select 1
      from public.children
      join public.rooms on rooms.id = children.room_id
      join public.users on users.daycare_id = rooms.daycare_id
      where children.id = invitations.child_id
        and users.id = (select auth.uid())
        and users.role = 'staff'
        and users.status = 'active'
    )
  );
