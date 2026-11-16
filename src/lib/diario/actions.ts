"use server";

import { generateText, type JSONContent } from "@tiptap/core";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { borrarPaths } from "@/lib/imagenes/almacenamiento";
import { pathsImagenesEnContenido } from "@/lib/diario/imagenes";
import { createClient, obtenerUsuario } from "@/lib/supabase/server";
import { isAuthRetryableFetchError, type SupabaseClient } from "@supabase/supabase-js";
import { resolverCategoriaId } from "@/lib/categorias/resolver";
import { contenidoVacio } from "@/lib/diario/contenido";
import type { EntradaActionState } from "@/lib/diario/types";
import { errorTitulo, TITULO_MAXIMO } from "@/lib/diario/titulo";
import { tiptapExtensions } from "@/lib/tiptap-extensions";

/** Vacía la caché de navegación del navegador antes de redirigir. Sin esto,
 * `staleTimes.dynamic` (next.config.ts) hace que la ficha y el listado
 * visitados hace menos de 30 s se muestren como estaban: se guardaba la
 * edición y la pantalla seguía mostrando el texto viejo hasta recargar. */
function refrescarDiario() {
  revalidatePath("/", "layout");
}

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

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Lo que crear y actualizar comparten: quién escribe y qué dejó en el
 * formulario, ya validado. Devuelve `{ error }` en vez de lanzar, para que
 * el formulario siga en pantalla con lo escrito intacto. */
async function prepararEntrada(
  locale: string,
  formData: FormData,
): Promise<
  | { error: string }
  | { supabase: Supabase; usuarioId: string; titulo: string; contenido: JSONContent; categoria: string }
> {
  const t = await getTranslations({ locale, namespace: "diario" });
  const supabase = await createClient();
  const {
    data: { user },
    error: errorAuth,
  } = await supabase.auth.getUser();
  if (!user) {
    // Antes esto redirigía a /login y se llevaba lo escrito por delante. Si
    // Auth no contestó (red, Supabase caído) no es que se haya vencido la
    // sesión: es el mismo "no se pudo, prueba de nuevo" de cualquier fallo.
    return { error: isAuthRetryableFetchError(errorAuth) ? t("errorGuardar") : t("sesionVencida") };
  }

  const titulo = String(formData.get("titulo") ?? "").trim();
  const errorDelTitulo = await validarTitulo(locale, titulo);
  if (errorDelTitulo) return { error: errorDelTitulo };

  // El formulario ya avisa antes de enviar, pero eso se puede saltear.
  const contenido = parseContenido(formData);
  if (contenidoVacio(contenido)) return { error: t("contenidoRequerido") };

  return {
    supabase,
    usuarioId: user.id,
    titulo,
    contenido,
    categoria: String(formData.get("categoria") ?? ""),
  };
}

/**
 * Nunca lanza ante un fallo de la base o de la red: un `throw` acá reemplaza
 * la pantalla por el límite de error y lo que se estaba escribiendo se
 * pierde. Devuelve `{ error }` y el formulario queda como estaba, listo para
 * reintentar. Solo el éxito redirige (fuera del try: `redirect` funciona
 * lanzando, y el catch se lo tragaría).
 */
export async function crearEntrada(
  locale: string,
  _estadoPrevio: EntradaActionState,
  formData: FormData,
): Promise<EntradaActionState> {
  const listo = await prepararEntrada(locale, formData);
  if ("error" in listo) return listo;
  const { supabase, usuarioId, titulo, contenido, categoria } = listo;

  let codigo: string;
  try {
    const categoriaId = await resolverCategoriaId(supabase, usuarioId, categoria);
    const { data, error } = await supabase
      .from("entradas")
      .insert({
        usuario_id: usuarioId,
        titulo,
        contenido,
        contenido_texto: generateText(contenido, tiptapExtensions),
        categoria_id: categoriaId,
      })
      .select("codigo")
      .single();
    if (error) throw error;
    codigo = data.codigo;
  } catch (fallo) {
    console.error("No se pudo crear la entrada", fallo);
    const t = await getTranslations({ locale, namespace: "diario" });
    return { error: t("errorGuardar") };
  }

  refrescarDiario();
  redirect({ href: `/diario/${codigo}`, locale });
}

export async function actualizarEntrada(
  locale: string,
  id: string,
  _estadoPrevio: EntradaActionState,
  formData: FormData,
): Promise<EntradaActionState> {
  const listo = await prepararEntrada(locale, formData);
  if ("error" in listo) return listo;
  const { supabase, usuarioId, titulo, contenido, categoria } = listo;

  let codigo: string;
  let anterior: JSONContent | null = null;
  try {
    const categoriaId = await resolverCategoriaId(supabase, usuarioId, categoria);

    // Lo que había antes, para saber qué imágenes se quitaron en esta edición.
    const { data: previa } = await supabase.from("entradas").select("contenido").eq("id", id).maybeSingle();
    anterior = (previa?.contenido as JSONContent | null) ?? null;

    const { data, error } = await supabase
      .from("entradas")
      .update({
        titulo,
        contenido,
        contenido_texto: generateText(contenido, tiptapExtensions),
        categoria_id: categoriaId,
      })
      .eq("id", id)
      .select("codigo")
      .single();
    if (error) throw error;
    codigo = data.codigo;
  } catch (fallo) {
    console.error("No se pudo actualizar la entrada", fallo);
    const t = await getTranslations({ locale, namespace: "diario" });
    return { error: t("errorGuardar") };
  }

  const siguen = new Set(pathsImagenesEnContenido(contenido));
  const quitadas = pathsImagenesEnContenido(anterior).filter((path) => !siguen.has(path));
  await borrarImagenesSilencioso(supabase, usuarioId, quitadas);

  refrescarDiario();
  redirect({ href: `/diario/${codigo}`, locale });
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

  refrescarDiario();
  redirect({ href: "/diario", locale });
}
