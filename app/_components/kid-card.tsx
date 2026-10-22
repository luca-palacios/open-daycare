import Link from "next/link";
import { calculateAgeInYears } from "../_lib/kid-age";
import { normalizeText } from "../_lib/normalize-text";
import type { Kid } from "../_data/kids";
import { ChevronRightIcon } from "./icons";

const AVATAR_TONES: Record<Kid["avatarTone"], string> = {
  sky: "bg-[#A9D9E8] text-[#1F7A93]",
  rose: "bg-[#F4B8CC] text-[#C44A7A]",
  mint: "bg-[#B9DEC4] text-[#3E8B62]",
  sun: "bg-[#F4DC8E] text-[#9A7B1E]",
  lilac: "bg-[#C9B6E8] text-[#7B5FC0]",
};

const ALLERGY_LABELS = [
  { keyword: "mani", label: "MANÍ" },
  { keyword: "lactosa", label: "LACTOSA" },
] as const;

const ALLERGY_BADGE = "bg-[#FBD8CC] text-[#D9684A]";
const PENDING_BADGE = "bg-[#F9D2DE] text-[#C56486]";

function parentsLabel(count: number): string {
  if (count === 0) return "sin padres vinculados";
  if (count === 1) return "1 padre vinculado";
  return `${count} padres vinculados`;
}

function allergyLabel(allergies: string): string {
  const normalized = normalizeText(allergies);
  return (
    ALLERGY_LABELS.find(({ keyword }) => normalized.includes(keyword))?.label ??
    "ALERGIA"
  );
}

function Badge({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={`flex-none rounded-full px-[9px] py-[5px] text-[11px] font-extrabold ${tone}`}
    >
      {label}
    </span>
  );
}

export function KidCard({ kid }: { kid: Kid }) {
  const age = calculateAgeInYears(kid.birthDate);
  const hasParents = kid.parents.length > 0;

  return (
    <Link
      href={`/kids/${kid.id}`}
      data-testid="kid-card"
      className="flex min-w-0 items-center gap-3.5 rounded-[18px] border border-line bg-surface p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition hover:-translate-y-0.5 hover:border-[#F2A78E]"
    >
      <span
        aria-hidden="true"
        className={`flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold ${AVATAR_TONES[kid.avatarTone]}`}
      >
        {kid.initials}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[16px] font-semibold text-ink">
          {kid.name}
        </span>
        <span className="block text-[13px] text-faint">
          {age} años · {parentsLabel(kid.parents.length)}
        </span>
      </span>

      {kid.allergies ? (
        <Badge label={allergyLabel(kid.allergies)} tone={ALLERGY_BADGE} />
      ) : hasParents ? (
        <ChevronRightIcon
          aria-hidden="true"
          className="h-[18px] w-[18px] flex-none text-[#CBB89F]"
        />
      ) : (
        <Badge label="VINCULAR" tone={PENDING_BADGE} />
      )}
    </Link>
  );
}
