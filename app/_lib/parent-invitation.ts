import type { Parent } from "../_data/kids";
import { isValidEmail } from "./auth-validation";

export type TemporaryParentInvitation = {
  id: string;
  kidId: string;
  name: string;
  email: string;
  relationship: Parent["relationship"];
  status: "pending";
  code: string;
};

export type ParentInvitationInput = Pick<
  TemporaryParentInvitation,
  "kidId" | "name" | "email" | "relationship"
>;

export type ParentInvitationField = "name" | "email";

export type ParentInvitationErrors = Partial<
  Record<ParentInvitationField, string>
>;

const DEMO_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const DEMO_CODE_LENGTH = 5;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateParentInvitationCode(): string {
  const randomValues = new Uint8Array(DEMO_CODE_LENGTH);
  globalThis.crypto.getRandomValues(randomValues);

  return Array.from(
    randomValues,
    (value) => DEMO_CODE_ALPHABET[value % DEMO_CODE_ALPHABET.length],
  ).join("");
}

export function validateParentInvitation(
  input: ParentInvitationInput,
  invitations: TemporaryParentInvitation[],
): ParentInvitationErrors {
  const errors: ParentInvitationErrors = {};
  const email = normalizeEmail(input.email);

  if (!input.name.trim()) {
    errors.name = "Ingresá el nombre del padre.";
  }

  if (!email) {
    errors.email = "Ingresá tu email.";
  } else if (!isValidEmail(email)) {
    errors.email = "Ingresá un email válido.";
  } else if (
    invitations.some(
      (invitation) =>
        invitation.kidId === input.kidId &&
        normalizeEmail(invitation.email) === email,
    )
  ) {
    errors.email = "Ya existe una invitación para este email.";
  }

  return errors;
}

export function createParentInvitation(
  input: ParentInvitationInput,
): TemporaryParentInvitation {
  return {
    id: globalThis.crypto.randomUUID(),
    kidId: input.kidId,
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    relationship: input.relationship,
    status: "pending",
    code: generateParentInvitationCode(),
  };
}
