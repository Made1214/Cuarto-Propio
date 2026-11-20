/** Límites de una imagen (CLAUDE.md → Reglas de validación y Supuestos).
 * Viven aparte porque los usan los dos lados: el formulario y el selector de
 * archivos del navegador (comodidad) y la Server Action / ruta de API (la
 * garantía real, porque lo del navegador se puede saltear). Este archivo no
 * importa nada de Node a propósito — así también lo puede leer el cliente. */
export const TITULO_MAXIMO = 100;
export const DESCRIPCION_MAXIMA = 500;

/** Lo máximo que puede pesar lo que llega a la ruta de API. Es 4 MB y no
 * más porque Vercel corta con 413 toda petición de más de 4,5 MB (en
 * cualquier plan) y el formulario suma unos bytes al archivo. No restringe
 * a la usuaria: el navegador reduce la foto antes de subirla
 * (`reducir.ts`), y una de 2560 px queda muy por debajo. */
export const TAMANO_MAXIMO_BYTES = 4 * 1024 * 1024;

/** Tope del archivo original, antes de que el navegador lo reduzca
 * (CLAUDE.md → Supuestos: 25 MB). Solo contra abuso accidental: evita
 * decodificar en el celular algo absurdo que igual no tendría sentido subir. */
export const TAMANO_MAXIMO_ORIGINAL_BYTES = 25 * 1024 * 1024;

/** Lo que ofrece el diálogo de archivos del sistema. El tipo real lo vuelve
 * a verificar el servidor abriendo el archivo con sharp. */
export const FORMATOS_ACEPTADOS = "image/jpeg,image/png,image/webp";
