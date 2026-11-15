# Pendientes — para seguir en otro chat

Última revisión: 2026-11-15 · rama revisada: `dev` (sobre `639ffd8`, más la actualización de dependencias)

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

## Estado de `dev`

- 22 commits por delante de `main`, sin commits propios en `main`: la fusión no tiene conflictos.
- `tsc --noEmit`, `eslint` y `next build` pasan sin errores.
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

1. **Probar todo con la base real** (sección 1). Es lo más importante: casi nada de lo último se probó con datos de verdad.
2. **Operativo pendiente** (sección 2): Redirect URLs de Auth, backups y el correo de contacto de los textos legales.
3. **Fusionar `dev` en `main` y desplegar en Vercel.**
4. ~~Revisar las alertas de `npm audit`~~ (hecho; quedan 10 moderadas de herramientas, sección 4).
5. ~~Tests automatizados~~ (unitarios hechos; falta la prueba de punta a punta, sección 5).
6. **Diseño pendiente** (sección 3): Fairy, la columna de filtros del Diario en escritorio y otros detalles.

## 1. Probar con la base real

- [ ] **Acceso:** crear cuenta y confirmar el correo; entrar; equivocarse 5 veces seguidas y ver el bloqueo; recuperar la contraseña. Los correos necesitan antes las Redirect URLs de la sección 2.
- [ ] **Diario:** escribir con formato; subir, ver, ampliar y quitar una imagen (pegada, arrastrada y con el botón); comprobar que el título vacío no deja guardar; comprobar que el borrador se recupera si se cierra la pestaña.
- [ ] **Vitrina:** exhibir varias fotos, filtrar por hashtag y comprobar la normalización (minúsculas; solo letras, números y `_`).
- [ ] **Audio:** grabar, cortar a los 10 minutos y reintentar una subida fallida.
- [ ] **Listas:** crear, marcar, reordenar y borrar.
- [ ] **Personalización:** elegir cada tema; guardar colores (y ver el aviso de contraste); cambiar las letras; subir un cursor y un icono propios. Comprobar que todo se mantiene al recargar y en otro dispositivo.
- [ ] **Softsignal y Void en todas las pantallas** (Listas, Vitrina, Audio, editor, ficha de pieza, perfil, ventanita de Crear), en celular y escritorio, claro y oscuro. Estas pantallas solo se revisaron con capturas de una página de prueba, no con datos reales.
- [ ] **Bienvenida:** sale una sola vez en una cuenta nueva.
- [ ] **Medidor de espacio:** se ve en el perfil.
- [ ] **PWA:** instalar la app en un iPhone y en un Android.

## 2. Operativo (lo hace la usuaria)

- [ ] **Redirect URLs de Auth.** Sin esto no funcionan los correos de confirmar cuenta ni recuperar contraseña. En Supabase → Authentication → URL Configuration → Redirect URLs, agregar:
  - `https://<dominio>/api/auth/confirmar`
  - `http://localhost:3000/api/auth/confirmar`
- [ ] **Correo de contacto:** completar `[CORREO DE CONTACTO]` en los textos legales (`src/messages/es.json` y `en.json`, sección `legal`) y releerlos. Son una base en lenguaje simple, no asesoría legal.
- [ ] **Backups:** activar los backups automáticos en Supabase.
- [ ] **Vercel:** desplegar con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] **Contraseñas filtradas** (opcional): activar "Leaked password protection" en Supabase → Authentication → Passwords. Puede no estar en el plan gratuito.
- [ ] **Sesión de 30 días:** decidir si alcanza el comportamiento actual. Hoy la sesión queda abierta mientras se use. El vencimiento por inactividad se configura en Supabase → Authentication → Sessions, que es de planes pagos.

## 3. Diseño pendiente

- [ ] **Fairy:** diseñar el tema (pastel soñado, cursiva, brillos), primero en Claude Design. Está reservado en `TEMAS_PLANEADOS`.
- [ ] **Softsignal y Void en el resto de las pantallas:** si hace falta, ajustarlos donde algo no se vea bien. Saldrá de la prueba de la sección 1.
- [ ] **Filtros del Diario en escritorio:** columna lateral, como en el prototipo. Hoy usa los mismos chips que el celular.
- [ ] **Ficha de pieza:** pasar "Eliminar" a un menú "⋯". Hoy vive en la pantalla de edición, con confirmación.

## 4. Mantenimiento

- [x] ~~**`npm audit` (críticas y altas):**~~ resuelto: Next 16.3.5 → 16.4.6 (crítica), y `npm audit fix` sin `--force` para `sharp`, `zod` y `source-map-js` (altas). `tsc`, `eslint` y `next build` pasan.
- [ ] **`npm audit` (10 moderadas que quedan):** `minimatch` (solo herramientas de lint) y `postcss-selector-parser` (vía `@tailwindcss/typography`, solo en el build). Arreglarlas exige `--force` con cambios mayores; dejarlas hasta que salga una versión compatible. **No** correr `npm audit fix --force`.
- [ ] **Rama `claude/gracious-tesla-3amhrb` en GitHub:** no salió de la sesión que construyó todo esto. Solo tiene un commit con este mismo archivo de pendientes; ya está cubierto por `dev`, se puede borrar.
- [ ] **Respaldo local de estilos del login:** si quedó un `git stash` con estilos viejos del login en la computadora de la usuaria, borrarlo (`git stash drop`) una vez confirmado que la pantalla nueva está bien.

## 5. Calidad

- [x] ~~**Tests unitarios:**~~ con Vitest (`npm test`, 56 tests): categorías (color, resolver, filtro), audio (formato real por bytes, duración y límites), pipeline de imágenes (formato real, tamaños, avatar, EXIF), título del Diario (`src/lib/diario/titulo.ts`, función pura sacada de las Server Actions), contraseña, configuración del tema, contraste y hashtags. Archivos `*.test.ts` junto al código. Vitest 5 con `@types/node` 22 (Vitest 3 traía 2 alertas críticas de `tinypool`).
- [ ] **Prueba de punta a punta (Playwright):** el script ya está (`e2e/flujo.spec.ts`, `playwright.config.ts`, `npm run e2e`; escritorio y celular). Con cuenta de prueba ya confirmada: `E2E_EMAIL=... E2E_PASSWORD=... npm run e2e`. Verificado aquí solo lo que no necesita sesión (ruta privada y contraseña incorrecta); **falta correr y ajustar los de con sesión** (Diario, borrador, Listas, secciones, cerrar sesión) con la base real: los selectores del botón de perfil y de «Empezar» son una suposición. Pendiente agregar: Vitrina, Audio y Personalización.

## Ya resuelto (para no volver a preguntarlo)

- **Borrar una categoría:** sus elementos quedan sin categoría. Lo hace la base (`on delete set null`). No hay pantalla para borrar categorías, porque CLAUDE.md la deja fuera de la Fase 1.
- **Modo offline:** no hay service worker, a propósito. La Fase 1 no tiene modo offline.
- **Retro por defecto:** es el tema por defecto, con la interfaz en Inter por legibilidad. La letra pixelada en toda la interfaz se elige en Personalización → Tipografía.
- **Void reemplaza a Emo:** el tema "Emo" que estaba reservado queda cubierto por Void.
- **Error `Invalid Refresh Token`:** al levantar la app no es un fallo del código. Es una sesión vieja guardada en el navegador y se va al iniciar sesión de nuevo.
