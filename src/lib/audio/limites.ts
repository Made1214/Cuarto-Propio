/** Límites de una nota de audio (CLAUDE.md → Supuestos por defecto). Igual
 * que en imágenes, viven aparte porque los leen los dos lados: el grabador
 * del navegador (comodidad: corta solo al llegar al tope) y la ruta de API
 * (la garantía real, porque lo del navegador se puede saltear). Este archivo
 * no importa nada de Node a propósito — así también lo puede leer el
 * cliente. */
export const TITULO_MAXIMO = 100;

/** Diez minutos por nota. No es una restricción de comodidad: junto con el
 * bitrate de abajo es lo que acota el tamaño del archivo sin tener que
 * comprimir en un segundo paso como sí pasa con las fotos. */
export const DURACION_MAXIMA_SEGUNDOS = 10 * 60;

/** Bitrate al que graba el navegador: 32 kbps, de sobra para voz. Sin
 * pedirlo, MediaRecorder graba a ~0,92 MB por minuto (medido), y Vercel
 * rechaza con 413 toda petición de más de 4,5 MB: una nota de más de ~5
 * minutos no se podría guardar en producción. A 32 kbps, 10 minutos pesan
 * ~2,4 MB. Es un pedido al navegador, no una garantía (algunos lo redondean
 * a lo que soporta su códec); la garantía es el tope de tamaño. */
export const BITRATE_AUDIO_BPS = 32_000;

/** 4 MB: por debajo del límite de 4,5 MB por petición de Vercel, dejando
 * margen para el resto del formulario (título, categoría, duración) que viaja
 * en la misma petición. Una grabación normal de 10 minutos a 32 kbps queda en
 * ~2,4 MB; el tope está para el navegador que ignore el bitrate pedido, y así
 * el error es nuestro y claro en vez de un 413 de Vercel. */
export const TAMANO_MAXIMO_BYTES = 4 * 1024 * 1024;
