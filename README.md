# Cuarto Propio

Espacio personal para escribir, coleccionar y archivar la vida cotidiana: diario/blog con categorías, listas personalizables, galería de fotografía propia y notas de audio.

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

   O bien pegar el contenido de `supabase/migrations/0001_init.sql` y `0002_storage.sql`, en ese orden, en el SQL Editor del dashboard de Supabase.

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
      (app)/             # Área protegida: diario, listas, galería, audio, ajustes
      layout.tsx          # Layout raíz: fuentes, NextIntlClientProvider
      page.tsx             # Redirige a /diario o /login según sesión
  i18n/                  # Config de next-intl (routing, navegación, mensajes por request)
  lib/supabase/          # Clientes de Supabase (browser y server)
  messages/              # Textos es.json / en.json
  middleware.ts           # Enrutamiento por idioma + refresco de sesión de Supabase
supabase/
  migrations/             # Esquema SQL (tablas, RLS, buckets de Storage)
```

Cada tabla del esquema lleva `usuario_id` y las políticas de RLS filtran por ese campo — así, aunque hoy solo hay un usuario real, el modelo de datos no necesita reescribirse si el proyecto pasa a multiusuario (Fase 2).

## Estado

Base del proyecto: routing con idiomas, login/logout con Supabase Auth, layout protegido y esquema de base de datos. Los módulos (diario, listas, galería, audio, personalización) están como placeholders — se construyen uno por uno a partir de aquí.
