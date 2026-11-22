"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { IconoSeccion } from "@/components/icono-seccion";
import { ICONO_SECCION, ICONO_SECCION_PIXEL, type RutaSeccion } from "@/components/iconos-secciones";
import { useRouter } from "@/i18n/navigation";
import { reducirImagen, type OpcionesReduccion } from "@/lib/imagenes/reducir";
import {
  elegirCursor,
  elegirPreset,
  elegirSetIconos,
  guardarColores,
  guardarTipografia,
  quitarIconoPropio,
  restablecerColores,
} from "@/lib/temas/actions";
import {
  COLORES_EDITABLES,
  RUTAS_ICONOS,
  SETS_ICONOS,
  type ColorEditable,
  type ColoresPropios,
  type ConfigTema,
} from "@/lib/temas/config";
import { revisarContraste, type ProblemaContraste } from "@/lib/temas/contraste";
import { variablesPaleta } from "@/lib/temas/css";
import { paletaDerivada, VARIABLES_TEMA, variablesPropiasTema } from "@/lib/temas/derivados";
import { CURSORES, type CursorId } from "@/lib/temas/cursores";
import { FUENTES_DIARIO, FUENTES_INTERFAZ } from "@/lib/temas/fuentes";
import { TEMAS_DISPONIBLES, TEMAS_PLANEADOS, type PresetId } from "@/lib/temas/presets";
import type { ModoColor } from "@/lib/temas/types";


// `scroll-mt`: al saltar desde el índice, la sección queda debajo de la
// barra de la app y del propio índice, que están pegados arriba.
const CLASE_SECCION =
  "flex scroll-mt-32 flex-col gap-4 border-(length:--borde) border-ink rounded-theme bg-card p-4 shadow-marco sm:p-5 md:scroll-mt-36";
const CLASE_TITULO = "font-diario text-xl font-semibold text-secondary-purple";
const CLASE_OPCION =
  "flex flex-col items-start gap-2 border-(length:--borde) border-ink rounded-theme p-2 text-left text-sm transition-colors sm:p-3";
const CLASE_OPCION_ACTIVA = "relative bg-secondary-purple/15 outline-3 outline-secondary-purple outline-offset-1";
const CLASE_BOTON =
  "flex h-10 items-center justify-center border-(length:--borde) border-ink rounded-theme px-4 text-[13px] font-semibold transition-[filter] hover:brightness-95 disabled:opacity-60";

type ErrorSubida = "formato" | "tamano" | "sesion" | "fallo";

/** Cómo se achica en el navegador un cursor o icono propio. El servidor
 * (`/api/personalizacion/imagen`) acepta hasta 2 MB y lo redibuja como PNG
 * de 32/64 px con fondo transparente, así que:
 * - lo chico (casi todo cursor o icono) va tal cual, sin tocarlo;
 * - si hay que reducir, se codifica en PNG para no perder la transparencia
 *   (nunca JPEG), a 512 px: sobra para lo que el servidor deja al final;
 * - un SVG nunca se rasteriza acá (lo resuelve `reducirImagen`). */
const REDUCCION_PROPIA: OpcionesReduccion = {
  ladoMaximo: 512,
  umbralBytes: 1024 * 1024,
  topeBytes: 2 * 1024 * 1024,
  conAlfa: true,
};

export function EditorPersonalizacion({ config }: { config: ConfigTema }) {
  const t = useTranslations("personalizacion");
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const temporizador = useRef(0);

  /** Guarda con una Server Action y vuelve a pedir la página: el layout
   * regenera el CSS del tema y el cambio se ve en toda la app. */
  function guardar(accion: () => Promise<unknown>) {
    setError(false);
    setGuardado(false);
    window.clearTimeout(temporizador.current);
    startTransition(async () => {
      try {
        await accion();
        router.refresh();
        startTransition(() => setGuardado(true));
        temporizador.current = window.setTimeout(() => setGuardado(false), 2500);
      } catch {
        startTransition(() => setError(true));
      }
    });
  }

  const secciones = ["tema", "colores", "tipografia", "cursor", "iconos"] as const;

  return (
    <div className="flex flex-col gap-5 sm:gap-6" aria-busy={pendiente}>
      {/* Índice pegado arriba: la pantalla tiene cinco bloques largos, y
          saltar a «Iconos» ya no obliga a recorrer todo lo de arriba. A la
          derecha, si el último cambio se está guardando o ya quedó. */}
      <nav
        aria-label={t("indice")}
        className="fijo-bajo-barra z-20 -mx-5 flex items-center gap-2 border-b-(length:--borde) border-ink/20 bg-background/95 px-5 py-2 backdrop-blur-sm sm:mx-0 sm:rounded-theme sm:border-(length:--borde) sm:px-2"
      >
        {/* Las cinco entran enteras, en dos renglones si hace falta: antes
            se deslizaban de lado y en el celular la última se cortaba en
            «Icon…», sin pista de que había más. */}
        <ul className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {secciones.map((seccion) => (
            <li key={seccion}>
              <a
                href={`#seccion-${seccion}`}
                className="flex h-9 shrink-0 items-center rounded-theme border-(length:--borde) border-ink/30 bg-card px-3 text-[13px] font-semibold whitespace-nowrap text-foreground transition-colors hover:border-ink hover:bg-secondary-purple/10"
              >
                {t(`indiceCorto.${seccion}`)}
              </a>
            </li>
          ))}
        </ul>
        <span aria-live="polite" className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-muted/80">
          {pendiente ? (
            <>
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary-pink motion-safe:animate-pulse" />
              {t("guardando")}
            </>
          ) : guardado ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12l5 5L20 6" />
              </svg>
              {t("guardado")}
            </>
          ) : null}
        </span>
      </nav>

      {error ? (
        <p role="alert" className="border-(length:--borde) border-ink rounded-theme bg-primary-pink px-4 py-3 text-sm text-ink-strong">
          {t("error")}
        </p>
      ) : null}

      <SeccionTema config={config} guardar={guardar} />
      <SeccionColores config={config} guardar={guardar} />
      <SeccionTipografia config={config} guardar={guardar} />
      <SeccionCursor config={config} guardar={guardar} />
      <SeccionIconos config={config} guardar={guardar} />
    </div>
  );
}

type PropsSeccion = { config: ConfigTema; guardar: (accion: () => Promise<unknown>) => void };

function SeccionTema({ config, guardar }: PropsSeccion) {
  const t = useTranslations("personalizacion");
  return (
    <section id="seccion-tema" className={CLASE_SECCION} aria-labelledby="titulo-tema">
      <div>
        <h2 id="titulo-tema" className={CLASE_TITULO}>
          {t("tema.titulo")}
        </h2>
        <p className="mt-1 text-sm text-muted/80">{t("tema.ayuda")}</p>
      </div>
      {/* Dos por fila también en el celular: de a uno, los cuatro temas
          ocupaban cuatro pantallas. */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {(Object.keys(TEMAS_DISPONIBLES) as PresetId[]).map((id) => {
          const tema = TEMAS_DISPONIBLES[id];
          const paleta = tema.colores.claro;
          const activo = config.preset === id;
          const sombra =
            tema.sombra === "dura"
              ? `${tema.sombraOffset} ${tema.sombraOffset} 0 ${paleta.tinta}`
              : "0 4px 14px rgb(61 44 79 / 0.14)";
          return (
            <button
              key={id}
              type="button"
              aria-pressed={activo}
              onClick={() => guardar(() => elegirPreset(id))}
              className={`${CLASE_OPCION} ${activo ? CLASE_OPCION_ACTIVA : "hover:bg-primary-pink/20"}`}
            >
              {/* Muestra: una tarjetita dibujada con los valores del tema. */}
              <span
                aria-hidden="true"
                className="flex w-full flex-col gap-1.5 p-2 sm:gap-2 sm:p-3"
                style={{ background: paleta.fondo, borderRadius: tema.radio }}
              >
                <span
                  className="flex h-6 items-center px-2 text-[11px] font-bold"
                  style={{ background: paleta.secundarioMorado, color: paleta.fondo, borderRadius: tema.radio }}
                >
                  Cuarto Propio
                </span>
                <span
                  className="flex flex-col gap-1 p-2"
                  style={{
                    background: paleta.fondoTarjeta,
                    border: `${tema.anchoBorde} solid ${paleta.tinta}`,
                    borderRadius: tema.radio,
                    boxShadow: sombra,
                  }}
                >
                  <span className="h-2 w-2/3" style={{ background: paleta.texto, opacity: 0.8 }} />
                  <span className="h-2 w-1/2" style={{ background: paleta.texto, opacity: 0.4 }} />
                </span>
                <span className="flex gap-1.5">
                  {[paleta.primarioVerde, paleta.primarioRosa, paleta.secundarioTurquesa].map((color) => (
                    <span
                      key={color}
                      className="h-5 flex-1"
                      style={{ background: color, border: `${tema.anchoBorde} solid ${paleta.tinta}`, borderRadius: tema.radio }}
                    />
                  ))}
                </span>
              </span>
              <span className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 font-bold">
                {tema.nombre}
                {activo ? (
                  <span className="flex items-center gap-1 rounded-theme bg-secondary-purple px-1.5 py-0.5 text-[11px] font-semibold text-background">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 12l5 5L20 6" />
                    </svg>
                    {t("activo")}
                  </span>
                ) : null}
              </span>
              <span className="line-clamp-3 text-xs leading-snug text-muted/85 sm:line-clamp-none sm:text-[13px]">{t(`tema.${id}`)}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[13px] text-muted/80">
        {t("tema.proximamente", { nombres: TEMAS_PLANEADOS.map((tema) => tema.id.charAt(0).toUpperCase() + tema.id.slice(1)).join(", ") })}
      </p>
    </section>
  );
}

/** El modo que se está viendo ahora (el fijado a mano, o el del sistema). */
function modoVisible(): ModoColor {
  const fijado = document.documentElement.dataset.modo;
  if (fijado === "claro" || fijado === "oscuro") return fijado;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
}

function SeccionColores({ config, guardar }: PropsSeccion) {
  const t = useTranslations("personalizacion");
  const [modo, setModo] = useState<ModoColor>("claro");
  const [borrador, setBorrador] = useState<ColoresPropios>({});
  const [problemas, setProblemas] = useState<ProblemaContraste[] | null>(null);
  // Elemento → variables que la vista previa le puso encima.
  const tocados = useRef(new Map<HTMLElement, Set<string>>());

  // Se editan los colores del modo que se está viendo, así la vista previa
  // en vivo (sobre toda la app) muestra exactamente lo que se guarda.
  useEffect(() => {
    const actual = modoVisible();
    // Lectura única del modo al montar (es del navegador, no de React).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModo(actual);
    setBorrador(config.colores[actual]);
  }, [config]);

  // Al salir de la pantalla sin guardar, la vista previa se deshace.
  useEffect(() => {
    const mapa = tocados.current;
    return () => {
      for (const [elemento, variables] of mapa) {
        for (const variable of variables) elemento.style.removeProperty(variable);
      }
    };
  }, []);

  // La misma cuenta que hace el servidor al guardar: los colores elegidos
  // más los que el tema deriva de ellos (tarjetas, bordes, y en Softsignal y
  // Void su carcasa, sus pantallas y sus barras).
  const paleta = paletaDerivada(config.preset, modo, borrador);

  function pintar(elemento: HTMLElement | null, variables: Record<string, string | null>) {
    if (!elemento) return;
    const puestas = tocados.current.get(elemento) ?? new Set<string>();
    tocados.current.set(elemento, puestas);
    for (const [variable, valor] of Object.entries(variables)) {
      if (valor === null) elemento.style.removeProperty(variable);
      else elemento.style.setProperty(variable, valor);
      puestas.add(variable);
    }
  }

  function cambiar(clave: ColorEditable, valor: string) {
    const siguiente = { ...borrador, [clave]: valor.toUpperCase() };
    setBorrador(siguiente);
    setProblemas(null);

    const vista = paletaDerivada(config.preset, modo, siguiente);
    pintar(document.documentElement, variablesPaleta(vista));
    // Las variables propias del tema viven en el envoltorio de la app. Las
    // que ya no dependen de un color cambiado se sueltan, para que vuelva a
    // mandar la hoja del tema.
    const propias = variablesPropiasTema(config.preset, modo, vista);
    const todas: Record<string, string | null> = {};
    for (const { variable } of VARIABLES_TEMA[config.preset] ?? []) todas[variable] = propias[variable] ?? null;
    pintar(document.querySelector<HTMLElement>("[data-tema]"), todas);
  }

  function limpiarVistaPrevia() {
    for (const [elemento, variables] of tocados.current) {
      for (const variable of variables) elemento.style.removeProperty(variable);
    }
    tocados.current.clear();
  }

  function intentarGuardar(forzar: boolean) {
    const encontrados = revisarContraste(paleta);
    if (encontrados.length > 0 && !forzar) {
      setProblemas(encontrados);
      return;
    }
    setProblemas(null);
    guardar(async () => {
      await guardarColores(modo, borrador);
      limpiarVistaPrevia();
    });
  }

  return (
    <section id="seccion-colores" className={CLASE_SECCION} aria-labelledby="titulo-colores">
      <div>
        <h2 id="titulo-colores" className={CLASE_TITULO}>
          {t("colores.titulo")}
        </h2>
        <p className="mt-1 text-sm text-muted/80">{t("colores.ayuda", { modo: t(`modo.${modo}`) })}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {COLORES_EDITABLES.map((clave) => (
          <label
            key={clave}
            className="flex items-center gap-3 border-(length:--borde) border-ink rounded-theme bg-background px-3 py-2"
          >
            <input
              type="color"
              value={paleta[clave].length === 7 ? paleta[clave] : "#000000"}
              onChange={(evento) => cambiar(clave, evento.target.value)}
              className="h-9 w-11 shrink-0 cursor-pointer border-(length:--borde) border-ink bg-transparent p-0.5"
            />
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-semibold">{t(`colores.${clave}`)}</span>
              <span className="text-xs text-muted/80">{t(`colores.${clave}Uso`)}</span>
            </span>
          </label>
        ))}
      </div>

      {problemas ? (
        <div role="alert" className="flex flex-col gap-3 border-(length:--borde) border-ink rounded-theme bg-primary-pink px-4 py-3 text-ink-strong">
          <p className="text-sm font-bold">{t("contraste.titulo")}</p>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            {problemas.map((problema) => (
              <li key={problema.clave}>
                {t(`contraste.${problema.clave}`)}{" "}
                <span className="tabular-nums">
                  ({problema.ratio.toFixed(1)}:1, {t("contraste.minimo", { minimo: problema.minimo })})
                </span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setProblemas(null)} className={`${CLASE_BOTON} bg-background text-ink`}>
              {t("contraste.revisar")}
            </button>
            <button type="button" onClick={() => intentarGuardar(true)} className={`${CLASE_BOTON} bg-card text-ink`}>
              {t("contraste.guardarIgual")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => intentarGuardar(false)} className={`${CLASE_BOTON} bg-primary-green text-ink-strong`}>
          {t("colores.guardar")}
        </button>
        <button
          type="button"
          onClick={() => {
            limpiarVistaPrevia();
            setBorrador({});
            setProblemas(null);
            guardar(() => restablecerColores(modo));
          }}
          className={`${CLASE_BOTON} bg-card text-ink`}
        >
          {t("colores.restablecer")}
        </button>
      </div>
    </section>
  );
}

function SeccionTipografia({ config, guardar }: PropsSeccion) {
  const t = useTranslations("personalizacion");
  const tema = TEMAS_DISPONIBLES[config.preset];
  const diario = config.fuenteDiario ?? tema.fuenteDiario;
  const interfaz = config.fuenteInterfaz ?? tema.fuenteInterfaz;

  return (
    <section id="seccion-tipografia" className={CLASE_SECCION} aria-labelledby="titulo-tipografia">
      <div>
        <h2 id="titulo-tipografia" className={CLASE_TITULO}>
          {t("tipografia.titulo")}
        </h2>
        <p className="mt-1 text-sm text-muted/80">{t("tipografia.ayuda")}</p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">{t("tipografia.diario")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(FUENTES_DIARIO) as (keyof typeof FUENTES_DIARIO)[]).map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={diario === id}
              onClick={() => guardar(() => guardarTipografia(id, config.fuenteInterfaz))}
              className={`${CLASE_OPCION} ${diario === id ? CLASE_OPCION_ACTIVA : "hover:bg-primary-pink/20"}`}
            >
              <span className="text-xs font-semibold text-muted/80">{FUENTES_DIARIO[id].nombre}</span>
              <span className="text-lg leading-snug" style={{ fontFamily: `var(${FUENTES_DIARIO[id].variable})` }}>
                {t("tipografia.muestraDiario")}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">{t("tipografia.interfaz")}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(FUENTES_INTERFAZ) as (keyof typeof FUENTES_INTERFAZ)[]).map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={interfaz === id}
              onClick={() => guardar(() => guardarTipografia(config.fuenteDiario, id))}
              className={`${CLASE_OPCION} ${interfaz === id ? CLASE_OPCION_ACTIVA : "hover:bg-primary-pink/20"}`}
            >
              <span className="text-xs font-semibold text-muted/80">{FUENTES_INTERFAZ[id].nombre}</span>
              <span className="text-sm" style={{ fontFamily: `var(${FUENTES_INTERFAZ[id].variable})` }}>
                {t("tipografia.muestraInterfaz")}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {config.fuenteDiario || config.fuenteInterfaz ? (
        <div>
          <button type="button" onClick={() => guardar(() => guardarTipografia(null, null))} className={`${CLASE_BOTON} bg-card text-ink`}>
            {t("tipografia.restablecer")}
          </button>
        </div>
      ) : null}
    </section>
  );
}

/** Sube un cursor o un icono propio. El servidor valida el tipo real y lo
 * reduce; acá solo se muestra el resultado o el error. */
function useSubidaImagen() {
  const router = useRouter();
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<ErrorSubida | null>(null);

  async function subir(archivo: File, campos: Record<string, string>) {
    setSubiendo(true);
    setError(null);
    try {
      const reducido = await reducirImagen(archivo, REDUCCION_PROPIA);
      // El tope se mira sobre lo reducido, que es lo que viaja.
      if (reducido.size > REDUCCION_PROPIA.topeBytes) {
        setError("tamano");
        return;
      }
      const cuerpo = new FormData();
      cuerpo.append("archivo", reducido);
      for (const [clave, valor] of Object.entries(campos)) cuerpo.append(clave, valor);
      const respuesta = await fetch("/api/personalizacion/imagen", { method: "POST", body: cuerpo });
      if (!respuesta.ok) {
        const datos = (await respuesta.json().catch(() => ({}))) as { error?: ErrorSubida };
        setError(datos.error ?? "fallo");
        return;
      }
      router.refresh();
    } catch {
      setError("fallo");
    } finally {
      setSubiendo(false);
    }
  }

  return { subir, subiendo, error };
}

function BotonSubir({
  texto,
  subiendo,
  onArchivo,
}: {
  texto: string;
  subiendo: boolean;
  onArchivo: (archivo: File) => void;
}) {
  const t = useTranslations("personalizacion");
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={subiendo}
        className={`${CLASE_BOTON} bg-secondary-turquoise text-ink-strong`}
      >
        {subiendo ? t("subiendo") : texto}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/webp,image/jpeg,image/gif,image/svg+xml"
        className="hidden"
        onChange={(evento) => {
          const archivo = evento.target.files?.[0];
          evento.target.value = "";
          if (archivo) onArchivo(archivo);
        }}
      />
    </>
  );
}

function SeccionCursor({ config, guardar }: PropsSeccion) {
  const t = useTranslations("personalizacion");
  const { subir, subiendo, error } = useSubidaImagen();
  const actual = config.cursor?.tipo === "preset" ? config.cursor.id : config.cursor?.tipo === "propio" ? "propio" : null;

  return (
    <section id="seccion-cursor" className={CLASE_SECCION} aria-labelledby="titulo-cursor">
      <div>
        <h2 id="titulo-cursor" className={CLASE_TITULO}>
          {t("cursor.titulo")}
        </h2>
        <p className="mt-1 text-sm text-muted/80">{t("cursor.ayuda")}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <button
          type="button"
          aria-pressed={actual === null}
          onClick={() => guardar(() => elegirCursor(null))}
          className={`${CLASE_OPCION} items-center ${actual === null ? CLASE_OPCION_ACTIVA : "hover:bg-primary-pink/20"}`}
        >
          <span aria-hidden="true" className="flex h-8 items-center text-xl">
            ↖
          </span>
          <span className="text-xs font-semibold">{t("cursor.sistema")}</span>
        </button>
        {(Object.keys(CURSORES) as CursorId[]).map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={actual === id}
            onClick={() => guardar(() => elegirCursor(id))}
            className={`${CLASE_OPCION} items-center ${actual === id ? CLASE_OPCION_ACTIVA : "hover:bg-primary-pink/20"}`}
            style={{ cursor: `url("${CURSORES[id].archivo}") ${CURSORES[id].punto[0]} ${CURSORES[id].punto[1]}, pointer` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={CURSORES[id].archivo} alt="" width={32} height={32} className="[image-rendering:pixelated]" />
            <span className="text-xs font-semibold">{t(`cursor.${id}`)}</span>
          </button>
        ))}
        {config.cursor?.tipo === "propio" ? (
          <span className={`${CLASE_OPCION} items-center ${CLASE_OPCION_ACTIVA}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.cursor.imagen} alt="" width={32} height={32} />
            <span className="text-xs font-semibold">{t("cursor.propio")}</span>
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <BotonSubir texto={t("cursor.subir")} subiendo={subiendo} onArchivo={(archivo) => void subir(archivo, { tipo: "cursor" })} />
        <span className="text-xs text-muted/80">{t("cursor.formatos")}</span>
      </div>
      {error ? <AvisoSubida codigo={error} /> : null}
    </section>
  );
}

function SeccionIconos({ config, guardar }: PropsSeccion) {
  const t = useTranslations("personalizacion");
  const { subir, subiendo, error } = useSubidaImagen();

  return (
    <section id="seccion-iconos" className={CLASE_SECCION} aria-labelledby="titulo-iconos">
      <div>
        <h2 id="titulo-iconos" className={CLASE_TITULO}>
          {t("iconos.titulo")}
        </h2>
        <p className="mt-1 text-sm text-muted/80">{t("iconos.ayuda")}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {SETS_ICONOS.map((set) => {
          const dibujos = set === "pixel" ? ICONO_SECCION_PIXEL : ICONO_SECCION;
          const activo = config.iconos.set === set;
          return (
            <button
              key={set}
              type="button"
              aria-pressed={activo}
              onClick={() => guardar(() => elegirSetIconos(set))}
              className={`${CLASE_OPCION} ${activo ? CLASE_OPCION_ACTIVA : "hover:bg-primary-pink/20"}`}
            >
              <span aria-hidden="true" className="flex gap-3 text-ink">
                {RUTAS_ICONOS.map((ruta) => {
                  const Dibujo = dibujos[ruta];
                  return <Dibujo key={ruta} tamano={24} />;
                })}
              </span>
              <span className="font-bold">{t(`iconos.${set}`)}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">{t("iconos.propios")}</p>
        <ul className="flex flex-col divide-y divide-ink/15">
          {RUTAS_ICONOS.map((ruta) => (
            <FilaIconoPropio
              key={ruta}
              ruta={ruta}
              tienePropio={Boolean(config.iconos.propios[ruta])}
              subiendo={subiendo}
              onSubir={(archivo) => void subir(archivo, { tipo: "icono", ruta })}
              onQuitar={() => guardar(() => quitarIconoPropio(ruta))}
            />
          ))}
        </ul>
      </div>
      {error ? <AvisoSubida codigo={error} /> : null}
    </section>
  );
}

function FilaIconoPropio({
  ruta,
  tienePropio,
  subiendo,
  onSubir,
  onQuitar,
}: {
  ruta: RutaSeccion;
  tienePropio: boolean;
  subiendo: boolean;
  onSubir: (archivo: File) => void;
  onQuitar: () => void;
}) {
  const t = useTranslations("personalizacion");
  const tNav = useTranslations("nav");
  const clave = ruta.slice(1) as "diario" | "listas" | "vitrina" | "audio";
  return (
    <li className="flex flex-wrap items-center gap-3 py-2.5">
      <span className="flex h-10 w-10 items-center justify-center border-(length:--borde) border-ink rounded-theme bg-background text-ink">
        <IconoSeccion ruta={ruta} tamano={24} />
      </span>
      <span className="min-w-24 flex-1 text-sm font-semibold">{tNav(clave)}</span>
      <BotonSubir texto={tienePropio ? t("iconos.cambiar") : t("iconos.subir")} subiendo={subiendo} onArchivo={onSubir} />
      {tienePropio ? (
        <button type="button" onClick={onQuitar} className={`${CLASE_BOTON} bg-card text-ink`}>
          {t("iconos.quitar")}
        </button>
      ) : null}
    </li>
  );
}

function AvisoSubida({ codigo }: { codigo: ErrorSubida }) {
  const t = useTranslations("personalizacion");
  return (
    <p role="alert" className="border-(length:--borde) border-ink rounded-theme bg-primary-pink px-3 py-2 text-sm text-ink-strong">
      {t(`errorSubida.${codigo}`)}
    </p>
  );
}
