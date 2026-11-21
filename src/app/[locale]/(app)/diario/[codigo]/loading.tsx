import { EsqueletoPantalla, Hueso } from "@/components/esqueleto";
import { EsqueletoBarraEntrada } from "../esqueleto-entrada-form";

/** Renglones del cuerpo de la entrada: largos dispares, como un texto de
 * verdad, con el último corto de fin de párrafo. */
const RENGLONES = ["w-full", "w-11/12", "w-full", "w-4/5", "w-full", "w-2/3"] as const;

/** Una entrada abierta mientras llega del servidor: la misma ventana de
 * `page.tsx` (la barra con volver y las acciones; la fecha, el título y el
 * cuerpo debajo). */
export default function CargandoEntrada() {
  return (
    <EsqueletoPantalla className="mx-auto flex w-full max-w-2xl flex-col">
      <div className="border-(length:--borde) border-ink rounded-theme bg-card shadow-marco">
        <EsqueletoBarraEntrada acciones={2} />
        <div className="flex flex-col gap-4 p-4 sm:p-6">
          <Hueso className="h-3.5 w-48" />
          <Hueso className="h-8 w-3/4" />
          <div className="flex flex-col gap-2.5">
            {RENGLONES.map((ancho, indice) => (
              <Hueso key={indice} className={`h-4 ${ancho}`} />
            ))}
          </div>
        </div>
      </div>
    </EsqueletoPantalla>
  );
}
