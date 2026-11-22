import { cookies } from "next/headers";
import { COOKIE_ZONA, zonaValida } from "./zona";

/** Zona horaria guardada por `SincronizarZona`, o `undefined` si todavía no
 * se conoce (primera visita). Solo en pantallas con sesión: leer cookies
 * vuelve dinámica la página, y las públicas se prerenderizan. */
export async function zonaGuardada(): Promise<string | undefined> {
  const valor = (await cookies()).get(COOKIE_ZONA)?.value;
  if (!valor) return undefined;
  try {
    return zonaValida(decodeURIComponent(valor));
  } catch {
    return undefined;
  }
}

/** Zona con la que mostrar fechas en el servidor: la guardada o UTC. */
export async function zonaUsuaria(): Promise<string> {
  return (await zonaGuardada()) ?? "UTC";
}
