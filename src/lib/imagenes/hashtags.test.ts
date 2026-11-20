import { describe, expect, it } from "vitest";
import { formatearHashtags, normalizarHashtags, textoAlternativo } from "./hashtags";

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

describe("textoAlternativo", () => {
  it("usa el título cuando dice algo", () => {
    expect(textoAlternativo("Mi gato", null, "Pieza")).toBe("Mi gato");
  });
  it("cambia nombres de archivo por la descripción o el respaldo", () => {
    expect(textoAlternativo("6", "Acuarela de un gato", "Pieza")).toBe("Acuarela de un gato");
    expect(textoAlternativo("IMG_2041", null, "Pieza sin título")).toBe("Pieza sin título");
    expect(textoAlternativo("2024-03-01", "", "Pieza")).toBe("Pieza");
  });
});
