# Pendientes de la Fase 1

Última revisión: 2026-11-15 · rama revisada: `origin/dev` (commit `7346499`)

> **Regla de trabajo:** cada vez que se revise el estado del proyecto, primero
> se hace `git fetch` y se analiza `origin/dev` (diff contra `main`, `tsc`,
> `eslint`), y se actualiza este archivo: tachar lo terminado, agregar lo nuevo
> y cambiar la fecha y el commit de arriba.

## Estado de `origin/dev`

- 9 commits por delante de `main`, sin commits propios en `main` (fusión sin conflictos).
- `tsc --noEmit` y `eslint`: sin errores. `next build` y pruebas con base real: **no verificados**.
- Construido: login/logout, Diario, Listas (tablero), Vitrina (galería con pipeline `sharp`), Audio, Perfil (foto, idioma, modo claro/oscuro), presets de tema, migraciones 0001–0008.

## 1. Autenticación (bloqueante)

- [ ] Pantalla pública "Crear cuenta" con verificación de email obligatoria.
- [ ] Mensaje genérico si el email ya existe (no revelar si hay cuenta).
- [ ] Recuperar contraseña: solicitud ("Olvidé mi contraseña") y pantalla de restablecimiento.
- [ ] Rate limiting de login: bloqueo de 15 min tras 5 intentos fallidos.
- [ ] Verificar sesión de 30 días con "recordar sesión" activo por defecto.

## 2. PWA

- [ ] `manifest` e íconos (instalable en iOS y Android).
- [ ] Confirmar que no hay service worker de cache (Fase 1 no incluye offline).

## 3. Cumplimiento y onboarding

- [ ] Páginas de términos de uso y privacidad (antes de desplegar en URL pública).
- [ ] Mensaje de bienvenida en el primer inicio de sesión (sin tour obligatorio).
- [ ] Aviso en la interfaz cuando el storage se acerque al límite del free tier.

## 4. Personalización (parcial)

Hecho: modo claro/oscuro/automático, presets de tema, foto de perfil.

- [ ] Cursor: set curado + subir imagen propia (validando tipo real).
- [ ] Iconos de la interfaz: set curado + subir imagen propia.
- [ ] Tipografía configurable.
- [ ] Aviso de contraste bajo, permitiendo continuar si se insiste.
- [ ] Colores personalizados más allá de los presets.

## 5. Galería / imágenes

- [ ] Imágenes incrustadas en el Diario conectadas al pipeline único de `sharp`.
- [ ] Probar filtro por hashtag y normalización (minúsculas; solo letras, números y `_`).

## 6. Categorías

- [ ] Borrado de categorías: sus elementos quedan sin categoría (no se borran ni se bloquea).

## 7. Operativo (lo hace la usuaria, no Claude)

- [ ] Crear `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Aplicar migraciones 0002–0008 en el proyecto de Supabase.
- [ ] Activar backups automáticos en Supabase.
- [ ] Desplegar en Vercel con las variables de entorno.

## 8. Calidad

- [ ] `next build` sin errores.
- [ ] Prueba de punta a punta con base real: login, subir foto, grabar audio, listas, diario.
- [ ] Tests automatizados (hoy no hay ninguno).

## Orden sugerido

1. Fusionar `dev` en `main`.
2. Autenticación (sección 1).
3. Términos, privacidad y bienvenida (sección 3).
4. PWA (sección 2).
5. Personalización restante (sección 4).
6. Aviso de storage y borrado de categorías.
7. Build, prueba con base real y tests (sección 8).
