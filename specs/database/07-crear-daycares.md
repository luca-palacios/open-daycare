# SPEC 07 — Crear la tabla daycares

> **Status:** Approved
> **Date:** 2026-10-30
> **Objective:** Crear de forma reproducible la tabla `public.daycares` en Supabase, cerrarla al acceso de clientes y cargar cuatro guarderías iniciales.

---

## Scope

**In:**

- Crear `public.daycares` mediante una nueva migración SQL versionada en `supabase/migrations/` y aplicarla al proyecto Supabase.
- Cargar `Sala Soles`, `Jardín Arcoíris`, `Pequeños Exploradores` y `Bosque de Sueños` con UUID fijos, sin duplicarlos si se repite la carga.
- Activar RLS sin políticas y retirar los permisos de `anon` y `authenticated` sobre esta tabla.
- Eliminar `public.test_table`, incluidas sus 7 filas, en la nueva migración. Conservar intacta la migración histórica `create_test_table`.
- Actualizar `DATABASE.md` para reflejar las restricciones y la carga inicial.

**Out of scope (para futuras specs):**

- Crear `users`, `rooms` u otras tablas del modelo.
- Conectar la aplicación a Supabase o mostrar las guarderías en la UI.
- Dar acceso a `daycares` desde clientes o implementar altas y edición de guarderías.

---

## Data model

`public.daycares` tendrá `id uuid primary key default gen_random_uuid()`, `name text not null` con restricción que impida nombres vacíos y `created_at timestamptz not null default now()`.

No se añade `updated_at` ni una restricción de unicidad sobre `name`.

La migración insertará los cuatro nombres acordados con cuatro UUID constantes. Una nueva ejecución de la carga no duplicará filas ni sobrescribirá las existentes.

---

## Implementation plan

1. Crear una migración nueva en `supabase/migrations/` que defina `daycares`, active RLS, retire los permisos de clientes, inserte los cuatro registros y elimine `test_table` sin modificar la migración histórica.
2. Actualizar la sección `daycares` de `DATABASE.md` con las restricciones y los datos iniciales.
3. Aplicar la migración una sola vez al proyecto Supabase, generar los tipos desde el esquema resultante y comprobar esquema, datos, permisos y avisos de seguridad.

---

## Acceptance criteria

- [x] `public.daycares` contiene los tres campos y las restricciones descritas.
- [x] Contiene exactamente los cuatro registros iniciales acordados, sin duplicados tras repetir la carga.
- [x] RLS está activo y `anon` y `authenticated` no tienen acceso a la tabla.
- [x] `public.test_table` ya no existe y la migración histórica permanece intacta.
- [x] La nueva migración figura en el historial de Supabase y `DATABASE.md` coincide con el esquema aplicado.
- [x] La verificación SQL y los asesores de seguridad no detectan exposición de `daycares`.

---

## Decisions

- **Sí:** cuatro guarderías iniciales. **No:** cinco; se corrigió el total durante la definición.
- **Sí:** UUID fijos para una carga repetible. **No:** depender de UUID generados en cada inserción.
- **Sí:** RLS sin políticas y sin permisos de cliente. **No:** permitir leer todas las guarderías antes de definir el aislamiento entre ellas.
- **Sí:** eliminar la tabla de prueba y sus 7 filas mediante una migración nueva. **No:** reescribir el historial ya aplicado.
- **Sí:** migración versionada y despliegue remoto. **No:** cambios exclusivamente remotos sin respaldo en Git.
- **Sí:** comprobaciones SQL. **No:** incorporar por ahora infraestructura de pruebas automatizadas de base de datos.

---

## Risks

| Risk                                                          | Mitigation                                                                                           |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| La eliminación de `test_table` destruye sus 7 filas           | Mantenerla explícita en la migración y comprobar el estado antes de aplicarla.                       |
| El proyecto puede conceder permisos predeterminados distintos | Retirar explícitamente los permisos de cliente y verificar los permisos efectivos tras la migración. |

---

## What is **not** in this spec

- Integración de la app, autenticación y políticas de acceso por guardería.
- Otras tablas del modelo o gestión de guarderías desde la UI.

Cada uno de esos puntos, si se implementa, va en su propia spec.
