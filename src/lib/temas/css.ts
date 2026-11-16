import { CURSORES, PUNTO_CURSOR_PROPIO } from "./cursores";
import { paletaEfectiva, type ConfigTema } from "./config";
import { FUENTES_DIARIO, FUENTES_INTERFAZ } from "./fuentes";
import { variablesCategorias } from "./categorias";
import { variablesPropiasTema } from "./derivados";
import { TEMAS_DISPONIBLES } from "./presets";
import type { PaletaTema } from "./types";

/** Paleta del tema → variables CSS que leen los componentes (las mismas que
 * define globals.css con los valores por defecto). */
export function variablesPaleta(paleta: PaletaTema): Record<string, string> {
  return {
    "--background": paleta.fondo,
    "--foreground": paleta.texto,
    "--card": paleta.fondoTarjeta,
    "--muted": paleta.texto,
    "--ink": paleta.tinta,
    "--ink-strong": paleta.tintaFuerte,
    "--primary-green": paleta.primarioVerde,
    "--primary-pink": paleta.primarioRosa,
    "--secondary-turquoise": paleta.secundarioTurquesa,
    "--secondary-purple": paleta.secundarioMorado,
    ...variablesCategorias(paleta),
  };
}

function declaraciones(variables: Record<string, string>): string {
  return Object.entries(variables)
    .map(([nombre, valor]) => `${nombre}:${valor}`)
    .join(";");
}

/**
 * El CSS del tema activo, para inyectar en un <style> del layout de la app.
 *
 * Seguridad: todo lo que entra acá ya pasó por `configDesdeFila`, que solo
 * deja colores #RRGGBB, ids de listas cerradas (preset, fuentes, cursores)
 * y PNG en base64 generados por el servidor. Nada de lo que escribe la
 * usuaria llega crudo al CSS.
 *
 * Mismo esquema de modo que globals.css: el claro en `:root`, el oscuro por
 * preferencia del sistema salvo que se haya fijado "claro", y el oscuro
 * fijado a mano al final para ganarle a la media query.
 */
export function generarCssTema(config: ConfigTema): string {
  const tema = TEMAS_DISPONIBLES[config.preset];
  const offset = tema.sombraOffset ?? "4px";
  const bordeGrueso = `${parseFloat(tema.anchoBorde) + 1}px`;
  const sombras =
    tema.sombra === "dura"
      ? [
          `--sombra-sm:calc(${offset} - 1px) calc(${offset} - 1px) 0 var(--ink)`,
          `--sombra:${offset} ${offset} 0 var(--ink)`,
          `--sombra-lg:calc(${offset} * 2) calc(${offset} * 2) 0 var(--ink)`,
        ]
      : [
          // La sombra difusa toma su color de la tinta fuerte del tema (la
          // única tinta que es oscura en los dos modos), no de un morado fijo.
          "--sombra-sm:0 2px 6px color-mix(in srgb,var(--ink-strong) 12%,transparent)",
          "--sombra:0 4px 14px color-mix(in srgb,var(--ink-strong) 14%,transparent)",
          "--sombra-lg:0 12px 32px color-mix(in srgb,var(--ink-strong) 20%,transparent)",
        ];

  const diario = FUENTES_DIARIO[config.fuenteDiario ?? tema.fuenteDiario];
  const interfaz = FUENTES_INTERFAZ[config.fuenteInterfaz ?? tema.fuenteInterfaz];

  const forma = [
    `--borde:${tema.anchoBorde}`,
    `--borde-grueso:${bordeGrueso}`,
    `--radio:${tema.radio}`,
    ...sombras,
    `--fuente-diario:var(${diario.variable}),${diario.respaldo}`,
    `--fuente-interfaz:var(${interfaz.variable}),${interfaz.respaldo}`,
    // Letras elegidas a mano: también las siguen los rótulos y los títulos
    // que cada tema dibuja con una letra propia (el pixel de las etiquetas,
    // el cromo de Void, el LCD de Softsignal). Sin elección, cada tema usa
    // las suyas — por eso estas dos variables solo existen si se eligió.
    ...(config.fuenteInterfaz ? [`--fuente-rotulo:var(${interfaz.variable}),${interfaz.respaldo}`] : []),
    ...(config.fuenteDiario ? [`--fuente-titulo:var(${diario.variable}),${diario.respaldo}`] : []),
  ].join(";");

  const paletaClaro = paletaEfectiva(config, "claro");
  const paletaOscuro = paletaEfectiva(config, "oscuro");
  const claro = declaraciones(variablesPaleta(paletaClaro));
  const oscuro = declaraciones(variablesPaleta(paletaOscuro));

  // Variables propias de los temas con hoja de estilos (Softsignal, Void).
  // `temas.css` las define sobre el envoltorio `[data-tema]`, así que acá se
  // pisan sobre ese mismo elemento, con el atributo repetido para ganarle en
  // especificidad a la regla del mismo modo sin tocar la del otro.
  const yo = `[data-tema="${config.preset}"][data-tema="${config.preset}"]`;
  const propiasClaro = declaraciones(variablesPropiasTema(config.preset, "claro", paletaClaro));
  const propiasOscuro = declaraciones(variablesPropiasTema(config.preset, "oscuro", paletaOscuro));

  let cursor = "";
  if (config.cursor?.tipo === "preset") {
    const { archivo, punto } = CURSORES[config.cursor.id];
    cursor = `body{cursor:url("${archivo}") ${punto[0]} ${punto[1]},auto}`;
  } else if (config.cursor?.tipo === "propio") {
    cursor = `body{cursor:url("${config.cursor.imagen}") ${PUNTO_CURSOR_PROPIO[0]} ${PUNTO_CURSOR_PROPIO[1]},auto}`;
  }

  return [
    `:root{${forma};${claro}}`,
    `@media (prefers-color-scheme: dark){:root:not([data-modo="claro"]){${oscuro}}}`,
    `:root[data-modo="oscuro"]{${oscuro}}`,
    propiasClaro ? `${yo}{${propiasClaro}}` : "",
    propiasOscuro
      ? `@media (prefers-color-scheme: dark){:root:not([data-modo="claro"]) ${yo}{${propiasOscuro}}}` +
        `:root[data-modo="oscuro"] ${yo}{${propiasOscuro}}`
      : "",
    cursor,
  ].join("");
}
