"use client";

import type { JSONContent } from "@tiptap/core";
import { useTranslations } from "next-intl";
import { TiptapEditor } from "@/components/tiptap-editor";
import type { Categoria } from "@/lib/diario/types";

type EntradaFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  categorias: Categoria[];
  valoresIniciales?: {
    titulo?: string | null;
    categoriaNombre?: string | null;
    contenido?: JSONContent | null;
  };
};

export function EntradaForm({ action, categorias, valoresIniciales }: EntradaFormProps) {
  const t = useTranslations("diario");

  return (
    <form action={action} className="flex flex-col gap-4">
      <input
        type="text"
        name="titulo"
        defaultValue={valoresIniciales?.titulo ?? ""}
        placeholder={t("tituloPlaceholder")}
        className="rounded-md border border-black/10 px-3 py-2 text-xl font-medium outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30"
      />

      <div>
        <input
          type="text"
          name="categoria"
          list="categorias-existentes"
          defaultValue={valoresIniciales?.categoriaNombre ?? ""}
          placeholder={t("categoriaPlaceholder")}
          className="w-64 max-w-full rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30"
        />
        <datalist id="categorias-existentes">
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.nombre} />
          ))}
        </datalist>
      </div>

      <TiptapEditor name="contenido" contenidoInicial={valoresIniciales?.contenido} />

      <div>
        <button
          type="submit"
          className="rounded-full bg-foreground px-5 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          {t("guardar")}
        </button>
      </div>
    </form>
  );
}
