import Link from "next/link";
import { KID_AVATAR_TONES } from "../../_lib/avatar-tones";
import { calculateAgeInYears } from "../../_lib/kid-age";
import { normalizeText } from "../../_lib/normalize-text";
import type { Kid } from "../../_data/kids";
import { ChevronRightIcon } from "../ui/icons";

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

type KidCardProps = {
  kid: Kid;
  onSelect?: () => void;
};

export function KidCard({ kid, onSelect }: KidCardProps) {
  const age = calculateAgeInYears(kid.birthDate);
  const hasParents = kid.parents.length > 0;
  const className =
    "flex min-w-0 items-center gap-3.5 rounded-[18px] border border-line bg-surface p-4 text-left shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition hover:-translate-y-0.5 hover:border-[#F2A78E]";

  const content = (
    <>
      <span
        aria-hidden="true"
        className={`flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold ${KID_AVATAR_TONES[kid.avatarTone]}`}
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
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        data-testid="kid-card"
        aria-label={`Ver perfil de ${kid.name}`}
        onClick={onSelect}
        className={className}
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={`/kids/${kid.id}`} data-testid="kid-card" className={className}>
      {content}
    </Link>
  );
}
