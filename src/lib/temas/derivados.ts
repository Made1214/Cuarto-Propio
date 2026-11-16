import { TEMAS_DISPONIBLES, type PresetId } from "./presets";
import type { ModoColor, PaletaTema } from "./types";

/**
 * Colores derivados: lo que la usuaria NO elige a mano pero tiene que
 * acompañar a lo que sí eligió.
 *
 * La regla es una sola y sale del propio tema: cada color derivado guarda,
 * respecto de su color "base", la misma distancia que tiene en el preset.
 * Si en Retro la tarjeta es un poco más clara que el fondo, con un fondo
 * propio la tarjeta sigue siendo ese mismo poco más clara; si en Softsignal
 * oscuro es más oscura, sigue siendo más oscura. Así cada tema conserva su
 * carácter con cualquier color, y nada se queda "pegado" al color de fábrica.
 */

type Rgb = [number, number, number];

function aRgb(hex: string): Rgb {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
}

function aHex(rgb: Rgb): string {
  return `#${rgb.map((c) => Math.min(255, Math.max(0, Math.round(c))).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** `valorPreset` corrido lo mismo que se corrió su base (`basePreset` → `baseNueva`). */
export function desplazar(baseNueva: string, basePreset: string, valorPreset: string): string {
  const [n, b, v] = [aRgb(baseNueva), aRgb(basePreset), aRgb(valorPreset)];
  return aHex([0, 1, 2].map((i) => n[i] + (v[i] - b[i])) as Rgb);
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * La paleta que de verdad se ve: la del preset, con los colores propios
 * encima y los derivados (tarjeta, tinta, texto apagado) recalculados a
 * partir de ellos.
 */
export function paletaDerivada(
  preset: PresetId,
  modo: ModoColor,
  propios: Partial<PaletaTema>,
): PaletaTema {
  const tema = TEMAS_DISPONIBLES[preset];
  const base = tema.colores[modo];
  const paleta: PaletaTema = { ...base, ...propios };

  if (propios.fondo && propios.fondo !== base.fondo && HEX.test(base.fondoTarjeta)) {
    paleta.fondoTarjeta = desplazar(propios.fondo, base.fondo, base.fondoTarjeta);
  }

  // La tinta (bordes) sigue al texto, salvo en los temas donde es un acento
  // (Void: el lila de las ventanitas sigue al color de acento).
  const sigue = tema.tintaSigue ?? "texto";
  const nuevoBase = propios[sigue];
  if (nuevoBase && nuevoBase !== base[sigue] && HEX.test(base.tinta) && HEX.test(base[sigue])) {
    paleta.tinta = desplazar(nuevoBase, base[sigue], base.tinta);
  }

  if (propios.texto && propios.texto !== base.texto) {
    const [r, g, b] = aRgb(propios.texto);
    const alfa = /,\s*([\d.]+)\)\s*$/.exec(base.textoMuted)?.[1] ?? "0.62";
    paleta.textoMuted = `rgba(${r},${g},${b},${alfa})`;
  }

  return paleta;
}

/**
 * Variables propias de los temas con hoja de estilos (`temas.css`): la
 * carcasa y el LCD de Softsignal, las barras y el cromo de Void. Cada una
 * dice de qué color de la paleta depende y cuánto vale en el preset; con un
 * color propio se corre igual que su base.
 *
 * Los valores de acá tienen que ser los mismos que en `temas.css` (hay un
 * test que lo comprueba): el CSS es lo que se ve sin colores propios, esto
 * es de dónde se parte para recalcular.
 */
type VariableTema = {
  variable: string;
  base: keyof PaletaTema | Record<ModoColor, keyof PaletaTema>;
  /** Sin valor en un modo = en ese modo no se toca. */
  claro?: string;
  oscuro?: string;
};

export const VARIABLES_TEMA: Partial<Record<PresetId, VariableTema[]>> = {
  softsignal: [
    { variable: "--ss-pagina", base: { claro: "texto", oscuro: "fondo" }, claro: "#2E3432", oscuro: "#111513" },
    { variable: "--ss-carcasa", base: "fondo", claro: "#E6E2D0", oscuro: "#2B302C" },
    { variable: "--ss-borde", base: "fondo", claro: "#8F8B78", oscuro: "#4E564C" },
    { variable: "--ss-tecla", base: "fondo", claro: "#D9D4BF", oscuro: "#353B36" },
    { variable: "--ss-lcd", base: "primarioVerde", claro: "#21300F", oscuro: "#0B1205" },
    { variable: "--ss-lcd-borde", base: "primarioVerde", claro: "#141C09", oscuro: "#040802" },
    { variable: "--ss-lcd-texto", base: "primarioVerde", claro: "#B6E05A", oscuro: "#C6F36B" },
    { variable: "--ss-lcd-tenue", base: "primarioVerde", claro: "#7F9E3F", oscuro: "#86AA42" },
    { variable: "--ss-rosa", base: "primarioRosa", claro: "#D84F8C", oscuro: "#FF77B3" },
  ],
  void: [
    { variable: "--vd-cuadro-a", base: "tinta", claro: "#7A5CE0" },
    { variable: "--vd-barra-a", base: "tinta", claro: "#B79CFF", oscuro: "#3A2178" },
    { variable: "--vd-barra-b", base: { claro: "primarioRosa", oscuro: "tinta" }, claro: "#F3A2E3", oscuro: "#8C4FE0" },
    { variable: "--vd-barra-texto", base: "texto", claro: "#2A1B47", oscuro: "#F4EEFF" },
    { variable: "--vd-lila", base: "tinta", claro: "#7A5CE0", oscuro: "#9B7BFF" },
    { variable: "--vd-rosa", base: "secundarioMorado", claro: "#B0187A", oscuro: "#FF5FD2" },
    { variable: "--vd-cromo-b", base: "primarioRosa", claro: "#FF7AD9", oscuro: "#FF5FD2" },
    { variable: "--vd-cromo-c", base: "tinta", claro: "#8C6BFF", oscuro: "#9B7BFF" },
    { variable: "--vd-cromo-borde", base: "texto", claro: "#3B1F6E", oscuro: "#2A0F3A" },
    { variable: "--vd-digital", base: "primarioVerde", claro: "#3DFF8A", oscuro: "#3DFF8A" },
    { variable: "--vd-tareas-a", base: "fondo", claro: "#E6DAFF", oscuro: "#2A1A52" },
    { variable: "--vd-tareas-b", base: "fondo", claro: "#CDB8FF", oscuro: "#160D30" },
  ],
};

/**
 * Las variables propias del tema que hay que pisar en un modo: solo las que
 * dependen de un color que la usuaria cambió. Sin colores propios devuelve
 * vacío y manda `temas.css` tal cual.
 */
export function variablesPropiasTema(
  preset: PresetId,
  modo: ModoColor,
  paleta: PaletaTema,
): Record<string, string> {
  const base = TEMAS_DISPONIBLES[preset].colores[modo];
  const salida: Record<string, string> = {};
  for (const entrada of VARIABLES_TEMA[preset] ?? []) {
    const valor = entrada[modo];
    if (!valor) continue;
    const clave = typeof entrada.base === "string" ? entrada.base : entrada.base[modo];
    if (paleta[clave] === base[clave] || !HEX.test(paleta[clave]) || !HEX.test(base[clave])) continue;
    salida[entrada.variable] = desplazar(paleta[clave], base[clave], valor);
  }
  return salida;
}
