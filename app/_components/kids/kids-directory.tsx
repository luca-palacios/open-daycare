"use client";

import { useState } from "react";
import type { Kid } from "../../_data/kids";
import { normalizeText } from "../../_lib/normalize-text";
import { KidCard } from "./kid-card";
import { KidsEmptyState } from "./kids-empty-state";
import { KidsSearch } from "./kids-search";

type KidsDirectoryProps = {
  kids: Kid[];
  roomName: string;
};

export function KidsDirectory({ kids, roomName }: KidsDirectoryProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeText(query.trim());
  const visibleKids = normalizedQuery
    ? kids.filter((kid) => normalizeText(kid.name).includes(normalizedQuery))
    : kids;

  return (
    <>
      <KidsSearch value={query} onChange={setQuery} />

      <section aria-labelledby="kids-room">
        <div className="mb-3.5 flex items-center gap-3">
          <h2
            id="kids-room"
            className="text-[12.5px] font-extrabold uppercase tracking-[0.8px] text-ink"
          >
            Sala {roomName}
          </h2>
          <span
            data-testid="kids-count"
            aria-live="polite"
            className="text-[13px] text-faint"
          >
            {visibleKids.length}{" "}
            {visibleKids.length === 1 ? "niño" : "niños"}
          </span>
          <span aria-hidden="true" className="h-px flex-1 bg-[#E7DAC8]" />
        </div>

        {visibleKids.length > 0 ? (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {visibleKids.map((kid) => (
              <KidCard key={kid.id} kid={kid} />
            ))}
          </div>
        ) : (
          <KidsEmptyState />
        )}
      </section>
    </>
  );
}
