/** Lo que la interfaz necesita saber de quien está adentro: cómo se llama,
 * con qué email entró y su foto ya firmada (o `null` si todavía no subió
 * ninguna, que es el caso normal al empezar). */
export type PerfilVisible = {
  nombre: string | null;
  email: string | null;
  fotoUrl: string | null;
};
