import { describe, expect, it } from "vitest";
import { CONFIG_POR_DEFECTO, configDesdeFila, esHex, esImagenPropia } from "./config";

describe("esHex", () => {
  it("solo deja pasar #RRGGBB", () => {
    expect(esHex("#a1B2c3")).toBe(true);
    for (const malo of ["red", "#abc", "#12345g", "#1234567", 5, null])
      expect(esHex(malo)).toBe(false);
  });
});

describe("esImagenPropia", () => {
  it("acepta un PNG en base64", () => expect(esImagenPropia("data:image/png;base64,iVBORw0KGgo=")).toBe(true));
  it("rechaza lo que puede cerrar el url() del CSS o no es PNG", () => {
    expect(esImagenPropia('data:image/png;base64,AAAA");background:red')).toBe(false);
    expect(esImagenPropia("data:image/svg+xml;base64,AAAA")).toBe(false);
    expect(esImagenPropia("https://x.test/a.png")).toBe(false);
  });
  it("rechaza archivos demasiado grandes", () => {
    expect(esImagenPropia("data:image/png;base64," + "A".repeat(70_000))).toBe(false);
  });
});

describe("configDesdeFila", () => {
  it("sin fila devuelve la configuración por defecto", () => {
    expect(configDesdeFila(null)).toBe(CONFIG_POR_DEFECTO);
  });
  it("descarta valores raros y normaliza los colores", () => {
    const c = configDesdeFila({
      preset: "no-existe",
      colores: { claro: { fondo: "#abcdef", texto: "javascript:1", otro: "#000000" }, oscuro: null },
      tipografia: "{no es json",
      cursor: "preset:inexistente",
      iconos: { set: "raro", propios: { "/diario": "data:text/html;base64,AA" } },
    });
    expect(c.preset).toBe(CONFIG_POR_DEFECTO.preset);
    expect(c.colores.claro).toEqual({ fondo: "#ABCDEF" });
    expect(c.colores.oscuro).toEqual({});
    expect(c.fuenteDiario).toBeNull();
    expect(c.cursor).toBeNull();
    expect(c.iconos).toEqual({ set: "trazo", propios: {} });
  });
  it("acepta un cursor de preset válido", () => {
    expect(configDesdeFila({ cursor: "preset:flecha" }).cursor).toEqual({ tipo: "preset", id: "flecha" });
  });
});
