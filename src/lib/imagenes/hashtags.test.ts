import { describe, expect, it } from "vitest";
import { formatearHashtags, normalizarHashtags } from "./hashtags";

describe("normalizarHashtags", () => {
  it("pasa a minúsculas y une #Viajes con #viajes", () => {
    expect(normalizarHashtags("#Viajes #viajes")).toEqual(["viajes"]);
  });
  it("quita acentos y símbolos, conserva _ y números", () => {
    expect(normalizarHashtags("#diseño, #foto_2026 !!")).toEqual(["diseno", "foto_2026"]);
  });
  it("devuelve vacío sin hashtags válidos", () => {
    expect(normalizarHashtags("  -- ")).toEqual([]);
  });
});

describe("formatearHashtags", () => {
  it("es la inversa para rellenar el campo", () => {
    expect(formatearHashtags(["a", "b_1"])).toBe("#a #b_1");
  });
});
