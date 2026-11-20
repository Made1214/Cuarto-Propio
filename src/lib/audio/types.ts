export type NotaAudio = {
  id: string;
  /** NULL cuando la usuaria no le puso título: la interfaz muestra en su
   * lugar un default con la fecha y la hora (ver `tituloPorDefecto`). */
  titulo: string | null;
  categoriaId: string | null;
  categoriaNombre: string | null;
  /** La mide el navegador al grabar; puede faltar en una nota vieja o si el
   * cliente no la mandó. */
  duracionSegundos: number | null;
  archivoPath: string;
  fecha: string;
};

/** Nota lista para reproducir: el bucket es privado, así que la URL se firma
 * al momento de renderizar y vence sola. */
export type NotaAudioConUrl = NotaAudio & { url: string | null };
