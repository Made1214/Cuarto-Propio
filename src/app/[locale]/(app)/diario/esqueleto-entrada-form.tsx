import { Hueso } from "@/components/esqueleto";

/** Chips de categoría: anchos dispares, como nombres reales. */
const CHIPS = ["w-20", "w-24", "w-16"] as const;

/** Botones de la fila principal de formato (`tiptap-editor.tsx`): negrita,
 * cursiva, título, lista, cita, enlace, imagen y «Más». */
const BOTONES_BARRA = 8;

/** Renglones de una entrada que ya tiene texto (al editarla). */
const RENGLONES = ["w-full", "w-11/12", "w-full", "w-4/5", "w-2/3"] as const;

/**
 * La barra de arriba de una entrada mientras carga, con la misma forma que
 * `BarraEntrada`: volver, estado y acciones; con `formato`, la fila de la
 * barra del editor debajo.
 */
export function EsqueletoBarraEntrada({ acciones, formato = false }: { acciones: number; formato?: boolean }) {
  return (
    <div className="flex flex-col gap-2 border-b-(length:--borde) border-ink px-3 py-2 sm:px-4">
      <div className="flex items-center gap-2">
        <span className="flex h-11 w-11 items-center justify-center">
          <Hueso className="h-4 w-5" />
        </span>
        <div className="min-w-0 flex-1">{formato ? <Hueso className="h-3 w-24" /> : null}</div>
        {Array.from({ length: acciones }, (_, indice) => (
          <Hueso key={indice} className={`h-11 ${indice === acciones - 1 ? "w-24" : "w-11"}`} />
        ))}
      </div>
      {formato ? (
        <div className="flex gap-1 overflow-hidden">
          {Array.from({ length: BOTONES_BARRA }, (_, indice) => (
            <Hueso key={indice} className="h-8 w-8 shrink-0 pointer-coarse:h-10 pointer-coarse:w-10" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * El cuerpo de `EntradaForm` mientras carga: título, categoría con sus
 * chips y la caja de escritura. Lo comparten los esqueletos de "nueva" y
 * "editar" — el formulario es el mismo, solo cambia la barra de arriba.
 *
 * La caja del editor se dibuja con su marco definitivo (no como un bloque
 * gris) y con el mismo alto mínimo que el editor real: es lo más alto de la
 * pantalla, y si apareciera recién al cargar empujaría todo hacia abajo.
 */
export function EsqueletoEntradaForm({ conTexto }: { conTexto: boolean }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Hueso className="h-3 w-14" />
        <Hueso className="h-10 w-full" />
      </div>

      <div className="flex flex-col gap-2">
        <Hueso className="h-3 w-20" />
        <div className="flex gap-2 overflow-hidden">
          {CHIPS.map((ancho) => (
            <Hueso key={ancho} className={`h-9 shrink-0 ${ancho}`} />
          ))}
        </div>
        <Hueso className="h-10 w-full sm:w-64" />
      </div>

      <div className="rounded-theme border-(length:--borde) border-ink bg-card px-4 py-3">
        <div className="flex min-h-[40svh] flex-col gap-2.5 pt-1">
          {conTexto ? (
            RENGLONES.map((ancho, indice) => <Hueso key={indice} className={`h-4 ${ancho}`} />)
          ) : (
            // Entrada nueva: la caja está vacía, apenas el renglón donde
            // va a aparecer el cursor.
            <Hueso className="h-4 w-1/3" />
          )}
        </div>
      </div>
    </div>
  );
}
