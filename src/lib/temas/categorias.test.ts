import { describe, expect, it } from "vitest";
import { CANTIDAD_COLORES_CATEGORIA, paletaCategorias } from "./categorias";
import { contraste } from "./contraste";
import { TEMAS_DISPONIBLES } from "./presets";
import type { PaletaTema } from "./types";

const paletas = Object.entries(TEMAS_DISPONIBLES).flatMap(([id, tema]) =>
  (["claro", "oscuro"] as const).map((modo) => [`${id} ${modo}`, tema.colores[modo]] as const),
);

describe("paletaCategorias", () => {
  it.each(paletas)("%s: 12 colores distintos y legibles bajo la tinta", (_, paleta) => {
    const colores = paletaCategorias(paleta);
    expect(colores).toHaveLength(CANTIDAD_COLORES_CATEGORIA);
    expect(new Set(colores).size).toBe(CANTIDAD_COLORES_CATEGORIA);
    for (const c of colores) {
      expect(c).toMatch(/^#[0-9A-F]{6}$/);
      expect(contraste(paleta.tintaFuerte, c)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("cambia cuando cambian los acentos del tema", () => {
    const base = TEMAS_DISPONIBLES.whimsical.colores.claro;
    const viva: PaletaTema = { ...base, primarioRosa: "#FF3D8B", primarioVerde: "#3DDC84", secundarioTurquesa: "#00C2D1" };
    expect(paletaCategorias(viva)).not.toEqual(paletaCategorias(base));
  });

  it("sigue siendo legible con acentos muy oscuros elegidos a mano", () => {
    const base = TEMAS_DISPONIBLES.whimsical.colores.claro;
    const oscura: PaletaTema = { ...base, primarioRosa: "#401020", primarioVerde: "#103010", secundarioTurquesa: "#102030" };
    for (const c of paletaCategorias(oscura)) expect(contraste(base.tintaFuerte, c)).toBeGreaterThanOrEqual(4.5);
  });
});
