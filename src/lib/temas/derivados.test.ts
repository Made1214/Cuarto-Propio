import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { configDesdeFila, paletaEfectiva, porTema } from "./config";
import { generarCssTema } from "./css";
import { desplazar, paletaDerivada, VARIABLES_TEMA, variablesPropiasTema } from "./derivados";
import { TEMAS_DISPONIBLES, type PresetId } from "./presets";

describe("desplazar", () => {
  it("corre el valor lo mismo que se corrió su base, sin salirse de rango", () => {
    expect(desplazar("#101010", "#000000", "#202020")).toBe("#303030");
    expect(desplazar("#FFFFFF", "#F0F0F0", "#FAFAFA")).toBe("#FFFFFF");
    expect(desplazar("#000000", "#101010", "#080808")).toBe("#000000");
  });
});

describe("paletaDerivada", () => {
  it("sin colores propios es exactamente la paleta del tema", () => {
    for (const id of Object.keys(TEMAS_DISPONIBLES) as PresetId[]) {
      expect(paletaDerivada(id, "claro", {})).toEqual(TEMAS_DISPONIBLES[id].colores.claro);
      expect(paletaDerivada(id, "oscuro", {})).toEqual(TEMAS_DISPONIBLES[id].colores.oscuro);
    }
  });
  it("la tarjeta acompaña al fondo y los bordes al texto", () => {
    const paleta = paletaDerivada("retro", "claro", { fondo: "#101820", texto: "#F0F0F0" });
    expect(paleta.fondoTarjeta).toBe(desplazar("#101820", "#FCF6F3", "#FFFFFF"));
    expect(paleta.fondoTarjeta).not.toBe("#FFFFFF");
    expect(paleta.tinta).toBe("#F0F0F0");
    expect(paleta.textoMuted).toBe("rgba(240,240,240,0.62)");
  });
  it("en Void los bordes siguen al acento, no al texto", () => {
    const base = TEMAS_DISPONIBLES.void.colores.claro;
    expect(paletaDerivada("void", "claro", { texto: "#000000" }).tinta).toBe(base.tinta);
    expect(paletaDerivada("void", "claro", { secundarioMorado: "#157AA0" }).tinta).not.toBe(base.tinta);
  });
});

describe("variables propias de Softsignal y Void", () => {
  it("coinciden con los valores de temas.css", () => {
    const css = readFileSync(new URL("../../app/[locale]/temas.css", import.meta.url), "utf8");
    for (const entradas of Object.values(VARIABLES_TEMA)) {
      for (const { variable, claro, oscuro } of entradas) {
        const valores = [...css.matchAll(new RegExp(`${variable}: (#[0-9a-fA-F]{6});`, "g"))].map((m) => m[1].toUpperCase());
        expect(valores[0], `${variable} claro`).toBe(claro);
        // Después del claro vienen las dos copias del oscuro (media query y fijado a mano).
        if (oscuro && valores.length > 1) expect(valores.slice(1), `${variable} oscuro`).toEqual([oscuro, oscuro]);
      }
    }
  });
  it("sin colores propios no se pisa nada", () => {
    expect(variablesPropiasTema("softsignal", "claro", TEMAS_DISPONIBLES.softsignal.colores.claro)).toEqual({});
    expect(generarCssTema(configDesdeFila({ preset: "void" }))).not.toContain("--vd-");
  });
  it("solo se pisan las que dependen del color cambiado", () => {
    const config = configDesdeFila({ preset: "softsignal", colores: { temas: { softsignal: { claro: { primarioVerde: "#6EB8D9" } } } } });
    const propias = variablesPropiasTema("softsignal", "claro", paletaEfectiva(config, "claro"));
    expect(Object.keys(propias).sort()).toEqual(["--ss-lcd", "--ss-lcd-borde", "--ss-lcd-tenue", "--ss-lcd-texto"]);
    expect(generarCssTema(config)).toContain('[data-tema="softsignal"][data-tema="softsignal"]{--ss-lcd:');
    expect(generarCssTema(config)).not.toContain(':root[data-modo="oscuro"] [data-tema="softsignal"]');
  });
});

describe("personalización por tema", () => {
  it("cada tema lee solo lo suyo", () => {
    const fila = {
      colores: { temas: { retro: { claro: { fondo: "#111111" } }, void: { claro: { fondo: "#222222" } } } },
      tipografia: JSON.stringify({ temas: { retro: { diario: "caveat" } } }),
    };
    expect(configDesdeFila({ ...fila, preset: "retro" }).colores.claro).toEqual({ fondo: "#111111" });
    expect(configDesdeFila({ ...fila, preset: "retro" }).fuenteDiario).toBe("caveat");
    expect(configDesdeFila({ ...fila, preset: "void" }).colores.claro).toEqual({ fondo: "#222222" });
    expect(configDesdeFila({ ...fila, preset: "void" }).fuenteDiario).toBeNull();
    expect(configDesdeFila({ ...fila, preset: "whimsical" }).colores).toEqual({ claro: {}, oscuro: {} });
  });
  it("una fila en la forma vieja se lee como del tema activo", () => {
    expect(porTema({ claro: { fondo: "#111111" } }, "retro")).toEqual({ retro: { claro: { fondo: "#111111" } } });
    expect(porTema({}, "retro")).toEqual({});
    expect(porTema({ temas: { inventado: {}, void: 1 } }, "retro")).toEqual({ void: 1 });
  });
  it("las letras elegidas a mano llegan a rótulos y títulos", () => {
    const css = generarCssTema(configDesdeFila({ preset: "void", tipografia: JSON.stringify({ temas: { void: { interfaz: "nunito" } } }) }));
    expect(css).toContain("--fuente-rotulo:var(--font-nunito)");
    expect(css).not.toContain("--fuente-titulo");
  });
});
