import { EsqueletoPantalla, Hueso } from "@/components/esqueleto";
import { EsqueletoBarraEntrada, EsqueletoEntradaForm } from "../esqueleto-entrada-form";

/** "Nueva entrada" mientras llegan las categorías: la misma ventana de
 * `page.tsx` (barra con volver, estado, Guardar y el formato; el
 * formulario debajo). Sin este archivo, Next mostraba el esqueleto del
 * listado del diario y la pantalla cambiaba de forma entera al llegar. */
export default function CargandoNuevaEntrada() {
  return (
    <EsqueletoPantalla className="mx-auto flex w-full max-w-2xl flex-col">
      <div className="border-(length:--borde) border-ink rounded-theme bg-card shadow-marco">
        <EsqueletoBarraEntrada acciones={1} formato />
        <div className="flex flex-col gap-4 p-4 sm:p-6">
          <Hueso className="h-3 w-44" />
          <EsqueletoEntradaForm conTexto={false} />
        </div>
      </div>
    </EsqueletoPantalla>
  );
}
