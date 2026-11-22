import type { SupabaseClient } from "@supabase/supabase-js";
import { claveCategoria } from "./nombre";

export { claveCategoria };

/** Busca una categoría por nombre para este usuario o la crea si no existe
 * — así cualquier módulo (diario, listas, vitrina, audio) puede asignar
 * categorías al vuelo sin una pantalla dedicada de gestión.
 *
 * La comparación no distingue mayúsculas: escribir "viajes" reusa "Viajes".
 * Se traen todas las categorías de la usuaria y se compara acá (son pocas, y
 * así no hay que escapar comodines de `ilike`). Si ya había duplicadas de
 * antes, gana la más vieja. */
export async function resolverCategoriaId(
  supabase: SupabaseClient,
  usuarioId: string,
  nombreCategoria: string,
): Promise<string | null> {
  const nombre = nombreCategoria.normalize("NFC").trim().replace(/\s+/g, " ");
  if (!nombre) return null;

  const { data: existentes, error: errorBusqueda } = await supabase
    .from("categorias")
    .select("id, nombre")
    .eq("usuario_id", usuarioId)
    .order("created_at", { ascending: true });

  if (errorBusqueda) throw errorBusqueda;
  const clave = claveCategoria(nombre);
  const existente = (existentes ?? []).find(
    (fila) => claveCategoria(fila.nombre as string) === clave,
  );
  if (existente) return existente.id as string;

  const { data: nueva, error: errorCreacion } = await supabase
    .from("categorias")
    .insert({ usuario_id: usuarioId, nombre })
    .select("id")
    .single();

  if (errorCreacion) throw errorCreacion;
  return nueva.id as string;
}
