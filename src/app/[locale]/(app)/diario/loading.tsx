import { EsqueletoPantalla, Hueso } from "@/components/esqueleto";

/** Anchos de los títulos de las tarjetas: distintos entre sí para que la
 * pila no parezca una sola tarjeta repetida, que delata el esqueleto. */
const TITULOS = ["w-2/3", "w-1/2", "w-3/4"] as const;

/** El diario mientras llegan las entradas: encabezado, buscador y filtro, y
 * un mes con algunas tarjetas — la misma forma que `page.tsx`. */
export default function CargandoDiario() {
  return (
    <EsqueletoPantalla className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-x-10 gap-y-6 lg:max-w-280 lg:grid-cols-[16.25rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:content-start">
      {/* `flex-wrap` acá aunque la pantalla real no lo tenga: el título real
          es más corto que estos bloques en 360px, y el botón no debe
          desbordar mientras se espera. */}
      <div className="flex flex-wrap items-end justify-between gap-4 lg:col-start-2">
        <div className="flex flex-col gap-2">
          <Hueso className="h-9 w-36" />
          <Hueso className="h-4 w-48" />
        </div>
        <Hueso className="h-11 w-36" />
      </div>

      {/* Columna de filtros en `lg`: buscador y las dos listas. Por debajo,
          buscador y la fila de chips. */}
      <div className="flex flex-col gap-6 lg:col-start-1 lg:row-span-2 lg:row-start-1">
        <Hueso className="h-11 w-full" />
        <div className="flex flex-wrap items-center gap-3 lg:hidden">
          <Hueso className="h-9 w-20" />
          <Hueso className="h-9 w-24" />
          <Hueso className="h-9 w-28" />
        </div>
        <div className="hidden flex-col gap-2 lg:flex">
          <Hueso className="h-3 w-24" />
          {[0, 1, 2, 3].map((i) => (
            <Hueso key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="hidden flex-col gap-2 lg:flex">
          <Hueso className="h-3 w-20" />
          {[0, 1].map((i) => (
            <Hueso key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:col-start-2">
        <div className="flex items-center gap-3" aria-hidden="true">
          <Hueso className="h-3 w-28" />
          <span className="h-0.5 flex-1 bg-ink/15" />
        </div>

        <div className="flex flex-col gap-5">
          {TITULOS.map((ancho) => (
            <div
              key={ancho}
              className="border-(length:--borde) border-ink rounded-theme bg-card p-6 shadow-marco"
            >
              <div className="flex items-center justify-between gap-3">
                <Hueso className="h-3 w-14" />
                <Hueso className="h-7 w-20" />
              </div>
              <Hueso className={`mt-3 h-6 ${ancho}`} />
              <Hueso className="mt-3 h-3.5 w-full" />
              <Hueso className="mt-2 h-3.5 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </EsqueletoPantalla>
  );
}
