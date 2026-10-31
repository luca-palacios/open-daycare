import { createClient } from "@supabase/supabase-js";
import { test, expect } from "@playwright/test";
import {
  BASE_URL,
  E2E_USERS,
  LOGIN_URL,
  createE2EAdminClient,
  getE2EUserId,
  gotoHydrated,
  loginAsStaff,
  submitLoginForm,
  supabaseAuthCookies,
} from "./helpers";

const HOME = `${BASE_URL}/`;
const KIDS = `${BASE_URL}/kids`;
const MATEO_PROFILE = `${KIDS}/mateo-fernandez`;
const ACTIVATE = `${BASE_URL}/auth/activate-account`;

test("staff active inicia sesión y el menú usa el perfil real", async ({ page }) => {
  await loginAsStaff(page);

  await expect(page.getByText("E2E Staff", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("ES", { exact: true }).first()).toBeVisible();
  expect(await supabaseAuthCookies(page.context())).not.toHaveLength(0);
  expect(
    (await page.context().cookies()).some(
      (cookie) => cookie.name === "odc-demo-session",
    ),
  ).toBe(false);
});

test("muestra errores accesibles para campos vacíos y credenciales incorrectas", async ({
  page,
}) => {
  await gotoHydrated(page, LOGIN_URL);
  await page.locator('form[data-hydrated="true"]').waitFor();
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "Ingresá tu email." })).toBeVisible();
  await expect(
    page.getByRole("alert").filter({ hasText: "Ingresá tu contraseña." }),
  ).toBeVisible();

  await submitLoginForm(page, {
    email: E2E_USERS.staff.email,
    password: "wrong-password",
  });

  await expect(
    page.getByRole("alert").filter({
      hasText: "El email o la contraseña no son correctos.",
    }),
  ).toBeVisible();
  await expect(page).toHaveURL(LOGIN_URL);
  expect(await supabaseAuthCookies(page.context())).toHaveLength(0);
});

test("la cookie demo sola no abre rutas protegidas", async ({ page }) => {
  await page.context().addCookies([
    { name: "odc-demo-session", value: "demo", url: BASE_URL },
  ]);

  for (const route of [HOME, KIDS, MATEO_PROFILE]) {
    await gotoHydrated(page, route);
    await expect(page).toHaveURL(LOGIN_URL);
    await expect(
      page.getByRole("heading", { name: "Iniciar sesión" }),
    ).toBeVisible();
  }
});

const unauthorizedUsers = [
  ["cuenta pendiente", E2E_USERS.pendingStaff],
  ["perfil de padre aunque el metadata indique staff", E2E_USERS.parentWithStaffMetadata],
  ["cuenta sin perfil", E2E_USERS.missingProfile],
] as const;

for (const [description, user] of unauthorizedUsers) {
  test(`deniega el acceso a ${description} y cierra la sesión`, async ({ page }) => {
    await gotoHydrated(page, LOGIN_URL);
    await submitLoginForm(page, user);

    await expect(
      page.getByRole("alert").filter({
        hasText: "Tu cuenta no tiene acceso al área de personal.",
      }),
    ).toBeVisible();
    await expect(page).toHaveURL(LOGIN_URL);
    await expect.poll(() => supabaseAuthCookies(page.context())).toHaveLength(0);
  });
}

const changedProfiles = [
  ["rol", E2E_USERS.revokedRole, { role: "parent" }],
  ["estado", E2E_USERS.revokedStatus, { status: "pending" }],
] as const;

for (const [field, user, changes] of changedProfiles) {
  test(`vuelve a validar el ${field} al abrir una ruta protegida`, async ({
    page,
  }) => {
    await gotoHydrated(page, LOGIN_URL);
    await submitLoginForm(page, user);
    await expect(page).toHaveURL(HOME);

    const userId = await getE2EUserId(user.email);
    const admin = createE2EAdminClient();

    try {
      const { error } = await admin
        .from("users")
        .update(changes)
        .eq("id", userId);
      expect(error).toBeNull();

      await gotoHydrated(page, KIDS);
      await expect(page).toHaveURL(LOGIN_URL);
    } finally {
      const { error } = await admin
        .from("users")
        .update({ role: "staff", status: "active" })
        .eq("id", userId);
      if (error) throw error;
    }
  });
}

test("bloquea una sesión cuando se elimina el perfil", async ({ page }) => {
  await gotoHydrated(page, LOGIN_URL);
  await submitLoginForm(page, E2E_USERS.revokedProfile);
  await expect(page).toHaveURL(HOME);

  const revokedProfileId = await getE2EUserId(E2E_USERS.revokedProfile.email);
  const admin = createE2EAdminClient();
  let profileDeleted = false;

  try {
    const { error } = await admin
      .from("users")
      .delete()
      .eq("id", revokedProfileId);
    if (error) throw error;
    profileDeleted = true;

    await gotoHydrated(page, KIDS);
    await expect(page).toHaveURL(LOGIN_URL);
  } finally {
    if (profileDeleted) {
      const { error } = await admin.from("users").insert({
        id: revokedProfileId,
        daycare_id: "8f0e5c6a-1b2d-4c3e-9a10-2d3e4f5a6b70",
        role: "staff",
        status: "active",
        full_name: E2E_USERS.revokedProfile.fullName,
      });
      if (error) throw error;
    }
  }
});

test("RLS permite leer solo el perfil propio y deniega escritura", async () => {
  const url = process.env.E2E_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error("Local Supabase E2E client configuration is missing.");
  }

  const client = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error: signInError } = await client.auth.signInWithPassword(
    E2E_USERS.staff,
  );
  expect(signInError).toBeNull();
  expect(data.user).not.toBeNull();

  const userId = data.user!.id;
  const { data: ownProfile, error: ownProfileError } = await client
    .from("users")
    .select("id, role, status")
    .eq("id", userId)
    .maybeSingle();
  expect(ownProfileError).toBeNull();
  expect(ownProfile).toMatchObject({ id: userId, role: "staff", status: "active" });

  const { data: otherProfiles, error: otherProfilesError } = await client
    .from("users")
    .select("id")
    .neq("id", userId);
  expect(otherProfilesError).toBeNull();
  expect(otherProfiles).toEqual([]);

  const { data: changedProfilesData, error: updateError } = await client
    .from("users")
    .update({ full_name: "Unauthorized update" })
    .eq("id", userId)
    .select("id");
  expect(updateError).not.toBeNull();
  expect(changedProfilesData).toBeNull();

  await client.auth.signOut({ scope: "local" });
});

test.describe("activación de cuenta", () => {
  test("mantiene la invitación, deshabilita controles y no crea sesión al manipular el formulario", async ({
    page,
  }) => {
    await gotoHydrated(page, ACTIVATE);

    await expect(page.getByRole("status")).toContainText(
      "La activación de cuentas todavía no está disponible.",
    );
    await expect(page.getByLabel("CÓDIGO DE INVITACIÓN")).toHaveValue("7K4P9");
    await expect(page.getByLabel("EMAIL")).toHaveValue("lucia.fernandez@gmail.com");
    await expect(page.getByLabel("CÓDIGO DE INVITACIÓN")).toBeDisabled();
    await expect(page.getByLabel("EMAIL")).toBeDisabled();
    await expect(page.getByLabel("CREAR CONTRASEÑA")).toBeDisabled();
    await expect(page.getByRole("checkbox")).toBeDisabled();
    await expect(page.getByRole("button", { name: "Activación no disponible" })).toBeDisabled();

    const form = page.locator("form");
    await form.evaluate((element: HTMLFormElement) => element.requestSubmit());
    await expect(page).toHaveURL(ACTIVATE);
    expect(await supabaseAuthCookies(page.context())).toHaveLength(0);

    await page.locator("#activation-code").evaluate((element) => {
      element.removeAttribute("disabled");
    });
    await page.locator("#activation-password").evaluate((element) => {
      element.removeAttribute("disabled");
    });
    await page.getByLabel("CREAR CONTRASEÑA").fill("E2EActivationPass123!");
    await page.getByRole("button", { name: "Activación no disponible" }).evaluate((element) => {
      element.removeAttribute("disabled");
    });
    await form.evaluate((element: HTMLFormElement) => element.requestSubmit());

    await expect(page).toHaveURL(ACTIVATE);
    expect(await supabaseAuthCookies(page.context())).toHaveLength(0);
    await page.getByRole("link", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL(LOGIN_URL);
  });
});

test("los enlaces de login y activación se conservan", async ({ page }) => {
  await gotoHydrated(page, LOGIN_URL);
  await page.getByRole("link", { name: "Activá tu cuenta" }).click();
  await expect(page).toHaveURL(ACTIVATE);
  await page.getByRole("link", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(LOGIN_URL);
});
