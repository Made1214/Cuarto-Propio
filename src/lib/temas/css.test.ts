import { describe, expect, it } from "vitest";
import { CONFIG_POR_DEFECTO } from "./config";
import { generarCssTema } from "./css";

describe("generarCssTema: cursor", () => {
  const config = { ...CONFIG_POR_DEFECTO, cursor: { tipo: "preset" as const, id: "corazon" as const } };

  it("aplica el cursor también sobre enlaces y botones", () => {
    const css = generarCssTema(config);
    expect(css).toContain('body{cursor:url("/cursores/corazon.png") 14 12,auto}');
    expect(css).toMatch(/body :is\(a,button,[^)]*\):not\([^)]*\)\{cursor:url\("\/cursores\/corazon\.png"\) 14 12,pointer\}/);
  });

  it("solo se aplica con mouse o trackpad, no en táctil", () => {
    const css = generarCssTema(config);
    const desde = css.indexOf("@media (any-pointer: fine) and (hover: hover){");
    expect(desde).toBeGreaterThan(-1);
    // Todo `cursor:` queda dentro de esa media query.
    expect(css.indexOf("cursor:")).toBeGreaterThan(desde);
    expect(css.slice(0, desde)).not.toContain("cursor:");
  });

  it("con alcance, todo queda colgado de ese selector", () => {
    const css = generarCssTema(config, ".muestra");
    expect(css).toContain('.muestra{cursor:url(');
    expect(css).toContain(".muestra :is(a,button");
    expect(css).not.toContain("body");
  });

  it("sin cursor elegido no agrega reglas de cursor", () => {
    expect(generarCssTema(CONFIG_POR_DEFECTO)).not.toContain("cursor:");
  });
});
