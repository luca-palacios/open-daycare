"use client";

import { useCallback, useRef, useState } from "react";
import type { Tables } from "../../../utils/supabase/database.types";
import { AddKidModal } from "./add-kid-modal";
import { KidsDirectory } from "./kids-directory";
import { KidsHeader } from "./kids-header";

type Room = Pick<Tables<"rooms">, "id" | "name">;
type Child = Pick<
  Tables<"children">,
  "id" | "room_id" | "full_name" | "birth_date" | "allergy_tags"
>;
type KidsWorkspaceProps = {
  rooms: Room[];
  kids: Child[];
  loadError: boolean;
};

export function KidsWorkspace({
  rooms,
  kids,
  loadError,
}: KidsWorkspaceProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const openAddKidModal = useCallback((trigger: HTMLButtonElement) => {
    returnFocusRef.current = trigger;
    setIsModalOpen(true);
  }, []);
  const closeAddKidModal = useCallback(() => setIsModalOpen(false), []);

  return (
    <>
      <KidsHeader
        canAddKid={!loadError && rooms.length > 0}
        onAddKid={openAddKidModal}
      />
      <KidsDirectory
        rooms={rooms}
        kids={kids}
        loadError={loadError}
        onAddKid={openAddKidModal}
      />
      {isModalOpen && (
        <AddKidModal
          onClose={closeAddKidModal}
          returnFocusRef={returnFocusRef}
          rooms={rooms}
        />
      )}
    </>
  );
}
