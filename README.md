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

4. En Supabase → Authentication, crear el usuario personal (email + contraseña) con el que se va a iniciar sesión. El registro público no está expuesto en la interfaz — Fase 1 es de un solo usuario.

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
      (auth)/login/     # Login (Supabase Auth)
      (app)/             # Área protegida: diario, listas, vitrina, audio
      layout.tsx          # Layout raíz: fuentes, NextIntlClientProvider, modo claro/oscuro
      page.tsx             # Redirige a /diario o /login según sesión
    api/imagenes/        # Subida de fotos (fuera de [locale]: no tiene idioma)
    api/audio/           # Subida de notas de voz (ídem: códigos de error, no frases)
    api/perfil/foto/     # Foto de perfil, por el mismo pipeline que la Vitrina
  components/perfil/     # El panel de perfil: avatar, foto, modo, idioma
  i18n/                  # Config de next-intl (routing, navegación, mensajes por request)
  lib/audio/             # Notas de voz: validación de formato real, Storage, consultas
  lib/imagenes/          # Pipeline de imágenes: procesado con sharp, Storage, consultas
  lib/perfil/            # Perfil: nombre y foto de quien está adentro
  lib/supabase/          # Clientes de Supabase (browser y server)
  lib/temas/             # Sistema de temas: contrato, presets y modo claro/oscuro
  messages/              # Textos es.json / en.json
  proxy.ts                # Enrutamiento por idioma + refresco de sesión de Supabase
supabase/
  migrations/             # Esquema SQL (tablas, RLS, buckets de Storage)
```

Cada tabla del esquema lleva `usuario_id` y las políticas de RLS filtran por ese campo — así, aunque hoy solo hay un usuario real, el modelo de datos no necesita reescribirse si el proyecto pasa a multiusuario (Fase 2).

## Estado

Construidos: login/logout, **Diario** (editor Tiptap, categorías, búsqueda), **Listas** (tablero en una sola página), **Vitrina** (cuadrícula masonry de fotos propias, subida por lotes, hashtags y categorías), **Audio** (grabación en el navegador con tope de 10 minutos, título y categoría editables en el momento) y **Perfil** (panel lateral desde el avatar del navbar: foto, nombre, modo claro/oscuro/auto, idioma y cierre de sesión). La **Personalización** profunda (temas, colores, cursor, iconos, tipografía) aparece ahí como próxima, todavía sin construir. Navegación: barra única arriba y, en el celular, barra de secciones abajo con un botón «Crear» para empezar cualquier cosa.
