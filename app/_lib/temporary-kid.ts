import type { Kid } from "../_data/kids";
import { getLocalDayKey } from "./format-date";
import { KID_TIME_ZONE } from "./kid-age";

export type KidFormField = "name" | "birthDate" | "room";

export type KidFormInput = {
  name: string;
  birthDate: string;
  room: string;
  allergies: string;
  medicalNotes: string;
};

export type KidFormErrors = Partial<Record<KidFormField, string>>;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ROOMS = ["Soles", "Lunas"] as const;

function isValidCalendarDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12) return false;

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day >= 1 && day <= daysInMonth[month - 1];
}

export function validateKidInput(
  input: KidFormInput,
  now: Date = new Date(),
): KidFormErrors {
  const errors: KidFormErrors = {};

  if (!input.name.trim()) {
    errors.name = "Ingresá el nombre del niño.";
  }

  if (!input.birthDate) {
    errors.birthDate = "Ingresá la fecha de nacimiento.";
  } else if (!isValidCalendarDate(input.birthDate)) {
    errors.birthDate = "Ingresá una fecha válida.";
  } else if (input.birthDate > getLocalDayKey(now, KID_TIME_ZONE)) {
    errors.birthDate = "La fecha no puede ser posterior a hoy.";
  }

  if (!input.room) {
    errors.room = "Seleccioná una sala.";
  } else if (!ROOMS.includes(input.room as (typeof ROOMS)[number])) {
    errors.room = "Seleccioná una sala válida.";
  }

  return errors;
}

export function createTemporaryKid(
  input: KidFormInput,
  now: Date = new Date(),
): Kid {
  const name = input.name.trim();
  const allergies = input.allergies
    .split(",")
    .map((allergy) => allergy.trim())
    .filter(Boolean)
    .join(", ");

  return {
    id: `temporary-${globalThis.crypto.randomUUID()}`,
    name,
    birthDate: input.birthDate,
    joinedAt: getLocalDayKey(now, KID_TIME_ZONE),
    room: input.room as Kid["room"],
    initials: name.charAt(0).toLocaleUpperCase("es-AR"),
    avatarTone: "sky",
    ...(allergies ? { allergies } : {}),
    ...(input.medicalNotes.trim()
      ? { medicalNotes: input.medicalNotes.trim() }
      : {}),
    parents: [],
  };
}
