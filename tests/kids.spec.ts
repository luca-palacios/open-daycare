import { test, expect, type Locator, type Page } from "@playwright/test";
import { kids } from "../app/_data/kids";
import { validateKidInput, type KidFormInput } from "../app/_lib/temporary-kid";
import {
  BASE_URL,
  gotoHydrated,
  loginAsStaff,
  supabaseAuthCookies,
} from "./helpers";

const BASE = BASE_URL;
const KIDS = `${BASE}/kids`;
const LOGIN = `${BASE}/auth/login`;
const MATEO_PROFILE = `${KIDS}/mateo-fernandez`;

test.beforeEach(async ({ page }) => {
  await loginAsStaff(page);
});

const KID_NAMES = kids.map((kid) => kid.name);

function trackErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  return errors;
}

function ageInArgentina(birthDate: string, now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
  const todayYear = value("year");
  const todayMonth = value("month");
  const todayDay = value("day");
  const birthdayPassed =
    todayMonth > birthMonth ||
    (todayMonth === birthMonth && todayDay >= birthDay);

  return todayYear - birthYear - (birthdayPassed ? 0 : 1);
}

type NewKidInput = {
  name: string;
  room?: "Soles" | "Lunas";
  birthDate?: string;
  allergies?: string;
  medicalNotes?: string;
};

async function addTemporaryKid(page: Page, input: NewKidInput): Promise<void> {
  await page.getByRole("button", { name: "Agregar niño" }).click();
  await page.getByLabel("Nombre completo").fill(input.name);
  await page
    .getByLabel("Fecha de nacimiento")
    .fill(input.birthDate ?? "2024-01-15");
  await page.getByLabel("Sala", { exact: true }).selectOption(input.room ?? "Lunas");

  if (input.allergies) {
    await page.getByLabel(/Alergias/).fill(input.allergies);
  }

  if (input.medicalNotes) {
    await page.getByLabel(/Notas médicas/).fill(input.medicalNotes);
  }

  await page.getByRole("button", { name: "Guardar" }).click();
}

async function fillParentInvitation(
  dialog: Locator,
  input: { name: string; email: string; relationship?: string },
): Promise<void> {
  await dialog.getByLabel("Nombre del padre o madre").fill(input.name);
  await dialog.getByLabel("Email").fill(input.email);

  if (input.relationship) {
    await dialog.getByRole("button", { name: input.relationship }).click();
  }
}

function parentsPanel(page: Page): Locator {
  return page.locator("section").filter({
    has: page.getByRole("heading", { name: "Padres vinculados" }),
  });
}

test("muestra los ocho niños y un contador de ocho", async ({ page }) => {
  await gotoHydrated(page, KIDS);

  await expect(
    page.getByRole("heading", { level: 1, name: "Niños" }),
  ).toBeVisible();
  await expect(page.getByTestId("kid-card")).toHaveCount(kids.length);
  await expect(page.getByTestId("kids-count")).toHaveText(`${kids.length} niños`);
  await expect(page.getByTestId("kids-count-lunas")).toHaveText("0 niños");

  for (const kid of kids) {
    const card = page.getByTestId("kid-card").filter({ hasText: kid.name });
    await expect(card).toBeVisible();
    await expect(card).toContainText(`${ageInArgentina(kid.birthDate)} años`);
  }

  expect(KID_NAMES).toHaveLength(8);
});

test("la home muestra ocho niños y conserva el feed", async ({ page }) => {
  await gotoHydrated(page, `${BASE}/`);

  await expect(page.getByText(/8 niños\s*·/)).toBeVisible();
  await expect(page.locator("article")).toHaveCount(3);
});

test("busca en vivo sin distinguir mayúsculas ni acentos", async ({ page }) => {
  await gotoHydrated(page, KIDS);

  const search = page.getByRole("searchbox", { name: "Buscar niño" });

  await search.fill("SOFÍA");
  await expect(page.getByTestId("kid-card")).toHaveCount(1);
  await expect(page.getByTestId("kids-count")).toHaveText("1 niño");
  await expect(page.getByTestId("kid-card")).toContainText("Sofía Méndez");

  await search.fill("mendez");
  await expect(page.getByTestId("kid-card")).toHaveCount(1);
  await expect(page.getByTestId("kid-card")).toContainText("Sofía Méndez");

  await search.fill("");
  await expect(page.getByTestId("kid-card")).toHaveCount(kids.length);

  await search.fill("zzz");
  await expect(page.getByTestId("kid-card")).toHaveCount(0);
  await expect(page.getByTestId("kids-count")).toHaveText("0 niños");
  await expect(page.getByTestId("kids-empty")).toBeVisible();
});

test("cada tarjeta abre el perfil del niño y vuelve al listado", async ({
  page,
}) => {
  await gotoHydrated(page, KIDS);

  for (const kid of kids) {
    await page.getByTestId("kid-card").filter({ hasText: kid.name }).click();

    await expect(page).toHaveURL(`${KIDS}/${kid.id}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(kid.name);
    await expect(
      page.getByText(
        `${ageInArgentina(kid.birthDate)} años · Sala ${kid.room}`,
      ),
    ).toBeVisible();

    await page.getByRole("link", { name: "Volver a Niños" }).click();
    await expect(page).toHaveURL(KIDS);
    await expect(page.getByTestId("kid-card")).toHaveCount(kids.length);
  }
});

test("el modal abre sin cambiar la URL, ignora el fondo y cierra con Cancelar o Esc", async ({
  page,
}) => {
  await gotoHydrated(page, KIDS);

  const addButton = page.getByRole("button", { name: "Agregar niño" });
  await addButton.hover();
  await expect(addButton).toHaveCSS("cursor", "pointer");
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
  await page.getByRole("button", { name: "Agregar niño" }).click();
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
  await page.getByRole("button", { name: "Agregar niño" }).click();
  await page.getByLabel("Nombre completo").fill(validInput.name);
  await page.getByLabel("Fecha de nacimiento").fill("2099-12-31");
  await page.getByLabel("Sala", { exact: true }).selectOption(validInput.room);
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByText("La fecha no puede ser posterior a hoy."),
  ).toBeVisible();
  await expect(page.getByLabel("Fecha de nacimiento")).toBeFocused();
});

test("el modal de vinculación abre, reinicia los campos y cierra con X o Esc", async ({
  page,
}) => {
  await gotoHydrated(page, MATEO_PROFILE);

  const inviteButton = page.getByRole("button", {
    name: "Vincular otro padre",
  });
  await inviteButton.click();

  const dialog = page.getByRole("dialog", { name: "Vincular padre" });
  const name = dialog.getByLabel("Nombre del padre o madre");
  const email = dialog.getByLabel("Email");
  const code = dialog.locator("[aria-label^='Código de demostración']");
  const firstCode = (await code.textContent())?.trim();

  await expect(page).toHaveURL(MATEO_PROFILE);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("a Mateo Fernández")).toBeVisible();
  await expect(name).toHaveValue("");
  await expect(email).toHaveValue("");
  await expect(name).toBeFocused();
  await expect(dialog.getByRole("button", { name: "Mamá" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(firstCode).toMatch(/^[A-Z0-9]{5}$/);

  await page.mouse.click(1, 1);
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Cerrar ventana" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(inviteButton).toBeFocused();

  await inviteButton.click();
  const reopenedDialog = page.getByRole("dialog", { name: "Vincular padre" });
  const secondCode = await reopenedDialog
    .locator("[aria-label^='Código de demostración']")
    .textContent();

  await expect(reopenedDialog.getByLabel("Nombre del padre o madre")).toHaveValue("");
  await expect(reopenedDialog.getByLabel("Email")).toHaveValue("");
  await expect(
    reopenedDialog.getByRole("button", { name: "Mamá" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(secondCode?.trim()).toMatch(/^[A-Z0-9]{5}$/);
  expect(secondCode?.trim()).not.toBe(firstCode);

  await page.keyboard.press("Escape");
  await expect(reopenedDialog).toHaveCount(0);
  await expect(inviteButton).toBeFocused();
});

test("valida nombre y email con errores asociados a sus campos", async ({
  page,
}) => {
  await gotoHydrated(page, MATEO_PROFILE);
  await page.getByRole("button", { name: "Vincular otro padre" }).click();

  const dialog = page.getByRole("dialog", { name: "Vincular padre" });
  const name = dialog.getByLabel("Nombre del padre o madre");
  const email = dialog.getByLabel("Email");
  const submitButton = dialog.getByRole("button", { name: "Crear invitación" });

  await submitButton.click();
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toHaveAttribute("aria-describedby", "parent-name-error");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAttribute("aria-describedby", "parent-email-error");
  await expect(dialog.getByText("Ingresá el nombre del padre.")).toBeVisible();
  await expect(dialog.getByText("Ingresá tu email.")).toBeVisible();

  await name.fill("Ana Pérez");
  await email.fill("email-inválido");
  await submitButton.click();

  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAttribute("aria-describedby", "parent-email-error");
  await expect(dialog.getByText("Ingresá un email válido.")).toBeVisible();
});

test("rechaza email duplicado en el mismo niño y permite usarlo en otro", async ({
  page,
}) => {
  await gotoHydrated(page, MATEO_PROFILE);
  await page.getByRole("button", { name: "Vincular otro padre" }).click();

  let dialog = page.getByRole("dialog", { name: "Vincular padre" });
  await fillParentInvitation(dialog, {
    name: "Alex Pérez",
    email: "alex@example.com",
  });
  await dialog.getByRole("button", { name: "Crear invitación" }).click();

  await page.getByRole("button", { name: "Vincular otro padre" }).click();
  dialog = page.getByRole("dialog", { name: "Vincular padre" });
  await fillParentInvitation(dialog, {
    name: "Otra persona",
    email: "  ALEX@EXAMPLE.COM  ",
  });
  await dialog.getByRole("button", { name: "Crear invitación" }).click();

  const duplicateEmail = dialog.getByLabel("Email");
  await expect(duplicateEmail).toBeFocused();
  await expect(duplicateEmail).toHaveAttribute("aria-invalid", "true");
  await expect(
    dialog.getByText("Ya existe una invitación para este email."),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Cerrar ventana" }).click();

  await page.getByRole("link", { name: "Volver a Niños" }).click();
  await page.getByTestId("kid-card").filter({ hasText: "Sofía Méndez" }).click();
  await page.getByRole("button", { name: "Vincular otro padre" }).click();

  dialog = page.getByRole("dialog", { name: "Vincular padre" });
  await fillParentInvitation(dialog, {
    name: "Alex Pérez",
    email: "alex@example.com",
  });
  await dialog.getByRole("button", { name: "Crear invitación" }).click();

  const sofiaParents = parentsPanel(page);
  await expect(sofiaParents.getByText("Alex Pérez")).toBeVisible();
  await expect(sofiaParents).toContainText("Mamá · pendiente");
});

test("la invitación queda pendiente durante la navegación y se pierde al recargar", async ({
  page,
}) => {
  await gotoHydrated(page, MATEO_PROFILE);
  await page.getByRole("button", { name: "Vincular otro padre" }).click();

  const dialog = page.getByRole("dialog", { name: "Vincular padre" });
  const code = (
    await dialog
      .locator("[aria-label^='Código de demostración']")
      .textContent()
  )?.trim();
  await fillParentInvitation(dialog, {
    name: "María Demo",
    email: "maria@example.com",
    relationship: "Papá",
  });
  await dialog.getByRole("button", { name: "Crear invitación" }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  const mateoParents = parentsPanel(page);
  const invitationRow = mateoParents.getByRole("listitem").filter({
    hasText: "María Demo",
  });
  await expect(invitationRow).toContainText("Papá · pendiente");
  await expect(invitationRow).toContainText("PENDIENTE");
  await expect(invitationRow).not.toContainText("enviada");

  await page.getByRole("button", { name: "Vincular otro padre" }).click();
  const reopenedDialog = page.getByRole("dialog", { name: "Vincular padre" });
  const reopenedCode = (
    await reopenedDialog
      .locator("[aria-label^='Código de demostración']")
      .textContent()
  )?.trim();
  await expect(reopenedDialog.getByLabel("Nombre del padre o madre")).toHaveValue("");
  await expect(reopenedDialog.getByLabel("Email")).toHaveValue("");
  expect(reopenedCode).not.toBe(code);
  await reopenedDialog.getByRole("button", { name: "Cerrar ventana" }).click();

  await page.getByRole("link", { name: "Volver a Niños" }).click();
  await page.getByTestId("kid-card").filter({ hasText: "Mateo Fernández" }).click();
  await expect(parentsPanel(page).getByText("María Demo")).toBeVisible();

  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(parentsPanel(page).getByText("María Demo")).toHaveCount(0);
});

test("agrega a Lunas, busca en ambas salas, muestra el perfil temporal y actualiza el feed", async ({
  page,
}) => {
  await gotoHydrated(page, KIDS);
  await addTemporaryKid(page, {
    name: "Valeria Luna",
    room: "Lunas",
    allergies: "Maní, , Lactosa ",
    medicalNotes: "Usa inhalador después del almuerzo.",
  });

  await expect(page.getByTestId("kids-count")).toHaveText("8 niños");
  await expect(page.getByTestId("kids-count-lunas")).toHaveText("1 niño");

  const search = page.getByRole("searchbox", { name: "Buscar niño" });
  await search.fill("valeria luna");
  await expect(page.getByTestId("kid-card")).toHaveCount(1);
  await expect(page.getByTestId("kid-card")).toContainText("Valeria Luna");
  await search.fill("");

  await page
    .getByRole("button", { name: "Ver perfil de Valeria Luna" })
    .click();
  await expect(page).toHaveURL(KIDS);
  await expect(
    page.getByRole("heading", { level: 1, name: "Valeria Luna" }),
  ).toBeVisible();
  await expect(page.getByText("Maní, Lactosa", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Usa inhalador después del almuerzo.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Editar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Resumen del día" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Padres vinculados" }),
  ).toBeVisible();
  await expect(page.getByText("Sin padres vinculados")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Vincular otro padre" }),
  ).toBeDisabled();

  await page.getByRole("button", { name: "Volver a Niños" }).click();
  await page.getByRole("link", { name: "Feed", exact: true }).click();
  await expect(page).toHaveURL(`${BASE}/`);
  await expect(page.getByText(/9 niños\s*·/)).toBeVisible();
});

test("recargar descarta las altas y restaura los contadores mock", async ({
  page,
}) => {
  await gotoHydrated(page, KIDS);
  await addTemporaryKid(page, { name: "Valeria Luna", room: "Lunas" });
  await expect(page.getByTestId("kids-count-lunas")).toHaveText("1 niño");

  await page.reload();
  await page.waitForLoadState("networkidle");

  await expect(page.getByTestId("kids-count")).toHaveText("8 niños");
  await expect(page.getByTestId("kids-count-lunas")).toHaveText("0 niños");
  await expect(page.getByTestId("kid-card")).toHaveCount(kids.length);
  await page.getByRole("link", { name: "Feed", exact: true }).click();
  await expect(page.getByText(/8 niños\s*·/)).toBeVisible();
});

test("Salir elimina las altas temporales antes de volver a iniciar sesión", async ({
  page,
}) => {
  await gotoHydrated(page, KIDS);
  await page.getByTestId("kid-card").filter({ hasText: "Mateo Fernández" }).click();
  await page.getByRole("button", { name: "Vincular otro padre" }).click();
  const dialog = page.getByRole("dialog", { name: "Vincular padre" });
  await fillParentInvitation(dialog, {
    name: "Padre de sesión",
    email: "session@example.com",
  });
  await dialog.getByRole("button", { name: "Crear invitación" }).click();
  await page.getByRole("link", { name: "Volver a Niños" }).click();

  await addTemporaryKid(page, { name: "Valeria Luna", room: "Lunas" });
  const logoutButton = page.getByRole("button", { name: "Salir" });
  await logoutButton.hover();
  await expect(logoutButton).toHaveCSS("cursor", "pointer");
  await logoutButton.click();
  await expect(page).toHaveURL(LOGIN);
  await expect.poll(() => supabaseAuthCookies(page.context())).toHaveLength(0);

  await loginAsStaff(page);
  await expect(page.getByText(/8 niños\s*·/)).toBeVisible();

  await page.getByRole("link", { name: "Niños", exact: true }).click();
  await expect(page.getByTestId("kids-count")).toHaveText("8 niños");
  await expect(page.getByTestId("kids-count-lunas")).toHaveText("0 niños");
  await page.getByTestId("kid-card").filter({ hasText: "Mateo Fernández" }).click();
  await expect(parentsPanel(page).getByText("Padre de sesión")).toHaveCount(0);
});

test("Mateo muestra su alerta y sus dos padres con estados", async ({
  page,
}) => {
  await gotoHydrated(page, `${KIDS}/mateo-fernandez`);

  await expect(page.getByText("Alergias y notas")).toBeVisible();
  await expect(page.getByText(/Alergia al maní/)).toBeVisible();

  const parents = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Padres vinculados" }),
  });

  await expect(parents).toContainText("Lucía Fernández");
  await expect(parents).toContainText("Diego Fernández");
  await expect(parents).toContainText("Mamá · activa");
  await expect(parents).toContainText("Papá · invitación enviada");
  await expect(parents).toContainText("ACTIVA");
  await expect(parents).toContainText("PENDIENTE");
});

test("omite la alerta sin alergias y avisa cuando no hay padres", async ({
  page,
}) => {
  await gotoHydrated(page, `${KIDS}/sofia-mendez`);
  await expect(page.getByText("Alergias y notas")).toHaveCount(0);

  await gotoHydrated(page, `${KIDS}/valentina-soto`);
  await expect(page.getByText("Alergias y notas")).toHaveCount(0);
  await expect(page.getByText("Sin padres vinculados")).toBeVisible();
});

test("un ID inexistente devuelve 404", async ({ page }) => {
  const response = await gotoHydrated(page, `${KIDS}/no-existe`);

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
});

test("marca la sección activa en escritorio", async ({ page }) => {
  const active = page.locator(
    'nav[aria-label="Navegación principal"] a[aria-current="page"]:visible',
  );

  await gotoHydrated(page, `${BASE}/`);
  await expect(active).toHaveText(["Feed"]);

  await gotoHydrated(page, KIDS);
  await expect(active).toHaveText(["Niños"]);

  await gotoHydrated(page, `${KIDS}/mateo-fernandez`);
  await expect(active).toHaveText(["Niños"]);
});

test("navega entre el feed y niños", async ({ page }) => {
  await gotoHydrated(page, `${BASE}/`);

  await page.getByRole("link", { name: "Niños", exact: true }).click();
  await expect(page).toHaveURL(KIDS);

  await page.getByRole("link", { name: "Feed", exact: true }).click();
  await expect(page).toHaveURL(`${BASE}/`);
});

test.describe("menú móvil", () => {
  test.use({ viewport: { width: 375, height: 900 } });

  test("marca Niños activo y permite volver al feed", async ({ page }) => {
    await gotoHydrated(page, KIDS);

    const toggle = page.locator("button[aria-controls='mobile-nav']:visible");
    const active = page.locator("#mobile-nav:visible a[aria-current='page']");

    await toggle.click();
    await expect(active).toHaveText(["Niños"]);

    await page.getByRole("link", { name: "Feed", exact: true }).click();
    await expect(page).toHaveURL(`${BASE}/`);
    await expect(page.locator("article")).toHaveCount(3);
    await expect(toggle).toHaveCount(1);

    await toggle.click();
    await expect(active).toHaveText(["Feed"]);
  });
});

test("las acciones fuera de alcance no navegan", async ({ page }) => {
  await gotoHydrated(page, KIDS);
  await gotoHydrated(page, `${KIDS}/mateo-fernandez`);

  for (const name of ["Editar", "Resumen del día"]) {
    await page.getByRole("button", { name }).click();
    await expect(page).toHaveURL(`${KIDS}/mateo-fernandez`);
  }
});

test("el modal de vinculación no desborda a 375, 768 ni 1280 px", async ({
  page,
}) => {
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await gotoHydrated(page, MATEO_PROFILE);
    await page.getByRole("button", { name: "Vincular otro padre" }).click();

    const dialog = page.getByRole("dialog", { name: "Vincular padre" });
    const panel = dialog.locator("section");
    await expect(dialog).toBeVisible();

    const bounds = await panel.boundingBox();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );

    expect(bounds, `modal visible a ${width}px`).not.toBeNull();
    expect(bounds?.x, `margen izquierdo a ${width}px`).toBeGreaterThanOrEqual(0);
    expect(
      (bounds?.x ?? 0) + (bounds?.width ?? 0),
      `margen derecho a ${width}px`,
    ).toBeLessThanOrEqual(width);
    expect(overflow, `overflow a ${width}px`).toBeLessThanOrEqual(0);

    await dialog.getByRole("button", { name: "Cerrar ventana" }).click();
  }
});

test("el modal no desborda horizontalmente en 375, 768 ni 1280 px", async ({
  page,
}) => {
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await gotoHydrated(page, KIDS);
    await page.getByRole("button", { name: "Agregar niño" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const bounds = await dialog.boundingBox();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );

    expect(bounds, `modal visible a ${width}px`).not.toBeNull();
    expect(bounds?.x, `margen izquierdo a ${width}px`).toBeGreaterThanOrEqual(0);
    expect(
      (bounds?.x ?? 0) + (bounds?.width ?? 0),
      `margen derecho a ${width}px`,
    ).toBeLessThanOrEqual(width);
    expect(overflow, `overflow a ${width}px`).toBeLessThanOrEqual(0);

    await page.getByRole("button", { name: "Cancelar" }).click();
  }
});

test("no desborda horizontalmente en 375, 768 y 1280 px", async ({ page }) => {
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });

    for (const path of [KIDS, `${KIDS}/mateo-fernandez`]) {
      await gotoHydrated(page, path);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow, `${path} a ${width}px`).toBeLessThanOrEqual(0);
    }
  }
});

test("no registra errores de consola ni de hidratación", async ({ page }) => {
  const errors = trackErrors(page);

  await gotoHydrated(page, KIDS);
  await expect(page.getByTestId("kid-card")).toHaveCount(kids.length);
  await page.waitForTimeout(500);

  await page.getByTestId("kid-card").first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForTimeout(500);

  expect(errors).toEqual([]);
});
