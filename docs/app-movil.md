# Cuarto Propio: traspaso y camino a las tiendas

Última revisión: 2026-11-25, sobre `main` (`a402413`, PR #7).

Este documento sirve para dos cosas:

1. **Traspaso.** Quien retome el proyecto (otra persona u otra sesión de Claude) encuentra aquí en qué estado está, cómo se corre y dónde vive cada cosa.
2. **Volverla app.** Cuál es la forma más fácil de publicar Cuarto Propio en Google Play (primero) y en la App Store (después), con el paso a paso y lo que falta en el código.

No reemplaza a los demás documentos, los ordena:

| Documento | Para qué |
| --- | --- |
| `CLAUDE.md` | Decisiones de producto, arquitectura y reglas de trabajo. **Se lee primero.** |
| `README.md` | Setup local y mapa de carpetas |
| `docs/base-de-datos.md` | Esquema, RLS, Storage y migraciones explicados |
| `docs/lanzamiento.md` | Auditoría de lanzamiento del 2026-11-16 (el porqué de cada bloqueo) |
| `docs/pendientes.md` | Lista operativa de tareas. **Desactualizada en parte:** habla de `dev` y de ramas sin fusionar, pero hoy todo está en `main` (ver sección 1.3) |
| `docs/flujo-git.md` | Ramas, commits y `scripts/git-flujo.sh` |
| `docs/analisis-y-plan.md` | Personalización por tema, colores derivados |

---

## Resumen

- **El código de la Fase 1 está terminado.** Lint, tipos, 129 tests y `next build` pasan. Lo que falta es probar con la base real y la parte operativa (SMTP, dominio, backups).
- **Para Android, lo más fácil es una TWA** (*Trusted Web Activity*): un envoltorio Android mínimo que abre la PWA que ya existe en Chrome, a pantalla completa y sin barra de direcciones. No se reescribe nada. Se genera con **PWABuilder** (web, sin instalar nada) o **Bubblewrap** (línea de comandos). Cada deploy en Vercel actualiza la app sin pasar por la tienda.
- **Para iOS no existe la TWA.** Mientras tanto, la PWA se instala desde Safari («Agregar a inicio»). Para la App Store, el camino es **Capacitor** apuntando al sitio, más funciones nativas reales (micrófono, cámara, compartir, recordatorios). Sin eso, Apple suele rechazar los envoltorios web (regla 4.2).
- **No conviene reescribir en React Native/Expo todavía.** Duplicaría toda la interfaz y los cuatro temas; queda como Fase 2 o 3, como ya dice `CLAUDE.md`.
- **Publicar en una tienda abre el registro a desconocidos.** Antes hay que cerrar cosas que hoy están aplazadas: borrar la cuenta desde la app (lo exigen las dos tiendas y **no existe todavía**), SMTP propio, tope de storage, la prueba de RLS con dos cuentas y backups.

---

## 1. Traspaso: estado del proyecto

### 1.1 Qué es

Un espacio personal con diario (editor Tiptap), listas tipo tablero, Vitrina (galería masonry de obra propia), notas de audio y personalización profunda por tema (Retro, Whimsical, Softsignal, Void). Bilingüe es/en. El producto completo está descrito en `CLAUDE.md`.

### 1.2 Stack y por qué importa para la app

| Capa | Qué se usa | Consecuencia para empaquetar |
| --- | --- | --- |
| Frontend + API | Next.js 16 (App Router), Server Components, Server Actions, rutas API | **Necesita servidor.** No se puede exportar como sitio estático (`output: "export"`), así que no se puede meter la app «dentro» del paquete: el envoltorio tiene que abrir la URL desplegada |
| Imágenes | `sharp` en las rutas API | Ídem: corre en el servidor (Vercel) |
| Base, auth, archivos | Supabase (Postgres + Auth + Storage) | La sesión va en cookies, que funcionan igual dentro de una TWA |
| Hosting | Vercel | Cada deploy llega a la app instalada sola (`src/components/actualizar-app.tsx` + `/api/version`) |
| PWA | `src/app/manifest.ts`, íconos en `public/icons/` | Ya instalable. **Sin service worker**, a propósito (Fase 1 sin modo offline) |

### 1.3 Estado del código (2026-11-25)

- Rama principal: `main`. Los PRs #2 a #7 están fusionados y no hay ramas con trabajo pendiente.
- `npm run lint`, `npm test` (129 tests, 21 archivos) y `npm run build` pasan. `npx tsc --noEmit` pasa **después** de un build o un `next dev`: antes falta `next-env.d.ts` (se genera solo y no va en git), y por eso da errores falsos con los `.webp` del logo.
- Migraciones 0001 a 0013 aplicadas en Supabase.
- CI en `.github/workflows/ci.yml`: lint, tipos, tests y build en cada push y en cada PR.
- `npm audit`: quedan 10 alertas moderadas, solo de herramientas de lint y build. **No** correr `npm audit fix --force`.

Lo último que entró:

- **PR #5:** arreglos del reporte de pruebas del 21 de noviembre (caché de la Vitrina, soltar imágenes en el editor, el correo que ya no se borra tras un error en acceso, audios sin duración).
- **PR #6:** la PWA instalada se actualiza sola después de un deploy, y la página se recarga tirando hacia abajo.
- **PR #7:** el botón del centro de la barra de abajo hace la acción de cada sección, menú ⋯ en Listas, piezas de la Vitrina sin barra de ventana, y Personalización arriba en el perfil (sale el pincel de la barra).

### 1.4 Cómo correrlo

```bash
npm install
```

```bash
cp .env.example .env.local
```

Completar `.env.local`:

| Variable | Dónde se usa | Secreta |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | App | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | App | No (la protege RLS) |
| `SUPABASE_SECRET_KEY` | Solo `scripts/` (p. ej. regenerar miniaturas) y, a futuro, el borrado de cuenta | **Sí.** Nunca en el cliente ni con prefijo `NEXT_PUBLIC_` |
| `CUOTA_STORAGE_MB` | Tope de espacio por cuenta. Por defecto, el GB del plan gratuito | No. Poner p. ej. `250` en Vercel antes de abrir el registro |

```bash
npm run dev
```

Pruebas:

```bash
npm test
```

```bash
E2E_EMAIL=... E2E_PASSWORD=... npm run e2e
```

### 1.5 Mapa rápido

```
src/app/[locale]/(auth)/    acceso: login, registro, recuperar, restablecer
src/app/[locale]/(app)/     diario, listas, vitrina, audio, personalizacion
src/app/api/                subidas (imagenes, audio, diario/imagen, perfil/foto,
                            personalizacion/imagen), auth/confirmar, version
src/app/manifest.ts         manifest de la PWA
src/proxy.ts                sesión + idioma (ex middleware). El matcher ignora
                            rutas con punto, así que /.well-known/... pasa directo
src/lib/                    lógica por feature (temas, categorias, imagenes,
                            audio, storage, auth, diario…)
src/components/             piezas compartidas (nav, perfil, landing, decoración)
src/messages/{es,en}.json   textos de la interfaz y legales
supabase/migrations/        0001–0013. Nunca se editan una vez aplicadas
supabase/templates/         plantillas de correo (confirmar, recuperar)
e2e/                        Playwright (flujo, rls con dos cuentas)
scripts/                    git-flujo.sh, iconos, cursores, miniaturas
```

### 1.6 Reglas de trabajo que no se pueden olvidar

Están completas en `CLAUDE.md`; estas son las que más se rompen:

- **Commits** a nombre de `Made1214 <116743110+Made1214@users.noreply.github.com>`, sin `Co-Authored-By` ni `Claude-Session`. Sin firmas de Claude en los PRs.
- **Ramas** `tipo/tema` (`feat/borrar-cuenta`, `chore/twa-android`). Nunca `claude/…`. Una rama por tema.
- **Migraciones:** siempre un archivo nuevo, nunca editar uno aplicado.
- **Colores y letras** salen de los tokens del tema (`VARIABLES_TEMA`, clases `boton…`, `rotulo`, etc.). Nada fijo en un componente.
- **Fase 1 solamente**, salvo que se pida otra cosa.

### 1.7 Pendientes heredados (antes de pensar en tiendas)

Lo que estaba abierto en `docs/pendientes.md` y sigue abierto:

- [ ] **SMTP propio** en Supabase. Sin esto, los correos solo les llegan a las cuentas del equipo, 2 por hora.
- [ ] **Redirect URLs** y **Site URL** en Supabase → Authentication → URL Configuration, más las dos plantillas de `supabase/templates/`.
- [ ] `[CORREO DE CONTACTO]` en `src/messages/es.json` y `en.json` (sección `legal`).
- [ ] `CUOTA_STORAGE_MB` en Vercel.
- [ ] Correr `e2e/rls.spec.ts` con dos cuentas reales.
- [ ] Probar todo con la base real y en un iPhone y un Android físicos (sección 1 de `pendientes.md`).
- [ ] Regenerar las miniaturas viejas (`npx tsx scripts/regenerar-miniaturas.ts`, primero sin `--aplicar`).
- [ ] Backups (aplazados por presupuesto) y algo que evite la pausa del proyecto gratuito.
- [ ] Diseño: tema Fairy; «Eliminar» de la ficha de pieza a un menú ⋯.

---

## 2. Cómo volverla app: las opciones

| Opción | Qué es | Android | iOS | Trabajo | Costo de mantenimiento |
| --- | --- | --- | --- | --- | --- |
| **TWA** (PWABuilder / Bubblewrap) | Envoltorio que abre la PWA en Chrome, a pantalla completa | ✅ Ideal | ❌ No existe | Horas | Casi nulo: la web se actualiza sola |
| **Capacitor con URL remota** | App nativa con un WebView que carga el sitio, más plugins nativos | ✅ Sirve | ✅ El camino realista | Días | Bajo, pero hay que reconstruir al cambiar plugins |
| Capacitor con build estático | La web empaquetada dentro de la app | ❌ | ❌ | — | **No aplica:** la app usa Server Actions, rutas API y `sharp` |
| PWABuilder para iOS | Proyecto Xcode con WKWebView | — | ⚠️ Posible | Horas | Alto riesgo de rechazo (regla 4.2) si no suma funciones nativas |
| React Native / Expo | Reescribir la interfaz en nativo | ✅ | ✅ | Meses | Dos interfaces (y cuatro temas) que mantener |

### Recomendación

1. **Google Play: TWA**, ahora. Es lo más rápido, cuesta 25 USD una vez y no toca la arquitectura.
2. **iPhone, mientras tanto:** la PWA instalada desde Safari. Ya funciona y es gratis.
3. **App Store, después:** Capacitor con URL remota más funciones nativas que justifiquen la app (sección 6). Si se hace, se puede usar Capacitor también para Android y quedar con un solo envoltorio, pero no hace falta para empezar.
4. **Nativo de verdad** (Expo) solo si la app crece y las limitaciones del WebView se sienten. Hoy no.

---

## 3. Bloqueos antes de publicar en cualquier tienda

Publicar en una tienda equivale a abrir el registro al público. Esto pasa de «pendiente» a **obligatorio**:

### 3.1 Borrar la cuenta desde la app (no existe; lo exigen las dos tiendas)

- **Google Play:** si la app permite crear cuenta, tiene que dejar borrarla **dentro de la app** y además desde una **URL web** que se declara en la Play Console (para quien ya desinstaló).
- **Apple:** regla 5.1.1(v), borrado dentro de la app.
- Hoy los textos legales dicen «escribe a [CORREO DE CONTACTO]». Eso no alcanza para ninguna de las dos.

Cómo construirlo (rama `feat/borrar-cuenta`):

- Botón «Borrar mi cuenta» al final del panel de perfil (`src/components/perfil/`), con confirmación fuerte: escribir el correo o una palabra, y explicar que es permanente y no hay papelera.
- Una Server Action, o mejor una ruta API, que con `SUPABASE_SECRET_KEY` **solo del lado del servidor**:
  1. verifica la sesión y toma el `usuario_id` del servidor, nunca del cliente;
  2. borra los archivos de Storage del usuario: carpeta `<usuario_id>/` en los buckets `imagenes` y `audios`. **Storage no se borra en cascada**;
  3. llama a `auth.admin.deleteUser(usuario_id)`. Todas las tablas cuelgan de `auth.users` con `on delete cascade` (migración 0001), así que perfiles, entradas, listas, imágenes, audios, categorías y temas se van solos;
  4. cierra la sesión y redirige a la landing con un mensaje.
- Una página pública, p. ej. `/borrar-cuenta`, que explica cómo borrarla (entrar y usar el botón) y da el correo de contacto. Esa es la URL que pide Google.
- Actualizar `legal` en `es.json` y `en.json`.
- Test unitario de la lógica y un caso e2e.

### 3.2 Dominio definitivo antes del primer paquete

La TWA queda atada al dominio: el paquete declara el host y el dominio publica `/.well-known/assetlinks.json`. `cuarto-propio.vercel.app` funciona, pero si después se cambia a un dominio propio hay que publicar una versión nueva y las sesiones se pierden. Mejor decidir el dominio **antes**. Un dominio propio cuesta entre 10 y 15 USD al año.

### 3.3 El resto

- [ ] SMTP propio (Resend, Brevo o similar; todos tienen un plan gratuito que alcanza).
- [ ] `CUOTA_STORAGE_MB` en Vercel. Con desconocidos, el GB gratuito de Supabase se reparte entre todos.
- [ ] `e2e/rls.spec.ts` en verde con dos cuentas reales. Es la prueba de que nadie ve lo de otra persona.
- [ ] Backups: como mínimo, el `pg_dump` semanal con GitHub Actions que propone `lanzamiento.md`, más una consulta diaria para evitar la pausa del proyecto gratuito.
- [ ] `[CORREO DE CONTACTO]` completo y textos legales releídos. La política de privacidad tiene que nombrar a la app de Android y lo que declara la ficha de seguridad de datos (sección 4.6).
- [ ] La solución completa del bloqueo de login (registrar los fallos con la clave secreta y quitarle el permiso a `anon`), anotada como pendiente en `pendientes.md`.

### 3.4 Decisión a tomar: página «sin conexión»

Hoy no hay service worker. En una TWA sin conexión, Chrome muestra su propia página de error, y para quien la usa como app eso se ve roto. Propuesta: un service worker **mínimo** que solo muestre una página propia «Sin conexión, vuelve a intentar» con el tema por defecto, **sin cachear contenido**. No cambia la decisión de «Fase 1 sin modo offline» (no se ve nada guardado sin internet), pero `CLAUDE.md` dice «sin service worker» y habría que ajustar esa línea. PWABuilder además lo recomienda al puntuar la PWA.

Ojo: hay que cuidar que no interfiera con `actualizar-app.tsx`. Con un SW que no cachea nada, no debería, pero hay que probarlo.

---

## 4. Google Play paso a paso (TWA)

### 4.1 Cuenta de desarrolladora

- Play Console: pago único de **25 USD**, verificación de identidad (documento) y, según el país, de dirección y teléfono.
- **Cuenta personal o de organización:**
  - **Personal:** las cuentas personales nuevas tienen que hacer una **prueba cerrada con al menos 12 personas durante 14 días seguidos** antes de poder pedir la publicación a producción. Hay que empezar a juntar a esas 12 personas desde ya (amigas, familia).
  - **Organización:** no tiene ese requisito, pero pide un número D-U-N-S, es decir, una empresa registrada.
- La dirección y el nombre de desarrolladora quedan **públicos** en la ficha. Si no quieres mostrar tu dirección personal, revisa qué opciones da la consola en tu país.

> Estas reglas cambian seguido. Verificarlas en la Play Console el día que se cree la cuenta.

### 4.2 Preparar la web (rama `chore/twa-android`)

1. **Manifest** (`src/app/manifest.ts`):
   - agregar `id: "/"` (identidad estable de la app);
   - revisar que `start_url: "/"` lleve al diario con sesión y a la landing sin ella. Hoy lo resuelve `src/proxy.ts`;
   - `theme_color` y `background_color` son los que pinta Android en la barra de estado y la pantalla de inicio: hoy son el morado y el fondo de Retro, y está bien;
   - opcional: `screenshots` y `shortcuts` (Escribir, Grabar, Exhibir) para el menú del ícono al mantenerlo apretado. Los `shortcuts` funcionan en TWA.
2. **Digital Asset Links:** `public/.well-known/assetlinks.json`. Es lo que demuestra que la app y el dominio son de la misma dueña, y lo que esconde la barra de direcciones. El matcher de `src/proxy.ts` ya ignora rutas con punto, así que se sirve directo. El contenido lo genera PWABuilder o Bubblewrap; ver 4.4 por la huella del certificado.
3. **Service worker mínimo** (sección 3.4), si se decide.
4. Desplegar en el dominio definitivo y comprobar:

```bash
curl -s https://<dominio>/.well-known/assetlinks.json
```

```bash
curl -s https://<dominio>/manifest.webmanifest
```

### 4.3 Generar el paquete

**Opción fácil: PWABuilder** (pwabuilder.com, sin instalar nada):

1. Pegar la URL del dominio y dejar que analice el manifest.
2. *Package for stores* → **Android** → *Google Play*.
3. Completar:
   - **Package ID:** p. ej. `app.cuartopropio` o `com.<tudominio>.cuartopropio`. **Es permanente:** no se puede cambiar nunca después de publicar;
   - nombre, versión (`1.0.0`, code `1`), color de la barra de estado y de navegación;
   - **Signing key:** que cree una nueva;
   - **Fallback:** Custom Tabs (si el teléfono no tiene un navegador compatible con TWA).
4. Descarga un `.zip` con el `.aab` (para subir a Play), un `.apk` (para probar en el teléfono), el `assetlinks.json` y **la llave de firma con sus contraseñas**.

**Opción reproducible: Bubblewrap** (necesita Node; descarga solo el JDK y el SDK de Android):

```bash
npm i -g @bubblewrap/cli
```

```bash
bubblewrap init --manifest=https://<dominio>/manifest.webmanifest
```

```bash
bubblewrap build
```

Conviene guardar el `twa-manifest.json` que genera, en un repo aparte o en `android/` de este, **sin la llave**, para poder reconstruir con los mismos datos.

> **La llave de firma (`.keystore`) y sus contraseñas** se guardan en un gestor de contraseñas y con una copia fuera de la computadora. **Nunca en git.** Con Play App Signing (siguiente punto), si se pierde se puede pedir un reseteo de la llave de subida, pero es un trámite.

### 4.4 Firma y huellas (el error más común)

- Play usa **Play App Signing:** tu llave firma lo que subes (*upload key*) y Google vuelve a firmar con la suya (*app signing key*).
- El `assetlinks.json` tiene que tener la huella **SHA-256 de la llave de Google** (Play Console → *Configuración* → *Integridad de la app* → *Firma de apps*), además de la tuya si quieres probar el `.apk` local.
- Si falta la de Google, la app de la tienda **muestra la barra de direcciones arriba**. Es la señal de que la verificación falló.

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "app.cuartopropio",
    "sha256_cert_fingerprints": [
      "AA:BB:…:huella-de-la-llave-de-Google",
      "CC:DD:…:huella-de-tu-llave-de-subida"
    ]
  }
}]
```

### 4.5 Ficha de la tienda

| Pieza | Formato |
| --- | --- |
| Ícono | 512 × 512 PNG (sale de `public/icons/icon-512.png` o del logo en `src/assets/logo/`) |
| Gráfico destacado | 1024 × 500 PNG/JPG |
| Capturas de teléfono | Mínimo 2, idealmente 4 a 8. Diario, Vitrina, Audio y Personalización con un tema llamativo (Void o Softsignal) |
| Descripción corta | Hasta 80 caracteres. P. ej.: «Tu diario, tus listas, tu vitrina y tu voz, en un cuarto que se ve como tú.» |
| Descripción larga | Hasta 4.000 caracteres, en el tono de `CLAUDE.md` → Marketing: cálido e íntimo, nunca corporativo |
| Idiomas | Español (principal) e inglés |
| Categoría | Estilo de vida, o Productividad |
| Política de privacidad | `https://<dominio>/es/privacidad` |
| URL de borrado de cuenta | `https://<dominio>/borrar-cuenta` (sección 3.1) |

Las capturas se pueden sacar con `npm run responsive` (`scripts/responsive/capturas.mjs`) o con Playwright emulando un Pixel.

### 4.6 Formularios de la consola

- **Seguridad de los datos.** Borrador de respuestas, a confirmar contra el código y la guía de Google:
  - *Recopila:* correo (cuenta), nombre (perfil), fotos (Vitrina, diario, perfil), grabaciones de audio, otro contenido generado por la usuaria (diario, listas), y la IP de los intentos de login (bloqueo de 15 minutos, migración 0012);
  - *Para qué:* funcionamiento de la app y gestión de la cuenta, más seguridad y prevención de fraude en el caso de la IP. **Nada** de analítica, publicidad ni entrenamiento;
  - *Compartido con terceros:* no. Supabase y Vercel son proveedores que procesan por cuenta de la app, y Google no lo cuenta como «compartir»;
  - *Cifrado en tránsito:* sí (HTTPS);
  - *Se puede pedir el borrado:* sí, con el botón y la URL de la sección 3.1.
- **Clasificación de contenido:** cuestionario IARC. Contenido generado por la usuaria, privado, sin interacción entre personas.
- **Público objetivo:** mayores de 13 o 18 años (no infantil; si no, se activan las reglas de *Families*).
- **Acceso a la app:** Google revisa la app por dentro. Hay que darle **una cuenta de prueba ya confirmada** (correo y contraseña) en *Acceso a la app*.
- **Anuncios:** no.

### 4.7 Pistas de prueba y publicación

1. **Prueba interna:** subir el `.aab`, agregarte como testeadora e instalar desde Play. Comprobar todo lo de la sección 5.
2. **Prueba cerrada** (si la cuenta es personal): 12 o más personas con la invitación aceptada, 14 días seguidos. Pedirles que la usen de verdad; la consola pregunta qué se aprendió en esa prueba.
3. **Solicitar acceso a producción** → revisión de Google (de unos días a una semana o dos) → publicación.

### 4.8 Después de publicar

- **Cambios de la app:** deploy en Vercel, como siempre. La TWA carga el sitio, así que no hay que subir nada a Play. `actualizar-app.tsx` recarga sola la versión nueva.
- **Hay que subir un `.aab` nuevo** solo para: cambiar el nombre, el ícono o los colores del envoltorio; cambiar el dominio; o cuando Google suba el `targetSdkVersion` mínimo, más o menos una vez al año (en 2026 es API 35 y probablemente API 36 para las actualizaciones desde agosto de 2026; la consola avisa). Se regenera con PWABuilder o `bubblewrap update && bubblewrap build`, subiendo el `versionCode`.

---

## 5. Lo que hay que probar dentro de la TWA

Cosas propias de Cuarto Propio que cambian al pasar de navegador a app:

| Qué | Qué esperar | Cómo probar |
| --- | --- | --- |
| **Micrófono** (Audio) | Chrome pide el permiso igual que en la web; Android puede mostrar su propio diálogo | Grabar, cortar a los 10 minutos y reintentar una subida fallida |
| **Wake Lock** al grabar | Funciona igual que en Chrome | La pantalla no se apaga mientras se graba |
| **Selector de fotos** (Exhibir, imágenes del diario, foto de perfil) | Abre el selector de Android (galería y cámara) | Exhibir varias fotos a la vez |
| **Acción principal del botón central** (`useAccionPrincipal`) | Selector de archivos y micrófono en el mismo toque | Exhibir y Grabar desde la barra de abajo |
| **Correos de confirmar y recuperar** | Con App Links (los configura PWABuilder/Bubblewrap), el enlace del correo abre la app. Las plantillas de `supabase/templates/` van directo a `/api/auth/confirmar` y no dependen del navegador donde se hizo el registro | Registrarse en la app y abrir el correo en el mismo teléfono y en otro |
| **Sesión** | La TWA comparte cookies con Chrome: si la usuaria ya entró en Chrome, la app abre con sesión | Cerrar sesión en la app y ver que no quede abierta en Chrome, o al revés |
| **Barra de direcciones** | No debe verse nunca | Si aparece, falla `assetlinks.json` (sección 4.4) |
| **Navegar fuera del dominio** | Enlaces externos (dentro de una entrada del diario, por ejemplo) abren con la barra de Chrome encima. Está bien | Tocar un enlace del diario |
| **Recargar tirando hacia abajo** | Ya implementado en el PR #6 | Probarlo en Diario y Vitrina |
| **Sin conexión** | Página de Chrome, o la propia si se hace la sección 3.4 | Modo avión |
| **Modo oscuro** | El sitio sigue `data-modo`; la barra de estado usa el `theme_color` fijo | Revisar los cuatro temas en oscuro |
| **Teclado** | La barra inferior se esconde con un campo enfocado (ya implementado) | Escribir una entrada larga |
| **Botón atrás de Android** | Navega el historial del sitio; en la primera pantalla cierra la app | Abrir una ficha de pieza y volver |
| **Cursor propio** | No aplica en táctil | — |

---

## 6. App Store (después)

### 6.1 Por qué no es igual de fácil

- iOS no tiene TWA. Toda app que muestra web usa WKWebView dentro de un proyecto Xcode.
- **Regla 4.2 (funcionalidad mínima):** Apple rechaza apps que son «solo un sitio web empaquetado». Hay que sumar cosas que la web no puede hacer, o hace peor.
- Hace falta una Mac con Xcode, o compilar en la nube (Codemagic, Ionic Appflow o GitHub Actions con macOS).
- Apple Developer Program: **99 USD al año**.

### 6.2 Camino recomendado: Capacitor con URL remota

1. Crear un proyecto Capacitor (puede vivir en `mobile/` dentro de este repo o en uno aparte) con `server.url` apuntando al dominio. La app sigue siendo la misma web.
2. Sumar funciones nativas que tengan sentido para un diario. Con estas, la app deja de ser «solo un sitio»:
   - **Recordatorio diario local** («¿Escribimos algo hoy?»): notificaciones locales, sin servidor de push;
   - **Compartir hacia la app:** «Compartir → Cuarto Propio» desde Fotos para exhibir una pieza (*share extension*);
   - **Cámara nativa** para exhibir;
   - **Grabación nativa** para Audio (más estable en iOS que MediaRecorder dentro de WKWebView);
   - **Hápticos** al marcar ítems de lista o al terminar de grabar;
   - **Widget** (más trabajo): «última nota» o «escribir ahora».
3. La web detecta que corre dentro de Capacitor (`window.Capacitor`) y usa los plugins; en el navegador sigue como hoy. Así se mantiene **una sola base de código**.
4. Permisos en `Info.plist`, con textos en español e inglés: `NSMicrophoneUsageDescription`, `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`.
5. Requisitos de Apple que ya se cumplen o están en la sección 3: borrado de cuenta en la app, política de privacidad, cuenta de prueba para la revisión. **«Iniciar sesión con Apple» no hace falta**, porque solo hay correo y contraseña (regla 4.8).
6. Ficha de privacidad («etiquetas de nutrición»): los mismos datos que en la sección 4.6.
7. TestFlight para probar → revisión → publicación.

Si se hace Capacitor para iOS, se puede usar el mismo proyecto para Android y retirar la TWA. No es urgente: la TWA es más liviana y se actualiza sola.

### 6.3 Mientras tanto en iPhone

La PWA ya se instala desde Safari (Compartir → «Agregar a pantalla de inicio») con ícono y pantalla completa (`apple-touch-icon` y metadatos de iOS ya están). Se puede sumar en la landing una ayudita «Instálala en tu iPhone» con esos dos pasos.

---

## 7. Costos

| Concepto | Costo |
| --- | --- |
| Google Play | 25 USD, una vez |
| Apple Developer | 99 USD/año (solo cuando se vaya a iOS) |
| Dominio propio | ~10 a 15 USD/año (recomendado antes de la TWA) |
| SMTP (Resend, Brevo…) | 0 USD en el plan gratuito |
| Vercel Hobby | 0 USD. **Ojo:** el plan Hobby es para uso no comercial; si la app pasa a cobrar (Fase 3), corresponde el plan Pro |
| Supabase Free | 0 USD, con 1 GB de Storage compartido entre todas las cuentas y pausa tras una semana sin uso. Con usuarias reales, el plan Pro (25 USD/mes) resuelve backups y pausa |
| Compilar iOS en la nube | 0 USD en los planes gratuitos de Codemagic o GitHub Actions, si no hay Mac |

---

## 8. Orden sugerido

**Etapa A: cerrar la web para el público** (código; ramas separadas)

1. `feat/borrar-cuenta`: botón en el perfil, ruta del servidor, página pública y textos legales (3.1).
2. `docs/pendientes`: poner al día `docs/pendientes.md` con este estado.
3. `feat/sin-conexion` (si se decide): service worker mínimo con página propia (3.4).
4. `chore/manifest-app`: `id`, `shortcuts` y `screenshots` en el manifest.

**Etapa B: operativo** (lo haces tú)

5. Comprar el dominio y conectarlo en Vercel.
6. SMTP, Redirect URLs, Site URL y plantillas en Supabase.
7. `CUOTA_STORAGE_MB` en Vercel. `[CORREO DE CONTACTO]` en los textos legales.
8. Backups mínimos y algo contra la pausa.
9. Correr `e2e/rls.spec.ts` con dos cuentas, y el resto de la sección 1 de `pendientes.md`.

**Etapa C: Google Play**

10. Crear la cuenta de Play Console y verificar la identidad. Empezar a juntar a las 12 personas para la prueba.
11. Generar la TWA con PWABuilder (4.3) y publicar `assetlinks.json` con las dos huellas (4.2, 4.4).
12. Ficha, capturas y formularios (4.5, 4.6).
13. Prueba interna (sección 5) → prueba cerrada de 14 días → producción.

**Etapa D: App Store** (cuando Android esté estable)

14. Proyecto Capacitor, funciones nativas, TestFlight y revisión (sección 6).

---

## 9. Cosas a verificar el día que se hagan

Las políticas de las tiendas cambian más rápido que este documento. Confirmar en la fuente:

- requisito de prueba cerrada para cuentas personales de Play (cantidad de personas y días);
- `targetSdkVersion` mínimo vigente en Play;
- requisitos de borrado de cuenta (Play: *Account deletion*; Apple: 5.1.1(v));
- categorías de datos del formulario de seguridad de Play, en particular cómo declarar la IP;
- términos del plan Hobby de Vercel si la app empieza a generar ingresos.
