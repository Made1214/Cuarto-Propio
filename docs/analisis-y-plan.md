# Cuarto Propio — análisis del estado actual y plan para seguir

Fecha del análisis: 15 de noviembre de 2026 · rama `dev`, sobre el commit `2688e95`.

Este documento hace tres cosas: dice dónde está parado el proyecto frente a lo que pide `CLAUDE.md`, señala las áreas de mejora encontradas leyendo el código, y propone cómo seguir — con la **Personalización** desarrollada en detalle, porque es lo que diferencia a la app.

Se complementa con los otros documentos, no los reemplaza:

- `CLAUDE.md`: decisiones de producto y arquitectura.
- `docs/pendientes.md`: la lista operativa de tareas (qué probar, qué configurar). Lo que ya está ahí no se repite acá.
- `docs/base-de-datos.md`: el esquema explicado.

Alcance: es una lectura del código. No se corrieron los tests ni la app contra la base real en esta revisión.

---

## 1. Resumen

- **La Fase 1 está construida casi entera.** Los cuatro módulos de contenido, el acceso completo (crear cuenta, recuperar contraseña, bloqueo por intentos), Personalización, PWA instalable, términos y privacidad, bienvenida y aviso de espacio ya existen en `dev`.
- **Lo que falta para cerrarla no es código nuevo, es verificación y despliegue**: probar todo con datos reales, la configuración de Supabase y Vercel, y fusionar a `main`. Está detallado en `docs/pendientes.md`.
- **La Personalización funciona, pero tiene límites concretos** que se notan en cuanto se la usa a fondo: los colores propios no llegan a todas las superficies, los temas con estilo propio (Softsignal y Void) escapan en parte a lo que la usuaria elige, y las imágenes propias viajan dentro de cada página. La sección 4 los ordena en un plan.
- **La documentación quedó atrás del código** en tres puntos de `CLAUDE.md` y dos de `README.md` (sección 3.4).
- **No hay integración continua**: los 56 tests unitarios existen pero nada los corre solos.

---

## 2. Estado frente a la Fase 1

| Área | Estado | Observación |
| --- | --- | --- |
| Diario, Listas, Vitrina, Audio | Hecho | Imágenes incrustadas del diario incluidas |
| Perfil (foto, nombre, modo, idioma) | Hecho | — |
| Acceso (entrar, crear cuenta, recuperar, bloqueo) | Hecho | Los correos dependen de las Redirect URLs de Supabase |
| Personalización (tema, colores, tipografía, cursor, iconos) | Hecho | Mejoras en la sección 4 |
| Temas con nombre | 4 de 5 | Retro, Whimsical, Softsignal y Void; falta diseñar Fairy |
| PWA instalable | Hecho | Sin service worker, a propósito |
| Términos, privacidad, bienvenida, aviso de espacio | Hecho | Falta completar el correo de contacto |
| Tests unitarios | Hecho | 12 archivos, Vitest |
| Prueba de punta a punta | A medias | El script existe; los flujos con sesión no se verificaron |
| Integración continua | Falta | No hay carpeta `.github/` |
| Prueba con la base real | Falta | El pendiente más importante |
| Despliegue en Vercel | Falta | — |

---

## 3. Áreas de mejora generales

### 3.1 Nada verifica el código automáticamente

`npm test`, `eslint` y `tsc` pasan cuando alguien los corre a mano. Un flujo de GitHub Actions que los ejecute en cada push a `dev` cuesta poco y protege justo lo que más se va a tocar (estilos y temas). La prueba de punta a punta puede sumarse después, cuando exista la cuenta de prueba.

### 3.2 Valores de color que quedaron fuera del sistema de temas

- **Categorías** (`src/lib/categorias/color.ts`): 12 pasteles fijos, asignados por posición. No siguen al tema —en Void o en un tema oscuro propio pueden desentonar— y el color de una categoría se corre si se borra otra anterior.
- **Editor del diario** (`src/components/tiptap-editor.tsx`): el color de texto por defecto del selector es `#171717`, casi negro. Aplicado sobre un fondo oscuro, el texto queda ilegible.
- **Sombra suave** (`src/lib/temas/css.ts`): los temas de sombra difusa usan siempre `rgb(61 44 79 / …)`, el morado de fábrica, sin importar el modo ni los colores elegidos.

### 3.3 El tema solo existe con sesión iniciada

El tema se inyecta en el layout de `(app)`. Las pantallas de acceso, términos y privacidad se ven siempre con el tema de fábrica. Al cerrar sesión, la app "cambia de cara". No es un error —sin sesión no se sabe de quién es el tema—, pero se puede suavizar recordando el último tema en el dispositivo.

### 3.4 Documentación desalineada

En `CLAUDE.md`:

- El título "Temas de diseño (… no construir el switcher todavía)" contradice su propio párrafo "Estado real: construido".
- El párrafo de **Perfil** todavía describe una fila «Personalización · próximamente»; hoy es un enlace a `/personalizacion`.
- El **Roadmap** pone cursor, iconos y tipografía en la Fase 2, y ya están hechos. De ese renglón solo queda pendiente "temas guardables".

En `README.md`:

- El paso 4 del setup dice que el registro público no está expuesto y que la cuenta se crea a mano en Supabase.
- La sección "Estado" dice que Personalización está sin construir, y no menciona acceso, PWA ni tests.

### 3.5 Detalles menores del modelo de datos

- `temas.tipografia` es una columna de texto que guarda JSON serializado; `colores` e `iconos` ya son `jsonb`. Conviene igualarla cuando haya otra migración sobre esa tabla.
- `temas` no tiene fecha de modificación. Hará falta para los temas guardables (ordenar por último uso).

---

## 4. Plan de mejora de la Personalización

Lo que hay hoy es una buena base: un contrato de tema, valores validados antes de llegar al CSS, vista previa en vivo y aviso de contraste. Las mejoras están ordenadas por lo que más se nota al usarla.

### Etapa 1 — Que los colores propios lleguen a toda la interfaz

**Problema.** Se pueden editar seis colores (los cuatro acentos, fondo y texto). El fondo de las tarjetas y la tinta de los bordes no son editables y se quedan con el valor del preset. Si la usuaria cambia el fondo a un tono oscuro, las tarjetas siguen claras y los bordes con el color anterior.

**Propuesta.**

- Derivar automáticamente fondo de tarjeta, tinta y texto apagado a partir del fondo y el texto elegidos, en vez de sumar más selectores de color. Menos decisiones para la usuaria y un resultado siempre coherente.
- Derivar también el color de la sombra suave (3.2) y la paleta de categorías a partir del tema.
- Ampliar el aviso de contraste: hoy revisa seis combinaciones; faltan el texto sobre las tarjetas y el texto sobre los chips de categoría.
- Corregir el color por defecto del editor del diario para que use el color de texto del tema.

### Etapa 2 — Que Softsignal y Void respeten lo que la usuaria elige

**Problema.** Estos dos temas tienen hoja de estilos propia (`temas.css`, 832 líneas). Ahí hay cerca de 80 colores escritos como valores fijos y varias reglas que fijan la tipografía de títulos, rótulos y pantallas. La consecuencia probable es que, con esos temas activos, parte de los colores y letras elegidos en Personalización no se apliquen. Hay que confirmarlo en la prueba con datos reales (está prevista en `pendientes.md`).

**Propuesta.** Dos caminos posibles; hay que elegir uno:

- **A — Tokens propios del tema.** Pasar los valores fijos de `temas.css` a variables y decidir cuáles se pueden cambiar. Más trabajo, personalización completa en todos los temas.
- **B — Declararlo en la interfaz.** En Softsignal y Void, mostrar solo los controles que de verdad tienen efecto y explicar que el resto es parte del carácter del tema. Menos trabajo, expectativas claras.

Recomendación: B ahora, A solo si después de usarlos se siente la falta.

De paso: el contrato dice que un tema nuevo es "solo agregar valores", pero Softsignal y Void demuestran que los temas con carácter necesitan CSS propio. Conviene asumirlo en `CLAUDE.md` como dos niveles —tema de tokens y tema con hoja propia— antes de diseñar Fairy.

### Etapa 3 — Sacar las imágenes propias de la página

**Problema.** El cursor y los iconos subidos se guardan como texto base64 dentro de la fila del tema (hasta 60 KB cada uno, cinco imágenes posibles). Ese texto viaja incrustado en cada página de la app: el cursor dentro del `<style>` del tema y los iconos en los datos del layout. El navegador no puede guardarlos en caché.

**Propuesta.** Guardarlos en el bucket `imagenes`, carpeta `usuario_id/tema/`, y referenciarlos por URL. Se reutilizan las políticas de Storage y las firmas con caché que ya existen. La validación actual (tipo real, PNG de 32 o 64 px generado por el servidor) se conserva.

### Etapa 4 — Cursor e iconos más completos

- **Cursor.** Hoy hay un solo cursor para todo. Falta la variante "mano" sobre enlaces y botones, y poder elegir el punto de clic en un cursor propio (hoy queda fijo arriba a la izquierda, lo que no sirve para un cursor centrado como un corazón). En pantallas táctiles la sección debería avisar que solo aplica en escritorio.
- **Iconos.** Solo se personalizan los cuatro iconos de sección. Los iconos de acciones (editar, borrar, grabar, cerrar) siguen fijos. Extender el set Pixel a esos iconos daría un cambio de look completo; la subida propia puede seguir limitada a las secciones.
- **Rótulos.** La letra pixelada de rótulos y la marca (`font-pixel`, unas 50 apariciones) y las mayúsculas hechas en el código (unas 45) no dependen del tema. En Whimsical siguen saliendo en pixel y mayúsculas. Un token de "fuente de rótulo" y otro de transformación de texto lo resuelven.

### Etapa 5 — No perder lo que se armó

**Problema.** Elegir un tema con nombre descarta al instante los colores y letras propios, sin confirmación ni vuelta atrás.

**Propuesta.**

- Corto plazo: pedir confirmación cuando hay cambios propios que se van a perder, o permitir deshacer.
- Después: **temas guardables** ("guardar mi combinación" con nombre y volver a ella). La tabla `temas` ya admite varias filas por cuenta; es el ítem que queda del renglón de Fase 2.

### Etapa 6 — Continuidad fuera de la sesión

Recordar el último tema en el dispositivo (cookie con el preset y los colores) para que las pantallas de acceso y las páginas legales se vean igual que la app (3.3). El color de la barra del navegador en la PWA podría tomarse del mismo lugar.

### Etapa 7 — Fairy y los temas que vengan

Diseñar Fairy en Claude Design primero, como los anteriores. Con la etapa 2 resuelta queda claro de antemano si es un tema de tokens o uno con hoja propia.

---

## 5. Orden propuesto

| # | Bloque | Contenido | Por qué en este orden |
| --- | --- | --- | --- |
| 1 | Cerrar la Fase 1 | Prueba con base real, operativo de Supabase y Vercel, fusión a `main`, despliegue | Es lo único que separa al proyecto de estar en uso |
| 2 | Red de seguridad | CI con lint, tipos, tests y build; completar la prueba de punta a punta | Antes de volver a tocar estilos |
| 3 | Documentación | Corregir `CLAUDE.md` y `README.md` (3.4) | Diez minutos; evita que el próximo chat parta de datos viejos |
| 4 | Personalización, coherencia | Etapas 1 y 2 | Son los límites que se notan al usarla |
| 5 | Personalización, rendimiento | Etapa 3 | Importa más cuando la app esté desplegada y en el celular |
| 6 | Personalización, alcance | Etapas 4 y 5 | Mejoras, no correcciones |
| 7 | Temas | Etapas 6 y 7 | Lo más vistoso, lo menos urgente |

Recomendación sobre el corte: los bloques 1 a 3 cierran la Fase 1. Los bloques 4 y 5 conviene hacerlos después de usar la app unas semanas, cuando la prueba real confirme qué molesta de verdad —que es justo lo que `CLAUDE.md` recomienda antes de invertir en la Fase 2.

---

## 6. Después de la Fase 1

Nada de esto se construye todavía; queda anotado lo que el código ya deja preparado.

**Fase 2 — escalable**

- Temas guardables (etapa 5 de arriba).
- Multiusuario real: el modelo ya cuelga de `usuario_id` con RLS. Faltan cuotas por cuenta y límites de subida; el aviso de espacio hoy mide contra el total del plan gratuito, no por cuenta.
- Transcripción de audio: la columna `audios.transcripcion` existe y está vacía.
- Búsqueda cruzada por categoría y hashtag entre los cuatro módulos; momento de revisar la regla de una sola categoría por elemento.
- Pantalla de gestión de categorías, con color elegible por categoría.
- Exportación y backup de datos; modo offline básico.

**Fase 3 — comercial**

- Perfiles públicos: implican políticas de lectura pública y otra forma de servir los archivos publicados.
- Planes y límites por cuenta, moderación, descubrimiento.

---

## 7. Decisiones que necesito de vos

1. **Softsignal y Void** (etapa 2): ¿camino A, personalización completa, o camino B, mostrar solo lo que tiene efecto? Recomiendo B.
2. **Colores derivados** (etapa 1): ¿de acuerdo con calcular tarjetas y bordes a partir de fondo y texto, en vez de agregar más selectores?
3. **Corte de fase**: ¿los bloques 4 en adelante esperan a que hayas usado la app unas semanas, o seguimos de corrido?
4. **Documentación** (bloque 3): ¿corrijo `CLAUDE.md` y `README.md` ahora?
