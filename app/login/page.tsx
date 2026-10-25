import type { Metadata } from "next";
import { AuthBrandPanel } from "../_components/login/auth-brand-panel";
import { LoginForm } from "../_components/login/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión · OpenDayCare",
  description: "Ingresá para ver el día de hoy en OpenDayCare.",
};

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-auth-canvas lg:grid-cols-[1.05fr_1fr]">
      <AuthBrandPanel />
      <div className="flex items-center justify-center px-5 py-10 sm:p-10">
        <div className="w-full max-w-[392px]">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
