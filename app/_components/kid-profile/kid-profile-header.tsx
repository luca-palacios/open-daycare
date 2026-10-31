import Link from "next/link";
import { KID_AVATAR_TONES } from "../../_lib/avatar-tones";
import { calculateAgeInYears } from "../../_lib/kid-age";
import type { KidProfileData } from "../../_lib/kid-profile";
import { ChevronLeftIcon } from "../ui/icons";

type KidProfileHeaderProps = {
  kid: KidProfileData;
  onBack?: () => void;
  showEditButton?: boolean;
};

export function KidProfileHeader({
  kid,
  onBack,
  showEditButton = true,
}: KidProfileHeaderProps) {
  const age = calculateAgeInYears(kid.birthDate);

  return (
    <header>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="mb-5 flex cursor-pointer items-center gap-[7px] text-[14px] font-bold text-muted"
        >
          <ChevronLeftIcon aria-hidden="true" className="h-[18px] w-[18px]" />
          Volver a Niños
        </button>
      ) : (
        <Link
          href="/kids"
          className="mb-5 flex items-center gap-[7px] text-[14px] font-bold text-muted"
        >
          <ChevronLeftIcon aria-hidden="true" className="h-[18px] w-[18px]" />
          Volver a Niños
        </Link>
      )}

      <div className="flex flex-wrap items-center gap-[18px]">
        <span
          aria-hidden="true"
          className={`flex h-[84px] w-[84px] flex-none items-center justify-center rounded-full font-display text-[34px] font-semibold ${KID_AVATAR_TONES[kid.avatarTone]}`}
        >
          {kid.initials}
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[28px] font-semibold leading-tight text-ink">
            {kid.name}
          </h1>
          <p className="mt-[3px] text-[15px] text-muted">
            {age} años · Sala {kid.room}
          </p>
        </div>

        {showEditButton && (
          <button
            type="button"
            className="flex-none cursor-pointer rounded-xl border-[1.5px] border-line bg-surface px-4 py-[9px] text-[14px] font-bold text-[#6E6359]"
          >
            Editar
          </button>
        )}
      </div>
    </header>
  );
}
