import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FormatoAudio } from "./formato";

/** El bucket es privado (ver 0001_esquema_completo.sql): nada se sirve por
 * URL pública, todo pasa por URLs firmadas que vencen solas. */
const BUCKET = "audios";

/** Una hora, igual que en la Vitrina: alcanza de sobra para escuchar las
 * notas de la página y corto para que una URL copiada por accidente no
 * quede viva para siempre. */
const SEGUNDOS_FIRMA = 60 * 60;

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
    .upload(path, contenido, { contentType: formato.mime });
  if (error) throw error;

  return path;
}

/** Firma varias rutas de una sola llamada y devuelve un mapa ruta → URL. Una
 * ruta que falle queda fuera del mapa en vez de tumbar la página entera: esa
 * nota muestra su aviso y el resto se sigue pudiendo escuchar. */
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

export async function borrarPath(supabase: SupabaseClient, path: string): Promise<void> {
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
