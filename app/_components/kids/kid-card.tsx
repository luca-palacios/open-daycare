import Link from "next/link";
import type { Tables } from "../../../utils/supabase/database.types";
import { getKidAvatarTone, KID_AVATAR_TONES } from "../../_lib/avatar-tones";
import { calculateAgeInYears } from "../../_lib/kid-age";
import { ChevronRightIcon } from "../ui/icons";

type Child = Pick<
  Tables<"children">,
  "id" | "full_name" | "birth_date" | "allergy_tags"
>;

const ALLERGY_LABELS: Record<string, string> = {
  peanut: "Maní",
  lactose: "Lactosa",
  gluten: "Gluten",
};

function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] ?? "")
    .join("")
    .toLocaleUpperCase("es");
}

function AllergyBadge({ label }: { label: string }) {
  return (
    <span
      className="flex-none rounded-full bg-[#FBD8CC] px-[9px] py-[5px] text-[11px] font-extrabold text-[#D9684A]"
    >
      {label}
    </span>
  );
}

type KidCardProps = {
  child: Child;
  roomName: string;
};

export function KidCard({ child, roomName }: KidCardProps) {
  const age = calculateAgeInYears(child.birth_date);
  const allergyLabels = child.allergy_tags
    .map((tag) => ALLERGY_LABELS[tag] ?? "Otra alergia")
    .filter((label, index, labels) => labels.indexOf(label) === index);

  return (
    <Link
      href={`/kids/${child.id}`}
      data-testid="kid-card"
      className="flex min-w-0 items-center gap-3.5 rounded-[18px] border border-line bg-surface p-4 text-left shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition hover:-translate-y-0.5 hover:border-[#F2A78E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
    >
      <span
        aria-hidden="true"
        className={`flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold ${KID_AVATAR_TONES[getKidAvatarTone(child.id)]}`}
      >
        {getInitials(child.full_name)}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[16px] font-semibold text-ink">
          {child.full_name}
        </span>
        <span className="block truncate text-[13px] text-faint">
          {age} años · Sala {roomName}
        </span>
      </span>

      <span className="flex flex-none items-center gap-1.5">
        {allergyLabels.slice(0, 2).map((label) => (
          <AllergyBadge key={label} label={label} />
        ))}
        <ChevronRightIcon
          aria-hidden="true"
          className="h-[18px] w-[18px] text-[#CBB89F]"
        />
      </span>
    </Link>
  );
}
