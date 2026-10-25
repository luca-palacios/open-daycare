import { AlertTriangleIcon } from "../ui/icons";

export function KidAllergyAlert({ allergies }: { allergies: string }) {
  return (
    <div className="flex gap-3.5 rounded-2xl bg-[#FBDAD6] px-[18px] py-4">
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0] text-white">
        <AlertTriangleIcon aria-hidden="true" className="h-[22px] w-[22px]" />
      </span>
      <div className="min-w-0">
        <p className="mb-0.5 text-[15px] font-extrabold text-[#C5413A]">
          Alergias y notas
        </p>
        <p className="text-[14.5px] leading-[1.5] text-[#B25249]">
          {allergies}
        </p>
      </div>
    </div>
  );
}
