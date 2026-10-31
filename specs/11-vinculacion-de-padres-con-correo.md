# SPEC 11 — Vinculación de padres con correo

> **Status:** Implemented
> **Depends on:** SPEC 05, SPEC 09, SPEC 10
> **Date:** 2026-10-31

## Objective

Persistir las invitaciones de padres en Supabase, enviarlas mediante Resend y permitir la activación de la cuenta usando el código recibido.

## Decisions

- El remitente de desarrollo es `onboarding@resend.dev`.
- El correo de prueba del padre es `jgmargarito@gmail.com`.
- El correo del staff es `luca_palacios@gmail.com`.
- Las invitaciones fallan de forma recuperable: se conservan como pendientes y se pueden reenviar o cancelar.
- Reenviar y cancelar usan iconos con tooltip y nombres accesibles.
- El acceso de padres al feed queda fuera de esta spec.

## Acceptance criteria

- [x] El staff puede crear invitaciones persistentes para un niño.
- [x] La invitación genera un código y envía un correo con enlace de activación.
- [x] Las invitaciones pendientes aparecen en el perfil del niño.
- [x] Se puede reenviar o cancelar una invitación pendiente.
- [x] La activación crea la cuenta `parent` y el vínculo con el niño.
- [x] Las claves privadas solo se usan en servidor.
- [ ] Verificación manual del correo y activación con `jgmargarito@gmail.com`.
