import { describe, expect, it } from "vitest";
import { formatearDuracion } from "./duracion";
import { DURACION_MAXIMA_SEGUNDOS, TAMANO_MAXIMO_BYTES } from "./limites";

describe("formatearDuracion", () => {
  it.each([
    [0, "0:00"],
    [5, "0:05"],
    [59.9, "0:59"],
    [60, "1:00"],
    [605, "10:05"],
    [-3, "0:00"],
  ])("%s s → %s", (s, esperado) => expect(formatearDuracion(s)).toBe(esperado));
});

describe("límites de audio", () => {
  it("son 10 minutos y 50 MB", () => {
    expect(DURACION_MAXIMA_SEGUNDOS).toBe(600);
    expect(formatearDuracion(DURACION_MAXIMA_SEGUNDOS)).toBe("10:00");
    expect(TAMANO_MAXIMO_BYTES).toBe(50 * 1024 * 1024);
  });
});
