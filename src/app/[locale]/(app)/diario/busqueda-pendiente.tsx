"use client";

import { createContext, use, useTransition, type TransitionStartFunction } from "react";

type TransicionBusqueda = { pendiente: boolean; iniciar: TransitionStartFunction };

const Contexto = createContext<TransicionBusqueda | null>(null);

/**
 * Una sola transición para el buscador y los resultados del Diario. El
 * buscador la usa para navegar a la URL con el término; los resultados la
 * leen para atenuarse mientras tanto. Antes la lista vieja quedaba en
 * pantalla, a todo color, como si ya fuera la respuesta.
 *
 * No dibuja nada: envuelve la página tal como viene del servidor, y los
 * hijos (que son de servidor) no se vuelven a renderizar cuando cambia
 * `pendiente`, solo los que leen el contexto.
 */
export function ZonaBusqueda({ children }: { children: React.ReactNode }) {
  const [pendiente, iniciar] = useTransition();
  return <Contexto value={{ pendiente, iniciar }}>{children}</Contexto>;
}

export function useTransicionBusqueda(): TransicionBusqueda {
  const valor = use(Contexto);
  if (!valor) throw new Error("useTransicionBusqueda tiene que usarse dentro de <ZonaBusqueda>");
  return valor;
}

/** Los resultados, atenuados mientras la búsqueda viaja. El atenuado espera
 * un instante antes de entrar (y sale sin espera): si la respuesta llega
 * enseguida, no parpadea. */
export function ResultadosBusqueda({ children }: { children: React.ReactNode }) {
  const { pendiente } = useTransicionBusqueda();
  return (
    <div
      data-pendiente={pendiente}
      aria-busy={pendiente}
      className="flex flex-col gap-6 transition-opacity duration-200 data-[pendiente=true]:opacity-50 data-[pendiente=true]:delay-150"
    >
      {children}
    </div>
  );
}
