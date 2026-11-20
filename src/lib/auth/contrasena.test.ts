import { describe, expect, it } from "vitest";
import { contrasenaValida } from "./contrasena";

describe("contrasenaValida", () => {
  it("acepta 8+ caracteres con letra y número", () => {
    expect(contrasenaValida("cuarto123")).toBe(true);
    expect(contrasenaValida("ñandú2026")).toBe(true);
  });
  it.each([
    ["corta", "abc1234"],
    ["sin número", "sololetras"],
    ["sin letra", "12345678"],
    ["vacía", ""],
  ])("rechaza una contraseña %s", (_n, valor) => {
    expect(contrasenaValida(valor)).toBe(false);
  });
});
