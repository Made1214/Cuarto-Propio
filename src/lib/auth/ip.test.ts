import { describe, expect, it } from "vitest";
import { IP_DESCONOCIDA, ipCliente } from "./ip";

const con = (valores: Record<string, string>) => new Headers(valores);

describe("ipCliente", () => {
  it("toma el primer valor de x-forwarded-for", () => {
    expect(ipCliente(con({ "x-forwarded-for": "203.0.113.7, 10.0.0.1, 10.0.0.2" }))).toBe("203.0.113.7");
    expect(ipCliente(con({ "x-forwarded-for": "  2001:DB8::1 " }))).toBe("2001:db8::1");
  });

  it("usa x-real-ip si no hay x-forwarded-for o no sirve", () => {
    expect(ipCliente(con({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
    expect(ipCliente(con({ "x-forwarded-for": "basura<script>", "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
  });

  it("cae en el valor fijo sin encabezados o con valores que no son IP", () => {
    expect(ipCliente(con({}))).toBe(IP_DESCONOCIDA);
    expect(ipCliente(con({ "x-forwarded-for": "" }))).toBe(IP_DESCONOCIDA);
    expect(ipCliente(con({ "x-forwarded-for": "1".repeat(46) }))).toBe(IP_DESCONOCIDA);
    expect(ipCliente(con({ "x-real-ip": "no es ip" }))).toBe(IP_DESCONOCIDA);
  });
});
