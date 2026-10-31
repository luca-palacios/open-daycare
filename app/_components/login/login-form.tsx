"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "../../../utils/supabase/client";
import { AuthField } from "../auth/auth-field";
import { validateLogin, type AuthErrors } from "../../_lib/auth-validation";

async function clearSession(client: ReturnType<typeof createClient>) {
  await client.auth.signOut({ scope: "local" }).catch(() => undefined);
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<AuthErrors>({});
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);

    const nextErrors = validateLogin({ email, password });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    let client: ReturnType<typeof createClient> | undefined;

    try {
      client = createClient();
      const { data, error: signInError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setFormError(
          signInError.status === 400 || signInError.status === 401
            ? "El email o la contraseña no son correctos."
            : "No pudimos conectar con el servicio de inicio de sesión. Intentá de nuevo.",
        );
        return;
      }

      if (!data.user) {
        await clearSession(client);
        setFormError("No pudimos verificar tu acceso al área de personal.");
        return;
      }

      const { data: profile, error: profileError } = await client
        .from("users")
        .select("role, status")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        await clearSession(client);
        setFormError("No pudimos verificar tu acceso. Intentá de nuevo.");
        return;
      }

      if (!profile || profile.role !== "staff" || profile.status !== "active") {
        await clearSession(client);
        setFormError("Tu cuenta no tiene acceso al área de personal.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      if (client) {
        await clearSession(client);
      }

      setFormError("No pudimos conectar con el servicio de inicio de sesión. Intentá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} aria-busy={isSubmitting}>
      <h1 className="font-display text-[30px] font-semibold text-ink">
        Iniciar sesión
      </h1>
      <p className="mt-1.5 mb-7 text-[15px] text-muted">
        Ingresá para ver el día de hoy.
      </p>

      <div className="flex flex-col gap-[18px]">
        <AuthField
          id="login-email"
          label="EMAIL"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
        />
        <div>
          <AuthField
            id="login-password"
            label="CONTRASEÑA"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            error={errors.password}
          />
          <div className="mt-2.5 text-right">
            <span className="text-[13.5px] font-bold text-brand-dark">
              ¿Olvidaste tu contraseña?
            </span>
          </div>
        </div>
      </div>

      {formError ? (
        <p role="alert" className="mt-4 text-[13px] font-semibold text-brand-dark">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 w-full rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] py-[15px] text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] transition-opacity hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
      </button>

      <p className="mt-6 text-center text-[14.5px] text-muted">
        ¿Te invitó la guardería?{" "}
        <Link href="/auth/activate-account" className="font-extrabold text-brand-dark">
          Activá tu cuenta
        </Link>
      </p>
    </form>
  );
}
