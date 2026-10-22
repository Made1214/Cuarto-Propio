"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolverCategoriaId } from "@/lib/categorias/resolver";
import { esUuid } from "@/lib/uuid";

// Cada action termina con `refresh()` en vez de que el cliente llame a
// `router.refresh()` después: así la página nueva viaja en la MISMA respuesta
// que la mutación (un viaje al servidor en vez de dos, que en 4G se nota) y
// llega dentro de la misma transición que sostiene el estado optimista — el
// valor optimista se suelta justo cuando aparece el real, sin el parpadeo de
// ver un instante el viejo entre una cosa y la otra.

export async function crearLista(nombre: string, categoria: string, conCasillas = false) {
  const nombreLimpio = nombre.trim();
  if (!nombreLimpio) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const categoriaId = await resolverCategoriaId(supabase, user.id, categoria);

  const { error } = await supabase.from("listas").insert({
    usuario_id: user.id,
    nombre: nombreLimpio,
    categoria_id: categoriaId,
    con_casillas: conCasillas,
  });

  if (error) throw error;
  refresh();
}

export async function renombrarLista(listaId: string, nombre: string) {
  const nombreLimpio = nombre.trim();
  if (!nombreLimpio) return;

  const supabase = await createClient();
  const { error } = await supabase.from("listas").update({ nombre: nombreLimpio }).eq("id", listaId);
  if (error) throw error;
  refresh();
}

export async function asignarCategoriaLista(listaId: string, nombreCategoria: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const categoriaId = await resolverCategoriaId(supabase, user.id, nombreCategoria);

  const { error } = await supabase.from("listas").update({ categoria_id: categoriaId }).eq("id", listaId);
  if (error) throw error;
  refresh();
}

export async function eliminarLista(listaId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("listas").delete().eq("id", listaId);
  if (error) throw error;
  refresh();
}

/** `id` lo genera el cliente para el ítem optimista: así la fila pendiente y
 * la real que llega del servidor comparten la misma key — React reusa el
 * mismo nodo en vez de desmontar uno y montar otro, y el cliente sabe sin
 * adivinar cuándo dejar de mostrar la pendiente. Si no llega un uuid válido,
 * la base genera uno como siempre. */
export async function agregarItem(listaId: string, contenido: string, id?: string) {
  const contenidoLimpio = contenido.trim();
  if (!contenidoLimpio) return;

  const supabase = await createClient();
  // max(orden) + 1 y no count: tras borrar un ítem del medio, el conteo
  // repetiría el `orden` de otro que ya existe.
  const { data: ultimo, error: errorUltimo } = await supabase
    .from("items_lista")
    .select("orden")
    .eq("lista_id", listaId)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (errorUltimo) throw errorUltimo;

  const { error } = await supabase.from("items_lista").insert({
    ...(esUuid(id) ? { id } : {}),
    lista_id: listaId,
    contenido: contenidoLimpio,
    orden: ultimo ? (ultimo.orden as number) + 1 : 0,
  });

  if (error) throw error;
  refresh();
}

export async function editarItem(itemId: string, contenido: string) {
  const contenidoLimpio = contenido.trim();
  if (!contenidoLimpio) return;

  const supabase = await createClient();
  const { error } = await supabase.from("items_lista").update({ contenido: contenidoLimpio }).eq("id", itemId);
  if (error) throw error;
  refresh();
}

export async function alternarItem(itemId: string, marcado: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("items_lista").update({ marcado }).eq("id", itemId);
  if (error) throw error;
  refresh();
}

/** Convierte la lista entera en lista de casillas o en lista de notas. Al
 * quitar las casillas se desmarca todo, para que no quede un "hecho"
 * invisible si más adelante se vuelven a activar. */
export async function cambiarCasillasLista(listaId: string, conCasillas: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("listas").update({ con_casillas: conCasillas }).eq("id", listaId);
  if (error) throw error;

  if (!conCasillas) {
    const { error: errorItems } = await supabase
      .from("items_lista")
      .update({ marcado: false })
      .eq("lista_id", listaId);
    if (errorItems) throw errorItems;
  }
  refresh();
}

/** Reescribe el `orden` de los ítems según la posición en `idsEnOrden`. Un
 * update por ítem: son listas personales de decenas de ítems, no vale la
 * pena una función RPC. El `lista_id` en el filtro evita que un id de otra
 * lista se cuele en el reordenamiento. */
export async function reordenarItems(listaId: string, idsEnOrden: string[]) {
  if (idsEnOrden.length === 0) return;

  const supabase = await createClient();
  const resultados = await Promise.all(
    idsEnOrden.map((id, indice) =>
      supabase.from("items_lista").update({ orden: indice }).eq("id", id).eq("lista_id", listaId),
    ),
  );

  const fallo = resultados.find((resultado) => resultado.error);
  if (fallo?.error) throw fallo.error;
  refresh();
}

export async function eliminarItem(itemId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("items_lista").delete().eq("id", itemId);
  if (error) throw error;
  refresh();
}
