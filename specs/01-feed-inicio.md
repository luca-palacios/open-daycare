# SPEC 01 — Feed de inicio

> **Status:** Approved
> **Depends on:** Ninguna
> **Date:** 2026-10-21
> **Objective:** Reproducir `references/ui/feed.dc.html` en `/` con datos de prueba, fechas mostradas en la zona horaria del visitante y diseño adaptable, sin autenticación ni backend.

---

## Por qué existe esta spec

La app arranca con la página de ejemplo de Next.js. La referencia HTML fija la identidad visual del producto, pero no define navegación real, datos ni comportamiento de fechas.

Esta spec fija tres decisiones de base: la home se compone de componentes reutilizables, los datos viven en un módulo mock aislado, y toda fecha se trata como instante absoluto formateado en el navegador.

---

## Scope

**In:**

- Reemplazar `app/page.tsx` por el feed de `references/ui/feed.dc.html`.
- Reproducir colores, tipografías, espaciados, iconos, barra lateral, encabezado y las tres publicaciones.
- Extraer la interfaz en componentes reutilizables bajo `app/_components/`.
- Guardar los datos de ejemplo en `app/_data/mock.ts`.
- Generar las publicaciones mock con instantes recientes respecto al momento de la solicitud.
- Mostrar fecha del encabezado y horas de publicación en la zona horaria del visitante.
- Agrupar las publicaciones por día local del visitante.
- Sustituir la barra lateral por un menú desplegable accesible en pantallas pequeñas.
- Mantener **Feed** como enlace a `/`; las demás opciones y acciones no navegan.

**Out of scope (para futuras specs):**

- Autenticación, sesiones y cierre de sesión real.
- Base de datos, API y persistencia.
- Crear, editar, reaccionar o comentar publicaciones.
- Páginas secundarias (`/ninos`, `/avisos`, `/mi-cuenta`, detalle, foto, login).

---

## Data model

`app/_data/mock.ts` exporta el contenido de ejemplo y los tipos que lo describen.

```ts
type PostKind = "achievement" | "activity" | "announcement";

type Post = {
  id: string;
  kind: PostKind;
  authorName: string;
  authorInitials: string;
  audience: string;
  publishedAt: string; // ISO 8601 en UTC, con sufijo Z
  message: string;
  reactions: number;
  comments: number;
  photo?: { label: string };
};
```

Convenciones:

- `publishedAt` siempre es un instante absoluto en UTC. Nunca se guarda texto ya formateado.
- Las horas de las publicaciones mock se derivan del momento de la solicitud: 07:50, 09:40 y 14:20 de hoy en `America/Argentina/Buenos_Aires`, convertidas a UTC.
- Los textos, contadores y destinatarios son idénticos a la referencia.
- La fecha del encabezado no es dato mock: se calcula en el navegador.

---

## Implementation plan

1. Configurar `app/layout.tsx` con `lang="es"`, metadatos del producto y las fuentes Fredoka y Nunito mediante `next/font/google`, con familias de respaldo. Ajustar `app/globals.css` con la paleta y los estilos base de la referencia. Verificación: `/` carga sin errores de consola.

2. Crear `app/_lib/format-date.ts` con funciones puras para formatear una fecha y una hora según la zona horaria recibida y para obtener la clave de día local (`YYYY-MM-DD`). Verificación: ejecutadas con dos zonas horarias distintas devuelven valores distintos para el mismo instante.

3. Crear `app/_data/mock.ts` con el tipo `Post`, la sala, la maestra y las tres publicaciones. Las horas se construyen a partir de la fecha actual y se serializan en UTC. Verificación: importar el módulo devuelve tres publicaciones en formato ISO.

4. Crear los componentes de presentación agrupados por alcance en `app/_components/`:
   - `layout/app-shell.tsx`: contenedor con barra lateral y área principal.
   - `layout/sidebar.tsx`: logotipo, botón de nueva publicación, navegación y tarjeta de usuario.
   - `layout/mobile-nav.tsx`: componente cliente con botón que abre y cierra el menú.
   - `feed/feed-header.tsx`: título, saludo y fecha local.
   - `feed/create-post-prompt.tsx`: acceso visual a nueva publicación.
   - `feed/post-feed.tsx`: lista y agrupación de publicaciones por día local.
   - `feed/post-card.tsx`: tarjeta con autor, tipo, texto, foto opcional y acciones.
   - `feed/post-kind-badge.tsx`: insignia de tipo con sus colores.
   - `layout/nav-menu.tsx` y `ui/icons.tsx`: navegación compartida e iconos.

   Verificación: cada componente puede renderizarse con datos mock sin dependencias externas.

5. Componer `app/page.tsx` con `AppShell`, `FeedHeader`, `CreatePostPrompt` y la lista de `PostCard`, agrupando publicaciones por día local y mostrando `PUBLICADO HOY` cuando corresponde. Verificación: `/` muestra las tres tarjetas con el diseño de la referencia.

6. Marcar como cliente los componentes que necesitan el navegador: menú móvil y fecha local. La fecha se muestra tras la hidratación para evitar discrepancias entre servidor y cliente. Verificación: la consola no informa errores de hidratación.

7. Añadir estilos responsive: barra lateral fija desde 1024 px, menú desplegable por debajo, tarjetas y encabezado adaptados. Verificación: sin desbordamiento horizontal a 375 px, 768 px y 1280 px.

8. Añadir `tests/home.spec.ts` con pruebas de contenido, fecha, agrupación y menú móvil. Verificación: `npx playwright test tests/home.spec.ts --project=chromium` pasa con `npm run dev` activo.

---

## Acceptance criteria

- [x] `/` muestra las tres publicaciones con los textos, destinatarios y contadores de la referencia. Evidencia: `tests/home.spec.ts` → "muestra las tres publicaciones de la referencia" (9/9 tests en verde).
- [x] En escritorio, la barra lateral y el feed conservan la composición de `references/ui/feed.dc.html`. Evidencia: captura `.playwright-mcp/spec01-desktop.png` (1280 px) comparada con la referencia.
- [x] La página no presenta desbordamiento horizontal a 375 px, 768 px ni 1280 px. Evidencia: `tests/home.spec.ts` → "no desborda horizontalmente en 375, 768 y 1280 px"; capturas `spec01-mobile.png`, `spec01-tablet.png` y `spec01-desktop.png`.
- [x] Por debajo de 1024 px, el botón del menú abre y cierra la navegación y expone su estado con `aria-expanded`. Evidencia: `tests/home.spec.ts` → "abre y cierra con Escape exponiendo aria-expanded" (abre, cierra con el botón, reabre y cierra con `Escape` a 375 px).
- [x] El menú móvil se cierra con la tecla `Escape`. Evidencia: mismo test; además verifica el foco devuelto al botón.
- [x] **Feed** lleva a `/`; ninguna acción lleva a una ruta inexistente. Evidencia: `tests/home.spec.ts` → "Feed lleva a la home y las demás acciones no navegan"; todos los `a[href]` apuntan a `/` y los botones se pulsan sin cambiar de URL.
- [x] La fecha del encabezado corresponde al día del visitante y está en español. Evidencia: `tests/home.spec.ts` → "muestra la fecha del visitante en español"; contrasta el texto con `Intl.DateTimeFormat("es-AR")` en el navegador.
- [x] Las horas de las publicaciones se muestran en la zona horaria del visitante. Evidencia: `tests/home.spec.ts` → "formatea las horas en la zona horaria del visitante"; cada `<time>` se compara con su `datetime` formateado en la zona del contexto.
- [x] Un mismo instante produce horas distintas al simular dos zonas horarias diferentes. Evidencia: mismo test con `America/Argentina/Buenos_Aires` y `Europe/Madrid`; las listas de horas difieren.
- [x] Las publicaciones se agrupan bajo `PUBLICADO HOY` solo si son del día local del visitante. Evidencia: tests de agrupación con `America/Argentina/Buenos_Aires` (1 grupo) y `Asia/Bangkok` (2 grupos, solo uno rotulado `PUBLICADO HOY`).
- [x] No hay errores de hidratación ni de consola. Evidencia: `tests/home.spec.ts` → "no registra errores de consola ni de hidratación"; capturas automatizadas en 375, 768 y 1280 px sin errores.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` finalizan correctamente. Evidencia: lint sin errores (solo 2 avisos previos en `tests/seed.spec.ts`), `tsc` sin salida, build de Next.js 16.4.2 completado con la ruta `/` generada.

---

## Decisions

- **Sí:** componentes de servidor para la estructura y componentes cliente solo para menú móvil y fecha. Mantiene el HTML inicial liviano y limita el JavaScript al mínimo.
- **Sí:** `next/font/google` con Fredoka y Nunito. Evita depender de un `<link>` externo y define respaldos del sistema.
- **Sí:** datos mock en `app/_data/mock.ts`. Separa contenido de presentación y facilita sustituirlos por datos reales.
- **Sí:** fechas como instantes UTC y formateo en el navegador con `Intl.DateTimeFormat`. Cumple el requisito de usar la zona horaria del visitante.
- **Sí:** fechas mock relativas al momento de la solicitud. Mantiene la sección `PUBLICADO HOY` coherente sin fijar horas históricas.
- **Sí:** agrupar por día local del visitante. Evita mostrar `HOY` sobre publicaciones de otro día.
- **Sí:** menú desplegable móvil con `aria-expanded` y cierre con `Escape`. Conserva acceso a la navegación sin ocupar la pantalla.
- **No:** rutas secundarias o enlaces provisionales. Evita enlaces rotos fuera del alcance.
- **No:** simular publicación, edición, reacciones o comentarios sin backend. Añadiría estado que esta spec no puede justificar.

---

## Risks

| Risk                                                      | Mitigation                                                             |
| --------------------------------------------------------- | ---------------------------------------------------------------------- |
| Diferencia entre la fecha del servidor y la del visitante | Formatear en el navegador y no renderizar la fecha en el HTML inicial. |
| Evitar parpadeo del encabezado mientras hidrata           | Reservar el espacio del texto de fecha con estilos de tamaño fijo.     |
| El menú móvil queda abierto al rotar a escritorio         | Ocultarlo por CSS desde 1024 px y reiniciar su estado.                 |
| Zona horaria no disponible en navegadores antiguos        | Usar `Intl.DateTimeFormat` con respaldo a la zona del sistema.         |

---

## What is **not** in this spec

- Autenticación y cierre de sesión.
- Backend, base de datos o persistencia.
- Crear, editar, comentar o reaccionar publicaciones.
- Páginas de niños, avisos, cuenta, detalle, foto o login.

Cada uno de esos puntos, si se implementa, va en su propia spec.
