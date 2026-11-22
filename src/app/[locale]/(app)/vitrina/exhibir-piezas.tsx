"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { VentanaDialogo } from "@/components/ventana-dialogo";
import { useRouter } from "@/i18n/navigation";
import {
  DESCRIPCION_MAXIMA,
  FORMATOS_ACEPTADOS,
  TAMANO_MAXIMO_BYTES,
  TAMANO_MAXIMO_ORIGINAL_BYTES,
  TITULO_MAXIMO,
} from "@/lib/imagenes/limites";
import { reducirImagen } from "@/lib/imagenes/reducir";
import { IconoCerrar, IconoReintentar, IconoSubir } from "./iconos";

type CodigoError = "formato" | "tamano" | "sesion" | "fallo";

type Pieza = {
  id: string;
  archivo: File;
  /** La versión achicada en el navegador, la que de verdad se sube. Se
   * guarda para que un reintento no vuelva a reducir la misma foto. */
  reducido?: File;
  /** URL local (`blob:`) para verla mientras se la describe, antes de que
   * exista en el servidor. */
  vistaPrevia: string;
  titulo: string;
  descripcion: string;
  hashtags: string;
  estado: "borrador" | "subiendo" | "exhibida" | "error";
  progreso: number;
  error?: CodigoError;
};

/** Sube con XMLHttpRequest y no con `fetch` por una sola razón: `fetch` no
 * avisa cuánto se subió. Una foto de 8MB sin barra se siente colgada. */
function enviar(
  pieza: Pieza,
  archivo: File,
  onProgreso: (porcentaje: number) => void,
): Promise<{ codigo?: string; error?: CodigoError }> {
  return new Promise((resolver) => {
    const peticion = new XMLHttpRequest();
    peticion.open("POST", "/api/imagenes");

    peticion.upload.onprogress = (evento) => {
      if (evento.lengthComputable) {
        onProgreso(Math.round((evento.loaded / evento.total) * 100));
      }
    };

    peticion.onload = () => {
      let datos: { codigo?: string; error?: CodigoError } = {};
      try {
        datos = JSON.parse(peticion.responseText);
      } catch {
        // Respuesta que no es JSON: cae en el error genérico de abajo.
      }
      resolver(
        peticion.status >= 200 && peticion.status < 300 && datos.codigo
          ? { codigo: datos.codigo }
          : { error: datos.error ?? "fallo" },
      );
    };

    peticion.onerror = () => resolver({ error: "fallo" });

    const cuerpo = new FormData();
    cuerpo.append("archivo", archivo);
    cuerpo.append("titulo", pieza.titulo);
    cuerpo.append("descripcion", pieza.descripcion);
    cuerpo.append("hashtags", pieza.hashtags);
    peticion.send(cuerpo);
  });
}

/**
 * Exhibir piezas: se eligen las fotos, se describen y recién entonces
 * suben. Los datos se piden antes y no después porque una pieza que ya
 * está colgada en la pared rara vez se vuelve a describir — y porque así
 * ninguna nace sin título, que es lo único que la cuadrícula muestra.
 *
 * Suben de a una, en fila: si se corta internet en la tercera, las dos
 * primeras ya están y esa se reintenta sola, sin volver a mandar las demás
 * (CLAUDE.md → Confiabilidad).
 */
export function ExhibirPiezas() {
  const t = useTranslations("vitrina");
  const tDialogos = useTranslations("dialogos");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [piezas, setPiezas] = useState<Pieza[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const huboExito = useRef(false);

  function actualizar(id: string, cambios: Partial<Pieza>) {
    setPiezas((previas) =>
      previas.map((pieza) => (pieza.id === id ? { ...pieza, ...cambios } : pieza)),
    );
  }

  function elegir(archivos: FileList | null) {
    if (!archivos || archivos.length === 0) return;
    const nuevas: Pieza[] = Array.from(archivos).map((archivo) => ({
      id: `${archivo.name}-${archivo.lastModified}-${crypto.randomUUID()}`,
      archivo,
      vistaPrevia: URL.createObjectURL(archivo),
      // El nombre del archivo como punto de partida: casi siempre hay que
      // cambiarlo, pero es más rápido corregir que escribir desde cero.
      titulo: archivo.name.replace(/\.[^.]+$/, "").slice(0, TITULO_MAXIMO),
      descripcion: "",
      hashtags: "",
      // Acá solo se descarta un original absurdo: lo normal (una foto de
      // celular de 3–12 MB) se reduce antes de subir, y el tope del servidor
      // se compara con eso, no con el original.
      estado: archivo.size > TAMANO_MAXIMO_ORIGINAL_BYTES ? "error" : "borrador",
      error: archivo.size > TAMANO_MAXIMO_ORIGINAL_BYTES ? "tamano" : undefined,
      progreso: 0,
    }));

    setPiezas((previas) => [...previas, ...nuevas]);
    setAviso(null);
    setAbierto(true);
  }

  function quitar(id: string) {
    setPiezas((previas) => {
      const pieza = previas.find((otra) => otra.id === id);
      if (pieza) URL.revokeObjectURL(pieza.vistaPrevia);
      const quedan = previas.filter((otra) => otra.id !== id);
      if (quedan.length === 0) setAbierto(false);
      return quedan;
    });
  }

  // La cola vigente, para poder soltar las vistas previas desde dentro de
  // un ciclo de subida sin depender de la copia que capturó el render.
  const piezasRef = useRef<Pieza[]>([]);
  useEffect(() => {
    piezasRef.current = piezas;
  }, [piezas]);

  const limpiar = useCallback(() => {
    for (const pieza of piezasRef.current) URL.revokeObjectURL(pieza.vistaPrevia);
    setPiezas([]);
    setAviso(null);
    setAbierto(false);
    // Si alguna llegó a exhibirse, la cuadrícula tiene que enterarse.
    if (huboExito.current) {
      huboExito.current = false;
      router.refresh();
    }
  }, [router]);

  function cerrar() {
    if (subiendo) return;
    limpiar();
  }

  const pendientes = piezas.filter(
    (pieza) => pieza.estado === "borrador" || (pieza.estado === "error" && pieza.error !== "tamano"),
  );
  const exhibidas = piezas.filter((pieza) => pieza.estado === "exhibida").length;

  async function exhibir() {
    if (pendientes.some((pieza) => !pieza.titulo.trim())) {
      setAviso(t("tituloRequerido"));
      return;
    }

    setAviso(null);
    setSubiendo(true);
    let algunaFallo = false;

    for (const pieza of pendientes) {
      actualizar(pieza.id, { estado: "subiendo", progreso: 0, error: undefined });
      // Se reduce justo antes de subir y no al elegir: así elegir diez fotos
      // no congela el diálogo, y cada una se achica mientras le toca.
      // Vercel corta las peticiones de más de 4,5 MB.
      const archivo = pieza.reducido ?? (await reducirImagen(pieza.archivo));
      if (archivo.size > TAMANO_MAXIMO_BYTES) {
        algunaFallo = true;
        actualizar(pieza.id, { estado: "error", error: "tamano" });
        continue;
      }
      actualizar(pieza.id, { reducido: archivo });
      const resultado = await enviar(pieza, archivo, (porcentaje) =>
        actualizar(pieza.id, { progreso: porcentaje }),
      );
      if (resultado.codigo) {
        huboExito.current = true;
        actualizar(pieza.id, { estado: "exhibida", progreso: 100 });
      } else {
        algunaFallo = true;
        actualizar(pieza.id, { estado: "error", error: resultado.error });
      }
    }

    setSubiendo(false);
    // Si salió todo bien se cierra sola: quedarse mirando una lista de
    // tildes no aporta nada, y lo que se quiere ver es la cuadrícula. Si
    // algo falló, el diálogo se queda con esas piezas para reintentarlas.
    if (!algunaFallo) limpiar();
  }

  function textoError(codigo: CodigoError) {
    if (codigo === "formato") return t("errorFormato");
    if (codigo === "tamano") return t("errorTamano");
    if (codigo === "sesion") return t("errorSesion");
    return t("errorFallo");
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={FORMATOS_ACEPTADOS}
        className="hidden"
        onChange={(evento) => {
          elegir(evento.target.files);
          // Se limpia para poder volver a elegir el mismo archivo después de
          // un error: sin esto el input no dispara `change` dos veces.
          evento.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="boton boton-turquesa"
      >
        <IconoSubir />
        {t("exhibir")}
      </button>

      <VentanaDialogo
        abierto={abierto}
        ancho="ancho"
        titulo={t("exhibirTitulo", { cantidad: piezas.length })}
        onCerrar={cerrar}
        etiquetaCerrar={tDialogos("cerrar")}
        acciones={
          <>
            <button
              type="button"
              onClick={cerrar}
              disabled={subiendo}
              className="boton"
            >
              {tDialogos("cancelar")}
            </button>
            <button
              type="button"
              onClick={exhibir}
              disabled={subiendo || pendientes.length === 0}
              className="boton boton-verde"
            >
              {(subiendo
                ? t("exhibiendo", { hecha: Math.min(exhibidas + 1, piezas.length), total: piezas.length })
                : t("exhibir")
              )}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {aviso ? (
            <p className="aviso">
              {aviso}
            </p>
          ) : null}

          <div className="flex flex-col gap-3">
            {piezas.map((pieza) => {
              const bloqueada = pieza.estado === "subiendo" || pieza.estado === "exhibida";
              return (
                <div
                  key={pieza.id}
                  className={`flex gap-3 border-(length:--borde) p-2 ${
                    pieza.estado === "error"
                      ? "border-ink-strong bg-primary-pink/20"
                      : "border-ink bg-background"
                  }`}
                >
                  <div className="relative w-20 shrink-0 sm:w-24">
                    {/* Vista previa local (`blob:`): next/image no tiene nada
                        que optimizar de un archivo que todavía vive en el
                        navegador. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pieza.vistaPrevia}
                      alt={pieza.archivo.name}
                      className={`aspect-square w-full border-(length:--borde) border-ink rounded-theme object-cover ${
                        pieza.estado === "error" ? "opacity-40" : ""
                      }`}
                    />

                    {pieza.estado === "subiendo" ? (
                      <div className="absolute inset-x-0 bottom-0 border-t-(length:--borde) border-ink bg-card/95 px-1 py-1">
                        <div
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={pieza.progreso}
                          aria-label={t("exhibir")}
                          className="h-2 w-full border-(length:--borde) border-ink-strong rounded-theme bg-background p-px"
                        >
                          <div
                            className={`h-full transition-[width] ${
                              pieza.progreso >= 100 ? "animate-pulse" : ""
                            }`}
                            style={{
                              width: `${pieza.progreso}%`,
                              backgroundImage:
                                "repeating-linear-gradient(90deg, var(--primary-green) 0 6px, transparent 6px 8px)",
                            }}
                          />
                        </div>
                      </div>
                    ) : null}

                    {pieza.estado === "exhibida" ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-primary-green/80">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--ink-strong)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M5 13l4.5 4.5L19 6" />
                        </svg>
                      </span>
                    ) : null}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <input
                      type="text"
                      value={pieza.titulo}
                      onChange={(evento) => actualizar(pieza.id, { titulo: evento.target.value })}
                      maxLength={TITULO_MAXIMO}
                      disabled={bloqueada}
                      required
                      aria-label={t("campoTitulo")}
                      placeholder={t("tituloPlaceholder")}
                      className="border-(length:--borde) border-ink rounded-theme bg-card px-2 py-1 font-diario text-base font-semibold outline-none disabled:opacity-60"
                    />
                    <textarea
                      rows={2}
                      value={pieza.descripcion}
                      onChange={(evento) =>
                        actualizar(pieza.id, { descripcion: evento.target.value })
                      }
                      maxLength={DESCRIPCION_MAXIMA}
                      disabled={bloqueada}
                      aria-label={t("campoDescripcion")}
                      placeholder={t("descripcionCorta")}
                      className="resize-none border-(length:--borde) border-ink rounded-theme bg-card px-2 py-1 text-xs outline-none disabled:opacity-60"
                    />
                    <input
                      type="text"
                      value={pieza.hashtags}
                      onChange={(evento) => actualizar(pieza.id, { hashtags: evento.target.value })}
                      disabled={bloqueada}
                      aria-label={t("campoHashtags")}
                      placeholder={t("hashtagsPlaceholder")}
                      className="border-(length:--borde) border-ink rounded-theme bg-card px-2 py-1 text-xs outline-none disabled:opacity-60"
                    />

                    {pieza.estado === "error" && pieza.error ? (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-ink-strong">
                        {pieza.error !== "tamano" ? <IconoReintentar /> : null}
                        {textoError(pieza.error)}
                      </p>
                    ) : null}
                  </div>

                  {!bloqueada ? (
                    <button
                      type="button"
                      onClick={() => quitar(pieza.id)}
                      aria-label={t("quitarPieza")}
                      title={t("quitarPieza")}
                      className="flex h-9 w-9 shrink-0 items-center justify-center self-start text-ink/50 transition-colors hover:bg-primary-pink/30 hover:text-ink pointer-coarse:h-11 pointer-coarse:w-11"
                    >
                      <IconoCerrar />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </VentanaDialogo>
    </>
  );
}
