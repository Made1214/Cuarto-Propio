import { createClient } from "@/lib/supabase/server";
import type { Categoria } from "./types";

export async function listarCategorias(): Promise<Categoria[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias")
    .select("id, nombre")
    .order("nombre");

  if (error) throw error;
  return data ?? [];
}

/** La relación `categoria:categorias(id, nombre)` de Supabase llega como
 * objeto o como array de un elemento según el cliente — esto la normaliza. */
export function normalizarCategoria(valor: unknown): Categoria | null {
  if (!valor) return null;
  const fila = Array.isArray(valor) ? valor[0] : valor;
  if (!fila) return null;
  return fila as Categoria;
}
