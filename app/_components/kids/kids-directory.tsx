"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Tables } from "../../../utils/supabase/database.types";
import { normalizeText } from "../../_lib/normalize-text";
import { KidCard } from "./kid-card";
import { KidsEmptyState } from "./kids-empty-state";
import { KidsSearch } from "./kids-search";

type Room = Pick<Tables<"rooms">, "id" | "name">;
type Child = Pick<
  Tables<"children">,
  "id" | "room_id" | "full_name" | "birth_date" | "allergy_tags"
>;
type KidsDirectoryProps = {
  rooms: Room[];
  kids: Child[];
  loadError: boolean;
  onAddKid: (trigger: HTMLButtonElement) => void;
};

const ROOM_ORDER: Record<string, number> = {
  Soles: 0,
  Lunas: 1,
  Estrellas: 2,
};

export function KidsDirectory({
  rooms,
  kids,
  loadError,
  onAddKid,
}: KidsDirectoryProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeText(query.trim());
  const orderedRooms = useMemo(
    () =>
      [...rooms].sort((first, second) => {
        return (ROOM_ORDER[first.name] ?? 3) - (ROOM_ORDER[second.name] ?? 3);
      }),
    [rooms],
  );
  const matchingChildren = useMemo(
    () =>
      normalizedQuery
        ? kids.filter((child) =>
            normalizeText(child.full_name).includes(normalizedQuery),
          )
        : kids,
    [kids, normalizedQuery],
  );

  if (loadError) {
    return (
      <section
        role="alert"
        className="rounded-[18px] border border-[#E9B7A8] bg-[#FFF4EF] px-6 py-8 text-center"
      >
        <p className="font-display text-[17px] font-semibold text-ink">
          No pudimos cargar la lista de niños.
        </p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="mt-4 cursor-pointer rounded-[12px] border border-[#E0A38F] px-4 py-2 text-[14px] font-bold text-[#A5432F] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
        >
          Reintentar
        </button>
      </section>
    );
  }

  return (
    <>
      <KidsSearch value={query} onChange={setQuery} />

      <div className="flex flex-col gap-7">
        {orderedRooms.map((room) => {
          const roomChildren = matchingChildren.filter(
            (child) => child.room_id === room.id,
          );
          const activeCount = kids.filter(
            (child) => child.room_id === room.id,
          ).length;
          const countTestId =
            room.name === "Soles"
              ? "kids-count"
              : `kids-count-${normalizeText(room.name)}`;

          return (
            <section key={room.id} aria-labelledby={`kids-room-${room.id}`}>
              <div className="mb-3.5 flex items-center gap-3">
                <h2
                  id={`kids-room-${room.id}`}
                  className="text-[12.5px] font-extrabold uppercase tracking-[0.8px] text-ink"
                >
                  Sala {room.name}
                </h2>
                <span
                  data-testid={countTestId}
                  aria-live="polite"
                  className="text-[13px] text-faint"
                >
                  {activeCount} {activeCount === 1 ? "niño" : "niños"}
                </span>
                <span aria-hidden="true" className="h-px flex-1 bg-[#E7DAC8]" />
              </div>

              {roomChildren.length > 0 && (
                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                  {roomChildren.map((child) => (
                    <KidCard
                      key={child.id}
                      child={child}
                      roomName={room.name}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {kids.length === 0 ? (
        <KidsEmptyState kind="no-children" onAddKid={onAddKid} />
      ) : (
        normalizedQuery &&
        matchingChildren.length === 0 && <KidsEmptyState kind="no-results" />
      )}
    </>
  );
}
