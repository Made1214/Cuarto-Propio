import { describe, expect, it } from "vitest";
import { asignarIndices, colorCategoria, indiceCategoria } from "./color";
import type { Categoria } from "./types";

const cats: Categoria[] = Array.from({ length: 13 }, (_, i) => ({
  id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
  nombre: `c${i}`,
  creadoEn: `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00+00:00`,
}));

describe("colorCategoria", () => {
  it("da colores distintos a las primeras 12 categorías", () => {
    const doce = cats.slice(0, 12);
    const indices = doce.map((c) => indiceCategoria(doce, c.id));
    expect(new Set(indices).size).toBe(12);
  });

  it("devuelve la variable del tema con un respaldo", () => {
    expect(colorCategoria(cats, cats[0].id)).toMatch(/^var\(--cat-\d+, #[0-9A-F]{6}\)$/);
  });

  it("no depende del orden en que llega la lista (alfabético, al revés…)", () => {
    const alReves = [...cats].reverse();
    for (const c of cats) expect(indiceCategoria(alReves, c.id)).toBe(indiceCategoria(cats, c.id));
  });

  it("crear una categoría nueva no cambia el color de las existentes", () => {
    const antes = cats.slice(0, 6);
    const despues = [...antes, { id: "nueva", nombre: "aaa primera alfabéticamente" }];
    for (const c of antes) expect(indiceCategoria(despues, c.id)).toBe(indiceCategoria(antes, c.id));
  });

  it("borrar una categoría solo mueve a las que chocaron con ella", () => {
    const todas = cats.slice(0, 8);
    const antes = asignarIndices(todas);
    const borrada = todas[2];
    const despues = asignarIndices(todas.filter((c) => c !== borrada));
    const movidas = todas.filter((c) => c !== borrada && antes.get(c.id) !== despues.get(c.id));
    // Solo puede moverse una que, al asignarse, pasó por el lugar de la borrada.
    expect(movidas.length).toBeLessThan(todas.length - 3);
  });

  it("usa un color fijo sin categoría y uno estable con id desconocido", () => {
    expect(colorCategoria(cats, null)).toBe(colorCategoria(cats, undefined));
    expect(colorCategoria(cats, "nope")).toBe(colorCategoria([], "nope"));
  });
});
