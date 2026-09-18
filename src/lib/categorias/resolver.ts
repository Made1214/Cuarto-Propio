import type { SupabaseClient } from "@supabase/supabase-js";

/** Busca una categoría por nombre para este usuario o la crea si no existe
 * — así cualquier módulo (diario, listas, galería, audio) puede asignar
 * categorías al vuelo sin una pantalla dedicada de gestión. */
export async function resolverCategoriaId(
  supabase: SupabaseClient,
  usuarioId: string,
  nombreCategoria: string,
): Promise<string | null> {
  const nombre = nombreCategoria.trim();
  if (!nombre) return null;

  const { data: existente, error: errorBusqueda } = await supabase
    .from("categorias")
    .select("id")
    .eq("usuario_id", usuarioId)
    .eq("nombre", nombre)
    .maybeSingle();

  if (errorBusqueda) throw errorBusqueda;
  if (existente) return existente.id as string;

  const { data: nueva, error: errorCreacion } = await supabase
    .from("categorias")
    .insert({ usuario_id: usuarioId, nombre })
    .select("id")
    .single();

  if (errorCreacion) throw errorCreacion;
  return nueva.id as string;
}
