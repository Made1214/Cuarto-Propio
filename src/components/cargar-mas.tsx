"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

/**
 * El "cargar más" de los listados cronológicos (Diario, Vitrina, Audio).
 *
 * No trae datos por su cuenta: cambia el `?hasta=` de la URL y el servidor
 * vuelve a renderizar la página con una tanda más (por qué así y no
 * acumulando en el cliente: `src/lib/paginacion.ts`). `replace` y no `push`
 * para no llenar el historial de un paso por tanda, y sin scroll para que la
 * pantalla se quede donde estaba mientras lo nuevo aparece debajo. Como la
 * navegación va dentro de una transición, lo que ya se veía queda en
 * pantalla —no vuelve el esqueleto de `loading.tsx`— hasta que llega lo
 * nuevo.
 *
 * Además del botón, carga sola cuando el final de la lista se acerca a la
 * pantalla, así el scroll no se corta. El botón queda igual: es lo que se
 * usa con teclado, y el respaldo si el navegador no avisa del scroll.
 *
 * También se encarga de la otra mitad de "recargar vuelve arriba" (la del
 * servidor está en `paginar`): ver `ArribaAlRecargar` y
 * `useDescartarHastaDeLaCarga` más abajo. Viven acá porque este botón y
 * `FinDeLista` son justo lo que se dibuja cuando la URL trae `hasta`, así que
 * Diario y Audio lo reciben sin tocar sus páginas.
 */
export function CargarMas({
  pathname,
  query,
}: {
  pathname: string;
  /** Los filtros vigentes más el `hasta` de la tanda siguiente. */
  query: Record<string, string>;
}) {
  const t = useTranslations("paginacion");
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const botonRef = useRef<HTMLButtonElement>(null);
  const hasta = query.hasta;
  useDescartarHastaDeLaCarga();

  function cargar() {
    if (pendiente) return;
    startTransition(() => router.replace({ pathname, query }, { scroll: false }));
  }

  const alAcercarse = useEffectEvent(cargar);

  // Un observador por tanda: cuando llega la siguiente, `hasta` cambia y se
  // vuelve a mirar. Si la lista nueva todavía no llena la pantalla, el botón
  // sigue a la vista y se pide otra — hasta llenarla o hasta que no haya más.
  useEffect(() => {
    const boton = botonRef.current;
    if (!boton || typeof IntersectionObserver === "undefined") return;

    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((entrada) => entrada.isIntersecting)) return;
        observador.disconnect();
        alAcercarse();
      },
      // Un poco antes de llegar al final, para que lo nuevo ya esté cuando
      // la usuaria llegue.
      { rootMargin: "0px 0px 600px 0px" },
    );
    observador.observe(boton);
    return () => observador.disconnect();
  }, [hasta]);

  return (
    <div className="flex justify-center">
      <ArribaAlRecargar />
      <button
        ref={botonRef}
        type="button"
        onClick={cargar}
        // `aria-disabled` y no `disabled`: desactivar el botón con el foco
        // encima lo tiraría al `body`, y quien navega con teclado perdería
        // su lugar justo cuando aparece lo nuevo.
        aria-disabled={pendiente}
        className="border-(length:--borde) border-ink rounded-theme bg-card px-5 py-3 font-pixel text-xs tracking-wide text-ink shadow-marco transition-[transform,background-color] hover:bg-secondary-purple/10 active:translate-x-1 active:translate-y-1 active:shadow-none aria-disabled:cursor-progress aria-disabled:opacity-70"
      >
        {(pendiente ? t("cargando") : t("cargarMas")).toUpperCase()}
      </button>
    </div>
  );
}

/** Lo que reemplaza al botón cuando ya no queda nada más atrás. Solo tiene
 * sentido si se cargó más de una tanda: con todo en la primera, avisar que
 * "no hay más" sobraría. */
export function FinDeLista() {
  const t = useTranslations("paginacion");
  // Si la URL traía un `hasta` de antes de una recarga, el servidor lo
  // ignoró y lo que se ve es solo la primera tanda: el aviso no corresponde.
  const descartado = useDescartarHastaDeLaCarga();
  if (descartado) return null;

  return (
    <>
      <ArribaAlRecargar />
      <p className="text-center font-pixel text-[10px] tracking-wide text-muted/60">
        {t("fin").toUpperCase()}
      </p>
    </>
  );
}

/**
 * Corre sincrónico mientras el navegador lee el HTML de una carga completa,
 * antes de que pinte la lista: si la carga es una recarga (o un "atrás" que
 * vuelve a pedir el documento), apaga la restauración de scroll del
 * navegador para esta entrada del historial y sube arriba. Sin esto el
 * navegador intentaba volver al punto exacto donde estaba la usuaria —con la
 * lista cortada en la primera tanda, quedaba en cualquier lado.
 *
 * La restauración se vuelve a encender en cuanto la página termina de cargar
 * o la usuaria scrollea por su cuenta (lo que llegue primero): las entradas
 * que la app agregue después al historial heredan ese modo, y el "atrás"
 * desde una ficha tiene que seguir devolviéndola a su lugar en la lista.
 * Las navegaciones de adentro de la app no cuentan: el `<script>` solo se
 * ejecuta al leer el HTML del servidor (ver `ArribaAlRecargar`).
 */
const SCRIPT_ARRIBA_AL_RECARGAR = `(function(){try{var n=performance.getEntriesByType("navigation")[0];if(!n||(n.type!=="reload"&&n.type!=="back_forward"))return;var h=history;h.scrollRestoration="manual";scrollTo(0,0);var listo=false;function auto(){if(listo)return;listo=true;h.scrollRestoration="auto";removeEventListener("scroll",alScroll)}function alScroll(){if(scrollY>0)auto()}addEventListener("scroll",alScroll,{passive:true});if(document.readyState==="complete")setTimeout(auto,0);else addEventListener("load",function(){setTimeout(auto,0)},{once:true})}catch(e){}})()`;

const sinSuscripcion = () => () => {};

/** `true` solo en el render del servidor y en el de la hidratación (los dos
 * que salen de una carga completa); `false` en cualquier montaje posterior,
 * como los de una navegación dentro de la app. */
function useEsHidratacion(): boolean {
  return useSyncExternalStore(
    sinSuscripcion,
    () => false,
    () => true,
  );
}

/**
 * El script de `SCRIPT_ARRIBA_AL_RECARGAR`, dibujado solo en el HTML del
 * servidor: en un montaje del cliente React no ejecuta los `<script>` (y
 * avisa por consola), así que después de hidratar desaparece. Es inofensivo
 * repetido en la misma página: hace dos veces lo mismo.
 *
 * Lo usan también la Vitrina y la ficha de una pieza, que pueden recargarse
 * sin que haya ni "cargar más" ni "no hay más".
 */
export function ArribaAlRecargar() {
  const hidratando = useEsHidratacion();
  if (!hidratando) return null;
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT_ARRIBA_AL_RECARGAR }} />;
}

/**
 * Si la página salió de una carga completa con `?hasta=` en la URL, el
 * servidor lo descartó y dibujó la primera tanda (`paginar`). Acá se borra
 * también de la URL, para que el próximo `refresh()` —el de las actions de
 * Audio, el de grabar o exhibir— no lo vuelva a aplicar y estire la lista de
 * golpe. Devuelve `true` cuando lo borró.
 *
 * `history.replaceState` y no `router.replace`: Next lo integra a su router
 * (actualiza la URL que conoce sin volver a pedirle nada al servidor), y lo
 * que se ve ya es exactamente lo que corresponde a la URL sin `hasta`. Va en
 * un `setTimeout` porque Next engancha `replaceState` en un efecto de su
 * propio árbol, que corre después de los de los componentes de adentro.
 */
function useDescartarHastaDeLaCarga(): boolean {
  const hidratando = useEsHidratacion();
  // El valor del primer render: si fue una hidratación, esta es la página
  // que mandó el servidor para la carga completa.
  const [nacioDeUnaCarga] = useState(hidratando);
  const [descartado, setDescartado] = useState(false);

  useEffect(() => {
    if (!nacioDeUnaCarga) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("hasta")) return;
    url.searchParams.delete("hasta");

    const temporizador = setTimeout(() => {
      window.history.replaceState(null, "", url);
      setDescartado(true);
    }, 0);
    return () => clearTimeout(temporizador);
  }, [nacioDeUnaCarga]);

  return descartado;
}
