"use server";

import { generateText, type JSONContent } from "@tiptap/core";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { borrarPaths } from "@/lib/imagenes/almacenamiento";
import { pathsImagenesEnContenido } from "@/lib/diario/imagenes";
import { createClient, obtenerUsuario } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolverCategoriaId } from "@/lib/categorias/resolver";
import type { EntradaActionState } from "@/lib/diario/types";
import { errorTitulo, TITULO_MAXIMO } from "@/lib/diario/titulo";
import { tiptapExtensions } from "@/lib/tiptap-extensions";


/** Valida el título del lado del servidor: el `maxLength` del campo es
 * comodidad, no una garantía — se puede saltear. */
async function validarTitulo(locale: string, titulo: string): Promise<string | null> {
  const error = errorTitulo(titulo);
  if (!error) return null;
  const t = await getTranslations({ locale, namespace: "diario" });
  return error === "demasiadoLargo" ? t("tituloDemasiadoLargo", { maximo: TITULO_MAXIMO }) : t("tituloRequerido");
}

function parseContenido(formData: FormData): JSONContent {
  const crudo = String(formData.get("contenido") ?? "");
  try {
    const json = JSON.parse(crudo || "{}");
    return json as JSONContent;
  } catch {
    return { type: "doc", content: [] };
  }
}

/**
 * Borra de Storage las imágenes que una entrada dejó de usar (se quitaron al
 * editar, o se borró la entrada entera). Solo toca la carpeta `diario` de
 * quien llama, por si el contenido trajera una ruta ajena.
 *
 * Es limpieza, no parte del resultado: si falla, la entrada ya quedó bien
 * guardada y un archivo suelto es mejor que romper la pantalla.
 */
async function borrarImagenesSilencioso(supabase: SupabaseClient, usuarioId: string, paths: string[]) {
  const propias = paths.filter((path) => path.startsWith(`${usuarioId}/diario/`));
  if (propias.length === 0) return;
  try {
    await borrarPaths(supabase, propias);
  } catch (fallo) {
    console.error("No se pudieron borrar imágenes del diario", fallo);
  }
}

export async function crearEntrada(
  locale: string,
  _estadoPrevio: EntradaActionState,
  formData: FormData,
): Promise<EntradaActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const titulo = String(formData.get("titulo") ?? "").trim();
  const errorTitulo = await validarTitulo(locale, titulo);
  if (errorTitulo) return { error: errorTitulo };

  const contenido = parseContenido(formData);
  const contenidoTexto = generateText(contenido, tiptapExtensions);
  const categoriaId = await resolverCategoriaId(
    supabase,
    user.id,
    String(formData.get("categoria") ?? ""),
  );

  const { data, error } = await supabase
    .from("entradas")
    .insert({
      usuario_id: user.id,
      titulo,
      contenido,
      contenido_texto: contenidoTexto,
      categoria_id: categoriaId,
    })
    .select("codigo")
    .single();

  if (error) throw error;

  redirect({ href: `/diario/${data.codigo}`, locale });
}

export async function actualizarEntrada(
  locale: string,
  id: string,
  _estadoPrevio: EntradaActionState,
  formData: FormData,
): Promise<EntradaActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const titulo = String(formData.get("titulo") ?? "").trim();
  const errorTitulo = await validarTitulo(locale, titulo);
  if (errorTitulo) return { error: errorTitulo };

  const contenido = parseContenido(formData);
  const contenidoTexto = generateText(contenido, tiptapExtensions);
  const categoriaId = await resolverCategoriaId(
    supabase,
    user.id,
    String(formData.get("categoria") ?? ""),
  );

  // Lo que había antes, para saber qué imágenes se quitaron en esta edición.
  const { data: anterior } = await supabase.from("entradas").select("contenido").eq("id", id).maybeSingle();

  const { data, error } = await supabase
    .from("entradas")
    .update({
      titulo,
      contenido,
      contenido_texto: contenidoTexto,
      categoria_id: categoriaId,
    })
    .eq("id", id)
    .select("codigo")
    .single();

  if (error) throw error;

  const siguen = new Set(pathsImagenesEnContenido(contenido));
  const quitadas = pathsImagenesEnContenido(anterior?.contenido as JSONContent | null).filter(
    (path) => !siguen.has(path),
  );
  await borrarImagenesSilencioso(supabase, user.id, quitadas);

  redirect({ href: `/diario/${data.codigo}`, locale });
}

export async function eliminarEntrada(locale: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entradas")
    .delete()
    .eq("id", id)
    .select("id, contenido")
    .single();

  if (error) throw error;
  if (!data) throw new Error("No se pudo eliminar la entrada.");

  const usuario = await obtenerUsuario();
  if (usuario) {
    await borrarImagenesSilencioso(
      supabase,
      usuario.id,
      pathsImagenesEnContenido(data.contenido as JSONContent | null),
    );
  }

  redirect({ href: "/diario", locale });
}
