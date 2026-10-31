import { test, expect, type Locator, type Page } from "@playwright/test";
import { validateKidInput, type KidFormInput } from "../app/_lib/temporary-kid";
import {
  BASE_URL,
  RUN_ID,
  addKid,
  gotoHydrated,
  loginAsTestStaff,
  supabaseAuthCookies,
} from "./helpers";

const KIDS = `${BASE_URL}/kids`;
const LOGIN = `${BASE_URL}/auth/login`;
const KID_ROOMS = ["Soles", "Lunas", "Estrellas"] as const;

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await loginAsTestStaff(page);
});

function trackErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  return errors;
}

function kidCard(page: Page, name: string): Locator {
  return page.getByTestId("kid-card").filter({ hasText: name });
}

test("muestra las tres salas con su contador", async ({ page }) => {
  await gotoHydrated(page, KIDS);

  for (const room of KID_ROOMS) {
    await expect(
      page.getByRole("heading", { level: 2, name: `Sala ${room}` }),
    ).toBeVisible();
  }

  await expect(page.getByTestId("kids-count")).toHaveText(/^\d+ niños?$/);
  await expect(page.getByTestId("kids-count-lunas")).toHaveText(/^\d+ niños?$/);
  await expect(page.getByTestId("kids-count-estrellas")).toHaveText(/^\d+ niños?$/);
});

test("agrega un niño en cada sala y lo encuentra con la búsqueda", async ({
  page,
}) => {
  await gotoHydrated(page, KIDS);
  const search = page.getByRole("searchbox", { name: "Buscar niño" });

  for (const room of KID_ROOMS) {
    const name = `Niño ${room} ${RUN_ID}`;
    await addKid(page, { name, room });

    await search.fill(`${room.toLowerCase()} ${RUN_ID}`);
    await expect(kidCard(page, name)).toHaveCount(1);
    await search.fill("");
  }
});

test("la búsqueda ignora mayúsculas y acentos", async ({ page }) => {
  await gotoHydrated(page, KIDS);
  const name = `Sofía ${RUN_ID}`;
  await addKid(page, { name, room: "Soles" });

  await page
    .getByRole("searchbox", { name: "Buscar niño" })
    .fill(`SOFIA ${RUN_ID}`);
  await expect(kidCard(page, name)).toHaveCount(1);
});

test("cada tarjeta abre el perfil y vuelve al listado", async ({ page }) => {
  const name = `Perfil ${RUN_ID}`;
  await gotoHydrated(page, KIDS);
  await addKid(page, { name, room: "Lunas" });

  await kidCard(page, name).click();
  await expect(page).toHaveURL(/\/kids\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(page.getByText("Sala Lunas")).toBeVisible();
  await expect(page.getByText("Fecha de nacimiento")).toBeVisible();

  await page.getByRole("link", { name: "Volver a Niños" }).click();
  await expect(page).toHaveURL(KIDS);
});

test("muestra alergias y notas médicas por separado, tal como se escribieron", async ({
  page,
}) => {
  const name = `Alergias ${RUN_ID}`;
  await gotoHydrated(page, KIDS);
  await addKid(page, {
    name,
    room: "Estrellas",
    allergies: "Polen, Frutos secos",
    medicalNotes: "Usa inhalador después del almuerzo.",
  });

  await kidCard(page, name).click();
  await expect(page.getByText("Alergias", { exact: true })).toBeVisible();
  await expect(page.getByText("Polen, Frutos secos", { exact: true })).toBeVisible();
  await expect(page.getByText("Notas médicas", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Usa inhalador después del almuerzo.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Vincular otro padre" }),
  ).toBeDisabled();
});

test("el niño creado persiste tras recargar y tras cerrar sesión", async ({
  page,
}) => {
  const name = `Persistente ${RUN_ID}`;
  await gotoHydrated(page, KIDS);
  await addKid(page, { name, room: "Soles" });

  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(kidCard(page, name)).toHaveCount(1);

  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(LOGIN);
  await expect.poll(() => supabaseAuthCookies(page.context())).toHaveLength(0);

  await loginAsTestStaff(page);
  await gotoHydrated(page, KIDS);
  await expect(kidCard(page, name)).toHaveCount(1);
});

test("un ID inexistente o que no es UUID devuelve 404", async ({ page }) => {
  const missing = await gotoHydrated(page, `${KIDS}/00000000-0000-4000-8000-000000000000`);
  expect(missing?.status()).toBe(404);

  const invalid = await gotoHydrated(page, `${KIDS}/no-existe`);
  expect(invalid?.status()).toBe(404);
});

test("el modal abre sin cambiar la URL y se cierra con Cancelar o Esc", async ({
  page,
}) => {
  await gotoHydrated(page, KIDS);

  const addButton = page.getByRole("button", { name: "Agregar niño" }).first();
  await addButton.click();

  const dialog = page.getByRole("dialog", { name: "Agregar niño" });
  await expect(page).toHaveURL(KIDS);
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel("Nombre completo")).toBeFocused();

  await page.mouse.click(1, 1);
  await expect(dialog).toBeVisible();

  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(addButton).toBeFocused();

  await addButton.click();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(addButton).toBeFocused();
});

test("un formulario vacío anuncia errores y enfoca el primer campo inválido", async ({
  page,
}) => {
  await gotoHydrated(page, KIDS);
  await page.getByRole("button", { name: "Agregar niño" }).first().click();
  await page.getByRole("button", { name: "Guardar" }).click();

  const name = page.getByLabel("Nombre completo");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveCount(3);
  await expect(page.getByText("Ingresá el nombre del niño.")).toBeVisible();
  await expect(page.getByText("Ingresá la fecha de nacimiento.")).toBeVisible();
  await expect(page.getByText("Seleccioná una sala.")).toBeVisible();
});

test("rechaza fechas imposibles y futuras", async ({ page }) => {
  const validInput: KidFormInput = {
    name: "Valeria Luna",
    birthDate: "2024-02-29",
    room: "Lunas",
    allergies: "",
    medicalNotes: "",
  };
  const fixedNow = new Date("2026-10-25T15:00:00.000Z");

  expect(
    validateKidInput({ ...validInput, birthDate: "2024-02-30" }, fixedNow)
      .birthDate,
  ).toBe("Ingresá una fecha válida.");
  expect(
    validateKidInput({ ...validInput, birthDate: "2026-10-26" }, fixedNow)
      .birthDate,
  ).toBe("La fecha no puede ser posterior a hoy.");

  await gotoHydrated(page, KIDS);
  await page.getByRole("button", { name: "Agregar niño" }).first().click();
  await page.getByLabel("Nombre completo").fill(validInput.name);
  await page.getByLabel("Fecha de nacimiento").fill("2099-12-31");
  await page.getByLabel("Sala", { exact: true }).selectOption({ label: "Lunas" });
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByText("La fecha no puede ser posterior a hoy."),
  ).toBeVisible();
  await expect(page.getByLabel("Fecha de nacimiento")).toBeFocused();
});

test("un error al guardar conserva el formulario y no muestra el niño", async ({
  page,
}) => {
  const name = `Fallida ${RUN_ID}`;
  await gotoHydrated(page, KIDS);
  await page.getByRole("button", { name: "Agregar niño" }).first().click();

  const dialog = page.getByRole("dialog", { name: "Agregar niño" });
  await dialog.getByLabel("Nombre completo").fill(name);
  await dialog.getByLabel("Fecha de nacimiento").fill("2024-01-15");
  await dialog.getByLabel("Sala", { exact: true }).selectOption({ label: "Soles" });

  await page.route("**/rest/v1/children**", (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue(),
  );
  await dialog.getByRole("button", { name: "Guardar" }).click();

  await expect(dialog.getByRole("alert")).toHaveText(
    "No pudimos guardar al niño. Revisá los datos e intentá de nuevo.",
  );
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Nombre completo")).toHaveValue(name);
  await expect(kidCard(page, name)).toHaveCount(0);

  await page.unroute("**/rest/v1/children**");
});

test("no registra errores de consola ni de hidratación", async ({ page }) => {
  const errors = trackErrors(page);

  await gotoHydrated(page, KIDS);
  await page.waitForTimeout(500);

  const firstCard = page.getByTestId("kid-card").first();
  if (await firstCard.count()) {
    await firstCard.click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  await page.waitForTimeout(500);

  expect(errors).toEqual([]);
});

test("no desborda horizontalmente en 375, 768 y 1280 px", async ({ page }) => {
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });

    await gotoHydrated(page, KIDS);
    const listOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(listOverflow, `listado a ${width}px`).toBeLessThanOrEqual(0);

    await page.getByRole("button", { name: "Agregar niño" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const bounds = await dialog.boundingBox();
    const modalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );

    expect(bounds?.x, `margen izquierdo a ${width}px`).toBeGreaterThanOrEqual(0);
    expect(
      (bounds?.x ?? 0) + (bounds?.width ?? 0),
      `margen derecho a ${width}px`,
    ).toBeLessThanOrEqual(width);
    expect(modalOverflow, `modal a ${width}px`).toBeLessThanOrEqual(0);

    await page.getByRole("button", { name: "Cancelar" }).click();
  }
});
