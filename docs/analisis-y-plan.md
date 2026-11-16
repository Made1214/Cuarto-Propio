# Cuarto Propio — análisis del estado actual y plan para seguir

Fecha del análisis: 15 de noviembre de 2026 · rama `dev`. Tercera versión: suma la integración continua, los colores de categoría según el tema (etapa B) y una revisión de las tres fases (sección 7).

Este documento hace tres cosas: dice dónde está parado el proyecto frente a lo que pide `CLAUDE.md`, señala las áreas de mejora encontradas leyendo el código, y propone cómo seguir — con la **Personalización** desarrollada en detalle, porque es lo que diferencia a la app.

Se complementa con los otros documentos, no los reemplaza:

- `CLAUDE.md`: decisiones de producto y arquitectura.
- `docs/pendientes.md`: la lista operativa de tareas (qué probar, qué configurar). Lo que ya está ahí no se repite acá.
- `docs/base-de-datos.md`: el esquema explicado.

Alcance: lectura del código, más `npm test` (78 tests), `tsc`, `eslint` y `next build`, que pasan. **No se probó en pantalla ni contra la base real**: lo construido en esta vuelta está verificado por tests, no a ojo.

---

## 1. Resumen

- **La Fase 1 está construida casi entera.** Los cuatro módulos de contenido, el acceso completo, Personalización, PWA instalable, términos y privacidad, bienvenida y aviso de espacio ya existen en `dev`.
- **Lo que falta para cerrarla es verificación y despliegue**: probar con datos reales, la configuración de Supabase y Vercel, y fusionar a `main`. Está detallado en `docs/pendientes.md`.
- **La Personalización ahora es por tema y completa.** Cada tema guarda sus propios colores y letras, y lo que se elige cambia toda la interfaz, también en Softsignal y Void (sección 3).
- **`CLAUDE.md`, `README.md` y `docs/base-de-datos.md` están al día** con el código.
- **Hay integración continua**: `.github/workflows/ci.yml` corre lint, tipos, tests y build en cada push a `dev` y `main` y en cada pull request.
- **Las categorías siguen al tema** y su color ya no se corre al crear o borrar otra (sección 3.6).

---

## 2. Decisiones tomadas

| Decisión | Qué significa en la app |
| --- | --- |
| La personalización es por tema | Cada tema con nombre recuerda sus colores y letras. Cambiar de tema no borra nada; al volver, está como se dejó |
| Si se elige un cambio, cambia todo | Un color o una letra elegidos llegan a toda la interfaz, incluidas las piezas propias de Softsignal y Void |
| Los colores salen del tema | Se eligen seis colores; el resto se calcula a partir de ellos con la proporción que tiene cada tema |
| Seguir con las mejoras de corrido | No se espera a las semanas de uso; el orden está en la sección 5 |
| Documentación al día | Hecho en esta vuelta |
| Categorías: color automático según el tema | Elegir el color de cada categoría queda en Fase 2, junto con la pantalla de gestión de categorías |

---

## 3. Lo que se construyó en esta vuelta

### 3.1 Colores derivados del tema

Antes se podían cambiar seis colores, pero las tarjetas y los bordes se quedaban con el color de fábrica: con un fondo oscuro propio, las tarjetas seguían claras.

Ahora hay una sola regla, en `src/lib/temas/derivados.ts`: **cada color derivado guarda respecto de su color base la misma distancia que tiene en el tema**. Si en Retro la tarjeta es un poco más clara que el fondo, con cualquier fondo sigue siendo ese poco más clara. Si en Softsignal oscuro es más oscura, sigue siendo más oscura.

| Se elige | Se recalcula solo |
| --- | --- |
| Fondo | Tarjetas |
| Texto | Bordes y texto apagado |
| Acento (solo en Void) | Bordes: en Void el borde es un lila de acento, no el color de la letra |

La sombra difusa de Whimsical y Void también dejó de ser un morado fijo: toma el color de la tinta del tema.

### 3.2 Softsignal y Void siguen a los colores elegidos

Estos temas tienen piezas propias —carcasa, teclas, pantallas LCD, barras de título, letras cromadas— que eran colores fijos. Ahora 21 de esas piezas dependen de un color de la paleta y se recalculan con la misma regla:

| Tema | Depende del fondo | Del verde | Del rosa | Del acento y los bordes | Del texto |
| --- | --- | --- | --- | --- | --- |
| Softsignal | Carcasa, borde, teclas, página | Pantallas LCD y su resplandor | Botón rosa | — | Página (en claro) |
| Void | Barra de tareas | Reloj digital | Cromo, barra de título | Lila de ventanas, barras, puntos del fondo, botón rosa | Texto de las barras, borde del cromo |

Sin colores propios no se toca nada: el tema se ve exactamente como estaba diseñado. Un test compara los valores de partida con la hoja de estilos para que no se desalineen.

Quedaron fijos a propósito: los brillos de fondo de Void, la rejilla de Softsignal y los negros de las pantallas. Son textura, no color de marca.

### 3.3 Letras elegidas en toda la interfaz

Antes, los rótulos pixelados (unas 50 apariciones) y los títulos que cada tema dibuja con letra propia ignoraban la tipografía elegida. Ahora:

- Elegir una letra de interfaz cambia también rótulos, navegación, chips y pantallas.
- Elegir una letra de diario cambia también los títulos cromados de Void y los de LCD de Softsignal.
- Sin elección, cada tema usa sus letras. Hay un botón nuevo, «Volver a las letras del tema».

### 3.4 Personalización guardada por tema

- Colores y letras se guardan bajo el tema al que pertenecen. No hizo falta migración: usa las mismas columnas con otra forma.
- Elegir un tema ya no descarta nada.
- Lo que estaba guardado con la forma anterior se lee como del tema que estaba activo.
- Cursor e iconos no son del tema: valen para todos.

### 3.5 Otros

- La vista previa en vivo muestra también los colores derivados y las piezas de Softsignal y Void, con la misma cuenta que hace el servidor al guardar.
- El aviso de contraste revisa además el texto sobre las tarjetas.
- 10 tests nuevos (66 en total).

### 3.6 Colores de categoría según el tema (etapa B)

Antes las categorías usaban 12 pasteles fijos, asignados por **posición alfabética**: crear una categoría que empezara con "A" corría el color de todas las demás.

- **Siguen al tema** (`src/lib/temas/categorias.ts`): de los tres acentos del tema (rosa, verde, turquesa) se toma qué tan claros y saturados son, y con eso se arman 12 tonos parejos alrededor del círculo, empezando por el rosa del tema. Whimsical da pasteles suaves; Softsignal y Void, colores más vivos. Si la usuaria eligió colores propios, salen de esos. Se calcula en OKLCH para que "igual de claro" se vea igual en todos los tonos.
- **Siempre legibles**: cada color se aclara lo necesario para llegar a 4.5:1 contra la tinta que va encima. Un test lo comprueba en los cuatro temas, claro y oscuro.
- **Llegan como variables** `--cat-0` … `--cat-11`, junto con el resto de la paleta, así que también se ven en la vista previa en vivo de Personalización.
- **Color estable** (`src/lib/categorias/color.ts`): cada categoría toma un lugar según un hash de su id, recorriéndolas por fecha de creación; si el lugar está ocupado, el siguiente libre. Crear una categoría ya no cambia el color de ninguna otra; borrar una solo mueve a las que habían chocado con ella. Con 12 o menos, nunca se repite un color. No hizo falta migración: usa `created_at`, que ya existía.

### 3.7 Integración continua

`.github/workflows/ci.yml`: lint, `tsc`, `npm test` y `next build` en cada push a `dev` y `main` y en cada pull request. No toca Supabase; el build recibe variables de mentira.

### 3.8 Corrección a la versión anterior de este documento

La primera versión decía que el color por defecto del editor del diario podía dejar texto ilegible en modo oscuro. No es así: ese valor solo es el color que muestra el selector cuando no hay ninguno elegido; no se aplica al texto.

---

## 4. Lo que falta mejorar en Personalización

### Etapa A — Probar lo nuevo en pantalla

Lo de la sección 3 está verificado por tests, no a ojo. Hay que recorrer los cuatro temas, en claro y oscuro, cambiando cada uno de los seis colores y las dos letras, y mirar sobre todo Softsignal y Void. La regla de "misma distancia" da resultados previsibles con colores cercanos a los del tema; con colores muy lejanos (un fondo negro en un tema claro) puede hacer falta ajustar alguna pieza.

### ~~Etapa B — Colores de categoría según el tema~~ (hecho, sección 3.6)

Queda para la Fase 2 elegir el color de cada categoría a mano, junto con la pantalla de gestión de categorías.

### Etapa C — Sacar las imágenes propias de la página

El cursor y los iconos subidos se guardan como texto dentro de la fila del tema (hasta 60 KB cada uno, cinco posibles) y viajan incrustados en cada página; el navegador no puede guardarlos en caché. Propuesta: pasarlos al bucket `imagenes`, carpeta `usuario_id/tema/`, con las políticas y las firmas con caché que ya existen.

### Etapa D — Cursor e iconos más completos

- **Cursor**: falta la variante "mano" sobre enlaces y botones, y elegir el punto de clic en un cursor propio (hoy fijo arriba a la izquierda, que no sirve para un cursor centrado). En pantallas táctiles, avisar que solo aplica en escritorio.
- **Iconos**: solo se personalizan los cuatro de sección. Extender el set Pixel a los iconos de acciones (editar, borrar, grabar, cerrar) daría un cambio de look completo.
- **Mayúsculas**: unas 45 están hechas en el código, así que ningún tema puede apagarlas. Pasarlas a un token.

### Etapa E — El tema fuera de la sesión

Las pantallas de acceso, términos y privacidad se ven siempre con el tema de fábrica, porque el tema se lee de la cuenta. Propuesta: recordar el último tema en el dispositivo para que esas pantallas y la barra del navegador en la PWA se vean igual que la app.

### Etapa F — Fairy

Diseñarlo en Claude Design primero. Ya queda definido cómo entra: sus colores propios se declaran con su color base, y hereda la personalización completa sin trabajo extra.

### Etapa G — Temas guardables (Fase 2)

Guardar varias combinaciones con nombre dentro de un mismo tema. La tabla `temas` ya admite varias filas por cuenta; le falta una fecha de modificación para ordenarlas.

---

## 5. Orden propuesto

| # | Bloque | Contenido | Por qué en este orden |
| --- | --- | --- | --- |
| 1 | Probar | Etapa A (ahora también los colores de categoría), junto con la prueba general con base real de `pendientes.md` | Lo nuevo no se vio en pantalla |
| 2 | Cerrar la Fase 1 | Operativo de Supabase y Vercel, fusión a `main`, despliegue | Lo único que separa al proyecto de estar en uso |
| 3 | Red de seguridad | ~~CI~~ (hecho); completar la prueba de punta a punta | Antes de seguir tocando estilos |
| 4 | ~~Coherencia~~ | ~~Etapa B~~ (hecho) | — |
| 5 | Rendimiento | Etapa C | Importa más con la app desplegada y en el celular |
| 6 | Alcance | Etapas D y E | Mejoras, no correcciones |
| 7 | Temas | Etapas F y G | Lo más vistoso, lo menos urgente |

---

## 6. Otras áreas de mejora

- **`temas.tipografia` es texto con JSON adentro**; `colores` e `iconos` ya son `jsonb`. Igualarla cuando haya otra migración sobre esa tabla.
- **Prueba de punta a punta**: el script existe; los flujos con sesión no se verificaron y faltan Vitrina, Audio y Personalización.

---

## 7. Revisión de las fases

### Fase 1 — MVP personal: construida, falta verificarla y desplegarla

Contra las historias de usuario de `CLAUDE.md`:

| Área | Construido | Falta |
| --- | --- | --- |
| Diario | Editor con formato e imágenes, título obligatorio (campo y servidor), categorías, búsqueda, editar y borrar con confirmación, borrador local | Probar con base real |
| Listas | Crear, marcar, reordenar, borrar, nombre y categoría inline | Probar con base real |
| Vitrina | Exhibir por lote, miniatura + completa, hashtags normalizados, filtros, ficha y edición aparte | Probar con base real |
| Audio | Grabar, corte a 10 min, reintento de subida, título por defecto | Probar con base real |
| Personalización | Temas, colores por tema con derivados, contraste, letras, cursor, iconos, modo claro/oscuro/automático, categorías según el tema | Etapa A (en pantalla) |
| Acceso | Entrar, crear cuenta, verificación, recuperar contraseña, bloqueo tras 5 fallos | Redirect URLs en Supabase |
| Idioma | Español e inglés | — |
| No funcionales | RLS, tipo real de archivo, aviso de espacio, PWA, términos y privacidad, tests, CI | Backups en Supabase, desplegar en Vercel |

Lo que separa a la Fase 1 de estar cerrada no es código: es probar en pantalla con la base real y hacer el operativo de `pendientes.md` (sección 2). Las etapas C, D y E de este documento son mejoras de la Fase 1, no requisitos de `CLAUDE.md`; pueden ir antes o después de desplegar.

**Recomendación:** desplegar en cuanto pase la prueba con base real, y hacer C, D y E con la app ya en uso. Así las mejoras salen de lo que se nota usándola, como sugería el plan original.

### Fase 2 — Escalable: no empezar todavía

Nada de esto se construye; queda anotado lo que el código ya deja preparado.

- Temas guardables (etapa G).
- Multiusuario real: el modelo ya cuelga de `usuario_id` con RLS. Faltan cuotas por cuenta y límites de subida; el aviso de espacio hoy mide contra el total del plan gratuito, no por cuenta.
- Transcripción de audio: la columna `audios.transcripcion` existe y está vacía.
- Búsqueda cruzada por categoría y hashtag entre los cuatro módulos; momento de revisar la regla de una sola categoría por elemento.
- Pantalla de gestión de categorías, con color elegible. El color automático ya vive en variables `--cat-N`: elegir uno a mano sería guardar el número en la categoría.
- Exportación y backup de datos; modo offline básico.

### Fase 3 — Comercial: solo como horizonte

- Perfiles públicos: implican políticas de lectura pública y otra forma de servir los archivos publicados.
- Planes y límites por cuenta, moderación, descubrimiento.

---

## 8. Decisiones abiertas

1. ~~**Categorías**~~: resuelto, automáticas según el tema; elegirlas a mano queda en Fase 2.
2. **Borde en Void**: quedó siguiendo al color de acento. Si al probarlo prefieres que siga a otro color, es un valor en `presets.ts`.
