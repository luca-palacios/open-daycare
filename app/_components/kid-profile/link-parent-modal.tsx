"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import type { Parent } from "../../_data/kids";
import {
  createParentInvitation,
  generateParentInvitationCode,
  validateParentInvitation,
  type ParentInvitationErrors,
  type TemporaryParentInvitation,
} from "../../_lib/parent-invitation";

type LinkParentModalProps = {
  kidId: string;
  kidName: string;
  invitations: TemporaryParentInvitation[];
  onCreateInvitation: (invitation: TemporaryParentInvitation) => void;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

const RELATIONSHIPS: Parent["relationship"][] = ["mamá", "papá", "tutor"];

export function LinkParentModal({
  kidId,
  kidName,
  invitations,
  onCreateInvitation,
  onClose,
  returnFocusRef,
}: LinkParentModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] =
    useState<Parent["relationship"]>("mamá");
  const [errors, setErrors] = useState<ParentInvitationErrors>({});
  const [code] = useState(generateParentInvitationCode);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

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

  function updateField(field: "name" | "email", value: string) {
    if (field === "name") setName(value);
    if (field === "email") setEmail(value);

    if (errors[field]) {
      setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input = { kidId, name, email, relationship };
    const nextErrors = validateParentInvitation(input, invitations);
    setErrors(nextErrors);

    if (nextErrors.name) {
      nameRef.current?.focus();
      return;
    }

    if (nextErrors.email) {
      emailRef.current?.focus();
      return;
    }

    onCreateInvitation(createParentInvitation(input, code));
    onClose();
  }

  function handleCancel(event: React.SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="link-parent-title"
      aria-describedby="link-parent-demo-notice"
      onCancel={handleCancel}
      className="parent-invitation-dialog fixed inset-0 m-0 flex h-dvh w-full max-h-none max-w-none items-center justify-center overflow-y-auto border-0 bg-transparent p-4 text-ink"
    >
      <section className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-[480px] overflow-y-auto rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]">
        <form noValidate onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-3 border-b border-[#ECE0D0] px-5 py-5 sm:px-[26px]">
            <div className="min-w-0">
              <h2
                id="link-parent-title"
                className="font-display text-[18px] font-semibold text-ink"
              >
                Vincular padre
              </h2>
              <p className="truncate text-[13px] text-faint">a {kidName}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ventana"
              className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-[#F0E6D8] text-[#74685D] transition-colors hover:bg-[#E7DAC8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
            >
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <path d="m18 6-12 12M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-5 py-5 sm:px-[26px] sm:py-[22px]">
            <div
              id="link-parent-demo-notice"
              className="mb-5 flex gap-3 rounded-[14px] bg-[#E3ECFB] px-4 py-3 text-[13.5px] leading-[1.45] text-[#3F5694]"
            >
              <svg
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <p>
                Es una demostración. No se enviará ningún correo ni se habilitará
                el acceso familiar.
              </p>
            </div>

            <div className="mb-[18px]">
              <label htmlFor="parent-name" className={labelClassName}>
                Nombre del padre o madre
              </label>
              <input
                ref={nameRef}
                id="parent-name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Ej. Diego Fernández"
                aria-required="true"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "parent-name-error" : undefined}
                className={inputClassName(Boolean(errors.name))}
              />
              {errors.name && (
                <p
                  id="parent-name-error"
                  role="alert"
                  className={errorClassName}
                >
                  {errors.name}
                </p>
              )}
            </div>

            <div className="mb-[18px]">
              <label htmlFor="parent-email" className={labelClassName}>
                Email
              </label>
              <input
                ref={emailRef}
                id="parent-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="correo@ejemplo.com"
                aria-required="true"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email ? "parent-email-error" : undefined
                }
                className={inputClassName(Boolean(errors.email))}
              />
              {errors.email && (
                <p
                  id="parent-email-error"
                  role="alert"
                  className={errorClassName}
                >
                  {errors.email}
                </p>
              )}
            </div>

            <fieldset className="mb-5">
              <legend className={`${labelClassName} mb-2.5`}>Parentesco</legend>
              <div className="flex gap-2 sm:gap-[9px]">
                {RELATIONSHIPS.map((option) => {
                  const selected = relationship === option;
                  const label = option === "tutor" ? "Tutor/a" : capitalize(option);

                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setRelationship(option)}
                      className={`min-h-11 min-w-0 flex-1 cursor-pointer rounded-full border-[1.5px] px-2 text-[14px] font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark ${
                        selected
                          ? "border-[#9FB8EC] bg-[#CCD8F4] text-[#4E72C8]"
                          : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359] hover:bg-[#F0E6D8]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="mb-5 rounded-[16px] border-[1.5px] border-dashed border-[#E6D08A] bg-[#FBF1D6] px-4 py-[15px] text-center">
              <p className="mb-1.5 text-[12px] font-extrabold uppercase tracking-[0.7px] text-[#8A7234]">
                Código de demostración
              </p>
              <p
                aria-label={`Código de demostración ${code}`}
                className="font-display text-[32px] font-semibold tracking-[7px] text-[#725C28]"
              >
                {code}
              </p>
              <p className="mt-1.5 text-[13px] text-[#8A7234]">
                Vence en 7 días
              </p>
            </div>

            <button
              type="submit"
              className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-brand-500 px-4 py-3 text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
            >
              <svg
                aria-hidden="true"
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Crear invitación
            </button>
          </div>
        </form>
      </section>
    </dialog>
  );
}

const labelClassName =
  "mb-2 block text-[12px] font-extrabold uppercase tracking-[0.7px] text-[#94887B]";
const errorClassName = "mt-1.5 text-sm font-semibold text-[#B4422D]";

function inputClassName(hasError = false): string {
  return `w-full min-w-0 rounded-[14px] border-[1.5px] ${
    hasError ? "border-[#D9583C]" : "border-[#EADFD0]"
  } bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-[#B6A99B] focus:border-auth-focus focus:ring-2 focus:ring-auth-focus/30`;
}

function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase("es-AR") + value.slice(1);
}
