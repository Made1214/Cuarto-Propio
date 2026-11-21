import { EsqueletoPantalla, Hueso } from "@/components/esqueleto";
import { EsqueletoBarraEntrada, EsqueletoEntradaForm } from "../../esqueleto-entrada-form";

/** Editar una entrada mientras llega del servidor: la misma ventana de
 * `page.tsx` (barra con volver, estado, Eliminar, Guardar y el formato; la
 * fecha y el formulario debajo). Sin este archivo, Next tomaba el esqueleto
 * de la entrada en modo lectura y al llegar los campos aparecían de golpe
 * donde se esperaba un texto corrido. */
export default function CargandoEditarEntrada() {
  return (
    <EsqueletoPantalla className="mx-auto flex w-full max-w-2xl flex-col">
      <div className="border-(length:--borde) border-ink rounded-theme bg-card shadow-marco">
        <EsqueletoBarraEntrada acciones={2} formato />
        <div className="flex flex-col gap-4 p-4 sm:p-6">
          <Hueso className="h-3.5 w-48" />
          <EsqueletoEntradaForm conTexto />
        </div>
      </div>
    </EsqueletoPantalla>
  );
}
