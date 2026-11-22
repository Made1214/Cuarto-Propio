import { NextResponse } from "next/server";
import { hayEspacioPara } from "@/lib/storage/cuota";
import { createClient } from "@/lib/supabase/server";
import { guardarVersiones } from "@/lib/imagenes/almacenamiento";
import { normalizarHashtags } from "@/lib/imagenes/hashtags";
import {
  DESCRIPCION_MAXIMA,
  TAMANO_MAXIMO_BYTES,
  TITULO_MAXIMO,
} from "@/lib/imagenes/limites";
import { FormatoNoSoportadoError, procesarImagen } from "@/lib/imagenes/procesar";

/**
 * Subida de una pieza a la Vitrina: el archivo llega junto con sus datos
 * (título, descripción, hashtags), porque se completan antes de exhibirla.
 * Una sola ida y vuelta, y ninguna pieza nace sin título.
 *
 * Es una ruta de API y no una Server Action porque las Server Actions tienen
 * un tope de 1MB en el cuerpo del request: subir una foto de celular las
 * revienta. Un archivo por request, no todos juntos: así una foto que falla
 * a mitad de camino se puede reintentar sola sin volver a mandar las demás
 * (CLAUDE.md → Confiabilidad).
 *
 * La respuesta devuelve códigos de error, no frases: la ruta vive fuera del
 * segmento [locale] y es la interfaz la que traduce.
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
  // Tope de espacio por cuenta (src/lib/storage/cuota.ts): se frena antes
  // de procesar y guardar, no cuando ya falló Storage.
  if (!(await hayEspacioPara(archivo.size))) {
    return NextResponse.json({ error: "espacio" }, { status: 507 });
  }

  // Recorta en vez de rechazar: el formulario ya limita con `maxLength`, y
  // cortar un título largo es mejor que perder una subida entera por eso.
  const titulo = texto(formData, "titulo", TITULO_MAXIMO) || tituloDesdeArchivo(archivo.name);
  const descripcion = texto(formData, "descripcion", DESCRIPCION_MAXIMA);
  const hashtags = normalizarHashtags(String(formData.get("hashtags") ?? ""));

  try {
    // El tipo real lo decide sharp al abrir el archivo, no el nombre ni el
    // Content-Type que manda el navegador (ambos se falsifican solos).
    const versiones = await procesarImagen(await archivo.arrayBuffer());
    const { miniaturaPath, completaPath } = await guardarVersiones(
      supabase,
      user.id,
      "vitrina",
      versiones,
    );

    const { data, error } = await supabase
      .from("imagenes")
      .insert({
        usuario_id: user.id,
        titulo,
        descripcion: descripcion || null,
        hashtags,
        miniatura_path: miniaturaPath,
        completa_path: completaPath,
        ancho: versiones.ancho,
        alto: versiones.alto,
      })
      .select("codigo")
      .single();

    if (error) throw error;

    return NextResponse.json({ codigo: data.codigo as string });
  } catch (fallo) {
    if (fallo instanceof FormatoNoSoportadoError) {
      return NextResponse.json({ error: "formato" }, { status: 415 });
    }
    console.error("No se pudo subir la imagen", fallo);
    return NextResponse.json({ error: "fallo" }, { status: 500 });
  }
}

function texto(formData: FormData, campo: string, maximo: number): string {
  return String(formData.get(campo) ?? "")
    .trim()
    .slice(0, maximo);
}

/** Red de última instancia para el título: el nombre del archivo sin
 * extensión. Solo entra si el formulario mandó el campo vacío. */
function tituloDesdeArchivo(nombre: string): string | null {
  const limpio = nombre.replace(/\.[^.]+$/, "").trim();
  return limpio ? limpio.slice(0, TITULO_MAXIMO) : null;
}
