import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CACHE_CONTROL_INMUTABLE, firmarConCache, olvidarFirmas } from "@/lib/storage/firmas";
import type { TipoMiniatura, VersionesImagen } from "./procesar";

/** El bucket es privado (ver 0001_esquema_completo.sql): nada se sirve por
 * URL pública, todo pasa por URLs firmadas que vencen solas (cuánto duran y
 * por qué se reutilizan: `src/lib/storage/firmas.ts`). */
const BUCKET = "imagenes";

/** Primer nivel de la ruta = `usuario_id`, que es lo que miran las políticas
 * de Storage. El segundo dice de qué módulo vino el archivo, para poder
 * limpiar o migrar por módulo más adelante. */
export type CarpetaImagen = "vitrina" | "diario" | "perfil";

export type PathsImagen = { miniaturaPath: string; completaPath: string };

/**
 * Sufijo del archivo de cada forma de miniatura. Cada forma tiene el suyo
 * para que la ruta guardada en la base diga sola qué hay adentro, sin una
 * columna extra: `-mini.webp` son las miniaturas de antes (800 px de ancho,
 * también las de la foto de perfil), `-grid.webp` las de la cuadrícula
 * actual y `-avatar.webp` el cuadradito del avatar. Así el script
 * `scripts/regenerar-miniaturas.ts` reconoce qué falta rehacer, y quien
 * muestra una miniatura no necesita saber si es vieja o nueva: usa la ruta
 * que tenga la fila, que siempre apunta a un archivo que existe.
 */
export const SUFIJO_MINIATURA: Record<TipoMiniatura, string> = {
  cuadricula: "grid",
  avatar: "avatar",
};

/** Sufijo de las miniaturas anteriores a `SUFIJO_MINIATURA`. */
export const SUFIJO_MINIATURA_LEGADO = "mini";

/** La ruta de otra versión de la misma imagen: todas comparten la base
 * `usuario/carpeta/uuid` y solo cambia el sufijo (`…-mini.webp` →
 * `…-grid.webp`). `null` si la ruta no tiene la forma esperada. */
export function rutaConSufijo(path: string, sufijo: string): string | null {
  const coincidencia = /^(.+)-[a-z]+\.webp$/.exec(path);
  return coincidencia ? `${coincidencia[1]}-${sufijo}.webp` : null;
}

export async function guardarVersiones(
  supabase: SupabaseClient,
  usuarioId: string,
  carpeta: CarpetaImagen,
  versiones: VersionesImagen,
): Promise<PathsImagen> {
  const base = `${usuarioId}/${carpeta}/${randomUUID()}`;
  const miniaturaPath = `${base}-${SUFIJO_MINIATURA[versiones.tipoMiniatura]}.webp`;
  const completaPath = `${base}-full.webp`;

  const opciones = { contentType: "image/webp", cacheControl: CACHE_CONTROL_INMUTABLE };

  const { error: errorMiniatura } = await supabase.storage
    .from(BUCKET)
    .upload(miniaturaPath, versiones.miniatura, opciones);
  if (errorMiniatura) throw errorMiniatura;

  const { error: errorCompleta } = await supabase.storage
    .from(BUCKET)
    .upload(completaPath, versiones.completa, opciones);
  if (errorCompleta) {
    // Sin esto, una subida a medias deja la miniatura huérfana ocupando
    // storage para siempre: no hay fila en la base que la mencione.
    await supabase.storage.from(BUCKET).remove([miniaturaPath]);
    throw errorCompleta;
  }

  return { miniaturaPath, completaPath };
}

/** Firma varias rutas de una sola llamada y devuelve un mapa ruta → URL. Una
 * ruta que falle queda fuera del mapa en vez de tumbar la página entera: la
 * tarjeta muestra su hueco y el resto de la Vitrina sigue viéndose.
 *
 * La misma ruta devuelve la misma URL durante horas, para que el navegador
 * no vuelva a bajar las miniaturas en cada visita. Por eso solo puede recibir
 * rutas salidas de una consulta con RLS, nunca rutas que mande el cliente
 * (ver `src/lib/storage/firmas.ts`). */
export function firmarPaths(
  supabase: SupabaseClient,
  paths: string[],
): Promise<Map<string, string>> {
  return firmarConCache(supabase, BUCKET, paths);
}

export async function borrarPaths(supabase: SupabaseClient, paths: string[]): Promise<void> {
  const limpias = paths.filter(Boolean);
  if (limpias.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(limpias);
  if (error) throw error;
  olvidarFirmas(BUCKET, limpias);
}
