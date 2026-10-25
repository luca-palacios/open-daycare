import { test, expect, type Page } from "@playwright/test";
import { BASE_URL, gotoHydrated, seedDemoSession } from "./helpers";

const HOME = `${BASE_URL}/`;
const LOGIN = `${BASE_URL}/login`;
const ACTIVATE = `${BASE_URL}/activate-account`;
const SESSION_COOKIE = "odc-demo-session";

function trackErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  return errors;
}

async function sessionCookie(page: Page) {
  const cookies = await page.context().cookies();
  return cookies.find((cookie) => cookie.name === SESSION_COOKIE);
}

async function login(page: Page) {
  await gotoHydrated(page, LOGIN);
  await page.getByLabel("EMAIL").fill("lucia.fernandez@gmail.com");
  await page.getByLabel("CONTRASEÑA").fill("secreta");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(HOME);
}

test.describe("login", () => {
  test("reproduce el formulario sin el selector de rol", async ({ page }) => {
    await gotoHydrated(page, LOGIN);

    await expect(
      page.getByRole("heading", { name: "Iniciar sesión" }),
    ).toBeVisible();
    await expect(page.getByText("Ingresá para ver el día de hoy.")).toBeVisible();
    await expect(page.getByLabel("EMAIL")).toBeVisible();
    await expect(page.getByLabel("CONTRASEÑA")).toBeVisible();
    await expect(page.getByRole("button", { name: "Personal" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Familia" })).toHaveCount(0);
    await expect(page.getByText("INGRESO COMO")).toHaveCount(0);
  });

  test("bloquea email inválido y contraseña vacía", async ({ page }) => {
    await gotoHydrated(page, LOGIN);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "Ingresá tu email." }),
    ).toBeVisible();
    await expect(
      page.getByRole("alert").filter({ hasText: "Ingresá tu contraseña." }),
    ).toBeVisible();
    await expect(page).toHaveURL(LOGIN);

    await page.getByLabel("EMAIL").fill("lucia.gmail.com");
    await page.getByLabel("CONTRASEÑA").fill("secreta");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    const emailAlert = page
      .getByRole("alert")
      .filter({ hasText: "Ingresá un email válido." });
    await expect(emailAlert).toBeVisible();
    await expect(page).toHaveURL(LOGIN);
    expect(await sessionCookie(page)).toBeUndefined();
  });

  test("crea la sesión demo y navega al feed", async ({ page }) => {
    await login(page);

    const cookie = await sessionCookie(page);
    expect(cookie?.value).toBe("demo");
    expect(cookie?.path).toBe("/");
    expect(cookie?.sameSite).toBe("Lax");
    expect(cookie?.httpOnly).toBe(false);
    expect(cookie?.expires).toBeGreaterThan(Date.now() / 1000 + 60 * 60);

    await expect(page.getByText(/8 niños\s*·/)).toBeVisible();
    await expect(page.locator("article")).toHaveCount(3);
  });

  test("la cookie demo no guarda datos personales", async ({ page }) => {
    await login(page);

    const cookie = await sessionCookie(page);
    expect(cookie?.name).toBe(SESSION_COOKIE);
    expect(cookie?.value).toBe("demo");
    expect(cookie?.value).not.toContain("@");
    expect(cookie?.value).not.toContain("lucia");
  });

  test("¿Olvidaste tu contraseña? no navega", async ({ page }) => {
    await gotoHydrated(page, LOGIN);

    await page.getByText("¿Olvidaste tu contraseña?").click();

    await expect(page).toHaveURL(LOGIN);
    await expect(page.getByLabel("EMAIL")).toBeVisible();
  });
});

test.describe("activación de cuenta", () => {
  test("muestra la invitación de Mateo precargada", async ({ page }) => {
    await gotoHydrated(page, ACTIVATE);

    await expect(
      page.getByRole("heading", { name: "Bienvenida a OpenDayCare" }),
    ).toBeVisible();
    await expect(page.getByText("Te invitaron a seguir a")).toBeVisible();
    await expect(page.getByText("Mateo · Sala Soles")).toBeVisible();
    await expect(
      page.getByLabel("CÓDIGO DE INVITACIÓN"),
    ).toHaveValue("7K4P9");
    await expect(page.getByLabel("EMAIL")).toHaveValue(
      "lucia.fernandez@gmail.com",
    );
    await expect(page.getByLabel("CREAR CONTRASEÑA")).toHaveValue("");
    await expect(page.getByRole("checkbox")).not.toBeChecked();
  });

  test("bloquea un código que no coincide", async ({ page }) => {
    await gotoHydrated(page, ACTIVATE);
    await page.getByLabel("CÓDIGO DE INVITACIÓN").fill("00000");
    await page.getByLabel("CREAR CONTRASEÑA").fill("secreta");
    await page.getByRole("button", { name: "Activar mi cuenta" }).click();

    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "El código no coincide con la invitación." }),
    ).toBeVisible();
    await expect(page).toHaveURL(ACTIVATE);
    expect(await sessionCookie(page)).toBeUndefined();
  });

  test("bloquea email inválido y contraseña vacía", async ({ page }) => {
    await gotoHydrated(page, ACTIVATE);
    await page.getByLabel("EMAIL").fill("lucia.gmail.com");
    await page.getByRole("button", { name: "Activar mi cuenta" }).click();

    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Ingresá un email válido." }),
    ).toBeVisible();
    await expect(
      page.getByRole("alert").filter({ hasText: "Ingresá tu contraseña." }),
    ).toBeVisible();
    await expect(page).toHaveURL(ACTIVATE);
  });

  test("activa la cuenta sin marcar la autorización de fotos", async ({
    page,
  }) => {
    await gotoHydrated(page, ACTIVATE);
    await expect(page.getByRole("checkbox")).not.toBeChecked();
    await page.getByLabel("CREAR CONTRASEÑA").fill("secreta");
    await page.getByRole("button", { name: "Activar mi cuenta" }).click();

    await expect(page).toHaveURL(HOME);
    expect((await sessionCookie(page))?.value).toBe("demo");
  });

  test("permite marcar la autorización de fotos", async ({ page }) => {
    await gotoHydrated(page, ACTIVATE);

    await page.getByText("Autorizo a la guardería").click();
    await expect(page.getByRole("checkbox")).toBeChecked();

    await page.getByLabel("CREAR CONTRASEÑA").fill("secreta");
    await page.getByRole("button", { name: "Activar mi cuenta" }).click();

    await expect(page).toHaveURL(HOME);
  });
});

test.describe("protección de rutas", () => {
  test("sin sesión, las rutas protegidas redirigen a login", async ({
    page,
  }) => {
    for (const path of [HOME, `${BASE_URL}/kids`, `${BASE_URL}/kids/mateo-fernandez`]) {
      await gotoHydrated(page, path);
      await expect(page, path).toHaveURL(LOGIN);
      await expect(
        page.getByRole("heading", { name: "Iniciar sesión" }),
      ).toBeVisible();
    }
  });

  test("con sesión, las páginas de auth redirigen al feed", async ({ page }) => {
    await seedDemoSession(page.context());

    await gotoHydrated(page, LOGIN);
    await expect(page).toHaveURL(HOME);

    await gotoHydrated(page, ACTIVATE);
    await expect(page).toHaveURL(HOME);
  });
});

test("los enlaces mutuos conectan login y activación", async ({ page }) => {
  await gotoHydrated(page, LOGIN);
  await page.getByRole("link", { name: "Activá tu cuenta" }).click();
  await expect(page).toHaveURL(ACTIVATE);

  await page.getByRole("link", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(LOGIN);
});

test.describe("salir", () => {
  test("en escritorio cierra la sesión y vuelve al login", async ({ page }) => {
    await seedDemoSession(page.context());
    await gotoHydrated(page, HOME);

    await page.getByRole("button", { name: "Salir" }).click();

    await expect(page).toHaveURL(LOGIN);
    expect(await sessionCookie(page)).toBeUndefined();

    await gotoHydrated(page, HOME);
    await expect(page).toHaveURL(LOGIN);
  });

  test.describe("en móvil", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("desde el menú cierra la sesión y vuelve al login", async ({
      page,
    }) => {
      await seedDemoSession(page.context());
      await gotoHydrated(page, HOME);

      await page.getByRole("button", { name: "Abrir menú" }).click();
      await page.getByRole("button", { name: "Salir" }).click();

      await expect(page).toHaveURL(LOGIN);
      expect(await sessionCookie(page)).toBeUndefined();
    });
  });
});

test.describe("accesibilidad de los formularios", () => {
  test("los errores se anuncian y se asocian al campo", async ({ page }) => {
    await gotoHydrated(page, LOGIN);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    const email = page.getByLabel("EMAIL");
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toHaveAttribute("aria-describedby", "login-email-error");

    const describedBy = await email.getAttribute("aria-describedby");
    const message = page.locator(`#${describedBy}`);
    await expect(message).toHaveAttribute("role", "alert");
    await expect(message).toHaveText("Ingresá tu email.");
  });

  test("el foco se mantiene visible en los campos", async ({ page }) => {
    await gotoHydrated(page, LOGIN);

    const email = page.getByLabel("EMAIL");
    await email.focus();

    await expect(email).toHaveCSS("border-color", "rgb(242, 167, 142)");
  });
});

test("no desborda horizontalmente en 375, 768 y 1280 px", async ({ page }) => {
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });

    for (const path of [LOGIN, ACTIVATE]) {
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

test("no registra errores de consola en las rutas de auth", async ({
  page,
}) => {
  const errors = trackErrors(page);

  await gotoHydrated(page, LOGIN);
  await page.waitForTimeout(300);
  await gotoHydrated(page, ACTIVATE);
  await page.waitForTimeout(300);

  expect(errors).toEqual([]);
});
