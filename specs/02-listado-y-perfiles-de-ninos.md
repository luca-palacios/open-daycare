# SPEC 02 — Listado y perfiles de niños

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-10-22
> **Objective:** Incorporar `/kids` y `/kids/[id]` con datos mock y el diseño de `references/ui/ninos.dc.html` y `references/ui/perfil-nino.dc.html`, reutilizando la interfaz existente.

---

## Por qué existe esta spec

SPEC 01 definió el feed y dejó fuera las páginas secundarias. La navegación ya ofrece «Niños» sin destino, y la home afirma un total de niños que hoy no está respaldado por ningún dato.

Esta spec abre esa sección con la misma identidad visual y el mismo enfoque que el feed: componentes de servidor, datos mock aislados y comportamiento de navegador limitado al filtro.

---

## Scope

**In:**

- Mostrar en `/kids` los ocho niños del mock, con búsqueda en vivo por nombre y apellidos, sin distinguir mayúsculas ni acentos.
- Abrir desde cada tarjeta su perfil en `/kids/[id]`. Los ocho perfiles tendrán datos de ejemplo completos y compartirán el diseño de la referencia.
- Mantener el contador de la home y el del listado en ocho niños.
- Calcular la edad en años completos según la fecha actual de `America/Argentina/Buenos_Aires`. Las fechas de nacimiento mock serán coherentes con las edades de 2 o 3 años mostradas.
- Reutilizar la barra lateral y el menú móvil. «Niños» estará activo en ambas rutas nuevas; «Feed», en `/`.
- Mostrar un estado sin resultados, omitir la alerta cuando no haya alergias y mostrar «Sin padres vinculados» cuando corresponda.
- Devolver el 404 de Next.js para un ID inexistente. Conservar el diseño adaptable de la app.

**Out of scope (para futuras specs):**

- Altas, edición, vinculación de padres y resumen del día funcionales. Sus controles serán visibles, pero no navegarán a rutas inexistentes.
- Backend, autenticación, persistencia y datos reales.
- Cambios funcionales en el feed distintos de actualizar su contador y navegación.

---

## Data model

`app/_data/kids.ts` exporta los ocho registros mock y los tipos que los describen.

```ts
type ParentStatus = "active" | "pending";

type Parent = {
  id: string;
  name: string;
  relationship: "mamá" | "papá" | "tutor";
  status: ParentStatus;
};

type Kid = {
  id: string;
  name: string;
  birthDate: string; // ISO 8601, solo fecha: YYYY-MM-DD
  joinedAt: string; // ISO 8601, solo fecha: YYYY-MM-DD
  room: string;
  initials: string;
  avatarTone: "sky" | "rose" | "mint" | "sun" | "lilac";
  allergies?: string;
  parents: Parent[];
};
```

Convenciones:

- `id` es estable, único y en kebab-case (`mateo-fernandez`). Es el segmento de `/kids/[id]`.
- Se conservan los ocho nombres del listado de referencia, con el mismo orden.
- Mateo conserva su alerta y sus dos padres: uno `active` y otro `pending`.
- Las fechas de nacimiento se ajustan para que las edades calculadas sean coherentes con los 2 o 3 años de la referencia.
- La cantidad de padres y las insignias del listado se derivan de `parents`, sin duplicar valores.
- La edad no se guarda: se calcula desde `birthDate` y la fecha vigente en Argentina.
- No hay datos persistentes.

---

## Implementation plan

1. Crear `app/_data/kids.ts` con los tipos, los ocho registros y helpers de consulta por ID. Verificación: importar el módulo devuelve ocho niños con IDs únicos.
2. Crear `app/_lib/kid-age.ts` con el cálculo de años completos y el formato de fecha en español. Verificación: dos fechas de nacimiento conocidas devuelven edades distintas antes y después del cumpleaños.
3. Crear `app/kids/page.tsx` y los componentes del listado en `app/_components/`: encabezado con acción, buscador, tarjeta y estado vacío. Verificación: `/kids` renderiza las ocho tarjetas.
4. Implementar la búsqueda en vivo como componente cliente con conteo de resultados. Verificación: filtrar por nombre parcial reduce las tarjetas y una búsqueda sin coincidencias muestra el estado vacío.
5. Crear `app/kids/[id]/page.tsx` y los componentes del perfil: cabecera, alerta de alergias, ficha de datos, panel de padres y acción de resumen. Resolver el niño por ID y usar el 404 de Next.js cuando no exista. Verificación: los ocho perfiles cargan y un ID inventado devuelve 404.
6. Actualizar `app/_components/nav-menu.tsx` para enlazar «Niños» a `/kids` y calcular la sección activa desde la ruta, tanto en escritorio como en móvil. Verificación: el ítem activo cambia entre `/`, `/kids` y `/kids/[id]`.
7. Ajustar a ocho el contador mock de la home en `app/_data/mock.ts` y verificar que `/` sigue intacto. Verificación: home y listado muestran ocho.
8. Añadir `tests/kids.spec.ts` con listado, búsqueda, perfiles, 404, navegación y anchos de 375, 768 y 1280 px. Verificación: `npx playwright test tests/kids.spec.ts --project=chromium` pasa con `npm run dev` activo.

---

## Acceptance criteria

- [ ] `/kids` muestra los ocho nombres de `references/ui/ninos.dc.html` y un contador de ocho.
- [ ] La home muestra ocho niños; `/` y su feed siguen funcionando.
- [ ] Buscar por una parte del nombre, con distinta capitalización o sin acentos, filtra las tarjetas y actualiza el contador.
- [ ] Una búsqueda sin coincidencias muestra un estado vacío.
- [ ] Cada tarjeta abre `/kids/[id]` con los datos del niño seleccionado; «Volver a Niños» regresa al listado.
- [ ] Mateo muestra su alerta y sus dos padres con estados activo y pendiente.
- [ ] Un niño sin alergias no muestra alerta; uno sin padres muestra «Sin padres vinculados».
- [ ] Las edades corresponden a las fechas de nacimiento y al día actual en Argentina.
- [ ] Un ID inexistente devuelve 404.
- [ ] «Niños» aparece activo en listado y perfil; «Feed» vuelve a aparecer activo en `/`, también en el menú móvil.
- [ ] Ninguna acción fuera de alcance navega a una ruta inexistente.
- [ ] No hay desbordamiento horizontal a 375, 768 ni 1280 px.
- [ ] Pasan las pruebas de `tests/kids.spec.ts`, `npm run lint`, `npx tsc --noEmit` y `npm run build`.

---

## Decisions

- **Sí:** rutas `/kids` y `/kids/[id]`. **No:** rutas en español o un perfil único para todas las tarjetas.
- **Sí:** ocho perfiles mock completos. **No:** copiar los datos de Mateo en los demás.
- **Sí:** edades calculadas y fechas coherentes. **No:** reproducir la contradicción entre edad y nacimiento del mock.
- **Sí:** búsqueda local por nombre y apellidos. **No:** búsqueda por notas, alergias o padres.
- **Sí:** reutilizar la navegación existente. **No:** crear un segundo menú para estas páginas.
- **Sí:** controles visibles sin navegación para funciones futuras. **No:** implementar sus páginas en esta spec.

---

## Risks

| Risk                                          | Mitigation                                                                    |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| La edad cambia al pasar un cumpleaños         | Calcularla con la fecha vigente en Argentina, no guardar una edad fija.       |
| Contadores y perfiles mock divergen           | Derivar tarjetas, cantidad de padres y total desde los mismos ocho registros. |
| El 404 no se muestra si el ID se resuelve mal | Resolver con `notFound()` de Next.js y cubrirlo con una prueba automatizada.  |

---

## What is **not** in this spec

- Altas, edición, vinculación de padres y resumen del día.
- Autenticación, backend, base de datos o persistencia.
- Cambios en el contenido del feed más allá del contador.
- Pantallas de avisos, mi cuenta, detalle, foto o login.

Cada uno de esos puntos, si se implementa, va en su propia spec.
