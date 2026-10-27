# SPEC 04 — Alta temporal de niños

> **Status:** Implemented
> **Depends on:** SPEC 02, SPEC 03
> **Date:** 2026-10-25
> **Objective:** Permitir agregar niños desde un modal en `/kids`, mostrarlos temporalmente en el listado y reflejar su alta en el contador del feed.

---

## Scope

**In:**

- «Agregar niño» abre, sin cambiar la URL, un modal basado en `references/ui/agregar-nino.dc.html`.
- El formulario incluye nombre, fecha de nacimiento, sala («Soles» o «Lunas»), alergias y notas médicas. Nombre, fecha y sala son obligatorios.
- «Cancelar» y Esc cierran el modal sin guardar; pulsar el fondo no lo cierra.
- «Guardar» muestra errores junto a los campos inválidos y enfoca el primero. La fecha debe existir y no ser posterior al día actual en Argentina.
- Un alta válida cierra el modal y añade una tarjeta a la sección de su sala. La búsqueda abarca ambas salas.
- El feed muestra el total de niños de todas las salas, sin atribuir ese total a Soles.
- La tarjeta nueva abre una vista de perfil **dentro de `/kids`**, sin URL propia. Muestra también las notas médicas.

**Out of scope (para futuras specs):**

- Persistencia, backend, edición, nuevas salas y una ruta `/kids/[id]` para niños temporales.
- Cambios en los perfiles o el feed de publicaciones existentes.

---

## Data model

`Kid` en `app/_data/kids.ts` incorpora `medicalNotes?: string`. Las altas usan el modelo existente: `id` temporal único, `birthDate` y `joinedAt` en formato `YYYY-MM-DD`, `room` igual a `Soles` o `Lunas`, y `parents: []`. Las alergias ingresadas separadas por comas se limpian y se guardan como texto en `allergies`.

Los registros nuevos y sus notas permanecen únicamente en memoria mientras se navega dentro de la app. Se eliminan al recargar o cerrar sesión; no se escriben en cookies ni almacenamiento del navegador. Los ocho registros mock permanecen intactos.

---

## Implementation plan

1. Incorporar validación de los campos y generación de ID y fecha de ingreso en helpers de `app/_lib/`.
2. Añadir el estado compartido de altas temporales desde `app/layout.tsx`, de modo que `/kids` y `/` consulten el mismo total; limpiarlo al usar «Salir».
3. Crear el formulario modal en `app/_components/kids/` y conectar `app/_components/kids/kids-header.tsx` con su apertura. Gestionar foco, Esc y mensajes de error.
4. Adaptar `app/_components/kids/kids-directory.tsx` para agrupar por sala, buscar en ambas y mostrar la vista de perfil temporal. Mantener `app/kids/[id]/page.tsx` y su 404 para los perfiles existentes.
5. Ajustar `app/_components/feed/feed-header.tsx` para mostrar el total general actualizado.
6. Ampliar `tests/kids.spec.ts` y las pruebas del feed para cubrir altas, validación, salas, perfil temporal, recarga, cierre de sesión y tamaños de pantalla.

---

## Acceptance criteria

- [x] El botón abre el modal en `/kids` sin cambiar la URL; «Cancelar» y Esc lo cierran, pero pulsar el fondo no.
- [x] Un formulario inválido no se cierra, anuncia errores por campo y enfoca el primero.
- [x] Una fecha imposible o futura no permite guardar.
- [x] Un alta válida aparece en la sala elegida, entra en la búsqueda y actualiza su contador.
- [x] El contador general del feed incluye el alta, incluso si pertenece a Lunas.
- [x] La tarjeta nueva abre en `/kids` un perfil que muestra alergias y notas médicas cuando existen.
- [x] Recargar o cerrar sesión elimina el alta y restaura los contadores mock.
- [x] Los ocho perfiles existentes y el HTTP 404 de un ID desconocido siguen funcionando.
- [x] El modal no desborda horizontalmente a 375, 768 ni 1280 px.
- [x] Pasan las pruebas, `npm run lint`, `npx tsc --noEmit` y `npm run build`.

---

## Decisions

- **Sí:** modal sin ruta y estado solo en memoria. **No:** página independiente ni persistencia.
- **Sí:** salas Soles y Lunas con secciones propias. **No:** asignar toda alta a Soles.
- **Sí:** perfil temporal dentro de `/kids`. **No:** usar `/kids/[id]`, cuyo 404 se resuelve en el servidor sin acceso al estado temporal.
- **Sí:** total general en el feed. **No:** presentar niños de Lunas como parte del total de Soles.
- **Sí:** conservar las notas solo durante la visita. **No:** almacenarlas en el navegador.

---

## Risks

| Risk                                               | Mitigation                                                                    |
| -------------------------------------------------- | ----------------------------------------------------------------------------- |
| Una recarga descarta datos ingresados              | Mantener explícito el carácter temporal del alta y probar ese comportamiento. |
| El estado compartido sobrevive al cierre de sesión | Limpiarlo al ejecutar «Salir» y cubrirlo con una prueba.                      |

---

## What is **not** in this spec

- Persistencia, backend, edición, más salas ni rutas de perfil para altas temporales.
