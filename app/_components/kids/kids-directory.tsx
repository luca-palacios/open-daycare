"use client";

import { useMemo, useState } from "react";
import type { Kid } from "../../_data/kids";
import { normalizeText } from "../../_lib/normalize-text";
import { useTemporaryKids } from "./temporary-kids-provider";
import { KidCard } from "./kid-card";
import { KidsEmptyState } from "./kids-empty-state";
import { KidsSearch } from "./kids-search";
import { TemporaryKidProfile } from "./temporary-kid-profile";

type KidsDirectoryProps = {
  kids: Kid[];
};

const ROOMS: Kid["room"][] = ["Soles", "Lunas"];

export function KidsDirectory({ kids }: KidsDirectoryProps) {
  const { temporaryKids } = useTemporaryKids();
  const [query, setQuery] = useState("");
  const [selectedTemporaryKidId, setSelectedTemporaryKidId] = useState<
    string | null
  >(null);
  const normalizedQuery = normalizeText(query.trim());
  const allKids = useMemo(() => [...kids, ...temporaryKids], [kids, temporaryKids]);
  const temporaryKidIds = useMemo(
    () => new Set(temporaryKids.map((kid) => kid.id)),
    [temporaryKids],
  );
  const visibleKids = normalizedQuery
    ? allKids.filter((kid) => normalizeText(kid.name).includes(normalizedQuery))
    : allKids;
  const selectedTemporaryKid = temporaryKids.find(
    (kid) => kid.id === selectedTemporaryKidId,
  );

  if (selectedTemporaryKid) {
    return (
      <TemporaryKidProfile
        kid={selectedTemporaryKid}
        onBack={() => setSelectedTemporaryKidId(null)}
      />
    );
  }

  return (
    <>
      <KidsSearch value={query} onChange={setQuery} />

      <div className="flex flex-col gap-7">
        {ROOMS.map((room) => {
          const roomKids = visibleKids.filter((kid) => kid.room === room);

          return (
            <section key={room} aria-labelledby={`kids-room-${room}`}>
              <div className="mb-3.5 flex items-center gap-3">
                <h2
                  id={`kids-room-${room}`}
                  className="text-[12.5px] font-extrabold uppercase tracking-[0.8px] text-ink"
                >
                  Sala {room}
                </h2>
                <span
                  data-testid={
                    room === "Soles" ? "kids-count" : "kids-count-lunas"
                  }
                  aria-live="polite"
                  className="text-[13px] text-faint"
                >
                  {roomKids.length} {roomKids.length === 1 ? "niño" : "niños"}
                </span>
                <span aria-hidden="true" className="h-px flex-1 bg-[#E7DAC8]" />
              </div>

              {roomKids.length > 0 && (
                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                  {roomKids.map((kid) => (
                    <KidCard
                      key={kid.id}
                      kid={kid}
                      onSelect={temporaryKidIds.has(kid.id)
                        ? () => setSelectedTemporaryKidId(kid.id)
                        : undefined}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {normalizedQuery && visibleKids.length === 0 && <KidsEmptyState />}
    </>
  );
}
