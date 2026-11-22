"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolverCategoriaId } from "@/lib/categorias/resolver";
import { borrarPaths } from "./almacenamiento";
import { resolverHashtags } from "./hashtags-servidor";
import { DESCRIPCION_MAXIMA, TITULO_MAXIMO } from "./limites";
import type { ImagenActionState } from "./types";

/** Vacía la caché de navegación del navegador antes de redirigir (igual que
 * el Diario). Sin esto, `staleTimes.dynamic` (next.config.ts) mostraba la
 * ficha con el título viejo y la pared con la pieza recién borrada hasta
 * recargar. */
function refrescarVitrina() {
  revalidatePath("/", "layout");
}

export async function actualizarImagen(
  locale: string,
  id: string,
  _estadoPrevio: ImagenActionState,
  formData: FormData,
): Promise<ImagenActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();

  if (titulo.length > TITULO_MAXIMO || descripcion.length > DESCRIPCION_MAXIMA) {
    const t = await getTranslations({ locale, namespace: "vitrina" });
    return {
      error:
        titulo.length > TITULO_MAXIMO
          ? t("tituloDemasiadoLargo", { maximo: TITULO_MAXIMO })
          : t("descripcionDemasiadoLarga", { maximo: DESCRIPCION_MAXIMA }),
    };
  }

  const categoriaId = await resolverCategoriaId(
    supabase,
    user.id,
    String(formData.get("categoria") ?? ""),
  );

  const hashtags = await resolverHashtags(supabase, String(formData.get("hashtags") ?? ""));

  const { data, error } = await supabase
    .from("imagenes")
    .update({
      // Vacío se guarda como NULL, no como "": la ficha muestra su texto por
      // defecto ("Sin título") en vez de un renglón en blanco.
      titulo: titulo || null,
      descripcion: descripcion || null,
      hashtags,
      categoria_id: categoriaId,
    })
    .eq("id", id)
    .select("codigo")
    .single();

  if (error) throw error;

  refrescarVitrina();
  redirect({ href: `/vitrina/${data.codigo}`, locale });
}

export async function eliminarImagen(locale: string, id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("imagenes")
    .delete()
    .eq("id", id)
    .select("miniatura_path, completa_path")
    .single();

  if (error) throw error;
  if (!data) throw new Error("No se pudo eliminar la imagen.");

  // Los archivos se borran DESPUÉS de la fila, y un fallo acá no se propaga:
  // para la usuaria la imagen ya no existe, y romper la pantalla por no
  // poder limpiar el bucket sería peor que dejar un par de archivos sueltos.
  try {
    await borrarPaths(supabase, [data.miniatura_path as string, data.completa_path as string]);
  } catch (fallo) {
    console.error("No se pudieron borrar los archivos de la imagen", fallo);
  }

  refrescarVitrina();
  redirect({ href: "/vitrina", locale });
}
