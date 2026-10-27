import type { Kid } from "../../_data/kids";
import { KidAllergyAlert } from "../kid-profile/kid-allergy-alert";
import { KidDetails } from "../kid-profile/kid-details";
import { KidParentsPanel } from "../kid-profile/kid-parents-panel";
import { KidProfileHeader } from "../kid-profile/kid-profile-header";
import { KidSummaryAction } from "../kid-profile/kid-summary-action";

type TemporaryKidProfileProps = {
  kid: Kid;
  onBack: () => void;
};

export function TemporaryKidProfile({
  kid,
  onBack,
}: TemporaryKidProfileProps) {
  return (
    <div className="mx-auto w-full max-w-[820px]">
      <KidProfileHeader kid={kid} onBack={onBack} />

      <div className="mt-5 flex flex-wrap items-start gap-[26px]">
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-[18px]">
          {kid.allergies && <KidAllergyAlert allergies={kid.allergies} />}

          {kid.medicalNotes && (
            <section
              aria-labelledby="temporary-kid-medical-notes"
              className="rounded-2xl border border-line bg-surface px-[18px] py-4"
            >
              <h2
                id="temporary-kid-medical-notes"
                className="mb-2 text-[12.5px] font-extrabold uppercase tracking-[0.8px] text-[#8A7C6D]"
              >
                Notas médicas
              </h2>
              <p className="break-words whitespace-pre-wrap text-[14.5px] leading-[1.5] text-ink">
                {kid.medicalNotes}
              </p>
            </section>
          )}

          <KidDetails kid={kid} />
        </div>

        <div className="flex w-full flex-col gap-3.5 sm:w-[300px] sm:flex-none">
          <KidSummaryAction />
          <KidParentsPanel
            kidId={kid.id}
            kidName={kid.name}
            parents={kid.parents}
            canInviteParents={false}
          />
        </div>
      </div>
    </div>
  );
}
