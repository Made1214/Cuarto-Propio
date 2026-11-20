import type { FormEvent } from "react";
import { useTranslations } from "next-intl";

type Campo = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** Los motivos de la validación nativa que pueden llevar un texto propio
 * por campo. Los demás (rango, paso, entrada ilegible) caen en el genérico. */
type Motivo = "valueMissing" | "tooLong" | "tooShort" | "typeMismatch" | "patternMismatch";

/** Textos propios por `name` del campo, para que el globo diga lo mismo que
 * la Server Action cuando las dos validan la misma regla. */
export type MensajesPorCampo = Record<string, Partial<Record<Motivo, string>>>;

function esCampo(objetivo: EventTarget): objetivo is Campo {
  return (
    objetivo instanceof HTMLInputElement ||
    objetivo instanceof HTMLTextAreaElement ||
    objetivo instanceof HTMLSelectElement
  );
}

/**
 * Traduce los globos de validación del navegador (`required`, `maxLength`,
 * `type="email"`, `pattern`…) al idioma de la interfaz. Sin esto el globo
 * sale en el idioma del navegador — "Please fill out this field" en plena
 * interfaz en español —, mientras que el mismo error detectado por la
 * Server Action sí sale traducido.
 *
 * Se esparce sobre el `<form>`, no sobre cada campo: el `onInvalid` de React,
 * a diferencia del evento nativo, burbujea, así que un solo par de handlers
 * cubre todos los campos del formulario, incluidos los que se agreguen
 * después. La validación nativa sigue intacta (`required` y compañía
 * siguen bloqueando el envío); solo cambia el texto del globo.
 */
export function useValidacionNativa(mensajesPorCampo: MensajesPorCampo = {}) {
  const t = useTranslations("validacion");

  function mensajePara(campo: Campo): string {
    const propios = mensajesPorCampo[campo.name] ?? {};
    const validez = campo.validity;

    if (validez.valueMissing) return propios.valueMissing ?? t("requerido");
    if (validez.tooLong) {
      const maximo = "maxLength" in campo ? campo.maxLength : 0;
      return propios.tooLong ?? t("demasiadoLargo", { maximo });
    }
    if (validez.tooShort) {
      const minimo = "minLength" in campo ? campo.minLength : 0;
      return propios.tooShort ?? t("demasiadoCorto", { minimo });
    }
    if (validez.typeMismatch) {
      if (propios.typeMismatch) return propios.typeMismatch;
      if (campo.type === "email") return t("email");
      if (campo.type === "url") return t("url");
      return t("formato");
    }
    if (validez.patternMismatch) {
      // El `title` es donde HTML espera que se explique un `pattern`.
      return propios.patternMismatch ?? (campo.title || t("formato"));
    }
    return t("valorInvalido");
  }

  return {
    onInvalid(evento: FormEvent<HTMLFormElement>) {
      const campo = evento.target;
      if (!esCampo(campo)) return;
      // Primero se borra el texto anterior: con un error propio puesto, la
      // `validity` del campo solo dice `customError` y esconde el motivo real.
      campo.setCustomValidity("");
      if (campo.validity.valid) return;
      campo.setCustomValidity(mensajePara(campo));
    },
    onInput(evento: FormEvent<HTMLFormElement>) {
      // Un error propio deja al campo inválido hasta que se lo borre: si no
      // se suelta al escribir, el formulario no se podría enviar nunca más.
      // El navegador vuelve a validar (y a disparar `invalid`) al enviar.
      const campo = evento.target;
      if (esCampo(campo)) campo.setCustomValidity("");
    },
  };
}
