"use server";

import { createClient } from "@/lib/supabase/server";
import type { RutaSeccion } from "@/components/iconos-secciones";
import {
  COLORES_EDITABLES,
  CONFIG_POR_DEFECTO,
  esHex,
  leerTipografia,
  porTema,
  RUTAS_ICONOS,
  SETS_ICONOS,
  type ColoresPropios,
  type SetIconos,
} from "./config";
import { esCursor } from "./cursores";
import { esFuenteDiario, esFuenteInterfaz } from "./fuentes";
import { filaTemaActiva } from "./fila";
import { esPreset, TEMAS_DISPONIBLES, type PresetId } from "./presets";
import type { ModoColor } from "./types";

async function actualizar(cambios: Record<string, unknown>) {
  const supabase = await createClient();
  const { id } = await filaTemaActiva(supabase);
  const { error } = await supabase.from("temas").update(cambios).eq("id", id);
  if (error) throw error;
}

async function leerColumna<T>(columna: string): Promise<T | null> {
  const supabase = await createClient();
  const { id } = await filaTemaActiva(supabase);
  const { data } = await supabase.from("temas").select(columna).eq("id", id).maybeSingle();
  return ((data as Record<string, unknown> | null)?.[columna] as T) ?? null;
}

/** Lo guardado por tema (ver `porTema` en config.ts), ya en la forma nueva. */
async function leerPorTema() {
  const supabase = await createClient();
  const { id } = await filaTemaActiva(supabase);
  const { data } = await supabase.from("temas").select("preset, colores, tipografia").eq("id", id).maybeSingle();
  const preset: PresetId = esPreset(data?.preset) ? data.preset : CONFIG_POR_DEFECTO.preset;
  return {
    preset,
    colores: porTema(data?.colores, preset) as Partial<Record<PresetId, Record<string, unknown>>>,
    tipografia: porTema(leerTipografia(data?.tipografia), preset),
  };
}

/** Elegir un tema con nombre. Cada tema recuerda sus propios colores y
 * letras: no se borra nada, y al volver a un tema se lo encuentra como se
 * dejó. Cursor e iconos no son del tema y se conservan siempre. */
export async function elegirPreset(preset: string) {
  if (!esPreset(preset)) throw new Error("preset");
  // Se reescriben también colores y letras para que una fila en la forma
  // vieja (un solo juego suelto) quede anotada bajo el tema que deja.
  const actual = await leerPorTema();
  await actualizar({
    preset,
    colores: { temas: actual.colores },
    tipografia: JSON.stringify({ temas: actual.tipografia }),
  });
}

/** Colores propios de un modo (claro u oscuro) del tema activo. */
export async function guardarColores(modo: ModoColor, colores: ColoresPropios) {
  if (modo !== "claro" && modo !== "oscuro") throw new Error("modo");
  const limpios: ColoresPropios = {};
  for (const clave of COLORES_EDITABLES) {
    const valor = colores[clave];
    if (esHex(valor)) limpios[clave] = valor.toUpperCase();
  }
  const actual = await leerPorTema();
  await actualizar({
    colores: { temas: { ...actual.colores, [actual.preset]: { ...actual.colores[actual.preset], [modo]: limpios } } },
  });
}

export async function restablecerColores(modo: ModoColor) {
  await guardarColores(modo, {});
}

/** Letras del tema activo. Elegir la que el tema ya trae es lo mismo que no
 * elegir: se guarda vacío, y el tema sigue usando también sus letras de
 * rótulos y títulos. `null` en las dos vuelve a las letras del tema. */
export async function guardarTipografia(diario: string | null, interfaz: string | null) {
  const actual = await leerPorTema();
  const tema = TEMAS_DISPONIBLES[actual.preset];
  const valor = {
    ...(esFuenteDiario(diario) && diario !== tema.fuenteDiario ? { diario } : {}),
    ...(esFuenteInterfaz(interfaz) && interfaz !== tema.fuenteInterfaz ? { interfaz } : {}),
  };
  await actualizar({ tipografia: JSON.stringify({ temas: { ...actual.tipografia, [actual.preset]: valor } }) });
}

/** Un cursor del set curado, o `null` para volver al del sistema. (Los
 * propios se suben por `/api/personalizacion/imagen`.) */
export async function elegirCursor(id: string | null) {
  if (id !== null && !esCursor(id)) throw new Error("cursor");
  await actualizar({ cursor: id ? `preset:${id}` : null });
}

export async function elegirSetIconos(set: string) {
  if (!SETS_ICONOS.includes(set as SetIconos)) throw new Error("iconos");
  const actuales = ((await leerColumna<Record<string, unknown>>("iconos")) ?? {}) as Record<string, unknown>;
  await actualizar({ iconos: { ...actuales, set } });
}

export async function quitarIconoPropio(ruta: string) {
  if (!RUTAS_ICONOS.includes(ruta as RutaSeccion)) throw new Error("ruta");
  const actuales = ((await leerColumna<Record<string, unknown>>("iconos")) ?? {}) as {
    propios?: Record<string, string>;
  };
  const propios = { ...(actuales.propios ?? {}) };
  delete propios[ruta];
  await actualizar({ iconos: { ...actuales, propios } });
}
