"use server";

import { Resend } from "resend";
import { createClient } from "../../utils/supabase/server";
import { createAdminClient } from "../../utils/supabase/admin";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type Relationship = "father" | "mother" | "guardian";

export type InvitationActionResult = {
  ok: boolean;
  message?: string;
  invitationId?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createCode() {
  const values = new Uint8Array(8);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => CODE_ALPHABET[value % CODE_ALPHABET.length]).join("");
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY no está configurada.");
  return new Resend(apiKey);
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL ?? "OpenDayCare <onboarding@resend.dev>";
}

function getAppUrl() {
  return process.env.APP_URL ?? "http://127.0.0.1:3000";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
      character
    ]!,
  );
}

async function sendInvitationEmail({
  email,
  parentName,
  childName,
  code,
}: {
  email: string;
  parentName: string;
  childName: string;
  code: string;
}) {
  const activationUrl = `${getAppUrl()}/auth/activate-account?code=${encodeURIComponent(code)}`;
  const safeParentName = escapeHtml(parentName);
  const safeChildName = escapeHtml(childName);
  const result = await getResend().emails.send({
    from: getFromEmail(),
    to: email,
    subject: `Invitación para vincularte con ${childName}`,
    text: `Hola ${parentName}. Te invitaron a vincularte con ${childName} en OpenDayCare. Código: ${code}. Activa tu cuenta: ${activationUrl}`,
    html: `<h1>Invitación OpenDayCare</h1><p>Hola ${safeParentName}.</p><p>Te invitaron a vincularte con <strong>${safeChildName}</strong>.</p><p>Tu código es <strong>${code}</strong>.</p><p><a href="${activationUrl}">Activar cuenta</a></p>`,
  });

  if (result.error) throw new Error(result.error.message);
}

async function getStaff() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Tu sesión expiró.");

  const { data: profile, error } = await supabase
    .from("users")
    .select("id, role, status")
    .eq("id", authData.user.id)
    .eq("role", "staff")
    .eq("status", "active")
    .maybeSingle();

  if (error || !profile) throw new Error("No tienes permisos para invitar padres.");
  return { supabase, userId: profile.id };
}

export async function createParentInvitation(input: {
  childId: string;
  fullName: string;
  email: string;
  relationship: Relationship;
}): Promise<InvitationActionResult> {
  const fullName = input.fullName.trim();
  const email = normalizeEmail(input.email);
  if (!fullName || !email || !input.childId) {
    return { ok: false, message: "Completá todos los campos obligatorios." };
  }

  try {
    const { supabase, userId } = await getStaff();
    const { data: child, error: childError } = await supabase
      .from("children")
      .select("id, full_name")
      .eq("id", input.childId)
      .eq("status", "active")
      .maybeSingle();
    if (childError || !child) throw new Error("No se encontró el niño.");

    const { data: invitation, error } = await supabase
      .from("invitations")
      .insert({
        child_id: child.id,
        invited_by: userId,
        full_name: fullName,
        email,
        relationship: input.relationship,
        code: createCode(),
        last_sent_at: new Date().toISOString(),
      })
      .select("id, code")
      .single();
    if (error || !invitation) {
      if (error?.code === "23505") return { ok: false, message: "Ya existe una invitación para este email." };
      throw new Error(error?.message ?? "No se pudo crear la invitación.");
    }

    try {
      await sendInvitationEmail({ email, parentName: fullName, childName: child.full_name, code: invitation.code });
      return { ok: true, invitationId: invitation.id };
    } catch (error) {
      return { ok: false, invitationId: invitation.id, message: `La invitación se guardó, pero no se pudo enviar el correo: ${error instanceof Error ? error.message : "error desconocido"}` };
    }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo crear la invitación." };
  }
}

export async function resendParentInvitation(invitationId: string): Promise<InvitationActionResult> {
  try {
    const { supabase } = await getStaff();
    const { data: invitation, error } = await supabase
      .from("invitations")
      .select("id, full_name, email, child_id, status, last_sent_at, children(full_name)")
      .eq("id", invitationId)
      .maybeSingle();
    if (error || !invitation || invitation.status === "cancelled" || invitation.status === "accepted") {
      throw new Error("La invitación ya no está disponible.");
    }
    if (invitation.last_sent_at && Date.now() - Date.parse(invitation.last_sent_at) < 60_000) {
      return { ok: false, message: "Esperá un minuto antes de reenviar." };
    }

    const code = createCode();
    const child = invitation.children as unknown as { full_name: string } | { full_name: string }[] | null;
    const childRecord = Array.isArray(child) ? child[0] : child;
    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("invitations")
      .update({ code, status: "pending", expires_at: new Date(Date.now() + 7 * 86400000).toISOString(), last_sent_at: new Date().toISOString() })
      .eq("id", invitation.id);
    if (updateError) throw updateError;

    try {
      await sendInvitationEmail({ email: invitation.email, parentName: invitation.full_name, childName: childRecord?.full_name ?? "tu niño", code });
      return { ok: true, invitationId };
    } catch (error) {
      return { ok: false, invitationId, message: `No se pudo reenviar el correo: ${error instanceof Error ? error.message : "error desconocido"}` };
    }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo reenviar la invitación." };
  }
}

export async function cancelParentInvitation(invitationId: string): Promise<InvitationActionResult> {
  try {
    await getStaff();
    const admin = createAdminClient();
    const { error } = await admin.from("invitations").update({ status: "cancelled" }).eq("id", invitationId).in("status", ["pending", "expired"]);
    if (error) throw error;
    return { ok: true, invitationId };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo cancelar la invitación." };
  }
}

export async function getInvitationForActivation(code: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invitations")
    .select("id, full_name, email, relationship, code, status, expires_at, children(id, full_name, rooms(name))")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  if (error || !data || data.status !== "pending" || Date.parse(data.expires_at) <= Date.now()) return null;
  return data;
}

export async function activateParentAccount(input: { code: string; email: string; password: string; photoConsent: boolean }): Promise<InvitationActionResult> {
  const email = normalizeEmail(input.email);
  if (!input.code || !email || input.password.length < 8) return { ok: false, message: "Completá el código, email y una contraseña de al menos 8 caracteres." };
  const admin = createAdminClient();
  const invitation = await getInvitationForActivation(input.code);
  if (!invitation || normalizeEmail(invitation.email) !== email) return { ok: false, message: "El código o el email no son válidos." };

  const childDataFromInvitation = invitation.children as unknown as { id: string; full_name: string } | { id: string; full_name: string }[];
  const child = Array.isArray(childDataFromInvitation) ? childDataFromInvitation[0] : childDataFromInvitation;
  const { data: childData, error: childError } = await admin.from("children").select("room_id, rooms(daycare_id)").eq("id", child.id).single();
  if (childError || !childData) return { ok: false, message: "No se encontró el niño." };
  const rooms = childData.rooms as unknown as { daycare_id: string } | { daycare_id: string }[];
  const room = Array.isArray(rooms) ? rooms[0] : rooms;
  const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password: input.password, email_confirm: true, user_metadata: { daycare_id: room.daycare_id, role: "parent", full_name: invitation.full_name } });
  if (createError || !created.user) return { ok: false, message: createError?.message ?? "No se pudo crear la cuenta." };

  const { error: linkError } = await admin.from("parent_children").insert({ parent_id: created.user.id, child_id: child.id, relationship: invitation.relationship });
  if (linkError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { ok: false, message: "No se pudo completar la vinculación." };
  }
  const { error: acceptError } = await admin.from("invitations").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", invitation.id).eq("status", "pending");
  if (acceptError) {
    await admin.from("parent_children").delete().eq("parent_id", created.user.id).eq("child_id", child.id);
    await admin.auth.admin.deleteUser(created.user.id);
    return { ok: false, message: "No se pudo completar la invitación." };
  }
  if (input.photoConsent) await admin.from("children").update({ photo_consent: true }).eq("id", child.id);
  return { ok: true };
}
