const LOCALE = "es-AR";

export type DateInput = string | number | Date;

function toDate(input: DateInput): Date {
  return input instanceof Date ? input : new Date(input);
}

function resolveTimeZone(timeZone?: string): string | undefined {
  if (!timeZone) return undefined;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(0);
    return timeZone;
  } catch {
    return undefined;
  }
}

function formatter(
  options: Intl.DateTimeFormatOptions,
  timeZone?: string,
): Intl.DateTimeFormat {
  const resolved = resolveTimeZone(timeZone);

  return new Intl.DateTimeFormat(LOCALE, {
    ...options,
    ...(resolved ? { timeZone: resolved } : {}),
  });
}

function partValue(parts: Intl.DateTimeFormatPart[], type: string): string {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function formatFeedDate(input: DateInput, timeZone?: string): string {
  const parts = formatter(
    { weekday: "long", day: "numeric", month: "short" },
    timeZone,
  ).formatToParts(toDate(input));

  const weekday = partValue(parts, "weekday");
  const day = partValue(parts, "day");
  const month = partValue(parts, "month").replace(/\.$/, "");

  return [weekday, day, month].filter(Boolean).join(" ");
}

export function formatPostTime(input: DateInput, timeZone?: string): string {
  return formatter(
    { hour: "2-digit", minute: "2-digit", hourCycle: "h23" },
    timeZone,
  ).format(toDate(input));
}

export function getLocalDayKey(input: DateInput, timeZone?: string): string {
  const parts = formatter(
    { year: "numeric", month: "2-digit", day: "2-digit" },
    timeZone,
  ).formatToParts(toDate(input));

  const year = partValue(parts, "year");
  const month = partValue(parts, "month");
  const day = partValue(parts, "day");

  return `${year}-${month}-${day}`;
}
