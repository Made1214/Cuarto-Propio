import { NextResponse } from "next/server";
import sharp from "sharp";
import type { RutaSeccion } from "@/components/iconos-secciones";
import { filaTemaActiva } from "@/lib/temas/fila";
import { RUTAS_ICONOS, TAMANO_MAXIMO_IMAGEN_PROPIA } from "@/lib/temas/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Subir un cursor o un icono propio (CLAUDE.md → Personalización: "subir mi
 * propia imagen", validando el tipo real del archivo).
 *
 * El tipo lo decide sharp al abrir el archivo, no la extensión. Después se
 * vuelve a dibujar como PNG chico (32 px el cursor, que es lo que aceptan los
 * navegadores; 64 px el icono) y se guarda como `data:` en la fila del tema:
 * son unos pocos KB, no vale la pena un archivo en Storage, y así el CSS no
 * depende de una URL firmada que vence.
 */
export const runtime = "nodejs";

const FORMATOS = new Set(["png", "jpeg", "webp", "gif", "svg"]);
const TAMANO_MAXIMO_ORIGINAL = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "sesion" }, { status: 401 });

  const datos = await request.formData();
  const tipo = datos.get("tipo");
  const ruta = datos.get("ruta");
  const archivo = datos.get("archivo");

  if (tipo !== "cursor" && tipo !== "icono") return NextResponse.json({ error: "fallo" }, { status: 400 });
  if (tipo === "icono" && !RUTAS_ICONOS.includes(ruta as RutaSeccion)) {
    return NextResponse.json({ error: "fallo" }, { status: 400 });
  }
  if (!(archivo instanceof File) || archivo.size === 0) return NextResponse.json({ error: "vacio" }, { status: 400 });
  if (archivo.size > TAMANO_MAXIMO_ORIGINAL) return NextResponse.json({ error: "tamano" }, { status: 413 });

  const original = Buffer.from(await archivo.arrayBuffer());
  let formato: string | undefined;
  try {
    formato = (await sharp(original).metadata()).format;
  } catch {
    formato = undefined;
  }
  if (!formato || !FORMATOS.has(formato)) return NextResponse.json({ error: "formato" }, { status: 415 });

  try {
    const lado = tipo === "cursor" ? 32 : 64;
    const png = await sharp(original, { animated: false })
      .resize(lado, lado, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, palette: true })
      .toBuffer();
    const imagen = `data:image/png;base64,${png.toString("base64")}`;
    if (imagen.length > TAMANO_MAXIMO_IMAGEN_PROPIA) return NextResponse.json({ error: "tamano" }, { status: 413 });

    const { id } = await filaTemaActiva(supabase);
    if (tipo === "cursor") {
      const { error } = await supabase.from("temas").update({ cursor: imagen }).eq("id", id);
      if (error) throw error;
    } else {
      const { data } = await supabase.from("temas").select("iconos").eq("id", id).maybeSingle();
      const actuales = (data?.iconos ?? {}) as { propios?: Record<string, string> };
      const iconos = { ...actuales, propios: { ...(actuales.propios ?? {}), [ruta as string]: imagen } };
      const { error } = await supabase.from("temas").update({ iconos }).eq("id", id);
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (fallo) {
    console.error("No se pudo guardar la imagen de personalización", fallo);
    return NextResponse.json({ error: "fallo" }, { status: 500 });
  }
}
