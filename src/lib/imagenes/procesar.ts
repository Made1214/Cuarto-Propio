import sharp from "sharp";

export { TAMANO_MAXIMO_BYTES } from "./limites";

/**
 * Pipeline único de imágenes de toda la app (CLAUDE.md): de cada archivo
 * salen DOS versiones, nunca una sola comprimida a la fuerza. Lo usa la
 * Vitrina y lo van a usar las imágenes incrustadas del diario y la foto de
 * perfil, sin reimplementarlo por módulo.
 */

/** Formatos aceptados, según lo que sharp dice que ES el archivo — no lo que
 * dice su extensión ni su `Content-Type` (requerimiento de seguridad). */
const FORMATOS_SOPORTADOS = new Set(["jpeg", "png", "webp"]);

const ANCHO_MINIATURA = 800;
const ANCHO_COMPLETA = 2000;

/** El archivo no es una imagen soportada (o está corrupto). Se distingue de
 * un fallo cualquiera porque la interfaz lo explica de otra manera. */
export class FormatoNoSoportadoError extends Error {
  constructor() {
    super("Formato de imagen no soportado");
    this.name = "FormatoNoSoportadoError";
  }
}

export type VersionesImagen = {
  /** Cuadrícula masonry. */
  miniatura: Buffer;
  /** Ficha de la imagen (zoom/detalle). */
  completa: Buffer;
  ancho: number;
  alto: number;
};

export async function procesarImagen(datos: ArrayBuffer): Promise<VersionesImagen> {
  const original = Buffer.from(datos);

  let formato: string | undefined;
  try {
    formato = (await sharp(original).metadata()).format;
  } catch {
    throw new FormatoNoSoportadoError();
  }
  if (!formato || !FORMATOS_SOPORTADOS.has(formato)) {
    throw new FormatoNoSoportadoError();
  }

  // `rotate()` sin argumentos aplica la orientación EXIF y la descarta: sin
  // esto, una foto tomada de costado con el celular se guarda acostada.
  const base = sharp(original).rotate();

  const completa = await base
    .clone()
    .resize({ width: ANCHO_COMPLETA, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const miniatura = await base
    .clone()
    .resize({ width: ANCHO_MINIATURA, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();

  return {
    miniatura,
    completa: completa.data,
    ancho: completa.info.width,
    alto: completa.info.height,
  };
}
