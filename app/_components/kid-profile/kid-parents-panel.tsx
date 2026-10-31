"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import type { Parent } from "../../_data/kids";
import type { InvitationActionResult } from "../../_lib/parent-invitation-server";
import { LinkParentModal } from "./link-parent-modal";
import { PlusIcon } from "../ui/icons";

export type ParentInvitationView = {
  id: string;
  name: string;
  email: string;
  relationship: Parent["relationship"];
  status: "pending" | "accepted" | "expired";
};

const PARENT_TONES = ["bg-[#C9B6E8]", "bg-[#A9C7E8]"];

function ParentRow({ parent, index, onResend, onCancel }: { parent: Parent; index: number; onResend?: () => void; onCancel?: () => void }) {
  const pending = parent.status === "pending";
  const expired = parent.status === "expired";
  const label = expired ? "vencida" : pending ? "pendiente" : parent.relationship === "mamá" ? "activa" : "activo";
  return <li className="flex items-center gap-3"><span aria-hidden="true" className={`flex h-10 w-10 flex-none items-center justify-center rounded-full font-display text-[16px] font-semibold text-white ${PARENT_TONES[index % PARENT_TONES.length]}`}>{parent.name.charAt(0)}</span><span className="min-w-0 flex-1"><span className="block truncate text-[14.5px] font-extrabold text-ink">{parent.name}</span><span className="block text-[12.5px] text-faint">{parent.relationship.charAt(0).toUpperCase() + parent.relationship.slice(1)} · {label}</span></span><span className={`flex-none rounded-full px-[9px] py-1 text-[10.5px] font-extrabold ${expired ? "bg-[#FBE3D8] text-[#B4422D]" : pending ? "bg-[#F7E7A6] text-[#9A7B1E]" : "bg-[#CFEBD8] text-[#3E9B6C]"}`}>{expired ? "VENCIDA" : pending ? "PENDIENTE" : "ACTIVO"}</span>{(pending || expired) && <span className="flex gap-1"><button type="button" title="Reenviar invitación" aria-label={`Reenviar invitación a ${parent.name}`} onClick={onResend} className="rounded-lg p-2 text-[#75685C] hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand-dark">↻</button><button type="button" title="Cancelar invitación" aria-label={`Cancelar invitación a ${parent.name}`} onClick={onCancel} className="rounded-lg p-2 text-[#75685C] hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand-dark">×</button></span>}</li>;
}

type KidParentsPanelProps = {
  kidId: string;
  kidName: string;
  parents: Parent[];
  invitations: ParentInvitationView[];
  createInvitation: (input: { childId: string; fullName: string; email: string; relationship: "father" | "mother" | "guardian" }) => Promise<InvitationActionResult>;
  resendInvitation: (id: string) => Promise<InvitationActionResult>;
  cancelInvitation: (id: string) => Promise<InvitationActionResult>;
};

export function KidParentsPanel({ kidId, kidName, parents, invitations, createInvitation, resendInvitation, cancelInvitation }: KidParentsPanelProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inviteButtonRef = useRef<HTMLButtonElement>(null);
  const closeModal = useCallback(() => setIsModalOpen(false), []);
  const invitationParents = invitations.map((invitation) => ({ id: invitation.id, name: invitation.name, relationship: invitation.relationship, status: invitation.status === "accepted" ? "active" : "pending" } satisfies Parent));
  const allParents = [...parents, ...invitationParents];

  function runAction(action: () => Promise<InvitationActionResult>) {
    startTransition(async () => { const result = await action(); setMessage(result.ok ? null : result.message ?? "No se pudo completar la operación."); if (result.ok) router.refresh(); });
  }

  return <section className="rounded-2xl border border-line bg-surface px-[18px] py-4"><h2 className="mb-3.5 text-[12.5px] font-extrabold uppercase tracking-[0.8px] text-[#8A7C6D]">Padres vinculados</h2>{allParents.length > 0 ? <ul className="flex flex-col gap-3.5">{allParents.map((parent, index) => { const invitation = invitations.find((item) => item.id === parent.id); return <ParentRow key={parent.id} parent={parent} index={index} onResend={invitation ? () => runAction(() => resendInvitation(invitation.id)) : undefined} onCancel={invitation ? () => runAction(() => cancelInvitation(invitation.id)) : undefined} />; })}</ul> : <p className="text-[14.5px] text-faint">Sin padres vinculados</p>}<button ref={inviteButtonRef} type="button" onClick={() => { setMessage(null); setIsModalOpen(true); }} className="mt-3 flex cursor-pointer items-center gap-3 pt-2 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"><span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]"><PlusIcon aria-hidden="true" className="h-[18px] w-[18px]" /></span><span className="text-[14.5px] font-extrabold text-brand-dark">Vincular otro padre</span></button>{message && <p role="alert" className="mt-3 text-sm font-semibold text-[#B4422D]">{message}</p>}{isPending && <p className="mt-2 text-xs text-faint">Procesando…</p>}{isModalOpen && <LinkParentModal kidId={kidId} kidName={kidName} onCreateInvitation={createInvitation} onClose={closeModal} returnFocusRef={inviteButtonRef} />}</section>;
}
