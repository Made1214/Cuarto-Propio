import type { PaletaTema } from "./types";

/** Luminancia relativa de un color #RRGGBB (WCAG 2.1). */
function luminancia(hex: string): number {
  const canales = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canales.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste entre dos colores #RRGGBB, de 1 (igual) a 21 (negro/blanco). */
export function contraste(a: string, b: string): number {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

export type ProblemaContraste = {
  /** Clave de mensaje en `personalizacion.contraste`. */
  clave: "texto" | "tarjeta" | "acento" | "barra" | "botonVerde" | "botonRosa" | "botonTurquesa";
  ratio: number;
  minimo: number;
};

/**
 * Las combinaciones que de verdad aparecen en la app, con el mínimo de WCAG
 * AA que les corresponde: 4.5 para texto normal y 3 para títulos grandes.
 * Devuelve solo las que no llegan. La app avisa pero deja guardar igual
 * (CLAUDE.md → Personalización: "avisa del problema pero permite continuar").
 */
export function revisarContraste(paleta: PaletaTema): ProblemaContraste[] {
  const casos: ProblemaContraste[] = [
    { clave: "texto", ratio: contraste(paleta.texto, paleta.fondo), minimo: 4.5 },
    { clave: "tarjeta", ratio: contraste(paleta.texto, paleta.fondoTarjeta), minimo: 4.5 },
    { clave: "acento", ratio: contraste(paleta.secundarioMorado, paleta.fondo), minimo: 3 },
    { clave: "barra", ratio: contraste(paleta.fondo, paleta.secundarioMorado), minimo: 4.5 },
    { clave: "botonVerde", ratio: contraste(paleta.tintaFuerte, paleta.primarioVerde), minimo: 4.5 },
    { clave: "botonRosa", ratio: contraste(paleta.tintaFuerte, paleta.primarioRosa), minimo: 4.5 },
    { clave: "botonTurquesa", ratio: contraste(paleta.tintaFuerte, paleta.secundarioTurquesa), minimo: 4.5 },
  ];
  return casos.filter((caso) => caso.ratio < caso.minimo);
}
