"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthField } from "../auth/auth-field";
import { validateLogin, type AuthErrors } from "../../_lib/auth-validation";
import { startDemoSession } from "../../_lib/demo-session";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<AuthErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateLogin({ email, password });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    startDemoSession();
    router.replace("/");
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
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

      <button
        type="submit"
        className="mt-5 w-full rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] py-[15px] text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] transition-opacity hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
      >
        Iniciar sesión
      </button>

      <p className="mt-6 text-center text-[14.5px] text-muted">
        ¿Te invitó la guardería?{" "}
        <Link href="/activate-account" className="font-extrabold text-brand-dark">
          Activá tu cuenta
        </Link>
      </p>
    </form>
  );
}
