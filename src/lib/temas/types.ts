export type ModoColor = "claro" | "oscuro";

export type PaletaTema = {
  fondo: string;
  fondoTarjeta: string;
  texto: string;
  textoMuted: string;
  /** Color de borde/contorno — el "trazo" del tema (tarjetas, botones, iconos con borde). */
  tinta: string;
  /**
   * Tinta fija para texto/íconos que van ENCIMA de un fondo pastel (botones,
   * insignias de categoría). A diferencia de `tinta`, no se invierte en modo
   * oscuro — los acentos pastel casi no cambian de claridad entre modos, así
   * que el texto sobre ellos siempre necesita quedar oscuro para contraste.
   */
  tintaFuerte: string;
  primarioVerde: string;
  primarioRosa: string;
  secundarioTurquesa: string;
  secundarioMorado: string;
};

export type EstiloSombra = "suave" | "dura";

/**
 * Un tema de diseño completo: no solo colores, también la tipografía y el
 * "lenguaje de forma" (bordes, radio, sombra) que le dan su carácter propio
 * (ej. Retro vs. Whimsical). Cada componente lee estos tokens — nunca sus
 * propios valores sueltos — para que agregar un tema nuevo sea solo llenar
 * este contrato, sin tocar componentes.
 */
export type TemaDiseno = {
  id: string;
  nombre: string;
  descripcion: string;
  colores: Record<ModoColor, PaletaTema>;
  /** Tipografía para lo que la usuaria escribe (títulos y cuerpo del diario). */
  fuenteDiario: string;
  /** Tipografía para la interfaz (nav, botones, etiquetas, fechas). */
  fuenteInterfaz: string;
  radio: string;
  anchoBorde: string;
  sombra: EstiloSombra;
  /** Requerido cuando `sombra` es "dura" (sombra sólida desplazada, sin blur). */
  sombraOffset?: string;
};
