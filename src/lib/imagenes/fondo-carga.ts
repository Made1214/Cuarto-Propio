import { TEMA_POR_DEFECTO } from "@/lib/temas/presets";

/**
 * Lo que se ve en el lugar de una foto mientras baja: un degradé suave de
 * rosado a turquesa, en vez de un hueco del color del fondo que parecía una
 * tarjeta rota.
 *
 * Va como `placeholder` de next/image (un data URL) y no como clase de fondo
 * del contenedor porque next/image lo saca solo cuando la foto termina de
 * cargar: una pieza con partes transparentes (un dibujo en PNG) se sigue
 * viendo sobre el fondo de la página, como siempre, y no sobre el degradé.
 *
 * Un data URL no puede leer las variables CSS del tema, así que los colores
 * salen de los tokens del tema de fábrica y van con transparencia: así el
 * degradé se apoya en el fondo de la página y sirve igual en modo claro y
 * oscuro sin tener que elegir entre dos versiones.
 */
const { primarioRosa, secundarioTurquesa } = TEMA_POR_DEFECTO.colores.claro;

const SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" preserveAspectRatio="none">` +
  `<linearGradient id="g" x2="1" y2="1">` +
  `<stop offset="0" stop-color="${primarioRosa}" stop-opacity=".35"/>` +
  `<stop offset="1" stop-color="${secundarioTurquesa}" stop-opacity=".3"/>` +
  `</linearGradient><rect width="1" height="1" fill="url(#g)"/></svg>`;

export const FONDO_MIENTRAS_CARGA = `data:image/svg+xml,${encodeURIComponent(SVG)}` as const;
