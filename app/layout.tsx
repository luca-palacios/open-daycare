import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { TemporaryPostsProvider } from "./_components/feed/temporary-posts-provider";
import { TemporaryKidsProvider } from "./_components/kids/temporary-kids-provider";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "OpenDayCare · Estrellitas",
  description:
    "Feed de la guardería Estrellitas: logros, actividades y avisos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${nunito.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TemporaryKidsProvider>
          <TemporaryPostsProvider>
            {children}
          </TemporaryPostsProvider>
        </TemporaryKidsProvider>
      </body>
    </html>
  );
}
