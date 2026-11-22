import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizarHashtags, unificarHashtags } from "./hashtags";

/**
 * Los hashtags de un formulario listos para guardar: normalizados y unidos
 * con los que la cuenta ya usa (ver `unificarHashtags`), así `#cafe` desde un
 * teclado sin tildes cae en el `#café` que ya existía. RLS deja ver solo las
 * piezas propias. Si la lectura falla se guardan tal como se escribieron:
 * mejor un filtro duplicado que perder la pieza.
 *
 * Al editar, la pieza misma no cuenta (`excluirId`): si no, corregir `#cafe`
 * a `#café` en la única pieza que lo usa volvería a dejarlo sin tilde.
 */
export async function resolverHashtags(
  supabase: SupabaseClient,
  crudo: string,
  excluirId?: string,
): Promise<string[]> {
  const nuevos = normalizarHashtags(crudo);
  if (nuevos.length === 0) return nuevos;

  let consulta = supabase.from("imagenes").select("hashtags");
  if (excluirId) consulta = consulta.neq("id", excluirId);
  const { data, error } = await consulta;
  if (error) return nuevos;
  const existentes = (data ?? []).flatMap((fila) => (fila.hashtags as string[] | null) ?? []);
  return unificarHashtags(nuevos, existentes);
}
