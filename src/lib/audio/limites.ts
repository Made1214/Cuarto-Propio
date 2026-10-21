/** Límites de una nota de audio (CLAUDE.md → Supuestos por defecto). Igual
 * que en imágenes, viven aparte porque los leen los dos lados: el grabador
 * del navegador (comodidad: corta solo al llegar al tope) y la ruta de API
 * (la garantía real, porque lo del navegador se puede saltear). Este archivo
 * no importa nada de Node a propósito — así también lo puede leer el
 * cliente. */
export const TITULO_MAXIMO = 100;

/** Diez minutos por nota. No es una restricción de comodidad: es lo que
 * acota el tamaño del archivo sin tener que comprimir en un segundo paso
 * como sí pasa con las fotos (~1MB por minuto en WebM/Opus). */
export const DURACION_MAXIMA_SEGUNDOS = 10 * 60;

/** Tope generoso contra abuso accidental. Con la duración máxima de arriba
 * ninguna grabación del navegador se le acerca; está para el caso raro de un
 * códec que grabe mucho más pesado de lo esperado. */
export const TAMANO_MAXIMO_BYTES = 50 * 1024 * 1024;
