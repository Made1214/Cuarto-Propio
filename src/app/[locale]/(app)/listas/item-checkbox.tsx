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
  return (
    <input
      type="checkbox"
      checked={marcado}
      disabled={disabled}
      onChange={(evento) => onCambiar(evento.target.checked)}
      className="h-5 w-5 shrink-0 cursor-pointer border-(length:--borde) border-ink rounded-theme accent-secondary-purple disabled:cursor-default"
    />
  );
}
