"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolverCategoriaId } from "@/lib/categorias/resolver";
import { borrarPath } from "./almacenamiento";
import { TITULO_MAXIMO } from "./limites";

// `refresh()` desde la action y no `router.refresh()` desde el cliente: la
// página nueva vuelve en la misma respuesta que la mutación, así el estado
// optimista de la tarjeta se suelta justo cuando llega el real (ver
// src/lib/listas/actions.ts).

/** El título de una nota es opcional: vacío se guarda como NULL y la tarjeta
 * muestra el default con fecha y hora (CLAUDE.md → el audio, a diferencia
 * del diario, sí resuelve el título vacío con un default). */
export async function renombrarAudio(audioId: string, titulo: string) {
  const limpio = titulo.trim().slice(0, TITULO_MAXIMO);

  const supabase = await createClient();
  const { error } = await supabase
    .from("audios")
    .update({ titulo: limpio || null })
    .eq("id", audioId);

  if (error) throw error;
  refresh();
}

export async function asignarCategoriaAudio(audioId: string, nombreCategoria: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const categoriaId = await resolverCategoriaId(supabase, user.id, nombreCategoria);

  const { error } = await supabase
    .from("audios")
    .update({ categoria_id: categoriaId })
    .eq("id", audioId);

  if (error) throw error;
  refresh();
}

export async function eliminarAudio(audioId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audios")
    .delete()
    .eq("id", audioId)
    .select("archivo_path")
    .single();

  if (error) throw error;
  if (!data) return;
  refresh();

  // El archivo se borra DESPUÉS de la fila, y un fallo acá no se propaga:
  // para la usuaria la nota ya no existe, y romper la pantalla por no poder
  // limpiar el bucket sería peor que dejar un archivo suelto.
  try {
    await borrarPath(supabase, data.archivo_path as string);
  } catch (fallo) {
    console.error("No se pudo borrar el archivo de la nota de audio", fallo);
  }
}
