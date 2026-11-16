import { describe, expect, it } from "vitest";
import { destinoSeguro } from "./destino";

describe("destinoSeguro", () => {
  it("deja pasar rutas internas, con o sin idioma", () => {
    expect(destinoSeguro("/diario")).toBe("/diario");
    expect(destinoSeguro("/es/diario/abc?q=1")).toBe("/diario/abc?q=1");
    expect(destinoSeguro("/en/listas")).toBe("/listas");
  });

  it("rechaza lo que saca del sitio o vuelve al login", () => {
    for (const malo of ["//otro.com", "/\\otro.com", "https://otro.com", "diario", "/es/login", "/registro", null, 3]) {
      expect(destinoSeguro(malo)).toBeNull();
    }
  });
});
