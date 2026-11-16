# Plan de ejecución con orquestador

Cómo repartir el trabajo de lanzamiento entre agentes, con Fable como orquestador. El análisis y la evidencia están en [`lanzamiento.md`](./lanzamiento.md); las tareas para marcar, en [`pendientes.md`](./pendientes.md).

Base: `dev` en `8c74f66`. Los backups quedan aplazados hasta que haya presupuesto.

## Para arrancar el próximo chat

> Seguimos con Cuarto Propio en `dev`. Lee `CLAUDE.md`, `docs/lanzamiento.md` y `docs/orquestacion.md`. Actúa como orquestador: lanza un subagente por paquete de la ola 1, revisa cada resultado contra su criterio de "listo" y recién entonces pasa a la ola siguiente.

## Papel del orquestador

- No escribe el código de los paquetes: reparte, revisa e integra.
- Le da a cada subagente solo su paquete: archivos, criterio de "listo" y reglas del repo.
- Antes de aceptar un paquete corre `npx tsc --noEmit`, `npx eslint`, `npm test` y `npx next build`.
- Integra un paquete por vez en `dev`, con un commit por paquete.
- Actualiza `pendientes.md` al cerrar cada ola.

## Reglas que todo subagente debe recibir

- Leer la guía de `node_modules/next/dist/docs/` que corresponda antes de escribir código (pide `AGENTS.md`).
- Commits a nombre de **Made1214**, sin líneas de coautoría ni de sesión.
- Una migración aplicada no se edita: un cambio es un archivo nuevo en `supabase/migrations/`.
- Textos siempre en `es.json` y `en.json`, con las mismas claves.
- Nada de Fase 2 o 3.
- No tocar archivos fuera de su paquete. Si hace falta, avisar al orquestador.

## Ola 1 — Bloqueos (en paralelo, no comparten archivos)

### A. Audio liviano

- **Archivos:** `src/app/[locale]/(app)/audio/grabador.tsx`, `src/lib/audio/limites.ts`, `src/lib/audio/duracion.test.ts`.
- **Qué hacer:** grabar con `audioBitsPerSecond` de ~32 kbps; bajar `TAMANO_MAXIMO_BYTES` a 4 MB; ajustar el test que espera 50 MB.
- **Listo cuando:** una grabación de 10 minutos pesa menos de 4 MB (medir 30 s y extrapolar) y `npm test` pasa.

### B. Imágenes reducidas antes de subir

- **Archivos:** nuevo `src/lib/imagenes/reducir.ts`; los cuatro puntos de subida (`vitrina/exhibir-piezas.tsx`, `components/tiptap-editor.tsx`, `components/perfil/foto-perfil.tsx`, `personalizacion/editor-personalizacion.tsx`); `src/lib/imagenes/limites.ts` y `procesar.test.ts`.
- **Qué hacer:** una sola función que reduzca en el navegador a ~2560 px de lado mayor (JPEG o WebP) y que usen los cuatro puntos; bajar el tope del servidor a 4 MB. El pipeline de `sharp` no cambia.
- **Cuidado:** los cursores e iconos de Personalización pueden necesitar conservar transparencia y tamaño; no reducirlos a ciegas.
- **Listo cuando:** una foto de 12 MB se exhibe y lo que llega al servidor pesa menos de 4 MB.

### C. El diario no pierde lo escrito

- **Archivos:** `diario/entrada-form.tsx`, `src/lib/diario/actions.ts`, `src/lib/diario/borrador.ts`, textos.
- **Qué hacer:** no borrar el borrador en `onSubmit`; borrarlo al llegar a la entrada guardada. Que la acción devuelva `{ error }` si falla la base en vez de lanzar, para que el formulario siga en pantalla. Rechazar entradas sin texto con un aviso. Mostrar "Guardando…" en el botón.
- **Listo cuando:** con el servidor caído, el texto sigue en pantalla y se puede reintentar; una entrada con solo título no se guarda.

### D. Bloqueo de login seguro

- **Archivos:** nueva migración `0012_…sql`, `(auth)/login/actions.ts`.
- **Qué hacer:** contar los fallos por correo **y** dirección IP, o registrar desde el servidor con `SUPABASE_SECRET_KEY` y quitar el permiso a `anon`. La segunda opción exige que la usuaria agregue esa variable en Vercel: el orquestador debe confirmarlo con ella antes de elegirla.
- **Listo cuando:** llamar a la función sin sesión no bloquea a nadie, y 5 fallos reales siguen bloqueando 15 minutos.
- **No aplicar la migración a la base real sin permiso de la usuaria.**

## Ola 2 — Experiencia (en paralelo)

### E. Fechas en la zona horaria de la usuaria

- **Archivos:** `src/i18n/request.ts`, `src/proxy.ts` o un componente que escriba la cookie, `diario/page.tsx` (agrupado por mes).
- **Listo cuando:** una entrada del 15 a las 21:30 en UTC−5 muestra el día 15.

### F. Pantallas de entrada en celular

- **Archivos:** `diario/[codigo]/page.tsx`, `diario/[codigo]/editar/page.tsx`, `components/tiptap-editor.tsx` (solo la barra).
- **Qué hacer:** que la fila de fecha, categoría y botones se parta en dos; barra de formato pegada bajo el encabezado; `onClick` además de `onMouseDown` en los botones.
- **Depende de B**, que también toca `tiptap-editor.tsx`: lanzar después de integrar B.
- **Listo cuando:** en 360 px nada desborda, la barra sigue visible tras 40 líneas y Enter activa "Negrita".

### G. Textos y controles en Listas y Audio

- **Archivos:** `listas/lista-columna.tsx`, `listas/item-fila.tsx`, `listas/item-checkbox.tsx`, `audio/nota-audio.tsx`.
- **Qué hacer:** nombres y títulos en varias líneas; zona de toque de 44 px en casilla y agarre.
- **Listo cuando:** ningún nombre de lista ni título de audio queda cortado en 360 px.

### H. Categorías y RLS

- **Archivos:** `src/lib/categorias/resolver.ts` y su test, nueva migración con `(select auth.uid())` en las 8 políticas.
- **Listo cuando:** "Viajes" y "viajes" resuelven a la misma categoría, y el aviso `auth_rls_initplan` de Supabase desaparece tras aplicar.

### I. Grabación en celular

- **Archivos:** `audio/grabador.tsx`. **Depende de A.**
- **Qué hacer:** pedir Wake Lock mientras se graba y avisar antes de salir.

## Ola 3 — Verificación

- **J. Prueba de RLS con dos cuentas** y completar `e2e/flujo.spec.ts` con Vitrina, Audio y Personalización.
- **K. Tope de storage por cuenta** en las rutas de subida, con `uso_storage()`.

## Lo que solo puede hacer la usuaria

- Configurar un SMTP propio y las Redirect URLs en Supabase.
- Autorizar que se apliquen las migraciones nuevas a la base real.
- Agregar variables en Vercel si se elige la opción con clave secreta del paquete D.
- Probar en un iPhone y un Android.

## Aplazado

- Backups y la tarea que evita la pausa del proyecto gratuito, hasta que haya presupuesto.
