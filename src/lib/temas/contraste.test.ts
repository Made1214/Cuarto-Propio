import { describe, expect, it } from "vitest";
import { contraste, revisarContraste } from "./contraste";
import { TEMAS_DISPONIBLES } from "./presets";

describe("contraste", () => {
  it("negro sobre blanco es 21 y mismo color es 1", () => {
    expect(contraste("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contraste("#3D2C4F", "#3D2C4F")).toBeCloseTo(1, 5);
  });
  it("no depende del orden", () => {
    expect(contraste("#123456", "#FEDCBA")).toBeCloseTo(contraste("#FEDCBA", "#123456"), 10);
  });
});

describe("revisarContraste", () => {
  const paleta = Object.values(TEMAS_DISPONIBLES)[0].colores.claro;
  it("avisa del texto cuando es igual al fondo", () => {
    const problemas = revisarContraste({ ...paleta, texto: paleta.fondo });
    expect(problemas.map((p) => p.clave)).toContain("texto");
  });
});
