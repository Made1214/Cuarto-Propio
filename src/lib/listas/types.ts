export type ItemLista = {
  id: string;
  contenido: string;
  /** Solo tiene sentido cuando la lista es de casillas. */
  marcado: boolean;
};

export type ListaConItems = {
  id: string;
  nombre: string;
  categoriaId: string | null;
  categoriaNombre: string | null;
  /** La lista entera es de notas (false) o de casillas (true). */
  conCasillas: boolean;
  items: ItemLista[];
};
