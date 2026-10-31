import type { PostImage, PostKind } from "../_data/mock";

export const MAX_POST_IMAGES = 3;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const POST_KINDS: PostKind[] = [
  "meal",
  "nap",
  "activity",
  "achievement",
  "mood",
  "photo",
  "announcement",
];

export const POST_KIND_LABELS: Record<PostKind, string> = {
  meal: "Comida",
  nap: "Siesta",
  activity: "Actividad",
  achievement: "Logro",
  mood: "Ánimo",
  photo: "Foto",
  announcement: "Anuncio",
};

export type PostAudience =
  | { scope: "room" }
  | { scope: "kids"; kidIds: string[] };

export type LocalPostImage = PostImage & {
  id: string;
  name: string;
};

export type PostFormField = "audience" | "kind" | "message" | "images";

export type PostFormInput = {
  audience: PostAudience | null;
  kind: PostKind | null;
  message: string;
  images: PostImage[];
};

export type PostFormErrors = Partial<Record<PostFormField, string>>;

type ImageCandidate = {
  type: string;
  size: number;
};

export function validatePostInput(input: PostFormInput): PostFormErrors {
  const errors: PostFormErrors = {};

  if (
    !input.audience ||
    (input.audience.scope === "kids" && input.audience.kidIds.length === 0)
  ) {
    errors.audience = "Elegí al menos un destinatario.";
  }

  if (!input.kind) {
    errors.kind = "Elegí un tipo de publicación.";
  }

  if (!input.message.trim()) {
    errors.message = "Escribí una descripción.";
  }

  if (input.kind === "photo" && input.images.length === 0) {
    errors.images = "Adjuntá una imagen para publicar una foto.";
  } else if (input.images.length > MAX_POST_IMAGES) {
    errors.images = `Podés adjuntar hasta ${MAX_POST_IMAGES} imágenes.`;
  }

  return errors;
}

export function validateImageFile(file: ImageCandidate): string | undefined {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Formato no admitido. Usá JPG, PNG o WebP.";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return "La imagen supera los 5 MB.";
  }

  return undefined;
}

export function createLocalImage(file: File): LocalPostImage {
  return {
    id: globalThis.crypto.randomUUID(),
    src: URL.createObjectURL(file),
    alt: `Imagen adjunta: ${file.name}`,
    name: file.name,
  };
}

export function releaseImage(image: PostImage): void {
  URL.revokeObjectURL(image.src);
}

export function releaseImages(images: PostImage[]): void {
  images.forEach(releaseImage);
}

export function describeAudience(
  audience: PostAudience,
  kids: { id: string; name: string }[],
): string {
  if (audience.scope === "room") {
    return "toda la sala";
  }

  return audience.kidIds
    .map((id) => kids.find((kid) => kid.id === id)?.name)
    .filter((name): name is string => Boolean(name))
    .join(", ");
}
