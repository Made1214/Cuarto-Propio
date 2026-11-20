import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

/*
 * Cinta que pasa sola en el panel de acceso mostrando los cuatro módulos de
 * la app — lo que se puede hacer adentro, antes de entrar. Los colores salen de los
 * tokens del tema (globals.css), nunca de hex sueltos, para que el modo
 * oscuro y los temas futuros la cubran sin tocar este archivo.
 */

type Modulo = {
  clave: "diario" | "listas" | "vitrina" | "audio";
  fondo: string;
  texto: string;
  fondoIcono: string;
  icono: ReactNode;
};

const MODULOS: Modulo[] = [
  {
    clave: "diario",
    fondo: "bg-primary-pink",
    texto: "text-ink-strong",
    fondoIcono: "bg-white/75 text-ink-strong",
    icono: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
  },
  {
    clave: "listas",
    // El panel ya es morado: esta va en el color de tarjeta para no perderse.
    fondo: "bg-card",
    texto: "text-ink",
    fondoIcono: "bg-primary-pink text-ink-strong",
    icono: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
        <rect x="3" y="5" width="6" height="6" rx="1" />
        <path d="M5 8l1.5 1.5L9 6.5M13 8h8" />
        <rect x="3" y="14" width="6" height="6" rx="1" />
        <path d="M13 17h8" />
      </svg>
    ),
  },
  {
    clave: "vitrina",
    fondo: "bg-secondary-turquoise",
    texto: "text-ink-strong",
    fondoIcono: "bg-white/75 text-ink-strong",
    icono: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
  {
    clave: "audio",
    fondo: "bg-primary-green",
    texto: "text-ink-strong",
    fondoIcono: "bg-white/75 text-ink-strong",
    icono: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="4" y1="10" x2="4" y2="14" />
        <line x1="8" y1="6" x2="8" y2="18" />
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="16" y1="7" x2="16" y2="17" />
        <line x1="20" y1="10" x2="20" y2="14" />
      </svg>
    ),
  },
];

// Los detalles de la segunda cinta: solo cosas que ya existen en la app.
const DETALLES = [
  "categorias",
  "hashtags",
  "busqueda",
  "temas",
  "cursor",
  "modo",
  "idiomas",
  "instalable",
] as const;

export async function ModulosMarquee({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "login.modulo" });
  const tDetalle = await getTranslations({ locale, namespace: "login.detalle" });

  const pastillas = (copia: boolean) =>
    DETALLES.map((clave) => (
      <li
        key={`${clave}-${copia ? "b" : "a"}`}
        aria-hidden={copia || undefined}
        className="flex shrink-0 items-center gap-2 rounded-full border-(length:--borde) border-background/30 bg-background/10 px-3.5 py-1.5 text-[13px] whitespace-nowrap"
      >
        <span aria-hidden="true" className="text-primary-pink">✦</span>
        {tDetalle(clave)}
      </li>
    ));

  // La lista va dos veces para que el loop sea continuo: la animación corre
  // -50% y la segunda copia ocupa justo el lugar de la primera. La copia es
  // decorativa, así que se esconde de lectores de pantalla.
  const tarjetas = (copia: boolean) =>
    MODULOS.map((m) => (
      <li
        key={`${m.clave}-${copia ? "b" : "a"}`}
        aria-hidden={copia || undefined}
        className={`flex w-[265px] shrink-0 items-start gap-3.5 rounded-theme border-(length:--borde) border-ink ${m.fondo} ${m.texto} p-4 shadow-marco transition-transform duration-200 hover:-translate-y-1`}
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-theme border border-current/20 ${m.fondoIcono}`}
        >
          {m.icono}
        </div>
        <div>
          <span className="block text-[15px] font-bold">{t(m.clave)}</span>
          <span className="mt-1 block text-[13px] leading-snug">{t(`${m.clave}Ayuda`)}</span>
        </div>
      </li>
    ));

  return (
    <>
      <div className="marquee-mascara relative w-full overflow-hidden py-3">
        <ul className="marquee-cinta flex w-max gap-5 px-2.5">
          {tarjetas(false)}
          {tarjetas(true)}
        </ul>
      </div>
      <div className="marquee-mascara relative w-full overflow-hidden py-1">
        <ul className="marquee-cinta marquee-cinta-reversa flex w-max gap-3 px-1.5">
          {pastillas(false)}
          {pastillas(true)}
        </ul>
      </div>
    </>
  );
}
