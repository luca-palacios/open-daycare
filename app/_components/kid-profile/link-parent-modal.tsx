"use client";

import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import type { Parent } from "../../_data/kids";
import type { InvitationActionResult } from "../../_lib/parent-invitation-server";

type LinkParentModalProps = {
  kidId: string;
  kidName: string;
  onCreateInvitation: (input: { childId: string; fullName: string; email: string; relationship: "father" | "mother" | "guardian" }) => Promise<InvitationActionResult>;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

const RELATIONSHIPS: Array<{ value: "mother" | "father" | "guardian"; label: string; parent: Parent["relationship"] }> = [
  { value: "mother", label: "Madre", parent: "mamá" },
  { value: "father", label: "Padre", parent: "papá" },
  { value: "guardian", label: "Tutor/a", parent: "tutor" },
];

export function LinkParentModal({ kidId, kidName, onCreateInvitation, onClose, returnFocusRef }: LinkParentModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState<"father" | "mother" | "guardian">("mother");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const returnFocusElement = returnFocusRef.current;
    if (!dialog) return;
    dialog.showModal();
    nameRef.current?.focus();
    return () => {
      if (dialog.open) dialog.close();
      returnFocusElement?.focus();
    };
  }, [returnFocusRef]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Ingresá el nombre y el email.");
      nameRef.current?.focus();
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const result = await onCreateInvitation({ childId: kidId, fullName: name, email, relationship });
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "No se pudo crear la invitación.");
      return;
    }
    onClose();
  }

  return (
    <dialog ref={dialogRef} aria-labelledby="link-parent-title" onCancel={(event) => { event.preventDefault(); onClose(); }} className="parent-invitation-dialog fixed inset-0 m-0 flex h-dvh w-full max-h-none max-w-none items-center justify-center overflow-y-auto border-0 bg-transparent p-4 text-ink">
      <section className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-[480px] overflow-y-auto rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]">
        <form noValidate onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-3 border-b border-[#ECE0D0] px-5 py-5 sm:px-[26px]">
            <div className="min-w-0"><h2 id="link-parent-title" className="font-display text-[18px] font-semibold text-ink">Vincular padre</h2><p className="truncate text-[13px] text-faint">a {kidName}</p></div>
            <button type="button" onClick={onClose} aria-label="Cerrar ventana" className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-[#F0E6D8] text-[#74685D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark">×</button>
          </div>
          <div className="px-5 py-5 sm:px-[26px] sm:py-[22px]">
            <p className="mb-5 rounded-[14px] bg-[#E3ECFB] px-4 py-3 text-[13.5px] leading-[1.45] text-[#3F5694]">Enviaremos un correo de invitación con un código para activar la cuenta.</p>
            <label htmlFor="parent-name" className={labelClassName}>Nombre del padre o tutor</label>
            <input ref={nameRef} id="parent-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Diego Fernández" className={inputClassName} />
            <label htmlFor="parent-email" className={`${labelClassName} mt-[18px]`}>Email</label>
            <input id="parent-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correo@ejemplo.com" className={inputClassName} />
            <fieldset className="mb-5 mt-[18px]"><legend className={`${labelClassName} mb-2.5`}>Parentesco</legend><div className="flex gap-2 sm:gap-[9px]">{RELATIONSHIPS.map((option) => <button key={option.value} type="button" aria-pressed={relationship === option.value} onClick={() => setRelationship(option.value)} className={`min-h-11 min-w-0 flex-1 cursor-pointer rounded-full border-[1.5px] px-2 text-[14px] font-extrabold ${relationship === option.value ? "border-[#9FB8EC] bg-[#CCD8F4] text-[#4E72C8]" : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"}`}>{option.label}</button>)}</div></fieldset>
            {error && <p role="alert" className="mb-4 rounded-[12px] bg-[#FBE3D8] px-3 py-2 text-sm font-semibold text-[#B4422D]">{error}</p>}
            <button type="submit" disabled={isSubmitting} className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-[14px] bg-brand-500 px-4 py-3 text-[15.5px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Enviando…" : "Enviar invitación"}</button>
          </div>
        </form>
      </section>
    </dialog>
  );
}

const labelClassName = "block text-[12px] font-extrabold uppercase tracking-[0.7px] text-[#94887B]";
const inputClassName = "w-full min-w-0 rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-[#B6A99B] focus:border-auth-focus focus:ring-2 focus:ring-auth-focus/30";
