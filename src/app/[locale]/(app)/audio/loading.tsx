import { EsqueletoPantalla, Hueso } from "@/components/esqueleto";

/** Anchos de los títulos de las notas: dispares para que la pila no
 * parezca una misma tarjeta repetida. */
const TITULOS = ["w-1/2", "w-2/5", "w-3/5"] as const;

/** El archivo de audio mientras llegan las notas: encabezado con la
 * grabadora, el filtro y una nota por fila, como en `page.tsx`. */
export default function CargandoAudio() {
  return (
    <EsqueletoPantalla className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Hueso className="h-9 w-32" />
          <Hueso className="h-4 w-52" />
        </div>
        <Hueso className="h-11 w-32" />
      </div>

      <Hueso className="h-11 w-64 max-w-full" />

      <div className="flex flex-col gap-5">
        {TITULOS.map((ancho) => (
          <div
            key={ancho}
            className="flex flex-col gap-3 border-(length:--borde) border-ink rounded-theme bg-card p-4 shadow-marco"
          >
            <div className="flex items-center gap-1">
              <div className="min-w-0 flex-1 py-1">
                <Hueso className={`h-6 ${ancho}`} />
              </div>
              <Hueso className="mx-1 h-3 w-10 shrink-0" />
              <Hueso className="h-7 w-7 shrink-0" />
            </div>

            {/* El reproductor nativo: mismo alto aproximado y las puntas
                redondeadas con que lo dibujan los navegadores. */}
            <Hueso className="h-10 w-full rounded-full" />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Hueso className="h-2.5 w-28" />
              <Hueso className="h-8 w-full max-w-56" />
            </div>
          </div>
        ))}
      </div>
    </EsqueletoPantalla>
  );
}
