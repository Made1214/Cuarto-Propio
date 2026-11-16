# Base de datos de Cuarto Propio

> Explicación de referencia del esquema de Supabase/Postgres. El esquema en sí vive como código en `supabase/migrations/` — este documento explica *por qué* está armado así, para no tener que re-derivarlo en cada sesión.

## Resumen: cómo está pensada la base

Cuarto Propio usa **PostgreSQL vía Supabase**. Hoy la usás una sola persona, pero la base está armada para que, si el proyecto pasa a tener varios usuarios (Fase 2), **no haya que tocar ni una tabla**.

La idea central es simple: **todo lo que creás cuelga de tu usuario**. Cada tabla de contenido (`entradas`, `listas`, `imagenes`, `audios`, `categorias`, `temas`) tiene una columna `usuario_id`, y Postgres mismo —no el código de la app— se encarga de que nadie vea ni toque filas que no son suyas. Eso se llama **Row Level Security (RLS)** y se explica en detalle más abajo.

En números: son **8 tablas**, repartidas en tres grupos:

| Grupo | Tablas | Para qué |
| --- | --- | --- |
| Identidad | `perfiles` | Tu perfil (nombre, foto, tema activo) |
| Contenido | `entradas`, `listas` + `items_lista`, `imagenes`, `audios` | Lo que vas creando en cada módulo |
| Organización | `categorias`, `temas` | Cómo se agrupa y personaliza ese contenido |

Todo el esquema vive versionado como código en `supabase/migrations/` — cada archivo `.sql` es un paso que se aplica en orden, nunca se edita uno viejo (el detalle está en la última sección).

## Cómo se relacionan las tablas

```mermaid
flowchart LR
  usuario["Tu usuario"]
  perfiles["perfiles"]
  categorias["categorias"]
  entradas["entradas (diario)"]
  listas["listas"]
  items["items_lista"]
  imagenes["imagenes (Vitrina)"]
  audios["audios"]
  temas["temas"]

  usuario --> perfiles
  usuario --> categorias
  usuario --> entradas
  usuario --> listas
  usuario --> imagenes
  usuario --> audios
  usuario --> temas
  categorias -.categoriza.-> entradas
  categorias -.categoriza.-> imagenes
  categorias -.categoriza.-> audios
  listas --contiene--> items
  temas -.tema activo.-> perfiles
```

Todo nace de **tu usuario** (línea llena): cada tabla de contenido tiene una fila por cada cosa que creás, marcada con tu `usuario_id`. Las líneas punteadas son relaciones opcionales: una entrada, una imagen o un audio *pueden* tener categoría, pero no es obligatorio. La única relación de "contiene" real es `listas` → `items_lista`: si borrás una lista, sus ítems se borran con ella.

## Las tablas, una por una

### `perfiles`

Extiende la tabla de usuarios de Supabase Auth con datos propios del producto. Tiene el mismo `id` que tu usuario de Auth (no uno nuevo).

| Columna | Qué guarda |
| --- | --- |
| `id` | Tu id de usuario (el mismo de Supabase Auth) |
| `nombre` | Tu nombre |
| `foto_perfil_path` | Miniatura de tu foto de perfil en Storage (la que se ve en el avatar) |
| `foto_perfil_completa_path` | Versión completa de esa misma foto |
| `tema_activo_id` | Qué fila de `temas` está activa ahora |
| `bienvenida_vista_en` | Cuándo cerraste el mensaje de bienvenida (`NULL` = todavía no lo viste) |

Se crea sola la primera vez que te registrás (ver "Lo que la base hace sola" más abajo).

La foto pasa por el mismo pipeline que la Vitrina —miniatura + versión completa con `sharp`—, por eso son dos rutas y no una: guardar solo la miniatura dejaría la otra suelta en Storage, sin nadie que la mencione para poder borrarla después. Los archivos viven en el bucket `imagenes`, en `usuario_id/perfil/`.

El modo claro/oscuro **no** está acá: es una preferencia de cada dispositivo y vive en el `localStorage` del navegador (`src/lib/temas/modo.ts`). Lo que sí va a vivir en la base es el tema de diseño elegido (`temas`), que es otra cosa.

### `categorias`

Tus propias categorías —no hay categorías globales compartidas entre usuarios—, usadas por el Diario, las Listas, la Vitrina y el Audio.

| Columna | Qué guarda |
| --- | --- |
| `id` | Identificador único |
| `nombre` | El nombre que le pusiste (único por usuario: no podés repetir "Viajes" dos veces) |

No tienen pantalla propia de gestión: se crean solas cuando escribís un nombre nuevo al guardar una entrada, imagen o audio.

### `entradas` — el Diario

| Columna | Qué guarda |
| --- | --- |
| `titulo` | Título de la entrada (opcional) |
| `contenido` | El texto enriquecido completo, como JSON de Tiptap (formato, colores, listas, todo) |
| `contenido_texto` | El mismo texto pero en plano, sin formato — se usa solo para buscar |
| `busqueda` | Columna calculada automáticamente a partir de `contenido_texto`, para la búsqueda por palabra clave |
| `categoria_id` | A qué categoría pertenece (opcional) |
| `fecha` | Fecha de la entrada (por default, cuándo la creaste) |

`contenido` es la fuente de verdad (lo que ves en el editor); `contenido_texto` y `busqueda` existen solo para que la búsqueda funcione rápido, sin tener que leer el JSON de Tiptap cada vez.

### `listas` e `items_lista`

Las listas son checklists simples: un nombre, y adentro, ítems con texto + marcado.

| Tabla | Columna | Qué guarda |
| --- | --- | --- |
| `listas` | `nombre` | El nombre de la lista ("Libros leídos") |
| `items_lista` | `lista_id` | A qué lista pertenece |
| `items_lista` | `contenido` | El texto del ítem |
| `items_lista` | `marcado` | Si está tildado o no |
| `items_lista` | `orden` | Su posición dentro de la lista |

Los ítems no tienen `usuario_id` propio —se sabe de quién son a través de su lista—, y por eso se explican distinto en la sección de seguridad.

### `imagenes` — la Vitrina

| Columna | Qué guarda |
| --- | --- |
| `titulo`, `descripcion` | Lo que escribiste al subir la foto |
| `hashtags` | Lista de hashtags (para filtrar la cuadrícula) |
| `miniatura_path`, `completa_path` | Las dos versiones que genera `sharp` al subir: una liviana para la cuadrícula, una grande para el detalle |
| `ancho`, `alto` | Dimensiones de la imagen |
| `categoria_id` | Categoría opcional |
| `codigo` | Código corto y opaco para la URL (`/vitrina/x7k2m9pl`), para no exponer la UUID |

### `audios`

| Columna | Qué guarda |
| --- | --- |
| `archivo_path` | Ruta del archivo de audio en Storage |
| `titulo` | Opcional: vacío se guarda como `NULL` y la app muestra un título por defecto con la fecha y la hora, armado al mostrarlo para que salga en el idioma de la interfaz |
| `duracion_segundos` | Duración de la nota, medida por el navegador al grabar |
| `transcripcion` | Texto transcripto (no se usa en Fase 1, queda listo para Fase 2) |
| `categoria_id` | Categoría opcional |

### `temas`

Guarda tu personalización visual. Hoy solo se usa el color básico; el resto (cursor, iconos, tipografía) está en la tabla desde ya para no migrar nada cuando se construya en Fase 2.

| Columna | Qué guarda |
| --- | --- |
| `nombre` | Nombre del tema ("Mi tema") |
| `colores` | Colores propios, guardados **por tema** y por modo: `{ temas: { retro: { claro: {…}, oscuro: {…} }, void: {…} } }`. Solo los seis que se eligen a mano; el resto se calcula |
| `cursor` | Cursor del mouse elegido |
| `iconos` | Set de iconos, como JSON |
| `tipografia` | Letras elegidas, también **por tema**: texto con JSON `{ temas: { retro: { diario, interfaz } } }` |

### `intentos_login`

Cuenta los fallos de login seguidos por **correo e IP**, para bloquear 15 minutos ese par tras 5 contraseñas equivocadas (además de los límites por IP que ya trae Supabase Auth). Es la única tabla sin `usuario_id`: los intentos pasan **antes** de que haya sesión. La clave primaria es `(email, ip)`.

| Columna | Qué guarda |
| --- | --- |
| `email` | El correo intentado, en minúsculas (hasta 320 caracteres) |
| `ip` | La IP desde la que se intentó, en forma canónica, o `desconocida` si no llegó una IP válida (en local) |
| `fallidos` | Cuántos fallos seguidos lleva |
| `bloqueado_hasta` | Hasta cuándo está bloqueada (`NULL` = no lo está) |
| `actualizado_en` | El último intento: un fallo de hace más de 15 minutos ya no cuenta como "seguido" |

Tiene RLS activo y **ninguna** política: nadie la lee ni la escribe directo. Solo se toca con tres funciones `security definer`: `login_bloqueado_hasta(email, ip)` y `registrar_fallo_login(email, ip)` (las llama el login antes y después de intentar, con la IP que el servidor lee de `x-forwarded-for` — ver `src/lib/auth/ip.ts`) y `limpiar_intentos_login()` (tras entrar bien, solo con sesión y solo sobre el correo propio, desde todas las IP — así nadie puede borrar el bloqueo de otra cuenta). Las dos primeras normalizan la IP con `normalizar_ip_login`, una función interna que no se expone por la API, y `registrar_fallo_login` borra de paso las filas de más de un día para que la tabla no crezca sin fin.

**Por qué por correo e IP** (migración 0012): con el contador solo por correo, y `registrar_fallo_login` llamable sin sesión (tiene que serlo: los fallos pasan antes de entrar), cualquiera que supiera el correo de una usuaria podía llamar a la función cinco veces con la clave pública y dejarla fuera de su cuenta cada 15 minutos. Contando por par, esos fallos bloquean solo la IP de quien ataca.

**Límite conocido:** la función sigue siendo llamable sin sesión y la IP la manda quien llama, así que alguien que conozca el correo **y** la IP de la víctima todavía podría bloquearla; y quien rote de IP no acumula el bloqueo (para eso quedan los límites por IP de Supabase Auth). Lo completo es registrar los fallos desde el servidor con la clave secreta de Supabase y quitarle a `anon` el permiso sobre estas funciones — queda para cuando la app tenga esa variable de entorno.

## Seguridad: Row Level Security

Cada tabla tiene **RLS activado**, con una regla del tipo:

```sql
create policy "entradas: dueño" on public.entradas
  for all using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());
```

Esto significa que Postgres filtra **siempre**, en cada consulta, sin excepción: si intentás leer, editar o borrar una fila que no es tuya, la base se comporta como si esa fila no existiera. No depende de que el código de Next.js se acuerde de agregar un `WHERE usuario_id = ...` —ni siquiera si hubiera un bug en la app, alguien podría ver contenido ajeno.

Una excepción: `items_lista` no tiene `usuario_id` propio, así que su regla verifica el dueño a través de la lista a la que pertenece:

```sql
using (exists (
  select 1 from public.listas
  where listas.id = items_lista.lista_id
    and listas.usuario_id = auth.uid()
))
```

Esto es lo que hace posible la Fase 2 sin reescribir nada: el día que haya más de un usuario, estas mismas reglas siguen funcionando exactamente igual —cada quien sigue viendo solo lo suyo, automáticamente.

## Storage: dónde viven los archivos

Las fotos y los audios no se guardan en la base de datos —ahí solo vive la ruta (`miniatura_path`, `completa_path`, `archivo_path`). Los archivos en sí están en Supabase Storage, en dos buckets **privados**:

| Bucket | Contenido |
| --- | --- |
| `imagenes` | Miniatura + versión completa de cada foto |
| `audios` | Las notas de voz |

Privados quiere decir que no tienen una URL pública fija: para mostrarlos hay que pedirle a Supabase una URL firmada, que expira sola. Cada firma dura 24 horas y la app reutiliza la misma URL mientras le queden 12 horas o más, para que el navegador cachee el archivo en vez de bajarlo en cada visita (ver `src/lib/storage/firmas.ts`). La regla de quién puede leer/subir/borrar cada archivo es la misma idea que RLS, pero aplicada a la carpeta:

```sql
using (bucket_id = 'imagenes' and (storage.foldername(name))[1] = auth.uid()::text)
```

En la práctica esto obliga a que **todo archivo se guarde dentro de una carpeta con tu `usuario_id`** (por ejemplo `af3.../foto-1.webp`) —si se subiera fuera de esa carpeta, nadie podría leerlo, ni vos.

### Imágenes del Diario

Las fotos dentro de una entrada no tienen tabla propia: viven en el JSON de `entradas.contenido` (nodos `image`) y sus archivos en el bucket `imagenes`, carpeta `usuario_id/diario/`, con el mismo pipeline de la Vitrina (miniatura + completa). El JSON guarda una URL estable de la app (`/api/diario/imagen?ruta=…`), no la URL firmada de Storage, que vence: esa ruta comprueba que el archivo sea de quien lo pide, firma en el momento y redirige. Al editar una entrada se borran de Storage las fotos que se quitaron, y al borrar la entrada, todas las suyas.

## Lo que la base hace sola

Dos automatizaciones, para no depender de que la app se acuerde de hacerlas:

**Perfil automático.** Cuando te registrás en Supabase Auth, un trigger crea tu fila en `perfiles` al toque —nunca hay un usuario sin perfil.

```sql
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**`updated_at` al día.** En `entradas` y `perfiles`, cada vez que editás algo, un trigger actualiza `updated_at` solo. Así no hace falta que el código de la app mande esa fecha a mano en cada guardado (y no se puede olvidar de hacerlo).

## Cómo funciona la búsqueda por palabra clave

El contenido del Diario se guarda como JSON de Tiptap (formato, colores, listas...), y Postgres no puede buscar texto dentro de eso directamente. La solución es guardar el mismo contenido dos veces, con dos propósitos distintos:

1. **`contenido`** (JSON) —lo que ves y editás en el editor. Es la fuente de verdad.
2. **`contenido_texto`** (texto plano) —se calcula automáticamente a partir del JSON cada vez que guardás una entrada, usando la función `generateText` de Tiptap.
3. **`busqueda`** —una columna que Postgres genera solo, a partir de `contenido_texto` y el título, optimizada para búsqueda (`tsvector`, con un índice `GIN` para que sea rápida incluso con muchas entradas).

```sql
busqueda tsvector generated always as (
  to_tsvector('spanish', coalesce(titulo, '') || ' ' || coalesce(contenido_texto, ''))
) stored;
```

Cuando buscás "calma" en el Diario, la consulta compara contra `busqueda`, no contra el JSON —por eso es instantáneo aunque tengas cientos de entradas. Usé el diccionario `'spanish'` de Postgres, así que entiende acentos y variaciones.

## Las migraciones: qué hace cada archivo

El esquema no se edita a mano en el dashboard de Supabase —vive como archivos `.sql` en `supabase/migrations/`, que se aplican en orden y nunca se modifican una vez creados (un cambio nuevo es siempre un archivo nuevo).

El primero, `0001_esquema_completo.sql`, crea las 8 tablas (con `categoria_id` en listas y `titulo` en audios ya incluidos, no como parche aparte), sus relaciones e índices, la búsqueda por palabra clave (`contenido_texto` + `busqueda`), RLS con sus políticas, el trigger que crea el perfil al registrarte, `updated_at` automático, y los buckets de Storage (`imagenes`, `audios`) con sus políticas de acceso por carpeta. Los que siguen son los cambios que fue pidiendo cada módulo al construirse:

| Archivo | Qué agrega |
| --- | --- |
| `0002_temas_preset.sql` | `temas.preset`: de qué tema con nombre parte una fila (`NULL` = tema hecho a mano) |
| `0003_codigo_entradas.sql` | `entradas.codigo`, el código corto de las URLs del Diario |
| `0004_codigo_listas.sql` | Lo mismo para `listas` |
| `0005_items_casilla_opcional.sql` | La casilla de un ítem pasa a ser opcional (`items_lista.con_casilla`) |
| `0006_listas_con_casillas.sql` | La casilla deja de ser por ítem: ahora la lista entera es de notas o de casillas (`listas.con_casillas`) |
| `0007_codigo_imagenes.sql` | `imagenes.codigo`, el código corto de las URLs de la Vitrina |
| `0008_perfil_foto.sql` | `perfiles.foto_perfil_completa_path`: la segunda versión de la foto de perfil, la que faltaba para no dejar archivos sueltos |
| `0009_intentos_login.sql` | Tabla `intentos_login` y sus tres funciones: bloqueo de 15 minutos tras 5 fallos de login seguidos |
| `0010_bienvenida_y_storage.sql` | `perfiles.bienvenida_vista_en` (el mensaje de bienvenida sale una sola vez por cuenta) y la función `uso_storage()`, que suma lo que ocupan tus fotos y audios para el medidor del perfil y el aviso de espacio |
| `0011_endurecer_funciones.sql` | Ajustes que pidió el revisor de seguridad de Supabase: las funciones que solo sirven con sesión dejan de poder llamarse sin sesión, la función del trigger de perfiles deja de estar expuesta por la API y `set_updated_at` fija su `search_path` |
| `0012_intentos_login_por_ip.sql` | El bloqueo de login pasa a contarse por correo **e** IP (clave `(email, ip)`), las funciones reciben la IP y se borran las firmas viejas de un solo argumento, para que no se pueda dejar fuera a otra persona sabiendo solo su correo |

Las migraciones 0001–0011 están aplicadas en el proyecto de Supabase "Cuarto Propio" (0009–0011 se aplicaron con el conector de Supabase el 2026-11-15). Si en otro proyecto 0009 o 0010 todavía no están aplicadas, la app sigue funcionando: el login entra sin el bloqueo propio, y la bienvenida y el medidor de espacio simplemente no aparecen. La 0012 todavía **no** está aplicada: hasta que se aplique, el código nuevo llama a funciones de dos argumentos que no existen y el login entra sin el bloqueo propio (y lo mismo al revés, si se aplica antes de desplegar el código).

Cada cambio de esquema nuevo (por ejemplo al construir Personalización) se agrega como un archivo nuevo, nunca editando uno ya aplicado.

Para aplicarlo en un proyecto de Supabase nuevo: con la Supabase CLI, `supabase db push`; o pegando el archivo en el SQL Editor del dashboard. El detalle de setup completo está en el `README.md` del repositorio.
