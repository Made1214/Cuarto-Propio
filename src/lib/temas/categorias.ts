import { contraste } from "./contraste";
import type { PaletaTema } from "./types";

/**
 * Colores de categoría que siguen al tema.
 *
 * Las categorías necesitan muchos colores distinguibles (12), y un tema
 * solo trae tres acentos claros (verde, rosa, turquesa). Así que de los
 * acentos se toma el *carácter* —qué tan claros y qué tan saturados son— y
 * se reparte en 12 tonos parejos alrededor del círculo, empezando por el
 * tono del rosa del tema. Con Whimsical salen pasteles suaves; con Softsignal
 * o Void, más vivos. Si la usuaria eligió colores propios, salen de esos.
 *
 * Encima de un color de categoría va texto en `tintaFuerte` (chips del
 * selector), así que cada color se aclara lo que haga falta para llegar a
 * 4.5:1 contra esa tinta, aunque el acento del tema no llegue.
 *
 * Se calcula en OKLCH porque ahí "misma claridad" significa lo mismo para
 * el ojo en todos los tonos; en RGB un amarillo y un azul con los mismos
 * números se ven muy distintos.
 */

export const CANTIDAD_COLORES_CATEGORIA = 12;

/** 150° entre un color y el siguiente: recorre los 12 tonos (múltiplos de
 * 30°) sin que dos consecutivos queden vecinos en el círculo. */
const PASO_TONO = 150;
const CONTRASTE_MINIMO = 4.5;

type Oklch = { l: number; c: number; h: number };

function lineal(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function gamma(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

function hexAOklch(hex: string): Oklch {
  const [r, g, b] = [1, 3, 5].map((i) => lineal(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  return { l: L, c: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
}

/** OKLCH → sRGB lineal sin recortar (puede salir de 0–1 si no entra en la gama). */
function oklchARgbLineal({ l, c, h }: Oklch): [number, number, number] {
  const rad = (h * Math.PI) / 180;
  const A = c * Math.cos(rad);
  const B = c * Math.sin(rad);
  const l_ = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m_ = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s_ = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

function enGama(rgb: [number, number, number]): boolean {
  return rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);
}

/** Pasa a #RRGGBB bajando la saturación hasta que el color exista en sRGB. */
function oklchAHex(color: Oklch): string {
  let c = color.c;
  let rgb = oklchARgbLineal({ ...color, c });
  while (!enGama(rgb) && c > 0) {
    c = Math.max(0, c - 0.005);
    rgb = oklchARgbLineal({ ...color, c });
  }
  return `#${rgb
    .map((v) => Math.round(gamma(Math.min(1, Math.max(0, v))) * 255).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

function limitar(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor));
}

/** Los 12 colores de categoría para una paleta (un modo de un tema). */
export function paletaCategorias(paleta: PaletaTema): string[] {
  const acentos = [paleta.primarioRosa, paleta.primarioVerde, paleta.secundarioTurquesa].map(hexAOklch);
  const promedio = (f: (o: Oklch) => number) => acentos.reduce((s, o) => s + f(o), 0) / acentos.length;

  // Límites para que sigan siendo fondos de chip: ni grises, ni chillones,
  // ni tan oscuros que la tinta no se lea.
  const claridad = limitar(promedio((o) => o.l), 0.78, 0.94);
  const croma = limitar(promedio((o) => o.c), 0.05, 0.13);
  const tonoInicial = acentos[0].c < 0.02 ? 0 : acentos[0].h;

  return Array.from({ length: CANTIDAD_COLORES_CATEGORIA }, (_, i) => {
    const h = (tonoInicial + i * PASO_TONO) % 360;
    let l = claridad;
    let hex = oklchAHex({ l, c: croma, h });
    while (contraste(paleta.tintaFuerte, hex) < CONTRASTE_MINIMO && l < 0.99) {
      l = Math.min(0.99, l + 0.01);
      hex = oklchAHex({ l, c: croma, h });
    }
    return hex;
  });
}

/** Variables CSS `--cat-0` … `--cat-11` que lee `colorCategoria`. */
export function variablesCategorias(paleta: PaletaTema): Record<string, string> {
  return Object.fromEntries(paletaCategorias(paleta).map((hex, i) => [`--cat-${i}`, hex]));
}
