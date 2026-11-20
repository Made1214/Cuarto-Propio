import { describe, expect, it } from "vitest";
import { TAMANO_MAXIMO_BYTES } from "./limites";
import { dimensionesDestino, necesitaReducir, OPCIONES_FOTO } from "./reducir";

const MB = 1024 * 1024;

describe("dimensionesDestino", () => {
  it("una foto de celular horizontal baja a 2560 px de lado mayor", () => {
    expect(dimensionesDestino(4032, 3024, 2560)).toEqual({ ancho: 2560, alto: 1920 });
  });
  it("una vertical también: el lado mayor es el alto", () => {
    expect(dimensionesDestino(3024, 4032, 2560)).toEqual({ ancho: 1920, alto: 2560 });
  });
  it("nunca agranda una imagen chica", () => {
    expect(dimensionesDestino(800, 600, 2560)).toEqual({ ancho: 800, alto: 600 });
  });
  it("justo en el límite queda igual", () => {
    expect(dimensionesDestino(2560, 1000, 2560)).toEqual({ ancho: 2560, alto: 1000 });
  });
  it("una tira finísima no queda con un lado de 0 px", () => {
    expect(dimensionesDestino(10000, 1, 2560)).toEqual({ ancho: 2560, alto: 1 });
  });
});

describe("necesitaReducir", () => {
  it("una foto liviana y de tamaño razonable va tal cual", () => {
    expect(necesitaReducir(2 * MB, 2000, 1500, OPCIONES_FOTO)).toBe(false);
  });
  it("una foto pesada se reduce aunque mida poco", () => {
    expect(necesitaReducir(8 * MB, 2000, 1500, OPCIONES_FOTO)).toBe(true);
  });
  it("una foto liviana pero enorme en píxeles se reduce", () => {
    expect(necesitaReducir(1 * MB, 6000, 4000, OPCIONES_FOTO)).toBe(true);
  });
  it("el umbral de las fotos deja margen bajo el tope del servidor", () => {
    expect(OPCIONES_FOTO.umbralBytes).toBeLessThan(TAMANO_MAXIMO_BYTES);
    expect(OPCIONES_FOTO.topeBytes).toBe(TAMANO_MAXIMO_BYTES);
  });
});
