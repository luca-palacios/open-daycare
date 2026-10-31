# SPEC 10 — Niños y salas con Supabase

> **Status:** Approved
> **Depends on:** SPEC 02, SPEC 04, SPEC 06, SPEC 07, SPEC 08, SPEC 09
> **Date:** 2026-10-31
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
- Mostrar alergias y notas médicas en secciones separadas. El campo de alergias es una entrada libre con tags separados por comas; cada tag se guarda tal como lo escribe el usuario en `allergy_tags`, sin mapeos ni validaciones de contenido.
- Dejar que `photo_consent` use el default definido en el esquema; el formulario no añade un control de consentimiento.
- Actualizar el contador del feed con el total real de niños activos y la marca visible a «Estrellitas». El modal temporal de publicación obtiene destinatarios reales y activos de Soles.
- Ejecutar las pruebas contra el proyecto Supabase existente configurado en `.env`, que se considera exclusivamente de desarrollo/pruebas y nunca se promoverá a producción. No crear una rama remota. Conservar los registros creados por las pruebas en este proyecto.
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

Las alergias son entradas libres: cada tag separado por comas se guarda tal como lo escribe el usuario, sin mapeo ni validación de contenido.

Los perfiles no tienen padres vinculados en esta fase. «Vincular otro padre» queda deshabilitado. `photo_consent` usa el default documentado en el esquema.

## Implementation plan

1. Crear una migración SQL versionada para `rooms` y `children`, índices y restricciones documentados, políticas RLS y permisos mínimos. Renombrar la guardería por su UUID estable e insertar Soles, Lunas y Estrellas de forma repetible. Actualizar `DATABASE.md`.
2. Aplicar y verificar la migración en el proyecto Supabase existente, usado exclusivamente para desarrollo/pruebas. Confirmar las tres salas, cero niños iniciales, permisos efectivos y asesores de seguridad; generar los tipos TypeScript desde el esquema aplicado.
3. Sustituir la consulta mock de `app/kids/page.tsx` por datos reales. Adaptar `app/_components/kids/kids-directory.tsx` para mostrar salas, contadores, búsqueda, estado inicial vacío y errores de carga con reintento.
4. Adaptar `app/_components/kids/add-kid-modal.tsx` y `app/_lib/temporary-kid.ts` para validar los campos obligatorios, separar los tags de alergias por comas e insertar en Supabase. Un fallo conserva el formulario y muestra un error; no crea un registro temporal.
5. Sustituir la resolución mock de `app/kids/[id]/page.tsx` por consulta de un niño activo. Adaptar los componentes del perfil para mostrar datos persistidos, notas médicas separadas y sin padres ficticios; deshabilitar «Vincular otro padre».
6. Actualizar el contador de `app/page.tsx` y `app/_components/feed/feed-header.tsx`, los destinatarios de `app/_components/feed/create-post-modal.tsx` y los textos visibles de marca para usar el total real, niños de Soles y «Estrellitas», sin migrar publicaciones.
7. Actualizar `tests/kids.spec.ts` y las pruebas afectadas del feed para Supabase remoto. Antes de la ejecución inicial, comprobar en el proyecto de desarrollo/pruebas que `children` está vacía y que existen las tres salas. Las pruebas crean registros con identificadores únicos y los conservan en el proyecto; configurar cero reintentos automáticos para no exceder el máximo acordado.
8. Ejecutar una vez las pruebas remotas, además de `npm run lint`, `npx tsc --noEmit` y `npm run build`. Si las pruebas requieren correcciones, hacer un único ciclo de corrección y repetir la suite remota una sola vez; registrar el resultado final sin iniciar más ciclos.

## Acceptance criteria

- [ ] La guardería existente se llama «Estrellitas» en base de datos y textos visibles; Soles sigue siendo el nombre de una sala.
- [ ] Estrellitas tiene exactamente las salas Soles, Lunas y Estrellas, y `children` está vacía antes de la ejecución inicial de pruebas.
- [ ] `/kids` muestra las tres salas con contador cero y un estado que invita a agregar el primer niño, sin mostrar los registros mock.
- [ ] Un `staff` activo crea un niño en cualquiera de las tres salas y puede encontrarlo con la búsqueda.
- [ ] El niño creado persiste tras recargar y cerrar y volver a iniciar sesión; su tarjeta abre `/kids/[id]`.
- [ ] El perfil muestra nombre, sala, fechas, alergias tal como se guardaron y notas médicas por separado cuando existan.
- [ ] El input de alergias acepta texto libre con tags separados por comas y guarda cada tag tal como se escribió; no hay mapeos ni validaciones de contenido.
- [ ] El listado solo incluye niños activos; un niño archivado y un ID inexistente devuelven 404 en el perfil.
- [ ] Un error de lectura muestra una acción de reintento; un error de inserción conserva el formulario y no presenta el niño como guardado.
- [ ] Las políticas impiden a usuarios anónimos, usuarios de otra guardería y perfiles que no sean `staff` activos leer o insertar niños fuera de su guardería.
- [ ] El feed muestra el total real de niños activos, y el modal temporal ofrece solo niños reales activos de Soles.
- [ ] La suite usa el proyecto Supabase existente, reservado para desarrollo/pruebas y nunca promovido a producción; no se crea una rama remota y ningún registro de prueba se borra automáticamente.
- [ ] La suite remota se ejecuta una vez inicialmente y, si hay correcciones, como máximo una vez adicional; el resultado y el número de ejecuciones quedan registrados.
- [ ] Pasan las pruebas acordadas, `npm run lint`, `npx tsc --noEmit` y `npm run build`, sujeto al límite de una única repetición de la suite remota tras correcciones.

## Decisions

- **Sí:** tabla de niños inicialmente vacía y tres salas visibles. **No:** mantener los ocho niños mock en `/kids`.
- **Sí:** salas Soles, Lunas y Estrellas para Estrellitas. **No:** renombrar la sala Soles o crear estas salas en otras guarderías.
- **Sí:** alergias como entrada libre con tags separados por comas, guardadas tal como se escriben. **No:** mapear a códigos ingleses, validar valores o inferir códigos.
- **Sí:** acceso limitado con RLS al `staff` activo de la misma guardería. **No:** acceso anónimo, de padres o administradores en esta spec.
- **Sí:** errores visibles con reintento para lecturas y conservación del formulario cuando falle el alta. **No:** simular persistencia con estado temporal.
- **Sí:** contador y destinatarios basados en niños reales, publicaciones aún temporales. **No:** migrar el feed completo.
- **Sí:** usar el proyecto Supabase existente como entorno exclusivo de desarrollo/pruebas, conservar los registros creados y no promover el proyecto a producción. **No:** crear una rama remota, ejecutar contra Supabase local o borrar datos de prueba.
- **Sí:** una ejecución inicial y un máximo de una repetición si se corrige un fallo. **No:** encadenar ciclos de correcciones y nuevas ejecuciones.
- **Sí:** usar el default de `photo_consent`. **No:** añadir un control nuevo al formulario.

## Risks

| Risk                                                                                   | Mitigation                                                                                                                               |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| RLS expone datos médicos entre guarderías                                              | Verificar permisos con perfiles de prueba de distintas guarderías y una sesión anónima en el proyecto de desarrollo/pruebas.             |
| Las pruebas remotas conservan registros y se repiten                                   | Usar nombres y datos identificables únicos por ejecución, conservarlos en el proyecto y limitar la suite a una repetición tras correcciones. |
| El proyecto de desarrollo/pruebas no tiene perfil `staff` o configuración para autenticarse | Preparar los perfiles y credenciales de prueba antes de la ejecución; guardar secretos solo en `.env`, nunca en Git.                   |
| El feed mock referencia niños que no están en la base real                             | Mantener claro su carácter mock y limitar las opciones seleccionables a niños activos reales de Soles.                                   |

## What is **not** in this spec

- Edición o archivado de niños.
- Vinculación real de padres, invitaciones o acceso de roles distintos de `staff`.
- Persistencia o migración de publicaciones.
- Salas para otras guarderías.
- Creación o administración de ramas remotas de Supabase.
- Borrado de los registros que genere la suite.

## Resultado de ejecución remota

- Precondición: `children` tenía 1 registro previo no creado por la suite («Juana de Arco»); se eliminó con aprobación explícita y después quedó vacía. Las tres salas de Estrellitas existían.
- Ejecución 1 (inicial, chromium, 1 worker, 0 reintentos): 22 pasaron, 1 falló (selector ambiguo en el perfil, corregido), 9 no se ejecutaron por modo serial.
- Ejecución 2 (única repetición permitida): 25 pasaron, 1 falló, 6 no se ejecutaron. Fallo: la prueba espera el foco en el niño de Soles creado, pero la app enfoca el primer destinatario de la lista ordenada alfabéticamente. Es un defecto de la prueba.
- No se realizó un segundo ciclo de correcciones. Los registros creados por la suite se conservan en el proyecto.
- Decisión: se acepta el resultado actual. El fallo de foco y las 6 pruebas no ejecutadas quedan documentados para la siguiente iteración; la spec sigue en «Approved» porque no todos los criterios de aceptación se cumplen.
- `npm run lint` (sin errores; 2 advertencias preexistentes en `tests/seed.spec.ts`), `npx tsc --noEmit` y `npm run build` pasan.
- Pendiente de verificación manual: error de lectura (consulta en servidor, no interceptable) y niño archivado (no creable desde la UI).
