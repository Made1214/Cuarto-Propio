import { createClient } from "@/lib/supabase/server";
import { normalizarCategoria } from "@/lib/categorias/queries";
import { paginar, type Pagina } from "@/lib/paginacion";
import { firmarPaths } from "./almacenamiento";
import type {
  HashtagConteo,
  Imagen,
  ImagenConVersionCompleta,
  ImagenEnVitrina,
} from "./types";

const CAMPOS =
  "id, codigo, titulo, descripcion, hashtags, categoria_id, miniatura_path, completa_path, ancho, alto, fecha, categoria:categorias(id, nombre)";

type FilaImagen = Record<string, unknown>;

function mapear(fila: FilaImagen): Imagen {
  const categoria = normalizarCategoria(fila.categoria);
  return {
    id: fila.id as string,
    codigo: fila.codigo as string,
    titulo: (fila.titulo as string | null) ?? null,
    descripcion: (fila.descripcion as string | null) ?? null,
    hashtags: ((fila.hashtags as string[] | null) ?? []).slice().sort(),
    categoriaId: (fila.categoria_id as string | null) ?? null,
    categoriaNombre: categoria?.nombre ?? null,
    miniaturaPath: fila.miniatura_path as string,
    completaPath: fila.completa_path as string,
    ancho: (fila.ancho as number | null) ?? null,
    alto: (fila.alto as number | null) ?? null,
    fecha: fila.fecha as string,
  };
}

/** Piezas por página: cuatro filas de una pared de escritorio ancha (y
 * múltiplo de 2, 3 y 4 columnas, para que cada tanda llene parejo). */
export const TAMANO_PAGINA_VITRINA = 24;

/**
 * Piezas para la cuadrícula, de a una página (qué es `hasta` y por qué vive
 * en la URL: `src/lib/paginacion.ts`). Solo se firman las miniaturas de lo
 * que se va a mostrar, y las ya vistas salen del caché de firmas.
 *
 * `contar` agrega el total que cumple los filtros, para el "N piezas" que se
 * muestra solo al filtrar.
 */
export async function listarImagenes({
  hashtag,
  categoriaId,
  hasta,
  contar = false,
}: {
  hashtag?: string;
  categoriaId?: string;
  hasta?: string;
  contar?: boolean;
} = {}): Promise<Pagina<ImagenEnVitrina>> {
  const supabase = await createClient();
  const etiqueta = hashtag?.trim().toLowerCase();

  const consulta = () => {
    let query = supabase
      .from("imagenes")
      .select(CAMPOS, contar ? { count: "exact" } : undefined)
      .order("fecha", { ascending: false })
      .order("id", { ascending: false });

    if (categoriaId) {
      query = query.eq("categoria_id", categoriaId);
    }
    if (etiqueta) {
      // `contains` sobre el array: la fila tiene que incluir ese hashtag.
      query = query.contains("hashtags", [etiqueta]);
    }
    return query;
  };

  const pagina = await paginar({ hasta, tamano: TAMANO_PAGINA_VITRINA, consulta });

  const imagenes = pagina.filas.map(mapear);
  // Una sola llamada a Storage para toda la cuadrícula, no una por tarjeta.
  const firmadas = await firmarPaths(
    supabase,
    imagenes.map((imagen) => imagen.miniaturaPath),
  );

  return {
    ...pagina,
    filas: imagenes.map((imagen) => ({
      ...imagen,
      miniaturaUrl: firmadas.get(imagen.miniaturaPath) ?? null,
    })),
  };
}

export async function obtenerImagenPorCodigo(
  codigo: string,
): Promise<ImagenConVersionCompleta | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("imagenes")
    .select(CAMPOS)
    .eq("codigo", codigo)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const imagen = mapear(data);
  const firmadas = await firmarPaths(supabase, [imagen.miniaturaPath, imagen.completaPath]);

  return {
    ...imagen,
    miniaturaUrl: firmadas.get(imagen.miniaturaPath) ?? null,
    completaUrl: firmadas.get(imagen.completaPath) ?? null,
  };
}

/** Hashtags del usuario con cuántas fotos tiene cada uno, de más usado a
 * menos. Se cuenta en JS y no en SQL a propósito: son cientos de filas, no
 * millones, y así no hace falta una vista ni una función extra en la base. */
export async function listarHashtags(): Promise<HashtagConteo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("imagenes").select("hashtags");
  if (error) throw error;

  const conteos = new Map<string, number>();
  for (const fila of data ?? []) {
    for (const hashtag of (fila.hashtags as string[] | null) ?? []) {
      conteos.set(hashtag, (conteos.get(hashtag) ?? 0) + 1);
    }
  }

  return [...conteos.entries()]
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre));
}

/**
 * Fotos para acompañar a una que se está mirando: primero las que comparten
 * algún hashtag, después las de su misma categoría y, si falta, las más
 * recientes. Sin esa última tanda la columna de al lado quedaría vacía
 * justo al principio, que es cuando todavía no hay hashtags puestos.
 */
export async function listarRelacionadas(
  imagen: Imagen,
  limite = 8,
): Promise<ImagenEnVitrina[]> {
  const supabase = await createClient();

  const base = () =>
    supabase
      .from("imagenes")
      .select(CAMPOS)
      .neq("id", imagen.id)
      .order("fecha", { ascending: false })
      .limit(limite);

  // Las tres consultas son independientes: van en paralelo y no una detrás
  // de otra (eran tres idas y vueltas a la base en fila antes de poder
  // dibujar la ficha). El orden de prioridad lo pone el armado de abajo, no
  // el orden en que llegan.
  const respuestas = await Promise.all([
    imagen.hashtags.length > 0 ? base().overlaps("hashtags", imagen.hashtags) : null,
    imagen.categoriaId ? base().eq("categoria_id", imagen.categoriaId) : null,
    base(),
  ]);

  const tandas: FilaImagen[][] = [];
  for (const respuesta of respuestas) {
    if (!respuesta) continue;
    if (respuesta.error) throw respuesta.error;
    tandas.push(respuesta.data ?? []);
  }

  const elegidas: Imagen[] = [];
  const vistas = new Set<string>();
  for (const tanda of tandas) {
    for (const fila of tanda) {
      if (elegidas.length >= limite) break;
      const otra = mapear(fila);
      if (vistas.has(otra.id)) continue;
      vistas.add(otra.id);
      elegidas.push(otra);
    }
  }

  const firmadas = await firmarPaths(
    supabase,
    elegidas.map((otra) => otra.miniaturaPath),
  );

  return elegidas.map((otra) => ({
    ...otra,
    miniaturaUrl: firmadas.get(otra.miniaturaPath) ?? null,
  }));
}
