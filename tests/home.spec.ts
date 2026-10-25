import { test, expect, type Page } from "@playwright/test";
import { BASE_URL, gotoHydrated, seedDemoSession } from "./helpers";

const HOME = "http://localhost:3000/";

test.beforeEach(async ({ page }) => {
  await seedDemoSession(page.context());
});

function trackErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  return errors;
}

test("muestra las tres publicaciones de la referencia", async ({ page }) => {
  await gotoHydrated(page, HOME);

  await expect(page.getByRole("heading", { name: "Mateo" })).toHaveCount(2);
  await expect(
    page.getByRole("heading", { name: "Anuncio general" }),
  ).toBeVisible();

  await expect(
    page.getByText(/¡Usó el orinal solito por primera vez!/),
  ).toBeVisible();
  await expect(
    page.getByText(/Pintamos con témperas esta mañana/),
  ).toBeVisible();
  await expect(
    page.getByText(/El viernes salimos al parque por la mañana/),
  ).toBeVisible();

  await expect(page.getByText("Para: familia de Mateo")).toHaveCount(2);
  await expect(page.getByText("Para: toda la sala")).toBeVisible();

  await expect(page.getByTestId("post-kind-achievement")).toContainText(
    "LOGRO",
  );
  await expect(page.getByTestId("post-kind-activity")).toContainText(
    "ACTIVIDAD",
  );
  await expect(page.getByTestId("post-kind-announcement")).toContainText(
    "ANUNCIO",
  );

  await expect(page.getByLabel("3 reacciones")).toBeVisible();
  await expect(page.getByLabel("1 comentarios")).toBeVisible();
  await expect(page.getByLabel("5 reacciones")).toBeVisible();
  await expect(page.getByLabel("2 comentarios")).toBeVisible();
  await expect(page.getByLabel("8 reacciones")).toBeVisible();
  await expect(page.getByLabel("0 comentarios")).toBeVisible();

  await expect(page.getByText("Foto · pintando con témperas")).toBeVisible();
});

test("muestra la fecha del visitante en español", async ({ page }) => {
  await gotoHydrated(page, HOME);

  const dateLabel = page.getByTestId("feed-date");
  await expect(dateLabel).toHaveText(
    /^(lunes|martes|miércoles|jueves|viernes|sábado|domingo) \d{1,2} (ene|feb|mar|abr|may|jun|jul|ago|sept|oct|nov|dic)$/,
  );

  const expected = await page.evaluate(() => {
    const parts = new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "short",
    }).formatToParts(new Date());
    const value = (type: string) =>
      parts.find((part) => part.type === type)?.value ?? "";

    return [value("weekday"), value("day"), value("month").replace(/\.$/, "")]
      .filter(Boolean)
      .join(" ");
  });

  await expect(dateLabel).toHaveText(expected);
});

test("formatea las horas en la zona horaria del visitante", async ({
  browser,
}) => {
  const zones = ["America/Argentina/Buenos_Aires", "Europe/Madrid"];
  const results: string[][] = [];

  for (const timeZoneId of zones) {
    const context = await browser.newContext({ timezoneId: timeZoneId });
    await seedDemoSession(context);
    const page = await context.newPage();
    await gotoHydrated(page, HOME);

    const times = page.locator("article time");
    await expect(times).toHaveCount(3);

    const isos = await times.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("datetime") ?? ""),
    );
    const expected = isos.map((iso) =>
      new Intl.DateTimeFormat("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        timeZone: timeZoneId,
      }).format(new Date(iso)),
    );

    await expect(times).toHaveText(expected);
    results.push(await times.allTextContents());
    await context.close();
  }

  expect(results[0]).not.toEqual(results[1]);
});

test.describe("agrupación por día local", () => {
  test.describe("Buenos Aires", () => {
    test.use({ timezoneId: "America/Argentina/Buenos_Aires" });

    test("agrupa las publicaciones de hoy bajo PUBLICADO HOY", async ({
      page,
    }) => {
      await gotoHydrated(page, HOME);

      const labels = page.getByTestId("feed-day-label");
      await expect(labels).toHaveCount(1);
      await expect(labels).toHaveText("PUBLICADO HOY");
      await expect(page.locator("article")).toHaveCount(3);
    });
  });

  test.describe("Bangkok", () => {
    test.use({ timezoneId: "Asia/Bangkok" });

    test("separa las publicaciones que caen en otro día local", async ({
      page,
    }) => {
      await gotoHydrated(page, HOME);

      const labels = page.getByTestId("feed-day-label");
      await expect(labels).toHaveCount(2);
      await expect(
        labels.filter({ hasText: "PUBLICADO HOY" }),
      ).toHaveCount(1);
      await expect(page.locator("article")).toHaveCount(3);
    });
  });
});

test.describe("menú móvil", () => {
  test.use({ viewport: { width: 375, height: 900 } });

  test("abre y cierra con Escape exponiendo aria-expanded", async ({
    page,
  }) => {
    await gotoHydrated(page, HOME);

    const button = page.locator("button[aria-controls='mobile-nav']");
    const panel = page.locator("#mobile-nav");

    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toBeVisible();

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Escape");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();
    await expect(button).toBeFocused();
  });
});

test("Feed lleva a la home y las demás acciones no navegan", async ({
  page,
}) => {
  await gotoHydrated(page, HOME);

  const hrefs = await page
    .locator("a")
    .evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute("href")),
    );
  expect(new Set(hrefs)).toEqual(new Set(["/", "/kids"]));

  await page.getByRole("link", { name: "Niños" }).click();
  await expect(page).toHaveURL("http://localhost:3000/kids");

  await page.getByRole("link", { name: "Feed" }).click();
  await expect(page).toHaveURL(HOME);

  const inertButtons = [
    "Nueva publicación",
    "Avisos",
    "Mi cuenta",
    /Compartí un momento/,
    /^Editar$/,
  ];

  for (const name of inertButtons) {
    const buttons = page.getByRole("button", { name });
    const count = await buttons.count();

    for (let index = 0; index < count; index += 1) {
      await buttons.nth(index).click();
      await expect(page).toHaveURL(HOME);
    }
  }
});

test("Salir cierra la sesión demo y vuelve al login", async ({ page }) => {
  await gotoHydrated(page, HOME);

  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(`${BASE_URL}/login`);

  await gotoHydrated(page, HOME);
  await expect(page).toHaveURL(`${BASE_URL}/login`);
  await expect(
    page.getByRole("heading", { name: "Iniciar sesión" }),
  ).toBeVisible();
});

test("no desborda horizontalmente en 375, 768 y 1280 px", async ({ page }) => {
  await gotoHydrated(page, HOME);

  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `overflow a ${width}px`).toBeLessThanOrEqual(0);
  }
});

test("no registra errores de consola ni de hidratación", async ({ page }) => {
  const errors = trackErrors(page);

  await gotoHydrated(page, HOME);
  await expect(page.locator("article")).toHaveCount(3);
  await page.waitForTimeout(500);

  expect(errors).toEqual([]);
});
