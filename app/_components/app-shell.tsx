import type { ReactNode } from "react";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas lg:h-screen lg:flex-row lg:overflow-hidden">
      <Sidebar />
      <MobileNav />
      <main className="min-w-0 flex-1 lg:h-screen lg:overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
