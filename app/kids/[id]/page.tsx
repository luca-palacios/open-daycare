import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AppShell } from "../../_components/layout/app-shell";
import { KidAllergyAlert } from "../../_components/kid-profile/kid-allergy-alert";
import { KidDetails } from "../../_components/kid-profile/kid-details";
import { KidParentsPanel } from "../../_components/kid-profile/kid-parents-panel";
import { KidProfileHeader } from "../../_components/kid-profile/kid-profile-header";
import { KidSummaryAction } from "../../_components/kid-profile/kid-summary-action";
import { getKidById } from "../../_data/kids";

export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/kids/[id]">): Promise<Metadata> {
  const { id } = await params;
  const kid = getKidById(id);

  return {
    title: kid ? `${kid.name} · OpenDayCare` : "Niño no encontrado · OpenDayCare",
  };
}

export default async function KidProfilePage({
  params,
}: PageProps<"/kids/[id]">) {
  await connection();
  const { id } = await params;
  const kid = getKidById(id);

  if (!kid) notFound();

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[820px] px-4 pb-20 pt-6 sm:px-8 sm:pt-8 lg:px-10 lg:pb-20 lg:pt-[34px]">
        <KidProfileHeader kid={kid} />

        <div className="mt-5 flex flex-wrap items-start gap-[26px]">
          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-[18px]">
            {kid.allergies && <KidAllergyAlert allergies={kid.allergies} />}
            <KidDetails kid={kid} />
          </div>

          <div className="flex w-full flex-col gap-3.5 sm:w-[300px] sm:flex-none">
            <KidSummaryAction />
            <KidParentsPanel
              kidId={kid.id}
              kidName={kid.name}
              parents={kid.parents}
              canInviteParents
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
