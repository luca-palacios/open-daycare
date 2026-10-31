-- Permite a cada usuario autenticado leer únicamente su perfil propio.
revoke all privileges on table public.users from authenticated;
grant select on table public.users to authenticated;

create policy "Users can read own profile"
  on public.users
  for select
  to authenticated
  using ((select auth.uid()) = id);
