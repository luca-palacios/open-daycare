"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  createTemporaryKid,
  validateKidInput,
  type KidFormErrors,
  type KidFormField,
  type KidFormInput,
} from "../../_lib/temporary-kid";
import { useTemporaryKids } from "./temporary-kids-provider";

const EMPTY_FORM: KidFormInput = {
  name: "",
  birthDate: "",
  room: "",
  allergies: "",
  medicalNotes: "",
};

const FIELD_ORDER: KidFormField[] = ["name", "birthDate", "room"];

type AddKidModalProps = {
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
};

export function AddKidModal({
  onClose,
  returnFocusRef,
}: AddKidModalProps) {
  const { addTemporaryKid } = useTemporaryKids();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<KidFormErrors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const birthDateRef = useRef<HTMLInputElement>(null);
  const roomRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const returnFocusElement = returnFocusRef.current;
    nameRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      returnFocusElement?.focus();
    };
  }, [onClose, returnFocusRef]);

  function updateField(field: keyof KidFormInput, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    if (field in errors) {
      setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateKidInput(form);
    setErrors(validationErrors);

    const firstInvalidField = FIELD_ORDER.find(
      (field) => validationErrors[field],
    );

    if (firstInvalidField) {
      const fieldRefs = {
        name: nameRef,
        birthDate: birthDateRef,
        room: roomRef,
      };
      fieldRefs[firstInvalidField].current?.focus();
      return;
    }

    addTemporaryKid(createTemporaryKid(form));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#3F362E]/45 p-4 sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-kid-title"
        className="my-auto w-full max-w-[520px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
      >
        <form noValidate onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-3 border-b border-[#ECE0D0] px-4 py-5 sm:px-[26px]">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-left text-[14px] font-bold text-[#94887B] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark sm:text-[15px]"
            >
              Cancelar
            </button>
            <h2
              id="add-kid-title"
              className="font-display text-[17px] font-semibold text-ink sm:text-[18px]"
            >
              Agregar niño
            </h2>
            <button
              type="submit"
              className="cursor-pointer text-right text-[14px] font-extrabold text-[#D9583C] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark sm:text-[15px]"
            >
              Guardar
            </button>
          </div>

          <div className="max-h-[calc(100dvh-112px)] overflow-y-auto px-5 py-6 sm:px-[26px]">
            <div className="mb-[18px]">
              <label htmlFor="kid-name" className={labelClassName}>
                Nombre completo
              </label>
              <input
                ref={nameRef}
                id="kid-name"
                name="name"
                autoComplete="name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Ej. Martina López"
                aria-required="true"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "kid-name-error" : undefined}
                className={inputClassName(Boolean(errors.name))}
              />
              {errors.name && (
                <p id="kid-name-error" role="alert" className={errorClassName}>
                  {errors.name}
                </p>
              )}
            </div>

            <div className="mb-[18px] grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="kid-birth-date" className={labelClassName}>
                  Fecha de nacimiento
                </label>
                <input
                  ref={birthDateRef}
                  id="kid-birth-date"
                  name="birthDate"
                  type="date"
                  value={form.birthDate}
                  onChange={(event) =>
                    updateField("birthDate", event.target.value)
                  }
                  aria-required="true"
                  aria-invalid={Boolean(errors.birthDate)}
                  aria-describedby={
                    errors.birthDate ? "kid-birth-date-error" : undefined
                  }
                  className={inputClassName(Boolean(errors.birthDate))}
                />
                {errors.birthDate && (
                  <p
                    id="kid-birth-date-error"
                    role="alert"
                    className={errorClassName}
                  >
                    {errors.birthDate}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="kid-room" className={labelClassName}>
                  Sala
                </label>
                <select
                  ref={roomRef}
                  id="kid-room"
                  name="room"
                  value={form.room}
                  onChange={(event) => updateField("room", event.target.value)}
                  aria-required="true"
                  aria-invalid={Boolean(errors.room)}
                  aria-describedby={errors.room ? "kid-room-error" : undefined}
                  className={`${inputClassName(Boolean(errors.room))} font-bold`}
                >
                  <option value="">Seleccionar sala</option>
                  <option value="Soles">Soles</option>
                  <option value="Lunas">Lunas</option>
                </select>
                {errors.room && (
                  <p id="kid-room-error" role="alert" className={errorClassName}>
                    {errors.room}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-[18px]">
              <label htmlFor="kid-allergies" className={labelClassName}>
                Alergias <span className="font-semibold normal-case">(opcional)</span>
              </label>
              <input
                id="kid-allergies"
                name="allergies"
                value={form.allergies}
                onChange={(event) =>
                  updateField("allergies", event.target.value)
                }
                placeholder="Ej. Maní, Lactosa"
                className={inputClassName()}
              />
            </div>

            <div>
              <label htmlFor="kid-medical-notes" className={labelClassName}>
                Notas médicas <span className="font-semibold normal-case">(opcional)</span>
              </label>
              <textarea
                id="kid-medical-notes"
                name="medicalNotes"
                value={form.medicalNotes}
                onChange={(event) =>
                  updateField("medicalNotes", event.target.value)
                }
                placeholder="Indicaciones, medicación, contactos…"
                className={`${inputClassName()} min-h-[90px] resize-y leading-[1.5]`}
              />
            </div>
          </div>
        </form>
      </section>
    </div>
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
