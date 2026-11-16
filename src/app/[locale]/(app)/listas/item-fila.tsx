"use client";

import { useLayoutEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { editarItem } from "@/lib/listas/actions";
import type { ItemLista } from "@/lib/listas/types";
import { EliminarItemBoton } from "./eliminar-item-boton";
import { IconoAgarre, IconoFlecha } from "./iconos";
import { ItemCheckbox } from "./item-checkbox";

type ItemFilaProps = {
  item: ItemLista;
  /** Recién agregado y todavía viajando al servidor: se ve tenue y sin
   * controles, porque mover, marcar o borrar algo que aún no existe en la
   * base fallaría. */
  pendiente?: boolean;
  conCasillas: boolean;
  primero: boolean;
  ultimo: boolean;
  onMover: (direccion: -1 | 1) => void;
  onArrastrarInicio: () => void;
  onArrastrarSobre: () => void;
  onArrastrarFin: () => void;
  arrastrando: boolean;
  onAlternar: (marcado: boolean) => void;
  onEliminar: () => void;
  /** Recibe el error tal cual, para que la tarjeta distinga un fallo común
   * de una pestaña con código viejo (ver `clasificarErrorAccion`). */
  onError: (fallo: unknown) => void;
};

/** Una línea de texto libre editable, como en una app de notas. Si la lista
 * es de casillas la línea la lleva; si no, solo el agarre para moverla. */
export function ItemFila({
  item,
  pendiente = false,
  conCasillas,
  primero,
  ultimo,
  onMover,
  onArrastrarInicio,
  onArrastrarSobre,
  onArrastrarFin,
  arrastrando,
  onAlternar,
  onEliminar,
  onError,
}: ItemFilaProps) {
  const t = useTranslations("listas");
  const [guardando, startTransition] = useTransition();
  const [moviendo, setMoviendo] = useState(false);
  const [arrastrable, setArrastrable] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  // El texto se envuelve en varias líneas en vez de cortarse: la altura del
  // textarea sigue a su contenido (y al ancho, si cambia la ventana).
  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area) return;

    let anchoPrevio = area.clientWidth;
    const ajustar = () => {
      area.style.height = "auto";
      area.style.height = `${area.scrollHeight}px`;
    };
    ajustar();

    const observador = new ResizeObserver(() => {
      if (area.clientWidth === anchoPrevio) return;
      anchoPrevio = area.clientWidth;
      ajustar();
    });
    observador.observe(area);
    return () => observador.disconnect();
  }, [item.contenido]);

  function reajustarAltura(area: HTMLTextAreaElement) {
    area.style.height = "auto";
    area.style.height = `${area.scrollHeight}px`;
  }

  return (
    <div
      draggable={arrastrable && !pendiente}
      onDragStart={(evento) => {
        evento.dataTransfer.effectAllowed = "move";
        onArrastrarInicio();
      }}
      onDragOver={(evento) => {
        evento.preventDefault();
        onArrastrarSobre();
      }}
      onDragEnd={() => {
        setArrastrable(false);
        onArrastrarFin();
      }}
      onDrop={(evento) => evento.preventDefault()}
      aria-busy={pendiente || undefined}
      className={`flex items-start gap-1.5 py-1 transition-opacity ${arrastrando ? "opacity-40" : pendiente ? "opacity-60" : ""}`}
    >
      {/* El agarre se arrastra en escritorio, mueve con ↑/↓ desde el teclado
          y, al tocarlo, despliega las flechas — que en un celular es la
          única forma real de reordenar (el arrastre HTML no existe ahí). */}
      {pendiente ? (
        <span aria-hidden="true" className="h-7 w-5 shrink-0 pointer-coarse:h-11 pointer-coarse:w-9" />
      ) : (
        <button
          type="button"
          onMouseDown={() => setArrastrable(true)}
          onMouseUp={() => setArrastrable(false)}
          onClick={() => setMoviendo((valor) => !valor)}
          onBlur={(evento) => {
            if (!evento.currentTarget.parentElement?.contains(evento.relatedTarget as Node)) {
              setMoviendo(false);
            }
          }}
          onKeyDown={(evento) => {
            if (evento.key === "ArrowUp") {
              evento.preventDefault();
              onMover(-1);
            }
            if (evento.key === "ArrowDown") {
              evento.preventDefault();
              onMover(1);
            }
          }}
          aria-label={t("moverItem")}
          title={t("moverItem")}
          className={`flex h-7 w-5 shrink-0 cursor-grab items-center pointer-coarse:h-11 pointer-coarse:w-9 justify-center transition-colors active:cursor-grabbing ${
            moviendo ? "text-ink" : "text-ink/30 hover:text-ink"
          }`}
        >
          <IconoAgarre />
        </button>
      )}

      {moviendo ? (
        <div className="flex h-7 shrink-0 items-center gap-0.5 pointer-coarse:h-11 pointer-coarse:gap-1">
          <button
            type="button"
            disabled={primero}
            onClick={() => onMover(-1)}
            aria-label={t("subirItem")}
            title={t("subirItem")}
            className="flex h-6 w-6 items-center justify-center border-(length:--borde) pointer-coarse:h-10 pointer-coarse:w-10 border-ink rounded-theme text-ink transition-colors hover:bg-secondary-purple/15 disabled:border-ink/20 disabled:text-ink/20"
          >
            <IconoFlecha hacia="arriba" />
          </button>
          <button
            type="button"
            disabled={ultimo}
            onClick={() => onMover(1)}
            aria-label={t("bajarItem")}
            title={t("bajarItem")}
            className="flex h-6 w-6 items-center justify-center border-(length:--borde) pointer-coarse:h-10 pointer-coarse:w-10 border-ink rounded-theme text-ink transition-colors hover:bg-secondary-purple/15 disabled:border-ink/20 disabled:text-ink/20"
          >
            <IconoFlecha hacia="abajo" />
          </button>
        </div>
      ) : null}

      {conCasillas ? (
        <div className="flex h-7 shrink-0 items-center pointer-coarse:h-11">
          <ItemCheckbox marcado={item.marcado} onCambiar={onAlternar} disabled={pendiente} />
        </div>
      ) : null}

      <textarea
        ref={areaRef}
        rows={1}
        defaultValue={item.contenido}
        readOnly={pendiente}
        disabled={guardando}
        onInput={(evento) => reajustarAltura(evento.currentTarget)}
        onBlur={(evento) => {
          const valor = evento.target.value.trim();
          if (!valor) {
            evento.target.value = item.contenido;
            reajustarAltura(evento.target);
            return;
          }
          if (valor === item.contenido) return;
          const area = evento.target;
          startTransition(async () => {
            try {
              await editarItem(item.id, valor);
            } catch (fallo) {
              // El texto nuevo ya estaba en pantalla (lo escribió ella):
              // si no se guardó, vuelve al guardado para no mentir.
              area.value = item.contenido;
              reajustarAltura(area);
              startTransition(() => onError(fallo));
            }
          });
        }}
        onKeyDown={(evento) => {
          if (evento.key === "Enter") {
            evento.preventDefault();
            evento.currentTarget.blur();
          }
        }}
        // overflow-hidden: si no, el textarea muestra su barra de scroll
        // (el alto se fija a scrollHeight, que no incluye los bordes).
        className={`min-w-0 flex-1 resize-none overflow-hidden border-b-(length:--borde) border-transparent bg-transparent py-0.5 text-sm leading-normal outline-none focus:border-ink ${
          conCasillas && item.marcado ? "text-muted/60 line-through" : ""
        }`}
      />

      {pendiente ? (
        <span aria-hidden="true" className="h-7 w-7 shrink-0 pointer-coarse:h-11 pointer-coarse:w-11" />
      ) : (
        <EliminarItemBoton onEliminar={onEliminar} />
      )}
    </div>
  );
}
