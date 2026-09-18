import type { JSONContent } from "@tiptap/core";
import type { Categoria } from "@/lib/categorias/types";

export type { Categoria };

export type EntradaResumen = {
  id: string;
  /** Código corto y opaco — es lo que se usa en la URL, nunca el id (UUID). */
  codigo: string;
  titulo: string | null;
  fecha: string;
  categoria: Categoria | null;
  extracto: string;
};

export type Entrada = {
  id: string;
  codigo: string;
  titulo: string | null;
  contenido: JSONContent;
  fecha: string;
  categoriaId: string | null;
  categoriaNombre: string | null;
};

/** Resultado de crearEntrada/actualizarEntrada para useActionState: solo
 * lleva algo cuando la validación falla — el caso de éxito redirige, nunca
 * "vuelve" a renderizar el formulario. */
export type EntradaActionState = { error?: string } | undefined;
