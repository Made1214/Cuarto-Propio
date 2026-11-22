import { NextResponse } from "next/server";
import { hayEspacioPara } from "@/lib/storage/cuota";
import { firmarPaths, guardarVersiones } from "@/lib/imagenes/almacenamiento";
import { TAMANO_MAXIMO_BYTES } from "@/lib/imagenes/limites";
import { FormatoNoSoportadoError, procesarImagen } from "@/lib/imagenes/procesar";
import { urlImagenDiario } from "@/lib/diario/imagenes";
import { createClient, obtenerUsuario } from "@/lib/supabase/server";

/**
 * Imágenes incrustadas en el Diario: el mismo pipeline único de la Vitrina y
 * la foto de perfil (CLAUDE.md → Procesamiento de imágenes), guardado en la
 * carpeta `diario` del bucket `imagenes`.
 *
 * Ruta de API y no Server Action por lo mismo que la Vitrina: el cuerpo de
 * una Server Action tiene un tope de 1 MB y una foto de celular lo revienta.
 * Responde códigos, no frases: la interfaz es la que traduce.
 */
export const runtime = "nodejs";

/** Subir una imagen. Devuelve las URLs estables que guarda el editor. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "sesion" }, { status: 401 });

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

  try {
    // El tipo real lo decide sharp al abrir el archivo, no la extensión.
    const versiones = await procesarImagen(await archivo.arrayBuffer(), "cuadricula");
    const { miniaturaPath, completaPath } = await guardarVersiones(supabase, user.id, "diario", versiones);

    return NextResponse.json({
      src: urlImagenDiario(miniaturaPath),
      completa: urlImagenDiario(completaPath),
      ancho: versiones.ancho,
      alto: versiones.alto,
    });
  } catch (fallo) {
    if (fallo instanceof FormatoNoSoportadoError) {
      return NextResponse.json({ error: "formato" }, { status: 415 });
    }
    console.error("No se pudo subir la imagen del diario", fallo);
    return NextResponse.json({ error: "fallo" }, { status: 500 });
  }
}

/** Solo rutas de la carpeta `diario` de quien pide, con la forma exacta que
 * genera `guardarVersiones` (`<usuario>/diario/<uuid>-<versión>.webp`). */
const FORMA_RUTA = /^[0-9a-f-]{36}\/diario\/[0-9a-f-]{36}-[a-z]+\.webp$/;

/**
 * Ver una imagen: firma la ruta y redirige a Storage. Así lo que se guarda en
 * la entrada es una URL que no vence.
 *
 * Seguridad: la ruta la manda el navegador, así que antes de firmar se
 * comprueba que empiece por el id de quien pide — nadie puede pedir las
 * imágenes de otra cuenta. (Las políticas de Storage, además, solo dejan
 * firmar la carpeta propia.)
 */
export async function GET(request: Request) {
  // `obtenerUsuario` verifica el JWT localmente, sin ir al servidor de Auth:
  // una entrada con varias fotos hace una de estas por foto.
  const user = await obtenerUsuario();
  if (!user) return new NextResponse(null, { status: 401 });
  const supabase = await createClient();

  const ruta = new URL(request.url).searchParams.get("ruta") ?? "";
  if (!FORMA_RUTA.test(ruta) || !ruta.startsWith(`${user.id}/`)) {
    return new NextResponse(null, { status: 404 });
  }

  const firmada = (await firmarPaths(supabase, [ruta])).get(ruta);
  if (!firmada) return new NextResponse(null, { status: 404 });

  // Privado (es contenido de la cuenta) y por menos tiempo del que dura la
  // firma, para que el navegador no reuse una redirección ya vencida.
  return NextResponse.redirect(firmada, {
    status: 302,
    headers: { "Cache-Control": "private, max-age=1800" },
  });
}
