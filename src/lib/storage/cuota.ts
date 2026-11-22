import { obtenerUsoStorage } from "./uso";
import { LIMITE_STORAGE_BYTES } from "./limites";

/**
 * Espacio máximo por cuenta. Por defecto, el GB del plan gratuito entero
 * (con una sola usuaria, su tope es el del proyecto). Con registro abierto,
 * `CUOTA_STORAGE_MB` en las variables del servidor lo baja, para que una
 * cuenta sola no pueda llenar el espacio que comparten todas.
 */
export function cuotaPorCuentaBytes(): number {
  const mb = Number(process.env.CUOTA_STORAGE_MB);
  return Number.isFinite(mb) && mb > 0 ? Math.floor(mb * 1024 * 1024) : LIMITE_STORAGE_BYTES;
}

/** Si `uso + nuevos` entra en la cuota. Pura, para poder probarla. */
export function entraEnCuota(uso: number | null, nuevos: number, cuota: number): boolean {
  // Sin dato de uso (migración 0010 sin aplicar, o la base no respondió) no
  // se bloquea: un medidor que falta no debe impedir guardar.
  if (uso === null) return true;
  return uso + nuevos <= cuota;
}

/**
 * Antes de subir un archivo: `true` si todavía hay lugar en la cuenta para
 * `bytesNuevos`. Las rutas de subida responden `{ error: "espacio" }` (507)
 * cuando no. Se mira sobre lo que llega al servidor; lo que termina
 * guardado (miniatura + completa) suele pesar menos.
 */
export async function hayEspacioPara(bytesNuevos: number): Promise<boolean> {
  return entraEnCuota(await obtenerUsoStorage(), bytesNuevos, cuotaPorCuentaBytes());
}
