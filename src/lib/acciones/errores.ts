import { unstable_isUnrecognizedActionError } from "next/navigation";

/**
 * Por qué falló una Server Action llamada desde el cliente, en las dos
 * clases que la interfaz trata distinto:
 *
 * - "desactualizada": el servidor no reconoce la action. Pasa cuando la
 *   pestaña quedó abierta con el código de antes de un deploy (o, en
 *   desarrollo, de antes de editar el archivo de actions): el cliente pide
 *   una action por un id que el servidor nuevo ya no tiene. Reintentar no
 *   sirve; recargar la página trae el código nuevo y listo.
 * - "fallo": todo lo demás (la conexión, Supabase). Reintentar sí puede
 *   servir.
 */
export type ErrorAccion = "fallo" | "desactualizada";

export function clasificarErrorAccion(fallo: unknown): ErrorAccion {
  return unstable_isUnrecognizedActionError(fallo) ? "desactualizada" : "fallo";
}
