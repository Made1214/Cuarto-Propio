/** Iconos de la barra del editor. Reemplazan las letras "N/K/S": una K para
 * cursiva es la convención de Word en español, pero no se adivina y en
 * inglés no significa nada — la app es bilingüe, así que el dibujo manda. */

type IconoProps = { className?: string };

function Svg({ children, className }: IconoProps & { children: React.ReactNode }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export function IconoNegrita(props: IconoProps) {
  return (
    <Svg {...props}>
      <path d="M6 4h7a4 4 0 0 1 0 8H6zM6 12h8a4 4 0 0 1 0 8H6z" />
    </Svg>
  );
}

export function IconoCursiva(props: IconoProps) {
  return (
    <Svg {...props}>
      <path d="M19 4h-9M14 20H5M15 4L9 20" />
    </Svg>
  );
}

export function IconoTachado(props: IconoProps) {
  return (
    <Svg {...props}>
      <path d="M4 12h16M7 7a4 3 0 0 1 4-3h3a4 3 0 0 1 4 3M6 16a4 3 0 0 0 4 4h4a4 3 0 0 0 4-4" />
    </Svg>
  );
}

export function IconoTitulo({ nivel, ...props }: IconoProps & { nivel: 2 | 3 }) {
  return (
    <span className="flex items-center font-pixel text-xs leading-none">
      <Svg {...props}>
        <path d="M6 4v16M18 4v16M6 12h12" />
      </Svg>
      <span className="ml-0.5">{nivel}</span>
    </span>
  );
}

export function IconoLista(props: IconoProps) {
  return (
    <Svg {...props}>
      <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
    </Svg>
  );
}

export function IconoListaNumerada(props: IconoProps) {
  return (
    <Svg {...props}>
      <path d="M10 6h10M10 12h10M10 18h10M4 6h1v4M4 10h2M4 15h2v3H4v-3" />
    </Svg>
  );
}

export function IconoCita(props: IconoProps) {
  return (
    <Svg {...props}>
      <path d="M7 15a3 3 0 1 1 0-6c0-3 2-5 4-5M17 15a3 3 0 1 1 0-6c0-3 2-5 4-5" />
    </Svg>
  );
}

export function IconoEnlace(props: IconoProps) {
  return (
    <Svg {...props}>
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </Svg>
  );
}

export function IconoQuitar(props: IconoProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function IconoImagen(props: IconoProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="18" height="18" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-5-5L5 21" />
    </Svg>
  );
}
