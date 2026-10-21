import { createClient } from "@/lib/supabase/server";
import { normalizarCategoria } from "@/lib/categorias/queries";
import { firmarPaths } from "./almacenamiento";
import type { NotaAudio, NotaAudioConUrl } from "./types";

const CAMPOS =
  "id, titulo, categoria_id, archivo_path, duracion_segundos, fecha, categoria:categorias(id, nombre)";

function mapear(fila: Record<string, unknown>): NotaAudio {
  const categoria = normalizarCategoria(fila.categoria);
  return {
    id: fila.id as string,
    titulo: (fila.titulo as string | null) ?? null,
    categoriaId: (fila.categoria_id as string | null) ?? null,
    categoriaNombre: categoria?.nombre ?? null,
    duracionSegundos: (fila.duracion_segundos as number | null) ?? null,
    archivoPath: fila.archivo_path as string,
    fecha: fila.fecha as string,
  };
}

export async function listarAudios(
  filtros: { categoriaId?: string } = {},
): Promise<NotaAudioConUrl[]> {
  const supabase = await createClient();
  let query = supabase.from("audios").select(CAMPOS).order("fecha", { ascending: false });

  if (filtros.categoriaId) {
    query = query.eq("categoria_id", filtros.categoriaId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const notas = (data ?? []).map(mapear);
  // Una sola llamada a Storage para toda la página, no una por nota.
  const firmadas = await firmarPaths(
    supabase,
    notas.map((nota) => nota.archivoPath),
  );

  return notas.map((nota) => ({ ...nota, url: firmadas.get(nota.archivoPath) ?? null }));
}
