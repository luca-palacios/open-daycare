import { SearchIcon } from "./icons";

export function KidsEmptyState() {
  return (
    <div
      data-testid="kids-empty"
      className="flex flex-col items-center gap-2 rounded-[18px] border border-dashed border-[#DBCDBA] bg-surface px-6 py-12 text-center"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-[#B0A290]">
        <SearchIcon aria-hidden="true" className="h-5 w-5" />
      </span>
      <p className="font-display text-[17px] font-semibold text-ink">
        No encontramos niños
      </p>
      <p className="text-[14px] text-faint">
        Probá con otro nombre o apellido.
      </p>
    </div>
  );
}
