import type { KidAvatarTone } from "./avatar-tones";

export type KidProfileData = {
  id: string;
  name: string;
  birthDate: string;
  joinedAt: string;
  room: string;
  initials: string;
  avatarTone: KidAvatarTone;
  allergies?: string;
  medicalNotes?: string;
};

export function getKidInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] ?? "")
    .join("")
    .toLocaleUpperCase("es");
}
