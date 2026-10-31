"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { Invitation } from "../../_data/invitation";
import { AuthField } from "../auth/auth-field";
import { CheckIcon } from "../ui/icons";

type ActivateAccountFormProps = {
  invitation: Invitation;
};

export function ActivateAccountForm({ invitation }: ActivateAccountFormProps) {
  const [code, setCode] = useState(invitation.code);
  const [email, setEmail] = useState(invitation.email);
  const [password, setPassword] = useState("");
  const [photoConsent, setPhotoConsent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <p role="status" className="mb-5 rounded-[14px] bg-[#FBF1D6] px-4 py-3.5 text-[14px] leading-[1.45] text-[#8A7234]">
        La activación de cuentas todavía no está disponible. Por ahora, estos
        controles están deshabilitados.
      </p>

      <div className="flex flex-col gap-[18px]">
        <AuthField
          id="activation-code"
          label="CÓDIGO DE INVITACIÓN"
          variant="code"
          autoComplete="off"
          value={code}
          onChange={setCode}
          disabled
        />
        <AuthField
          id="activation-email"
          label="EMAIL"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          disabled
        />
        <AuthField
          id="activation-password"
          label="CREAR CONTRASEÑA"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
          disabled
        />
      </div>

      <label className="mt-[18px] mb-6 flex cursor-not-allowed items-start gap-3 rounded-[14px] bg-[#FBF1D6] px-4 py-3.5">
        <input
          type="checkbox"
          checked={photoConsent}
          onChange={(event) => setPhotoConsent(event.target.checked)}
          disabled
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
        disabled
        className="w-full cursor-not-allowed rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] py-[15px] text-[16px] font-extrabold text-white opacity-60 shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
      >
        Activación no disponible
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
