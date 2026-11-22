/** Forma de comparar nombres de categoría: sin distinguir mayúsculas ni
 * espacios de más, para que "Viajes" y "viajes " sean la misma. La usan el
 * servidor (`resolver.ts`) y los selectores, así los dos coinciden. */
export function claveCategoria(nombre: string): string {
  return nombre.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
}
