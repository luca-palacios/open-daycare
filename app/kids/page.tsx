import type { Metadata } from "next";
import { connection } from "next/server";
import { AppShell } from "../_components/app-shell";
import { KidCard } from "../_components/kid-card";
import { KidsHeader } from "../_components/kids-header";
import { KidsSearch } from "../_components/kids-search";
import { kids } from "../_data/kids";
import { room } from "../_data/mock";

export const metadata: Metadata = {
  title: "Niños · OpenDayCare",
};

export default async function KidsPage() {
  await connection();

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[880px] px-4 pb-20 pt-6 sm:px-8 sm:pt-8 lg:px-10 lg:pb-20 lg:pt-[34px]">
        <KidsHeader />
        <KidsSearch />

        <section aria-labelledby="kids-room">
          <div className="mb-3.5 flex items-center gap-3">
            <h2
              id="kids-room"
              className="text-[12.5px] font-extrabold uppercase tracking-[0.8px] text-ink"
            >
              Sala {room.shortName}
            </h2>
            <span
              data-testid="kids-count"
              className="text-[13px] text-faint"
            >
              {kids.length} niños
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-[#E7DAC8]" />
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {kids.map((kid) => (
              <KidCard key={kid.id} kid={kid} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
