import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * La fila de `temas` activa de quien llama, creándola si todavía no existe
 * (y apuntando `perfiles.tema_activo_id` a ella). Hay una sola fila por
 * cuenta en la Fase 1: "temas guardables" (varios por cuenta) es Fase 2,
 * pero la tabla ya está pensada para eso.
 */
export async function filaTemaActiva(supabase: SupabaseClient): Promise<{ id: string; usuarioId: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("sesion");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("tema_activo_id")
    .eq("id", user.id)
    .maybeSingle();
  if (perfil?.tema_activo_id) return { id: perfil.tema_activo_id as string, usuarioId: user.id };

  const { data: nueva, error } = await supabase
    .from("temas")
    .insert({ usuario_id: user.id, nombre: "Mi tema" })
    .select("id")
    .single();
  if (error) throw error;

  const { error: errorPerfil } = await supabase
    .from("perfiles")
    .upsert({ id: user.id, tema_activo_id: nueva.id }, { onConflict: "id" });
  if (errorPerfil) throw errorPerfil;

  return { id: nueva.id as string, usuarioId: user.id };
}
