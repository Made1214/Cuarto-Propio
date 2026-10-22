import { Hueso } from "@/components/esqueleto";

/** Chips de categoría bajo el campo: anchos dispares, como nombres reales. */
const CHIPS = ["w-20", "w-24", "w-16"] as const;

/** Botones cuadrados de la barra del editor: los ocho formatos más el
 * enlace, en el mismo orden y tamaño (h-8) que `tiptap-editor.tsx`. */
const BOTONES_BARRA = 9;

/** Renglones de una entrada que ya tiene texto (al editarla). */
const RENGLONES = ["w-full", "w-11/12", "w-full", "w-4/5", "w-2/3"] as const;

/**
 * El cuerpo de `EntradaForm` mientras carga: título, categoría con sus
 * chips, la barra del editor y la caja de escritura. Lo comparten los
 * esqueletos de "nueva" y "editar" — el formulario es el mismo, solo cambia
 * la cabecera de la ventana que lo contiene.
 *
 * La caja del editor se dibuja con su marco definitivo (no como un bloque
 * gris) y con el mismo alto mínimo que el editor real: es lo más alto de la
 * pantalla, y si apareciera recién al cargar empujaría todo hacia abajo.
 */
export function EsqueletoEntradaForm({ conTexto }: { conTexto: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Campo de título: text-2xl + py-2.5 + borde = 56px. */}
      <Hueso className="h-14 w-full" />

      <div className="flex flex-col gap-2">
        <Hueso className="h-10 w-64 max-w-full" />
        <div className="flex flex-wrap gap-1.5">
          {CHIPS.map((ancho) => (
            <Hueso key={ancho} className={`h-7 ${ancho}`} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {Array.from({ length: BOTONES_BARRA }, (_, indice) => (
            <Hueso key={indice} className="h-8 w-8" />
          ))}
          <span className="mx-1 h-5 w-0.5 bg-ink/25" aria-hidden="true" />
          {/* Color de texto y resaltado, cada uno con su botón de quitar. */}
          <Hueso className="h-8 w-13" />
          <Hueso className="h-8 w-8" />
          <Hueso className="h-8 w-15" />
          <Hueso className="h-8 w-8" />
        </div>

        <div className="rounded-theme border-2 border-ink bg-card px-4 py-3">
          <div className="flex min-h-60 flex-col gap-2.5 pt-1">
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
    </div>
  );
}
