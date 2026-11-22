"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AvisoErrorAccion } from "@/components/aviso-error-accion";
import { CategoriaSelector } from "@/components/categoria-selector";
import { clasificarErrorAccion, type ErrorAccion } from "@/lib/acciones/errores";
import type { Categoria } from "@/lib/categorias/types";
import {
  agregarItem,
  alternarItem,
  asignarCategoriaLista,
  cambiarCasillasLista,
  eliminarItem,
  eliminarLista,
  renombrarLista,
  reordenarItems,
} from "@/lib/listas/actions";
import type { ItemLista, ListaConItems } from "@/lib/listas/types";
import { AgregarItemInline } from "./agregar-item-inline";
import { IconoPlegar } from "./iconos";
import { MenuLista } from "./menu-lista";
import { useListaAbierta } from "@/lib/listas/plegado";
import { ItemFila } from "./item-fila";

type AccionItems = { tipo: "alternar"; id: string; marcado: boolean } | { tipo: "eliminar"; id: string };

/** Lo que se ve mientras viajan las actions: el reducer se vuelve a aplicar
 * sobre la lista real cada vez que esta cambia, así un marcado optimista
 * convive con un reordenamiento o con la página recién refrescada. */
function aplicarAccion(items: ItemLista[], accion: AccionItems): ItemLista[] {
  if (accion.tipo === "eliminar") return items.filter((item) => item.id !== accion.id);
  return items.map((item) => (item.id === accion.id ? { ...item, marcado: accion.marcado } : item));
}

function sumarPendiente(pendientes: ItemLista[], nuevo: ItemLista): ItemLista[] {
  return [...pendientes, nuevo];
}

/** Mueve `idOrigen` a la posición que ocupa `idDestino`. Trabaja con ids y
 * no con índices porque la lista que se ve (optimista) y la de base pueden
 * no coincidir mientras un borrado está en camino. */
function reubicar(items: ItemLista[], idOrigen: string, idDestino: string): ItemLista[] {
  const desde = items.findIndex((item) => item.id === idOrigen);
  const hasta = items.findIndex((item) => item.id === idDestino);
  if (desde === -1 || hasta === -1 || desde === hasta) return items;
  const nuevos = [...items];
  const [movido] = nuevos.splice(desde, 1);
  nuevos.splice(hasta, 0, movido);
  return nuevos;
}

/** `crypto.randomUUID` solo existe en contextos seguros (HTTPS o
 * localhost): probando desde el celular por la IP de la red local no está,
 * y `getRandomValues` sí. */
function nuevoId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const SIN_PENDIENTES: ItemLista[] = [];

export function ListaColumna({
  lista,
  categorias,
  abiertaPorDefecto,
}: {
  lista: ListaConItems;
  categorias: Categoria[];
  abiertaPorDefecto: boolean;
}) {
  const t = useTranslations("listas");
  const [abierta, setAbierta] = useListaAbierta(lista.id, abiertaPorDefecto);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<ErrorAccion | null>(null);
  const nombreRef = useRef<HTMLInputElement>(null);

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

  // Encima de esa copia, lo optimista: marcar y borrar se ven en el mismo
  // cuadro del toque. Cuando la action termina, React suelta estos valores
  // en el mismo render en que llegan los reales (la action ya trae la
  // página refrescada); si falló, simplemente vuelve a verse lo real.
  const [visibles, aplicarOptimista] = useOptimistic(items, aplicarAccion);
  // Los agregados van aparte, con un id generado acá que el servidor
  // respeta: en cuanto el ítem real aparece en la lista, su pendiente se
  // descarta por id — sin depender de en qué render exacto llega cada uno.
  const [pendientes, sumarOptimista] = useOptimistic(SIN_PENDIENTES, sumarPendiente);
  const [nombre, setNombreOptimista] = useOptimistic(lista.nombre);
  const [conCasillas, setConCasillasOptimista] = useOptimistic(lista.conCasillas);

  const idsVisibles = new Set(visibles.map((item) => item.id));
  const pendientesSinConfirmar = pendientes.filter((item) => !idsVisibles.has(item.id));
  // Una sola lista para el render: si reales y pendientes fueran dos `.map`
  // separados, React desmontaría la fila pendiente y montaría otra al
  // confirmarse, en vez de reusar la misma por su key.
  const filas = [
    ...visibles.map((item) => ({ item, pendiente: false })),
    ...pendientesSinConfirmar.map((item) => ({ item, pendiente: true })),
  ];
  const hechos = visibles.filter((item) => item.marcado).length;

  /** Corre una action con su parte optimista y, si falla, avisa. El estado
   * optimista no hace falta deshacerlo a mano: muere solo al terminar la
   * transición sin página nueva. El aviso va en su propia transición para
   * salir junto con esa vuelta atrás (los set después de un `await` no
   * quedan dentro de la transición original). */
  function guardar(optimista: () => void, accion: () => Promise<void>, alFallar?: () => void) {
    setError(null);
    startTransition(async () => {
      optimista();
      try {
        await accion();
      } catch (fallo) {
        startTransition(() => {
          alFallar?.();
          setError(clasificarErrorAccion(fallo));
        });
      }
    });
  }

  function avisarError(fallo: unknown) {
    setError(clasificarErrorAccion(fallo));
  }

  function guardarOrden(nuevos: ItemLista[]) {
    setItems(nuevos);
    // El orden no es optimista sino estado local (el arrastre lo va
    // cambiando a cada paso), así que si falla hay que volverlo a mano.
    const ordenPrevio = lista.items;
    guardar(
      () => {},
      () =>
        reordenarItems(
          lista.id,
          nuevos.map((item) => item.id),
        ),
      () => setItems(ordenPrevio),
    );
  }

  function moverItem(id: string, direccion: -1 | 1) {
    const indice = visibles.findIndex((item) => item.id === id);
    const vecino = visibles[indice + direccion];
    if (indice === -1 || !vecino) return;
    guardarOrden(reubicar(items, id, vecino.id));
  }

  function arrastrarSobre(idDestino: string) {
    if (!arrastrado) return;
    setItems((actuales) => reubicar(actuales, arrastrado, idDestino));
  }

  function alternar(id: string, marcado: boolean) {
    guardar(
      () => aplicarOptimista({ tipo: "alternar", id, marcado }),
      () => alternarItem(id, marcado),
    );
  }

  function eliminar(id: string) {
    guardar(
      () => aplicarOptimista({ tipo: "eliminar", id }),
      () => eliminarItem(id),
    );
  }

  function agregar(contenido: string) {
    const id = nuevoId();
    guardar(
      () => sumarOptimista({ id, contenido, marcado: false }),
      () => agregarItem(lista.id, contenido, id),
    );
  }

  const resumen =
    conCasillas && filas.length > 0
      ? t("progresoTexto", { hechos, total: filas.length })
      : t("cantidadItems", { total: filas.length });

  // Plegada: solo el nombre y cuánto lleva. Las filas, el selector y los
  // botones recién se montan al abrirla.
  if (!abierta) {
    return (
      <div className="tema-panel w-full border-(length:--borde) border-ink rounded-theme bg-card shadow-marco">
        <button
          type="button"
          onClick={() => setAbierta(true)}
          aria-expanded={false}
          className="flex min-h-14 w-full items-center gap-3 p-4 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate font-diario text-lg font-semibold">{nombre}</span>
            <span className="mt-0.5 block text-xs font-semibold text-muted/75 tabular-nums">{resumen}</span>
            {conCasillas && filas.length > 0 ? (
              <span aria-hidden="true" className="mt-2 block h-1.5 w-full border-(length:--borde) border-ink/40 rounded-theme bg-background">
                <span className="block h-full bg-primary-green" style={{ width: `${(hechos / filas.length) * 100}%` }} />
              </span>
            ) : null}
          </span>
          <span className="sr-only">{t("abrirLista")}</span>
          <IconoPlegar abierta={false} />
        </button>
      </div>
    );
  }

  return (
    <div className="tema-panel flex w-full flex-col gap-3 border-(length:--borde) border-ink rounded-theme bg-card p-4 shadow-marco">
      <div className="flex items-center justify-between gap-1">
        <input
          ref={nombreRef}
          type="text"
          defaultValue={lista.nombre}
          onBlur={(evento) => {
            const valor = evento.target.value.trim();
            // Contra el nombre que se VE (optimista): volver a salir del
            // campo mientras viaja el mismo cambio no lo manda dos veces.
            if (!valor || valor === nombre) {
              evento.target.value = nombre;
              return;
            }
            const nombreReal = lista.nombre;
            guardar(
              () => setNombreOptimista(valor),
              () => renombrarLista(lista.id, valor),
              // El campo no es controlado: lo escrito sigue en pantalla
              // aunque no se haya guardado, así que se devuelve a mano.
              () => {
                if (nombreRef.current) nombreRef.current.value = nombreReal;
              },
            );
          }}
          onKeyDown={(evento) => {
            if (evento.key === "Enter") evento.currentTarget.blur();
          }}
          aria-label={t("nombreLista")}
          // El borde punteado tenue dice "esto se puede cambiar" sin parecer
          // un formulario; al escribir se vuelve sólido.
          className="min-w-0 flex-1 border-b-(length:--borde) border-dashed border-ink/20 bg-transparent py-1 pointer-coarse:py-2 font-diario text-lg leading-snug font-semibold outline-none hover:border-ink/40 focus:border-solid focus:border-ink"
        />

        <MenuLista
          nombreLista={nombre}
          conCasillas={conCasillas}
          onCasillas={(valor) =>
            guardar(
              () => setConCasillasOptimista(valor),
              () => cambiarCasillasLista(lista.id, valor),
            )
          }
          onRenombrar={() => {
            nombreRef.current?.focus();
            nombreRef.current?.select();
          }}
          onEliminar={() => guardar(() => {}, () => eliminarLista(lista.id))}
        />

        <button
          type="button"
          onClick={() => setAbierta(false)}
          aria-expanded={true}
          aria-label={t("plegarLista")}
          title={t("plegarLista")}
          className="flex h-9 w-9 shrink-0 items-center justify-center text-ink/60 transition-colors hover:bg-secondary-purple/15 hover:text-ink pointer-coarse:h-11 pointer-coarse:w-11"
        >
          <IconoPlegar abierta />
        </button>
      </div>

      <AvisoErrorAccion error={error} mensajeFallo={t("errorGuardar")} />

      {/* Progreso en palabras y en barra: "3 de 5" se entiende sin tener que
          contar casillas. */}
      {conCasillas && filas.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold tabular-nums">
            {t("progresoTexto", { hechos, total: filas.length })}
          </span>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={filas.length}
            aria-valuenow={hechos}
            aria-label={t("progreso")}
            className="h-2.5 w-full border-(length:--borde) border-ink rounded-theme bg-background"
          >
            <div
              className="h-full bg-primary-green transition-[width]"
              style={{ width: `${(hechos / filas.length) * 100}%` }}
            />
          </div>
        </div>
      ) : null}

      <CategoriaSelector
        categoriaId={lista.categoriaId}
        categoriaNombre={lista.categoriaNombre}
        categorias={categorias}
        onElegir={(nombreCategoria) => asignarCategoriaLista(lista.id, nombreCategoria)}
        onError={avisarError}
        textos={{
          cambiar: t("cambiarCategoria"),
          placeholder: t("categoriaPlaceholder"),
          quitar: t("quitarCategoria"),
          nueva: t("nuevaCategoriaPlaceholder"),
        }}
      />

      {filas.length === 0 ? (
        <p className="text-sm text-muted/75">{t("sinItemsAun")}</p>
      ) : (
        <div className="flex flex-col">
          {filas.map(({ item, pendiente }, indice) => (
            <ItemFila
              key={item.id}
              item={item}
              pendiente={pendiente}
              conCasillas={conCasillas}
              primero={indice === 0}
              ultimo={indice === visibles.length - 1}
              onMover={(direccion) => moverItem(item.id, direccion)}
              onArrastrarInicio={() => setArrastrado(item.id)}
              onArrastrarSobre={() => arrastrarSobre(item.id)}
              onArrastrarFin={() => {
                setArrastrado(null);
                guardarOrden(items);
              }}
              arrastrando={arrastrado === item.id}
              onAlternar={(marcado) => alternar(item.id, marcado)}
              onEliminar={() => eliminar(item.id)}
              onError={avisarError}
            />
          ))}
        </div>
      )}

      <AgregarItemInline onAgregar={agregar} />
    </div>
  );
}
