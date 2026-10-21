export type Imagen = {
  id: string;
  /** Código corto y opaco — es lo que se usa en la URL, nunca el id (UUID). */
  codigo: string;
  titulo: string | null;
  descripcion: string | null;
  hashtags: string[];
  categoriaId: string | null;
  categoriaNombre: string | null;
  miniaturaPath: string;
  completaPath: string;
  /** Medidas de la versión completa; la miniatura conserva la proporción.
   * Sirven para reservar el espacio de la tarjeta antes de que cargue la
   * foto, así la cuadrícula no salta mientras se llena. */
  ancho: number | null;
  alto: number | null;
  fecha: string;
};

/** Imagen lista para la cuadrícula: el bucket es privado, así que la URL se
 * firma al momento de renderizar y vence sola. */
export type ImagenEnVitrina = Imagen & { miniaturaUrl: string | null };

export type ImagenConVersionCompleta = Imagen & {
  miniaturaUrl: string | null;
  completaUrl: string | null;
};

export type HashtagConteo = { nombre: string; cantidad: number };

/** Resultado de actualizarImagen para useActionState: solo lleva algo
 * cuando la validación falla. */
export type ImagenActionState = { error?: string; guardado?: boolean } | undefined;
