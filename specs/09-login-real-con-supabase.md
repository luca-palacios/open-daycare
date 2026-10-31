# SPEC 09 — Login real con Supabase Auth

> **Status:** Approved
> **Depends on:** SPEC 03, SPEC 08
> **Date:** 2026-10-30
> **Objective:** Sustituir la sesión demo por un login con email y contraseña de Supabase Auth, limitado a personal `staff` activo.

---

## Scope

**In:**

- Autenticar el formulario existente de `/auth/login` con `signInWithPassword` de Supabase Auth.
- Proteger `/`, `/kids` y `/kids/[id]` con la sesión real de Supabase y verificar en servidor que el usuario tenga un perfil propio con `role = staff` y `status = active`.
- Comprobar la sesión y el perfil al acceder a las rutas protegidas; no confiar solo en la comprobación realizada durante el login.
- Eliminar la cookie demo como mecanismo de autorización y convertir «Salir» en un cierre de sesión de Supabase que también limpia los datos temporales de la interfaz.
- Mostrar `full_name` e iniciales del perfil autenticado en el menú. Mantener «Personal», Sala Soles, el feed y los niños como contenido mock.
- Conservar `/auth/activate-account` y el enlace desde login. Deshabilitar los controles del formulario, informar que la activación no está disponible y mantener activo el enlace de regreso al login.
- Ejecutar pruebas E2E con Supabase local, sin secretos remotos en CI. Permitir una comprobación remota opcional con credenciales privadas de `.env`.
- Añadir una política de lectura limitada al perfil propio y actualizar `DATABASE.md`.

**Out of scope (para futuras specs):**

- Registro, invitaciones y activación reales.
- Recuperación de contraseña.
- Acceso de padres o administradores y pantallas específicas por rol.
- Sustitución del feed o de los niños mock por datos reales.

---

## Data model

No se añaden tablas. Una migración permite que `authenticated` lea únicamente su propia fila de `public.users`, con la condición `id = (select auth.uid())`. No concede permisos de modificación ni acceso a perfiles ajenos. `auth.users` sigue siendo la fuente de credenciales y sesiones.

La UI obtiene `id`, `full_name`, `role` y `status` de la fila propia. No utiliza `raw_user_meta_data` para autorizar.

---

## Implementation plan

1. Crear una migración que otorgue el permiso SELECT mínimo y una política RLS para leer únicamente el perfil propio. Actualizar `DATABASE.md`. Verificar que una sesión autenticada lee su perfil y no puede leer ni modificar perfiles ajenos.
2. Sustituir el envío demo de `app/_components/login/login-form.tsx` por `signInWithPassword`. Mostrar estados de envío y errores de credenciales o conexión. Si falta el perfil o no es `staff` activo, cerrar la sesión recién creada y mostrar un error de acceso en el login.
3. Actualizar `proxy.ts` para refrescar la sesión Supabase y proteger las rutas existentes. Verificar en servidor el perfil propio, `role = staff` y `status = active`; redirigir al login cuando falte la sesión y denegar acceso a perfiles no autorizados. No usar `middleware.ts`, cookies demo ni metadatos editables como autorización.
4. Actualizar `app/_components/layout/nav-menu.tsx` para cerrar la sesión Supabase y limpiar niños, invitaciones y publicaciones temporales. Obtener el nombre e iniciales reales para el menú sin cambiar el contenido mock restante.
5. Deshabilitar los campos y el botón de `app/_components/activate-account/activate-account-form.tsx`, mostrar que la activación no está disponible y conservar el enlace a `/auth/login`. Verificar que enviar o manipular el formulario no crea una sesión.
6. Configurar Supabase local y los datos de prueba para E2E. Sustituir `seedDemoSession` en `tests/helpers.ts` y actualizar `tests/auth.spec.ts`, `tests/home.spec.ts` y `tests/kids.spec.ts` para cubrir login correcto e incorrecto, perfil no autorizado, rutas protegidas, logout y limpieza temporal.

---

## Acceptance criteria

- [ ] Un `staff` con estado `active` y credenciales correctas inicia sesión y llega a `/`.
- [ ] Credenciales incorrectas muestran un error accesible y no dan acceso a rutas protegidas.
- [ ] La cookie `odc-demo-session=demo` sin sesión Supabase no permite abrir `/`, `/kids` ni `/kids/[id]`.
- [ ] Un usuario autenticado sin perfil, con estado `pending` o con rol distinto de `staff` no accede; la sesión se cierra al denegar el login.
- [ ] Una sesión que pierde perfil, rol permitido o estado activo queda bloqueada al acceder nuevamente a una ruta protegida.
- [ ] Un usuario autenticado puede leer su propio perfil, pero no leer perfiles ajenos ni modificar perfiles.
- [ ] La autorización no depende de `raw_user_meta_data` ni de datos de usuario editables desde el cliente.
- [ ] El menú muestra el nombre e iniciales reales, mientras Sala Soles y los contenidos mock permanecen.
- [ ] «Salir» invalida la sesión Supabase, limpia los datos temporales y devuelve a `/auth/login`.
- [ ] La página de activación y el enlace de regreso se mantienen; los controles deshabilitados no crean sesión.
- [ ] Los E2E de login y rutas protegidas pasan usando Supabase local sin credenciales remotas.
- [ ] Pasan `tests/auth.spec.ts`, `tests/home.spec.ts`, `tests/kids.spec.ts`, `npm run lint`, `npx tsc --noEmit` y `npm run build`.

---

## Decisions

- **Sí:** sustituir completamente la sesión demo. **No:** mantenerla en paralelo, porque permitiría saltarse el login real.
- **Sí:** exigir `role = staff` y `status = active`. **No:** permitir acceso a padres, administradores o cuentas pendientes desde la UI de personal.
- **Sí:** comprobar el perfil propio en servidor y en cada entrada a una ruta protegida. **No:** confiar solo en la comprobación del formulario de login.
- **Sí:** lectura RLS limitada a la fila del usuario autenticado. **No:** conceder lectura general de `public.users` ni permisos de escritura.
- **Sí:** conservar activación como página informativa con controles deshabilitados. **No:** crear una sesión demo ni quitar la ruta.
- **Sí:** Supabase local para los E2E de CI. **No:** exigir credenciales de una cuenta remota para ejecutar la suite.
- **Sí:** conservar feed, niños, rol visual y guardería mock. **No:** ampliar esta spec a la carga de datos reales.

---

## Risks

| Risk                                                          | Mitigation                                                                                                        |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| La política RLS expone perfiles ajenos o permite cambios      | Limitar SELECT por `auth.uid()`, no crear políticas de escritura y verificar permisos con dos usuarios de prueba. |
| El proxy no conserva las cookies de sesión al redirigir       | Probar login, navegación, refresco de sesión y logout con el flujo SSR de Supabase.                               |
| La sesión Auth es válida, pero el perfil deja de estar activo | Consultar el perfil en servidor al acceder a cada ruta protegida y denegar el acceso si no cumple ambos valores.  |
| Los tests actuales dependen de la cookie demo                 | Reemplazar el helper y ejecutar las suites contra Supabase local antes de eliminar ese mecanismo.                 |

---

## What is **not** in this spec

- Registro, invitaciones reales, activación de cuenta y recuperación de contraseña.
- Acceso de padres o administradores, feed familiar y autorización por otros roles.
- Feed, niños o guardería conectados a datos reales.
- Persistencia en base de datos de publicaciones, invitaciones o niños temporales.
