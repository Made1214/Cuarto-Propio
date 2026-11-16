/**
 * Reducir una imagen en el navegador antes de subirla.
 *
 * Por qué existe: Vercel rechaza con 413 cualquier petición de más de 4,5 MB,
 * y una foto de celular pesa 3–12 MB. El pipeline de `sharp` del servidor
 * (miniatura + completa a ~2000 px) no cambia: esto solo achica lo que viaja,
 * a un lado mayor de 2560 px — más que la versión completa que guarda el
 * servidor, así que no se pierde nada que después se fuera a ver.
 *
 * Es código de cliente (canvas, `createImageBitmap`): no importa nada de Node.
 * La validación real del tipo de archivo sigue siendo del servidor; si el
 * navegador no sabe abrir algo, se manda el original tal cual y el servidor
 * responde con su "formato no soportado" de siempre.
 */
import { TAMANO_MAXIMO_BYTES } from "./limites";

export type OpcionesReduccion = {
  /** Lado mayor (en px) al que se lleva la imagen si hay que reducirla. */
  ladoMaximo: number;
  /** Por debajo de este peso (y de `ladoMaximo`) el archivo va tal cual. */
  umbralBytes: number;
  /** Lo que acepta el servidor: si un intento lo supera, se prueba el
   * siguiente paso, más chico o de menor calidad. */
  topeBytes: number;
  /** Conservar transparencia (cursores e iconos): se codifica en PNG, que
   * todos los navegadores saben generar desde un canvas, y nunca en JPEG. */
  conAlfa: boolean;
};

/** Fotos (Vitrina, diario, perfil): bajo 3,5 MB y 2560 px no se toca nada. */
export const OPCIONES_FOTO: OpcionesReduccion = {
  ladoMaximo: 2560,
  umbralBytes: 3.5 * 1024 * 1024,
  topeBytes: TAMANO_MAXIMO_BYTES,
  conAlfa: false,
};

/** Un intento de codificación: escala sobre `ladoMaximo` y calidad 0–1. */
type Paso = { escala: number; calidad: number };

/** Del mejor al más chico. Casi siempre alcanza el primero (una foto de
 * 2560 px en WebP/JPEG 0,9 ronda 1–2 MB); los demás son red de seguridad
 * para fotos con mucho detalle o ruido. */
const PASOS: Paso[] = [
  { escala: 1, calidad: 0.9 },
  { escala: 1, calidad: 0.8 },
  { escala: 0.8, calidad: 0.8 },
  { escala: 0.625, calidad: 0.75 },
];

/**
 * Dimensiones de destino conservando la proporción. Nunca agranda (una
 * imagen chica queda igual) y nunca devuelve un lado de 0 px. Lógica pura,
 * sin DOM, para poder probarla sola.
 */
export function dimensionesDestino(
  ancho: number,
  alto: number,
  ladoMaximo: number,
): { ancho: number; alto: number } {
  const mayor = Math.max(ancho, alto);
  if (mayor <= ladoMaximo) return { ancho, alto };
  const factor = ladoMaximo / mayor;
  return {
    ancho: Math.max(1, Math.round(ancho * factor)),
    alto: Math.max(1, Math.round(alto * factor)),
  };
}

/** ¿Hace falta volver a codificar? Solo si pesa o mide de más. */
export function necesitaReducir(
  bytes: number,
  ancho: number,
  alto: number,
  opciones: Pick<OpcionesReduccion, "ladoMaximo" | "umbralBytes">,
): boolean {
  return bytes > opciones.umbralBytes || Math.max(ancho, alto) > opciones.ladoMaximo;
}

function codificar(canvas: HTMLCanvasElement, tipo: string, calidad: number): Promise<Blob | null> {
  return new Promise((resolver) => canvas.toBlob(resolver, tipo, calidad));
}

/** El nombre original con la extensión del formato nuevo: el servidor no lo
 * usa para decidir nada, pero así el archivo sigue siendo reconocible. */
function renombrar(nombre: string, tipo: string): string {
  const extension = tipo === "image/png" ? "png" : tipo === "image/webp" ? "webp" : "jpg";
  const base = nombre.replace(/\.[^.]+$/, "") || "imagen";
  return `${base}.${extension}`;
}

/**
 * Devuelve el archivo listo para subir: el original si ya es liviano, o una
 * versión re-codificada. Nunca falla: ante cualquier problema del navegador
 * devuelve el original y que decida el servidor.
 *
 * Quien llama debe comparar el resultado (no el original) con el tope: si
 * ni el último paso entra, se devuelve igual el intento más chico.
 */
export async function reducirImagen(
  archivo: File,
  opciones: OpcionesReduccion = OPCIONES_FOTO,
): Promise<File> {
  // Un SVG es vectorial (y casi siempre pesa poco): rasterizarlo acá lo
  // empeoraría, y `createImageBitmap` no los abre en todos los navegadores.
  if (archivo.type === "image/svg+xml") return archivo;
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return archivo;

  let imagen: ImageBitmap;
  try {
    // "from-image" aplica la orientación EXIF: el canvas no guarda EXIF, así
    // que si no se endereza acá, la foto de costado llegaría de costado.
    imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  } catch {
    return archivo;
  }

  const canvas = document.createElement("canvas");
  try {
    if (!necesitaReducir(archivo.size, imagen.width, imagen.height, opciones)) return archivo;

    const contexto = canvas.getContext("2d");
    if (!contexto) return archivo;

    let mejor: Blob | null = null;
    for (const paso of PASOS) {
      const { ancho, alto } = dimensionesDestino(
        imagen.width,
        imagen.height,
        Math.round(opciones.ladoMaximo * paso.escala),
      );
      canvas.width = ancho;
      canvas.height = alto;
      contexto.imageSmoothingQuality = "high";

      let blob: Blob | null;
      if (opciones.conAlfa) {
        contexto.clearRect(0, 0, ancho, alto);
        contexto.drawImage(imagen, 0, 0, ancho, alto);
        blob = await codificar(canvas, "image/png", paso.calidad);
      } else {
        contexto.drawImage(imagen, 0, 0, ancho, alto);
        blob = await codificar(canvas, "image/webp", paso.calidad);
        // Safari no sabe generar WebP desde un canvas y devuelve PNG, que
        // para una foto pesa varias veces más: ahí se pasa a JPEG. JPEG no
        // tiene transparencia, así que se pinta un fondo blanco debajo (si
        // no, lo transparente de un PNG saldría negro).
        if (!blob || blob.type !== "image/webp") {
          contexto.fillStyle = "#ffffff";
          contexto.fillRect(0, 0, ancho, alto);
          contexto.drawImage(imagen, 0, 0, ancho, alto);
          blob = await codificar(canvas, "image/jpeg", paso.calidad);
        }
      }

      if (!blob) continue;
      if (!mejor || blob.size < mejor.size) mejor = blob;
      if (blob.size <= opciones.topeBytes) break;
    }

    if (!mejor) return archivo;
    // Si el original ya era más liviano que cualquier intento (pasa con
    // imágenes enormes pero muy simples), no tiene sentido cambiarlo.
    if (mejor.size >= archivo.size) return archivo;
    return new File([mejor], renombrar(archivo.name, mejor.type), {
      type: mejor.type,
      lastModified: archivo.lastModified,
    });
  } catch {
    return archivo;
  } finally {
    imagen.close();
    // Suelta la memoria del canvas ya, sin esperar al recolector: una foto
    // de 2560 px ocupa ~25 MB descomprimida, y en lote se suman.
    canvas.width = 0;
    canvas.height = 0;
  }
}
