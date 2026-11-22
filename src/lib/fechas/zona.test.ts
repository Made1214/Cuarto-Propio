import { describe, expect, it } from "vitest";
import { claveMes, inicioDeMes, partesEnZona, zonaValida } from "./zona";

describe("zonaValida", () => {
  it("acepta zonas IANA y rechaza lo demás", () => {
    expect(zonaValida("America/Lima")).toBe("America/Lima");
    expect(zonaValida("UTC")).toBe("UTC");
    expect(zonaValida("Marte/Olympus")).toBeUndefined();
    expect(zonaValida("")).toBeUndefined();
    expect(zonaValida(42)).toBeUndefined();
  });
});

describe("partesEnZona", () => {
  it("una entrada del 15 a las 21:30 en UTC−5 es del 15, aunque en UTC ya sea el 16", () => {
    const instante = new Date("2026-11-16T02:30:00Z");
    expect(partesEnZona(instante, "America/Lima")).toEqual({ anio: 2026, mes: 11, dia: 15 });
    expect(partesEnZona(instante, "UTC").dia).toBe(16);
  });
});

describe("claveMes", () => {
  it("agrupa por el mes de la usuaria", () => {
    const instante = new Date("2026-12-01T03:00:00Z");
    expect(claveMes(instante, "America/Lima")).toBe("2026-11");
    expect(claveMes(instante, "UTC")).toBe("2026-12");
  });
});

describe("inicioDeMes", () => {
  it("es la medianoche local del día 1", () => {
    expect(inicioDeMes(2026, 10, "America/Lima").toISOString()).toBe("2026-11-01T05:00:00.000Z");
    expect(inicioDeMes(2026, 10, "Asia/Tokyo").toISOString()).toBe("2026-10-31T15:00:00.000Z");
    expect(inicioDeMes(2026, 12, "UTC").toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("respeta el horario de verano", () => {
    // Madrid: invierno UTC+1, verano UTC+2.
    expect(inicioDeMes(2026, 0, "Europe/Madrid").toISOString()).toBe("2025-12-31T23:00:00.000Z");
    expect(inicioDeMes(2026, 6, "Europe/Madrid").toISOString()).toBe("2026-06-30T22:00:00.000Z");
  });
});
