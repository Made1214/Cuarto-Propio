import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { guardarAudio } from "@/lib/audio/almacenamiento";
import { detectarFormato, FormatoNoSoportadoError } from "@/lib/audio/formato";
import { DURACION_MAXIMA_SEGUNDOS, TAMANO_MAXIMO_BYTES } from "@/lib/audio/limites";

/**
 * Subida de una nota de voz ya grabada.
 *
 * Es una ruta de API y no una Server Action por lo mismo que la subida de
 * fotos: las Server Actions tienen un tope de 1MB en el cuerpo del request y
 * varios minutos de audio lo pasan sin esfuerzo.
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

  try {
    const datos = await archivo.arrayBuffer();
    // El tipo real lo decide la firma del contenedor, no el nombre ni el
    // Content-Type que manda el navegador (ambos se falsifican solos).
    const formato = detectarFormato(datos);
    const path = await guardarAudio(supabase, user.id, Buffer.from(datos), formato);

    const { data, error } = await supabase
      .from("audios")
      .insert({
        usuario_id: user.id,
        // Sin título: la tarjeta muestra el default con fecha y hora, en el
        // idioma que esté usando la interfaz.
        titulo: null,
        archivo_path: path,
        duracion_segundos: duracionValida(formData.get("duracion")),
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id as string });
  } catch (fallo) {
    if (fallo instanceof FormatoNoSoportadoError) {
      return NextResponse.json({ error: "formato" }, { status: 415 });
    }
    console.error("No se pudo subir la nota de audio", fallo);
    return NextResponse.json({ error: "fallo" }, { status: 500 });
  }
}

/** La duración la mide el navegador mientras graba, así que llega como un
 * dato del cliente: se acepta solo si es un número sano y dentro del tope,
 * y si no se guarda NULL en vez de rechazar la nota — el audio ya está
 * grabado y perderlo por un contador raro sería mucho peor. */
function duracionValida(valor: FormDataEntryValue | null): number | null {
  const segundos = Number(valor);
  if (!Number.isFinite(segundos) || segundos <= 0) return null;
  return Math.min(Math.round(segundos), DURACION_MAXIMA_SEGUNDOS);
}
