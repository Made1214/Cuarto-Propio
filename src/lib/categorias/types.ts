export type Categoria = {
  id: string;
  nombre: string;
  /** Fecha de creación (ISO). Solo la usa el color de la categoría para
   * asignarlo en orden de creación; puede faltar en una categoría que se
   * acaba de escribir y todavía no volvió del servidor. */
  creadoEn?: string;
};
