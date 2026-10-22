import { AvisoCargando } from "./aviso-cargando";

/**
 * Piezas de los `loading.tsx` de cada sección: mientras el servidor trae los
 * datos, se dibuja la pantalla con su forma real (las mismas ventanitas, los
 * mismos bordes y sombras) y bloques grises donde va a ir el contenido. Así
 * la navegación responde en el acto y, cuando llegan los datos, nada salta
 * de lugar.
 */

/** Un bloque gris que late. Late solo el bloque, no la ventana que lo
 * contiene: el marco ya es el definitivo y no tiene por qué parpadear. El
 * gris sale de la tinta con alfa, así sirve igual en modo claro y oscuro, y
 * el latido respeta a quien pidió menos movimiento en su sistema. */
export function Hueso({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`bg-ink/10 motion-safe:animate-pulse ${className}`} />;
}

/** Envoltorio de toda pantalla en carga: le avisa al lector de pantalla qué
 * está pasando (los bloques grises no le dicen nada) y le pasa al
 * contenedor las mismas clases de ancho que usa la pantalla real. */
export function EsqueletoPantalla({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    // `role="status"` y no `aria-busy`: el esqueleto entero se reemplaza
    // cuando llegan los datos, así que no hay una región "ocupada" que
    // después se complete — hay un aviso que anunciar y listo.
    <div role="status" className={className}>
      <AvisoCargando />
      {children}
    </div>
  );
}
