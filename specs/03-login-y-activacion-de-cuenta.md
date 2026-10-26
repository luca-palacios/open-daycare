# SPEC 03 — Login, activación y sesión demo

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-10-22
> **Updated:** 2026-10-25
> **Objective:** Incorporar `/auth/login` y `/auth/activate-account` con el diseño de `references/ui/login.dc.html` y `references/ui/activar-cuenta.dc.html`, validación local, sesión de demostración, cierre de sesión desde el menú y componentes ordenados por alcance, sin autenticación real.

---

## Por qué existe esta spec

SPEC 01 dejó fuera el login y la activación. Las referencias fijan la identidad visual, pero el selector «Personal/Familia» no tiene sentido todavía: no existe feed familiar ni roles reales.

Las dos pantallas se abren como demostración funcional bajo la ruta padre `/auth`: `/auth/login` y `/auth/activate-account`. Los formularios validan en el navegador y, si los datos son correctos, crean una sesión de demostración que habilita el feed mock. Esa sesión no verifica credenciales en un servidor, no guarda datos personales y no ofrece seguridad real, pero permite que la opción «Salir» del menú termine la sesión y devuelva a `/auth/login`, en lugar de ser un control decorativo.

La spec también ordena `app/_components/` por alcance: los componentes del shell quedan en subcarpetas globales y los exclusivos de una página viven en una subcarpeta con el nombre de su ruta.

---

## Scope

**In:**

- Crear `/auth/login` con el panel de marca y el formulario de `references/ui/login.dc.html`.
- Crear `/auth/activate-account` con la tarjeta centrada de `references/ui/activar-cuenta.dc.html`.
- Omitir el selector «INGRESO COMO» con las opciones «Personal» y «Familia».
- Validar el login con email con formato válido y contraseña no vacía.
- Validar la activación con el código de ejemplo `7K4P9`, email con formato válido y contraseña no vacía.
- Mostrar la invitación de ejemplo: Mateo, Sala Soles, inicial `M` y el email de ejemplo editable.
- Dejar la autorización de fotos visible, desmarcada y opcional.
- Crear una sesión demo al completar el login o la activación y navegar a `/`.
- Proteger `/`, `/kids` y `/kids/[id]` con la sesión demo; sin sesión redirigen a `/auth/login`.
- Redirigir `/auth/login` y `/auth/activate-account` a `/` cuando ya hay sesión demo.
- Convertir la acción «Salir» del resumen de usuario, en escritorio y móvil, en el cierre de sesión: borra la sesión y navega a `/auth/login`.
- Enlazar ambas páginas de autenticación entre sí.
- Mantener el diseño adaptable y accesible: etiquetas asociadas, errores anunciados y foco visible.
- Reorganizar `app/_components/` en subcarpetas por alcance y actualizar todas las importaciones.
- Añadir `tests/auth.spec.ts` con validaciones, sesión, cierre de sesión, enlaces, protección de rutas y anchos de 375, 768 y 1280 px.
- Actualizar `tests/home.spec.ts`, `tests/kids.spec.ts` y `tests/helpers.ts` para convivir con la sesión demo y el nuevo nombre de la acción de salida.

**Out of scope (para futuras specs):**

- Autenticación real, verificación de credenciales, backend, cookies firmadas, `HttpOnly`, hash de contraseñas y sesiones del servidor.
- Recuperación de contraseña. El enlace queda visible sin acción.
- Registro de usuarios, envío de invitaciones y validación de códigos reales.
- Roles de personal o familia, feed familiar y redirecciones según el rol.
- Persistencia de la autorización de fotos.
- Cambios de contenido en el feed o en las páginas de niños. Solo se ajustan importaciones, protección de rutas y pruebas.

---

## Data model

`app/_data/invitation.ts` exporta la invitación de ejemplo y su tipo. No hay datos de login.

```ts
type Invitation = {
  code: string; // "7K4P9"
  email: string; // "lucia.fernandez@gmail.com"
  kidName: string; // "Mateo"
  roomName: string; // "Sala Soles"
  initials: string; // "M"
  avatarTone: "sky";
};
```

`app/_lib/auth-validation.ts` exporta validadores puros y el tipo de errores.

```ts
type AuthField = "code" | "email" | "password";

type AuthErrors = Partial<Record<AuthField, string>>;

function isValidEmail(value: string): boolean;

function validateLogin(input: { email: string; password: string }): AuthErrors;

function validateActivation(
  input: { code: string; email: string; password: string },
  invitation: Invitation,
): AuthErrors;
```

`app/_lib/demo-session.ts` exporta las constantes y los helpers de la sesión demo. El módulo no accede al navegador al importarse.

```ts
const DEMO_SESSION_COOKIE = "odc-demo-session";
const DEMO_SESSION_VALUE = "demo";
const DEMO_SESSION_MAX_AGE = 60 * 60 * 8; // 8 horas

function startDemoSession(): void; // escribe la cookie en el navegador
function endDemoSession(): void; // expira la cookie en el navegador
function isDemoSessionValue(value: string | undefined): boolean;
```

`proxy.ts` en la raíz del proyecto usa esas constantes para decidir redirecciones.

Convenciones:

- El código se compara sin distinguir mayúsculas ni espacios en los extremos.
- El email se compara sin distinguir mayúsculas ni espacios, pero no se exige que coincida con el de la invitación.
- Un campo vacío o inválido produce un mensaje en español asociado a su campo.
- La autorización de fotos es un booleano de formulario, sin guardarse ni validarse.
- La sesión demo solo indica «hay sesión»: no guarda email, credenciales ni consentimientos.
- La cookie usa `path=/`, `SameSite=Lax`, `max-age=28800` y no es `HttpOnly`, porque el cliente la escribe y la borra.
- Cualquier valor distinto de `demo` se considera ausente.
- No hay estado de sesión en React ni datos compartidos entre páginas.

---

## Component layout

Regla de alcance:

- `app/_components/` en su raíz no contiene componentes: agrupa subcarpetas.
- `layout/` y `ui/` son globales porque los usa el shell de todas las rutas.
- `auth/` contiene piezas compartidas por las dos rutas de autenticación.
- Cada subcarpeta restante corresponde a una sola página y se nombra como su ruta.

```text
app/_components/
  layout/
    app-shell.tsx
    sidebar.tsx
    mobile-nav.tsx
    nav-menu.tsx
  ui/
    icons.tsx
  auth/
    auth-field.tsx
  feed/
    feed-header.tsx
    create-post-prompt.tsx
    post-feed.tsx
    post-card.tsx
    post-kind-badge.tsx
  kids/
    kids-header.tsx
    kids-directory.tsx
    kids-search.tsx
    kid-card.tsx
    kids-empty-state.tsx
  kid-profile/
    kid-profile-header.tsx
    kid-details.tsx
    kid-allergy-alert.tsx
    kid-parents-panel.tsx
    kid-summary-action.tsx
  login/
    login-form.tsx
    auth-brand-panel.tsx
  activate-account/
    activate-account-form.tsx
    invitation-summary.tsx
```

`brand` y `new-post-button` permanecen en `nav-menu.tsx` porque los usa el shell, no una página concreta.

---

## Implementation plan

1. Añadir a `app/globals.css` los tokens que usan las referencias y hoy no existen: fondo `#FBF4EC`, borde `#EADFD0`, borde de foco `#F2A78E` y la escala de marca. Verificación: `/` y `/kids` conservan su aspecto.

2. Reorganizar `app/_components/` según la tabla de alcance, mover los archivos y actualizar todas las importaciones de `app/page.tsx`, `app/kids/page.tsx`, `app/kids/[id]/page.tsx` y de los propios componentes. Verificación: `npx tsc --noEmit` y `npm run build` pasan; ninguna página cambia de comportamiento.

3. Crear `app/_lib/demo-session.ts` con las constantes, `startDemoSession`, `endDemoSession` e `isDemoSessionValue`. Verificación: importar el módulo en el servidor no lanza errores y el valor `demo` se reconoce.

4. Crear `proxy.ts` con matcher `["/", "/kids/:path*", "/auth/login", "/auth/activate-account"]`. Sin cookie válida, las rutas protegidas redirigen a `/auth/login`; con cookie válida, `/auth/login` y `/auth/activate-account` redirigen a `/`. Verificación: sin sesión, `/` y `/kids` terminan en `/auth/login`; con sesión, `/auth/login` termina en `/`.

5. Crear `app/_data/invitation.ts` con el tipo `Invitation` y la invitación de ejemplo. Verificación: importar el módulo devuelve código, email, niño y sala.

6. Crear `app/_lib/auth-validation.ts` con `isValidEmail`, `validateLogin` y `validateActivation`. Verificación: email sin arroba, contraseña vacía y código incorrecto devuelven sus mensajes; los datos correctos devuelven un objeto vacío.

7. Crear `app/_components/auth/auth-field.tsx` con etiqueta, input, mensaje de error y atributos `aria-invalid` y `aria-describedby`. Verificación: un campo con error anuncia el mensaje al enfocarse.

8. Crear `app/auth/login/page.tsx` con los metadatos y la composición de dos columnas, y `app/_components/login/login-form.tsx` como componente cliente con estado, validación, envío, `startDemoSession` y enlace a `/auth/activate-account`. Añadir el panel de marca como `app/_components/login/auth-brand-panel.tsx`. Verificación: `/auth/login` muestra el formulario sin el selector de rol.

9. Al enviar un login válido, iniciar la sesión demo y navegar a `/` con `router.replace`. Mantener el enlace «¿Olvidaste tu contraseña?» visible y sin acción. Verificación: datos válidos llegan al feed y la cookie existe; datos inválidos muestran errores y no navegan.

10. Crear `app/auth/activate-account/page.tsx` con los metadatos, `app/_components/activate-account/activate-account-form.tsx` como componente cliente y `app/_components/activate-account/invitation-summary.tsx` para la tarjeta de Mateo. Precargar código y email de ejemplo, dejar la contraseña vacía y la autorización de fotos desmarcada. Verificación: la tarjeta muestra la invitación de Mateo.

11. Al enviar una activación válida, iniciar la sesión demo y navegar a `/`. Validar el código contra la invitación y mostrar el error cuando no coincide. Verificación: `7K4P9` avanza; un código distinto no.

12. Convertir la acción del resumen de usuario en `nav-menu.tsx` en el botón «Salir»: al pulsarlo, `endDemoSession`, `router.replace("/auth/login")` y `router.refresh()`. Debe funcionar en la barra lateral y en el menú móvil con el mismo componente. Verificación: tras salir, `/` vuelve a redirigir a `/auth/login`.

13. Añadir enlaces mutuos: «Activá tu cuenta» desde `/auth/login` y «Iniciar sesión» desde `/auth/activate-account`. Verificación: ambas rutas se alcanzan sin sesión y sin tocar el menú de la app.

14. Actualizar `tests/helpers.ts` con un helper que siembre la cookie demo y ajustar `tests/home.spec.ts` y `tests/kids.spec.ts` para usarlo antes de navegar. En `tests/home.spec.ts`, quitar «Cerrar sesión» de las acciones inertes y comprobar que «Salir» navega a `/auth/login`. Verificación: las suites existentes siguen pasando.

15. Añadir `tests/auth.spec.ts` con validaciones, creación y cierre de sesión, redirecciones, enlaces, ausencia del selector de rol, accesibilidad básica y anchos de 375, 768 y 1280 px. Verificación: `npx playwright test tests/auth.spec.ts --project=chromium` pasa con `npm run dev` activo.

16. Actualizar las rutas de componentes citadas en las specs 01 y 02 para que la documentación coincida con la nueva estructura. Verificación: no quedan referencias a componentes movidos en `specs/`.

---

## Acceptance criteria

- [ ] `/auth/login` reproduce la composición de dos columnas de la referencia y no muestra el selector «Personal/Familia».
- [ ] `/auth/activate-account` reproduce la tarjeta centrada con Mateo, Sala Soles y el código `7K4P9`.
- [ ] Un email sin formato válido o una contraseña vacía bloquean el envío en ambas páginas y muestran un error asociado al campo.
- [ ] En `/auth/login`, email válido y contraseña no vacía crean la sesión demo y navegan a `/`.
- [ ] En `/auth/activate-account`, un código distinto de `7K4P9` bloquea la activación y muestra un error.
- [ ] En `/auth/activate-account`, código `7K4P9`, email válido y contraseña no vacía crean la sesión demo y navegan a `/`.
- [ ] La autorización de fotos aparece desmarcada, se puede marcar y no impide activar la cuenta.
- [ ] Sin sesión demo, `/`, `/kids` y `/kids/[id]` redirigen a `/auth/login`.
- [ ] Con sesión demo, `/auth/login` y `/auth/activate-account` redirigen a `/`.
- [ ] «Activá tu cuenta» lleva a `/auth/activate-account` y «Iniciar sesión» lleva a `/auth/login`.
- [ ] «¿Olvidaste tu contraseña?» no navega ni modifica la URL.
- [ ] La acción «Salir» aparece en escritorio y móvil, borra la cookie demo y navega a `/auth/login`.
- [ ] Después de «Salir», volver a `/` redirige a `/auth/login`.
- [ ] La cookie demo no contiene email, credenciales ni datos personales.
- [ ] `app/_components/` respeta la tabla de alcance: solo hay subcarpetas y ningún componente exclusivo de una página queda en una carpeta global.
- [ ] Los errores se anuncian con `role="alert"` y el foco visible se conserva en ambos formularios.
- [ ] No hay desbordamiento horizontal a 375, 768 ni 1280 px.
- [ ] No hay errores de hidratación ni de consola en ninguna ruta.
- [ ] Pasan `tests/auth.spec.ts`, `tests/home.spec.ts`, `tests/kids.spec.ts`, `npm run lint`, `npx tsc --noEmit` y `npm run build`.

---

## Decisions

- **Sí:** sesión demo creada desde el cliente con una cookie marcadora. **No:** autenticación real. El proyecto no tiene backend y añadirlo excede esta spec.
- **Sí:** proteger `/`, `/kids` y `/kids/[id]` con `proxy.ts`. **No:** dejar el feed accesible tras «Salir», porque el cierre de sesión quedaría decorativo.
- **Sí:** llamar a la acción «Salir». **No:** conservar «Cerrar sesión» como etiqueta inerte. Es la misma acción del resumen de usuario en escritorio y móvil.
- **Sí:** redirigir las páginas de autenticación a `/` cuando hay sesión. **No:** mostrar el login a una sesión activa.
- **Sí:** cookie `odc-demo-session=demo`, sin `HttpOnly` y sin datos personales. **No:** cookie firmada ni `HttpOnly`, que requieren un servidor con secretos. La spec documenta que es una demostración.
- **Sí:** `router.replace` al entrar y al salir. **No:** `push`, para que el botón Atrás no vuelva a la pantalla protegida.
- **Sí:** rutas `/auth/login` y `/auth/activate-account`, agrupadas bajo el segmento padre `/auth`. **No:** `/auth/activar-cuenta`, para mantener rutas técnicas en inglés como `/kids`.
- **Sí:** omitir el selector «Personal/Familia». **No:** conservarlo sin efecto. Sin roles reales, elegir rol sería engañoso.
- **Sí:** cualquier email válido y contraseña no vacía inician la sesión demo. **No:** credenciales mock, que no aportan nada sin verificación.
- **Sí:** exigir el código de ejemplo `7K4P9`. **No:** aceptar cualquier código. La validación demuestra el flujo de invitación.
- **Sí:** precargar código y email de ejemplo y dejar la contraseña vacía. Facilita probar el flujo sin ocultar el campo de contraseña.
- **Sí:** autorización de fotos opcional y desmarcada. Es un consentimiento separado de la creación de la cuenta.
- **Sí:** mantener «¿Olvidaste tu contraseña?» visible sin acción, como los controles de SPEC 02. **No:** inventar una página de recuperación.
- **Sí:** ordenar los componentes por alcance con subcarpetas dentro de `app/_components/`. **No:** mover las páginas ni usar route groups, para no alterar las rutas ni la documentación del proyecto.
- **Sí:** sin banner de demostración, para preservar la fidelidad visual de las referencias. La ausencia de persistencia y seguridad queda documentada aquí.

---

## Risks

| Risk                                                                   | Mitigation                                                                                                  |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| El usuario cree que la cuenta quedó activada o protegida de verdad     | La cookie no guarda datos y la spec documenta que es una demostración sin seguridad real.                   |
| La cookie escrita por el cliente no coincide con la que lee `proxy.ts` | Centralizar nombre y valor en `app/_lib/demo-session.ts` y usar las mismas constantes.                      |
| Bucles de redirección entre login y rutas protegidas                   | `proxy.ts` solo redirige a `/auth/login` las rutas protegidas y solo sale de las de auth si la cookie es válida. |
| Valores precargados provocan desajustes de hidratación                 | Inicializar el estado del cliente con las mismas constantes que el servidor.                                |
| Errores de validación no se perciben con lector de pantalla            | Asociar cada mensaje con `aria-describedby` y anunciarlo con `role="alert"`.                                |
| El panel de marca rompe el layout en pantallas pequeñas                | Ocultarlo por CSS por debajo del punto de corte y dejar solo el formulario.                                 |
| Las pruebas existentes fallan al proteger las rutas                    | Sembrar la cookie demo desde `tests/helpers.ts` y usarla en las suites de feed y niños.                     |
| Mover componentes rompe importaciones                                  | Hacer el movimiento en un solo paso y verificar con `npx tsc --noEmit` y `npm run build`.                   |

---

## What is **not** in this spec

- Autenticación real, verificación de credenciales, sesiones del servidor y cookies firmadas.
- Backend, base de datos o persistencia de credenciales y consentimientos.
- Recuperación de contraseña, registro e invitaciones reales.
- Roles de personal o familia, feed familiar y redirección por tipo de usuario.
- Cambios de contenido en el feed o en las páginas de niños.

Cada uno de esos puntos, si se implementa, va en su propia spec.
