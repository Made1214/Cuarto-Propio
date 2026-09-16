@AGENTS.md

# Cuarto Propio

Espacio personal para escribir, coleccionar y archivar la vida cotidiana: diario/blog con categorías, listas personalizables, galería de fotografía propia estilo Pinterest, y notas de audio (reverse journaling). Estética whimsical inspirada en blogspot, con personalización profunda (colores, iconos, cursor, foto de perfil).

Empieza como proyecto personal de un solo usuario, pero el modelo de datos y la arquitectura están pensados desde el día uno para poder escalar a multiusuario/comercial sin reescribir nada.

**Este documento es el contexto de arranque del proyecto.** Antes de escribir código, léelo completo — recoge todas las decisiones de producto ya tomadas, para no tener que volver a preguntarlas.

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

## Funcionalidades núcleo (Fase 1)

- **Diario / Blog**: entradas de texto con editor enriquecido (Tiptap, imágenes incrustadas), organizadas por categorías propias del usuario. Filtrado y búsqueda por categoría o palabra clave.
- **Listas personalizables**: colecciones tipo checklist simple (texto + marcado), sin campos personalizados por ahora. El usuario crea sus propias listas (ej. "Disfraces que quiero hacer", "Libros leídos").
- **Galería estilo Pinterest**: solo imágenes propias del usuario. Al subir: título, descripción, hashtags. Vista en cuadrícula masonry, filtrable por hashtag.
- **Audio / Reverse journaling**: notas de voz que se archivan como entradas independientes.
- **Personalización**: tema de color, cursor del mouse, iconos de la interfaz, foto de perfil, tipografía — todo configurable por el usuario.

Diario, galería y audio son **módulos independientes** (no una única "entrada combinada"), pero comparten el mismo sistema de categorías y hashtags para poder cruzarlos en búsquedas.

Navegación principal: **cronológica, estilo blog** (entradas más recientes primero) — no por tableros/categorías.

## Modelo de datos

Todo tipo de contenido cuelga de un `usuario_id`, aunque hoy solo exista un usuario — esto es lo que evita una migración dolorosa si el proyecto pasa a ser multiusuario.

Relaciones principales:
- Usuario → tiene → Entradas de diario, Listas, Imágenes/Pines, Audios, Tema visual
- Lista → contiene → Ítems de lista
- Entrada de diario → pertenece a → Categoría
- Imagen / Pin → pertenece a → Categoría y Hashtags

| Entidad | Campos principales |
| --- | --- |
| Usuario | id, nombre, foto de perfil, tema activo |
| Entrada (diario) | id, texto (contenido enriquecido tipo JSON de Tiptap, no texto plano), categoría, fecha, usuario |
| Lista | id, nombre, usuario |
| Ítem de lista | id, lista, contenido, estado (marcado / no marcado) |
| Imagen / Pin | id, archivo (miniatura + versión completa), título, descripción, hashtags, fecha, usuario |
| Audio | id, archivo, duración, transcripción (opcional, no en Fase 1), fecha, usuario |
| Categoría | id, nombre, usuario (categorías propias, no globales) |
| Tema visual | id, colores, cursor, iconos, tipografía, usuario |

El esquema SQL vive en `supabase/migrations/` (`0001_init.sql` crea las tablas y RLS, `0002_storage.sql` crea los buckets de Storage y sus políticas).

### Procesamiento de imágenes

Al subir una foto se generan **dos versiones** (con `sharp`), nunca una sola comprimida a la fuerza:

| Versión | Uso | Tamaño aproximado |
| --- | --- | --- |
| Miniatura optimizada | Cuadrícula masonry de la galería | ~500–800 px de ancho, WebP |
| Versión completa | Ficha de la imagen (zoom/detalle) | Hasta ~2000 px de ancho |

No hay un límite de tamaño estricto de cara al usuario — la compresión automática se encarga de que toda foto entre.

## Decisiones de producto ya confirmadas (no volver a preguntar)

- Login activo desde la Fase 1, aunque al inicio exista un solo usuario.
- Diario, galería y audios son módulos independientes que comparten categorías/hashtags (no entradas combinadas).
- Las listas son checklist simple: texto + marcado (sin campos personalizados).
- El diario usa editor de texto enriquecido (rich text / Tiptap), no markdown plano.
- Navegación principal cronológica, estilo blog.
- Exportación/backup de datos: **no** es parte del MVP (se deja para una fase posterior).
- Interfaz bilingüe (español/inglés) desde el MVP, con selector de idioma (next-intl).
- No se sube video en ningún momento del MVP — solo fotos y audio, para mantener el proyecto dentro de planes gratuitos.
- Fotos sin límite estricto para el usuario — compresión automática (miniatura + versión completa) al subir.

## Supuestos por defecto (ajustables si hace falta)

- Audio: hasta 10 minutos por nota, formato MP3/M4A.
- Formatos de imagen: JPG/PNG/WebP.

## Multi-tenancy (pensado para escalar, no implementar todavía)

Cada tabla lleva `usuario_id` y las consultas siempre filtran por ese campo — esto es lo que permitiría pasar de "app personal" a "app con muchos usuarios" cambiando lógica de acceso, no la estructura de datos. No añadir gestión de múltiples cuentas en la Fase 1; solo dejar el campo `usuario_id` presente en cada tabla desde el principio.

## Roadmap (contexto — construir solo Fase 1 por ahora)

| Fase | Alcance |
| --- | --- |
| **Fase 1 — MVP personal (ESTA FASE)** | Diario con categorías, listas personalizables, galería con hashtags/título/descripción, subida de audio, tema de color básico configurable, editor enriquecido, login activo, interfaz bilingüe. Un solo usuario real. |
| Fase 2 — Escalable (no construir aún) | Cuentas múltiples (multiusuario real), temas guardables y más personalización (cursor, iconos, tipografía), transcripción de audio, búsqueda por hashtag/categoría entre todo el contenido. |
| Fase 3 — Comercial (no construir aún) | Perfiles públicos/privados, planes de pago o límites por cuenta, posible descubrimiento de galerías de otros usuarios, moderación de contenido. |

Recomendación original: construir la Fase 1 completa como uso personal real durante unas semanas antes de decidir si vale la pena invertir en la Fase 2.

## Nombre del proyecto

**Cuarto Propio** (inspirado en "Un cuarto propio" de Virginia Woolf) — nombre ya decidido, usar en toda la interfaz, metadata y repositorio.

## Estado actual del código

Ver `README.md` para instrucciones de setup y un mapa de la estructura de carpetas.
