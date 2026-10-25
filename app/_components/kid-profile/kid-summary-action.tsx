import { SunLogo } from "../ui/icons";

export function KidSummaryAction() {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-ink px-3 py-[13px] text-[15px] font-extrabold text-white"
    >
      <SunLogo aria-hidden="true" className="h-[18px] w-[18px]" />
      Resumen del día
    </button>
  );
}
