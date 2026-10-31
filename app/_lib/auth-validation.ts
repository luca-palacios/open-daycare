export type AuthField = "email" | "password";

export type AuthErrors = Partial<Record<AuthField, string>>;

type LoginInput = {
  email: string;
  password: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
