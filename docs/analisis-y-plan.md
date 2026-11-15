# Cuarto Propio — análisis del estado actual y plan para seguir

Fecha del análisis: 15 de noviembre de 2026 · rama `dev`. Segunda versión: incorpora las decisiones tomadas y lo que ya se construyó a partir de ellas.

Este documento hace tres cosas: dice dónde está parado el proyecto frente a lo que pide `CLAUDE.md`, señala las áreas de mejora encontradas leyendo el código, y propone cómo seguir — con la **Personalización** desarrollada en detalle, porque es lo que diferencia a la app.

Se complementa con los otros documentos, no los reemplaza:

- `CLAUDE.md`: decisiones de producto y arquitectura.
- `docs/pendientes.md`: la lista operativa de tareas (qué probar, qué configurar). Lo que ya está ahí no se repite acá.
- `docs/base-de-datos.md`: el esquema explicado.

Alcance: lectura del código, más `npm test` (66 tests), `tsc`, `eslint` y `next build`, que pasan. **No se probó en pantalla ni contra la base real**: lo construido en esta vuelta está verificado por tests, no a ojo.

---

## 1. Resumen

- **La Fase 1 está construida casi entera.** Los cuatro módulos de contenido, el acceso completo, Personalización, PWA instalable, términos y privacidad, bienvenida y aviso de espacio ya existen en `dev`.
- **Lo que falta para cerrarla es verificación y despliegue**: probar con datos reales, la configuración de Supabase y Vercel, y fusionar a `main`. Está detallado en `docs/pendientes.md`.
- **La Personalización ahora es por tema y completa.** Cada tema guarda sus propios colores y letras, y lo que se elige cambia toda la interfaz, también en Softsignal y Void (sección 3).
- **`CLAUDE.md`, `README.md` y `docs/base-de-datos.md` están al día** con el código.
- **Sigue sin haber integración continua**: los tests existen pero nada los corre solos.

---

## 2. Decisiones tomadas

| Decisión | Qué significa en la app |
| --- | --- |
| La personalización es por tema | Cada tema con nombre recuerda sus colores y letras. Cambiar de tema no borra nada; al volver, está como se dejó |
| Si se elige un cambio, cambia todo | Un color o una letra elegidos llegan a toda la interfaz, incluidas las piezas propias de Softsignal y Void |
| Los colores salen del tema | Se eligen seis colores; el resto se calcula a partir de ellos con la proporción que tiene cada tema |
| Seguir con las mejoras de corrido | No se espera a las semanas de uso; el orden está en la sección 5 |
| Documentación al día | Hecho en esta vuelta |

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

### 3.6 Corrección a la versión anterior de este documento

La primera versión decía que el color por defecto del editor del diario podía dejar texto ilegible en modo oscuro. No es así: ese valor solo es el color que muestra el selector cuando no hay ninguno elegido; no se aplica al texto.

---

## 4. Lo que falta mejorar en Personalización

### Etapa A — Probar lo nuevo en pantalla

Lo de la sección 3 está verificado por tests, no a ojo. Hay que recorrer los cuatro temas, en claro y oscuro, cambiando cada uno de los seis colores y las dos letras, y mirar sobre todo Softsignal y Void. La regla de "misma distancia" da resultados previsibles con colores cercanos a los del tema; con colores muy lejanos (un fondo negro en un tema claro) puede hacer falta ajustar alguna pieza.

### Etapa B — Colores de categoría según el tema

Las categorías usan 12 pasteles fijos (`src/lib/categorias/color.ts`), asignados por posición. No siguen al tema, y el color de una categoría se corre si se borra otra anterior. Propuesta: derivar la paleta del tema y, más adelante, permitir elegir el color de cada categoría.

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
| 1 | Probar | Etapa A, junto con la prueba general con base real de `pendientes.md` | Lo nuevo no se vio en pantalla |
| 2 | Cerrar la Fase 1 | Operativo de Supabase y Vercel, fusión a `main`, despliegue | Lo único que separa al proyecto de estar en uso |
| 3 | Red de seguridad | CI con lint, tipos, tests y build; completar la prueba de punta a punta | Antes de seguir tocando estilos |
| 4 | Coherencia | Etapa B | Lo último que queda sin seguir al tema |
| 5 | Rendimiento | Etapa C | Importa más con la app desplegada y en el celular |
| 6 | Alcance | Etapas D y E | Mejoras, no correcciones |
| 7 | Temas | Etapas F y G | Lo más vistoso, lo menos urgente |

---

## 6. Otras áreas de mejora

- **Integración continua**: no hay carpeta `.github/`. Un flujo que corra `npm test`, `eslint`, `tsc` y el build en cada push a `dev` cuesta poco.
- **`temas.tipografia` es texto con JSON adentro**; `colores` e `iconos` ya son `jsonb`. Igualarla cuando haya otra migración sobre esa tabla.
- **Prueba de punta a punta**: el script existe; los flujos con sesión no se verificaron y faltan Vitrina, Audio y Personalización.

---

## 7. Después de la Fase 1

Nada de esto se construye todavía; queda anotado lo que el código ya deja preparado.

**Fase 2 — escalable**

- Temas guardables (etapa G).
- Multiusuario real: el modelo ya cuelga de `usuario_id` con RLS. Faltan cuotas por cuenta y límites de subida; el aviso de espacio hoy mide contra el total del plan gratuito, no por cuenta.
- Transcripción de audio: la columna `audios.transcripcion` existe y está vacía.
- Búsqueda cruzada por categoría y hashtag entre los cuatro módulos; momento de revisar la regla de una sola categoría por elemento.
- Pantalla de gestión de categorías, con color elegible.
- Exportación y backup de datos; modo offline básico.

**Fase 3 — comercial**

- Perfiles públicos: implican políticas de lectura pública y otra forma de servir los archivos publicados.
- Planes y límites por cuenta, moderación, descubrimiento.

---

## 8. Decisiones abiertas

1. **Categorías** (etapa B): ¿colores derivados del tema automáticamente, o elegibles uno por uno desde ya?
2. **Borde en Void**: quedó siguiendo al color de acento. Si al probarlo prefieres que siga a otro color, es un valor en `presets.ts`.
