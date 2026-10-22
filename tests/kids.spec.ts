import { test, expect, type Page } from "@playwright/test";
import { kids } from "../app/_data/kids";
import { gotoHydrated } from "./helpers";

const BASE = "http://localhost:3000";
const KIDS = `${BASE}/kids`;

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

test("muestra los ocho niños y un contador de ocho", async ({ page }) => {
  await gotoHydrated(page, KIDS);

  await expect(
    page.getByRole("heading", { level: 1, name: "Niños" }),
  ).toBeVisible();
  await expect(page.getByTestId("kid-card")).toHaveCount(kids.length);
  await expect(page.getByTestId("kids-count")).toHaveText(`${kids.length} niños`);

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
  await page.getByRole("button", { name: "Agregar niño" }).click();
  await expect(page).toHaveURL(KIDS);

  await gotoHydrated(page, `${KIDS}/mateo-fernandez`);

  for (const name of ["Editar", "Resumen del día", "Vincular otro padre"]) {
    await page.getByRole("button", { name }).click();
    await expect(page).toHaveURL(`${KIDS}/mateo-fernandez`);
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
