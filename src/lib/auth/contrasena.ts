/**
 * Requisitos mínimos de contraseña al crear cuenta o elegir una nueva.
 *
 * Se validan en los dos lados: en el formulario (la lista de requisitos se
 * va tachando mientras se escribe) y en la Server Action, para que no se
 * puedan saltear. Supabase exige 6 caracteres por defecto; acá pedimos un
 * poco más sin volverlo un trámite.
 */
export const REQUISITOS_CONTRASENA = [
  { clave: "reqLargo", cumple: (valor: string) => valor.length >= 8 },
  { clave: "reqLetra", cumple: (valor: string) => /\p{L}/u.test(valor) },
  { clave: "reqNumero", cumple: (valor: string) => /\d/.test(valor) },
] as const;

export function contrasenaValida(valor: string): boolean {
  return REQUISITOS_CONTRASENA.every((requisito) => requisito.cumple(valor));
}
