import { createClient } from "@/lib/supabase/server";
import { normalizarCategoria } from "@/lib/categorias/queries";
import type { ListaConItems } from "./types";

export async function listarListas(filtros: { categoriaId?: string } = {}): Promise<ListaConItems[]> {
  const supabase = await createClient();
  let query = supabase
    .from("listas")
    .select(
      "id, nombre, categoria_id, con_casillas, categoria:categorias(id, nombre), items_lista(id, contenido, marcado, orden)",
    )
    .order("created_at", { ascending: false });

  if (filtros.categoriaId) {
    query = query.eq("categoria_id", filtros.categoriaId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((fila) => {
    const categoria = normalizarCategoria(fila.categoria);
    const conCasillas = fila.con_casillas as boolean;
    const items = (
      (fila.items_lista as { id: string; contenido: string; marcado: boolean; orden: number }[] | null) ?? []
    )
      .slice()
      .sort((a, b) => a.orden - b.orden);

    // En una lista de casillas lo tachado baja al fondo para que lo
    // pendiente quede a la vista. El sort de JS es estable, así que dentro
    // de cada grupo se conserva el `orden` elegido a mano.
    if (conCasillas) {
      items.sort((a, b) => Number(a.marcado) - Number(b.marcado));
    }

    return {
      id: fila.id as string,
      nombre: fila.nombre as string,
      categoriaId: (fila.categoria_id as string | null) ?? null,
      categoriaNombre: categoria?.nombre ?? null,
      conCasillas,
      items: items.map((item) => ({
        id: item.id,
        contenido: item.contenido,
        marcado: item.marcado,
      })),
    };
  });
}
