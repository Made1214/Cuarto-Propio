import { EsqueletoPantalla, Hueso } from "@/components/esqueleto";

/** Anchos de los títulos de las tarjetas: distintos entre sí para que la
 * pila no parezca una sola tarjeta repetida, que delata el esqueleto. */
const TITULOS = ["w-2/3", "w-1/2", "w-3/4"] as const;

/** El diario mientras llegan las entradas: encabezado, buscador y filtro, y
 * un mes con algunas tarjetas — la misma forma que `page.tsx`. */
export default function CargandoDiario() {
  return (
    <EsqueletoPantalla className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {/* `flex-wrap` acá aunque la pantalla real no lo tenga: el título real
          es más corto que estos bloques en 360px, y el botón no debe
          desbordar mientras se espera. */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Hueso className="mt-1 h-5 w-5 shrink-0" />
          <div className="flex flex-col gap-2">
            <Hueso className="h-9 w-36" />
            <Hueso className="h-4 w-48" />
          </div>
        </div>
        <Hueso className="h-11 w-36" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Hueso className="h-11 w-65 max-w-full" />
        <span className="h-6 w-0.75 bg-ink" aria-hidden="true" />
        <Hueso className="h-11 w-72 max-w-full" />
      </div>

      <div className="flex flex-col gap-4">
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
