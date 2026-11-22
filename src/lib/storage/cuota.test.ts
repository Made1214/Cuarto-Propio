import { afterEach, describe, expect, it, vi } from "vitest";
import { cuotaPorCuentaBytes, entraEnCuota } from "./cuota";
import { LIMITE_STORAGE_BYTES } from "./limites";

describe("entraEnCuota", () => {
  it("deja subir mientras entre", () => {
    expect(entraEnCuota(0, 100, 1000)).toBe(true);
    expect(entraEnCuota(900, 100, 1000)).toBe(true);
  });
  it("frena lo que se pasa de la cuota", () => {
    expect(entraEnCuota(901, 100, 1000)).toBe(false);
  });
  it("sin dato de uso no bloquea", () => {
    expect(entraEnCuota(null, 10 ** 12, 1000)).toBe(true);
  });
});

describe("cuotaPorCuentaBytes", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("por defecto es el límite del plan", () => {
    vi.stubEnv("CUOTA_STORAGE_MB", "");
    expect(cuotaPorCuentaBytes()).toBe(LIMITE_STORAGE_BYTES);
  });
  it("CUOTA_STORAGE_MB la baja", () => {
    vi.stubEnv("CUOTA_STORAGE_MB", "250");
    expect(cuotaPorCuentaBytes()).toBe(250 * 1024 * 1024);
  });
  it("ignora valores inválidos", () => {
    vi.stubEnv("CUOTA_STORAGE_MB", "mucho");
    expect(cuotaPorCuentaBytes()).toBe(LIMITE_STORAGE_BYTES);
  });
});
