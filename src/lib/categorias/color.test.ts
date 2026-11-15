import { describe, expect, it } from "vitest";
import { colorCategoria } from "./color";

const cats = Array.from({ length: 13 }, (_, i) => ({ id: `id${i}`, nombre: `c${i}` }));

describe("colorCategoria", () => {
  it("da colores distintos a las primeras 12 categorías", () => {
    const colores = cats.slice(0, 12).map((c) => colorCategoria(cats, c.id));
    expect(new Set(colores).size).toBe(12);
  });
  it("da el mismo color a la misma categoría siempre", () => {
    expect(colorCategoria(cats, "id3")).toBe(colorCategoria(cats, "id3"));
  });
  it("da la vuelta a la paleta después de 12", () => {
    expect(colorCategoria(cats, "id12")).toBe(colorCategoria(cats, "id0"));
  });
  it("usa el primer color sin categoría o con id desconocido", () => {
    const primero = colorCategoria(cats, "id0");
    expect(colorCategoria(cats, null)).toBe(primero);
    expect(colorCategoria(cats, undefined)).toBe(primero);
    expect(colorCategoria(cats, "nope")).toBe(primero);
  });
});
