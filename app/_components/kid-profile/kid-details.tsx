import { formatKidDate, formatKidMonthYear } from "../../_lib/kid-age";
import type { KidProfileData } from "../../_lib/kid-profile";

export function KidDetails({ kid }: { kid: KidProfileData }) {
  const rows = [
    { label: "Fecha de nacimiento", value: formatKidDate(kid.birthDate) },
    { label: "Sala", value: kid.room },
    { label: "Ingreso", value: formatKidMonthYear(kid.joinedAt) },
  ];

  return (
    <dl className="overflow-hidden rounded-2xl border border-line bg-surface">
      {rows.map((row, index) => (
        <div
          key={row.label}
          className={`flex items-center justify-between gap-4 px-[18px] py-[15px] ${
            index < rows.length - 1 ? "border-b border-line-soft" : ""
          }`}
        >
          <dt className="text-[14.5px] text-muted">{row.label}</dt>
          <dd className="text-right text-[14.5px] font-extrabold text-ink">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
