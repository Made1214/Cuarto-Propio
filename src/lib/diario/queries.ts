import { createClient } from "@/lib/supabase/server";
import { normalizarCategoria } from "@/lib/categorias/queries";
import type { Entrada, EntradaResumen } from "./types";

const LARGO_EXTRACTO = 220;

export async function listarEntradas(filtros: {
  categoriaId?: string;
  busqueda?: string;
} = {}): Promise<EntradaResumen[]> {
  const supabase = await createClient();
  let query = supabase
    .from("entradas")
    .select("id, codigo, titulo, fecha, contenido_texto, categoria:categorias(id, nombre)")
    .order("fecha", { ascending: false });

  if (filtros.categoriaId) {
    query = query.eq("categoria_id", filtros.categoriaId);
  }
  if (filtros.busqueda?.trim()) {
    query = query.textSearch("busqueda", filtros.busqueda.trim(), {
      type: "websearch",
      config: "spanish",
    });
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((fila) => ({
    id: fila.id as string,
    codigo: fila.codigo as string,
    titulo: fila.titulo as string | null,
    fecha: fila.fecha as string,
    categoria: normalizarCategoria(fila.categoria),
    extracto: ((fila.contenido_texto as string | null) ?? "").slice(0, LARGO_EXTRACTO),
  }));
}

export async function obtenerEntradaPorCodigo(codigo: string): Promise<Entrada | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entradas")
    .select("id, codigo, titulo, contenido, fecha, categoria_id, categoria:categorias(id, nombre)")
    .eq("codigo", codigo)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const categoria = normalizarCategoria(data.categoria);

  return {
    id: data.id as string,
    codigo: data.codigo as string,
    titulo: data.titulo as string | null,
    contenido: data.contenido as Entrada["contenido"],
    fecha: data.fecha as string,
    categoriaId: (data.categoria_id as string | null) ?? null,
    categoriaNombre: categoria?.nombre ?? null,
  };
}
