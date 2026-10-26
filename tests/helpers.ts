import type { BrowserContext, Page, Response } from "@playwright/test";

export const BASE_URL = "http://localhost:3000";
export const DEMO_SESSION_COOKIE = "odc-demo-session";

/**
 * Siembra la cookie demo para entrar a las rutas protegidas sin pasar por el login.
 */
export async function seedDemoSession(context: BrowserContext): Promise<void> {
  await context.addCookies([
    { name: DEMO_SESSION_COOKIE, value: "demo", url: BASE_URL },
  ]);
}

/**
 * Navega y espera a que React hidrate.
 * Evita perder eventos cuando se interactúa apenas carga la página.
 */
export async function gotoHydrated(
  page: Page,
  url: string,
): Promise<Response | null> {
  const response = await page.goto(url);
  await page.waitForLoadState("networkidle");
  return response;
}
