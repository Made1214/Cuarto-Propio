"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { CategoriaSelector } from "@/components/categoria-selector";
import { useRouter } from "@/i18n/navigation";
import type { Categoria } from "@/lib/categorias/types";
import {
  asignarCategoriaLista,
  cambiarCasillasLista,
  eliminarLista,
  renombrarLista,
  reordenarItems,
} from "@/lib/listas/actions";
import type { ListaConItems } from "@/lib/listas/types";
import { AgregarItemInline } from "./agregar-item-inline";
import { IconoCasilla, IconoEliminar } from "./iconos";
import { ItemFila } from "./item-fila";

export function ListaColumna({ lista, categorias }: { lista: ListaConItems; categorias: Categoria[] }) {
  const t = useTranslations("listas");
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Copia local para que al reordenar la fila se mueva en el momento, sin
  // esperar al viaje al servidor. Se resincroniza durante el render cuando
  // el servidor manda otros ítems (el patrón de React para ajustar estado
  // ante un cambio de props, en vez de un efecto).
  const [items, setItems] = useState(lista.items);
  const [itemsPrevios, setItemsPrevios] = useState(lista.items);
  const [arrastrado, setArrastrado] = useState<string | null>(null);

  if (itemsPrevios !== lista.items) {
    setItemsPrevios(lista.items);
    setItems(lista.items);
  }

  const hechos = items.filter((item) => item.marcado).length;

  function guardarOrden(nuevos: typeof items) {
    setItems(nuevos);
    startTransition(async () => {
      await reordenarItems(
        lista.id,
        nuevos.map((item) => item.id),
      );
      router.refresh();
    });
  }

  function moverItem(indice: number, direccion: -1 | 1) {
    const destino = indice + direccion;
    if (destino < 0 || destino >= items.length) return;
    const nuevos = [...items];
    const [movido] = nuevos.splice(indice, 1);
    nuevos.splice(destino, 0, movido);
    guardarOrden(nuevos);
  }

  function arrastrarSobre(indiceDestino: number) {
    if (!arrastrado) return;
    const indiceOrigen = items.findIndex((item) => item.id === arrastrado);
    if (indiceOrigen === -1 || indiceOrigen === indiceDestino) return;
    const nuevos = [...items];
    const [movido] = nuevos.splice(indiceOrigen, 1);
    nuevos.splice(indiceDestino, 0, movido);
    setItems(nuevos);
  }

  return (
    <div className="flex w-full flex-col gap-3 border-2 border-ink bg-card p-4 shadow-[5px_5px_0_var(--ink)]">
      <div className="flex items-center justify-between gap-1">
        <input
          type="text"
          defaultValue={lista.nombre}
          onBlur={(evento) => {
            const valor = evento.target.value.trim();
            if (!valor || valor === lista.nombre) {
              evento.target.value = lista.nombre;
              return;
            }
            startTransition(async () => {
              await renombrarLista(lista.id, valor);
              router.refresh();
            });
          }}
          onKeyDown={(evento) => {
            if (evento.key === "Enter") evento.currentTarget.blur();
          }}
          className="min-w-0 flex-1 border-b-2 border-transparent bg-transparent py-0.5 font-diario text-lg font-semibold outline-none focus:border-ink"
        />

        {lista.conCasillas && items.length > 0 ? (
          <span className="shrink-0 px-1 font-pixel text-xs text-muted/70 tabular-nums">
            {hechos}/{items.length}
          </span>
        ) : null}

        <button
          type="button"
          onClick={() => {
            startTransition(async () => {
              await cambiarCasillasLista(lista.id, !lista.conCasillas);
              router.refresh();
            });
          }}
          aria-pressed={lista.conCasillas}
          aria-label={t("listaConCasillas")}
          title={t("listaConCasillas")}
          className={`flex h-7 w-7 shrink-0 items-center justify-center transition-colors ${
            lista.conCasillas
              ? "bg-secondary-purple/25 text-ink"
              : "text-ink/35 hover:bg-secondary-purple/15 hover:text-ink"
          }`}
        >
          <IconoCasilla activa={lista.conCasillas} />
        </button>

        <BotonConfirmar
          titulo={t("eliminar")}
          mensaje={t("eliminarConfirmar")}
          textoConfirmar={t("eliminar")}
          etiqueta={t("eliminar")}
          onConfirmar={() => {
            startTransition(async () => {
              await eliminarLista(lista.id);
              router.refresh();
            });
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center text-ink/35 transition-colors hover:bg-primary-pink/30 hover:text-ink"
        >
          <IconoEliminar />
        </BotonConfirmar>
      </div>

      {lista.conCasillas && items.length > 0 ? (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={hechos}
          aria-label={t("progreso")}
          className="h-1.5 w-full border-2 border-ink/30"
        >
          <div
            className="h-full bg-primary-green transition-[width]"
            style={{ width: `${(hechos / items.length) * 100}%` }}
          />
        </div>
      ) : null}

      <CategoriaSelector
        categoriaId={lista.categoriaId}
        categoriaNombre={lista.categoriaNombre}
        categorias={categorias}
        onElegir={(nombre) => asignarCategoriaLista(lista.id, nombre)}
        textos={{
          cambiar: t("cambiarCategoria"),
          placeholder: t("categoriaPlaceholder"),
          quitar: t("quitarCategoria"),
          nueva: t("nuevaCategoriaPlaceholder"),
        }}
      />

      {items.length === 0 ? (
        <p className="text-xs text-muted/70">{t("sinItemsAun")}</p>
      ) : (
        <div className="flex flex-col">
          {items.map((item, indice) => (
            <ItemFila
              key={item.id}
              item={item}
              conCasillas={lista.conCasillas}
              primero={indice === 0}
              ultimo={indice === items.length - 1}
              onMover={(direccion) => moverItem(indice, direccion)}
              onArrastrarInicio={() => setArrastrado(item.id)}
              onArrastrarSobre={() => arrastrarSobre(indice)}
              onArrastrarFin={() => {
                setArrastrado(null);
                guardarOrden(items);
              }}
              arrastrando={arrastrado === item.id}
            />
          ))}
        </div>
      )}

      <AgregarItemInline listaId={lista.id} />
    </div>
  );
}
