import type { Metadata } from "next";
import { ActivateAccountForm } from "../_components/activate-account/activate-account-form";
import { InvitationSummary } from "../_components/activate-account/invitation-summary";
import { SunLogo } from "../_components/ui/icons";
import { invitation } from "../_data/invitation";

export const metadata: Metadata = {
  title: "Activar cuenta · OpenDayCare",
  description:
    "Creá tu contraseña para activar la cuenta y seguir el día de tu hijo.",
};

export default function ActivateAccountPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-auth-canvas p-5 sm:p-10">
      <div className="w-full max-w-[440px]">
        <div
          aria-hidden="true"
          className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] text-white shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]"
        >
          <SunLogo className="h-[30px] w-[30px]" />
        </div>

        <h1 className="mb-2 font-display text-[32px] font-semibold leading-[1.15] text-ink">
          Bienvenida a OpenDayCare
        </h1>
        <p className="mb-[26px] text-[15.5px] leading-[1.55] text-muted">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para
          activar la cuenta.
        </p>

        <InvitationSummary invitation={invitation} />
        <ActivateAccountForm invitation={invitation} />
      </div>
    </main>
  );
}
