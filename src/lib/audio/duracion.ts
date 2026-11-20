/** `m:ss` — el formato de un reproductor, no de un texto en prosa. Lo usan
 * el grabador mientras corre el contador y la tarjeta de cada nota, así que
 * vive suelto y sin importar nada del servidor. */
export function formatearDuracion(segundos: number): string {
  const enteros = Math.max(0, Math.floor(segundos));
  const minutos = Math.floor(enteros / 60);
  const resto = enteros % 60;
  return `${minutos}:${String(resto).padStart(2, "0")}`;
}
