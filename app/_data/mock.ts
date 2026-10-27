import { getLocalDayKey } from "../_lib/format-date";
import { kids } from "./kids";

export type PostKind =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "photo"
  | "announcement";

export type Post = {
  id: string;
  kind: PostKind;
  authorName: string;
  authorInitials: string;
  audience: string;
  publishedAt: string; // ISO 8601 en UTC, con sufijo Z
  message: string;
  reactions: number;
  comments: number;
  photo?: { label: string };
};

export const TEACHER_TIME_ZONE = "America/Argentina/Buenos_Aires";
const UTC_OFFSET = "-03:00"; // Argentina no aplica horario de verano

export const room = {
  name: "Sala Soles",
  shortName: "Soles",
  eyebrow: "Guardería · Sala Soles",
  childrenCount: kids.length,
} as const;

export const teacher = {
  name: "Caro Giménez",
  firstName: "Caro",
  initials: "C",
  role: "Maestra · Soles",
} as const;

export function createMockPosts(now: Date = new Date()): Post[] {
  const today = getLocalDayKey(now, TEACHER_TIME_ZONE);

  const publishedAt = (time: string) =>
    new Date(`${today}T${time}:00${UTC_OFFSET}`).toISOString();

  return [
    {
      id: "post-achievement",
      kind: "achievement",
      authorName: "Mateo",
      authorInitials: "M",
      audience: "familia de Mateo",
      publishedAt: publishedAt("14:20"),
      message:
        "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
      reactions: 3,
      comments: 1,
    },
    {
      id: "post-activity",
      kind: "activity",
      authorName: "Mateo",
      authorInitials: "M",
      audience: "familia de Mateo",
      publishedAt: publishedAt("09:40"),
      message:
        "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
      reactions: 5,
      comments: 2,
      photo: { label: "Foto · pintando con témperas" },
    },
    {
      id: "post-announcement",
      kind: "announcement",
      authorName: "Anuncio general",
      authorInitials: "",
      audience: "toda la sala",
      publishedAt: publishedAt("07:50"),
      message:
        "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
      reactions: 8,
      comments: 0,
    },
  ];
}
