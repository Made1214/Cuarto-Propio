import { describe, expect, it } from "vitest";
import { formatearDuracion } from "./duracion";
import { BITRATE_AUDIO_BPS, DURACION_MAXIMA_SEGUNDOS, TAMANO_MAXIMO_BYTES } from "./limites";

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
  it("son 10 minutos y 4 MB", () => {
    expect(DURACION_MAXIMA_SEGUNDOS).toBe(600);
    expect(formatearDuracion(DURACION_MAXIMA_SEGUNDOS)).toBe("10:00");
    expect(TAMANO_MAXIMO_BYTES).toBe(4 * 1024 * 1024);
  });
});

describe("bitrate de grabación", () => {
  it("10 minutos a ese bitrate caben holgados bajo el tope", () => {
    const bytesDiezMinutos = (BITRATE_AUDIO_BPS / 8) * DURACION_MAXIMA_SEGUNDOS;
    expect(bytesDiezMinutos).toBeLessThan(TAMANO_MAXIMO_BYTES);
  });
});
