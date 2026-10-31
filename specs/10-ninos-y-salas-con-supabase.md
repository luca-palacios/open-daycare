# SPEC 10 — Niños y salas con Supabase

> **Status:** Approved
> **Depends on:** SPEC 02, SPEC 04, SPEC 06, SPEC 07, SPEC 08, SPEC 09
> **Date:** 2026-10-30
> **Objective:** Sustituir los niños mock y temporales de `/kids` por salas y niños persistidos en Supabase, con altas y perfiles reales.

---

## Scope

**In:**

- Crear `public.rooms` y `public.children` según `DATABASE.md`, con RLS y permisos limitados al personal `staff` activo de su guardería.
- Renombrar la guardería existente «Sala Soles» a «Estrellitas» en la base de datos y en los textos visibles, sin renombrar la sala Soles.
- Crear las salas Soles, Lunas y Estrellas para Estrellitas. La tabla `children` comienza sin registros.
- Mostrar las tres salas vacías, sus contadores en cero y un mensaje «Aún no hay niños». Mantener búsqueda para los niños registrados después.
- Guardar «Agregar niño» en `children`. El alta aparece en `/kids`, abre `/kids/[id]` y persiste tras recargas y cierre de sesión.
- Mostrar únicamente niños con `status = active`. Un ID inexistente o archivado devuelve 404.
- Mostrar alergias traducidas y notas médicas en secciones separadas. El selector de alergias acepta Maní, Lactosa y Gluten, que se guardan como `peanut`, `lactose` y `gluten` en `allergy_tags`. Un valor sin correspondencia se rechaza con un error visible.
- Dejar que `photo_consent` use el default definido en el esquema; el formulario no añade un control de consentimiento.
- Actualizar el contador del feed con el total real de niños activos y la marca visible a «Estrellitas». El modal temporal de publicación obtiene destinatarios reales y activos de Soles.
- Ejecutar las pruebas de esta integración contra una rama remota de Supabase creada y conservada para pruebas. Conservar en esa rama los registros creados por las pruebas.
- Ejecutar la suite remota una vez inicialmente. Si se hacen correcciones por fallos, repetirla una sola vez; no iniciar un segundo ciclo de correcciones y repetición.
- Mantener las credenciales fuera de Git y usar el `.env` existente, sin crear otro archivo de entorno.

**Out of scope (para futuras specs):**

- Edición o archivado de niños.
- Vinculación real de padres, invitaciones y acceso de padres o administradores.
- Persistencia o migración de publicaciones. Las publicaciones siguen siendo mock o temporales.
- Crear salas para guarderías distintas de Estrellitas.

## Data model

`public.rooms` y `public.children` siguen los campos, tipos, restricciones y convenciones documentados en `DATABASE.md`.

La migración renombra la guardería existente mediante su UUID estable y carga de forma repetible las tres salas de Estrellitas. No crea registros en `children`.

El mapeo de alergias en la capa de aplicación es:

```ts
const ALLERGY_TAGS = {
  Maní: "peanut",
  Lactosa: "lactose",
  Gluten: "gluten",
} as const;
```

Los perfiles no tienen padres vinculados en esta fase. «Vincular otro padre» queda deshabilitado. `photo_consent` usa el default documentado en el esquema.

## Implementation plan

1. Crear una migración SQL versionada para `rooms` y `children`, índices y restricciones documentados, políticas RLS y permisos mínimos. Renombrar la guardería por su UUID estable e insertar Soles, Lunas y Estrellas de forma repetible. Actualizar `DATABASE.md`.
2. Aplicar y verificar la migración en el proyecto y la rama remota de pruebas. Confirmar las tres salas, cero niños iniciales, permisos efectivos y asesores de seguridad; generar los tipos TypeScript desde el esquema aplicado.
3. Sustituir la consulta mock de `app/kids/page.tsx` por datos reales. Adaptar `app/_components/kids/kids-directory.tsx` para mostrar salas, contadores, búsqueda, estado inicial vacío y errores de carga con reintento.
4. Adaptar `app/_components/kids/add-kid-modal.tsx` y `app/_lib/temporary-kid.ts` para validar, traducir alergias e insertar en Supabase. Un fallo conserva el formulario y muestra un error; no crea un registro temporal.
5. Sustituir la resolución mock de `app/kids/[id]/page.tsx` por consulta de un niño activo. Adaptar los componentes del perfil para mostrar datos persistidos, notas médicas separadas y sin padres ficticios; deshabilitar «Vincular otro padre».
6. Actualizar el contador de `app/page.tsx` y `app/_components/feed/feed-header.tsx`, los destinatarios de `app/_components/feed/create-post-modal.tsx` y los textos visibles de marca para usar el total real, niños de Soles y «Estrellitas», sin migrar publicaciones.
7. Actualizar `tests/kids.spec.ts` y las pruebas afectadas del feed para Supabase remoto. Antes de la ejecución inicial, comprobar en la rama de pruebas que `children` está vacía y que existen las tres salas. Las pruebas crean registros con identificadores únicos y los conservan en la rama; configurar cero reintentos automáticos para no exceder el máximo acordado.
8. Ejecutar una vez las pruebas remotas, además de `npm run lint`, `npx tsc --noEmit` y `npm run build`. Si las pruebas requieren correcciones, hacer un único ciclo de corrección y repetir la suite remota una sola vez; registrar el resultado final sin iniciar más ciclos.

## Acceptance criteria

- [ ] La guardería existente se llama «Estrellitas» en base de datos y textos visibles; Soles sigue siendo el nombre de una sala.
- [ ] Estrellitas tiene exactamente las salas Soles, Lunas y Estrellas, y `children` está vacía antes de la ejecución inicial de pruebas.
- [ ] `/kids` muestra las tres salas con contador cero y un estado que invita a agregar el primer niño, sin mostrar los registros mock.
- [ ] Un `staff` activo crea un niño en cualquiera de las tres salas y puede encontrarlo con la búsqueda.
- [ ] El niño creado persiste tras recargar y cerrar y volver a iniciar sesión; su tarjeta abre `/kids/[id]`.
- [ ] El perfil muestra nombre, sala, fechas, alergias traducidas y notas médicas por separado cuando existan.
- [ ] Maní, Lactosa y Gluten se guardan como `peanut`, `lactose` y `gluten`; un término no mapeado impide guardar y muestra un error.
- [ ] El listado solo incluye niños activos; un niño archivado y un ID inexistente devuelven 404 en el perfil.
- [ ] Un error de lectura muestra una acción de reintento; un error de inserción conserva el formulario y no presenta el niño como guardado.
- [ ] Las políticas impiden a usuarios anónimos, usuarios de otra guardería y perfiles que no sean `staff` activos leer o insertar niños fuera de su guardería.
- [ ] El feed muestra el total real de niños activos, y el modal temporal ofrece solo niños reales activos de Soles.
- [ ] La rama remota de pruebas y los registros que esta suite crea se conservan; ningún registro de prueba se borra automáticamente.
- [ ] La suite remota se ejecuta una vez inicialmente y, si hay correcciones, como máximo una vez adicional; el resultado y el número de ejecuciones quedan registrados.
- [ ] Pasan las pruebas acordadas, `npm run lint`, `npx tsc --noEmit` y `npm run build`, sujeto al límite de una única repetición de la suite remota tras correcciones.

## Decisions

- **Sí:** tabla de niños inicialmente vacía y tres salas visibles. **No:** mantener los ocho niños mock en `/kids`.
- **Sí:** salas Soles, Lunas y Estrellas para Estrellitas. **No:** renombrar la sala Soles o crear estas salas en otras guarderías.
- **Sí:** alergias Maní, Lactosa y Gluten con mapeo explícito a códigos ingleses. **No:** aceptar valores sin correspondencia ni inferir códigos.
- **Sí:** acceso limitado con RLS al `staff` activo de la misma guardería. **No:** acceso anónimo, de padres o administradores en esta spec.
- **Sí:** errores visibles con reintento para lecturas y conservación del formulario cuando falle el alta. **No:** simular persistencia con estado temporal.
- **Sí:** contador y destinatarios basados en niños reales, publicaciones aún temporales. **No:** migrar el feed completo.
- **Sí:** rama remota de pruebas creada y conservada, con registros de prueba retenidos. **No:** ejecutar contra Supabase local, borrar datos de prueba o usar la base principal como destino de la suite.
- **Sí:** una ejecución inicial y un máximo de una repetición si se corrige un fallo. **No:** encadenar ciclos de correcciones y nuevas ejecuciones.
- **Sí:** usar el default de `photo_consent`. **No:** añadir un control nuevo al formulario.

## Risks

| Risk                                                                                   | Mitigation                                                                                                                               |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| RLS expone datos médicos entre guarderías                                              | Verificar permisos con perfiles de prueba de distintas guarderías y una sesión anónima en la rama remota.                                |
| Las pruebas remotas conservan registros y se repiten                                   | Usar nombres y datos identificables únicos por ejecución, conservarlos en la rama y limitar la suite a una repetición tras correcciones. |
| La rama remota no tiene perfil `staff` o configuración de aplicación para autenticarse | Preparar la rama y sus credenciales de prueba antes de la ejecución; guardar secretos solo en `.env`, nunca en Git.                      |
| El feed mock referencia niños que no están en la base real                             | Mantener claro su carácter mock y limitar las opciones seleccionables a niños activos reales de Soles.                                   |

## What is **not** in this spec

- Edición o archivado de niños.
- Vinculación real de padres, invitaciones o acceso de roles distintos de `staff`.
- Persistencia o migración de publicaciones.
- Salas para otras guarderías.
- Borrado de la rama remota de pruebas o de los registros que genere la suite.
