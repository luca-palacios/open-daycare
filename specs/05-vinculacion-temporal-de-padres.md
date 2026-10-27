# SPEC 05 — Vinculación temporal de padres

> **Status:** Approved
> **Depends on:** SPEC 02, SPEC 03, SPEC 04
> **Date:** 2026-10-26
> **Objective:** Abrir desde «Vincular otro padre» en `/kids/[id]` un modal basado en `references/ui/vincular-padre.dc.html` para añadir un padre pendiente durante la sesión demo.

---

## Scope

**In:**

- «Vincular otro padre» abre un modal en `/kids/[id]` sin cambiar la URL y muestra el nombre del niño.
- El formulario recoge nombre, email y parentesco. «Mamá» está seleccionada inicialmente.
- El modal muestra un código de demostración de cinco caracteres alfanuméricos, generado en cada apertura.
- Una invitación válida cierra el modal y añade el padre como pendiente al perfil del niño.
- Las invitaciones permanecen al navegar dentro de la app y se eliminan al recargar o pulsar «Salir».
- «X» y Esc cierran el modal y devuelven el foco al botón que lo abrió. Pulsar el fondo no lo cierra.
- El texto informa que la invitación es una demostración: no se envía correo ni se habilita acceso familiar.

**Out of scope (para futuras specs):**

- Envío de correos, activación de códigos generados y acceso a un feed familiar.
- Vinculación de padres en perfiles temporales dentro de `/kids`.
- Backend, persistencia y cambios a los padres mock existentes.

---

## Data model

`app/_lib/parent-invitation.ts` define el tipo `TemporaryParentInvitation` y la validación y generación de invitaciones.

```ts
type TemporaryParentInvitation = {
  id: string;
  kidId: string;
  name: string;
  email: string;
  relationship: Parent["relationship"];
  status: "pending";
  code: string;
};
```

El provider `app/_components/kid-profile/parent-invitations-provider.tsx`, conectado desde `app/layout.tsx`, mantiene las invitaciones en estado React. El perfil combina las invitaciones de su `kidId` con los padres mock existentes. El email se normaliza para impedir duplicados entre invitaciones del mismo niño durante la sesión; los padres mock no tienen email para compararlo.

El código es local y no se guarda fuera del estado React. No es aceptado por `/auth/activate-account`. «Vence en 7 días» se conserva como etiqueta visual de la referencia, sin implementar vencimiento.

---

## Implementation plan

1. Crear `app/_lib/parent-invitation.ts` con la validación de nombre, email y duplicados, además de la generación de códigos de cinco caracteres.
2. Crear `app/_components/kid-profile/parent-invitations-provider.tsx` y conectarlo desde `app/layout.tsx` para conservar invitaciones durante la navegación.
3. Crear `app/_components/kid-profile/link-parent-modal.tsx` basado en `references/ui/vincular-padre.dc.html`, con accesibilidad, validación y texto de demostración.
4. Conectar el modal desde `app/_components/kid-profile/kid-parents-panel.tsx` para perfiles de `/kids/[id]`; mostrar ahí las invitaciones pendientes y mantener inactivo el control de perfiles temporales.
5. Limpiar las invitaciones al cerrar sesión desde `app/_components/layout/nav-menu.tsx`.
6. Actualizar `tests/kids.spec.ts` para cubrir el modal, validación, duplicados, invitaciones pendientes, cierre, persistencia en memoria, salida y tamaños de pantalla.

---

## Acceptance criteria

- [ ] El botón abre el modal sin cambiar `/kids/[id]` y el subtítulo muestra el nombre del niño.
- [ ] «X» y Esc cierran el modal y devuelven el foco al botón; pulsar el fondo no lo cierra.
- [ ] Cada apertura empieza con campos vacíos, «Mamá» seleccionada y un código nuevo de cinco caracteres alfanuméricos.
- [ ] Nombre vacío, email inválido o email ya invitado al mismo niño impiden confirmar y muestran errores asociados a los campos.
- [ ] Una invitación válida cierra el modal y añade una fila con estado «PENDIENTE», sin afirmar que se envió un correo.
- [ ] La invitación permanece al navegar y volver; desaparece al recargar o pulsar «Salir».
- [ ] `/auth/activate-account` continúa aceptando únicamente el código demo `7K4P9`.
- [ ] No hay desbordamiento horizontal a 375, 768 ni 1280 px.
- [ ] Pasan `tests/kids.spec.ts`, `npm run lint`, `npx tsc --noEmit` y `npm run build`.

---

## Decisions

- **Sí:** invitaciones locales y temporales. **No:** correo ni activación real, porque el proyecto no tiene ese flujo.
- **Sí:** generar un código nuevo en cada apertura. **No:** reutilizar `7K4P9`, reservado para la activación demo existente.
- **Sí:** conservar «Vence en 7 días» como etiqueta de la referencia. **No:** implementar caducidad; la frase no representa un vencimiento real.
- **Sí:** limitar la función a `/kids/[id]`. **No:** extenderla a perfiles temporales.
- **Sí:** usar la fila pendiente como confirmación. **No:** mostrar un aviso que simule el envío de un correo.
- **Sí:** reiniciar los campos al cerrar y reabrir. **No:** conservar borradores cancelados.
- **Sí:** considerar duplicados solo entre invitaciones del mismo niño, ignorando espacios externos y mayúsculas del email. **No:** bloquear el mismo email en perfiles de otros niños.

---

## What is **not** in this spec

- Envío real de correos, activación de los códigos generados y acceso familiar.
- Persistencia, backend y vencimiento efectivo de invitaciones.
- Vinculación de padres en perfiles temporales.

Cada uno de esos puntos, si se implementa, va en su propia spec.
