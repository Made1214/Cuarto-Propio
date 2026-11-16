import type { SupabaseClient } from "@supabase/supabase-js";
import { filaTemaActiva } from "./fila";
import { esPreset } from "./presets";

/** Clave del metadato de la cuenta donde viaja el tema elegido en la landing. */
export const META_TEMA_INICIAL = "tema_inicial";

/**
 * El tema con el que se probó la landing (`/registro?tema=void`) viaja en
 * los metadatos de la cuenta al registrarse, y se aplica la primera vez que
 * hay sesión: al confirmar el correo o, si no, al primer login.
 *
 * Solo si la cuenta todavía no tiene fila de tema: una vez que existe (la
 * crea este mismo paso o la primera visita a Personalización), lo que se
 * elija adentro manda y esto ya no pisa nada. Nunca corta la entrada: si
 * falla, la cuenta queda con el tema por defecto.
 */
export async function aplicarTemaInicial(supabase: SupabaseClient): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const pedido = user?.user_metadata?.[META_TEMA_INICIAL];
    if (!user || !esPreset(pedido)) return;

    const { data: perfil } = await supabase
      .from("perfiles")
      .select("tema_activo_id")
      .eq("id", user.id)
      .maybeSingle();
    if (perfil?.tema_activo_id) return;

    const { id } = await filaTemaActiva(supabase);
    await supabase.from("temas").update({ preset: pedido }).eq("id", id);
  } catch (error) {
    console.error("No se pudo aplicar el tema elegido al registrarse", error);
  }
}
