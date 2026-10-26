import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { AppShell } from "../_components/layout/app-shell";
import { KidsDirectory } from "../_components/kids/kids-directory";
import { KidsHeader } from "../_components/kids/kids-header";
import { kids } from "../_data/kids";

export const metadata: Metadata = {
  title: "Niños · OpenDayCare",
};

async function KidsContent() {
  await connection();
  return <KidsDirectory kids={kids} />;
}

function KidsSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-[22px]">
      <div className="h-[46px] animate-pulse rounded-[14px] border border-line bg-surface" />
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="h-[81px] animate-pulse rounded-[18px] border border-line bg-surface"
          />
        ))}
      </div>
    </div>
  );
}

export default function KidsPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[880px] px-4 pb-20 pt-6 sm:px-8 sm:pt-8 lg:px-10 lg:pb-20 lg:pt-[34px]">
        <KidsHeader />
        <Suspense fallback={<KidsSkeleton />}>
          <KidsContent />
        </Suspense>
      </div>
    </AppShell>
  );
}
