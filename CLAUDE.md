@AGENTS.md

# Cuarto Propio

Espacio personal para escribir, coleccionar y archivar la vida cotidiana: diario/blog con categorías, listas personalizables, Vitrina (galería de fotografía y arte propio estilo Pinterest), y notas de audio (reverse journaling). Estética whimsical inspirada en blogspot, con personalización profunda (colores, iconos, cursor, foto de perfil).

Empieza como proyecto personal de un solo usuario, pero el modelo de datos y la arquitectura están pensados desde el día uno para poder escalar a multiusuario/comercial sin reescribir nada.

**Este documento es el contexto de arranque del proyecto.** Antes de escribir código, léelo completo — recoge todas las decisiones de producto ya tomadas, para no tener que volver a preguntarlas.

## Cómo se conecta todo (resumen de arquitectura)

Todo el modelo de datos cuelga de `usuario_id`, incluso con una sola usuaria activa — ese es el eje que permite pasar de "app personal" a "app multiusuario" cambiando solo lógica de acceso, no la estructura de datos (ver Multi-tenancy más abajo).

Sobre ese eje cuelgan cuatro colecciones de contenido independientes — diario, listas, vitrina, audio — que no se mezclan entre sí, pero comparten un segundo eje transversal: la Categoría (relación simple, una sola por elemento). Los hashtags son una etiqueta fina exclusiva de la Vitrina; no compiten con las categorías ni las reemplazan.

Los tres tipos de contenido "editorial" (diario, imagen, audio) comparten la misma forma — título, categoría única, fecha — pensados para reutilizar el mismo componente de "tarjeta de contenido" en los tres módulos en vez de construir tres UIs distintas. El título deja de estar vacío distinto en cada uno: en el diario es obligatorio (no se guarda sin título); en audio, si se deja vacío, se completa solo con un default tipo fecha/hora.

El pipeline de subida de imágenes (miniatura + versión completa con `sharp`) es un solo componente reutilizado en tres lugares: Vitrina, imágenes incrustadas en el diario, y foto de perfil — no una implementación distinta por módulo.

La Personalización (entidad "Tema visual") vive fuera de las cuatro colecciones de contenido: es configuración transversal, no contenido, y debe modelarse como una tabla/entidad separada, no mezclada con las demás.

Los requerimientos no funcionales (seguridad, rendimiento, escalabilidad, etc.) están pensados desde el día uno, no como anexo: RLS activo aunque haya un solo usuario, validación real de tipo de archivo, rate limiting, aviso de storage.

**Punto a vigilar a futuro (no bloquea la Fase 1):** la restricción de "una sola categoría por elemento" es correcta para este tamaño, pero sería la primera decisión que empezaría a sentirse limitante si el archivo crece mucho — ya está anticipada como ítem de Fase 2 (búsqueda cruzada por categoría/hashtag entre todo el contenido).

## Alcance de este momento: construir solo la Fase 1 (MVP personal)

No implementar nada de Fase 2 o Fase 3 (ver Roadmap al final) a menos que se indique explícitamente. Fase 1 es un solo usuario real, pero **con login activo desde el inicio**.

## Stack técnico

| Capa | Elección | Por qué |
| --- | --- | --- |
| Frontend | Next.js (React) | Un solo proyecto para frontend + rutas API; permite PWA sin trabajo extra |
| Backend / API | Rutas API de Next.js | Evita mantener dos repos separados al inicio |
| Base de datos | PostgreSQL vía Supabase | Relacional, encaja con el modelo de entidades por `usuario_id` |
| Autenticación | Supabase Auth | Activa desde la Fase 1, aunque solo exista un usuario |
| Storage (fotos/audio) | Supabase Storage (Cloudflare R2 como respaldo si se agota el free tier) | Barato/gratis a escala personal |
| Hosting | Vercel | Plan Hobby gratuito cubre uso personal |
| Editor de texto enriquecido | Tiptap | Gratuito, open source, integración nativa con React |
| Procesamiento de imágenes | `sharp` (Node) | Genera miniatura + versión completa al subir cada foto |
| Internacionalización | next-intl | Interfaz bilingüe (español/inglés) desde el MVP |
| App móvil | PWA (no app nativa todavía) | Next.js publicado como PWA instalable; nativa (React Native/Expo) queda para fase posterior |

Objetivo de costo: **$0/mes** mientras el uso sea personal (free tiers de Vercel + Supabase, más R2 si hace falta más storage).

**Fase 1 no incluye modo offline**: la PWA es instalable (ícono, pantalla completa), pero requiere conexión para cargar y guardar contenido — no hay cache de service worker para ver contenido sin internet. Offline básico queda para una fase posterior si hace falta.

## Funcionalidades núcleo (Fase 1)

- **Diario / Blog**: entradas de texto con editor enriquecido (Tiptap, imágenes incrustadas), organizadas por categorías propias del usuario. Filtrado y búsqueda por categoría o palabra clave.
- **Listas personalizables**: colecciones tipo checklist simple (texto + marcado), sin campos personalizados por ahora. El usuario crea sus propias listas (ej. "Disfraces que quiero hacer", "Libros leídos").
- **Vitrina (galería estilo Pinterest)**: solo imágenes propias del usuario. Al subir: título, descripción, hashtags. Vista en cuadrícula masonry, filtrable por hashtag.
- **Audio / Reverse journaling**: notas de voz que se archivan como entradas independientes.
- **Personalización**: tema de color, cursor del mouse, iconos de la interfaz, foto de perfil, tipografía — todo configurable por el usuario.

Diario, listas, Vitrina y audio son **módulos independientes** (no una única "entrada combinada"), pero comparten el mismo sistema de categorías para poder cruzarlos en búsquedas (los hashtags son específicos de la Vitrina).

Navegación principal: **cronológica, estilo blog** (entradas más recientes primero) — no por tableros/categorías.

## Historias de usuario (Fase 1)

Formato: *Como [usuaria], quiero [acción], para [beneficio]*, con criterios de aceptación Given/When/Then. Usar esto como la definición de "terminado" de cada feature — si el código cumple los criterios, la feature está lista.

**Diario**

- Como usuaria, quiero escribir una entrada con texto enriquecido, para expresar mis pensamientos con formato (negritas, títulos, imágenes incrustadas).
  - Given que estoy en "Nueva entrada", When escribo contenido con formato y presiono "Guardar", Then la entrada se guarda con el formato intacto y aparece primero en la vista cronológica.
  - Given que el campo de texto está vacío, When presiono "Guardar", Then no se guarda nada y se muestra un aviso pidiendo contenido.
- Como usuaria, quiero ponerle título a cada entrada, para identificarla de un vistazo en la vista cronológica.
  - Given que escribo una entrada, When le pongo un título y guardo, Then la vista cronológica muestra ese título.
  - Given que el título está vacío, When presiono "Guardar", Then no se guarda nada y se muestra un aviso pidiendo título.
- Como usuaria, quiero asignar una categoría a cada entrada, para poder filtrar mi diario después.
  - Given que estoy creando/editando una entrada, When elijo una categoría existente o creo una nueva, Then la entrada queda asociada a ella y aparece al filtrar por esa categoría.
- Como usuaria, quiero editar o borrar una entrada existente, para corregir errores o eliminarla.
  - Given que abro una entrada, When cambio el texto y guardo, Then se actualiza sin crear un duplicado.
  - Given que elijo "Borrar", When confirmo en el diálogo, Then se elimina permanentemente; When cancelo, Then no cambia nada.
- Como usuaria, quiero buscar y filtrar mis entradas por categoría o palabra clave, para encontrar algo que escribí antes.
  - Given que tengo entradas guardadas, When escribo una palabra en el buscador o elijo una categoría, Then veo solo las entradas que coinciden, ordenadas cronológicamente.
  - Given que ninguna entrada coincide, When busco, Then veo un estado vacío indicando que no hay resultados.

**Listas personalizables**

- Como usuaria, quiero crear una lista con nombre propio, para organizar cosas como "libros leídos".
  - Given que presiono "Nueva lista", When ingreso un nombre y confirmo, Then se crea vacía y lista para agregar ítems; si el nombre está vacío, el sistema lo pide antes de guardar.
- Como usuaria, quiero agregar ítems y marcarlos como completados, para llevar seguimiento.
  - Given una lista abierta, When agrego texto y confirmo, Then el ítem aparece sin marcar; When toco su checkbox, Then cambia de estado y se guarda al instante.

**Vitrina (galería estilo Pinterest)**

- Como usuaria, quiero subir una foto propia con título, descripción y hashtags, para archivarla en mi vitrina.
  - Given que subo una imagen, When completo título, descripción y al menos un hashtag, Then aparece en la cuadrícula masonry con su miniatura optimizada.
  - Given que intento subir un archivo que no es imagen soportada, When lo confirmo, Then el sistema lo rechaza con un mensaje de formato no soportado.
- Como usuaria, quiero filtrar la vitrina por hashtag, para encontrar fotos relacionadas rápido.
  - Given fotos con distintos hashtags, When toco uno, Then veo solo las fotos que lo tienen.

**Audio / Reverse journaling**

- Como usuaria, quiero grabar una nota de audio, para archivar pensamientos hablados en vez de escritos.
  - Given que presiono "Grabar", When hablo y presiono "Detener", Then el audio se guarda como entrada independiente con fecha.
  - Given que la grabación llega a 10 minutos, When sigo hablando, Then se corta automáticamente, se guarda lo grabado y se avisa que llegó al límite.
- Como usuaria, quiero ponerle un título a cada nota de audio, para reconocerla de un vistazo en una lista.
  - Given que termino de grabar, When escribo un título y confirmo, Then el audio se guarda con ese título; When dejo el título vacío, Then se guarda con un título por defecto tipo "Audio — 15 sep, 3:42pm".

**Personalización**

- Como usuaria, quiero cambiar el tema de color, cursor, iconos y foto de perfil, para que la app se sienta mía.
  - Given que entro a Personalización, When cambio el color de acento, Then el cambio se aplica de inmediato en toda la interfaz.
  - Given que elijo colores con contraste muy bajo, When guardo, Then el sistema avisa del problema de accesibilidad pero permite continuar si insisto.
- Como usuaria, quiero elegir el cursor y los iconos de la interfaz desde un set curado por la app, o subir mis propias imágenes, para tener control total sobre el look.
  - Given que entro a Personalización, When elijo una opción del set predefinido, Then se aplica de inmediato sin necesidad de subir nada.
  - Given que elijo "Subir mi propia imagen", When subo un archivo válido (imagen para iconos, cursor en formato compatible), Then se valida el tipo real de archivo y se aplica; When el archivo no es válido, Then se rechaza con un mensaje claro.
- Como usuaria, quiero elegir entre modo claro, oscuro o automático (según mi sistema), para que la app se vea cómoda en cualquier momento del día.
  - Given que estoy en Personalización, When elijo "Automático", Then la app sigue la preferencia de tema del sistema operativo; When elijo "Claro" u "Oscuro", Then queda fijo en esa opción sin importar el sistema.

**Login / Autenticación**

- Como usuaria, quiero crear una cuenta con email y contraseña, para empezar a usar la app.
  - Given que estoy en "Crear cuenta", When ingreso un email válido y una contraseña que cumple los requisitos mínimos, Then se crea la cuenta y se envía un correo de verificación antes de poder entrar.
  - Given que el email ya tiene una cuenta registrada, When intento registrarme de nuevo, Then el sistema lo indica sin revelar si el email existe o no (mensaje genérico, por seguridad).
- Como usuaria, quiero iniciar sesión con email y contraseña, para proteger mi contenido personal.
  - Given credenciales correctas, When inicio sesión, Then entro a mi diario.
  - Given 5 intentos fallidos seguidos, When lo intento de nuevo, Then el sistema aplica un límite temporal (rate limiting) antes de dejar intentar otra vez.
- Como usuaria, quiero recuperar mi contraseña si la olvido, para no perder acceso a mi contenido.
  - Given que no la recuerdo, When pido "Olvidé mi contraseña" con mi email, Then recibo un enlace para restablecerla.

**Idioma**

- Como usuaria, quiero cambiar el idioma de la interfaz entre español e inglés, para usarla en el que prefiera.
  - Given que estoy en Configuración, When elijo "English", Then toda la interfaz cambia de idioma sin afectar el contenido que ya escribí.

## Reglas de validación y casos límite

- **Borrado**: siempre pide confirmación (entradas, listas, ítems, imágenes, audios); es permanente, no hay papelera/deshacer en la Fase 1.
- **Edición**: todo es editable después de creado (entradas, metadata de imágenes, nombre de listas, ítems).
- **Longitudes**: título de imagen, audio o entrada de diario hasta 100 caracteres, descripción hasta 500 caracteres (evitar que rompan el layout de la cuadrícula).
- **Nombres de lista**: campo requerido; sí se permiten nombres duplicados (no bloquear a la usuaria por esto).
- **Hashtags**: se normalizan a minúsculas (`#Viajes` y `#viajes` son el mismo hashtag).
- **Estados vacíos**: cada sección (diario, listas, vitrina, audio) muestra un mensaje/CTA claro cuando no hay contenido todavía, invitando a crear el primero — nunca una pantalla en blanco sin explicación.
- **Sesión**: expira tras inactividad prolongada (ej. 30 días con "recordar sesión" activo por defecto, acorde a una app de uso personal frecuente).
- **Subidas fallidas**: si se pierde la conexión a mitad de una subida de imagen/audio, se muestra un error claro y se puede reintentar sin perder el resto de la entrada.

## Modelo de datos

Todo tipo de contenido cuelga de un `usuario_id`, aunque hoy solo exista un usuario — esto es lo que evita una migración dolorosa si el proyecto pasa a ser multiusuario.

Relaciones principales:
- Usuario → tiene → Entradas de diario, Listas, Imágenes/Pines, Audios, Tema visual
- Lista → contiene → Ítems de lista
- Entrada de diario, Lista, Audio → pertenecen a → Categoría
- Imagen / Pin → pertenece a → Categoría y Hashtags

| Entidad | Campos principales |
| --- | --- |
| Usuario | id, nombre, foto de perfil, tema activo |
| Entrada (diario) | id, título (obligatorio), texto (contenido enriquecido tipo JSON de Tiptap, no texto plano), categoría, fecha, usuario |
| Lista | id, nombre, categoría, usuario |
| Ítem de lista | id, lista, contenido, estado (marcado / no marcado) |
| Imagen / Pin | id, archivo (miniatura + versión completa), título, descripción, hashtags, categoría, fecha, usuario |
| Audio | id, archivo, título, duración, categoría, transcripción (opcional, no en Fase 1), fecha, usuario |
| Categoría | id, nombre, usuario (categorías propias, no globales) |
| Tema visual | id, preset (opcional, ver Temas de diseño), colores, cursor (preset o archivo propio), iconos (preset o archivo propio), tipografía, usuario |

### Procesamiento de imágenes

Al subir una foto se generan **dos versiones** (con `sharp`), nunca una sola comprimida a la fuerza:

| Versión | Uso | Tamaño aproximado |
| --- | --- | --- |
| Miniatura optimizada | Cuadrícula masonry de la Vitrina | ~500–800 px de ancho, WebP |
| Versión completa | Ficha de la imagen (zoom/detalle) | Hasta ~2000 px de ancho |

No hay un límite de tamaño estricto de cara al usuario — la compresión automática se encarga de que toda foto entre.

Este mismo pipeline (miniatura + versión completa) se reutiliza en **toda** la app para cualquier imagen: fotos de la Vitrina, imágenes insertadas dentro de una entrada de diario, y la foto de perfil — un solo componente de subida de imágenes, no una implementación distinta por módulo.

## Decisiones de producto ya confirmadas (no volver a preguntar)

- Login activo desde la Fase 1, aunque al inicio exista un solo usuario.
- Existe pantalla pública de registro (crear cuenta) además del login — no es una cuenta creada a mano desde el dashboard de Supabase. Mitigado por verificación de email obligatoria (ya incluida con Supabase Auth).
- Las fotos de la Vitrina se llaman **piezas** y el verbo de subirlas es **exhibir** (en inglés, *pieces* / *display*) — el equivalente del "pin" de Pinterest, en el vocabulario de una vitrina.
- Ver una pieza y editarla son dos pantallas distintas: la ficha (`/vitrina/[codigo]`) solo muestra, y se edita desde el lápiz, en `/vitrina/[codigo]/editar` — mismo patrón que el Diario.
- En la cuadrícula, debajo de cada pieza va **solo el título** (y si no tiene, nada): hashtags y categoría son para filtrar desde la barra de arriba, no para llenar la pared de texto.
- La sección de imágenes se llama **Vitrina** (en inglés, *Showcase*) — no "Galería" ni "Tablero": subraya que es obra propia en exhibición, no un tablero de cosas ajenas recolectadas como en Pinterest. Se usa así en la navegación, en la URL (`/vitrina`) y en los textos; el nombre técnico de la tabla sigue siendo `imagenes`.
- Diario, Vitrina y audios son módulos independientes que comparten categorías/hashtags (no entradas combinadas).
- Cada entrada de diario, imagen, lista o audio pertenece a **una sola** categoría (relación simple, no multi-select) — los hashtags (solo en la Vitrina) cubren la necesidad de etiquetar con varias cosas a la vez.
- Las listas son checklist simple: texto + marcado (sin campos personalizados).
- El diario usa editor de texto enriquecido (rich text / Tiptap), no markdown plano.
- Navegación principal cronológica, estilo blog.
- Personalización de cursor e iconos: **ambas** opciones — set curado predefinido y subida de imagen propia.
- Las notas de audio llevan título (editable, con default automático tipo fecha/hora si se deja vacío).
- Las entradas de diario llevan título **obligatorio** — no se guarda una entrada sin título (a diferencia de imagen y audio, que sí resuelven el título vacío con un default). Validado tanto en el campo (`required`) como en la Server Action, para que no se pueda saltear.
- Exportación/backup de datos: **no** es parte del MVP (se deja para una fase posterior).
- Interfaz bilingüe (español/inglés) desde el MVP, con selector de idioma (next-intl).
- No se sube video en ningún momento del MVP — solo fotos y audio, para mantener el proyecto dentro de planes gratuitos.
- Fotos sin límite estricto para el usuario — compresión automática (miniatura + versión completa) al subir.

## Supuestos por defecto (ajustables si hace falta)

- Audio: hasta 10 minutos por nota, formato MP3/M4A. Se graba comprimido desde el navegador (ej. WebM/Opus, ~1MB por minuto) — la duración máxima ya acota el tamaño, no hace falta un paso de compresión adicional como en imágenes.
- Formatos de imagen: JPG/PNG/WebP.
- Foto de perfil: pasa por el mismo pipeline que la Vitrina (miniatura + versión completa), mismos formatos soportados.
- Tema claro/oscuro: por defecto sigue la preferencia del sistema operativo ("Automático"), con opción de fijarlo manualmente en Personalización.
- Categorías: se crean al vuelo desde cualquier módulo (diario, listas, vitrina, audio) al escribir un nombre nuevo — no hace falta una pantalla dedicada de gestión en la Fase 1. Si se borra una categoría en uso, sus elementos quedan sin categoría (no se borran ni se bloquea el borrado).
- Hashtags: solo letras, números y guion bajo, sin espacios ni símbolos (formato típico de hashtag); sin límite de cantidad por imagen.
- Tamaño máximo del archivo original antes de comprimir: 25MB para imágenes, 50MB para audio — un tope generoso solo para evitar abuso accidental, no una restricción real de cara al uso normal.
- Editor de diario (Tiptap): negritas, cursiva, títulos (H1-H3), listas, citas, enlaces e imágenes incrustadas — sin tablas ni bloques de código, no hacen falta para un diario personal.
- Ítems de lista: se pueden reordenar (drag & drop) y eliminar individualmente, además de marcarse como completados.
- Vitrina: se pueden subir varias fotos a la vez (batch upload), y cada una se describe **antes** de subir — el diálogo de exhibir pide título (obligatorio, precargado con el nombre del archivo), descripción y hashtags, y recién entonces se suben. Una pieza ya colgada rara vez se vuelve a describir.
- Rate limiting de login: bloqueo temporal de 15 minutos tras 5 intentos fallidos seguidos.

## Antes de empezar (checklist operativo — esto no lo puede resolver Claude, lo necesitas tú)

- Cuenta de Supabase creada, con un proyecto nuevo para "Cuarto Propio" (URL del proyecto + `anon key` + `service role key`).
- Cuenta de Vercel creada y conectada a tu cuenta de GitHub.
- Repositorio en GitHub creado (vacío está bien) donde vivirá el código.
- Decidir si el dominio será el que da Vercel por defecto (`cuarto-propio.vercel.app`) o uno propio comprado aparte — no bloquea el desarrollo, se puede conectar después.
- Node.js instalado localmente (o usar el entorno de Claude Code) — se recomienda la versión LTS más reciente.

## Identidad visual (tema por defecto — CONFIRMADO)

Paleta base del tema claro/oscuro que trae la app de fábrica (el usuario la puede personalizar después — ver Personalización arriba). Implementar como variables/tokens de color, no valores sueltos en cada componente.

Estructura: verde y rosado pastel como colores **primarios**; turquesa y morado oscuro como **secundarios**. El morado oscuro se deja intencionalmente sin pastelizar — es el que ancla la paleta (texto, botones) para que el resto no se sienta débil o plano.

**Modo claro**

| Token | Uso | Hex |
| --- | --- | --- |
| `color-bg` (Fondo) | Fondo | `#FCF6F3` |
| `color-text` (Morado oscuro) | Texto principal | `#3D2C4F` |
| `color-primary-green` (Verde pastel) | Primario — botones, elementos principales | `#9BCFAE` |
| `color-primary-pink` (Rosado pastel) | Primario — botones, elementos principales | `#F0AEC4` |
| `color-secondary-turquoise` (Turquesa) | Secundario — tags, estados | `#74C7C3` |
| `color-secondary-purple` (Morado oscuro, tono botón) | Secundario — CTA, encabezados | `#5B3F73` |

**Modo oscuro**

| Token | Uso | Hex |
| --- | --- | --- |
| `color-bg` | Fondo | `#2B2033` |
| `color-text` | Texto principal | `#FBF4F2` |
| `color-primary-green` | Primario | `#B8E0C6` |
| `color-primary-pink` | Primario | `#F5C4D3` |
| `color-secondary-turquoise` | Secundario | `#8ED9D4` |
| `color-secondary-purple` | Secundario (accent) | `#8A6BA3` |

Por qué combinan (para no perder el criterio si se ajusta algo después): verde y rosado son casi opuestos en el círculo cromático, lo que los hace lucir frescos juntos (combinación clásica tipo jardín/sandía); el turquesa actúa de puente entre el verde y el azul; el morado oscuro sin pastelizar da el contraste/ancla que una paleta 100% pastel necesita para no verse plana.

Tipografía sugerida: una serif cálida (ej. Georgia/Lora) para el cuerpo del diario, dando ese aire literario; sans-serif simple (ej. Inter) para la interfaz (botones, menús, navegación).

## Temas de diseño (sistema de presets — construido)

Más allá de "claro/oscuro/automático" (que es un modo dentro de un tema), la app va a ofrecer **temas de diseño completos y con nombre** (ej. Retro, Fairy, Emo) seleccionables desde Personalización (`/personalizacion`, enlazada desde el panel de perfil) — cada uno cambia no solo el color, sino la tipografía y el "lenguaje de forma" (bordes, radio, sombra) de toda la interfaz. Esto documenta la arquitectura para que cada tema nuevo sea agregar valores, no rediseñar el sistema.

**Contrato de un tema** (`src/lib/temas/types.ts`, tipo `TemaDiseno`): paleta de color en variantes claro/oscuro, tipografía del diario (lo que la usuaria escribe) por separado de la tipografía de interfaz (nav, botones, etiquetas) — ambas como id del set curado de `src/lib/temas/fuentes.ts` —, y tokens de forma (`radio`, `anchoBorde`, `sombra`: "suave" o "dura" + su offset). Los componentes leen estos tokens como variables CSS — `border-(length:--borde)`, `border-(length:--borde-grueso)`, `rounded-theme`, `shadow-marco-sm` / `shadow-marco` / `shadow-marco-lg`, `font-sans`, `font-diario` —, nunca valores sueltos. Hay dos niveles de tema: **de tokens** (Retro, Whimsical: solo un objeto de valores, sin tocar componentes) y **con hoja propia** (Softsignal, Void: además de los valores, un bloque en `temas.css` — ver abajo).

**Temas ya definidos en código** (`src/lib/temas/presets.ts`):
- **Retro** (por defecto desde el rediseño UX): ventanas de escritorio Y2K (Windows 98 / DreamWorld OS), bordes gruesos, esquinas rectas, sombra sólida desplazada sin blur. La fuente pixelada (Silkscreen) queda para la marca y los rótulos cortos (`font-pixel`); la interfaz va en Inter por legibilidad, y quien quiera el pixel en toda la interfaz lo elige en Tipografía. Prototipado en: https://claude.ai/artifact/CmEHbvcrAWAxnaUN2tRjK3
- **Whimsical**: la paleta de "Identidad visual" de arriba, esquinas redondeadas (16 px), borde fino y sombra difusa — el look blogspot original.

- **Softsignal**: la app como un aparato retro de plástico — carcasa crema (grafito en oscuro), secciones como teclas con lucecita, buscador y fechas en pantallas LCD verdes, títulos en dígitos de LCD, letra mono (IBM Plex Mono). Prototipo: https://claude.ai/artifact/15MYgygMMQ2fTFM8PWmimc
- **Void**: Y2K emo — todo en ventanitas de escritorio de los 2000 con barra de título, fondo estrellado con franjas de cuadros, títulos en letra cromada (Rubik itálica), interfaz en Pixelify Sans, acentos rosa con brillo; lila pastel en claro y negro estrellado en oscuro. Reemplaza al "Emo" que estaba reservado. Mismo prototipo.

Softsignal y Void cambian el estilo de toda la interfaz, no solo los tokens: además de sus valores en `presets.ts`, tienen su hoja `src/app/[locale]/temas.css`, colgada de `[data-tema="…"]` (atributo que pone el layout de `(app)` con el preset activo). Los componentes solo llevan clases "gancho" sin estilo propio (`tema-pagina`, `tema-barra`, `tema-marca`, `tema-nav-link`, `tema-nav-inferior`, `tema-crear`, `tema-contenido`, `tema-titulo`, `tema-panel`, `tema-lcd`, `tema-campo`, `tema-chip`, `tema-chip-activo`, `tema-fila-chips`); un tema nuevo con estilo propio agrega su bloque en `temas.css` sin tocar componentes, y declara sus colores como variables (`--ss-*`, `--vd-*`) para que sigan a los colores propios. La estructura de las pantallas es la misma en todos los temas. En pantallas muy anchas (`2xl`) estos dos temas suman paneles decorativos a los costados con datos reales del cuarto (conteos, última nota de audio, calendario; `src/components/decoracion-tema/`), y Void una barra de tareas abajo desde `lg`.

**Tema con nombre decidido, todavía sin diseñar** (reservado en `TEMAS_PLANEADOS`, no seleccionable): **Fairy** (pastel soñado, cursiva, brillos).

**La personalización es por tema** (decisión confirmada): cada tema con nombre guarda sus propios colores y letras. Cambiar de tema no borra nada, y al volver a uno se lo encuentra como se dejó. En la base, `temas.colores` y `temas.tipografia` son `{ temas: { retro: …, void: … } }` (`porTema` en `config.ts`; las filas viejas, con un solo juego suelto, se leen como del tema que estaba activo). Cursor e iconos no son del tema: valen para todos.

**Los colores salen del tema** (decisión confirmada): la usuaria elige seis colores (los cuatro acentos, fondo y texto) y **todo** lo demás se recalcula a partir de ellos, con una sola regla — cada color derivado guarda respecto de su color base la misma distancia que tiene en el preset (`src/lib/temas/derivados.ts`). Así la tarjeta acompaña al fondo y los bordes al texto (en Void, al acento: `tintaSigue`), y en Softsignal y Void también la carcasa, las pantallas LCD, las barras de título y el cromo (tabla `VARIABLES_TEMA`, cuyos valores de partida tienen que coincidir con `temas.css` — hay un test que lo comprueba). Lo mismo con las letras: una letra elegida a mano llega también a los rótulos pixelados y a los títulos que cada tema dibuja con letra propia (`--fuente-rotulo`, `--fuente-titulo`); sin elección, cada tema usa las suyas. No agregar un color o una letra fijos en un componente o en `temas.css`: si un tema necesita un color nuevo, entra en `VARIABLES_TEMA` con su base.

**Estado real:** construido. Cada cuenta tiene una fila en `temas` (apuntada por `perfiles.tema_activo_id`, se crea al primer cambio) con el preset activo, los colores propios por tema y por modo, la tipografía por tema, cursor e iconos. El layout de la app la lee (`src/lib/temas/queries.ts`), la valida (`config.ts`: solo colores #RRGGBB, ids de listas cerradas y PNG en base64 generados por el servidor) y la inyecta como un `<style>` con variables CSS (`css.ts`) antes del contenido, así el primer pintado ya sale con el tema. Las pantallas sin sesión (acceso, términos, privacidad) usan el tema de fábrica. Plan de mejoras pendientes: `docs/analisis-y-plan.md`.

## Marketing y posicionamiento (para más adelante, no bloquea el desarrollo de la Fase 1)

- **Audiencia**: personas a las que les gusta llevar un diario/journaling, coleccionar recuerdos visuales (estilo Pinterest) y quieren un espacio propio, privado y personalizable — no otra red social.
- **Propuesta de valor**: "todo lo que ya haces en 4 apps distintas (notas, Pinterest, notas de voz, fotos) en un solo espacio que es tuyo y se ve como tú quieras."
- **Tono de voz**: cálido, íntimo, literario, nunca corporativo — como escribirle a una amiga, no como una app de productividad.
- **Diferenciador frente a apps de diario existentes**: la personalización visual profunda (colores, cursor, iconos, tipografía) y la combinación diario + vitrina + audio en un solo lugar, en vez de herramientas separadas.

## Requerimientos no funcionales (por categoría)

**Usabilidad**
- Mobile-first: la mayoría del uso real será desde el celular vía PWA — diseñar primero para pantalla chica, escalar hacia arriba.
- Estados vacíos con mensaje/CTA claro en cada sección (ver Reglas de validación arriba) — nunca una pantalla en blanco sin explicación.
- Onboarding mínimo al primer inicio de sesión: un mensaje de bienvenida, no un tour obligatorio de varios pasos.

**Seguridad**
- Row Level Security (RLS) de Supabase activado desde el día uno en todas las tablas, filtrando por `usuario_id` — aunque hoy solo exista un usuario, la política de acceso debe estar ahí desde el principio.
- Validar el tipo real de archivo (no solo la extensión) en cada subida de imagen/audio, para evitar archivos maliciosos.
- Rate limiting en intentos de login fallidos.
- HTTPS obligatorio (lo da Vercel por defecto) y ninguna llave/secreto de Supabase expuesta en el código del cliente — todo vía variables de entorno del lado del servidor.
- Recuperación de contraseña y verificación de email desde la Fase 1 (incluido con Supabase Auth, sin trabajo extra).

**Rendimiento**
- La Vitrina usa miniaturas (no la versión completa) en la cuadrícula, con carga progresiva/lazy loading.
- Objetivo de carga inicial: bajo 3 segundos en una conexión normal.

**Confiabilidad**
- Si falla una subida de imagen/audio (ej. se pierde la conexión), se muestra un error claro y se puede reintentar sin perder el resto de la entrada.
- El editor de texto no debe perder contenido no guardado si el navegador se cierra inesperadamente (autosave local o aviso antes de salir).

**Disponibilidad**
- No se requiere alta disponibilidad — es un proyecto personal. Caídas ocasionales del free tier son aceptables siempre que el sistema se recupere solo, sin intervención manual.

**Escalabilidad**
- El diseño (ver Multi-tenancy abajo) asume cientos o miles de entradas por usuario, no millones — no sobre-optimizar para volúmenes que la Fase 1 no tiene.
- Aviso proactivo en la interfaz cuando el uso de storage (fotos/audio) se acerque al límite del free tier de Supabase, para decidir a tiempo si migrar a Cloudflare R2 o pasar a un plan pago — no esperar a que falle una subida por espacio agotado.

**Compatibilidad**
- Navegadores objetivo: últimas versiones de Chrome, Safari, Firefox y Edge (evergreen) — no es necesario soportar navegadores antiguos.
- Responsivo desde 360px de ancho (celular) hasta escritorio.
- PWA instalable tanto en iOS como en Android.

**Mantenibilidad**
- TypeScript en todo el proyecto (frontend y rutas API) para reducir errores durante el desarrollo.
- Estructura de carpetas organizada por feature (diario, listas, vitrina, audio, personalización), no por tipo de archivo — más fácil de navegar para quien retome el código.

**Privacidad y cumplimiento**
- El contenido es personal/íntimo por naturaleza — nunca usarlo para entrenamiento, analítica de terceros o publicidad.
- Página básica de términos de uso y privacidad antes de desplegar la app en una URL pública, aunque el único usuario seas tú.
- Backups automáticos de Supabase activados desde el día uno — no depender solo de la base de datos en producción sin respaldo.

## Multi-tenancy (pensado para escalar, no implementar todavía)

Cada tabla lleva `usuario_id` y las consultas siempre filtran por ese campo — esto es lo que permitiría pasar de "app personal" a "app con muchos usuarios" cambiando lógica de acceso, no la estructura de datos. No añadir gestión de múltiples cuentas en la Fase 1; solo dejar el campo `usuario_id` presente en cada tabla desde el principio.

## Roadmap (contexto — construir solo Fase 1 por ahora)

| Fase | Alcance |
| --- | --- |
| **Fase 1 — MVP personal (ESTA FASE)** | Diario con categorías, listas personalizables, vitrina con hashtags/título/descripción, subida de audio, personalización por tema (temas con nombre, colores, tipografía, cursor e iconos), editor enriquecido, login activo, interfaz bilingüe. Un solo usuario real. |
| Fase 2 — Escalable (no construir aún) | Cuentas múltiples (multiusuario real), temas guardables (varias combinaciones con nombre por cuenta), transcripción de audio, búsqueda por hashtag/categoría entre todo el contenido. |
| Fase 3 — Comercial (no construir aún) | Perfiles públicos/privados, planes de pago o límites por cuenta, posible descubrimiento de galerías de otros usuarios, moderación de contenido. |

Recomendación original: construir la Fase 1 completa como uso personal real durante unas semanas antes de decidir si vale la pena invertir en la Fase 2.

## Commits

Todos los commits van a nombre de **Made1214** (`116743110+Made1214@users.noreply.github.com`), y **sin** líneas de coautoría ni de sesión de Claude (`Co-Authored-By: Claude…`, `Claude-Session: …`) en el mensaje.

## Nombre del proyecto

**Cuarto Propio** (inspirado en "Un cuarto propio" de Virginia Woolf) — nombre ya decidido, usar en toda la interfaz, metadata y repositorio.

## Autoría de commits y PRs

Todo commit, PR y comentario en GitHub sale a nombre de Made1214 (`Made1214 <116743110+Made1214@users.noreply.github.com>`), como autora y como committer. Sin `Co-Authored-By`, sin `Claude-Session`, sin "Generated with Claude Code" ni ninguna otra mención a Claude en mensajes de commit, descripciones de PR o comentarios. Antes del primer commit de cada sesión, configurar `git config user.name` y `git config user.email` con esos datos.

## Estado actual del código

Ver `README.md` para instrucciones de setup y un mapa de la estructura de carpetas. Para el esquema de base de datos explicado a fondo (qué guarda cada tabla, cómo funciona RLS, Storage, la búsqueda por palabra clave y las migraciones), ver `docs/base-de-datos.md`.

**Módulos construidos hasta ahora:** login/logout (Supabase Auth), Diario (categorías por texto libre, editor Tiptap con color/resaltado, listado cronológico con búsqueda y filtro por categoría), Listas (tablero estilo Trello en una sola página — cada lista es una columna con sus ítems visibles, sin pantalla de detalle separada: nombre y categoría editables en el momento, agregar/marcar/eliminar ítems y crear/borrar listas, todo inline con refresco en el momento; filtro por categoría) y **Vitrina** (cuadrícula masonry de ventanitas Y2K, exhibir por lotes describiendo cada pieza antes de subirla, ficha de solo lectura con pantalla de edición aparte, relacionadas por hashtag/categoría, filtros y borrado con confirmación), **Audio** (grabación en el navegador con MediaRecorder, corte automático a los 10 minutos, subida con reintento sin perder la grabación, listado cronológico con título y categoría editables en el momento, filtro por categoría, borrado con confirmación). La lógica de categorías (consulta, resolución por nombre y asignación de color) vive compartida en `src/lib/categorias/`, usada por los cuatro módulos, y el selector de categoría de una tarjeta es un solo componente compartido (`src/components/categoria-selector.tsx`) entre Listas y Audio; el pipeline de imágenes (`src/lib/imagenes/procesar.ts` + `almacenamiento.ts`) es un solo componente reutilizado por la Vitrina, la foto de perfil y las imágenes incrustadas del diario (botón «Imagen» del editor, o pegar/soltar una foto; `/api/diario/imagen`, `src/lib/diario/imagenes.ts`).

**Perfil** (reemplaza a la pantalla de Ajustes, que ya no existe): un panel lateral que sale del borde derecho al tocar el avatar del navbar (`src/components/perfil/`, sobre `<dialog>` nativo como el resto de las ventanitas). Adentro: foto de perfil (mismo pipeline de imágenes, carpeta `perfil` del bucket `imagenes`, vía `/api/perfil/foto`), nombre editable en el momento, email, modo claro/oscuro/automático, idioma, el enlace a Personalización (`/personalizacion`), el medidor de espacio y cerrar sesión. El modo de color se aplica con `data-modo` en el `<html>` y un script inline en el `<head>` que lo pone antes del primer pintado (`src/lib/temas/modo.ts`); la preferencia vive en `localStorage`, no en la base, porque es de cada dispositivo y no de la cuenta.

**Navegación (rediseño UX, prototipo en https://claude.ai/artifact/JE2kJ9N9H9LaSSLo4s3k4a):** una sola barra morada arriba (marca, secciones con ícono desde tablet, botón «Crear» y avatar); en el celular las secciones van en una barra fija abajo con «Crear» levantado en el medio (`src/components/nav-secciones.tsx`). «Crear» abre una ventanita con las cuatro acciones — Escribir, Exhibir, Grabar, Nueva lista — que en el celular sube como hoja y en escritorio se abre al centro con atajos 1–4 (`src/components/menu-crear.tsx`). En escritorio (desde `lg`) el Diario suma una columna de filtros a la izquierda (`diario/columna-filtros.tsx`): buscador, categorías con conteo —incluida «Sin categoría», `?categoria=ninguna`— y meses con entradas (`?mes=YYYY-MM`); los conteos salen de `contarEntradasDiario` (`src/lib/diario/queries.ts`). El filtro por categoría de los cuatro módulos es una fila de chips con el color de cada categoría (`src/components/filtro-categoria.tsx`, que también exporta las clases de chip que usan los hashtags de la Vitrina). Navegación, botones y etiquetas usan Inter legible; la fuente pixelada queda para la marca y los rótulos cortos. Los botones, rótulos y textos de apoyo de todas las pantallas salen de un vocabulario de clases compartido en `src/app/[locale]/globals.css` (`boton` + `boton-rosa` / `boton-verde` / `boton-turquesa` / `boton-morado` / `boton-chico`, `rotulo`, `apoyo`, `aviso`, `enlace-volver`, `punto-categoria`), armado solo con los tokens del tema: un botón nuevo usa esas clases en vez de repetir utilidades, así sale igual en las cuatro secciones y en los cuatro temas. Los atajos de la barra llevan el gancho `tema-barra-icono`.

**Acceso** (`src/app/[locale]/(auth)/`): entrar (`/login`), crear cuenta (`/registro`, con requisitos de contraseña visibles mientras se escribe — 8 caracteres, una letra, un número, validados también en la Server Action, `src/lib/auth/contrasena.ts`), recuperar contraseña (`/recuperar`) y elegir una nueva (`/restablecer`). El registro responde lo mismo exista o no el correo. Los enlaces de los correos de Supabase pasan por `/api/auth/confirmar`, que canjea el código por sesión y redirige; para que funcionen, en Supabase → Authentication → URL Configuration hay que agregar `https://<dominio>/api/auth/confirmar` (y `http://localhost:3000/api/auth/confirmar` para desarrollo) a las Redirect URLs.

**Seguridad de acceso y cumplimiento:** bloqueo de 15 minutos tras 5 fallos de login seguidos sobre la misma cuenta (tabla `intentos_login`, migración 0009; si la migración falta, el login funciona sin el bloqueo). Páginas públicas de términos (`/terminos`) y privacidad (`/privacidad`), con el texto en los mensajes (`legal`) y un `[CORREO DE CONTACTO]` que hay que completar antes de publicar. Mensaje de bienvenida una sola vez por cuenta (`perfiles.bienvenida_vista_en`) y medidor de espacio en el perfil, con aviso en toda la app desde el 80 % del GB del free tier (`uso_storage()`, migración 0010; `src/lib/storage/limites.ts`).

**PWA:** manifest (`src/app/manifest.ts`), íconos en `public/icons/` (corazón pixelado, generados con `node scripts/generar-iconos.mjs public/icons`) y metadatos de iOS. A propósito sin service worker: Fase 1 no tiene modo offline.

**Personalización** (`/personalizacion`, `src/lib/temas/`): tema con nombre (Retro / Whimsical / Softsignal / Void; cada uno recuerda sus propios colores y letras), colores propios del modo que se está viendo con vista previa en vivo —incluidos los derivados: tarjetas, bordes y las piezas propias de Softsignal y Void— y aviso de contraste bajo según WCAG que deja guardar igual (`contraste.ts`), tipografía del diario y de la interfaz por separado (set curado, cargado con `next/font` sin precarga; «Volver a las letras del tema» la restablece), cursor (set curado en `public/cursores/`, generado con `node scripts/generar-cursores.mjs public/cursores`, o uno propio) e iconos de las secciones (set Trazo o Pixel, o una imagen propia por sección, vía `IconosProvider` / `IconoSeccion`). Los cursores e iconos propios se suben por `/api/personalizacion/imagen`: sharp valida el tipo real, los reduce a PNG de 32/64 px y se guardan como `data:` en la fila del tema (no en Storage). El modo claro/oscuro/automático sigue en el panel de perfil.

**Implicaciones de este documento que todavía no están reflejadas en el código** (a resolver cuando se retome cada módulo, no automáticamente):
- La transcripción de audio no está (ni tiene que estar: es Fase 2). La columna `audios.transcripcion` existe y queda vacía.

**Marca y landing:** el logo (la ilustración de la muchacha con el gato y el wordmark) vive en `src/assets/logo/` (`logo.webp` completo; `marca.webp`, recorte de la cara para la barra de la app, la de acceso, el favicon y los íconos de la PWA en `public/icons/`). `src/app/opengraph-image.jpg` es la imagen al compartir. La raíz `/` muestra la landing (`src/components/landing/`) a quien no tiene sesión; a quien sí, el proxy (`src/proxy.ts`) la manda al diario antes de renderizar, así la landing es estática (prerenderizada por idioma, igual que términos, privacidad y recuperar). La página entera conserva una sola identidad (Whimsical, tokens propios en `landing.css`, colgados de `.landing[data-theme]`); los temas se muestran en el **probador** (`probador.tsx`), una maqueta de la app que se viste con los temas **reales** de Personalización (Retro, Whimsical, Softsignal, Void, más Fairy como "pronto") usando `generarCssTema(config, alcance)` y las mismas clases y decoración de `temas.css` — así lo que se promete en la landing es lo que se encuentra adentro. Mientras está en pantalla, la maqueta rota sola por los temas cada 4,5 s (se pausa con el mouse encima y se detiene del todo al primer clic dentro del probador; con «reducir movimiento» no rota). Se puede probar también letra, acento y cursor. El botón "Crear mi cuarto con …" lleva a `/registro?tema=<preset>`; ese tema viaja en los metadatos de la cuenta (`tema_inicial`) y se aplica la primera vez que hay sesión (`src/lib/temas/inicial.ts`, desde `/api/auth/confirmar` o el primer login), solo si la cuenta todavía no tiene fila de tema.

