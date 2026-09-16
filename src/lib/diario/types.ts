import type { JSONContent } from "@tiptap/core";

export type Categoria = {
  id: string;
  nombre: string;
};

export type EntradaResumen = {
  id: string;
  titulo: string | null;
  fecha: string;
  categoria: Categoria | null;
  extracto: string;
};

export type Entrada = {
  id: string;
  titulo: string | null;
  contenido: JSONContent;
  fecha: string;
  categoriaId: string | null;
  categoriaNombre: string | null;
};
