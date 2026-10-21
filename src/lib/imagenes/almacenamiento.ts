import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { VersionesImagen } from "./procesar";

/** El bucket es privado (ver 0001_esquema_completo.sql): nada se sirve por
 * URL pública, todo pasa por URLs firmadas que vencen solas. */
const BUCKET = "imagenes";

/** Una hora: más que suficiente para ver la página y navegarla, y corto para
 * que una URL copiada por accidente no quede viva para siempre. */
const SEGUNDOS_FIRMA = 60 * 60;

/** Primer nivel de la ruta = `usuario_id`, que es lo que miran las políticas
 * de Storage. El segundo dice de qué módulo vino el archivo, para poder
 * limpiar o migrar por módulo más adelante. */
export type CarpetaImagen = "vitrina" | "diario" | "perfil";

export type PathsImagen = { miniaturaPath: string; completaPath: string };

export async function guardarVersiones(
  supabase: SupabaseClient,
  usuarioId: string,
  carpeta: CarpetaImagen,
  versiones: VersionesImagen,
): Promise<PathsImagen> {
  const base = `${usuarioId}/${carpeta}/${randomUUID()}`;
  const miniaturaPath = `${base}-mini.webp`;
  const completaPath = `${base}-full.webp`;

  const { error: errorMiniatura } = await supabase.storage
    .from(BUCKET)
    .upload(miniaturaPath, versiones.miniatura, { contentType: "image/webp" });
  if (errorMiniatura) throw errorMiniatura;

  const { error: errorCompleta } = await supabase.storage
    .from(BUCKET)
    .upload(completaPath, versiones.completa, { contentType: "image/webp" });
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
 * tarjeta muestra su hueco y el resto de la Vitrina sigue viéndose. */
export async function firmarPaths(
  supabase: SupabaseClient,
  paths: string[],
): Promise<Map<string, string>> {
  const unicos = [...new Set(paths)];
  if (unicos.length === 0) return new Map();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(unicos, SEGUNDOS_FIRMA);
  if (error) throw error;

  const firmadas = new Map<string, string>();
  for (const fila of data ?? []) {
    if (fila.signedUrl && fila.path) firmadas.set(fila.path, fila.signedUrl);
  }
  return firmadas;
}

export async function borrarPaths(supabase: SupabaseClient, paths: string[]): Promise<void> {
  const limpias = paths.filter(Boolean);
  if (limpias.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(limpias);
  if (error) throw error;
}
