import type { RutaSeccion } from "@/components/iconos-secciones";
import { esCursor, type CursorId } from "./cursores";
import { esFuenteDiario, esFuenteInterfaz, type FuenteDiarioId, type FuenteInterfazId } from "./fuentes";
import { paletaDerivada } from "./derivados";
import { esPreset, TEMA_POR_DEFECTO, type PresetId } from "./presets";
import type { ModoColor, PaletaTema } from "./types";

/** Los colores que se pueden cambiar a mano. La tinta fuerte (texto sobre
 * los botones pastel) queda fija: es la que asegura que se lean. */
export const COLORES_EDITABLES = [
  "secundarioMorado",
  "primarioVerde",
  "primarioRosa",
  "secundarioTurquesa",
  "fondo",
  "texto",
] as const satisfies readonly (keyof PaletaTema)[];

export type ColorEditable = (typeof COLORES_EDITABLES)[number];
export type ColoresPropios = Partial<Record<ColorEditable, string>>;

export const SETS_ICONOS = ["trazo", "pixel"] as const;
export type SetIconos = (typeof SETS_ICONOS)[number];
export const RUTAS_ICONOS: readonly RutaSeccion[] = ["/diario", "/listas", "/vitrina", "/audio"];

export type CursorTema = { tipo: "preset"; id: CursorId } | { tipo: "propio"; imagen: string } | null;

export type ConfigIconos = { set: SetIconos; propios: Partial<Record<RutaSeccion, string>> };

/**
 * Todo lo que la usuaria eligió en Personalización, ya validado. Sale de su
 * fila de `temas` (la que apunta `perfiles.tema_activo_id`) y es lo único
 * que usan el CSS del tema y los componentes.
 */
export type ConfigTema = {
  preset: PresetId;
  colores: Record<ModoColor, ColoresPropios>;
  fuenteDiario: FuenteDiarioId | null;
  fuenteInterfaz: FuenteInterfazId | null;
  cursor: CursorTema;
  iconos: ConfigIconos;
};

export const CONFIG_POR_DEFECTO: ConfigTema = {
  preset: TEMA_POR_DEFECTO.id as PresetId,
  colores: { claro: {}, oscuro: {} },
  fuenteDiario: null,
  fuenteInterfaz: null,
  cursor: null,
  iconos: { set: "trazo", propios: {} },
};

const HEX = /^#[0-9a-fA-F]{6}$/;
/** Solo PNG en base64 que generó el servidor (sharp vuelve a codificar todo
 * lo que se sube): nada que pueda cerrar el `url(...)` del CSS. */
const IMAGEN_PROPIA = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;
export const TAMANO_MAXIMO_IMAGEN_PROPIA = 60_000;

export function esHex(valor: unknown): valor is string {
  return typeof valor === "string" && HEX.test(valor);
}

export function esImagenPropia(valor: unknown): valor is string {
  return typeof valor === "string" && valor.length <= TAMANO_MAXIMO_IMAGEN_PROPIA && IMAGEN_PROPIA.test(valor);
}

function coloresValidos(crudo: unknown): ColoresPropios {
  const salida: ColoresPropios = {};
  if (!crudo || typeof crudo !== "object") return salida;
  for (const clave of COLORES_EDITABLES) {
    const valor = (crudo as Record<string, unknown>)[clave];
    if (esHex(valor)) salida[clave] = valor.toUpperCase();
  }
  return salida;
}

/**
 * Colores y letras se guardan POR TEMA: cada tema con nombre recuerda su
 * propia personalización, así cambiar de tema no borra nada y al volver se
 * lo encuentra como se dejó. En la base es `{ temas: { retro: …, void: … } }`.
 *
 * Las filas anteriores a este cambio guardaban un solo juego suelto
 * (`{ claro, oscuro }` / `{ diario, interfaz }`): se lee como el del tema que
 * estaba activo.
 */
export function porTema(crudo: unknown, presetActivo: PresetId): Partial<Record<PresetId, unknown>> {
  if (!crudo || typeof crudo !== "object") return {};
  const objeto = crudo as Record<string, unknown>;
  if (objeto.temas && typeof objeto.temas === "object") {
    const salida: Partial<Record<PresetId, unknown>> = {};
    for (const [id, valor] of Object.entries(objeto.temas as Record<string, unknown>)) {
      if (esPreset(id)) salida[id] = valor;
    }
    return salida;
  }
  return Object.keys(objeto).length > 0 ? { [presetActivo]: objeto } : {};
}

/** `tipografia` es una columna de texto con JSON adentro. */
export function leerTipografia(crudo: unknown): unknown {
  if (typeof crudo !== "string") return {};
  try {
    return JSON.parse(crudo);
  } catch {
    return {};
  }
}

/** Fila de `temas` (tal como viene de la base) → configuración validada.
 * Cualquier valor raro se descarta en vez de llegar al CSS. */
export function configDesdeFila(fila: {
  preset?: unknown;
  colores?: unknown;
  tipografia?: unknown;
  cursor?: unknown;
  iconos?: unknown;
} | null): ConfigTema {
  if (!fila) return CONFIG_POR_DEFECTO;

  const preset = esPreset(fila.preset) ? fila.preset : CONFIG_POR_DEFECTO.preset;
  const colores = (porTema(fila.colores, preset)[preset] ?? {}) as Record<string, unknown>;
  const tipografia = (porTema(leerTipografia(fila.tipografia), preset)[preset] ?? {}) as Record<string, unknown>;

  let cursor: CursorTema = null;
  if (typeof fila.cursor === "string") {
    if (fila.cursor.startsWith("preset:") && esCursor(fila.cursor.slice(7))) {
      cursor = { tipo: "preset", id: fila.cursor.slice(7) as CursorId };
    } else if (esImagenPropia(fila.cursor)) {
      cursor = { tipo: "propio", imagen: fila.cursor };
    }
  }

  const iconosCrudos = (fila.iconos ?? {}) as { set?: unknown; propios?: Record<string, unknown> };
  const propios: ConfigIconos["propios"] = {};
  for (const ruta of RUTAS_ICONOS) {
    const imagen = iconosCrudos.propios?.[ruta];
    if (esImagenPropia(imagen)) propios[ruta] = imagen;
  }

  return {
    preset,
    colores: { claro: coloresValidos(colores.claro), oscuro: coloresValidos(colores.oscuro) },
    fuenteDiario: esFuenteDiario(tipografia.diario) ? tipografia.diario : null,
    fuenteInterfaz: esFuenteInterfaz(tipografia.interfaz) ? tipografia.interfaz : null,
    cursor,
    iconos: {
      set: SETS_ICONOS.includes(iconosCrudos.set as SetIconos) ? (iconosCrudos.set as SetIconos) : "trazo",
      propios,
    },
  };
}

/** La paleta que se ve en un modo: la del preset con los colores propios
 * encima, y los derivados (tarjeta, bordes) acompañándolos — ver
 * `derivados.ts`. */
export function paletaEfectiva(config: ConfigTema, modo: ModoColor): PaletaTema {
  return paletaDerivada(config.preset, modo, config.colores[modo]);
}
