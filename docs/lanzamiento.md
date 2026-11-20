# Arquitectura de lanzamiento

Qué le falta a Cuarto Propio para lanzarse y sentirse intuitiva, ordenado por las fases del roadmap. Las tareas se marcan en [`pendientes.md`](./pendientes.md); este documento explica el porqué y la evidencia.

Auditoría del 2026-11-16 sobre `dev` (commit `b2e67d9`).

## Cómo se revisó

- `next build` pasa sin errores con el código actual.
- La app se levantó en producción contra un **Supabase simulado en memoria** y se recorrió en celular (360 px): landing, acceso, las cuatro secciones, fichas, edición, perfil y Personalización. Sin errores de página.
- Se probaron comportamientos concretos: guardar sin texto, guardar con el servidor caído, fechas en otra zona horaria, editor con teclado, entrada larga.
- Se consultó el proyecto real de Supabase en modo lectura: migraciones aplicadas y avisos de seguridad y rendimiento. No se leyó contenido.

**No cubre:** RLS con dos cuentas, políticas de Storage, correos reales ni un celular físico. Eso sigue siendo la sección 1 de `pendientes.md`.

## Fase 1 — Lo que bloquea el lanzamiento

Cinco cosas impiden lanzar aunque el resto esté listo. Ninguna estaba en `pendientes.md`.

### 1. Las subidas grandes van a fallar en Vercel

Fotos, audio, imágenes del diario y de Personalización pasan por rutas API. Vercel rechaza con error 413 toda petición de más de **4,5 MB**, en cualquier plan. El código permite 25 MB de imagen y 50 MB de audio (`src/lib/imagenes/limites.ts`, `src/lib/audio/limites.ts`), topes que en producción no se alcanzan nunca.

- **Audio:** el navegador grabó 0,92 MB por minuto. Una nota de más de ~4 min 50 s no se guarda; una de 10 minutos pesa ~9,2 MB.
- **Fotos:** una foto de celular pesa normalmente entre 3 y 12 MB.
- **Lo que vería la usuaria:** "No se pudo guardar", con un Reintentar que falla siempre. En la computadora local funciona, por eso no se nota hasta desplegar.

| Tipo | Cambio recomendado | Resultado |
| --- | --- | --- |
| Audio | Grabar a ~32 kbps (`audioBitsPerSecond`), suficiente para voz | 10 min ≈ 2,4 MB |
| Imágenes | Reducir en el navegador a ~2560 px antes de subir | Normalmente < 2 MB, y sube más rápido con datos móviles |
| Ambos | Bajar los topes del código al límite real | El aviso "pesa demasiado" aparece cuando corresponde |

Reducir en el navegador no pierde nada: la versión completa que guarda la app ya es de ~2000 px. El pipeline único de `sharp` y la validación del tipo real quedan igual.

### 2. El diario pierde lo escrito si falla el guardado

Comprobado: con título y texto escritos y el servidor caído, aparece la pantalla de error; al reintentar, el formulario vuelve vacío y sin borrador que restaurar.

La causa está en `entrada-form.tsx:135`: el borrador local se borra al **enviar**, no al confirmar el guardado. Además el aviso dice "Lo que guardaste sigue a salvo", que aquí no es cierto. Es el caso más probable en un celular con mala señal, y el peor posible para un diario.

Solución: borrar el borrador solo cuando la entrada ya existe, y que la acción devuelva el error al formulario en vez de lanzarlo, para que el texto siga en pantalla con un botón de reintentar.

### 3. Cualquiera puede bloquear una cuenta ajena

El bloqueo de 15 minutos tras 5 fallos se cuenta **por correo**, y la función `registrar_fallo_login` se puede llamar sin iniciar sesión (migración 0009, confirmado por el aviso de seguridad de Supabase). Quien conozca el correo de una usuaria puede llamarla cinco veces y dejarla fuera, y repetirlo cada 15 minutos sin límite.

Solución: registrar los fallos solo desde el servidor (con la clave secreta, que ya se usa en `scripts/`) y quitarle el permiso a `anon`; o contar por correo **y** dirección IP.

### 4. Los correos de registro no van a llegar

El correo incluido en Supabase envía 2 mensajes por hora y solo a direcciones del equipo del proyecto. Sin un proveedor SMTP propio, nadie más que tú recibe la confirmación de cuenta ni el enlace de recuperar contraseña. Las Redirect URLs que ya están en `pendientes.md` no alcanzan.

Con registro abierto hay un segundo riesgo: cualquier cuenta nueva puede llenar el 1 GB compartido de Storage. `uso_storage()` ya mide el uso por cuenta; falta usarla como tope en las rutas de subida.

### 5. El plan gratuito de Supabase no trae backups

`pendientes.md` pide "activar los backups automáticos". En el plan gratuito no existen: empiezan en Pro (25 USD/mes). Además, un proyecto gratuito se pausa tras una semana sin actividad y hay que reanudarlo a mano.

| Opción | Costo | Qué cubre |
| --- | --- | --- |
| Copia semanal con GitHub Actions (`pg_dump` cifrado) | 0 USD | La base; los archivos de Storage necesitan copia aparte |
| Plan Pro | 25 USD/mes | Backups diarios, sin pausas, sesión de 30 días configurable |
| Aceptar el riesgo | 0 USD | Nada |

Recomiendo la primera mientras el uso sea personal, más una tarea diaria que haga una consulta mínima para evitar la pausa. Es decisión tuya porque toca el objetivo de 0 USD/mes.

## Fase 1 — Intuitividad y experiencia

La navegación inferior, el botón Crear, la bienvenida y las zonas de toque de 44 px ya resolvieron lo más grueso. Queda esto, medido en 360 px:

| Hallazgo | Evidencia | Arreglo |
| --- | --- | --- |
| Eliminar queda fuera de pantalla | La ficha de una entrada mide 379 px y la de edición 402 px | Dejar que la fila de fecha, categoría y botones se parta en dos |
| Las fechas salen un día corridas | Una entrada del 15 nov a las 21:30 (UTC−5) aparece como día 16 | Pasar la zona horaria del navegador a `next-intl` |
| La barra de formato se pierde al escribir | Tras 40 líneas queda 1.295 px arriba; Guardar sí sigue visible | Barra pegada bajo el encabezado |
| Se guarda una entrada sin texto | Con solo título se creó; el criterio de aceptación pide rechazarla | Validar el contenido en la acción |
| Textos cortados sin forma de leerlos | 3 de 4 nombres de lista, 3 de 4 títulos de audio, el título al editar | Campos que crecen en varias líneas, como los ítems |
| Controles chicos que quedaron | Casilla 20×20, agarre de ítems 20×28, selectores de color 16×16 | Agrandar la zona de toque |
| La barra del editor no responde al teclado | Enter sobre "Negrita" no hace nada | Agregar `onClick` además de `onMouseDown` |
| Categorías duplicadas por mayúsculas | "Viajes" y "viajes" son dos; no hay forma de corregirlas | Comparar sin distinguir mayúsculas |
| El micrófono se corta si se apaga la pantalla | No se pide mantenerla encendida al grabar | Wake Lock mientras se graba; probar en iPhone |

Rendimiento en la base: Supabase avisa en las 8 tablas que la política de RLS evalúa `auth.uid()` fila por fila; se corrige con `(select auth.uid())`. `diario/queries.ts` cita una migración que haría eso, pero no existe.

## Fase 1 — Orden recomendado

1. Bloqueos 1, 2 y 3 (código y una migración).
2. SMTP, Redirect URLs y decisión de backups (lo haces tú).
3. Tabla de experiencia, de arriba hacia abajo.
4. Prueba con la base real y en celular, incluida RLS con dos cuentas.
5. Fusionar en `main` y desplegar.

## Fase 2 — Qué dejar preparado

No se construye nada todavía. Estas decisiones de Fase 1 evitan rehacer trabajo:

- **RLS probado con dos cuentas.** Con registro público, la app ya es multiusuario en seguridad.
- **Tope de storage por cuenta**, base de los límites por usuario.
- **Zona horaria por usuaria**, necesaria para cualquier búsqueda por fecha.
- **Copias de seguridad funcionando** antes de que haya datos de más personas.

## Fase 3 — Qué dejar preparado

- **Borrado de cuenta** con limpieza de archivos, que hoy no existe.
- **Registro de errores sin contenido**: hoy los errores solo van a la consola del navegador.
- **Correo propio con dominio**, que también sirve para avisos de plan.

## Fuentes

- [Límites de Vercel Functions](https://vercel.com/docs/functions/limitations)
- [Precios y límites de Supabase](https://supabase.com/pricing)
- [SMTP de Supabase Auth](https://supabase.com/docs/guides/auth/auth-smtp)
- [RLS: llamar funciones con `select`](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
