import type { SupabaseClient, User } from "@supabase/supabase-js";
import { firmarPaths } from "@/lib/imagenes/almacenamiento";
import type { PerfilVisible } from "./types";

/**
 * El perfil de quien está adentro, listo para pintar.
 *
 * Recibe el cliente y el usuario ya resueltos porque quien lo llama es el
 * layout de la app, que acaba de hacer ambas cosas para decidir si redirige
 * al login — pedirlos de nuevo acá sería repetir el trabajo en cada
 * navegación.
 */
export async function obtenerPerfil(
  supabase: SupabaseClient,
  usuario: User,
): Promise<PerfilVisible> {
  const { data, error } = await supabase
    .from("perfiles")
    .select("nombre, foto_perfil_path")
    .eq("id", usuario.id)
    .maybeSingle();

  // `maybeSingle` y no `single` a propósito: el trigger `handle_new_user`
  // crea la fila al registrarse, pero una cuenta hecha a mano desde el panel
  // de Supabase puede no tenerla. Sin foto ni nombre la app funciona igual.
  if (error) throw error;

  const miniatura = (data?.foto_perfil_path as string | null) ?? null;
  let fotoUrl: string | null = null;
  if (miniatura) {
    // Un avatar que no carga no puede tumbar la navegación entera: si la
    // firma falla, se cae al monograma como si no hubiera foto.
    try {
      fotoUrl = (await firmarPaths(supabase, [miniatura])).get(miniatura) ?? null;
    } catch (fallo) {
      console.error("No se pudo firmar la foto de perfil", fallo);
    }
  }

  return {
    nombre: (data?.nombre as string | null) ?? null,
    email: usuario.email ?? null,
    fotoUrl,
  };
}
