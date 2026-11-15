"use client";

import { useEffect, useState } from "react";
import { useFormatter } from "next-intl";

/**
 * La hora y el calendario de la decoración salen del reloj del dispositivo,
 * no del servidor (que vive en otra zona horaria). Por eso se pintan recién
 * después de montar: en el HTML del servidor queda el hueco reservado.
 */
function useAhora(intervaloMs: number): Date | null {
  const [ahora, setAhora] = useState<Date | null>(null);
  useEffect(() => {
    const actualizar = () => setAhora(new Date());
    actualizar();
    const id = window.setInterval(actualizar, intervaloMs);
    return () => window.clearInterval(id);
  }, [intervaloMs]);
  return ahora;
}

export function Reloj({ className }: { className?: string }) {
  const format = useFormatter();
  const ahora = useAhora(30_000);
  return (
    <span className={className}>
      {ahora ? format.dateTime(ahora, { hour: "2-digit", minute: "2-digit" }) : "--:--"}
    </span>
  );
}

/** Calendario del mes en curso, con hoy marcado. Semana de lunes a domingo. */
export function CalendarioMes({ etiquetaDias }: { etiquetaDias: string[] }) {
  const format = useFormatter();
  const ahora = useAhora(60 * 60_000);
  if (!ahora) return <div className="dec-calendario" aria-hidden="true" />;

  const anio = ahora.getFullYear();
  const mes = ahora.getMonth();
  const primero = (new Date(anio, mes, 1).getDay() + 6) % 7;
  const dias = new Date(anio, mes + 1, 0).getDate();
  const celdas: (number | null)[] = [
    ...Array<null>(primero).fill(null),
    ...Array.from({ length: dias }, (_, i) => i + 1),
  ];

  return (
    <div className="flex flex-col gap-2">
      <span className="dec-rotulo">{format.dateTime(ahora, { month: "long", year: "numeric" })}</span>
      <div className="dec-calendario" aria-hidden="true">
        {etiquetaDias.map((dia, i) => (
          <span key={`d${i}`} className="opacity-70">
            {dia}
          </span>
        ))}
        {celdas.map((dia, i) => (
          <span key={i} className={dia === ahora.getDate() ? "dec-hoy" : undefined}>
            {dia ?? ""}
          </span>
        ))}
      </div>
    </div>
  );
}
