"use client";

import type { JSONContent } from "@tiptap/core";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { TiptapEditor } from "@/components/tiptap-editor";
import { colorCategoria } from "@/lib/categorias/color";
import type { Categoria, EntradaActionState } from "@/lib/diario/types";

type EntradaFormProps = {
  formId: string;
  action: (estadoPrevio: EntradaActionState, formData: FormData) => Promise<EntradaActionState>;
  categorias: Categoria[];
  valoresIniciales?: {
    titulo?: string | null;
    categoriaNombre?: string | null;
    contenido?: JSONContent | null;
  };
};

/**
 * No renderiza su propio botón de guardar: la página dueña lo pone en su
 * fila de acciones (junto a Eliminar, cuando aplica) usando
 * `<button form={formId}>`, para que Guardar y Eliminar vivan juntos en
 * vez de quedar uno arriba y otro perdido al fondo del formulario.
 */
export function EntradaForm({ formId, action, categorias, valoresIniciales }: EntradaFormProps) {
  const t = useTranslations("diario");
  const [categoriaTexto, setCategoriaTexto] = useState(valoresIniciales?.categoriaNombre ?? "");
  const [estado, enviarAction] = useActionState(action, undefined);

  return (
    <form id={formId} action={enviarAction} className="flex flex-col gap-4">
      {estado?.error ? (
        <p className="border-2 border-ink-strong bg-primary-pink px-3 py-2 font-pixel text-xs tracking-wide text-ink-strong">
          {estado.error}
        </p>
      ) : null}
      <input
        type="text"
        name="titulo"
        required
        defaultValue={valoresIniciales?.titulo ?? ""}
        placeholder={t("tituloPlaceholder")}
        className="rounded-theme border-2 border-ink bg-card px-3 py-2.5 font-diario text-2xl font-semibold outline-none"
      />

      <div className="flex flex-col gap-2">
        <input
          type="text"
          name="categoria"
          value={categoriaTexto}
          onChange={(evento) => setCategoriaTexto(evento.target.value)}
          placeholder={t("categoriaPlaceholder")}
          className="w-64 max-w-full rounded-theme border-2 border-ink bg-card px-3 py-2 text-sm outline-none"
        />
        {categorias.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {categorias.map((cat) => {
              const seleccionada = cat.nombre === categoriaTexto;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaTexto(cat.nombre)}
                  className={`flex items-center gap-1.5 border-2 px-2.5 py-1 font-pixel text-xs tracking-wide transition-colors ${
                    seleccionada ? "border-ink-strong bg-secondary-purple/10" : "border-ink/30 hover:border-ink-strong"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 border border-ink-strong"
                    style={{ background: colorCategoria(categorias, cat.id) }}
                  />
                  {cat.nombre.toUpperCase()}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <TiptapEditor name="contenido" contenidoInicial={valoresIniciales?.contenido} />
    </form>
  );
}
