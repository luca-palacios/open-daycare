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
  roomIds?: string[],
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
  } else if (roomIds && !roomIds.includes(input.room)) {
    errors.room = "Seleccioná una sala válida.";
  }

  return errors;
}
