import { EsqueletoPantalla, Hueso } from "@/components/esqueleto";

/** Renglones del cuerpo de la entrada: largos dispares, como un texto de
 * verdad, con el último corto de fin de párrafo. */
const RENGLONES = ["w-full", "w-11/12", "w-full", "w-4/5", "w-full", "w-2/3"] as const;

/** Una entrada abierta mientras llega del servidor: la misma ventana de
 * `page.tsx` (cabecera con fecha y acciones, y el cuerpo debajo). */
export default function CargandoEntrada() {
  return (
    <EsqueletoPantalla className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Hueso className="h-3.5 w-20" />

      <div className="divide-y-2 divide-ink border-2 border-ink bg-card shadow-[5px_5px_0_var(--ink)]">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <Hueso className="h-3 w-28" />
            <Hueso className="h-7 w-20" />
          </div>
          <div className="flex items-center gap-2.5">
            <Hueso className="h-9 w-20" />
            <Hueso className="h-9 w-24" />
          </div>
        </div>

        <div className="flex flex-col gap-3 p-6">
          <Hueso className="h-8 w-3/4" />
          <div className="mt-2 flex flex-col gap-2.5">
            {RENGLONES.map((ancho, indice) => (
              <Hueso key={indice} className={`h-4 ${ancho}`} />
            ))}
          </div>
        </div>
      </div>
    </EsqueletoPantalla>
  );
}
