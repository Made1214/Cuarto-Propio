import { createClient } from "@/lib/supabase/server";
import { normalizarCategoria } from "@/lib/categorias/queries";
import { paginar, type Pagina } from "@/lib/paginacion";
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

/** Notas por página: cada una lleva su reproductor, así que con 20 la
 * pantalla ya da para un buen rato de scroll. */
export const TAMANO_PAGINA_AUDIO = 20;

/**
 * Notas para el archivo, de a una página (qué es `hasta` y por qué vive en
 * la URL: `src/lib/paginacion.ts`). Que todo lo visible lo renderice el
 * servidor es lo que mantiene funcionando el `refresh()` de las actions de
 * Audio: renombrar o borrar una nota de la página 3 vuelve con la página 3
 * al día, igual que la 1.
 *
 * `contar` agrega el total que cumple el filtro, para el "N notas" que se
 * muestra solo al filtrar.
 */
export async function listarAudios({
  categoriaId,
  hasta,
  contar = false,
}: {
  categoriaId?: string;
  hasta?: string;
  contar?: boolean;
} = {}): Promise<Pagina<NotaAudioConUrl>> {
  const supabase = await createClient();

  const consulta = () => {
    let query = supabase
      .from("audios")
      .select(CAMPOS, contar ? { count: "exact" } : undefined)
      .order("fecha", { ascending: false })
      .order("id", { ascending: false });

    if (categoriaId) {
      query = query.eq("categoria_id", categoriaId);
    }
    return query;
  };

  const pagina = await paginar({ hasta, tamano: TAMANO_PAGINA_AUDIO, consulta });

  const notas = pagina.filas.map(mapear);
  // Una sola llamada a Storage para toda la página, no una por nota.
  const firmadas = await firmarPaths(
    supabase,
    notas.map((nota) => nota.archivoPath),
  );

  return {
    ...pagina,
    filas: notas.map((nota) => ({ ...nota, url: firmadas.get(nota.archivoPath) ?? null })),
  };
}
