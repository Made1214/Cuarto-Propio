/** "210 MB", "1,2 GB": tamaños legibles para el medidor de espacio. Va
 * aparte de `uso.ts` porque también lo usa el panel de perfil, que es de
 * cliente y no puede importar el cliente de Supabase del servidor. */
export function formatearBytes(bytes: number, locale: string): string {
  const unidades = ["B", "KB", "MB", "GB"] as const;
  let valor = bytes;
  let indice = 0;
  while (valor >= 1024 && indice < unidades.length - 1) {
    valor /= 1024;
    indice += 1;
  }
  const numero = new Intl.NumberFormat(locale, {
    maximumFractionDigits: valor < 10 && indice > 0 ? 1 : 0,
  }).format(valor);
  return `${numero} ${unidades[indice]}`;
}
