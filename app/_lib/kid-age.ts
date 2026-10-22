import { getLocalDayKey } from "./format-date";

export const KID_TIME_ZONE = "America/Argentina/Buenos_Aires";

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function parseIsoDate(value: string): DateParts {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

export function calculateAgeInYears(
  birthDate: string,
  now: Date = new Date(),
): number {
  const birth = parseIsoDate(birthDate);
  const today = parseIsoDate(getLocalDayKey(now, KID_TIME_ZONE));
  const birthdayPassed =
    today.month > birth.month ||
    (today.month === birth.month && today.day >= birth.day);

  return today.year - birth.year - (birthdayPassed ? 0 : 1);
}

function toDateOnly(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

const longDateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const monthYearFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function partValue(parts: Intl.DateTimeFormatPart[], type: string): string {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function formatKidDate(isoDate: string): string {
  const parts = longDateFormatter.formatToParts(toDateOnly(isoDate));
  const day = partValue(parts, "day");
  const month = partValue(parts, "month").replace(/\.$/, "");
  const year = partValue(parts, "year");

  return [day, month, year].filter(Boolean).join(" ");
}

export function formatKidMonthYear(isoDate: string): string {
  const parts = monthYearFormatter.formatToParts(toDateOnly(isoDate));
  const month = partValue(parts, "month").replace(/\.$/, "");
  const year = partValue(parts, "year");

  return [month, year].filter(Boolean).join(" ");
}
