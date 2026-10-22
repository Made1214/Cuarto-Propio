import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CACHE_CONTROL_INMUTABLE, firmarConCache, olvidarFirmas } from "@/lib/storage/firmas";
import type { FormatoAudio } from "./formato";

/** El bucket es privado (ver 0001_esquema_completo.sql): nada se sirve por
 * URL pública, todo pasa por URLs firmadas que vencen solas (cuánto duran y
 * por qué se reutilizan, igual que en la Vitrina: `src/lib/storage/firmas.ts`). */
const BUCKET = "audios";

/** Primer nivel de la ruta = `usuario_id`, que es lo que miran las políticas
 * de Storage. El segundo dice de qué módulo vino el archivo, para poder
 * limpiar o migrar por módulo más adelante. */
type CarpetaAudio = "notas";

export async function guardarAudio(
  supabase: SupabaseClient,
  usuarioId: string,
  contenido: Buffer,
  formato: FormatoAudio,
  carpeta: CarpetaAudio = "notas",
): Promise<string> {
  const path = `${usuarioId}/${carpeta}/${randomUUID()}.${formato.extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, contenido, {
      contentType: formato.mime,
      cacheControl: CACHE_CONTROL_INMUTABLE,
    });
  if (error) throw error;

  return path;
}

/** Firma varias rutas de una sola llamada y devuelve un mapa ruta → URL. Una
 * ruta que falle queda fuera del mapa en vez de tumbar la página entera: esa
 * nota muestra su aviso y el resto se sigue pudiendo escuchar.
 *
 * La misma ruta devuelve la misma URL durante horas, para que el navegador
 * no vuelva a bajar cada audio en cada visita. Por eso solo puede recibir
 * rutas salidas de una consulta con RLS, nunca rutas que mande el cliente
 * (ver `src/lib/storage/firmas.ts`). */
export function firmarPaths(
  supabase: SupabaseClient,
  paths: string[],
): Promise<Map<string, string>> {
  return firmarConCache(supabase, BUCKET, paths);
}

export async function borrarPath(supabase: SupabaseClient, path: string): Promise<void> {
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
  olvidarFirmas(BUCKET, [path]);
}
