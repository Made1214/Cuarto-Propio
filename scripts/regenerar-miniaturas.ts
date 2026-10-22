/**
 * Regenera las miniaturas subidas antes de que el pipeline las hiciera a la
 * medida de dónde se muestran (ver `MINIATURAS` en
 * `src/lib/imagenes/procesar.ts`):
 *
 * - Piezas de la Vitrina: de `…-mini.webp` (800 px de ancho) a
 *   `…-grid.webp` (600 px).
 * - Fotos de perfil: de `…-mini.webp` (800 px) a `…-avatar.webp` (cuadrado
 *   de 160 px).
 *
 * La app funciona igual sin correrlo —cada fila apunta a un archivo que
 * existe, viejo o nuevo—; esto solo hace que lo ya subido pese lo mismo que
 * lo nuevo.
 *
 * Cada miniatura nueva sale de la versión completa guardada (el original ya
 * no existe), con la misma función del pipeline, y va a una ruta NUEVA en vez
 * de pisar la vieja: los archivos se sirven con caché de un año (ver
 * `CACHE_CONTROL_INMUTABLE`), así que un navegador que ya tenía la miniatura
 * vieja seguiría mostrándola para siempre si la ruta no cambiara. Orden de
 * cada paso, para que un corte a mitad de camino nunca deje una fila
 * apuntando a algo que no existe: subir la nueva → apuntar la fila → borrar
 * la vieja. Correrlo dos veces no rehace nada: solo toma rutas `-mini.webp`.
 *
 * Usa la clave secreta (se saltea RLS: es una tarea de mantenimiento, no
 * algo que corra la app) y no se ejecuta solo: no está en ningún build.
 *
 * Uso, desde la raíz del repo (lee `.env.local`):
 *
 *   npx tsx scripts/regenerar-miniaturas.ts            # muestra qué haría
 *   npx tsx scripts/regenerar-miniaturas.ts --aplicar  # lo hace
 */
import { createClient } from "@supabase/supabase-js";
import {
  rutaConSufijo,
  SUFIJO_MINIATURA,
  SUFIJO_MINIATURA_LEGADO,
} from "../src/lib/imagenes/almacenamiento";
import { generarMiniatura, type TipoMiniatura } from "../src/lib/imagenes/procesar";
import { CACHE_CONTROL_INMUTABLE } from "../src/lib/storage/firmas";

const BUCKET = "imagenes";
const SUFIJO_LEGADO = `-${SUFIJO_MINIATURA_LEGADO}.webp`;

type Tarea = {
  tabla: "imagenes" | "perfiles";
  id: string;
  columna: "miniatura_path" | "foto_perfil_path";
  vieja: string;
  completa: string;
  tipo: TipoMiniatura;
};

async function main() {
  const aplicar = process.argv.includes("--aplicar");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    try {
      process.loadEnvFile(".env.local");
    } catch {
      // Sin archivo: se avisa abajo qué variable falta.
    }
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SECRET_KEY;
  if (!url || !clave) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SECRET_KEY (en .env.local).");
  }

  const supabase = createClient(url, clave, { auth: { persistSession: false } });

  const [piezas, perfiles] = await Promise.all([
    supabase
      .from("imagenes")
      .select("id, miniatura_path, completa_path")
      .like("miniatura_path", `%${SUFIJO_LEGADO}`),
    supabase
      .from("perfiles")
      .select("id, foto_perfil_path, foto_perfil_completa_path")
      .like("foto_perfil_path", `%${SUFIJO_LEGADO}`)
      .not("foto_perfil_completa_path", "is", null),
  ]);
  if (piezas.error) throw piezas.error;
  if (perfiles.error) throw perfiles.error;

  const tareas: Tarea[] = [
    ...(piezas.data ?? []).map((fila) => ({
      tabla: "imagenes" as const,
      id: fila.id as string,
      columna: "miniatura_path" as const,
      vieja: fila.miniatura_path as string,
      completa: fila.completa_path as string,
      tipo: "cuadricula" as const,
    })),
    ...(perfiles.data ?? []).map((fila) => ({
      tabla: "perfiles" as const,
      id: fila.id as string,
      columna: "foto_perfil_path" as const,
      vieja: fila.foto_perfil_path as string,
      completa: fila.foto_perfil_completa_path as string,
      tipo: "avatar" as const,
    })),
  ];

  console.log(
    `${tareas.length} miniatura(s) para regenerar` +
      (aplicar ? "." : " (vista previa: agrega --aplicar para hacerlo)."),
  );

  let hechas = 0;
  for (const tarea of tareas) {
    const nueva = rutaConSufijo(tarea.vieja, SUFIJO_MINIATURA[tarea.tipo]);
    if (!nueva) {
      console.warn(`  ? ${tarea.tabla} ${tarea.id}: ruta con forma inesperada (${tarea.vieja}), se saltea`);
      continue;
    }
    if (!aplicar) {
      console.log(`  · ${tarea.tabla} ${tarea.id}: ${tarea.vieja} → ${nueva}`);
      continue;
    }

    try {
      const { data: completa, error: errorBajada } = await supabase.storage
        .from(BUCKET)
        .download(tarea.completa);
      if (errorBajada) throw errorBajada;

      const miniatura = await generarMiniatura(
        Buffer.from(await completa.arrayBuffer()),
        tarea.tipo,
      );

      // `upsert`: si una corrida anterior se cortó después de subirla, la
      // ruta nueva existe pero ninguna fila la menciona — pisarla es seguro.
      const { error: errorSubida } = await supabase.storage.from(BUCKET).upload(nueva, miniatura, {
        contentType: "image/webp",
        cacheControl: CACHE_CONTROL_INMUTABLE,
        upsert: true,
      });
      if (errorSubida) throw errorSubida;

      // Solo si la fila sigue apuntando a la vieja: si mientras tanto se
      // subió otra foto de perfil, no hay que pisarla.
      const { data: actualizadas, error: errorFila } = await supabase
        .from(tarea.tabla)
        .update({ [tarea.columna]: nueva })
        .eq("id", tarea.id)
        .eq(tarea.columna, tarea.vieja)
        .select("id");
      if (errorFila) throw errorFila;
      if (!actualizadas?.length) {
        await supabase.storage.from(BUCKET).remove([nueva]);
        console.warn(`  ? ${tarea.tabla} ${tarea.id}: la fila cambió mientras tanto, se deja como está`);
        continue;
      }

      // Limpiar la vieja es lo último: si falla, queda un archivo suelto,
      // nunca una fila rota.
      const { error: errorBorrado } = await supabase.storage.from(BUCKET).remove([tarea.vieja]);
      if (errorBorrado) {
        console.warn(`  ! ${tarea.tabla} ${tarea.id}: no se pudo borrar ${tarea.vieja}`, errorBorrado);
      }

      hechas++;
      console.log(
        `  ✓ ${tarea.tabla} ${tarea.id}: ${nueva} (${Math.round(miniatura.length / 1024)} KB)`,
      );
    } catch (fallo) {
      console.error(`  ✗ ${tarea.tabla} ${tarea.id}: no se pudo regenerar`, fallo);
    }
  }

  if (aplicar) console.log(`Listo: ${hechas} de ${tareas.length}.`);
}

main().catch((fallo) => {
  console.error(fallo);
  process.exit(1);
});
