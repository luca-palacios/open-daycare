"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { kids as staticKids } from "../../_data/kids";
import type { PostKind } from "../../_data/mock";
import { KID_AVATAR_TONES } from "../../_lib/avatar-tones";
import {
  createLocalImage,
  MAX_POST_IMAGES,
  POST_KIND_LABELS,
  POST_KINDS,
  releaseImage,
  releaseImages,
  validateImageFile,
  validatePostInput,
  type LocalPostImage,
  type PostAudience,
  type PostFormErrors,
  type PostFormField,
} from "../../_lib/post-validation";
import { useTemporaryKids } from "../kids/temporary-kids-provider";
import { CloseIcon, ImageIcon, PlusIcon } from "../ui/icons";
import { useTemporaryPosts } from "./temporary-posts-provider";

const FIELD_ORDER: PostFormField[] = [
  "audience",
  "kind",
  "message",
  "images",
];

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const KIND_STYLES: Record<PostKind, { idle: string; active: string }> = {
  meal: {
    idle: "bg-[#F3E3B5] text-[#9A7B1E]",
    active: "bg-[#9A7B1E] text-white",
  },
  nap: {
    idle: "bg-[#E7DCF6] text-[#7B5FC0]",
    active: "bg-[#7B5FC0] text-white",
  },
  activity: {
    idle: "bg-[#C7E7F1] text-[#2E89A6]",
    active: "bg-[#2E89A6] text-white",
  },
  achievement: {
    idle: "bg-[#CFEBD8] text-[#3E9B6C]",
    active: "bg-[#3E9B6C] text-white",
  },
  mood: {
    idle: "bg-[#F9D2DE] text-[#C56486]",
    active: "bg-[#C56486] text-white",
  },
  photo: {
    idle: "bg-[#FBD8CC] text-[#D9684A]",
    active: "bg-[#D9684A] text-white",
  },
  announcement: {
    idle: "bg-[#CCD8F4] text-[#4E72C8]",
    active: "bg-[#4E72C8] text-white",
  },
};

type CreatePostModalProps = {
  onCancel: () => void;
  onPublished: () => void;
};

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => element.offsetParent !== null);
}

function firstName(name: string): string {
  return name.split(" ")[0];
}

export function CreatePostModal({
  onCancel,
  onPublished,
}: CreatePostModalProps) {
  const router = useRouter();
  const { temporaryKids } = useTemporaryKids();
  const { publishPost } = useTemporaryPosts();
  const [roomSelected, setRoomSelected] = useState(false);
  const [selectedKidIds, setSelectedKidIds] = useState<string[]>([]);
  const [kind, setKind] = useState<PostKind | null>(null);
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<LocalPostImage[]>([]);
  const [errors, setErrors] = useState<PostFormErrors>({});
  const [imageError, setImageError] = useState<string>();

  const dialogRef = useRef<HTMLElement>(null);
  const firstAudienceRef = useRef<HTMLButtonElement>(null);
  const firstKindRef = useRef<HTMLButtonElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const addImageRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ownershipTransferredRef = useRef(false);
  const imagesRef = useRef(images);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const solesKids = useMemo(
    () =>
      [...staticKids, ...temporaryKids].filter((kid) => kid.room === "Soles"),
    [temporaryKids],
  );

  const audience: PostAudience | null = roomSelected
    ? { scope: "room" }
    : selectedKidIds.length > 0
      ? { scope: "kids", kidIds: selectedKidIds }
      : null;

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  useEffect(() => {
    const target =
      dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]") ??
      dialogRef.current;
    target?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        handleCancel();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!active || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [handleCancel]);

  useEffect(() => {
    return () => {
      if (ownershipTransferredRef.current) return;
      releaseImages(imagesRef.current);
    };
  }, []);

  function clearError(field: PostFormField) {
    setErrors((currentErrors) =>
      currentErrors[field]
        ? { ...currentErrors, [field]: undefined }
        : currentErrors,
    );
  }

  function toggleKid(kidId: string) {
    setRoomSelected(false);
    setSelectedKidIds((currentIds) =>
      currentIds.includes(kidId)
        ? currentIds.filter((id) => id !== kidId)
        : [...currentIds, kidId],
    );
    clearError("audience");
  }

  function toggleRoom() {
    setRoomSelected((currentRoom) => {
      const nextRoom = !currentRoom;
      if (nextRoom) setSelectedKidIds([]);
      return nextRoom;
    });
    clearError("audience");
  }

  function selectKind(nextKind: PostKind) {
    setKind((currentKind) => (currentKind === nextKind ? null : nextKind));
    clearError("kind");
  }

  function addImages(files: File[]) {
    setImageError(undefined);

    const available = MAX_POST_IMAGES - images.length;
    if (available <= 0) {
      setImageError(`Podés adjuntar hasta ${MAX_POST_IMAGES} imágenes.`);
      return;
    }

    const acceptedImages: LocalPostImage[] = [];
    let nextImageError: string | undefined;

    for (const file of files) {
      const fileError = validateImageFile(file);

      if (fileError) {
        nextImageError = `${file.name}: ${fileError}`;
        continue;
      }

      if (acceptedImages.length >= available) {
        nextImageError = `Podés adjuntar hasta ${MAX_POST_IMAGES} imágenes.`;
        break;
      }

      acceptedImages.push(createLocalImage(file));
    }

    if (acceptedImages.length > 0) {
      setImages((currentImages) =>
        [...currentImages, ...acceptedImages].slice(0, MAX_POST_IMAGES),
      );
      clearError("images");
    }

    if (nextImageError) {
      setImageError(nextImageError);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    addImages(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function removeImage(image: LocalPostImage) {
    releaseImage(image);
    setImages((currentImages) =>
      currentImages.filter((currentImage) => currentImage.id !== image.id),
    );
    setImageError(undefined);
  }

  function focusField(field: PostFormField) {
    const refs = {
      audience: firstAudienceRef,
      kind: firstKindRef,
      message: messageRef,
      images: addImageRef,
    };
    refs[field].current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validatePostInput({
      audience,
      kind,
      message,
      images,
    });
    setErrors(nextErrors);

    const firstInvalidField = FIELD_ORDER.find((field) => nextErrors[field]);

    if (firstInvalidField) {
      focusField(firstInvalidField);
      return;
    }

    if (!audience || !kind) return;

    ownershipTransferredRef.current = true;
    publishPost({ kind, message, audience, images });
    router.push("/");
    onPublished();
  }

  const modal = (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#3F362E]/45 px-4 py-6 sm:px-6 sm:py-10">
      <section
        ref={dialogRef}
        data-testid="create-post-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-post-title"
        tabIndex={-1}
        className="mx-auto w-full max-w-[580px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)] focus:outline-none"
      >
        <form noValidate onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-3 border-b border-[#ECE0D0] px-4 py-5 sm:px-[26px]">
            <button
              type="button"
              onClick={handleCancel}
              className="cursor-pointer text-left text-[14px] font-bold text-[#94887B] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark sm:text-[15px]"
            >
              Cancelar
            </button>
            <h2
              id="create-post-title"
              className="font-display text-[17px] font-semibold text-ink sm:text-[18px]"
            >
              Nueva publicación
            </h2>
            <button
              type="submit"
              className="cursor-pointer text-right text-[14px] font-extrabold text-[#D9583C] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark sm:text-[15px]"
            >
              Publicar
            </button>
          </div>

          <div className="px-5 py-6 sm:px-[26px]">
            <fieldset
              aria-describedby={
                errors.audience ? "create-post-audience-error" : undefined
              }
              className="mb-[22px] min-w-0"
            >
              <legend className={labelClassName}>Para</legend>
              <div className="flex flex-wrap gap-[9px]">
                {solesKids.map((kid, index) => {
                  const selected = selectedKidIds.includes(kid.id);

                  return (
                    <button
                      key={kid.id}
                      ref={index === 0 ? firstAudienceRef : undefined}
                      type="button"
                      aria-pressed={selected}
                      data-autofocus={index === 0 ? true : undefined}
                      onClick={() => toggleKid(kid.id)}
                      className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] py-1.5 pl-1.5 pr-3.5 text-[14px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark ${
                        selected
                          ? "border-[#3F362E] bg-[#3F362E] text-white"
                          : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359] hover:bg-[#F0E6D8]"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full font-display text-[13px] font-semibold ${KID_AVATAR_TONES[kid.avatarTone]}`}
                      >
                        {kid.initials}
                      </span>
                      {firstName(kid.name)}
                    </button>
                  );
                })}

                <button
                  type="button"
                  aria-pressed={roomSelected}
                  onClick={toggleRoom}
                  className={`min-h-11 cursor-pointer rounded-full border-[1.5px] px-4 text-[14px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark ${
                    roomSelected
                      ? "border-[#3F362E] bg-[#3F362E] text-white"
                      : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359] hover:bg-[#F0E6D8]"
                  }`}
                >
                  Toda la sala
                </button>
              </div>
              {errors.audience && (
                <p
                  id="create-post-audience-error"
                  role="alert"
                  className={errorClassName}
                >
                  {errors.audience}
                </p>
              )}
            </fieldset>

            <fieldset
              aria-describedby={
                errors.kind ? "create-post-kind-error" : undefined
              }
              className="mb-[22px] min-w-0"
            >
              <legend className={labelClassName}>Tipo</legend>
              <div className="flex flex-wrap gap-[9px]">
                {POST_KINDS.map((postKind, index) => {
                  const selected = kind === postKind;

                  return (
                    <button
                      key={postKind}
                      ref={index === 0 ? firstKindRef : undefined}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectKind(postKind)}
                      className={`min-h-11 cursor-pointer rounded-full px-4 text-[13.5px] font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark ${
                        selected
                          ? KIND_STYLES[postKind].active
                          : KIND_STYLES[postKind].idle
                      }`}
                    >
                      {POST_KIND_LABELS[postKind]}
                    </button>
                  );
                })}
              </div>
              {errors.kind && (
                <p
                  id="create-post-kind-error"
                  role="alert"
                  className={errorClassName}
                >
                  {errors.kind}
                </p>
              )}
            </fieldset>

            <div className="mb-[22px]">
              <label htmlFor="create-post-message" className={labelClassName}>
                Descripción
              </label>
              <textarea
                ref={messageRef}
                id="create-post-message"
                name="message"
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  clearError("message");
                }}
                placeholder="Contá cómo le fue hoy…"
                aria-required="true"
                aria-invalid={Boolean(errors.message)}
                aria-describedby={
                  errors.message ? "create-post-message-error" : undefined
                }
                className={`min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] bg-white px-4 py-3.5 text-[15px] leading-[1.5] text-ink outline-none placeholder:text-[#B6A99B] focus:border-auth-focus focus:ring-2 focus:ring-auth-focus/30 ${
                  errors.message ? "border-[#D9583C]" : "border-[#EADFD0]"
                }`}
              />
              {errors.message && (
                <p
                  id="create-post-message-error"
                  role="alert"
                  className={errorClassName}
                >
                  {errors.message}
                </p>
              )}
            </div>

            <div>
              <p className={labelClassName}>Fotos</p>
              <div className="flex flex-wrap gap-3">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative h-24 w-24 flex-none overflow-hidden rounded-[14px] border border-[#ECE0D0] bg-[#F4ECE1]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image)}
                      aria-label={`Quitar ${image.name}`}
                      className="absolute right-1 top-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#3F362E]/75 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
                    >
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {images.length < MAX_POST_IMAGES && (
                  <button
                    ref={addImageRef}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-describedby={
                      [
                        imageError ? "create-post-images-error" : null,
                        errors.images
                          ? "create-post-images-required-error"
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" ") || undefined
                    }
                    className="flex h-24 w-24 flex-none cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290] transition-colors hover:bg-[#EFE3D3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
                  >
                    <PlusIcon className="h-[22px] w-[22px] text-[#C5503A]" />
                    <span className="text-xs">Agregar</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                  aria-label="Agregar fotos"
                  className="hidden"
                />
              </div>

              {images.length === 0 && !imageError && (
                <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-faint">
                  <ImageIcon className="h-4 w-4" />
                  JPG, PNG o WebP · hasta 5 MB por foto
                </p>
              )}

              {imageError && (
                <p
                  id="create-post-images-error"
                  role="alert"
                  className={errorClassName}
                >
                  {imageError}
                </p>
              )}

              {errors.images && (
                <p
                  id="create-post-images-required-error"
                  role="alert"
                  className={errorClassName}
                >
                  {errors.images}
                </p>
              )}
            </div>
          </div>
        </form>
      </section>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(modal, document.body);
}

const labelClassName =
  "mb-2 block text-[12px] font-extrabold uppercase tracking-[0.7px] text-[#94887B]";
const errorClassName = "mt-1.5 text-sm font-semibold text-[#B4422D]";
