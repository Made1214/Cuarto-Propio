import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { colorCategoria } from "@/lib/categorias/color";
import type { Categoria } from "@/lib/categorias/types";
import type { ConteosDiario } from "@/lib/diario/queries";

/** Valor de `?categoria=` para "entradas sin categoría". */
export const SIN_CATEGORIA = "ninguna";

type Filtros = { q?: string; categoria?: string; mes?: string };

const BASE =
  "tema-chip flex h-10 items-center gap-2.5 border-(length:--borde) border-transparent rounded-theme px-3 text-sm transition-colors";
const ACTIVO = "tema-chip-activo border-ink bg-secondary-purple font-semibold text-background";
const INACTIVO = "font-medium text-ink hover:bg-primary-pink/30";

/**
 * La columna de filtros del Diario en escritorio (`lg`): el buscador, las
 * categorías con su conteo y los meses con entradas. Por debajo de `lg` solo
 * se ve el buscador (los chips de categoría ocupan su lugar).
 *
 * Son enlaces comunes: tocar el filtro vigente lo apaga, y los otros filtros
 * (y la búsqueda) se conservan. Nunca viaja `hasta`: cambiar de filtro vuelve
 * a la primera tanda.
 */
export function ColumnaFiltros({
  buscador,
  categorias,
  conteos,
  actuales,
}: {
  /** El `<Buscador>` ya armado: una sola instancia en el DOM. */
  buscador: React.ReactNode;
  categorias: Categoria[];
  conteos: ConteosDiario;
  /** Filtros vigentes, ya validados en el servidor. */
  actuales: Filtros;
}) {
  const t = useTranslations("diario");
  const format = useFormatter();

  const href = (cambio: Partial<Filtros>) => {
    const query: Record<string, string> = {};
    const siguiente = { ...actuales, ...cambio };
    if (siguiente.q) query.q = siguiente.q;
    if (siguiente.categoria) query.categoria = siguiente.categoria;
    if (siguiente.mes) query.mes = siguiente.mes;
    return { pathname: "/diario", query };
  };

  const items = [
    ...categorias.map((cat) => ({
        clave: cat.id,
        valor: cat.id,
        nombre: cat.nombre,
        cantidad: conteos.porCategoria[cat.id] ?? 0,
        color: colorCategoria(categorias, cat.id),
      })),
    ...(conteos.sinCategoria > 0
      ? [{ clave: SIN_CATEGORIA, valor: SIN_CATEGORIA, nombre: t("sinCategoria"), cantidad: conteos.sinCategoria, color: null }]
      : []),
  ];

  return (
    <aside aria-label={t("filtros")} className="flex flex-col gap-6 lg:sticky lg:top-24 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start">
      {buscador}

      <nav aria-labelledby="diario-categorias" className="hidden flex-col gap-2 lg:flex">
        <h2 id="diario-categorias" className="rotulo">
          {t("categorias")}
        </h2>
        <ul className="flex flex-col gap-1">
          <li>
            <Link
              href={href({ categoria: undefined })}
              aria-current={actuales.categoria ? undefined : "true"}
              className={`${BASE} ${actuales.categoria ? INACTIVO : ACTIVO}`}
            >
              <span className="min-w-0 flex-1 truncate">{t("todasEntradas")}</span>
              <span className="text-xs tabular-nums opacity-75">{conteos.total}</span>
            </Link>
          </li>
          {items.map((item) => {
            const activo = actuales.categoria === item.valor;
            return (
              <li key={item.clave}>
                <Link
                  href={href({ categoria: activo ? undefined : item.valor })}
                  aria-current={activo ? "true" : undefined}
                  className={`${BASE} ${activo ? ACTIVO : INACTIVO}`}
                >
                  {item.color ? (
                    <span aria-hidden="true" className="punto-categoria" style={{ background: item.color }} />
                  ) : (
                    <span aria-hidden="true" className="punto-categoria border-dashed bg-transparent" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{item.nombre}</span>
                  <span className="text-xs tabular-nums opacity-75">{item.cantidad}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {conteos.porMes.length > 0 ? (
        <nav aria-labelledby="diario-por-mes" className="hidden flex-col gap-2 lg:flex">
          <h2 id="diario-por-mes" className="rotulo">
            {t("porMes")}
          </h2>
          <ul className="flex flex-col gap-1">
            {conteos.porMes.map(({ mes, cantidad }) => {
              const activo = actuales.mes === mes;
              const [anio, numero] = mes.split("-").map(Number);
              return (
                <li key={mes}>
                  <Link
                    href={href({ mes: activo ? undefined : mes })}
                    aria-current={activo ? "true" : undefined}
                    className={`${BASE} ${activo ? ACTIVO : INACTIVO}`}
                  >
                    <span className="min-w-0 flex-1 truncate first-letter:uppercase">
                      {format.dateTime(new Date(Date.UTC(anio, numero - 1, 1)), {
                        month: "long",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                    </span>
                    <span className="text-xs tabular-nums opacity-75">{cantidad}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </aside>
  );
}
