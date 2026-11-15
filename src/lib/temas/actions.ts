"use server";

import { createClient } from "@/lib/supabase/server";
import type { RutaSeccion } from "@/components/iconos-secciones";
import { COLORES_EDITABLES, esHex, RUTAS_ICONOS, SETS_ICONOS, type ColoresPropios, type SetIconos } from "./config";
import { esCursor } from "./cursores";
import { esFuenteDiario, esFuenteInterfaz } from "./fuentes";
import { filaTemaActiva } from "./fila";
import { esPreset } from "./presets";
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

/** Elegir un tema con nombre. Vuelve a sus colores y letras (los propios se
 * descartan): cambiar de tema es empezar de su look. Cursor e iconos se
 * conservan, porque no son parte del tema. */
export async function elegirPreset(preset: string) {
  if (!esPreset(preset)) throw new Error("preset");
  await actualizar({ preset, colores: {}, tipografia: null });
}

/** Colores propios de un modo (claro u oscuro). */
export async function guardarColores(modo: ModoColor, colores: ColoresPropios) {
  if (modo !== "claro" && modo !== "oscuro") throw new Error("modo");
  const limpios: ColoresPropios = {};
  for (const clave of COLORES_EDITABLES) {
    const valor = colores[clave];
    if (esHex(valor)) limpios[clave] = valor.toUpperCase();
  }
  const actuales = ((await leerColumna<Record<string, unknown>>("colores")) ?? {}) as Record<string, unknown>;
  await actualizar({ colores: { ...actuales, [modo]: limpios } });
}

export async function restablecerColores(modo: ModoColor) {
  await guardarColores(modo, {});
}

export async function guardarTipografia(diario: string | null, interfaz: string | null) {
  const valor = {
    ...(esFuenteDiario(diario) ? { diario } : {}),
    ...(esFuenteInterfaz(interfaz) ? { interfaz } : {}),
  };
  await actualizar({ tipografia: Object.keys(valor).length ? JSON.stringify(valor) : null });
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
