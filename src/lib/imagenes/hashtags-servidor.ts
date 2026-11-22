import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizarHashtags, unificarHashtags } from "./hashtags";

/**
 * Los hashtags de un formulario listos para guardar: normalizados y unidos
 * con los que la cuenta ya usa (ver `unificarHashtags`), así `#cafe` desde un
 * teclado sin tildes cae en el `#café` que ya existía. RLS deja ver solo las
 * piezas propias. Si la lectura falla se guardan tal como se escribieron:
 * mejor un filtro duplicado que perder la pieza.
 */
export async function resolverHashtags(supabase: SupabaseClient, crudo: string): Promise<string[]> {
  const nuevos = normalizarHashtags(crudo);
  if (nuevos.length === 0) return nuevos;

  const { data, error } = await supabase.from("imagenes").select("hashtags");
  if (error) return nuevos;
  const existentes = (data ?? []).flatMap((fila) => (fila.hashtags as string[] | null) ?? []);
  return unificarHashtags(nuevos, existentes);
}
