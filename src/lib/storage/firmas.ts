import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * URLs firmadas estables: la misma ruta devuelve la MISMA URL durante horas,
 * en vez de una nueva en cada carga de página.
 *
 * Por qué importa: el navegador cachea por URL, y el token de la firma es
 * parte de la URL. Si cada visita a la Vitrina trae tokens nuevos, el
 * navegador ve URLs que nunca vio y vuelve a bajar todas las miniaturas, la
 * foto de perfil y los audios — datos móviles de la usuaria y egress del free
 * tier de Supabase gastados en archivos que ya tenía.
 *
 * Por qué un caché en memoria del módulo y no el caché de datos de Next:
 * - `"use cache"` / `"use cache: private"` exigen activar `cacheComponents`,
 *   que cambia cómo se prerenderiza toda la app — demasiado para esto.
 * - `unstable_cache` (deprecado en Next 16) no puede recibir el cliente de
 *   Supabase de la request (los argumentos son la clave del caché) ni leer
 *   cookies adentro: obligaría a firmar con la service role key, que hoy la
 *   app no usa en ningún lado. Además rompería el lote: una entrada por
 *   combinación de rutas, o una ida a la red por ruta.
 * - Un `Map` en memoria firma con el mismo cliente de siempre (las políticas
 *   de Storage siguen mirando cada firma nueva), no agrega dependencias y
 *   falla hacia lo de antes: en Vercel vive por instancia, así que una
 *   instancia nueva arranca vacía y simplemente firma de nuevo. Con Fluid
 *   Compute las instancias se reutilizan entre requests, que es justo cuando
 *   sirve.
 *
 * Seguridad — por qué compartir el caché entre requests no filtra nada:
 * - La clave es `bucket/ruta`, y la ruta empieza con el `usuario_id` dueño
 *   del archivo (ver `guardarVersiones` / `guardarAudio`).
 * - Un acierto del caché se salta el chequeo de Storage al firmar, así que la
 *   garantía viene de quién llama: solo se le pasan rutas que salieron de una
 *   consulta a la base con RLS (o sea, rutas que esa usuaria ya puede ver).
 *   Nunca hay que pasarle una ruta que mande el cliente.
 * - La URL firmada es en sí misma la credencial: quien ya la tiene puede
 *   abrir el archivo hasta que venza, con o sin caché. El caché no entrega
 *   nada a nadie que no pudiera obtener la misma ruta por su cuenta.
 *
 * Las rutas son inmutables: cada subida usa un UUID nuevo y nada se
 * sobrescribe, así que una URL cacheada nunca apunta a un contenido distinto
 * del que se firmó. Al borrar un archivo se saca del caché igual, por prolijo.
 */

/** Un día de vida para cada firma: sigue venciendo sola (una URL copiada por
 * accidente no queda viva para siempre), pero da margen para reutilizarla. */
const SEGUNDOS_FIRMA = 24 * 60 * 60;

/** Nunca se entrega una URL a la que le queden menos de 12 horas: una pestaña
 * abierta toda la noche, o una miniatura con lazy loading que se pide recién
 * al hacer scroll, siguen encontrando su URL viva. En la práctica cada firma
 * se reutiliza durante sus primeras 12 horas y después se renueva. */
const MS_VIDA_MINIMA = 12 * 60 * 60 * 1000;

/** `Cache-Control` con el que se suben los archivos (supabase-js lo manda
 * como `max-age=<esto>` y Storage lo devuelve al servirlos). Un año: cada
 * subida tiene ruta nueva con UUID y nunca se sobrescribe, así que el
 * contenido de una URL no cambia jamás. Con el default de supabase-js (una
 * hora) el navegador volvería a preguntarle a Storage cada hora aunque la URL
 * siga siendo la misma. Que el caché dure más que la firma no abre nada: es
 * el caché privado de quien ya bajó el archivo con una URL válida. */
export const CACHE_CONTROL_INMUTABLE = String(365 * 24 * 60 * 60);

/** Tope de entradas para que el caché no crezca sin fin en una instancia que
 * vive mucho. A escala personal (cientos de piezas y audios) no se alcanza. */
const MAXIMO_ENTRADAS = 5000;

type Firma = { url: string; venceEn: number };

const cache = new Map<string, Firma>();

const clave = (bucket: string, path: string) => `${bucket}/${path}`;

/** Firma varias rutas de un bucket y devuelve un mapa ruta → URL, reusando
 * las firmas que todavía tienen vida de sobra y pidiendo a Storage solo las
 * que faltan, en una sola llamada. Una ruta que Storage no firme queda fuera
 * del mapa (quien llama decide cómo pintar el hueco); un error de la llamada
 * entera se propaga, igual que antes del caché. */
export async function firmarConCache(
  supabase: SupabaseClient,
  bucket: string,
  paths: string[],
): Promise<Map<string, string>> {
  const firmadas = new Map<string, string>();
  const ahora = Date.now();
  const faltan: string[] = [];

  for (const path of new Set(paths)) {
    if (!path) continue;
    const firma = cache.get(clave(bucket, path));
    if (firma && firma.venceEn - ahora >= MS_VIDA_MINIMA) {
      firmadas.set(path, firma.url);
    } else {
      faltan.push(path);
    }
  }

  if (faltan.length === 0) return firmadas;

  // El vencimiento se toma ANTES de pedir la firma: así la cuenta queda
  // corta por unos milisegundos y nunca larga — lo seguro es creer que la
  // URL vence un poco antes de lo que de verdad vence.
  const venceEn = Date.now() + SEGUNDOS_FIRMA * 1000;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(faltan, SEGUNDOS_FIRMA);
  if (error) throw error;

  for (const fila of data ?? []) {
    if (!fila.signedUrl || !fila.path) continue;
    firmadas.set(fila.path, fila.signedUrl);
    guardar(clave(bucket, fila.path), { url: fila.signedUrl, venceEn });
  }
  return firmadas;
}

/** Saca rutas del caché, para llamar después de borrarlas de Storage. */
export function olvidarFirmas(bucket: string, paths: string[]): void {
  for (const path of paths) cache.delete(clave(bucket, path));
}

function guardar(llave: string, firma: Firma): void {
  // `delete` antes de `set` para que la entrada pase al final del orden de
  // inserción del Map: así lo primero del Map es siempre lo más viejo.
  cache.delete(llave);
  cache.set(llave, firma);
  if (cache.size <= MAXIMO_ENTRADAS) return;

  // Primero se tiran las que ya no sirven; si con eso no alcanza, las más
  // viejas. Pasa rara vez, así que recorrer el Map entero no pesa.
  const ahora = Date.now();
  for (const [k, f] of cache) {
    if (f.venceEn - ahora < MS_VIDA_MINIMA) cache.delete(k);
  }
  for (const k of cache.keys()) {
    if (cache.size <= MAXIMO_ENTRADAS) break;
    cache.delete(k);
  }
}
