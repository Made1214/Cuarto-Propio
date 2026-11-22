import { defineConfig, devices } from "@playwright/test";

/**
 * Prueba de punta a punta contra la base REAL de Supabase (la de `.env.local`),
 * con una cuenta de prueba. Ver `e2e/flujo.spec.ts` para las variables.
 * Levanta `npm run dev` solo si no hay ya algo escuchando en el 3000.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Solo si ya tienes un Chromium instalado y no quieres `npx playwright install`.
    launchOptions: {
      ...(process.env.E2E_CHROMIUM ? { executablePath: process.env.E2E_CHROMIUM } : {}),
      // Micrófono de mentira (un tono) y sin el cartel de permiso: así la
      // prueba de Audio graba sin un micrófono de verdad.
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    },
    permissions: ["microphone"],
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    { name: "celular", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
});
