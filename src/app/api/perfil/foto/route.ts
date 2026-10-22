import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { borrarPaths, guardarVersiones } from "@/lib/imagenes/almacenamiento";
import { TAMANO_MAXIMO_BYTES } from "@/lib/imagenes/limites";
import { FormatoNoSoportadoError, procesarImagen } from "@/lib/imagenes/procesar";

/**
 * Foto de perfil: el mismo pipeline de la Vitrina (miniatura + versión
 * completa con sharp), solo que guardado en la carpeta `perfil` y apuntado
 * desde `perfiles` en vez de una fila propia (CLAUDE.md → un solo componente
 * de subida de imágenes, no una implementación por módulo). La miniatura se
 * pide con forma de avatar (`procesarImagen(…, "avatar")`): lo demás del
 * pipeline es idéntico.
 *
 * Es ruta de API y no Server Action por lo mismo que la Vitrina: el cuerpo
 * de una Server Action tiene un tope de 1MB y una foto de celular lo revienta.
 * La respuesta devuelve códigos, no frases: la ruta vive fuera de [locale] y
 * es la interfaz la que traduce.
 */
export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "sesion" }, { status: 401 });
  }

  const formData = await request.formData();
  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return NextResponse.json({ error: "vacio" }, { status: 400 });
  }
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return NextResponse.json({ error: "tamano" }, { status: 413 });
  }

  try {
    // El tipo real lo decide sharp al abrir el archivo, no la extensión ni el
    // Content-Type que manda el navegador (ambos se falsifican solos). La
    // miniatura sale con forma de avatar (cuadrada y chiquita): es lo único
    // que la muestra, y la versión completa queda para todo lo demás.
    const versiones = await procesarImagen(await archivo.arrayBuffer(), "avatar");
    const anteriores = await pathsActuales(supabase, user.id);

    const { miniaturaPath, completaPath } = await guardarVersiones(
      supabase,
      user.id,
      "perfil",
      versiones,
    );

    const { error } = await supabase.from("perfiles").upsert(
      {
        id: user.id,
        foto_perfil_path: miniaturaPath,
        foto_perfil_completa_path: completaPath,
      },
      { onConflict: "id" },
    );
    if (error) {
      // La fila no quedó apuntando a estos archivos: sin esto se acumularía
      // una foto huérfana en Storage por cada intento fallido.
      await borrarSilencioso(supabase, [miniaturaPath, completaPath]);
      throw error;
    }

    // La foto vieja se borra recién cuando la nueva ya está guardada y
    // referenciada: al revés, un fallo a mitad de camino dejaría el perfil
    // sin ninguna de las dos.
    await borrarSilencioso(supabase, anteriores);

    return NextResponse.json({ ok: true });
  } catch (fallo) {
    if (fallo instanceof FormatoNoSoportadoError) {
      return NextResponse.json({ error: "formato" }, { status: 415 });
    }
    console.error("No se pudo subir la foto de perfil", fallo);
    return NextResponse.json({ error: "fallo" }, { status: 500 });
  }
}

/** Quitar la foto y volver al monograma. */
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "sesion" }, { status: 401 });
  }

  try {
    const anteriores = await pathsActuales(supabase, user.id);

    const { error } = await supabase
      .from("perfiles")
      .update({ foto_perfil_path: null, foto_perfil_completa_path: null })
      .eq("id", user.id);
    if (error) throw error;

    await borrarSilencioso(supabase, anteriores);

    return NextResponse.json({ ok: true });
  } catch (fallo) {
    console.error("No se pudo quitar la foto de perfil", fallo);
    return NextResponse.json({ error: "fallo" }, { status: 500 });
  }
}

async function pathsActuales(supabase: SupabaseClient, usuarioId: string): Promise<string[]> {
  const { data } = await supabase
    .from("perfiles")
    .select("foto_perfil_path, foto_perfil_completa_path")
    .eq("id", usuarioId)
    .maybeSingle();

  return [data?.foto_perfil_path, data?.foto_perfil_completa_path].filter(
    (path): path is string => Boolean(path),
  );
}

/** Limpiar Storage es mantenimiento, no parte del resultado: para la usuaria
 * la foto ya cambió, y romper la pantalla por un archivo que quedó suelto
 * sería peor que dejarlo ahí. */
async function borrarSilencioso(supabase: SupabaseClient, paths: string[]) {
  if (paths.length === 0) return;
  try {
    await borrarPaths(supabase, paths);
  } catch (fallo) {
    console.error("No se pudo borrar la foto de perfil anterior", fallo);
  }
}
