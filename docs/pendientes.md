# Pendientes de la Fase 1

Última revisión: 2026-11-15 · rama revisada: `dev` (commit `cdd6343`)

> **Regla de trabajo:** cada vez que se revise el estado del proyecto, primero
> se hace `git fetch` y se analiza `origin/dev` (diff contra `main`, `tsc`,
> `eslint`), y se actualiza este archivo: tachar lo terminado, agregar lo nuevo
> y cambiar la fecha y el commit de arriba.

## Estado de `dev`

- 13 commits por delante de `main`, sin commits propios en `main` (fusión sin conflictos).
- `tsc --noEmit`, `eslint` y `next build`: sin errores. Pruebas con base real: **no verificadas** (el entorno de desarrollo no tiene las claves de Supabase).
- Construido: acceso completo (entrar, crear cuenta, recuperar y restablecer contraseña, bloqueo tras 5 fallos), Diario, Listas, Vitrina, Audio, Perfil, términos y privacidad, bienvenida, medidor y aviso de espacio, PWA instalable, rediseño de navegación (barra única, barra inferior en el celular, botón Crear, filtros en chips). Migraciones 0001–0011, todas aplicadas en Supabase.

## 1. Autenticación

- [x] ~~Pantalla pública "Crear cuenta" con verificación de email obligatoria.~~ (`/registro`)
- [x] ~~Mensaje genérico si el email ya existe (no revelar si hay cuenta).~~
- [x] ~~Recuperar contraseña: solicitud y pantalla de restablecimiento.~~ (`/recuperar`, `/restablecer`)
- [x] ~~Rate limiting de login: bloqueo de 15 min tras 5 intentos fallidos.~~ (migración 0009)
- [ ] Sesión de 30 días: hoy la sesión queda abierta mientras se use (el refresh token de Supabase no vence solo y la cookie dura más de 30 días). El vencimiento por inactividad se configura en Supabase → Authentication → Sessions, que es de planes pagos; decidir si alcanza con el comportamiento actual.
- [ ] **Operativo:** agregar `https://<dominio>/api/auth/confirmar` y `http://localhost:3000/api/auth/confirmar` a Supabase → Authentication → URL Configuration → Redirect URLs.

## 2. PWA

- [x] ~~`manifest` e íconos (instalable en iOS y Android).~~ (`src/app/manifest.ts`, `public/icons/`)
- [x] ~~Confirmar que no hay service worker de cache.~~ No hay ninguno, a propósito.
- [ ] Probar la instalación en un iPhone y un Android reales.

## 3. Cumplimiento y onboarding

- [x] ~~Páginas de términos de uso y privacidad.~~ (`/terminos`, `/privacidad`)
- [ ] **Completar `[CORREO DE CONTACTO]`** en los textos legales (`src/messages/es.json` y `en.json`, sección `legal`) antes de publicar. Revisar el texto: es una base escrita en lenguaje simple, no asesoría legal.
- [x] ~~Mensaje de bienvenida en el primer inicio de sesión (sin tour obligatorio).~~ (migración 0010)
- [x] ~~Aviso en la interfaz cuando el storage se acerque al límite del free tier.~~ (desde el 80 %; medidor en el perfil)

## 4. Personalización (parcial)

Hecho: modo claro/oscuro/automático, presets de tema como datos, foto de perfil.

- [ ] Cursor: set curado + subir imagen propia (validando tipo real).
- [ ] Iconos de la interfaz: set curado + subir imagen propia.
- [ ] Tipografía configurable.
- [ ] Aviso de contraste bajo, permitiendo continuar si se insiste.
- [ ] Colores personalizados más allá de los presets.
- [ ] `ThemeProvider` y switcher de temas (Whimsical / Retro) en el perfil.

## 5. Galería / imágenes

- [x] ~~Imágenes incrustadas en el Diario conectadas al pipeline único de `sharp`.~~ (botón «Imagen», pegar o soltar; se limpian de Storage al quitarlas o borrar la entrada)
- [ ] Probar subir, ver, ampliar y quitar una imagen del Diario con base real.
- [ ] Probar filtro por hashtag y normalización (minúsculas; solo letras, números y `_`) con base real.

## 6. Categorías

- [x] ~~Borrado de categorías: sus elementos quedan sin categoría.~~ La base ya lo hace (`on delete set null` en las cuatro tablas, migración 0001). No hay pantalla para borrar categorías: CLAUDE.md la deja fuera de la Fase 1.

## 7. Diseño (rediseño UX)

Prototipo: https://claude.ai/artifact/JE2kJ9N9H9LaSSLo4s3k4a

- [x] ~~Barra única, barra inferior en el celular, botón Crear, filtros en chips, tarjetas del Diario.~~
- [x] ~~Grabadora grande, progreso de listas, modo enfocado al escribir, pantallas de acceso.~~
- [ ] Columna lateral de filtros del Diario en escritorio.
- [ ] "Eliminar" de la ficha de pieza dentro de un menú "⋯" (hoy vive en la pantalla de edición, con confirmación).

## 8. Operativo (lo hace la usuaria, no Claude)

- [ ] Crear `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [x] ~~Aplicar migraciones en el proyecto de Supabase.~~ 0001–0011 aplicadas (0009–0011 con el conector, 2026-11-15).
- [ ] Redirect URLs de Auth (ver sección 1).
- [ ] Activar backups automáticos en Supabase.
- [ ] Desplegar en Vercel con las variables de entorno.

## 9. Seguridad (revisor de Supabase)

- [x] ~~Funciones `security definer` abiertas de más y `search_path` sin fijar.~~ (migración 0011)
- [ ] Activar "Leaked password protection" (Supabase → Authentication → Passwords): rechaza contraseñas filtradas en HaveIBeenPwned. Es un interruptor del dashboard; en el plan gratuito puede no estar disponible.

## 10. Calidad

- [x] ~~`next build` sin errores.~~
- [ ] Prueba de punta a punta con base real: crear cuenta, confirmar correo, entrar, bloqueo tras 5 fallos, recuperar contraseña, subir foto, grabar audio, listas, diario.
- [ ] Tests automatizados (hoy no hay ninguno).

## Orden sugerido

1. Operativo (sección 8) y prueba de punta a punta con base real (sección 10).
2. Completar el correo de contacto de los textos legales.
3. Fusionar `dev` en `main` y desplegar.
4. Personalización restante (sección 4).
5. Tests automatizados.
