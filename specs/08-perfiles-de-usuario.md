# SPEC 08 — Perfiles de usuario

> **Status:** In review
> **Depends on:** SPEC 07
> **Date:** 2026-10-30
> **Objective:** Crear `public.users` y sus enumeraciones, vincular cada usuario a una sola guardería y disponer de una cuenta `staff` para pruebas.

---

## Scope

**In:**

- Crear los enums `user_role` (`staff`, `parent`, `admin`) y `user_status` (`pending`, `active`).
- Crear `public.users` con los campos de `DATABASE.md`; `id` replica `auth.users.id` y `daycare_id` es obligatoria, sin UNIQUE, para permitir varios usuarios por guardería.
- Crear el perfil con un trigger `AFTER INSERT` en `auth.users` que exija `daycare_id`, `role` y `full_name` válidos en `raw_user_meta_data`.
- Deshabilitar el registro público de Supabase Auth antes de exponer el trigger.
- Activar RLS sin políticas ni permisos de cliente; dejar el acceso a `service_role`.
- Crear administrativamente una cuenta `staff` en Sala Soles y verificar su acceso.
- Actualizar `DATABASE.md`.

**Out of scope (para futuras specs):**

- Conectar el login demo de Next.js a Supabase Auth.
- Consultar o editar perfiles desde clientes.
- Crear las demás tablas y enumeraciones del modelo.

---

## Data model

`public.user_role` y `public.user_status` son enums de Postgres con los valores de `DATABASE.md`.

`public.users` usa `id uuid primary key references auth.users (id) on delete cascade`, `daycare_id uuid not null references public.daycares (id) on delete restrict`, `role user_role not null`, `status user_status not null default 'active'`, `full_name text not null` con CHECK de texto no vacío, `avatar_url text`, `notify_on_post` y `daily_summary_enabled` boolean NOT NULL con default `true`, y `created_at` / `updated_at` timestamptz NOT NULL con default `now()`. Un índice cubre `daycare_id`.

`public.handle_new_user()` lee `daycare_id`, `role` y `full_name` desde `raw_user_meta_data` y falla si falta alguno. El trigger `on_auth_user_created` lo ejecuta tras cada alta en `auth.users`.

---

## Implementation plan

1. Crear la migración `20261030214003_create_users.sql` con enums, tabla, índice, trigger de `updated_at`, trigger de alta, RLS y permisos.
2. Aplicar la migración al proyecto Supabase y comprobar esquema, RLS y avisos de seguridad.
3. Verificar el trigger con un alta válida y un alta incompleta, sin dejar datos de prueba.
4. Crear la cuenta `staff` de Sala Soles, guardar sus credenciales en `.env` y comprobar el inicio de sesión contra Supabase Auth.
5. Actualizar `DATABASE.md` y deshabilitar el registro público de Supabase Auth. Verificado: `GET /auth/v1/settings` devuelve `disable_signup: true` y un `signUp` anónimo responde 422 «Signups not allowed for this instance».

---

## Acceptance criteria

- [x] Existen `user_role` y `user_status` con los valores acordados.
- [x] `public.users` contiene los campos, defaults y restricciones descritas.
- [x] Varios usuarios pueden pertenecer a la misma guardería; una guardería inexistente se rechaza.
- [x] Un alta en `auth.users` con metadatos válidos crea exactamente un perfil con el mismo UUID.
- [x] Un alta sin `daycare_id`, `role` o `full_name` falla y no deja usuario en Auth.
- [x] Borrar un usuario de `auth.users` elimina su perfil por cascada.
- [x] La cuenta `staff` existe con rol `staff` y Sala Soles, inicia sesión y sus credenciales no están en Git.
- [x] RLS y permisos impiden que `anon` y `authenticated` lean `public.users`; los asesores no señalan exposición de la tabla.
- [x] El registro público de Supabase Auth está deshabilitado y un `signUp` anónimo responde 422.

---

## Decisions

- **Sí:** un usuario por guardería como FK obligatoria sin UNIQUE. **No:** tabla intermedia, porque el modelo no contempla varias guarderías por usuario.
- **Sí:** `on delete restrict` al borrar una guardería. **No:** cascada, para no perder perfiles por accidente.
- **Sí:** trigger que falla si faltan metadatos. **No:** aceptar cuentas Auth sin perfil.
- **Sí:** conservar `raw_user_meta_data` como indica `DATABASE.md`. **No:** migrar a `raw_app_meta_data`; el riesgo se compensa deshabilitando el registro público.
- **Sí:** RLS sin políticas y sin permisos de cliente. **No:** exponer perfiles antes de definir el aislamiento por guardería.
- **Sí:** cuenta de prueba en el proyecto remoto con credenciales en `.env`. **No:** credenciales en Git ni en la spec.

---

## Risks

| Risk                                                         | Mitigation                                                                                   |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| El registro público sigue abierto y permite elegir rol        | Deshabilitarlo en Authentication → Providers antes de usar el proyecto.                      |
| La cuenta de prueba usa una contraseña compartida por chat    | Rotarla y mantenerla solo en `.env`; nunca en Git ni en capturas.                            |
| El trigger bloquea altas sin metadatos                        | Enviar `daycare_id`, `role` y `full_name` en cada alta administrativa.                       |

---

## What is **not** in this spec

- Login real en la app, sesión de Supabase o consultas de perfil desde el cliente.
- Políticas RLS por guardería.
- Resto de tablas del modelo: `rooms`, `children`, `invitations`, `posts`, etc.
