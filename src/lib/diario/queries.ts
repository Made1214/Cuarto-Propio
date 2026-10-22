import { createClient } from "@/lib/supabase/server";
import { normalizarCategoria } from "@/lib/categorias/queries";
import { paginar, type Pagina } from "@/lib/paginacion";
import type { Entrada, EntradaResumen } from "./types";

const LARGO_EXTRACTO = 220;

/** Entradas por página del listado: un mes intenso de diario entra en una o
 * dos, y la primera carga ya no trae el archivo entero. */
export const TAMANO_PAGINA_DIARIO = 20;

/**
 * Entradas para el listado cronológico, de a una página (qué es `hasta` y
 * por qué vive en la URL: `src/lib/paginacion.ts`).
 *
 * `contar` agrega el total que cumple los filtros, para el "N entradas" que
 * se muestra solo al filtrar — sin filtro nadie lo ve, así que no se cuenta.
 * Contar no suma idas a la red: PostgREST lo calcula en la misma consulta.
 * Lo que cuesta es recorrer todas las coincidencias y no solo la página, y a
 * esta escala (cientos de entradas) es poco: la búsqueda va por el índice GIN
 * `entradas_busqueda_idx` sobre `busqueda` (0001_esquema_completo.sql) y el
 * filtro de RLS se resuelve una sola vez por consulta (0009). `"estimated"`
 * no ahorraría nada: PostgREST igual cuenta exacto por debajo de `max-rows`
 * (1000), que es donde vive este diario.
 *
 * El extracto se sigue cortando acá y no en la base: sale de
 * `contenido_texto` completo, que es lo único que se baja de más por
 * entrada. Recortarlo en SQL pediría una migración (columna generada con
 * `left(...)`), y con 20 entradas por página ya pesa poco.
 */
export async function listarEntradas({
  categoriaId,
  busqueda,
  hasta,
  contar = false,
}: {
  categoriaId?: string;
  busqueda?: string;
  hasta?: string;
  contar?: boolean;
} = {}): Promise<Pagina<EntradaResumen>> {
  const supabase = await createClient();
  const termino = busqueda?.trim();

  const consulta = () => {
    let query = supabase
      .from("entradas")
      .select(
        "id, codigo, titulo, fecha, contenido_texto, categoria:categorias(id, nombre)",
        contar ? { count: "exact" } : undefined,
      )
      .order("fecha", { ascending: false })
      .order("id", { ascending: false });

    if (categoriaId) {
      query = query.eq("categoria_id", categoriaId);
    }
    if (termino) {
      query = query.textSearch("busqueda", termino, {
        type: "websearch",
        config: "spanish",
      });
    }
    return query;
  };

  const pagina = await paginar({ hasta, tamano: TAMANO_PAGINA_DIARIO, consulta });

  return {
    ...pagina,
    filas: pagina.filas.map((fila) => ({
      id: fila.id as string,
      codigo: fila.codigo as string,
      titulo: fila.titulo as string | null,
      fecha: fila.fecha as string,
      categoria: normalizarCategoria(fila.categoria),
      extracto: ((fila.contenido_texto as string | null) ?? "").slice(0, LARGO_EXTRACTO),
    })),
  };
}

export async function obtenerEntradaPorCodigo(codigo: string): Promise<Entrada | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entradas")
    .select("id, codigo, titulo, contenido, fecha, categoria_id, categoria:categorias(id, nombre)")
    .eq("codigo", codigo)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const categoria = normalizarCategoria(data.categoria);

  return {
    id: data.id as string,
    codigo: data.codigo as string,
    titulo: data.titulo as string | null,
    contenido: data.contenido as Entrada["contenido"],
    fecha: data.fecha as string,
    categoriaId: (data.categoria_id as string | null) ?? null,
    categoriaNombre: categoria?.nombre ?? null,
  };
}
