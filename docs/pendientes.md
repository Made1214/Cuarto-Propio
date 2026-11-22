# Pendientes — para seguir en otro chat

Última revisión: 2026-11-22 · rama `claude/loving-euler-0ihqb5`, sobre `claude/pwa-ui-responsive-fixes-33tbqf` (PR #2): cierra el código pendiente de la Fase 1. Lo que queda es probar con la base real y el operativo.

> **Regla de trabajo:** cada vez que se revise el estado del proyecto, primero
> se hace `git fetch` y se analiza `origin/dev` (diff contra `main`, `tsc`,
> `eslint`), y se actualiza este archivo: tachar lo terminado, agregar lo nuevo
> y cambiar la fecha y el commit de arriba.

## Cómo arrancar el próximo chat

Pegar algo así como primer mensaje:

> Seguimos con Cuarto Propio en la rama `dev`. Lee `CLAUDE.md` y
> `docs/pendientes.md` antes de tocar nada, y continúa con el siguiente
> pendiente de la lista "Orden sugerido".

Reglas que ya están en `CLAUDE.md` y conviene no olvidar:

- **Commits:** a nombre de **Made1214** (`116743110+Made1214@users.noreply.github.com`) y **sin** líneas `Co-Authored-By: Claude` ni `Claude-Session`.
- **Rama:** se trabaja en `dev`. No se toca `main` sin pedirlo.
- **Base de datos:** las migraciones viven en `supabase/migrations/` y nunca se editan una vez aplicadas; un cambio nuevo es un archivo nuevo. Se pueden aplicar con el conector de Supabase (proyecto "Cuarto Propio").
- **Diseño:** los cambios grandes de estilo se prototipan primero en Claude Design y después se pasan al código.

## Estado del código (2026-11-22)

**Todo el código de la Fase 1 que pedía `CLAUDE.md` y la auditoría de `lanzamiento.md` está escrito.** Vive en dos ramas sin fusionar, una sobre la otra:

1. `claude/pwa-ui-responsive-fixes-33tbqf` (PR #2): pulido móvil de la PWA.
2. `claude/loving-euler-0ihqb5`: zona horaria, categorías sin mayúsculas, migración `0013` de RLS, barra del editor con teclado, Wake Lock al grabar, tope de espacio por cuenta y las pruebas de punta a punta que faltaban (incluida RLS con dos cuentas). Contiene a la 1: fusionar esta alcanza.

Migraciones **sin aplicar** en Supabase: `0012` (aplicarla junto con el despliegue, cambia firmas) y `0013` (en cualquier momento).

Lo que separa a la Fase 1 de estar cerrada ya no es código: es la sección 1 (probar con la base real y en celulares), el operativo de la sección 2 y el SMTP propio.

## Estado de `dev` (revisión del 2026-11-16)

- Más de 30 commits por delante de `main`, sin commits propios en `main`: la fusión no tiene conflictos.
- `tsc --noEmit`, `eslint`, `npm test` (78) y `next build` pasan sin errores, y ahora los corre el CI (`.github/workflows/ci.yml`) en cada push.
- Migraciones 0001–0011 aplicadas en Supabase.
- La app ya corre en la computadora de la usuaria con su `.env.local`.

**Construido:**

- **Módulos:** Diario (editor con imágenes incrustadas, borrador local, búsqueda y categorías), Listas, Vitrina, Audio y Perfil.
- **Acceso:** entrar, crear cuenta, recuperar y restablecer contraseña, y bloqueo de 15 minutos tras 5 fallos seguidos.
- **Navegación (rediseño UX):** barra única, barra inferior en el celular, botón «Crear» y filtros en chips.
- **Personalización** (`/personalizacion`): tema, colores con aviso de contraste, tipografía, cursor e iconos.
- **Temas:** Retro (por defecto), Whimsical, Softsignal y Void. Los dos últimos tienen estilo propio en claro y oscuro, en `src/app/[locale]/temas.css`.
- **Lo demás:** términos y privacidad, bienvenida, medidor y aviso de espacio, y PWA instalable.

**Prototipos de diseño:**

- Rediseño UX (todas las pantallas, celular y escritorio): https://claude.ai/artifact/JE2kJ9N9H9LaSSLo4s3k4a
- Temas Softsignal y Void: https://claude.ai/artifact/15MYgygMMQ2fTFM8PWmimc

## Orden sugerido

0. **Bloqueos de lanzamiento** (sección «Antes de lanzar»). Salieron de la auditoría del 2026-11-16 sobre `b2e67d9`.
1. **Probar todo con la base real** (sección 1). Es lo más importante: casi nada de lo último se probó con datos de verdad.
2. **Operativo pendiente** (sección 2): Redirect URLs de Auth, backups y el correo de contacto de los textos legales.
3. **Fusionar `dev` en `main` y desplegar en Vercel.**
4. ~~Revisar las alertas de `npm audit`~~ (hecho; quedan 10 moderadas de herramientas, sección 4).
5. ~~Tests automatizados~~ (unitarios hechos; falta la prueba de punta a punta, sección 5).
6. **Diseño pendiente** (sección 3): Fairy, la columna de filtros del Diario en escritorio y otros detalles.

## Antes de lanzar (auditoría del 2026-11-16)

El porqué y la evidencia de cada punto están en [`lanzamiento.md`](./lanzamiento.md).

Bloqueos:

- [x] ~~**Subidas de más de 4,5 MB:**~~ el audio se graba a 32 kbps (10 min ≈ 2,4 MB), las imágenes se reducen en el navegador antes de subir y el tope del servidor es 4 MB. Probado con una foto de 10,5 MB. **Falta probar en Safari de iPhone.**
- [x] ~~**Borrador del diario:**~~ ya no se borra hasta confirmar el guardado; si falla, el texto sigue en pantalla con aviso y reintento. Probado en navegador con el servidor caído.
- [x] ~~**Bloqueo de login:**~~ cuenta por correo e IP (migración `0012`). **La `0012` no está aplicada en Supabase:** hasta entonces el login funciona sin bloqueo. Aplicarla junto con el despliegue de este código. Solución completa pendiente: registrar los fallos con la clave secreta y quitar el permiso a `anon`.
- [ ] **SMTP propio** en Supabase (lo hace la usuaria): sin esto no llegan los correos a otras personas.
- [x] ~~**Tope de storage por cuenta**~~ en las cuatro rutas de subida, con `uso_storage()` (`src/lib/storage/cuota.ts`). Por defecto es el GB del plan; **antes de abrir el registro, poner `CUOTA_STORAGE_MB` en Vercel** (p. ej. 250).
- [ ] **Backups y tarea contra la pausa del proyecto gratuito:** aplazados hasta que haya presupuesto (decisión del 2026-11-16).

Experiencia:

- [x] ~~Ficha y edición de entrada sin desborde en 360 px~~ (PR #2, barra `BarraEntrada`).
- [x] ~~Fechas en la zona horaria de la usuaria.~~ Cookie `zona` desde el navegador (`SincronizarZona`); también el agrupado, el filtro y los conteos por mes del Diario.
- [x] ~~Barra de formato del editor siempre a la vista~~ (PR #2).
- [x] ~~No guardar entradas sin texto.~~ Además el botón dice «Guardando…» y una entrada editada se ve al instante (antes hacía falta recargar).
- [x] ~~Nombres de lista y títulos de audio en varias líneas~~ (PR #2).
- [x] ~~Agrandar casillas, agarre de ítems y selectores de color~~ (PR #2: 44 px en táctil; los selectores de color del editor van dentro de un botón de 40 px).
- [x] ~~Barra del editor usable con teclado~~ (Enter y Espacio aplican el formato).
- [x] ~~Categorías sin distinguir mayúsculas~~ (servidor y selectores; con duplicadas viejas gana la más antigua).
- [x] ~~Pantalla encendida mientras se graba~~ (Wake Lock) y aviso antes de cerrar con una nota sin guardar. **Falta probar en iPhone.**
- [x] ~~Migración de RLS con `(select auth.uid())`~~: `0013`, escrita y **sin aplicar** en Supabase. Se puede aplicar en cualquier momento.
- [ ] Prueba de RLS con dos cuentas antes de abrir el registro: escrita (`e2e/rls.spec.ts`), **falta correrla** con dos cuentas de prueba reales.

## 0. Revisión de rendimiento, navegación e interfaz (2026-11-16)

Hecho en esta ronda (falta probarlo con la base real, ver la lista de abajo):

- **Landing:** sin cambio de tema en toda la página ni botón flotante. Ahora hay un **probador** con los temas reales (Retro, Whimsical, Softsignal, Void y Fairy "pronto"), letra, acento y cursor, y el botón "Crear mi cuarto con …" lleva el tema al registro. La landing, términos, privacidad y recuperar son estáticas. Ya no se descargan Cormorant ni Pirata One.
- **Acceso:** `?next=` al mandar al login (se vuelve a donde se iba), logo con enlace al inicio, idioma y modo claro/oscuro en las pantallas de acceso, títulos de pestaña propios, "Entrando…" mientras se envía y, en el celular, el panel decorativo es solo una barra.
- **404 propia** con la marca, en el idioma de la URL.
- **App:** atajo a Personalización (pincel) en la barra; Listas plegadas cuando hay más de 6 (cada dispositivo recuerda las abiertas), botón "Eliminar lista" abajo y separado de la ✕ de los ítems, y botones de 44 px en pantallas táctiles; texto alternativo de la Vitrina sin nombres de archivo; borradores de más de 7 días se descartan solos y el aviso dice hace cuánto; filtros que se deslizan con el borde desvanecido; enlace "Saltar al contenido".

Para probar con la base real:

- [ ] Crear una cuenta desde el probador (p. ej. con Void), confirmar el correo y ver que el cuarto abre en Void.
- [ ] Abrir `/es/listas` sin sesión, entrar y comprobar que vuelve a Listas.
- [ ] Listas con más de 6: que arranquen plegadas, que abrir/plegar se recuerde al recargar.

Pendiente:

- [ ] **Miniaturas viejas:** las piezas y la foto de perfil subidas antes del cambio de tamaños siguen con la miniatura de 800 px. Correr `npx tsx scripts/regenerar-miniaturas.ts --aplicar` con la clave secreta en `.env.local` (primero sin `--aplicar` para ver qué haría).
- [ ] **Rutas en inglés** (`/en/registro`, `/en/terminos`): se podrían traducir con `pathnames` de next-intl, pero obliga a tipar todos los enlaces de la app. Se dejó para después.

## 0.1 Pasada de uniformidad (2026-11-16)

Revisión de todas las pantallas en los cuatro temas (claro y oscuro, celular y escritorio) contra los prototipos de Claude Design, con datos de ejemplo:

- **Botones iguales en toda la app:** «Nueva lista», «Exhibir», «Editar», «Eliminar», «Guardar», «Cancelar» y los de los diálogos usan las clases compartidas `boton…` de `globals.css`. Antes unos iban en Inter y otros en pixel y mayúsculas, con altos distintos. Color por papel: rosa = lo nuevo de la sección, verde = guardar/confirmar, turquesa = imágenes y editar.
- **Sin mayúsculas forzadas en el código:** fechas, enlaces de volver, categorías y botones van en minúsculas; el pixel en mayúsculas queda solo en barras de ventana y rótulos (`rotulo`).
- **Categoría como punto de color + nombre** también en las tarjetas de Listas y Audio y en el editor (antes una franja pintada y chips en pixel).
- **Encabezados parejos:** las cuatro secciones abren igual (se quitó el icono suelto que solo tenían Diario, Vitrina y Audio); buscador del Diario a todo el ancho; subtítulos del prototipo.
- **Softsignal y Void:** el pincel de Personalización no se veía en la barra (blanco sobre barra clara) y en Void la tarjeta «Nueva lista» de Crear tenía el texto lila sobre blanco. Corregidos.

Falta verlo con la base real, junto con lo de la sección 1.

## 1. Probar con la base real

- [ ] **Acceso:** crear cuenta y confirmar el correo; entrar; equivocarse 5 veces seguidas y ver el bloqueo; recuperar la contraseña. Los correos necesitan antes las Redirect URLs de la sección 2.
- [ ] **Diario:** escribir con formato; subir, ver, ampliar y quitar una imagen (pegada, arrastrada y con el botón); comprobar que el título vacío no deja guardar; comprobar que el borrador se recupera si se cierra la pestaña.
- [ ] **Vitrina:** exhibir varias fotos, filtrar por hashtag y comprobar la normalización (minúsculas; solo letras, números y `_`).
- [ ] **Audio:** grabar, cortar a los 10 minutos y reintentar una subida fallida.
- [ ] **Listas:** crear, marcar, reordenar y borrar.
- [ ] **Personalización:** elegir cada tema; guardar colores (y ver el aviso de contraste); cambiar las letras; subir un cursor y un icono propios. Comprobar que todo se mantiene al recargar y en otro dispositivo.
- [ ] **Colores y letras por tema (nuevo, sin probar en pantalla):** en cada tema, cambiar los seis colores y ver que tarjetas, bordes y —en Softsignal y Void— carcasa, pantallas LCD, barras de título y cromo los acompañan, en claro y oscuro; cambiar las letras y ver que rótulos y títulos las siguen; cambiar de tema y volver, y comprobar que cada uno conserva lo suyo. Detalle en `docs/analisis-y-plan.md`, sección 3.
- [ ] **Colores de categoría (nuevo, sin probar en pantalla):** en cada tema, claro y oscuro, ver los chips del filtro y del selector; crear una categoría nueva y comprobar que las demás no cambian de color. Detalle en `docs/analisis-y-plan.md`, sección 3.6.
- [ ] **CI:** después del primer push, mirar en GitHub → Actions que el flujo `CI` quede en verde.
- [ ] **Softsignal y Void en todas las pantallas** (Listas, Vitrina, Audio, editor, ficha de pieza, perfil, ventanita de Crear), en celular y escritorio, claro y oscuro. Estas pantallas solo se revisaron con capturas de una página de prueba, no con datos reales.
- [ ] **Bienvenida:** sale una sola vez en una cuenta nueva.
- [ ] **Medidor de espacio:** se ve en el perfil.
- [ ] **PWA:** instalar la app en un iPhone y en un Android.

## 2. Operativo (lo hace la usuaria)

- [ ] **Redirect URLs de Auth.** Sin esto no funcionan los correos de confirmar cuenta ni recuperar contraseña. En Supabase → Authentication → URL Configuration → Redirect URLs, agregar:
  - `https://<dominio>/api/auth/confirmar`
  - `http://localhost:3000/api/auth/confirmar`

  Y en **Site URL**, el dominio de producción (no `localhost`): si un enlace no pasa la lista, Supabase manda a la Site URL.
- [ ] **Plantillas de correo.** Pegar `supabase/templates/confirmar-cuenta.html` en Authentication → Emails → Confirm signup y `supabase/templates/recuperar-contrasena.html` en Reset password (el asunto va en el comentario de cada archivo). Con la plantilla por defecto el enlace solo funciona en el mismo navegador del registro (PKCE) y abrirlo en otro dispositivo da «El enlace venció o ya se usó».
- [ ] **Correo de contacto:** completar `[CORREO DE CONTACTO]` en los textos legales (`src/messages/es.json` y `en.json`, sección `legal`) y releerlos. Son una base en lenguaje simple, no asesoría legal.
- [ ] **Backups:** el plan gratuito no los incluye; ver «Antes de lanzar».
- [ ] **Vercel:** desplegar con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] **Contraseñas filtradas** (opcional): activar "Leaked password protection" en Supabase → Authentication → Passwords. Puede no estar en el plan gratuito.
- [ ] **Sesión de 30 días:** decidir si alcanza el comportamiento actual. Hoy la sesión queda abierta mientras se use. El vencimiento por inactividad se configura en Supabase → Authentication → Sessions, que es de planes pagos.

## 3. Diseño pendiente

- [ ] **Fairy:** diseñar el tema (pastel soñado, cursiva, brillos), primero en Claude Design. Está reservado en `TEMAS_PLANEADOS`.
- [ ] **Softsignal y Void en el resto de las pantallas:** si hace falta, ajustarlos donde algo no se vea bien. Saldrá de la prueba de la sección 1.
- [x] ~~**Filtros del Diario en escritorio:**~~ hecho. Desde `lg` el Diario va en dos columnas: a la izquierda el buscador, las categorías con su conteo (más «Sin categoría») y los meses con entradas; en celular y tablet siguen los chips. Filtros nuevos en la URL: `mes=YYYY-MM` y `categoria=ninguna`. Falta verlo con la base real.
- [ ] **Ficha de pieza:** pasar "Eliminar" a un menú "⋯". Hoy vive en la pantalla de edición, con confirmación.

## 4. Mantenimiento

- [x] ~~**`npm audit` (críticas y altas):**~~ resuelto: Next 16.3.5 → 16.4.6 (crítica), y `npm audit fix` sin `--force` para `sharp`, `zod` y `source-map-js` (altas). `tsc`, `eslint` y `next build` pasan.
- [ ] **`npm audit` (10 moderadas que quedan):** `minimatch` (solo herramientas de lint) y `postcss-selector-parser` (vía `@tailwindcss/typography`, solo en el build). Arreglarlas exige `--force` con cambios mayores; dejarlas hasta que salga una versión compatible. **No** correr `npm audit fix --force`.
- [ ] **Rama `claude/gracious-tesla-3amhrb` en GitHub:** no salió de la sesión que construyó todo esto. Solo tiene un commit con este mismo archivo de pendientes; ya está cubierto por `dev`, se puede borrar.
- [ ] **Respaldo local de estilos del login:** si quedó un `git stash` con estilos viejos del login en la computadora de la usuaria, borrarlo (`git stash drop`) una vez confirmado que la pantalla nueva está bien.

## 5. Calidad

- [x] ~~**Tests unitarios:**~~ con Vitest (`npm test`, 56 tests): categorías (color, resolver, filtro), audio (formato real por bytes, duración y límites), pipeline de imágenes (formato real, tamaños, avatar, EXIF), título del Diario (`src/lib/diario/titulo.ts`, función pura sacada de las Server Actions), contraseña, configuración del tema, contraste y hashtags. Archivos `*.test.ts` junto al código. Vitest 5 con `@types/node` 22 (Vitest 3 traía 2 alertas críticas de `tinypool`).
- [ ] **Prueba de punta a punta (Playwright):** ya cubre Vitrina, Audio (micrófono de mentira) y Personalización, más `e2e/rls.spec.ts`; sus selectores se verificaron contra el Supabase simulado. El script ya está (`e2e/flujo.spec.ts`, `playwright.config.ts`, `npm run e2e`; escritorio y celular). Con cuenta de prueba ya confirmada: `E2E_EMAIL=... E2E_PASSWORD=... npm run e2e`. Verificado aquí solo lo que no necesita sesión (ruta privada y contraseña incorrecta); **falta correr y ajustar los de con sesión** (Diario, borrador, Listas, secciones, cerrar sesión) con la base real: los selectores del botón de perfil y de «Empezar» son una suposición. Falta correrlo con la base real.

## Ya resuelto (para no volver a preguntarlo)

- **Borrar una categoría:** sus elementos quedan sin categoría. Lo hace la base (`on delete set null`). No hay pantalla para borrar categorías, porque CLAUDE.md la deja fuera de la Fase 1.
- **Modo offline:** no hay service worker, a propósito. La Fase 1 no tiene modo offline.
- **Retro por defecto:** es el tema por defecto, con la interfaz en Inter por legibilidad. La letra pixelada en toda la interfaz se elige en Personalización → Tipografía.
- **Void reemplaza a Emo:** el tema "Emo" que estaba reservado queda cubierto por Void.
- **Error `Invalid Refresh Token`:** al levantar la app no es un fallo del código. Es una sesión vieja guardada en el navegador y se va al iniciar sesión de nuevo.
