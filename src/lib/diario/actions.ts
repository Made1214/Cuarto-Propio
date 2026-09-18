"use server";

import { generateText, type JSONContent } from "@tiptap/core";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolverCategoriaId } from "@/lib/categorias/resolver";
import type { EntradaActionState } from "@/lib/diario/types";
import { tiptapExtensions } from "@/lib/tiptap-extensions";

function parseContenido(formData: FormData): JSONContent {
  const crudo = String(formData.get("contenido") ?? "");
  try {
    const json = JSON.parse(crudo || "{}");
    return json as JSONContent;
  } catch {
    return { type: "doc", content: [] };
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
  if (!titulo) {
    const t = await getTranslations({ locale, namespace: "diario" });
    return { error: t("tituloRequerido") };
  }

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
  if (!titulo) {
    const t = await getTranslations({ locale, namespace: "diario" });
    return { error: t("tituloRequerido") };
  }

  const contenido = parseContenido(formData);
  const contenidoTexto = generateText(contenido, tiptapExtensions);
  const categoriaId = await resolverCategoriaId(
    supabase,
    user.id,
    String(formData.get("categoria") ?? ""),
  );

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

  redirect({ href: `/diario/${data.codigo}`, locale });
}

export async function eliminarEntrada(locale: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entradas")
    .delete()
    .eq("id", id)
    .select("id")
    .single();

  if (error) throw error;
  if (!data) throw new Error("No se pudo eliminar la entrada.");

  redirect({ href: "/diario", locale });
}
