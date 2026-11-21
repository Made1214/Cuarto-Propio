"use client";

import {
  CLASE_CHIP,
  CLASE_CHIP_ACTIVO,
  CLASE_CHIP_INACTIVO,
} from "@/components/filtro-categoria";
import type { JSONContent } from "@tiptap/core";
import { unstable_rethrow } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";
import { TiptapEditor } from "@/components/tiptap-editor";
import { colorCategoria } from "@/lib/categorias/color";
import { useValidacionNativa } from "@/lib/formularios/validacion-nativa";
import { borrarBorrador, guardarBorrador, leerBorrador, type Borrador } from "@/lib/diario/borrador";
import { contenidoVacio } from "@/lib/diario/contenido";
import type { Categoria, EntradaActionState } from "@/lib/diario/types";
import { useAvisarGuardando } from "./guardar-boton";

const TITULO_MAXIMO = 100;

type EntradaFormProps = {
  formId: string;
  /** Identifica el borrador local: el código de la entrada, o "nueva". */
  claveBorrador: string;
  action: (estadoPrevio: EntradaActionState, formData: FormData) => Promise<EntradaActionState>;
  categorias: Categoria[];
  valoresIniciales?: {
    titulo?: string | null;
    categoriaNombre?: string | null;
    contenido?: JSONContent | null;
  };
};

/**
 * No renderiza su propio botón de guardar: la página dueña lo pone en su
 * fila de acciones (junto a Eliminar, cuando aplica) usando
 * `<button form={formId}>`, para que Guardar y Eliminar vivan juntos en
 * vez de quedar uno arriba y otro perdido al fondo del formulario.
 */
export function EntradaForm({
  formId,
  claveBorrador,
  action,
  categorias,
  valoresIniciales,
}: EntradaFormProps) {
  const t = useTranslations("diario");
  const format = useFormatter();
  const [estado, enviarAction, guardando] = useActionState(enviar, undefined);
  // El globo del título vacío dice lo mismo que el aviso de la Server
  // Action (que es la que atrapa el título hecho solo de espacios).
  const validacion = useValidacionNativa({
    titulo: {
      valueMissing: t("tituloRequerido"),
      tooLong: t("tituloDemasiadoLargo", { maximo: TITULO_MAXIMO }),
    },
  });

  const tituloInicial = valoresIniciales?.titulo ?? "";
  const categoriaInicial = valoresIniciales?.categoriaNombre ?? "";
  const contenidoInicial = valoresIniciales?.contenido ?? null;

  const [titulo, setTitulo] = useState(tituloInicial);
  const [categoriaTexto, setCategoriaTexto] = useState(categoriaInicial);
  const [contenido, setContenido] = useState<JSONContent | null>(contenidoInicial);

  // Remontar el editor es la forma simple de meterle contenido restaurado:
  // Tiptap toma `contenidoInicial` al crearse, no en cada render.
  const [contenidoBase, setContenidoBase] = useState(contenidoInicial);
  const [remonte, setRemonte] = useState(0);

  const [borrador, setBorrador] = useState<Borrador | null>(null);
  /** Cuándo se guardó por última vez el borrador local: se muestra para que
   * se vea que lo escrito no se pierde aunque se cierre el navegador. */
  const [guardadoEn, setGuardadoEn] = useState<Date | null>(null);
  const enviando = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const tituloRef = useRef<HTMLTextAreaElement>(null);

  // El alto del título sigue a su texto (y al ancho, si gira la pantalla).
  useEffect(() => {
    const campo = tituloRef.current;
    if (!campo) return;
    const ajustar = () => {
      campo.style.height = "auto";
      campo.style.height = `${campo.scrollHeight}px`;
    };
    ajustar();
    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, [titulo]);

  const sucio =
    titulo !== tituloInicial ||
    categoriaTexto !== categoriaInicial ||
    JSON.stringify(contenido) !== JSON.stringify(contenidoInicial);
  // La barra de la página muestra el estado (guardando, cambios sin
  // guardar, copia local) al lado de Guardar.
  useAvisarGuardando(guardando, sucio, guardadoEn);

  /**
   * Envuelve la Server Action para que un guardado fallido nunca se lleve lo
   * escrito:
   * - El borrador local se borra solo cuando el guardado se CONFIRMÓ. La
   *   action solo redirige si la base guardó, y Next avisa esa redirección
   *   rechazando la promesa con su error de navegación: ese es el momento
   *   exacto de limpiar (y se vuelve a lanzar para que Next navegue). Borrarlo
   *   al enviar, como antes, dejaba sin red si la base fallaba.
   * - Si lo que falla es el viaje mismo (sin conexión), la promesa se rechaza
   *   con un error cualquiera: se muestra el aviso en vez de dejar que suba
   *   al límite de error, que reemplazaría la pantalla.
   */
  async function enviar(estadoPrevio: EntradaActionState, formData: FormData): Promise<EntradaActionState> {
    // Mismo chequeo que la action, antes del viaje: una entrada sin texto ni
    // imágenes no se guarda.
    if (contenidoVacio(leerContenido(formData))) return { error: t("contenidoRequerido") };

    enviando.current = true;
    try {
      const resultado = await action(estadoPrevio, formData);
      if (resultado?.error) fallo();
      return resultado;
    } catch (error) {
      try {
        unstable_rethrow(error);
      } catch {
        borrarBorrador(claveBorrador);
        throw error;
      }
      fallo();
      return { error: t("errorGuardar") };
    }
  }

  /** No se guardó: vuelve el aviso al cerrar la pestaña y el borrador local
   * queda al día (el autoguardado se pausa mientras se envía). */
  function fallo() {
    enviando.current = false;
    if (sucio) guardarBorrador(claveBorrador, { titulo, categoria: categoriaTexto, contenido });
  }

  useEffect(() => {
    // Lectura única del almacenamiento del navegador al montar: es un
    // sistema externo, no estado derivado, y solo interesa la foto inicial
    // (lo que guardemos después es nuestro, no un borrador "encontrado").
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBorrador(leerBorrador(claveBorrador));
  }, [claveBorrador]);

  useEffect(() => {
    if (!sucio) return;
    const id = window.setTimeout(() => {
      // Mientras se guarda no: si el guardado sale bien, el borrador recién
      // borrado no tiene que volver a aparecer.
      if (enviando.current) return;
      guardarBorrador(claveBorrador, { titulo, categoria: categoriaTexto, contenido });
      setGuardadoEn(new Date());
    }, 600);
    return () => window.clearTimeout(id);
  }, [sucio, claveBorrador, titulo, categoriaTexto, contenido]);

  useEffect(() => {
    if (!sucio) return;
    const avisar = (evento: BeforeUnloadEvent) => {
      if (enviando.current) return;
      evento.preventDefault();
    };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [sucio]);

  useEffect(() => {
    if (estado?.error) errorRef.current?.focus();
  }, [estado]);

  function restaurar() {
    if (!borrador) return;
    setTitulo(borrador.titulo);
    setCategoriaTexto(borrador.categoria);
    setContenido(borrador.contenido);
    setContenidoBase(borrador.contenido);
    setRemonte((valor) => valor + 1);
    setBorrador(null);
  }

  function descartar() {
    borrarBorrador(claveBorrador);
    setBorrador(null);
  }

  return (
    <form
      id={formId}
      action={enviarAction}
      {...validacion}
      className="flex flex-col gap-5"
    >
      {estado?.error ? (
        <p
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="boton boton-rosa outline-none"
        >
          {estado.error}
        </p>
      ) : null}

      {borrador ? (
        <div className="flex flex-wrap items-center gap-3 border-(length:--borde) border-dashed border-ink rounded-theme bg-secondary-turquoise/15 px-3 py-2">
          <p className="flex-1 text-sm">
            {t("borradorEncontrado", {
              fecha: format.dateTime(new Date(borrador.guardadoEn), {
                dateStyle: "short",
                timeStyle: "short",
              }),
              hace: format.relativeTime(new Date(borrador.guardadoEn)),
            })}
          </p>
          <button
            type="button"
            onClick={restaurar}
            className="flex h-10 items-center border-(length:--borde) border-ink rounded-theme bg-primary-green px-3 text-[13px] font-semibold text-ink-strong transition-[filter] hover:brightness-95"
          >
            {t("restaurarBorrador")}
          </button>
          <button
            type="button"
            onClick={descartar}
            className="flex h-10 items-center border-(length:--borde) border-ink rounded-theme bg-card px-3 text-[13px] font-semibold text-ink transition-colors hover:bg-primary-pink/30"
          >
            {t("descartarBorrador")}
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-titulo`} className="rotulo">
          {t("campoTitulo")} <span aria-hidden="true" className="text-secondary-purple">*</span>
        </label>
        {/* Un textarea de un renglón que crece: un título largo se ve
            entero mientras se escribe, como al leer la entrada (un input lo
            cortaba). Enter no hace salto de línea: el título es una línea. */}
        <textarea
          ref={tituloRef}
          id={`${formId}-titulo`}
          name="titulo"
          rows={1}
          required
          maxLength={TITULO_MAXIMO}
          value={titulo}
          onChange={(evento) => setTitulo(evento.target.value.replace(/[\r\n]+/g, " "))}
          onKeyDown={(evento) => {
            if (evento.key === "Enter") evento.preventDefault();
          }}
          enterKeyHint="next"
          placeholder={t("tituloPlaceholder")}
          // Con la misma letra y el mismo tamaño que el título al leer la
          // entrada: escribir y leer se ven como la misma página.
          className="w-full resize-none overflow-hidden border-0 border-b-(length:--borde) border-ink/30 bg-transparent px-0 py-1.5 font-diario text-2xl leading-tight font-bold text-secondary-purple outline-none placeholder:font-semibold placeholder:text-muted/45 focus:border-secondary-purple sm:text-3xl"
        />
        {titulo.length > TITULO_MAXIMO - 20 ? (
          <span className="self-end apoyo tabular-nums">
            {titulo.length}/{TITULO_MAXIMO}
          </span>
        ) : null}
      </div>

      {/* Categoría: las que ya existen como chips en un solo carril (en el
          celular se desliza de lado, en vez de apilar renglones) y el campo
          para escribir una nueva. */}
      <div className="flex flex-col gap-2">
        <label htmlFor={`${formId}-categoria`} className="rotulo">
          {t("campoCategoria")}
        </label>
        {categorias.length > 0 ? (
          <div className="fila-deslizable -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {categorias.map((cat) => {
              const seleccionada = cat.nombre === categoriaTexto;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaTexto(seleccionada ? "" : cat.nombre)}
                  aria-pressed={seleccionada}
                  className={`${CLASE_CHIP} ${seleccionada ? CLASE_CHIP_ACTIVO : CLASE_CHIP_INACTIVO}`}
                >
                  <span
                    aria-hidden="true"
                    className="punto-categoria"
                    style={{ background: colorCategoria(categorias, cat.id) }}
                  />
                  {cat.nombre}
                </button>
              );
            })}
          </div>
        ) : null}
        <input
          id={`${formId}-categoria`}
          type="text"
          name="categoria"
          value={categoriaTexto}
          onChange={(evento) => setCategoriaTexto(evento.target.value)}
          placeholder={t("categoriaPlaceholder")}
          className="h-10 w-full rounded-theme border-(length:--borde) border-ink bg-card px-3 text-sm outline-none focus:border-secondary-purple sm:w-64"
        />
      </div>

      <TiptapEditor
        key={remonte}
        name="contenido"
        barraEn={`${formId}-formato`}
        contenidoInicial={contenidoBase}
        onCambio={setContenido}
      />
    </form>
  );
}

/** El documento del editor tal como viaja en el formulario (campo oculto). */
function leerContenido(formData: FormData): JSONContent | null {
  try {
    return JSON.parse(String(formData.get("contenido") ?? "")) as JSONContent;
  } catch {
    return null;
  }
}
