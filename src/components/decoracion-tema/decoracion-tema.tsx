import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatearDuracion } from "@/lib/audio/duracion";
import type { PresetId } from "@/lib/temas/presets";
import { obtenerResumenCuarto, type ResumenCuarto } from "@/lib/temas/resumen";
import { CalendarioMes, Reloj } from "./reloj";

/**
 * La decoración propia de los temas Softsignal y Void: paneles a los costados
 * del contenido (y, en Void, una barra de tareas abajo), como los "widgets"
 * de una página personal de los 2000.
 *
 * No es adorno inventado: muestran datos reales del cuarto (cuántas entradas,
 * piezas, notas y listas hay; la última nota de audio, que lleva a Audio) y
 * la fecha y hora del dispositivo. Solo aparecen en pantallas muy anchas
 * (`2xl`), donde sobra lugar a los costados; en el celular y en laptops
 * queda la columna central sola. Los estilos viven en `temas.css`.
 */
export async function DecoracionTema({ preset, locale }: { preset: PresetId; locale: string }) {
  if (preset !== "softsignal" && preset !== "void") return null;

  const [resumen, t] = await Promise.all([
    obtenerResumenCuarto(),
    getTranslations({ locale, namespace: "decoracion" }),
  ]);
  const dias = t.raw("dias") as string[];

  return preset === "softsignal" ? (
    <DecoracionSoftsignal resumen={resumen} t={t} dias={dias} />
  ) : (
    <DecoracionVoid resumen={resumen} t={t} />
  );
}

type T = Awaited<ReturnType<typeof getTranslations<"decoracion">>>;

function UltimaNota({ resumen, t, clase }: { resumen: ResumenCuarto; t: T; clase: string }) {
  const nota = resumen.ultimaNota;
  return (
    <Link href="/audio" className={clase}>
      <span className="dec-nota-titulo">{nota ? nota.titulo || t("notaSinTitulo") : t("sinNotas")}</span>
      <span className="dec-ondas" aria-hidden="true">
        {[40, 80, 55, 100, 30, 70, 45, 90, 60].map((alto, i) => (
          <span key={i} style={{ height: `${alto}%` }} />
        ))}
      </span>
      <span className="dec-nota-meta">
        {nota?.duracion ? formatearDuracion(nota.duracion) : "--:--"} · {t("audio")}
      </span>
    </Link>
  );
}

function Conteos({ resumen, t, clase }: { resumen: ResumenCuarto; t: T; clase: string }) {
  return (
    <dl className={clase}>
      {(
        [
          ["entradas", resumen.entradas],
          ["piezas", resumen.piezas],
          ["notas", resumen.notas],
          ["listas", resumen.listas],
        ] as const
      ).map(([clave, valor]) => (
        <div key={clave} className="contents">
          <dt>{t(clave)}</dt>
          <dd>{String(valor).padStart(3, "0")}</dd>
        </div>
      ))}
    </dl>
  );
}

function DecoracionSoftsignal({ resumen, t, dias }: { resumen: ResumenCuarto; t: T; dias: string[] }) {
  return (
    <>
      <aside aria-label={t("panelIzquierdo")} className="dec-lado dec-izquierda">
        <span className="dec-ss-asa" aria-hidden="true" />
        <div className="dec-ss-aparato dec-ss-colgante">
          <div className="dec-ss-lcd dec-ss-senal">
            <span>{t("senal")}</span>
            <svg width="100%" height="44" viewBox="0 0 120 50" preserveAspectRatio="none" aria-hidden="true">
              <path
                d="M0 25 C10 5 20 5 30 25 S50 45 60 25 S80 5 90 25 S110 45 120 25"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <span className="dec-tenue">
              {String(resumen.entradas).padStart(3, "0")} · {t("entradas")}
            </span>
          </div>
          <span className="dec-rotulo dec-centro">{t("frecuencia")}</span>
        </div>
        <div className="dec-ss-aparato">
          <CalendarioMes etiquetaDias={dias} />
        </div>
      </aside>

      <aside aria-label={t("panelDerecho")} className="dec-lado dec-derecha">
        <div className="dec-ss-aparato">
          <span className="dec-rotulo">{t("ahoraSuena")}</span>
          <UltimaNota resumen={resumen} t={t} clase="dec-ss-lcd dec-nota" />
        </div>
        <div className="dec-ss-aparato">
          <span className="dec-rotulo">{t("tuCuarto")}</span>
          <Conteos resumen={resumen} t={t} clase="dec-ss-lcd dec-conteos" />
        </div>
        <span className="dec-ss-sticker" aria-hidden="true">
          {t("archivo")} ✱
        </span>
      </aside>
    </>
  );
}

function DecoracionVoid({ resumen, t }: { resumen: ResumenCuarto; t: T }) {
  return (
    <>
      <aside aria-label={t("panelIzquierdo")} className="dec-lado dec-izquierda">
        <div className="dec-vd-ventana">
          <div className="dec-vd-barra">
            <span>{t("estado")}</span>
          </div>
          <div className="dec-vd-cuerpo dec-vd-estado">
            <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21s-8-5.5-8-11a5 5 0 0 1 8-3.5A5 5 0 0 1 20 10c0 5.5-8 11-8 11z" fill="currentColor" />
            </svg>
            <span>{t("escribiendo")}</span>
          </div>
        </div>
        <div className="dec-vd-ventana">
          <div className="dec-vd-barra">
            <span>{t("tuCuarto")}</span>
          </div>
          <div className="dec-vd-cuerpo">
            <span className="dec-vd-digital">{String(resumen.entradas).padStart(6, "0")}</span>
            <Conteos resumen={resumen} t={t} clase="dec-conteos dec-vd-conteos" />
          </div>
        </div>
        <span className="dec-vd-cromo" aria-hidden="true">
          {t("brillo")}
        </span>
      </aside>

      <aside aria-label={t("panelDerecho")} className="dec-lado dec-derecha">
        <div className="dec-vd-ventana">
          <div className="dec-vd-barra">
            <span>{t("ahoraSuena")}</span>
          </div>
          <UltimaNota resumen={resumen} t={t} clase="dec-vd-cuerpo dec-nota dec-vd-reproductor" />
        </div>
        <span className="dec-vd-cromo dec-vd-cromo-chico" aria-hidden="true">
          {t("angel")}
        </span>
      </aside>

      <nav aria-label={t("barraTareas")} className="dec-vd-tareas">
        <Link href="/diario" className="dec-vd-inicio">
          ✦ {t("inicio")}
        </Link>
        <Link href="/diario">diario.txt</Link>
        <Link href="/listas">listas.doc</Link>
        <Link href="/vitrina">vitrina.exe</Link>
        <Link href="/audio">audio.wav</Link>
        <Reloj className="dec-vd-reloj" />
      </nav>
    </>
  );
}
