import type { Invitation } from "../_data/invitation";

export type AuthField = "code" | "email" | "password";

export type AuthErrors = Partial<Record<AuthField, string>>;

type LoginInput = {
  email: string;
  password: string;
};

type ActivationInput = LoginInput & {
  code: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

function emailError(value: string): string | undefined {
  if (!value.trim()) {
    return "Ingresá tu email.";
  }

  return isValidEmail(value) ? undefined : "Ingresá un email válido.";
}

function passwordError(value: string): string | undefined {
  return value.trim() ? undefined : "Ingresá tu contraseña.";
}

function codeError(value: string, invitation: Invitation): string | undefined {
  if (!value.trim()) {
    return "Ingresá el código de invitación.";
  }

  return normalize(value) === normalize(invitation.code)
    ? undefined
    : "El código no coincide con la invitación.";
}

export function validateLogin(input: LoginInput): AuthErrors {
  const errors: AuthErrors = {};
  const email = emailError(input.email);
  const password = passwordError(input.password);

  if (email) {
    errors.email = email;
  }

  if (password) {
    errors.password = password;
  }

  return errors;
}

export function validateActivation(
  input: ActivationInput,
  invitation: Invitation,
): AuthErrors {
  const errors = validateLogin(input);
  const code = codeError(input.code, invitation);

  if (code) {
    errors.code = code;
  }

  return errors;
}
