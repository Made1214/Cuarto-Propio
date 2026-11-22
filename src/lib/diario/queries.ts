import { createClient } from "@/lib/supabase/server";
import { normalizarCategoria } from "@/lib/categorias/queries";
import { paginar, type Pagina } from "@/lib/paginacion";
import { claveMes, inicioDeMes } from "@/lib/fechas/zona";
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
  sinCategoria = false,
  mes,
  busqueda,
  hasta,
  contar = false,
  zona = "UTC",
}: {
  categoriaId?: string;
  /** Solo las entradas sin categoría (`?categoria=ninguna`). Si también viene
   * `categoriaId`, gana la categoría concreta. */
  sinCategoria?: boolean;
  /** `YYYY-MM`; un valor que no tenga esa forma se ignora. */
  mes?: string;
  busqueda?: string;
  hasta?: string;
  contar?: boolean;
  /** Zona horaria con la que se lee `mes` (ver `src/lib/fechas/zona.ts`). */
  zona?: string;
} = {}): Promise<Pagina<EntradaResumen>> {
  const supabase = await createClient();
  const termino = busqueda?.trim();
  const rango = rangoDeMes(mes, zona);

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
    } else if (sinCategoria) {
      query = query.is("categoria_id", null);
    }
    if (rango) {
      query = query.gte("fecha", rango.desde).lt("fecha", rango.hasta);
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

const FORMATO_MES = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** Valor de `?mes=` si tiene forma de `YYYY-MM`; si no, `undefined` (sin filtro). */
export function mesValido(valor: unknown): string | undefined {
  return typeof valor === "string" && FORMATO_MES.test(valor) ? valor : undefined;
}

/** Rango `[desde, hasta)` del mes `YYYY-MM` tal como se vive en `zona`
 * (en instantes UTC, que es como se guardan), o `null` si no es válido. */
export function rangoDeMes(
  mes: string | undefined,
  zona = "UTC",
): { desde: string; hasta: string } | null {
  const coincide = mes ? FORMATO_MES.exec(mes) : null;
  if (!coincide) return null;
  const anio = Number(coincide[1]);
  const indice = Number(coincide[2]) - 1;
  return {
    desde: inicioDeMes(anio, indice, zona).toISOString(),
    hasta: inicioDeMes(anio, indice + 1, zona).toISOString(),
  };
}

export type ConteosDiario = {
  total: number;
  sinCategoria: number;
  porCategoria: Record<string, number>;
  /** Meses con entradas (`YYYY-MM`, en la zona de la usuaria), del más nuevo al más viejo. */
  porMes: { mes: string; cantidad: number }[];
};

/** Agrega los conteos de la columna de filtros a partir de las filas crudas. */
export function agregarConteos(
  filas: { fecha: string; categoria_id: string | null }[],
  zona = "UTC",
): ConteosDiario {
  const porCategoria: Record<string, number> = {};
  const meses = new Map<string, number>();
  let sinCategoria = 0;

  for (const { fecha, categoria_id } of filas) {
    if (categoria_id) porCategoria[categoria_id] = (porCategoria[categoria_id] ?? 0) + 1;
    else sinCategoria += 1;

    const instante = new Date(fecha);
    if (Number.isNaN(instante.getTime())) continue;
    const mes = claveMes(instante, zona);
    meses.set(mes, (meses.get(mes) ?? 0) + 1);
  }

  return {
    total: filas.length,
    sinCategoria,
    porCategoria,
    porMes: [...meses]
      .map(([mes, cantidad]) => ({ mes, cantidad }))
      .sort((a, b) => (a.mes < b.mes ? 1 : a.mes > b.mes ? -1 : 0)),
  };
}

/** Conteos del diario entero (no dependen de los filtros). Trae solo dos
 * columnas de cada entrada y agrega acá: a esta escala no vale una función SQL. */
export async function contarEntradasDiario(zona = "UTC"): Promise<ConteosDiario> {
  const supabase = await createClient();
  const filas: { fecha: string; categoria_id: string | null }[] = [];

  // De a tandas: PostgREST corta cada respuesta en 1000 filas, y con un
  // diario más largo que eso los conteos quedarían cortos sin avisar.
  for (let desde = 0; ; desde += TANDA_CONTEO) {
    const { data, error } = await supabase
      .from("entradas")
      .select("fecha, categoria_id")
      .order("id")
      .range(desde, desde + TANDA_CONTEO - 1);
    if (error) throw error;
    filas.push(...((data ?? []) as typeof filas));
    if (!data || data.length < TANDA_CONTEO) break;
  }

  return agregarConteos(filas, zona);
}

const TANDA_CONTEO = 1000;

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
