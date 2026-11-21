"use client";

/** Casilla controlada: el estado (optimista) vive en la columna, que es la
 * que también pinta el tachado y el progreso — así los tres cambian en el
 * mismo cuadro en vez de que la casilla vaya por su lado. No se deshabilita
 * mientras guarda: tocarla de nuevo manda el valor nuevo, y el servidor
 * procesa las actions en orden, así que gana el último toque. */
export function ItemCheckbox({
  marcado,
  onCambiar,
  disabled = false,
}: {
  marcado: boolean;
  onCambiar: (marcado: boolean) => void;
  disabled?: boolean;
}) {
  // La etiqueta agranda el área de toque (36 px con mouse, 44 con el dedo)
  // sin agrandar el dibujo de la casilla.
  return (
    <label className="-mx-1.5 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center pointer-coarse:h-11 pointer-coarse:w-11">
      <input
        type="checkbox"
        checked={marcado}
        disabled={disabled}
        onChange={(evento) => onCambiar(evento.target.checked)}
        className="h-5 w-5 shrink-0 cursor-pointer pointer-coarse:h-6 pointer-coarse:w-6 border-(length:--borde) border-ink rounded-theme accent-secondary-purple disabled:cursor-default"
      />
    </label>
  );
}
