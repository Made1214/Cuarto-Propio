"use client";

import { Children, useSyncExternalStore, type ReactNode } from "react";

/**
 * La pared de la Vitrina, como Pinterest: cada pieza cae en la columna que
 * va más corta, así lo más nuevo se lee de izquierda a derecha y de arriba
 * abajo, sin huecos.
 *
 * Por qué no columnas CSS (lo de antes): con `columns` el orden corre de
 * arriba abajo POR COLUMNA. En el celular, con dos columnas, la pieza 0
 * quedaba a la izquierda y a su lado la 12: lo más reciente no estaba
 * arriba. Y sumar una tanda redistribuía la pared entera.
 *
 * El reparto se hace con la proporción de cada foto (que ya se conoce: la
 * guarda `sharp` al subirla), sin medir nada. Es incremental: sumar piezas al
 * final nunca mueve las que ya estaban, así que "cargar más" solo crece
 * hacia abajo.
 *
 * La cantidad de columnas depende del ancho, que el servidor no conoce. Para
 * que no salte nada al hidratar, el HTML del servidor trae la pared armada
 * para las cuatro cantidades posibles, y CSS muestra la que corresponde
 * (las otras están en `display: none`, así que sus fotos diferidas ni se
 * piden, y las inmediatas comparten URL con la visible). Ya en el cliente se
 * deja solo la del ancho actual —la misma que se estaba viendo, con la misma
 * `key`, así que React conserva su DOM— y se rearma si cambia el ancho.
 *
 * Las piezas llegan como `children` (renderizadas una sola vez en el
 * servidor) y se reutilizan en cada armado.
 */

type Armado = { columnas: number; clase: string; consulta: string };

/** De menor a mayor ancho. `clase`: dónde se muestra antes de hidratar. */
const ARMADOS: Armado[] = [
  { columnas: 2, clase: "flex sm:hidden", consulta: "(max-width: 39.999rem)" },
  { columnas: 3, clase: "hidden sm:flex lg:hidden", consulta: "(min-width: 40rem) and (max-width: 63.999rem)" },
  { columnas: 4, clase: "hidden lg:flex 2xl:hidden", consulta: "(min-width: 64rem) and (max-width: 95.999rem)" },
  { columnas: 5, clase: "hidden 2xl:flex", consulta: "(min-width: 96rem)" },
];

function columnasActuales(): number {
  return ARMADOS.find((armado) => window.matchMedia(armado.consulta).matches)?.columnas ?? 2;
}

function suscribirse(avisar: () => void) {
  const listas = ARMADOS.map((armado) => window.matchMedia(armado.consulta));
  listas.forEach((lista) => lista.addEventListener("change", avisar));
  return () => listas.forEach((lista) => lista.removeEventListener("change", avisar));
}

/** Alto relativo de una pieza, en anchos de columna: la foto más el marco. */
export type MedidaPieza = { proporcion: number; conTitulo: boolean };

function repartir(medidas: MedidaPieza[], columnas: number): number[][] {
  const altos = Array<number>(columnas).fill(0);
  const reparto: number[][] = Array.from({ length: columnas }, () => []);
  medidas.forEach((medida, indice) => {
    let destino = 0;
    // Con un margen chico: entre dos columnas casi parejas gana la de la
    // izquierda, como al leer.
    for (let columna = 1; columna < columnas; columna++) {
      if (altos[columna] < altos[destino] - 0.02) destino = columna;
    }
    reparto[destino].push(indice);
    altos[destino] += medida.proporcion + 0.1 + (medida.conTitulo ? 0.16 : 0);
  });
  return reparto;
}

export function ParedMasonry({
  medidas,
  children,
}: {
  /** Una por pieza, en el mismo orden que `children`. */
  medidas: MedidaPieza[];
  children: ReactNode;
}) {
  const piezas = Children.toArray(children);
  const columnas = useSyncExternalStore<number | null>(suscribirse, columnasActuales, () => null);
  const armados = columnas === null ? ARMADOS : ARMADOS.filter((armado) => armado.columnas === columnas);

  return (
    <>
      {armados.map((armado) => (
        <div
          key={armado.columnas}
          className={`${columnas === null ? armado.clase : "flex"} items-start gap-2.5 sm:gap-4`}
        >
          {repartir(medidas, armado.columnas).map((indices, columna) => (
            <div key={columna} className="flex min-w-0 flex-1 flex-col gap-2.5 sm:gap-4">
              {indices.map((indice) => piezas[indice])}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
