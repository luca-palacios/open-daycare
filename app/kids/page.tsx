import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { AppShell } from "../_components/layout/app-shell";
import { KidsWorkspace } from "../_components/kids/kids-workspace";
import { createClient } from "../../utils/supabase/server";
import type { Tables } from "../../utils/supabase/database.types";

type Room = Pick<Tables<"rooms">, "id" | "name">;
type Child = Pick<
  Tables<"children">,
  "id" | "room_id" | "full_name" | "birth_date" | "allergy_tags"
>;
type KidsDirectoryData = {
  rooms: Room[];
  kids: Child[];
  loadError: boolean;
};

export const metadata: Metadata = {
  title: "Niños · OpenDayCare",
};

async function getKidsDirectoryData(): Promise<KidsDirectoryData> {
  await connection();

  try {
    const supabase = await createClient();
    const [roomsResult, childrenResult] = await Promise.all([
      supabase.from("rooms").select("id, name"),
      supabase
        .from("children")
        .select("id, room_id, full_name, birth_date, allergy_tags")
        .eq("status", "active")
        .order("full_name"),
    ]);

    if (roomsResult.error || childrenResult.error) {
      return { rooms: [], kids: [], loadError: true };
    }

    return {
      rooms: roomsResult.data,
      kids: childrenResult.data,
      loadError: false,
    };
  } catch {
    return { rooms: [], kids: [], loadError: true };
  }
}

async function KidsContent() {
  const directoryData = await getKidsDirectoryData();

  return <KidsWorkspace {...directoryData} />;
}

function KidsSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-[22px]">
      <div className="mb-[22px] flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-16 animate-pulse rounded bg-[#E7DAC8]" />
          <div className="h-8 w-24 animate-pulse rounded bg-[#E7DAC8]" />
        </div>
        <div className="h-11 w-36 animate-pulse rounded-[14px] bg-[#E7DAC8]" />
      </div>
      <div className="h-[46px] animate-pulse rounded-[14px] border border-line bg-surface" />
      <div className="flex flex-col gap-7">
        {Array.from({ length: 3 }, (_, index) => (
          <section key={index} className="flex flex-col gap-3.5">
            <div className="h-4 w-36 animate-pulse rounded bg-[#E7DAC8]" />
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              {Array.from({ length: 2 }, (_, cardIndex) => (
                <div
                  key={cardIndex}
                  className="h-[81px] animate-pulse rounded-[18px] border border-line bg-surface"
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function KidsPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[880px] px-4 pb-20 pt-6 sm:px-8 sm:pt-8 lg:px-10 lg:pb-20 lg:pt-[34px]">
        <Suspense fallback={<KidsSkeleton />}>
          <KidsContent />
        </Suspense>
      </div>
    </AppShell>
  );
}
