import { SearchIcon } from "./icons";

export function KidsSearch() {
  return (
    <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-line bg-surface px-4 py-3">
      <SearchIcon
        aria-hidden="true"
        className="h-[18px] w-[18px] flex-none text-[#B0A290]"
      />
      <input
        type="search"
        aria-label="Buscar niño"
        placeholder="Buscar niño…"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-[#B6A99B]"
      />
    </div>
  );
}
