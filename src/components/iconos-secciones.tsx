/**
 * Los íconos de las cuatro secciones y de "Crear": un solo lugar para que la
 * barra de arriba, la de abajo (celular) y la ventanita de Crear muestren
 * siempre el mismo dibujo para la misma cosa.
 *
 * Trazo con `currentColor`, así toman el color del link que los contiene
 * (activo, inactivo, sobre la barra morada o sobre la tarjeta blanca).
 */

type PropsIcono = { tamano?: number; className?: string };

function Trazo({
  tamano = 24,
  className,
  grosor = 2,
  children,
}: PropsIcono & { grosor?: number; children: React.ReactNode }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export function IconoDiario(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <path d="M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3z" />
      <path d="M21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z" />
    </Trazo>
  );
}

export function IconoListas(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <path d="M10 6h10M10 12h10M10 18h10" />
      <path d="M3 6l1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17" />
    </Trazo>
  );
}

export function IconoVitrina(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <rect x="3" y="3" width="18" height="18" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-5-5L5 21" />
    </Trazo>
  );
}

export function IconoAudio(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </Trazo>
  );
}

export function IconoMas(props: PropsIcono) {
  return (
    <Trazo grosor={2.6} {...props}>
      <path d="M12 5v14M5 12h14" />
    </Trazo>
  );
}

export function IconoEscribir(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="M13 7l4 4" />
    </Trazo>
  );
}

export function IconoCerrar(props: PropsIcono) {
  return (
    <Trazo grosor={2.6} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Trazo>
  );
}

/** Dibujo pixelado: cada fila es un renglón de una grilla de 12×12, `X` =
 * píxel pintado (con `currentColor`, como los de trazo). */
function Pixeles({ tamano = 24, className, filas }: PropsIcono & { filas: string[] }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 12 12"
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      {filas.flatMap((fila, y) =>
        [...fila].map((c, x) => (c === "X" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : null)),
      )}
    </svg>
  );
}

export function IconoDiarioPixel(props: PropsIcono) {
  return (
    <Pixeles
      {...props}
      filas={["", ".XXXX..XXXX.", "X....XX....X", "X.XX.XX.XX.X", "X....XX....X", "X.XX.XX.XX.X", "X....XX....X", "X.XX.XX.XX.X", "X....XX....X", ".XXXXXXXXXX.", "", ""]}
    />
  );
}

export function IconoListasPixel(props: PropsIcono) {
  return (
    <Pixeles
      {...props}
      filas={["", "XXX.........", "X.X.XXXXXXX.", "XXX.........", "", "XXX.........", "X.X.XXXXXXX.", "XXX.........", "", "XXX.........", "X.X.XXXXX...", "XXX........."]}
    />
  );
}

export function IconoVitrinaPixel(props: PropsIcono) {
  return (
    <Pixeles
      {...props}
      filas={["XXXXXXXXXXXX", "X..........X", "X.XX.......X", "X.XX.......X", "X..........X", "X......X...X", "X.....XXX..X", "X..X.XXXXX.X", "X.XXXXXXXXXX", "X.XXXXXXXXXX", "X..........X", "XXXXXXXXXXXX"]}
    />
  );
}

export function IconoAudioPixel(props: PropsIcono) {
  return (
    <Pixeles
      {...props}
      filas={["", "XXXXXXXXXXXX", "X..........X", "X.XXXXXXXX.X", "X.X.X..X.X.X", "X.XXXXXXXX.X", "X..........X", "X..XXXXXX..X", "X.X......X.X", "XXXXXXXXXXXX", "", ""]}
    />
  );
}

/** Los dibujos de cada sección, indexados por su ruta: así la barra de
 * navegación no tiene que saber cuál va con cuál. */
export const ICONO_SECCION = {
  "/diario": IconoDiario,
  "/listas": IconoListas,
  "/vitrina": IconoVitrina,
  "/audio": IconoAudio,
} as const;

export const ICONO_SECCION_PIXEL = {
  "/diario": IconoDiarioPixel,
  "/listas": IconoListasPixel,
  "/vitrina": IconoVitrinaPixel,
  "/audio": IconoAudioPixel,
} as const;

export type RutaSeccion = keyof typeof ICONO_SECCION;
