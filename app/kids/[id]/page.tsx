import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AppShell } from "../../_components/layout/app-shell";
import { KidAllergyAlert } from "../../_components/kid-profile/kid-allergy-alert";
import { KidDetails } from "../../_components/kid-profile/kid-details";
import { KidMedicalNotes } from "../../_components/kid-profile/kid-medical-notes";
import { KidParentsPanel } from "../../_components/kid-profile/kid-parents-panel";
import { KidProfileHeader } from "../../_components/kid-profile/kid-profile-header";
import { KidSummaryAction } from "../../_components/kid-profile/kid-summary-action";
import { getKidAvatarTone } from "../../_lib/avatar-tones";
import { getKidInitials, type KidProfileData } from "../../_lib/kid-profile";
import { createClient } from "../../../utils/supabase/server";

export const instant = false;

async function getKidProfile(id: string): Promise<KidProfileData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("children")
    .select(
      "id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, rooms!inner(name)",
    )
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error("No se pudo cargar el perfil del niño.");
  if (!data?.rooms) return null;

  const medicalNotes = data.medical_notes?.trim();

  return {
    id: data.id,
    name: data.full_name,
    birthDate: data.birth_date,
    joinedAt: data.enrolled_at,
    room: data.rooms.name,
    initials: getKidInitials(data.full_name),
    avatarTone: getKidAvatarTone(data.id),
    ...(data.allergy_tags.length > 0
      ? { allergies: data.allergy_tags.join(", ") }
      : {}),
    ...(medicalNotes ? { medicalNotes } : {}),
  };
}

export async function generateMetadata({
  params,
}: PageProps<"/kids/[id]">): Promise<Metadata> {
  const { id } = await params;
  const kid = await getKidProfile(id).catch(() => null);

  return {
    title: kid ? `${kid.name} · OpenDayCare` : "Niño no encontrado · OpenDayCare",
  };
}

export default async function KidProfilePage({
  params,
}: PageProps<"/kids/[id]">) {
  await connection();
  const { id } = await params;
  const kid = await getKidProfile(id);

  if (!kid) notFound();

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[820px] px-4 pb-20 pt-6 sm:px-8 sm:pt-8 lg:px-10 lg:pb-20 lg:pt-[34px]">
        <KidProfileHeader kid={kid} />

        <div className="mt-5 flex flex-wrap items-start gap-[26px]">
          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-[18px]">
            {kid.allergies && <KidAllergyAlert allergies={kid.allergies} />}
            {kid.medicalNotes && <KidMedicalNotes notes={kid.medicalNotes} />}
            <KidDetails kid={kid} />
          </div>

          <div className="flex w-full flex-col gap-3.5 sm:w-[300px] sm:flex-none">
            <KidSummaryAction />
            <KidParentsPanel
              kidId={kid.id}
              kidName={kid.name}
              parents={[]}
              canInviteParents={false}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
