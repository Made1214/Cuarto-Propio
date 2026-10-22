import { EsqueletoPantalla, Hueso } from "@/components/esqueleto";
import { BotonesVentana } from "./iconos";

/** Proporciones de las fotos de mentira. Variadas a propósito: lo que hace
 * reconocible a la cuadrícula masonry es justamente que cada ventana mide
 * distinto, y con todas iguales parecería una grilla común. Algunas sin
 * título, como pasa en la vitrina real. */
const PIEZAS = [
  { proporcion: "aspect-[4/5]", titulo: "w-2/3" },
  { proporcion: "aspect-square", titulo: null },
  { proporcion: "aspect-[3/4]", titulo: "w-1/2" },
  { proporcion: "aspect-[4/3]", titulo: "w-3/5" },
  { proporcion: "aspect-[2/3]", titulo: null },
  { proporcion: "aspect-[5/4]", titulo: "w-2/5" },
  { proporcion: "aspect-[3/4]", titulo: "w-3/4" },
  { proporcion: "aspect-square", titulo: "w-1/2" },
] as const;

const HASHTAGS = ["w-16", "w-20", "w-14", "w-24"] as const;

/** La Vitrina mientras llegan las piezas: encabezado, filtros y la pared de
 * ventanitas, con las mismas columnas que `page.tsx` para que al llegar las
 * fotos de verdad caigan en el mismo lugar. */
export default function CargandoVitrina() {
  return (
    <EsqueletoPantalla className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Hueso className="mt-1 h-5 w-5 shrink-0" />
          <div className="flex flex-col gap-2">
            <Hueso className="h-9 w-36" />
            <Hueso className="h-4 w-52" />
          </div>
        </div>
        <Hueso className="h-11 w-36" />
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <Hueso className="h-11 w-64 max-w-full" />
        <div className="flex flex-wrap items-center gap-1.5">
          {HASHTAGS.map((ancho) => (
            <Hueso key={ancho} className={`h-8 ${ancho}`} />
          ))}
        </div>
      </div>

      <div className="columns-[15rem] gap-5 lg:columns-[17rem]">
        {PIEZAS.map((pieza, indice) => (
          <div key={indice} className="mb-5 break-inside-avoid">
            <div className="border-2 border-ink bg-card shadow-[5px_5px_0_var(--ink)]">
              <div className="flex items-center justify-end gap-2 border-b-2 border-ink bg-secondary-purple px-2 py-1.5 text-background">
                <BotonesVentana />
              </div>
              <Hueso className={`w-full ${pieza.proporcion}`} />
              {pieza.titulo ? (
                <div className="border-t-2 border-ink px-2.5 py-2.5">
                  <Hueso className={`h-3.5 ${pieza.titulo}`} />
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </EsqueletoPantalla>
  );
}
