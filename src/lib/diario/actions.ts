"use server";

import { generateText, type JSONContent } from "@tiptap/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
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

async function resolverCategoriaId(
  supabase: SupabaseClient,
  usuarioId: string,
  nombreCategoria: string,
): Promise<string | null> {
  const nombre = nombreCategoria.trim();
  if (!nombre) return null;

  const { data: existente, error: errorBusqueda } = await supabase
    .from("categorias")
    .select("id")
    .eq("usuario_id", usuarioId)
    .eq("nombre", nombre)
    .maybeSingle();

  if (errorBusqueda) throw errorBusqueda;
  if (existente) return existente.id as string;

  const { data: nueva, error: errorCreacion } = await supabase
    .from("categorias")
    .insert({ usuario_id: usuarioId, nombre })
    .select("id")
    .single();

  if (errorCreacion) throw errorCreacion;
  return nueva.id as string;
}

export async function crearEntrada(locale: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const titulo = String(formData.get("titulo") ?? "").trim() || null;
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
    .select("id")
    .single();

  if (error) throw error;

  redirect({ href: `/diario/${data.id}`, locale });
}

export async function actualizarEntrada(locale: string, id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const titulo = String(formData.get("titulo") ?? "").trim() || null;
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
    .select("id")
    .single();

  if (error) throw error;

  redirect({ href: `/diario/${data.id}`, locale });
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
