/** Límites de una imagen (CLAUDE.md → Reglas de validación y Supuestos).
 * Viven aparte porque los usan los dos lados: el formulario y el selector de
 * archivos del navegador (comodidad) y la Server Action / ruta de API (la
 * garantía real, porque lo del navegador se puede saltear). Este archivo no
 * importa nada de Node a propósito — así también lo puede leer el cliente. */
export const TITULO_MAXIMO = 100;
export const DESCRIPCION_MAXIMA = 500;

/** Tope generoso contra abuso accidental, no una restricción de uso normal:
 * la compresión del pipeline se encarga de que toda foto entre. */
export const TAMANO_MAXIMO_BYTES = 25 * 1024 * 1024;

/** Lo que ofrece el diálogo de archivos del sistema. El tipo real lo vuelve
 * a verificar el servidor abriendo el archivo con sharp. */
export const FORMATOS_ACEPTADOS = "image/jpeg,image/png,image/webp";
