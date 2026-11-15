import { expect, test, type Page } from "@playwright/test";

/**
 * Recorrido básico con la base real. Necesita una cuenta de prueba YA
 * CREADA y con el correo confirmado:
 *
 *   E2E_EMAIL=prueba@ejemplo.com E2E_PASSWORD=... npm run e2e
 *
 * Los textos son los de `src/messages/es.json` (la app abre en español).
 * Lo que crea queda en la cuenta de prueba con el prefijo "E2E": bórralo a
 * mano de vez en cuando (la prueba no borra para no depender de los
 * diálogos de confirmación).
 */
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
test.skip(!EMAIL || !PASSWORD, "Faltan E2E_EMAIL y E2E_PASSWORD");

const sufijo = Date.now().toString(36);

async function entrar(page: Page, password = PASSWORD!) {
  await page.goto("/es/login");
  await page.getByLabel("Correo electrónico").fill(EMAIL!);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

/** La bienvenida sale una sola vez en una cuenta nueva: si aparece, se cierra. */
async function cerrarBienvenida(page: Page) {
  const empezar = page.getByRole("button", { name: /empezar/i });
  if (await empezar.isVisible({ timeout: 1500 }).catch(() => false)) await empezar.click();
}

test("una ruta privada sin sesión manda al login", async ({ page }) => {
  await page.goto("/es/diario");
  await expect(page).toHaveURL(/\/login/);
});

test("contraseña incorrecta muestra el error y no entra", async ({ page }) => {
  await entrar(page, "contraseña-equivocada-123");
  await expect(page.getByText("No se pudo iniciar sesión")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test.describe("con sesión", () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page);
    await expect(page).not.toHaveURL(/\/login/);
    await cerrarBienvenida(page);
  });

  test("Diario: título obligatorio, guardar, ver en la lista y buscar", async ({ page }) => {
    const titulo = `E2E entrada ${sufijo}`;
    await page.goto("/es/diario/nueva");

    // Sin título no se guarda: el campo es `required`, el navegador lo frena.
    await page.locator(".ProseMirror").click();
    await page.keyboard.type("Texto de prueba con **formato**");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page).toHaveURL(/\/diario\/nueva/);

    await page.getByPlaceholder("Ponle nombre a este momento").fill(titulo);
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page).not.toHaveURL(/\/diario\/nueva/);

    await page.goto("/es/diario");
    await expect(page.getByText(titulo).first()).toBeVisible();

    await page.getByPlaceholder("Buscar por palabra clave...").fill(`entrada ${sufijo}`);
    await page.keyboard.press("Enter");
    await expect(page.getByText(titulo).first()).toBeVisible();
  });

  test("Diario: el borrador se recupera si se cierra la pestaña", async ({ page }) => {
    await page.goto("/es/diario/nueva");
    await page.getByPlaceholder("Ponle nombre a este momento").fill(`E2E borrador ${sufijo}`);
    await page.locator(".ProseMirror").click();
    await page.keyboard.type("sin guardar");
    await page.waitForTimeout(1500); // el borrador se guarda con un pequeño retraso
    await page.goto("/es/diario/nueva");
    await expect(page.getByText(/borrador sin guardar/i)).toBeVisible();
  });

  test("Listas: crear una lista y agregar un ítem", async ({ page }) => {
    await page.goto("/es/listas");
    // El formulario está cerrado hasta tocar «Nueva lista» (puede haber dos
    // botones: el del encabezado y el del estado vacío).
    await page.getByRole("button", { name: /nueva lista/i }).first().click();
    await page.getByPlaceholder("Ponle nombre a esta lista").fill(`E2E lista ${sufijo}`);
    await page.keyboard.press("Enter");
    // El nombre de cada lista es un campo editable, no texto suelto.
    await expect(page.locator(`input[value="E2E lista ${sufijo}"]`)).toBeVisible();

    // Las listas más nuevas van primero: la primera columna es la recién creada.
    await page.getByPlaceholder("Agregar ítem y Enter").first().fill("primer ítem");
    await page.keyboard.press("Enter");
    await expect(page.getByText("primer ítem").first()).toBeVisible();
  });

  test("las secciones cargan sin error", async ({ page }) => {
    for (const ruta of ["diario", "listas", "vitrina", "audio", "personalizacion"]) {
      const respuesta = await page.goto(`/es/${ruta}`);
      expect(respuesta?.status(), ruta).toBeLessThan(400);
    }
  });

  test("cerrar sesión devuelve al login", async ({ page }) => {
    await page.goto("/es/diario");
    await page.getByRole("button", { name: /perfil|avatar/i }).first().click();
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
