"use client";

import { useCallback, useRef, useState } from "react";
import type { Parent } from "../../_data/kids";
import type { TemporaryParentInvitation } from "../../_lib/parent-invitation";
import { useParentInvitations } from "./parent-invitations-provider";
import { LinkParentModal } from "./link-parent-modal";
import { PlusIcon } from "../ui/icons";

const PARENT_TONES = ["bg-[#C9B6E8]", "bg-[#A9C7E8]"];

const ACTIVE_BADGE = "bg-[#CFEBD8] text-[#3E9B6C]";
const PENDING_BADGE = "bg-[#F7E7A6] text-[#9A7B1E]";

function statusLabel(parent: Parent, pendingLabel: string): string {
  if (parent.status === "pending") return pendingLabel;
  return parent.relationship === "mamá" ? "activa" : "activo";
}

function statusBadge(parent: Parent): { label: string; tone: string } {
  if (parent.status === "pending") {
    return { label: "PENDIENTE", tone: PENDING_BADGE };
  }

  return {
    label: parent.relationship === "mamá" ? "ACTIVA" : "ACTIVO",
    tone: ACTIVE_BADGE,
  };
}

function ParentRow({
  parent,
  index,
  pendingLabel = "invitación enviada",
}: {
  parent: Parent;
  index: number;
  pendingLabel?: string;
}) {
  const badge = statusBadge(parent);
  const relationship =
    parent.relationship.charAt(0).toUpperCase() + parent.relationship.slice(1);

  return (
    <li className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`flex h-10 w-10 flex-none items-center justify-center rounded-full font-display text-[16px] font-semibold text-white ${PARENT_TONES[index % PARENT_TONES.length]}`}
      >
        {parent.name.charAt(0)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-extrabold text-ink">
          {parent.name}
        </span>
        <span className="block text-[12.5px] text-faint">
          {relationship} · {statusLabel(parent, pendingLabel)}
        </span>
      </span>
      <span
        className={`flex-none rounded-full px-[9px] py-1 text-[10.5px] font-extrabold ${badge.tone}`}
      >
        {badge.label}
      </span>
    </li>
  );
}

type KidParentsPanelProps = {
  kidId: string;
  kidName: string;
  parents: Parent[];
  canInviteParents: boolean;
};

export function KidParentsPanel({
  kidId,
  kidName,
  parents,
  canInviteParents,
}: KidParentsPanelProps) {
  const { parentInvitations, addParentInvitation } = useParentInvitations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const inviteButtonRef = useRef<HTMLButtonElement>(null);
  const closeModal = useCallback(() => setIsModalOpen(false), []);
  const kidInvitations = canInviteParents
    ? parentInvitations.filter((invitation) => invitation.kidId === kidId)
    : [];
  const pendingParents = kidInvitations.map(toParent);

  return (
    <section className="rounded-2xl border border-line bg-surface px-[18px] py-4">
      <h2 className="mb-3.5 text-[12.5px] font-extrabold uppercase tracking-[0.8px] text-[#8A7C6D]">
        Padres vinculados
      </h2>

      {parents.length + pendingParents.length > 0 ? (
        <ul className="flex flex-col gap-3.5">
          {parents.map((parent, index) => (
            <ParentRow key={parent.id} parent={parent} index={index} />
          ))}
          {pendingParents.map((parent, index) => (
            <ParentRow
              key={parent.id}
              parent={parent}
              index={parents.length + index}
              pendingLabel="pendiente"
            />
          ))}
        </ul>
      ) : (
        <p className="text-[14.5px] text-faint">Sin padres vinculados</p>
      )}

      <button
        ref={inviteButtonRef}
        type="button"
        disabled={!canInviteParents}
        aria-haspopup={canInviteParents ? "dialog" : undefined}
        onClick={() => setIsModalOpen(true)}
        className={`mt-3 flex items-center gap-3 pt-2 ${
          canInviteParents
            ? "cursor-pointer focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
            : "cursor-not-allowed opacity-60"
        }`}
      >
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]">
          <PlusIcon aria-hidden="true" className="h-[18px] w-[18px]" />
        </span>
        <span className="text-[14.5px] font-extrabold text-brand-dark">
          Vincular otro padre
        </span>
      </button>

      {isModalOpen && canInviteParents && (
        <LinkParentModal
          kidId={kidId}
          kidName={kidName}
          invitations={parentInvitations}
          onCreateInvitation={addParentInvitation}
          onClose={closeModal}
          returnFocusRef={inviteButtonRef}
        />
      )}
    </section>
  );
}

function toParent(invitation: TemporaryParentInvitation): Parent {
  return {
    id: invitation.id,
    name: invitation.name,
    relationship: invitation.relationship,
    status: invitation.status,
  };
}
