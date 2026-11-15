import { cache } from "react";
import { createClient, obtenerUsuario } from "@/lib/supabase/server";
import { CONFIG_POR_DEFECTO, configDesdeFila, type ConfigTema } from "./config";

/**
 * El tema activo de quien está adentro: su fila de `temas` (la que apunta
 * `perfiles.tema_activo_id`), ya validada. Sin fila —quien nunca entró a
 * Personalización— o si la consulta falla, el tema por defecto: un tema
 * que no carga no debe dejar la app sin estilos.
 *
 * `cache`: lo piden el layout (para el CSS y los iconos) y la pantalla de
 * Personalización en la misma request.
 */
export const obtenerConfigTema = cache(async (): Promise<ConfigTema> => {
  const usuario = await obtenerUsuario();
  if (!usuario) return CONFIG_POR_DEFECTO;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perfiles")
    .select("temas:tema_activo_id (preset, colores, tipografia, cursor, iconos)")
    .eq("id", usuario.id)
    .maybeSingle();

  if (error) {
    console.error("No se pudo leer el tema activo", error);
    return CONFIG_POR_DEFECTO;
  }
  const fila = (data?.temas ?? null) as Parameters<typeof configDesdeFila>[0];
  return configDesdeFila(Array.isArray(fila) ? (fila[0] ?? null) : fila);
});
