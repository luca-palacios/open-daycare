"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { Invitation } from "../../_data/invitation";
import { activateParentAccount } from "../../_lib/parent-invitation-server";
import { AuthField } from "../auth/auth-field";

export function ActivateAccountForm({ invitation }: { invitation: Invitation }) {
  const [code, setCode] = useState(invitation.code);
  const [email, setEmail] = useState(invitation.email);
  const [password, setPassword] = useState("");
  const [photoConsent, setPhotoConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    const result = await activateParentAccount({ code, email, password, photoConsent });
    setIsSubmitting(false);
    if (!result.ok) {
      setMessage(result.message ?? "No se pudo activar la cuenta.");
      return;
    }
    setSuccess(true);
  }

  if (success) return <div role="status" className="rounded-[14px] bg-[#CFEBD8] px-4 py-4 text-[14px] leading-[1.45] text-[#327A56]">Tu cuenta fue activada. Ya podés <Link href="/auth/login" className="font-extrabold underline">iniciar sesión</Link>.</div>;

  return <form noValidate onSubmit={handleSubmit}><div className="flex flex-col gap-[18px]"><AuthField id="activation-code" label="CÓDIGO DE INVITACIÓN" variant="code" autoComplete="off" value={code} onChange={setCode} /><AuthField id="activation-email" label="EMAIL" type="email" autoComplete="email" value={email} onChange={setEmail} /><AuthField id="activation-password" label="CREAR CONTRASEÑA" type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={setPassword} /></div><label className="mt-[18px] mb-6 flex items-start gap-3 rounded-[14px] bg-[#FBF1D6] px-4 py-3.5"><input type="checkbox" checked={photoConsent} onChange={(event) => setPhotoConsent(event.target.checked)} className="mt-1 h-4 w-4" /><span className="text-[14px] leading-[1.45] text-[#8A7234]">Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app.</span></label>{message && <p role="alert" className="mb-4 rounded-[14px] bg-[#FBE3D8] px-4 py-3 text-sm font-semibold text-[#B4422D]">{message}</p>}<button type="submit" disabled={isSubmitting} className="w-full rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] py-[15px] text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] disabled:opacity-60">{isSubmitting ? "Activando…" : "Activar cuenta"}</button><p className="mt-[22px] text-center text-[14.5px] text-muted">¿Ya tenés cuenta? <Link href="/auth/login" className="font-extrabold text-brand-dark">Iniciar sesión</Link></p></form>;
}
