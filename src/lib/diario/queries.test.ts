import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/paginacion", () => ({ paginar: vi.fn() }));

import { agregarConteos, mesValido, rangoDeMes } from "./queries";

describe("agregarConteos", () => {
  it("sin entradas todo es cero", () => {
    expect(agregarConteos([])).toEqual({ total: 0, sinCategoria: 0, porCategoria: {}, porMes: [] });
  });

  it("cuenta total, por categoría, sin categoría y por mes (nuevo a viejo)", () => {
    const r = agregarConteos([
      { fecha: "2026-11-03T10:00:00+00:00", categoria_id: "a" },
      { fecha: "2026-11-20T10:00:00+00:00", categoria_id: "a" },
      { fecha: "2026-10-31T23:59:59+00:00", categoria_id: null },
      { fecha: "2025-12-01T00:00:00+00:00", categoria_id: "b" },
    ]);
    expect(r.total).toBe(4);
    expect(r.sinCategoria).toBe(1);
    expect(r.porCategoria).toEqual({ a: 2, b: 1 });
    expect(r.porMes).toEqual([
      { mes: "2026-11", cantidad: 2 },
      { mes: "2026-10", cantidad: 1 },
      { mes: "2025-12", cantidad: 1 },
    ]);
  });

  it("agrupa el mes en UTC, sin importar el desfase del texto", () => {
    const r = agregarConteos([{ fecha: "2026-11-01T00:30:00+02:00", categoria_id: null }]);
    expect(r.porMes).toEqual([{ mes: "2026-10", cantidad: 1 }]);
  });
});

describe("mes", () => {
  it("valida la forma YYYY-MM", () => {
    expect(mesValido("2026-11")).toBe("2026-11");
    for (const malo of ["2026-13", "2026-00", "26-11", "2026-1", "x", undefined, ["2026-11"]]) {
      expect(mesValido(malo)).toBeUndefined();
    }
  });

  it("da el rango [primer día, primer día del mes siguiente) en UTC", () => {
    expect(rangoDeMes("2026-11")).toEqual({
      desde: "2026-11-01T00:00:00.000Z",
      hasta: "2026-12-01T00:00:00.000Z",
    });
    expect(rangoDeMes("2026-12")?.hasta).toBe("2027-01-01T00:00:00.000Z");
    expect(rangoDeMes("roto")).toBeNull();
  });
});
