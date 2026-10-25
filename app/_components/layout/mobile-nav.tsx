"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon } from "../ui/icons";
import { Brand, NavMenu, NewPostButton, UserSummary } from "./nav-menu";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => {
      if (desktop.matches) setOpen(false);
    };

    desktop.addEventListener("change", handleChange);
    return () => desktop.removeEventListener("change", handleChange);
  }, []);

  return (
    <div className="sticky top-0 z-30 bg-surface lg:hidden">
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <Brand className="min-w-0 flex-1" />
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen((current) => !current)}
          className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-canvas text-ink"
        >
          {open ? (
            <CloseIcon className="h-5 w-5" />
          ) : (
            <MenuIcon className="h-5 w-5" />
          )}
        </button>
      </header>

      <div
        id="mobile-nav"
        hidden={!open}
        className="border-b border-line px-4 pb-4 pt-3"
      >
        <NewPostButton className="mb-3" />
        <NavMenu onNavigate={() => setOpen(false)} />
        <UserSummary className="mt-3" />
      </div>
    </div>
  );
}
