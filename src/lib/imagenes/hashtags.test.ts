import { describe, expect, it } from "vitest";
import { formatearHashtags, normalizarHashtags, textoAlternativo, unificarHashtags } from "./hashtags";

describe("normalizarHashtags", () => {
  it("pasa a minúsculas y une #Viajes con #viajes", () => {
    expect(normalizarHashtags("#Viajes #viajes")).toEqual(["viajes"]);
  });
  it("conserva tildes y ñ, quita símbolos, conserva _ y números", () => {
    expect(normalizarHashtags("#Diseño, #café! #foto_2026 !!")).toEqual(["diseño", "café", "foto_2026"]);
  });
  it("une la misma letra escrita compuesta o con tilde suelta", () => {
    expect(normalizarHashtags("#cafe\u0301 #caf\u00e9")).toEqual(["café"]);
  });
  it("devuelve vacío sin hashtags válidos", () => {
    expect(normalizarHashtags("  -- ")).toEqual([]);
  });
});

describe("unificarHashtags", () => {
  it("usa la forma que la cuenta ya tenía, con o sin tilde", () => {
    expect(unificarHashtags(["cafe", "diseno"], ["café", "diseño"])).toEqual(["café", "diseño"]);
    expect(unificarHashtags(["café"], ["cafe"])).toEqual(["cafe"]);
  });
  it("deja lo nuevo como se escribió y no lo repite", () => {
    expect(unificarHashtags(["niño", "nino"], [])).toEqual(["niño"]);
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
