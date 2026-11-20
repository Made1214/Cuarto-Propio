import { EsqueletoPantalla, Hueso } from "@/components/esqueleto";

/** Listas de mentira: cuántos ítems tiene cada una y si lleva casillas.
 * Largos distintos a propósito, para que las columnas masonry se vean
 * escalonadas como el tablero real y no como una grilla pareja. */
const LISTAS = [
  { items: ["w-3/4", "w-1/2", "w-2/3", "w-4/5"], casillas: true },
  { items: ["w-2/3", "w-3/5"], casillas: false },
  { items: ["w-1/2", "w-4/5", "w-3/5", "w-2/3", "w-1/2"], casillas: true },
  { items: ["w-3/5", "w-3/4", "w-1/2"], casillas: false },
] as const;

/** El tablero de listas mientras llegan del servidor: encabezado con filtro
 * y botón de nueva lista, y las columnas con sus ítems, como `page.tsx`. */
export default function CargandoListas() {
  return (
    <EsqueletoPantalla className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Hueso className="h-9 w-32" />
          <Hueso className="h-4 w-56 max-w-full" />
        </div>
        <div className="flex flex-wrap items-end justify-end gap-3">
          <Hueso className="h-11 w-64 max-w-full" />
          <Hueso className="h-10 w-36" />
        </div>
      </div>

      <div className="columns-[17rem] gap-5">
        {LISTAS.map((lista, indice) => (
          <div key={indice} className="mb-5 break-inside-avoid">
            <div className="flex w-full flex-col gap-3 border-(length:--borde) border-ink rounded-theme bg-card p-4 shadow-marco">
              <div className="flex items-center justify-between gap-1">
                <div className="min-w-0 flex-1 py-1">
                  <Hueso className="h-5 w-3/5" />
                </div>
                <Hueso className="h-7 w-7 shrink-0" />
                <Hueso className="h-7 w-7 shrink-0" />
              </div>

              {lista.casillas ? (
                <div className="h-1.5 w-full border-(length:--borde) border-ink/30" aria-hidden="true" />
              ) : null}

              <Hueso className="h-7 w-full" />

              <div className="flex flex-col">
                {lista.items.map((ancho, fila) => (
                  <div key={fila} className="flex items-center gap-1.5 py-1.5">
                    {lista.casillas ? (
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 border-(length:--borde) border-ink/30"
                      />
                    ) : null}
                    <Hueso className={`h-3.5 ${ancho}`} />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="h-8 min-w-0 flex-1 border-(length:--borde) border-ink/30" aria-hidden="true" />
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center border-(length:--borde) border-ink rounded-theme bg-primary-green text-ink-strong"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </EsqueletoPantalla>
  );
}
