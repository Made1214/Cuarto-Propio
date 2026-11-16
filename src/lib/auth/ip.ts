/** Lo que se manda cuando no hay una IP confiable (en local, sin proxy). */
export const IP_DESCONOCIDA = "desconocida";

/** Lo justo para leer encabezados: sirve el `Headers` de `next/headers` y
 * cualquier objeto de prueba. */
type Encabezados = { get(nombre: string): string | null };

/**
 * La IP del cliente, para contar los fallos de login por correo **e** IP
 * (migración 0012).
 *
 * `x-forwarded-for` trae una cadena "cliente, proxy1, proxy2": el primer
 * valor es el cliente. En Vercel ese encabezado lo pone la propia plataforma
 * (pisa el que mande el navegador), así que es confiable; fuera de Vercel,
 * cualquiera podría inventarlo. Respaldo: `x-real-ip`, y si no hay nada (en
 * local), un valor fijo.
 *
 * Acá solo se descarta lo que obviamente no es una IP (largo o caracteres
 * raros); la base vuelve a validarla y la deja en su forma canónica.
 */
export function ipCliente(h: Encabezados): string {
  const reenviada = h.get("x-forwarded-for")?.split(",")[0];
  for (const candidata of [reenviada, h.get("x-real-ip")]) {
    const ip = candidata?.trim().toLowerCase();
    if (ip && ip.length <= 45 && /^[0-9a-f.:]+$/.test(ip)) return ip;
  }
  return IP_DESCONOCIDA;
}
