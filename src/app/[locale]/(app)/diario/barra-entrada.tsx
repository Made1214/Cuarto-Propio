import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/**
 * La barra de arriba de una entrada, la misma al leerla, al escribirla y al
 * editarla: volver a la izquierda, el estado en el medio y las acciones a la
 * derecha (la principal, rellena, al final). Queda pegada debajo de la barra
 * de la app, así Guardar y el formato siguen a mano en una entrada larga y
 * con el teclado abierto — antes quedaban arriba y había que volver a subir.
 *
 * `formato` es el lugar de la barra de formato del editor (`TiptapEditor`
 * la dibuja ahí con un portal); solo lo usan escribir y editar.
 */
export function BarraEntrada({
  volverHref,
  volverTexto,
  estado,
  acciones,
  formatoId,
}: {
  volverHref: string;
  volverTexto: string;
  estado?: ReactNode;
  acciones: ReactNode;
  formatoId?: string;
}) {
  return (
    <div className="fijo-bajo-barra z-20 flex flex-col gap-2 rounded-t-theme border-b-(length:--borde) border-ink bg-card px-3 py-2 sm:px-4">
      <div className="flex items-center gap-2">
        <Link
          href={volverHref}
          aria-label={volverTexto}
          title={volverTexto}
          className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-theme text-secondary-purple transition-colors hover:bg-secondary-purple/10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">{estado}</div>
        <div className="flex shrink-0 items-center gap-2">{acciones}</div>
      </div>
      {formatoId ? <div id={formatoId} className="empty:hidden" /> : null}
    </div>
  );
}
