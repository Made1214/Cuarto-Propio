import { describe, expect, it } from "vitest";
import { errorTitulo, TITULO_MAXIMO } from "./titulo";

describe("errorTitulo", () => {
  it("pide título si está vacío", () => expect(errorTitulo("")).toBe("requerido"));
  it("acepta hasta el máximo", () => {
    expect(errorTitulo("a".repeat(TITULO_MAXIMO))).toBeNull();
    expect(errorTitulo("Hoy")).toBeNull();
  });
  it("rechaza más del máximo", () => {
    expect(errorTitulo("a".repeat(TITULO_MAXIMO + 1))).toBe("demasiadoLargo");
  });
});
