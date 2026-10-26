import type { Invitation } from "../../_data/invitation";
import { KID_AVATAR_TONES } from "../../_lib/avatar-tones";

type InvitationSummaryProps = {
  invitation: Invitation;
};

export function InvitationSummary({ invitation }: InvitationSummaryProps) {
  return (
    <div className="mb-[22px] flex items-center gap-3.5 rounded-[16px] border-[1.5px] border-auth-line bg-white px-4 py-3.5">
      <div
        aria-hidden="true"
        className={`flex h-11 w-11 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold ${KID_AVATAR_TONES[invitation.avatarTone]}`}
      >
        {invitation.initials}
      </div>
      <div>
        <div className="text-[13px] text-muted">Te invitaron a seguir a</div>
        <div className="font-display text-[17px] font-semibold text-ink">
          {invitation.kidName} · {invitation.roomName}
        </div>
      </div>
    </div>
  );
}
