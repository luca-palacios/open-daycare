import { Suspense, type ReactNode } from "react";
import { headers } from "next/headers";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";

async function getStaffName(): Promise<string | null> {
  const requestHeaders = await headers();
  const encodedName = requestHeaders.get("x-staff-full-name");
  if (!encodedName) return null;

  try {
    return decodeURIComponent(encodedName);
  } catch {
    return null;
  }
}

function AppShellLayout({
  children,
  fullName,
}: {
  children: ReactNode;
  fullName: string | null;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas lg:h-screen lg:flex-row lg:overflow-hidden">
      <Sidebar fullName={fullName} />
      <MobileNav fullName={fullName} />
      <main className="min-w-0 flex-1 lg:h-screen lg:overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

async function AppShellWithStaffProfile({ children }: { children: ReactNode }) {
  const fullName = await getStaffName();
  return <AppShellLayout fullName={fullName}>{children}</AppShellLayout>;
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <AppShellLayout fullName={null}>
          {children}
        </AppShellLayout>
      }
    >
      <AppShellWithStaffProfile>{children}</AppShellWithStaffProfile>
    </Suspense>
  );
}
