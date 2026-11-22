/**
 * Zona horaria de la usuaria.
 *
 * Las fechas se guardan en UTC, pero se muestran y se agrupan en la hora de
 * quien las mira: una entrada escrita el 15 a las 21:30 en UTC−5 es del 15,
 * aunque en UTC ya sea el 16. El navegador conoce la zona; el servidor no.
 * `SincronizarZona` la deja en una cookie y `src/i18n/request.ts` se la pasa
 * a next-intl, así el servidor y el cliente formatean igual.
 *
 * Funciona solo con `Intl`, sin librerías de fechas.
 */

export const COOKIE_ZONA = "zona";

/** La zona si `Intl` la reconoce (p. ej. `America/Lima`); si no, `undefined`. */
export function zonaValida(valor: unknown): string | undefined {
  if (typeof valor !== "string" || valor.length === 0 || valor.length > 64) return undefined;
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: valor }).resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

/** Año, mes (1–12) y día de un instante, tal como se ven en `zona`. */
export function partesEnZona(
  instante: Date,
  zona: string,
): { anio: number; mes: number; dia: number } {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: zona,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(instante);
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);
  return { anio: valor("year"), mes: valor("month"), dia: valor("day") };
}

/** `YYYY-MM` del instante en `zona`. */
export function claveMes(instante: Date, zona: string): string {
  const { anio, mes } = partesEnZona(instante, zona);
  return `${anio}-${String(mes).padStart(2, "0")}`;
}

/** Minutos que `zona` está adelantada respecto de UTC en ese instante (Lima: −300). */
function desfaseMinutos(instante: Date, zona: string): number {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: zona,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(instante);
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);
  const comoUtc = Date.UTC(
    valor("year"),
    valor("month") - 1,
    valor("day"),
    valor("hour"),
    valor("minute"),
    valor("second"),
  );
  return Math.round((comoUtc - Math.floor(instante.getTime() / 1000) * 1000) / 60000);
}

/** Instante UTC de la medianoche del día 1 de ese mes en `zona`. `indiceMes`
 * empieza en 0 y puede pasarse de 11 (se corre al año siguiente). */
export function inicioDeMes(anio: number, indiceMes: number, zona: string): Date {
  const comoUtc = Date.UTC(anio, indiceMes, 1);
  // Dos pasadas: el desfase de la medianoche local puede no ser el de la
  // medianoche UTC si justo cambia el horario de verano.
  let instante = comoUtc - desfaseMinutos(new Date(comoUtc), zona) * 60000;
  instante = comoUtc - desfaseMinutos(new Date(instante), zona) * 60000;
  return new Date(instante);
}
