import { EsqueletoPantalla, Hueso } from "@/components/esqueleto";
import { EsqueletoEntradaForm } from "../../esqueleto-entrada-form";

/** Editar una entrada mientras llega del servidor: la misma ventana de
 * `page.tsx` (cabecera con fecha, categoría, Guardar y Eliminar, y el
 * formulario debajo). Sin este archivo, Next tomaba el esqueleto de la
 * entrada en modo lectura — el `loading.tsx` de `[codigo]` — y al llegar
 * los campos aparecían de golpe donde se esperaba un texto corrido. */
export default function CargandoEditarEntrada() {
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

        <div className="p-5">
          <EsqueletoEntradaForm conTexto />
        </div>
      </div>
    </EsqueletoPantalla>
  );
}
