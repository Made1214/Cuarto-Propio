import { EsqueletoPantalla, Hueso } from "@/components/esqueleto";
import { EsqueletoEntradaForm } from "../esqueleto-entrada-form";

/** "Nueva entrada" mientras llegan las categorías: la misma ventana de
 * `page.tsx` (cabecera con la pregunta y Guardar, y el formulario debajo).
 * Sin este archivo, Next mostraba el esqueleto del listado del diario — el
 * `loading.tsx` más cercano hacia arriba — y la pantalla cambiaba de forma
 * entera al llegar. */
export default function CargandoNuevaEntrada() {
  return (
    <EsqueletoPantalla className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Hueso className="h-3.5 w-20" />

      <div className="divide-y-2 divide-ink border-(length:--borde) border-ink rounded-theme bg-card shadow-marco">
        {/* `flex-wrap` por si en 360px la pregunta y el botón no entran en
            un renglón: mejor bajar el botón que desbordar la ventana. */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <Hueso className="h-7 w-48 max-w-full" />
          <Hueso className="h-9 w-24" />
        </div>

        <div className="p-5">
          <EsqueletoEntradaForm conTexto={false} />
        </div>
      </div>
    </EsqueletoPantalla>
  );
}
