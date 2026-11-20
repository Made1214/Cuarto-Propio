import sharp, { type ResizeOptions, type Sharp } from "sharp";

export { TAMANO_MAXIMO_BYTES } from "./limites";

/**
 * Pipeline único de imágenes de toda la app (CLAUDE.md): de cada archivo
 * salen DOS versiones, nunca una sola comprimida a la fuerza. Lo usa la
 * Vitrina y lo van a usar las imágenes incrustadas del diario y la foto de
 * perfil, sin reimplementarlo por módulo.
 *
 * Lo único que cambia según quién lo llama es la FORMA de la miniatura (ver
 * `MINIATURAS`): la cuadrícula necesita una tira de ~600 px de ancho y el
 * avatar un cuadradito. Sigue siendo el mismo pipeline —mismo chequeo de
 * formato, misma rotación, misma versión completa—, no uno aparte por
 * módulo: una miniatura de 800 px para un avatar de 28 px hacía bajar 25
 * veces más píxeles de los que se ven en cada pantalla.
 */

/** Formatos aceptados, según lo que sharp dice que ES el archivo — no lo que
 * dice su extensión ni su `Content-Type` (requerimiento de seguridad). */
const FORMATOS_SOPORTADOS = new Set(["jpeg", "png", "webp"]);

const ANCHO_COMPLETA = 2000;

/** Para qué se va a usar la miniatura. */
export type TipoMiniatura = "cuadricula" | "avatar";

/**
 * Cómo sale cada miniatura.
 *
 * - `cuadricula`: la columna de la Vitrina mide entre 240 y 300 px de CSS en
 *   pantalla ancha y hasta ~400 en un celular (una sola columna). 600 px
 *   cubren de sobra la pantalla ancha a densidad 2 y el celular a ~1,7 —
 *   donde una foto ya se ve nítida— y pesan cerca de la mitad que los 800 de
 *   antes. La ficha usa la versión completa, así que esto no le quita
 *   detalle a nada que se mire de cerca.
 * - `avatar`: el avatar se ve a 28 px en la barra y a 68 en el panel de
 *   perfil. 160 px en cuadrado cubren el panel a densidad 2 y la barra a 3
 *   (y pesan unos pocos KB). Recortado al centro, igual que el
 *   `object-cover` con que se pinta, así no cambia el encuadre que ya se
 *   veía.
 *
 * `withoutEnlargement` en las dos: una foto más chica que el tamaño pedido
 * se queda como está en vez de inflarse (borrosa y más pesada).
 */
const MINIATURAS: Record<TipoMiniatura, { redimension: ResizeOptions; calidad: number }> = {
  cuadricula: {
    redimension: { width: 600, withoutEnlargement: true },
    calidad: 78,
  },
  avatar: {
    redimension: { width: 160, height: 160, fit: "cover", position: "centre", withoutEnlargement: true },
    calidad: 80,
  },
};

/** El archivo no es una imagen soportada (o está corrupto). Se distingue de
 * un fallo cualquiera porque la interfaz lo explica de otra manera. */
export class FormatoNoSoportadoError extends Error {
  constructor() {
    super("Formato de imagen no soportado");
    this.name = "FormatoNoSoportadoError";
  }
}

export type VersionesImagen = {
  /** Cuadrícula masonry, o el avatar (según `tipoMiniatura`). */
  miniatura: Buffer;
  /** Qué forma tiene la miniatura: decide el nombre del archivo al guardarla
   * (ver `guardarVersiones`). */
  tipoMiniatura: TipoMiniatura;
  /** Ficha de la imagen (zoom/detalle). */
  completa: Buffer;
  ancho: number;
  alto: number;
};

/**
 * Arma una miniatura a partir de una imagen ya abierta. Exportada aparte de
 * `procesarImagen` para que el script que regenera las miniaturas viejas
 * (`scripts/regenerar-miniaturas.ts`) use exactamente estos mismos tamaños
 * en vez de copiarlos.
 *
 * `rotate()` sin argumentos aplica la orientación EXIF y la descarta: sin
 * esto, una foto tomada de costado con el celular se guarda acostada.
 */
export function generarMiniatura(
  imagen: Buffer | Sharp,
  tipo: TipoMiniatura,
): Promise<Buffer> {
  const { redimension, calidad } = MINIATURAS[tipo];
  const base = Buffer.isBuffer(imagen) ? sharp(imagen).rotate() : imagen.clone();
  return base.resize(redimension).webp({ quality: calidad }).toBuffer();
}

export async function procesarImagen(
  datos: ArrayBuffer,
  tipoMiniatura: TipoMiniatura = "cuadricula",
): Promise<VersionesImagen> {
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

  // Rotada una sola vez y clonada para cada versión (ver `generarMiniatura`).
  const base = sharp(original).rotate();

  const completa = await base
    .clone()
    .resize({ width: ANCHO_COMPLETA, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const miniatura = await generarMiniatura(base, tipoMiniatura);

  return {
    miniatura,
    tipoMiniatura,
    completa: completa.data,
    ancho: completa.info.width,
    alto: completa.info.height,
  };
}
