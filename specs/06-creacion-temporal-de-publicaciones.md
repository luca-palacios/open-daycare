# SPEC 06 — Creación temporal de publicaciones

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 02, SPEC 03, SPEC 04  
> **Date:** 2026-10-26  
> **Objective:** Abrir desde «Nueva publicación» un modal basado en `references/ui/crear-publicacion.dc.html` para crear publicaciones temporales con destinatarios, tipo, descripción y fotos locales.

---

## Scope

**In:**

- Los botones «Nueva publicación» de escritorio y del menú móvil abren el modal desde las secciones de la app, sin cambiar la URL al abrirlo.
- El modal reproduce la composición visual de la referencia y se abre con destinatarios, tipo, descripción y fotos vacíos.
- Los destinatarios son los niños actuales de Sala Soles, incluidas sus altas temporales. Se pueden elegir varios niños o «Toda la sala», de forma excluyente.
- Se puede elegir uno de siete tipos: Comida, Siesta, Actividad, Logro, Ánimo, Foto o Anuncio.
- Para publicar son obligatorios al menos un destinatario, un tipo y una descripción no vacía. El tipo Foto exige además una imagen.
- «Agregar» permite seleccionar hasta tres imágenes JPG, PNG o WebP de 5 MB como máximo cada una, previsualizarlas y quitarlas. Los archivos no se suben.
- Una publicación válida cierra el modal, navega a `/` y aparece al principio del feed. Muestra a Caro Giménez como autora, los nombres seleccionados —o «toda la sala»— y las imágenes adjuntas.
- Las publicaciones sobreviven a la navegación interna y desaparecen al recargar o pulsar «Salir».
- «Cancelar» y Esc descartan el borrador; pulsar el fondo no cierra el modal. El foco permanece dentro del diálogo y vuelve al control de apertura al cancelar.
- Al abrir desde el menú móvil, este se cierra. Si se cancela, se reabre para poder devolver el foco al botón de apertura.

**Out of scope (para futuras specs):**

- Backend, subida de archivos y persistencia entre recargas.
- Edición, reacciones o comentarios funcionales.
- Abrir el modal desde «Compartí un momento…».
- Destinatarios de Sala Lunas y envío real de publicaciones a familias.

---

## Data model

`app/_data/mock.ts` amplía `PostKind` con `meal`, `nap`, `mood` y `photo`; conserva `achievement`, `activity` y `announcement`. `Post` mantiene su foto ilustrativa mock y admite imágenes locales para publicaciones nuevas.

`app/_components/feed/temporary-posts-provider.tsx` mantiene en memoria las publicaciones nuevas. Cada una incluye un ID único, `publishedAt` como instante ISO UTC, el tipo, la descripción, la autora, una audiencia textual y hasta tres imágenes con URL local y texto alternativo. La selección de audiencia distingue entre `{ scope: "room" }` y `{ scope: "kids", kidIds: string[] }`: «Toda la sala» no se convierte en una lista fija de IDs. Al publicar para niños concretos, la audiencia textual guarda sus nombres en ese momento.

Las URL locales de imágenes se liberan al quitar una foto, descartar un borrador o limpiar las publicaciones al salir. Ningún archivo, borrador o publicación se guarda en almacenamiento del navegador.

---

## Implementation plan

1. Ampliar los tipos de publicación en `app/_data/mock.ts` y las insignias en `app/_components/feed/post-kind-badge.tsx`, sin alterar las tres publicaciones mock.
2. Añadir validación y gestión de imágenes locales en `app/_lib/post-validation.ts`.
3. Crear `app/_components/feed/temporary-posts-provider.tsx` y conectarlo en `app/layout.tsx` para compartir publicaciones durante la navegación.
4. Crear `app/_components/feed/create-post-modal.tsx` con el formulario, las opciones obtenidas de Sala Soles, vistas previas, errores por campo y gestión accesible del foco.
5. Conectar la apertura desde `app/_components/layout/nav-menu.tsx` y `app/_components/layout/mobile-nav.tsx`; mantener inactivo `app/_components/feed/create-post-prompt.tsx`.
6. Integrar las publicaciones temporales en `app/_components/feed/post-feed.tsx` y `app/page.tsx`. Adaptar `app/_components/feed/post-card.tsx` para mostrar autora, nuevos tipos e imágenes locales sin cambiar las tarjetas mock.
7. Limpiar las publicaciones desde la acción «Salir» y ampliar `tests/home.spec.ts` para cubrir el flujo de escritorio y móvil, validación, fotos, navegación y duración en memoria.

---

## Acceptance criteria

- [ ] «Nueva publicación» abre el modal en escritorio y móvil sin cambiar la URL; «Compartí un momento…» no lo abre.
- [ ] Cada apertura presenta el formulario vacío y las opciones incluyen los niños temporales de Soles, pero no los de Lunas.
- [ ] Se pueden seleccionar varios niños; «Toda la sala» excluye las selecciones individuales.
- [ ] No se publica sin destinatario, tipo o descripción; los errores se muestran junto al control correspondiente y se enfoca el primero.
- [ ] Elegir Foto sin adjuntar una imagen impide publicar.
- [ ] Se aceptan como máximo tres JPG, PNG o WebP de hasta 5 MB cada uno; se pueden previsualizar y quitar. Un archivo inválido muestra un error y no se adjunta.
- [ ] Una publicación válida aparece primero en `/`, con Caro Giménez, el tipo elegido, la descripción, la audiencia acordada y sus imágenes.
- [ ] Publicar desde otra sección lleva a `/`; navegar dentro de la app conserva la publicación, mientras que recargar o pulsar «Salir» la elimina.
- [ ] «Cancelar» y Esc descartan el borrador y restituyen el foco; pulsar el fondo no cierra el modal y Tab no lleva el foco fuera.
- [ ] En móvil, abrir el modal cierra el menú; cancelar lo reabre y devuelve el foco a «Nueva publicación».
- [ ] No hay desbordamiento horizontal a 375, 768 ni 1280 px.
- [ ] Pasan `tests/home.spec.ts`, `npm run lint`, `npx tsc --noEmit` y `npm run build`.

---

## Decisions

- **Sí:** publicaciones y fotos solo en memoria. **No:** persistencia o subida de archivos; no existe un servicio para recibirlas.
- **Sí:** siete tipos visibles y publicables. **No:** limitar el formulario a los tres tipos mock.
- **Sí:** formulario vacío en cada apertura. **No:** publicar por defecto el texto de ejemplo de la referencia.
- **Sí:** niños de Soles actuales y «Toda la sala» como audiencia colectiva. **No:** mezclar destinatarios de Lunas ni congelar todos los IDs al elegir la sala.
- **Sí:** mostrar los nombres elegidos en la tarjeta. **No:** sustituirlos por un contador.
- **Sí:** abrir únicamente desde «Nueva publicación». **No:** activar «Compartí un momento…» en esta spec.
- **Sí:** descartar al cancelar o pulsar Esc, sin cerrar al pulsar el fondo. **No:** conservar borradores cancelados.

---

## Risks

| Risk                                                     | Mitigation                                                                   |
| -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Las imágenes locales consumen memoria                    | Limitar cantidad, tamaño y formatos; liberar las URL cuando dejan de usarse. |
| El menú móvil oculta el botón que debe recuperar el foco | Reabrir el menú antes de devolver el foco al cancelar.                       |
| Una recarga elimina publicaciones creadas                | Mantener explícito su carácter temporal y comprobarlo en las pruebas.        |

---

## What is **not** in this spec

- Publicación real para familias, backend, almacenamiento o subida de fotos.
- Edición, reacciones y comentarios funcionales.
- Apertura desde «Compartí un momento…» o selección de destinatarios de Sala Lunas.
