"use client";

import { useCallback, useRef, useState } from "react";
import { AddKidModal } from "./add-kid-modal";
import { PlusIcon } from "../ui/icons";

export function KidsHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  return (
    <header className="mb-[22px] flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-1 text-[12.5px] font-extrabold uppercase tracking-[0.8px] text-brand-strong">
          Gestión
        </p>
        <h1 className="font-display text-[30px] font-semibold leading-tight text-ink">
          Niños
        </h1>
      </div>

      <button
        ref={addButtonRef}
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
      >
        <PlusIcon className="h-[17px] w-[17px]" />
        Agregar niño
      </button>

      {isModalOpen && (
        <AddKidModal onClose={closeModal} returnFocusRef={addButtonRef} />
      )}
    </header>
  );
}
