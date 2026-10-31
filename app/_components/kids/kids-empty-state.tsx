import { PlusIcon, SearchIcon } from "../ui/icons";

type KidsEmptyStateProps = {
  kind: "no-children" | "no-results";
};

export function KidsEmptyState({ kind }: KidsEmptyStateProps) {
  const hasNoChildren = kind === "no-children";

  return (
    <div
      data-testid="kids-empty"
      className="flex flex-col items-center gap-2 rounded-[18px] border border-dashed border-[#DBCDBA] bg-surface px-6 py-12 text-center"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-[#B0A290]">
        {hasNoChildren ? (
          <PlusIcon aria-hidden="true" className="h-5 w-5" />
        ) : (
          <SearchIcon aria-hidden="true" className="h-5 w-5" />
        )}
      </span>
      <p className="font-display text-[17px] font-semibold text-ink">
        {hasNoChildren ? "Aún no hay niños" : "No encontramos niños"}
      </p>
      <p className="text-[14px] text-faint">
        {hasNoChildren
          ? "Agregá el primer niño para que aparezca en su sala."
          : "Probá con otro nombre o apellido."}
      </p>
    </div>
  );
}
