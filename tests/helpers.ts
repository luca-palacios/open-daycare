import { createClient } from "@supabase/supabase-js";
import { expect, type BrowserContext, type Page, type Response } from "@playwright/test";
import e2eUsers from "./e2e-users.json";

export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
export const LOGIN_URL = `${BASE_URL}/auth/login`;
export const E2E_USERS = e2eUsers;

type LoginCredentials = {
  email: string;
  password: string;
};

export async function gotoHydrated(
  page: Page,
  url: string,
): Promise<Response | null> {
  const response = await page.goto(url);
  await page.waitForLoadState("networkidle");
  return response;
}

export async function submitLoginForm(
  page: Page,
  credentials: LoginCredentials,
): Promise<void> {
  await page.locator('form[data-hydrated="true"]').waitFor();
  const emailField = page.locator("#login-email");
  const passwordField = page.locator("#login-password");
  await emailField.fill(credentials.email);
  await expect(emailField).toHaveValue(credentials.email);
  await passwordField.fill(credentials.password);
  await expect(passwordField).toHaveValue(credentials.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

export async function loginAsStaff(page: Page): Promise<void> {
  await gotoHydrated(page, LOGIN_URL);
  await submitLoginForm(page, E2E_USERS.staff);
  await expect(page).toHaveURL(`${BASE_URL}/`);
}

export async function supabaseAuthCookies(
  context: BrowserContext,
): Promise<string[]> {
  const cookies = await context.cookies();

  return cookies
    .filter((cookie) => /^sb-.+-auth-token(?:\.\d+)?$/.test(cookie.name))
    .map((cookie) => cookie.name);
}

export function createE2EAdminClient() {
  const url = process.env.E2E_SUPABASE_URL;
  const serviceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Local Supabase E2E credentials are missing.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getE2EUserId(email: string): Promise<string> {
  const admin = createE2EAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) throw error;

  const user = data.users.find(
    (candidate) => candidate.email?.toLowerCase() === email.toLowerCase(),
  );

  if (!user) {
    throw new Error(`The local E2E user ${email} was not found.`);
  }

  return user.id;
}
