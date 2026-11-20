# Cuarto Propio

Espacio personal para escribir, coleccionar y archivar la vida cotidiana: diario/blog con categorías, listas personalizables, vitrina de fotografía y arte propio, y notas de audio.

El contexto completo del producto (decisiones ya tomadas, modelo de datos, roadmap) vive en [`CLAUDE.md`](./CLAUDE.md).

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Auth + Storage) · next-intl · Tiptap · sharp.

## Setup local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear un proyecto en [Supabase](https://supabase.com) y copiar `.env.example` a `.env.local`, completando con las credenciales del proyecto (Project Settings → API):

   ```bash
   cp .env.example .env.local
   ```

3. Aplicar el esquema de base de datos. Con la [Supabase CLI](https://supabase.com/docs/guides/cli):

   ```bash
   supabase link --project-ref <tu-project-ref>
   supabase db push
   ```

   O bien pegar el contenido de `supabase/migrations/0001_esquema_completo.sql` en el SQL Editor del dashboard de Supabase y ejecutarlo una sola vez.

4. En Supabase → Authentication → URL Configuration, agregar `http://localhost:3000/api/auth/confirmar` a las Redirect URLs (y la del dominio real al desplegar). La cuenta se crea desde la propia app, en `/registro`, y se confirma con el correo que manda Supabase. En Authentication → Emails, reemplazar las plantillas de «Confirm signup» y «Reset password» por las de `supabase/templates/` (en español y con enlaces que funcionan en cualquier dispositivo).

5. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abrir [http://localhost:3000](http://localhost:3000).

## Estructura del proyecto

```
src/
  app/
    [locale]/
      (auth)/            # Acceso: entrar, crear cuenta, recuperar y restablecer contraseña
      (app)/             # Área protegida: diario, listas, vitrina, audio, personalización
      layout.tsx          # Layout raíz: fuentes, NextIntlClientProvider, modo claro/oscuro
      page.tsx             # Redirige a /diario o /login según sesión
    api/imagenes/        # Subida de fotos (fuera de [locale]: no tiene idioma)
    api/audio/           # Subida de notas de voz (ídem: códigos de error, no frases)
    api/perfil/foto/     # Foto de perfil, por el mismo pipeline que la Vitrina
    api/diario/imagen/   # Imágenes incrustadas del diario (mismo pipeline)
    api/personalizacion/ # Cursor e iconos propios
    api/auth/confirmar/  # Destino de los enlaces de los correos de Supabase
  components/perfil/     # El panel de perfil: avatar, foto, modo, idioma
  i18n/                  # Config de next-intl (routing, navegación, mensajes por request)
  lib/audio/             # Notas de voz: validación de formato real, Storage, consultas
  lib/imagenes/          # Pipeline de imágenes: procesado con sharp, Storage, consultas
  lib/perfil/            # Perfil: nombre y foto de quien está adentro
  lib/supabase/          # Clientes de Supabase (browser y server)
  lib/temas/             # Temas: contrato, presets, colores derivados, CSS generado, modo claro/oscuro
  messages/              # Textos es.json / en.json
  proxy.ts                # Enrutamiento por idioma + refresco de sesión de Supabase
supabase/
  migrations/             # Esquema SQL (tablas, RLS, buckets de Storage)
```

Cada tabla del esquema lleva `usuario_id` y las políticas de RLS filtran por ese campo — así, aunque hoy solo hay un usuario real, el modelo de datos no necesita reescribirse si el proyecto pasa a multiusuario (Fase 2).

## Pruebas

```bash
npm test
```

Tests unitarios con Vitest (archivos `*.test.ts` junto al código). La prueba de punta a punta (`npm run e2e`, Playwright) necesita una cuenta de prueba: ver `docs/pendientes.md`.

## Estado

La Fase 1 está construida: **acceso** (entrar, crear cuenta, recuperar contraseña, bloqueo tras 5 intentos fallidos), **Diario** (editor Tiptap con imágenes incrustadas, categorías, búsqueda), **Listas** (tablero en una sola página), **Vitrina** (cuadrícula masonry de fotos propias, subida por lotes, hashtags y categorías), **Audio** (grabación en el navegador con tope de 10 minutos), **Perfil** (panel lateral: foto, nombre, modo claro/oscuro/auto, idioma) y **Personalización** (cuatro temas con nombre —Retro, Whimsical, Softsignal y Void—, cada uno con sus propios colores y letras, más cursor e iconos). También: PWA instalable, términos y privacidad, bienvenida y aviso de espacio.

Lo que falta es probar con datos reales y desplegar: la lista está en [`docs/pendientes.md`](./docs/pendientes.md). El análisis del estado y el plan de mejoras de Personalización, en [`docs/analisis-y-plan.md`](./docs/analisis-y-plan.md).
