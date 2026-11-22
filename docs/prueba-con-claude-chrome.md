# Guía de prueba para Claude en Chrome — Cuarto Propio (web)

> Pásale este archivo completo a Claude en Chrome y dile:
> **«Sigue esta guía paso a paso en mi navegador. Avísame antes de cada paso que cree o borre datos, y al final dame el reporte.»**

## Contexto

**Cuarto Propio** es un espacio personal para escribir, coleccionar y archivar la vida cotidiana. Tiene cuatro módulos independientes que comparten categorías:

- **Diario**: entradas con texto enriquecido (negritas, títulos, imágenes). El título es obligatorio.
- **Listas**: checklists simples (texto + casilla), estilo tablero.
- **Vitrina**: galería de fotos propias (las fotos se llaman *piezas*, subirlas es *exhibir*), con título, descripción y hashtags.
- **Audio**: notas de voz de hasta 10 minutos.

Además: **Personalización** (temas Retro, Whimsical, Softsignal y Void; colores, letras, cursor, iconos), perfil, modo claro/oscuro, y español/inglés.

- **URL de la app:** `<PEGAR AQUÍ la URL de Vercel o http://localhost:3000>`
- **Cuenta de prueba:** la crea la usuaria durante el paso 1. No uses cuentas reales de otras personas.

## Reglas para Claude

1. **No escribas contraseñas por tu cuenta.** Si hace falta una, pídesela a la usuaria para que la escriba ella.
2. **Pregunta antes de borrar** cualquier cosa, aunque sea de prueba.
3. **No cambies nada fuera de la app** (Supabase, Vercel, GitHub). Solo observa y reporta.
4. **No inventes resultados.** Si un paso no se pudo hacer (por ejemplo, el micrófono bloqueado), anótalo como «no probado» y di por qué.
5. Después de cada bloque, di en una línea: ✅ pasó, ⚠️ pasó con detalles, o ❌ falló.
6. Si algo falla, anota: la pantalla, qué hiciste, qué esperabas, qué pasó, y el mensaje de error visible o de la consola del navegador (F12 → Console).

## Qué es normal (para no reportar falsas alarmas)

- Las **pantallas públicas** (landing, términos, privacidad) son estáticas y rápidas.
- La app **no funciona sin internet**: es a propósito, no hay modo offline.
- El **cursor propio** solo se ve con mouse o trackpad; en un celular no existe y esa sección no aparece.
- Los **atajos 1–4** del menú «Crear» solo se muestran con mouse.
- Un correo de confirmación puede tardar o caer en spam.
- El texto legal todavía puede decir `[CORREO DE CONTACTO]` hasta que la usuaria lo complete.

---

## Bloque 1 — Acceso

1. Abre la URL sin sesión. Debe verse la **landing** con el probador de temas.
2. En el probador, cambia de tema y letra. Pulsa «Crear mi cuarto con …»: debe llevar a `/registro`.
3. **Crear cuenta:** mientras se escribe la contraseña deben verse los requisitos (8 caracteres, una letra, un número). Prueba una contraseña débil: no debe dejar enviar.
4. Registra la cuenta de prueba con la usuaria. Debe avisar que se envió un correo de verificación **sin revelar** si el correo ya existía.
5. La usuaria abre el correo y pulsa el enlace. Debe entrar a la app **y el cuarto debe abrir con el tema elegido en la landing**.
6. Cierra sesión. Intenta abrir `/es/listas` sin sesión: debe mandarte al login, y al entrar volver a Listas.
7. **Bloqueo:** con el correo de prueba, equivócate de contraseña 5 veces seguidas. A la sexta debe aparecer un bloqueo temporal (15 minutos). Anota el mensaje exacto.
8. **Recuperar contraseña:** pide el enlace, ábrelo y define una nueva. Comprueba que entra con la nueva.
9. Revisa `/terminos` y `/privacidad`: deben abrirse sin sesión.

## Bloque 2 — Bienvenida y perfil

1. En una cuenta nueva debe salir un mensaje de **bienvenida una sola vez**. Recarga: no debe repetirse.
2. Toca el avatar: se abre un panel lateral. Revisa que tenga foto de perfil, nombre editable, correo, modo claro/oscuro/automático, idioma, enlace a Personalización, medidor de espacio y cerrar sesión.
3. Cambia el **nombre** y comprueba que se guarda al recargar.
4. Sube una **foto de perfil** (JPG/PNG/WebP). Debe verse en el avatar.
5. Sube un archivo que **no sea imagen** (por ejemplo un PDF renombrado a .jpg): debe rechazarlo con un mensaje claro.
6. Cambia el **idioma a English**: toda la interfaz cambia, y lo escrito no. Vuelve a español.
7. Prueba **claro / oscuro / automático** y recarga para ver que se recuerda.

## Bloque 3 — Diario

1. Crea una entrada **sin título**: no debe guardarse y debe pedir título.
2. Crea una entrada **con título pero sin texto**: no debe guardarse y debe pedir contenido.
3. Escribe una entrada con **negrita, cursiva, título H1–H3, lista, cita y enlace**. Guarda: debe aparecer **primera** en la lista.
4. Inserta una **imagen** de tres maneras: botón «Imagen», pegándola y arrastrándola. Todas deben verse en la entrada.
5. Asigna una **categoría nueva** escribiendo un nombre. Crea otra con el mismo nombre pero distinta mayúscula (`Viajes` y `viajes`): debe ser **la misma categoría**.
6. Escribe algo y **cierra la pestaña sin guardar**. Al volver, el borrador debe recuperarse.
7. **Buscar** por una palabra y **filtrar** por categoría. Con una búsqueda sin resultados debe verse un estado vacío.
8. **Editar** la entrada y guardar: no debe duplicarse.
9. **Borrar**: debe pedir confirmación. Cancela una vez (no cambia nada) y confirma otra (se elimina).
10. En pantalla ancha (≥1024 px): debe verse la columna de filtros a la izquierda (buscador, categorías con conteo, «Sin categoría» y meses).
11. Revisa que la **fecha mostrada** corresponda a tu hora local.

## Bloque 4 — Listas

1. Crea una lista **sin nombre**: debe pedirlo.
2. Crea una lista con nombre. Crea otra con **el mismo nombre**: debe permitirlo.
3. Agrega ítems, **márcalos** (debe guardarse al instante) y recarga para confirmar.
4. **Reordena** los ítems arrastrando y con las flechas ↑/↓.
5. Elimina un ítem y una lista (ambos piden confirmación).
6. Asigna categoría a una lista y filtra por ella.
7. Una lista vacía y la sección sin listas deben mostrar un mensaje invitando a crear la primera.

## Bloque 5 — Vitrina

1. Con la vitrina vacía debe haber un mensaje invitando a exhibir la primera pieza.
2. Pulsa **Exhibir** y elige **varias fotos a la vez**. Cada una pide título (obligatorio, precargado con el nombre del archivo), descripción y hashtags **antes** de subir.
3. Hashtags: escribe `#Viajes` y `viajes`; deben ser el mismo. Prueba símbolos o espacios: solo se aceptan letras, números y guion bajo.
4. Prueba un **título de más de 100 caracteres** y una **descripción de más de 500**: deben limitarse.
5. Prueba subir un archivo que **no sea imagen**: debe rechazarse con «formato no soportado».
6. Las piezas aparecen en cuadrícula tipo Pinterest. Debajo de cada una va **solo el título**.
7. **Filtra por hashtag** y por categoría.
8. Abre una pieza (ficha de solo lectura) y usa el lápiz para **editarla** en la pantalla aparte. Verifica que «Volver a la vitrina» conserva filtros y posición.
9. **Borra** una pieza con confirmación.

## Bloque 6 — Audio

1. Con la sección vacía debe haber un mensaje de invitación.
2. Pulsa **Grabar**. El navegador pide permiso de micrófono: la usuaria lo acepta. Habla unos segundos y **Detén**.
3. Guarda **con título** y luego otra **sin título**: la segunda debe quedar con un título por defecto tipo «Audio — 15 sep, 3:42pm».
4. **Reproduce** una nota con el reproductor propio (play/pausa y barra para saltar).
5. Edita título y categoría en el momento, filtra por categoría y borra con confirmación.
6. Si es posible, deniega el micrófono en otra prueba: debe mostrar un aviso claro y no romperse.
7. No hace falta grabar 10 minutos completos; si la usuaria quiere, puede dejar correr la grabación para ver el corte automático con aviso.

## Bloque 7 — Personalización (`/personalizacion`)

1. Cambia entre los cuatro temas (Retro, Whimsical, Softsignal, Void). Cada cambio debe verse de inmediato en toda la interfaz.
2. En cada tema, cambia los **seis colores** y las **dos letras**. Cambia de tema y vuelve: **cada tema debe conservar lo suyo**.
3. Elige colores con **contraste muy bajo**: debe avisar del problema de accesibilidad pero dejar guardar.
4. Usa «Volver a las letras del tema» para restablecer.
5. **Cursor** (solo en computador con mouse): elige uno del set y comprueba que se ve sobre enlaces y botones. En un celular esta sección no debe aparecer.
6. Sube un **cursor propio** o un **icono propio**: uno válido se aplica; uno inválido se rechaza con mensaje claro.
7. Recarga y confirma que todo se mantiene. Si hay otro dispositivo, confirma que también allí.
8. Revisa el **color de las categorías** en los chips de cada módulo y que crear una categoría nueva no cambie el color de las demás.
9. Recorre las cinco pantallas (Diario, Listas, Vitrina, Audio, Personalización) en **Softsignal** y **Void**, en claro y oscuro, buscando textos ilegibles, cosas cortadas o desbordes.

## Bloque 8 — Responsive y rendimiento

1. Abre las herramientas de desarrollo (F12) y activa la vista de celular. Prueba **360, 390 y 412 px de ancho**.
2. En cada pantalla comprueba que **no haya scroll horizontal**, que no se corten botones (por ejemplo «Eliminar») y que los botones se puedan tocar con comodidad.
3. En celular debe verse la **barra de secciones abajo** con «Crear» levantado en el centro. Al abrir «Crear» deben salir las cuatro opciones: Escribir, Exhibir, Grabar, Nueva lista.
4. Mide a ojo la carga inicial: la landing y la primera pantalla de la app deben sentirse **por debajo de 3 segundos**.
5. En la pestaña Network, comprueba que la Vitrina use **miniaturas** (archivos livianos) y no la versión completa en la cuadrícula.

## Bloque 9 — Seguridad básica (solo observar)

1. Con la sesión cerrada, intenta abrir `/es/diario`, `/es/vitrina`, `/es/audio` y `/es/personalizacion`: todas deben redirigir al login.
2. En la consola (F12 → Console) y en el código de la página, **no debe aparecer ninguna llave secreta** (`service_role` o similar). La llave `anon` de Supabase sí es pública y es normal.
3. Si la usuaria tiene una **segunda cuenta de prueba**, comprueba que **no se vea nada de la primera** (entradas, fotos, audios, listas).

---

## Formato del reporte final

Entrega esto al terminar:

**Resumen:** una línea con el estado general (por ejemplo «7 de 9 bloques sin problemas»).

**Tabla por bloque:**

| Bloque | Resultado | Notas |
|---|---|---|
| 1 Acceso | ✅ / ⚠️ / ❌ / no probado | … |
| … | … | … |

**Fallos** (uno por cada ❌ o ⚠️):

- **Dónde:** pantalla y URL
- **Qué hice:** pasos exactos
- **Qué esperaba:**
- **Qué pasó:**
- **Error visible o de consola:**
- **Gravedad:** bloquea el lanzamiento / molesta / detalle

**No probado:** lista de pasos que no se pudieron hacer y por qué.

**Lo más urgente de arreglar antes de desplegar:** máximo 3 puntos.
