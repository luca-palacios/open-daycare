import type { Page, Response } from "@playwright/test";

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
