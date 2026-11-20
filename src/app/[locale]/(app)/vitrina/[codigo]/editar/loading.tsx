import { EsqueletoPantalla, Hueso } from "@/components/esqueleto";
import { BotonesVentana } from "../../iconos";

/** Etiquetas de hashtag ya escritas: anchos dispares, como palabras reales. */
const HASHTAGS = ["w-16", "w-20", "w-14"] as const;

/** Editar una pieza mientras llega del servidor: la misma ventana de
 * `page.tsx` (barra morada, la miniatura de referencia al costado y el
 * formulario). Sin este archivo, Next tomaba el esqueleto de la ficha — el
 * `loading.tsx` de `[codigo]`, con la foto grande y las relacionadas — y la
 * pantalla se reacomodaba entera al llegar. */
export default function CargandoEditarPieza() {
  return (
    <EsqueletoPantalla className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <Hueso className="h-3.5 w-28" />

      <div className="border-(length:--borde) border-ink rounded-theme bg-card shadow-marco">
        <div className="flex items-center gap-2 border-b-(length:--borde) border-ink bg-secondary-purple px-3 py-2 text-background">
          {/* Sobre el morado, el gris de tinta no se vería: el título de la
              barra se esboza con el color del fondo, translúcido. */}
          <div className="min-w-0 flex-1">
            <div className="h-3 w-48 max-w-full bg-background/30 motion-safe:animate-pulse" />
          </div>
          <BotonesVentana />
        </div>

        <div className="flex flex-col sm:flex-row">
          <div className="shrink-0 border-b-(length:--borde) border-ink bg-background p-3 sm:w-48 sm:border-b-0 sm:border-r-(length:--borde)">
            {/* Sin saber la proporción de la foto, se reserva una vertical
                (4/5), la más común en fotos de celular — igual que la ficha. */}
            <div className="mx-auto w-full max-w-48 border-(length:--borde) border-ink rounded-theme">
              <Hueso className="aspect-[4/5] w-full" />
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
            {/* Título: text-2xl + py-2 + borde = 52px. */}
            <Hueso className="h-13 w-full" />
            {/* Descripción: cuatro renglones de text-sm + py-2 + borde. */}
            <Hueso className="h-25 w-full" />

            <div className="flex flex-col gap-1.5">
              <Hueso className="h-10 w-full" />
              <div className="flex flex-wrap gap-1">
                {HASHTAGS.map((ancho) => (
                  <Hueso key={ancho} className={`h-6 ${ancho}`} />
                ))}
              </div>
            </div>

            <Hueso className="h-7 w-28" />

            <div className="flex flex-wrap items-center gap-2 border-t-(length:--borde) border-ink/20 pt-3">
              <Hueso className="h-9 w-24" />
              <Hueso className="h-9 w-24" />
              <Hueso className="ml-auto h-9 w-24" />
            </div>
          </div>
        </div>
      </div>
    </EsqueletoPantalla>
  );
}
