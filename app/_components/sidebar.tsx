import { Brand, NavMenu, NewPostButton, UserSummary } from "./nav-menu";

export function Sidebar() {
  return (
    <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[248px] lg:flex-none lg:flex-col lg:border-r lg:border-line lg:bg-surface lg:px-4 lg:py-6">
      <Brand className="px-2 pb-[22px] pt-1" />
      <NewPostButton className="mb-[18px]" />
      <NavMenu />
      <UserSummary className="mt-2.5" />
    </aside>
  );
}
