/**
 * Tipo real del archivo de audio, leído de sus primeros bytes — no de la
 * extensión ni del `Content-Type` que manda el navegador, que se falsifican
 * solos (CLAUDE.md → Seguridad). Es el equivalente de lo que hace `sharp`
 * con las imágenes: ahí el tipo lo decide la librería al abrir el archivo,
 * y acá lo decide la firma del contenedor, sin depender de un binario extra
 * como ffmpeg que no cabe en el free tier de Vercel.
 */

/** El archivo no es un audio soportado (o está corrupto). Se distingue de un
 * fallo cualquiera porque la interfaz lo explica de otra manera. */
export class FormatoNoSoportadoError extends Error {
  constructor() {
    super("Formato de audio no soportado");
    this.name = "FormatoNoSoportadoError";
  }
}

export type FormatoAudio = {
  /** Extensión con la que se guarda en Storage. */
  extension: string;
  /** Lo que se guarda como `Content-Type` del objeto: es lo que después
   * define si el `<audio>` del navegador sabe reproducirlo. */
  mime: string;
};

function texto(bytes: Uint8Array, desde: number, largo: number): string {
  return String.fromCharCode(...bytes.subarray(desde, desde + largo));
}

/**
 * Los contenedores que puede producir un navegador grabando con
 * MediaRecorder (WebM/Opus en Chrome y Firefox, MP4/AAC en Safari), más los
 * clásicos que podrían llegar de otro lado. No se acepta nada más: un
 * formato desconocido se rechaza en vez de guardarse "por las dudas".
 */
export function detectarFormato(datos: ArrayBuffer): FormatoAudio {
  const bytes = new Uint8Array(datos);
  if (bytes.length < 12) throw new FormatoNoSoportadoError();

  // Matroska/WebM: EBML header.
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return { extension: "webm", mime: "audio/webm" };
  }

  if (texto(bytes, 0, 4) === "OggS") {
    return { extension: "ogg", mime: "audio/ogg" };
  }

  // MP4/M4A: la caja `ftyp` arranca en el byte 4, después de su tamaño.
  if (texto(bytes, 4, 4) === "ftyp") {
    return { extension: "m4a", mime: "audio/mp4" };
  }

  if (texto(bytes, 0, 4) === "RIFF" && texto(bytes, 8, 4) === "WAVE") {
    return { extension: "wav", mime: "audio/wav" };
  }

  // MP3: con etiqueta ID3 al principio, o directo el sync de un frame MPEG
  // (11 bits en 1). Lo segundo son solo dos bytes, así que se deja último:
  // cualquier otro contenedor reconocible ya salió por arriba.
  if (texto(bytes, 0, 3) === "ID3") {
    return { extension: "mp3", mime: "audio/mpeg" };
  }
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
    return { extension: "mp3", mime: "audio/mpeg" };
  }

  throw new FormatoNoSoportadoError();
}
