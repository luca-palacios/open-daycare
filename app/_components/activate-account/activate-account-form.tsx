"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Invitation } from "../../_data/invitation";
import { validateActivation, type AuthErrors } from "../../_lib/auth-validation";
import { startDemoSession } from "../../_lib/demo-session";
import { AuthField } from "../auth/auth-field";
import { CheckIcon } from "../ui/icons";

type ActivateAccountFormProps = {
  invitation: Invitation;
};

export function ActivateAccountForm({ invitation }: ActivateAccountFormProps) {
  const router = useRouter();
  const [code, setCode] = useState(invitation.code);
  const [email, setEmail] = useState(invitation.email);
  const [password, setPassword] = useState("");
  const [photoConsent, setPhotoConsent] = useState(false);
  const [errors, setErrors] = useState<AuthErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateActivation({ code, email, password }, invitation);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    startDemoSession();
    router.replace("/");
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <div className="flex flex-col gap-[18px]">
        <AuthField
          id="activation-code"
          label="CÓDIGO DE INVITACIÓN"
          variant="code"
          autoComplete="off"
          value={code}
          onChange={setCode}
          error={errors.code}
        />
        <AuthField
          id="activation-email"
          label="EMAIL"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
        />
        <AuthField
          id="activation-password"
          label="CREAR CONTRASEÑA"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
          error={errors.password}
        />
      </div>

      <label className="mt-[18px] mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-[#FBF1D6] px-4 py-3.5">
        <input
          type="checkbox"
          checked={photoConsent}
          onChange={(event) => setPhotoConsent(event.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="mt-px flex h-6 w-6 flex-none items-center justify-center rounded-[8px] border-[1.5px] border-[#CBB98D] bg-white text-white transition-colors peer-checked:border-[#5FB97E] peer-checked:bg-[#5FB97E] peer-focus-visible:ring-2 peer-focus-visible:ring-[#5FB97E] peer-focus-visible:ring-offset-2"
        >
          {photoConsent ? <CheckIcon className="h-[15px] w-[15px]" /> : null}
        </span>
        <span className="text-[14px] leading-[1.45] text-[#8A7234]">
          Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de
          la app.
        </span>
      </label>

      <button
        type="submit"
        className="w-full rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] py-[15px] text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] transition-opacity hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
      >
        Activar mi cuenta
      </button>

      <p className="mt-[22px] text-center text-[14.5px] text-muted">
        ¿Ya tenés cuenta?{" "}
        <Link href="/auth/login" className="font-extrabold text-brand-dark">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
