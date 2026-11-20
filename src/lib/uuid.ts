const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Si un texto que llega de afuera (la URL, el cliente) tiene forma de uuid.
 * Se revisa antes de mandarlo a Postgres: una columna `uuid` comparada con
 * cualquier otra cosa no devuelve "nada", revienta la consulta entera
 * (error 22P02). */
export function esUuid(valor: unknown): valor is string {
  return typeof valor === "string" && FORMATO_UUID.test(valor);
}
