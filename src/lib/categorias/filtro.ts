import { esUuid } from "@/lib/uuid";
import { listarCategorias } from "./queries";
import type { Categoria } from "./types";

/**
 * Trae las categorías de la usuaria y, en paralelo, lo que lista la sección
 * filtrado por el `?categoria=` de la URL — y decide qué hacer si ese id no
 * sirve. Compartido por Diario, Listas, Audio y Vitrina para que los cuatro
 * respondan igual a un enlace roto.
 *
 * Un id que no es de una categoría suya (borrada, de otra cuenta, mal
 * copiado) se ignora y se ve todo, como "Todas las categorías": antes el
 * menú decía "Todas" mientras la lista decía "no hay nada con esa
 * categoría", y las dos cosas no podían ser ciertas a la vez. Lo que ni
 * siquiera tiene forma de uuid no llega a Postgres (lo rechazaría con un
 * error en vez de devolver nada).
 *
 * El caso normal sigue siendo un solo viaje en paralelo; solo el enlace roto
 * paga una segunda consulta, sin filtro, después de comprobar que la
 * categoría no existe.
 */
export async function listarConFiltroCategoria<T>(
  valorUrl: string | string[] | undefined,
  listar: (categoriaId: string | undefined) => Promise<T>,
): Promise<{ categorias: Categoria[]; categoriaActual: Categoria | null; resultado: T }> {
  // `?categoria=a&categoria=b` llega como array aunque el tipo diga string.
  const candidata = esUuid(valorUrl) ? valorUrl : undefined;

  const [categorias, filtrado] = await Promise.all([listarCategorias(), listar(candidata)]);

  if (!candidata) return { categorias, categoriaActual: null, resultado: filtrado };

  const categoriaActual = categorias.find((cat) => cat.id === candidata) ?? null;
  if (categoriaActual) return { categorias, categoriaActual, resultado: filtrado };

  return { categorias, categoriaActual: null, resultado: await listar(undefined) };
}
