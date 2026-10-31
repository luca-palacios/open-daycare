import { test, expect, type Page } from "@playwright/test";
import {
  BASE_URL,
  gotoHydrated,
  loginAsStaff,
  supabaseAuthCookies,
} from "./helpers";

const HOME = `${BASE_URL}/`;

test.beforeEach(async ({ page }) => {
  await loginAsStaff(page);
});

function trackErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  return errors;
}

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function pngFile(name: string) {
  return { name, mimeType: "image/png", buffer: PNG_1X1 };
}

async function openCreatePost(page: Page) {
  await page
    .getByRole("button", { name: "Nueva publicación" })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: "Nueva publicación" });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function addTemporaryKid(
  page: Page,
  input: { name: string; room: "Soles" | "Lunas" },
): Promise<void> {
  await page.getByRole("button", { name: "Agregar niño" }).click();
  await page.getByLabel("Nombre completo").fill(input.name);
  await page.getByLabel("Fecha de nacimiento").fill("2024-01-15");
  await page.getByLabel("Sala", { exact: true }).selectOption(input.room);
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("dialog", { name: "Agregar niño" })).toHaveCount(0);
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
      const page = await context.newPage();
      await loginAsStaff(page);
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

  test("abre la publicación desde el menú y al cancelar lo reabre con el foco", async ({
    page,
  }) => {
    await gotoHydrated(page, HOME);

    const toggle = page.locator("button[aria-controls='mobile-nav']");
    const panel = page.locator("#mobile-nav");

    await toggle.click();
    await expect(panel).toBeVisible();
    await panel.getByRole("button", { name: "Nueva publicación" }).click();

    const dialog = page.getByRole("dialog", { name: "Nueva publicación" });
    await expect(dialog).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();

    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toBeVisible();
    await expect(
      panel.getByRole("button", { name: "Nueva publicación" }),
    ).toBeFocused();
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
  await expect(page).toHaveURL(`${BASE_URL}/kids`);

  await page.getByRole("link", { name: "Feed" }).click();
  await expect(page).toHaveURL(HOME);

  const inertButtons = [
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

test("Salir cierra la sesión Supabase y vuelve al login", async ({ page }) => {
  await gotoHydrated(page, HOME);

  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(`${BASE_URL}/auth/login`);
  await expect.poll(() => supabaseAuthCookies(page.context())).toHaveLength(0);

  await gotoHydrated(page, HOME);
  await expect(page).toHaveURL(`${BASE_URL}/auth/login`);
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

test("«Nueva publicación» abre un formulario vacío y «Compartí un momento…» no lo abre", async ({
  page,
}) => {
  await gotoHydrated(page, HOME);

  await page.getByRole("button", { name: /Compartí un momento/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Nueva publicación" }),
  ).toHaveCount(0);
  await expect(page).toHaveURL(HOME);

  const dialog = await openCreatePost(page);
  await expect(page).toHaveURL(HOME);
  await expect(dialog.getByLabel("Descripción")).toHaveValue("");
  await expect(dialog.getByRole("button", { name: "Mateo" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(dialog.getByRole("button", { name: "Logro" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(dialog.locator("img")).toHaveCount(0);

  await dialog.getByRole("button", { name: "Publicar" }).click();
  await expect(dialog.getByRole("alert")).toHaveCount(3);
  await expect(
    dialog.getByText("Elegí al menos un destinatario."),
  ).toBeVisible();
  await expect(dialog.getByText("Elegí un tipo de publicación.")).toBeVisible();
  await expect(dialog.getByText("Escribí una descripción.")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Mateo" })).toBeFocused();
});

test("incluye los niños temporales de Soles, no los de Lunas y excluye sala y niños", async ({
  page,
}) => {
  await gotoHydrated(page, `${BASE_URL}/kids`);
  await addTemporaryKid(page, { name: "Mica Soles", room: "Soles" });
  await addTemporaryKid(page, { name: "Tere Lunas", room: "Lunas" });

  const dialog = await openCreatePost(page);
  await expect(dialog.getByRole("button", { name: "Mica" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Mateo" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Tere" })).toHaveCount(0);

  await dialog.getByRole("button", { name: "Mateo" }).click();
  await dialog.getByRole("button", { name: "Sofía" }).click();
  await expect(dialog.getByRole("button", { name: "Mateo" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(dialog.getByRole("button", { name: "Sofía" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    dialog.getByRole("button", { name: "Toda la sala" }),
  ).toHaveAttribute("aria-pressed", "false");

  await dialog.getByRole("button", { name: "Toda la sala" }).click();
  await expect(
    dialog.getByRole("button", { name: "Toda la sala" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.getByRole("button", { name: "Mateo" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(dialog.getByRole("button", { name: "Sofía" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );

  await dialog.getByRole("button", { name: "Mateo" }).click();
  await expect(dialog.getByRole("button", { name: "Mateo" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    dialog.getByRole("button", { name: "Toda la sala" }),
  ).toHaveAttribute("aria-pressed", "false");
});

test("publica con autora, tipo, audiencia e imágenes y se pierde al recargar", async ({
  page,
}) => {
  await gotoHydrated(page, HOME);
  const dialog = await openCreatePost(page);

  await dialog.getByRole("button", { name: "Mateo" }).click();
  await dialog.getByRole("button", { name: "Sofía" }).click();
  await dialog.getByRole("button", { name: "Logro" }).click();
  await dialog
    .getByLabel("Descripción")
    .fill("Publicación temporal de prueba");
  await dialog.getByLabel("Agregar fotos").setInputFiles(pngFile("pintura.png"));
  await expect(
    dialog.getByRole("img", { name: "Imagen adjunta: pintura.png" }),
  ).toBeVisible();

  await dialog.getByRole("button", { name: "Publicar" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(HOME);

  const articles = page.locator("article");
  await expect(articles).toHaveCount(4);

  const first = articles.first();
  await expect(
    first.getByRole("heading", { name: "Caro Giménez" }),
  ).toBeVisible();
  await expect(first.getByTestId("post-kind-achievement")).toContainText(
    "LOGRO",
  );
  await expect(first.getByText("Publicación temporal de prueba")).toBeVisible();
  await expect(
    first.getByText("Para: Mateo Fernández, Sofía Méndez"),
  ).toBeVisible();
  await expect(
    first.getByRole("img", { name: "Imagen adjunta: pintura.png" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Niños", exact: true }).click();
  await expect(page).toHaveURL(`${BASE_URL}/kids`);
  await page.getByRole("link", { name: "Feed", exact: true }).click();
  await expect(page).toHaveURL(HOME);
  await expect(page.locator("article")).toHaveCount(4);
  await expect(page.locator("article").first()).toContainText(
    "Publicación temporal de prueba",
  );

  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.locator("article")).toHaveCount(3);
  await expect(page.getByText("Publicación temporal de prueba")).toHaveCount(0);
});

test("publicar desde otra sección navega al feed y «Salir» limpia las publicaciones", async ({
  page,
}) => {
  await gotoHydrated(page, `${BASE_URL}/kids`);
  const dialog = await openCreatePost(page);

  await dialog.getByRole("button", { name: "Toda la sala" }).click();
  await dialog.getByRole("button", { name: "Anuncio" }).click();
  await dialog.getByLabel("Descripción").fill("Aviso temporal desde Niños");
  await dialog.getByRole("button", { name: "Publicar" }).click();

  await expect(page).toHaveURL(HOME);
  await expect(page.locator("article")).toHaveCount(4);
  const first = page.locator("article").first();
  await expect(first).toContainText("Aviso temporal desde Niños");
  await expect(first.getByText("Para: toda la sala")).toBeVisible();

  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(`${BASE_URL}/auth/login`);

  await loginAsStaff(page);
  await expect(page.locator("article")).toHaveCount(3);
});

test("valida formato, tamaño y cantidad de fotos y permite quitarlas", async ({
  page,
}) => {
  await gotoHydrated(page, HOME);
  const dialog = await openCreatePost(page);

  await dialog.getByRole("button", { name: "Mateo" }).click();
  await dialog.getByRole("button", { name: "Foto" }).click();
  await dialog.getByLabel("Descripción").fill("Foto con validación");

  await dialog.getByRole("button", { name: "Publicar" }).click();
  await expect(
    dialog.getByText("Adjuntá una imagen para publicar una foto."),
  ).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Agregar" })).toBeFocused();
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(HOME);

  const fileInput = dialog.getByLabel("Agregar fotos");

  await fileInput.setInputFiles({
    name: "nota.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("no es una imagen"),
  });
  await expect(
    dialog.getByText("nota.txt: Formato no admitido. Usá JPG, PNG o WebP."),
  ).toBeVisible();
  await expect(dialog.locator("img")).toHaveCount(0);

  await fileInput.setInputFiles({
    name: "grande.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await expect(
    dialog.getByText("grande.png: La imagen supera los 5 MB."),
  ).toBeVisible();
  await expect(dialog.locator("img")).toHaveCount(0);

  await fileInput.setInputFiles([
    pngFile("uno.png"),
    pngFile("dos.png"),
    pngFile("tres.png"),
  ]);
  await expect(dialog.locator("img")).toHaveCount(3);

  await fileInput.setInputFiles(pngFile("cuatro.png"));
  await expect(
    dialog.getByText("Podés adjuntar hasta 3 imágenes."),
  ).toBeVisible();
  await expect(dialog.locator("img")).toHaveCount(3);
  await expect(dialog.getByRole("button", { name: "Agregar" })).toHaveCount(0);

  await dialog.getByRole("button", { name: "Quitar dos.png" }).click();
  await expect(dialog.locator("img")).toHaveCount(2);
  await expect(dialog.getByRole("button", { name: "Agregar" })).toBeVisible();

  await dialog.getByRole("button", { name: "Publicar" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("article")).toHaveCount(4);
  const first = page.locator("article").first();
  await expect(first.locator("img")).toHaveCount(2);
});

test("el fondo no cierra, Tab queda atrapado y Cancelar o Esc descartan el borrador", async ({
  page,
}) => {
  await gotoHydrated(page, HOME);
  const opener = page
    .getByRole("button", { name: "Nueva publicación" })
    .first();
  await opener.click();

  const dialog = page.getByRole("dialog", { name: "Nueva publicación" });
  await dialog.getByRole("button", { name: "Mateo" }).click();
  await dialog.getByLabel("Descripción").fill("Borrador que se descarta");

  await page.mouse.click(1, 1);
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Agregar" }).focus();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Cancelar" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Agregar" })).toBeFocused();

  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();

  await opener.click();
  const reopened = page.getByRole("dialog", { name: "Nueva publicación" });
  await expect(reopened.getByLabel("Descripción")).toHaveValue("");
  await expect(
    reopened.getByRole("button", { name: "Mateo" }),
  ).toHaveAttribute("aria-pressed", "false");

  await page.keyboard.press("Escape");
  await expect(reopened).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("el modal y la publicación no desbordan a 375, 768 ni 1280 px", async ({
  page,
}) => {
  await gotoHydrated(page, HOME);
  const dialog = await openCreatePost(page);

  await dialog.getByRole("button", { name: "Toda la sala" }).click();
  await dialog.getByRole("button", { name: "Foto" }).click();
  await dialog.getByLabel("Descripción").fill("Publicación ancha con fotos");
  await dialog
    .getByLabel("Agregar fotos")
    .setInputFiles([pngFile("a.png"), pngFile("b.png"), pngFile("c.png")]);

  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const modalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(modalOverflow, `modal a ${width}px`).toBeLessThanOrEqual(0);
  }

  await dialog.getByRole("button", { name: "Publicar" }).click();
  await expect(dialog).toHaveCount(0);

  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow, `publicación a ${width}px`).toBeLessThanOrEqual(0);
  }
});
