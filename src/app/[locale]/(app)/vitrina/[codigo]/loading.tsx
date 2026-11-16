import { EsqueletoPantalla, Hueso } from "@/components/esqueleto";
import { BotonesVentana, IconoLapiz } from "../iconos";

/** Cuántas miniaturas de relacionadas se esbozan al costado: las mismas que
 * muestra la ficha real como máximo en esa columna. */
const RELACIONADAS = 6;

/** La ficha de una pieza mientras llega del servidor. Copia la disposición
 * de `page.tsx` (la columna de relacionadas posicionada a la izquierda en
 * pantalla ancha, la ventana con la foto y el panel de datos) para que,
 * al saltar de una pieza a otra desde las relacionadas, la pantalla no
 * cambie de forma mientras espera. */
export default function CargandoPieza() {
  return (
    <EsqueletoPantalla className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <Hueso className="h-3.5 w-20" />

      <div className="flex flex-col gap-5 lg:relative lg:block">
        <div className="order-2 flex shrink-0 flex-col gap-2 lg:absolute lg:inset-y-0 lg:left-0 lg:w-48 lg:overflow-hidden lg:pr-1 xl:w-56">
          <Hueso className="h-2.5 w-24" />
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-1">
            {Array.from({ length: RELACIONADAS }, (_, indice) => (
              <div
                key={indice}
                className="border-(length:--borde) border-ink rounded-theme bg-background shadow-marco-sm"
              >
                <Hueso className="aspect-square w-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 min-w-0 border-(length:--borde) border-ink rounded-theme bg-card shadow-marco lg:ml-52 xl:ml-60">
          <div className="flex items-center gap-2 border-b-(length:--borde) border-ink bg-secondary-purple px-3 py-2 text-background">
            {/* Sobre el morado, el gris de tinta no se vería: el título de
                la barra se esboza con el color del fondo, translúcido. */}
            <div className="min-w-0 flex-1">
              <div className="h-3 w-40 max-w-full bg-background/30 motion-safe:animate-pulse" />
            </div>
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center border-(length:--borde) border-ink rounded-theme bg-primary-green text-ink-strong"
            >
              <IconoLapiz />
            </span>
            <BotonesVentana />
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,auto)_minmax(17rem,1fr)]">
            {/* Sin saber todavía la proporción de la foto, se reserva una
                vertical (4/5) con el mismo tope de alto que la real, 68svh:
                es lo más común en fotos tomadas con el celular. */}
            <div className="mx-auto w-full max-w-[calc(68svh*0.8)] bg-background lg:w-[calc(68svh*0.8)]">
              <Hueso className="aspect-[4/5] max-h-[68svh] w-full" />
            </div>

            <div className="flex min-w-0 flex-col gap-3 border-t-(length:--borde) border-ink p-4 lg:border-t-0 lg:border-l-(length:--borde)">
              <Hueso className="h-7 w-3/4" />
              <div className="flex flex-col gap-2">
                <Hueso className="h-3.5 w-full" />
                <Hueso className="h-3.5 w-11/12" />
                <Hueso className="h-3.5 w-3/5" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Hueso className="h-6 w-16" />
                <Hueso className="h-6 w-20" />
                <Hueso className="h-6 w-14" />
              </div>
              <Hueso className="h-7 w-24" />
              <div className="mt-auto flex flex-wrap items-center gap-2 border-t-(length:--borde) border-ink/20 pt-3">
                <Hueso className="h-2.5 w-28" />
                <Hueso className="h-6 w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </EsqueletoPantalla>
  );
}
