"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useRef, useState, type ComponentType } from "react";
import { BellIcon, ChildrenIcon, HomeIcon, LogoutIcon, PlusIcon, SunLogo, UserIcon } from "../ui/icons";
import type { IconProps } from "../ui/icons";
import { room, teacher } from "../../_data/mock";
import { createClient } from "../../../utils/supabase/client";
import { useTemporaryKids } from "../kids/temporary-kids-provider";
import { CreatePostModal } from "../feed/create-post-modal";
import { useTemporaryPosts } from "../feed/temporary-posts-provider";

type NavItem = {
  label: string;
  icon: ComponentType<IconProps>;
  href?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Feed", icon: HomeIcon, href: "/" },
  { label: "Niños", icon: ChildrenIcon, href: "/kids" },
  { label: "Avisos", icon: BellIcon },
  { label: "Mi cuenta", icon: UserIcon },
];

function isActiveSection(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const navItemBase =
  "flex w-full items-center gap-3 rounded-xl px-3 py-[11px] text-left text-[14.5px] transition-colors";
const navItemActive = `${navItemBase} bg-[#FBE3D8] font-extrabold text-brand-strong`;
const navItemIdle = `${navItemBase} font-semibold text-[#6E6359] hover:bg-canvas`;

export function Brand({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-[11px] ${className}`}>
      <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] text-white">
        <SunLogo className="h-[21px] w-[21px]" />
      </span>
      <span>
        <span className="block font-display text-[17px] font-semibold leading-none text-ink">
          OpenDayCare
        </span>
        <span className="mt-0.5 block text-[11.5px] text-faint">
          {room.name}
        </span>
      </span>
    </Link>
  );
}

type NewPostButtonProps = {
  className?: string;
  onModalOpen?: () => void;
  onModalCancel?: () => void;
};

export function NewPostButton({
  className = "",
  onModalOpen,
  onModalCancel,
}: NewPostButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleCancel = useCallback(() => {
    onModalCancel?.();
    setModalOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }, [onModalCancel]);

  const handlePublished = useCallback(() => {
    setModalOpen(false);
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          onModalOpen?.();
          setModalOpen(true);
        }}
        className={`flex w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] p-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)] ${className}`}
      >
        <PlusIcon className="h-[17px] w-[17px]" />
        Nueva publicación
      </button>

      {modalOpen && (
        <CreatePostModal
          onCancel={handleCancel}
          onPublished={handlePublished}
        />
      )}
    </>
  );
}

export function NavMenu({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
        if (href) {
          const active = isActiveSection(href, pathname);

          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={active ? navItemActive : navItemIdle}
            >
              <Icon className="h-[19px] w-[19px]" />
              {label}
            </Link>
          );
        }

        return (
          <button key={label} type="button" className={navItemIdle}>
            <Icon className="h-[19px] w-[19px]" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}

function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0].toUpperCase())
    .join("");
}

export function UserSummary({
  className = "",
  fullName,
}: {
  className?: string;
  fullName: string | null;
}) {
  const router = useRouter();
  const { clearTemporaryKids } = useTemporaryKids();
  const { clearTemporaryPosts } = useTemporaryPosts();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const displayName = fullName?.trim() || "Personal";

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    clearTemporaryKids();
    clearTemporaryPosts();

    await createClient().auth.signOut({ scope: "local" }).catch(() => undefined);
    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <div className={`border-t border-line pt-3.5 ${className}`}>
      <div className="flex items-center gap-[11px] px-2 py-1.5">
        <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-[#F2937A] font-display text-base font-semibold text-white">
          {getInitials(displayName)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-extrabold text-ink">
            {displayName}
          </span>
          <span className="block text-xs text-faint">{teacher.role}</span>
        </span>
        <button
          type="button"
          title="Salir"
          aria-label="Salir"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-[10px] bg-canvas text-muted transition-colors hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-auth-focus disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogoutIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
