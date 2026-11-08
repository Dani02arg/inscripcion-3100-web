# Plan 004 — Registro de Usuarios

**Spec:** `specs/004-auth-register/spec.md` (aprobada; dudas abiertas)
**Plan:** aprobado; cambio de Fase I aprobado el 2026-10-21.
**Alcance:** RF-1 a RF-27, RNF-1 a RNF-8 y EC-1 a EC-18.
**Fuera de alcance:** `/verify-email`, login, recuperación de contraseña, autenticación automática, perfil, reglas posteriores al alta y `loading.tsx`/`error.tsx` de la ruta, que se implementarán después.

## 1. Decisiones resueltas

| ID | Decisión | Resolución |
|---|---|---|
| D1 | Aprobar el plan. | Aprobado con revisión previa; T1 no inicia hasta revisar el plan actualizado. |
| D2 | Tipografía e idioma. | Se mantiene Geist y `lang="en"`; excepción aprobada a RNF-1 y deuda de idioma registrada. |
| D3 | Contraste de errores. | Texto principal más borde e icono rojo; sin HEX nuevos. |
| D4 | Recorte de espacios (EC-9). | Se recortan los campos de texto; la contraseña no se recorta. |
| D5 | Destino `/verify-email`. | Se acepta el 404 temporal hasta implementar esa vista. |
| D6 | Runner de pruebas. | `node --experimental-strip-types --test`, sin dependencias nuevas. |

## 2. Arquitectura y archivos

Formulario, Server Action, capa de API y Laravel. La capa de API normaliza `{ data, message, errors }`; el éxito redirige a `/verify-email` y el error vuelve al formulario.

| Archivo y ubicación | Tipo | Responsabilidad | Requisitos |
|---|---|---|---|
| `app/register/page.tsx` | Server Component | Ruta pública, `Navbar`, contenedor, tarjeta, ancho responsive y metadata. | RF-1, RF-24, RNF-8 |
| `app/ui/auth/register-form.tsx` | Client Component | Campos controlados, orden y distribución visual, validación, envío, errores y carga. | RF-2 a RF-21, RF-25 |
| `app/ui/auth/text-field.tsx` | Presentacional | Input etiquetado con ayuda, error accesible y espacio para un control adjunto. | RNF-2, RNF-3 |
| `app/ui/auth/password-input.tsx` | Client Component | Visibilidad, complejidad y protección contra pegado/autocompletado. | RF-3, RF-4, RNF-5, EC-4, EC-5, EC-16 |
| `app/ui/auth/birthdate-picker.tsx` | Client Component | Input editable con máscara, bloqueos, edad, icono de calendario, estado del modal y salida ISO. | RF-12 a RF-14, RF-26, RF-27, EC-6, EC-7, EC-13, EC-14, EC-17 |
| `app/ui/auth/birthdate-calendar-modal.tsx` | Client Component | Modal de calendario, foco, Escape, overlay y selección de fecha. | RF-12, RF-13, RF-27, RNF-2, RNF-3 |
| `app/lib/validation/register.ts` | Lógica pura | Tipos, normalización, validadores, edad, máscara/parseo de fecha, payload y parseo. | RF-3, RF-5 a RF-14, RF-22, RF-26, EC-14, EC-15, EC-16, EC-17 |
| `app/lib/api/auth.ts` | Servidor | `POST` a Laravel, timeout y normalización de la respuesta. | RF-15, RF-17 a RF-19, RF-22, RF-23 |
| `app/lib/api/config.ts` | Servidor | Resuelve y valida la URL base del API desde `LARAVEL_API_URL`, sin valor por defecto en el código. | RF-28, EC-19 |
| `app/lib/actions/auth.ts` | Server Action | `FormData`, revalidación, llamada a la API, redirección y estado. | RF-6, RF-15 a RF-20, RF-22, RF-23 |
| `tests/validation/register.test.ts` | Test | Validadores, fechas, máscara/parseo de fecha y payload. | Verificación |
| `tests/api/auth.test.ts` | Test | Cliente HTTP con `fetch` simulado. | Verificación |
| `tests/api/parse.test.ts` | Test | Parseo de respuestas y mapeo de errores. | Verificación |
| `package.json`, `pnpm-lock.yaml` | Modificar | `react-day-picker@10.0.2`; transitivas `date-fns` y `@date-fns/tz`. | RNF-6 |

La tabla anterior es la fuente única de nombres y ubicaciones. No se tocan `app/lib/api-client.ts` (su contrato 422 no sirve para errores por campo), `app/ui/footer.tsx`, `app/ui/navbar.tsx`, `app/ui/icon-button.tsx` (fuera de alcance; el submit usa un botón propio), `app/metadata.ts` (la ruta define su metadata), `app/layout.tsx` ni `app/globals.css` (se mantiene Geist y `lang="en"`; excepción D2 a RNF-1 y deuda de idioma registrada).

## 3. Validación y contrato API

### 3.1 Payload exacto y reglas de validación

| Clave | Regla |
|---|---|
| `dni` | 7 u 8 dígitos. |
| `cuil` | 11 dígitos; los guiones se quitan para validar y enviar. |
| `name`, `lastname` | Recortados, al menos 2 caracteres no blancos. |
| `email` | Recortado, formato de correo válido. |
| `password` | Entre 8 y 16 caracteres, con al menos una minúscula, una mayúscula y un número o carácter especial; sin emojis y sin recortar. |
| `user_phone` | 10 dígitos; sin prefijo +54. |
| `birthdate` | `YYYY-MM-DD`; hoy y el futuro bloqueados; al menos 18 años. |

`confirmPassword` existe en el formulario y en la validación, pero no se envía.

- DNI, CUIL y teléfono se sanitizan a dígitos mientras se escribe; el CUIL conserva guiones en pantalla y el teléfono rechaza el prefijo +54.
- La fecha se construye con partes locales y se valida con ida y vuelta estricta. Se rechazan fechas imposibles como 2023-02-29. Para personas nacidas el 29 de febrero, en años no bisiestos el 28 de febrero cuenta como un año más, igual en cliente y servidor. Se muestra como DD/MM/YYYY y se envía como YYYY-MM-DD.
- El input de fecha es editable por teclado: acepta solo dígitos, inserta las barras de DD/MM/YYYY mientras se escribe y conserva internamente el valor ISO. Una fecha incompleta o imposible no es válida para el envío. El calendario no se abre al enfocar, escribir o hacer clic en el campo; solo se abre desde el icono adyacente.
- La confirmación no puede estar vacía ni formada solo por espacios y debe coincidir exactamente, incluidas mayúsculas y minúsculas. Cliente y servidor comparten `validateRegisterInput`; el servidor siempre revalida.
- La contraseña exige entre 8 y 16 caracteres, al menos una minúscula, una mayúscula y un número o carácter especial; no admite emojis ni pegado o autocompletado. No lleva máximo de 16 para que el caso de 17 caracteres muestre el error de EC-4.
- El formulario tiene nueve controles: los ocho campos del payload y la confirmación; la confirmación no se envía. Los mensajes propios son en español; los mensajes del backend se muestran tal como llegan.

### 3.2 Contrato HTTP

| Elemento | Valor |
|---|---|
| Método y URL | `POST` a `${LARAVEL_API_URL}/api/auth/register`; sin valor por defecto en el código. Variable de servidor. |
| Cabeceras | `Content-Type: application/json` y `Accept: application/json`. |
| Credenciales | `credentials: omit`; sin cookies ni `Authorization`. |
| Caché | `no-store`. |
| Redirecciones | `redirect: manual`; un 3xx es respuesta inesperada. |
| Timeout | 10 segundos con `AbortSignal.timeout`. |
| Cuerpo | JSON con las ocho claves de la tabla anterior. |

`Accept: application/json` hace que Laravel devuelva los errores de validación como JSON en lugar de una redirección o HTML.

La URL base se resuelve en cada petición con `getApiBaseUrl()` (`app/lib/api/config.ts`): prioridad al `baseUrl` explícito que usan los tests, luego `process.env.LARAVEL_API_URL`. Se recorta el valor, se exige una URL absoluta `http`/`https` y se quita la barra final. Si falta, está vacía o es inválida, `registerUser` no llama a `fetch`, deja el detalle en la consola del servidor y devuelve un aviso general sin perder los datos del formulario (EC-19). No hay valor por defecto en el código: el valor de desarrollo se declara en `.env`, documentado en `.env.example`.

| Respuesta | Resultado |
|---|---|
| 2xx sin errores | Éxito: redirección a `/verify-email`. |
| 2xx con errores no vacíos | Error. |
| 422 con errores por campo | Mensajes junto a cada campo. |
| 422 con errores generales | Banner general. |
| 401, 403, 429 o 5xx | Banner general. |
| 3xx | Respuesta inesperada; banner general. |
| Error de red o timeout | Banner general y reintento sin perder valores. |
| Cuerpo no JSON | Banner general. |

Los errores por campo se mapean por clave conocida; los arreglos de strings y las claves desconocidas se muestran en el banner general. `data` no se usa ni se persiste. El destino `/verify-email` mostrará un 404 temporal hasta que exista esa vista (D5).

## 4. UI, seguridad y accesibilidad

### 4.1 Página y formulario

- La ruta es pública, incluye el `Navbar` y usa un contenedor propio con padding y ancho máximo, no el 70 por ciento del home. Tarjeta de superficie, título y descripción.
- La tarjeta usa el 95 % del ancho de referencia actual en escritorio y el 97 % en móvil (RF-24): en escritorio, el máximo actual de 896 px pasa a unos 851 px; en móvil, la tarjeta ocupa el 97 % del ancho disponible. No se genera desplazamiento horizontal ni se recorta el formulario.
- Orden visual: nombre, apellido, DNI, CUIL, fecha de nacimiento, correo, teléfono, contraseña y confirmación. Una columna en móvil. En escritorio: nombre/apellido, DNI/CUIL y correo/teléfono en filas de dos columnas; fecha de nacimiento en fila propia; contraseña y confirmación en una fila de dos columnas. En móvil, contraseña y confirmación se apilan. Botones debajo.
- Inputs controlados para conservar los valores ante un error. `noValidate` con `required` y `aria-required` como semántica.
- `onSubmit` bloquea si hay errores. `isPending` deshabilita el submit, muestra "Registrando" y expone `aria-busy`; Enter envía y el doble clic no duplica.
- Foco visible y orden de tabulación natural. Tipografía: se mantiene Geist y `lang="en"`; se registran la excepción D2 a RNF-1 y la deuda de idioma. Sin assets nuevos; el toggle de contraseña usa texto.

### 4.2 Componentes

- **`TextField`:** etiqueta asociada, ayuda y errores; `aria-invalid` y `aria-describedby`.
- **`PasswordInput`:** botón `type="button"` con `aria-pressed` y etiqueta dinámica; alterna el tipo sin cambiar el valor; muestra los errores de longitud y complejidad en tiempo real; bloquea pegado y autocompletado; `autoComplete="off"`.
- **`BirthdatePicker`:** input visible editable por teclado con `inputMode="numeric"` y máscara DD/MM/YYYY; conserva el valor ISO en un input oculto `name="birthdate"`. Un botón de icono de calendario adyacente abre el modal; el calendario no se abre al enfocar, escribir o hacer clic en el campo. El modal usa `DayPicker` con locale español, `mode="single"`, matcher `after` con la fecha de hoy para bloquear hoy y el futuro; las fechas pasadas de menores son seleccionables y muestran el mensaje de edad; `defaultMonth` en la fecha seleccionada o en la fecha máxima de 18 años, `startMonth` en 1900, `endMonth` en el mes actual y `captionLayout="dropdown"`. Al seleccionar una fecha se actualiza el input y se cierra el modal. El modal no altera el layout, atrapa el foco, cierra con Escape o clic en el overlay y devuelve el foco al botón que lo abrió. El input y el modal se operan con teclado.
- **Botones:** principal `submit` azul institucional; secundario `Link` a `/login` con superficie, texto azul y borde. La vista `/login` no existe todavía; el destino queda pendiente. Ambos con foco visible y misma altura.
- **Banner y errores:** banner superior con `role="alert"`; errores de campo con `aria-live="polite"` y asociación al input. Al editar un campo se oculta su error viejo del servidor y se reevalúa el de cliente.

### 4.3 Contraste y tokens

| Uso | Token | Contraste sobre superficie | Decisión |
|---|---|---|---|
| Texto, etiquetas y ayudas | texto principal | 10.9:1 | Cumple 4.5:1. |
| Botón principal y enlaces | azul institucional | 13.6:1 | Cumple 4.5:1. |
| Borde e icono de error | error de texto y borde | 3.7:1 | Solo elementos no textuales. |
| Texto secundario | texto secundario | 3.5:1 | Solo texto grande o decorativo. |
| Acento naranja | naranja acento | 2.9:1 | Solo acentos e iconos. |
| Borde de input | borde input | 1.3:1 | Foco con borde focus, 13.6:1. |

El mensaje de error usa texto principal (10.9:1); el estado se comunica con borde rojo, icono y anuncio accesible (D3). No se introducen colores HEX nuevos. El borde normal de input no alcanza 3:1 para límites de componentes; si se exige WCAG 1.4.11, hace falta un token más oscuro aprobado por diseño.

### 4.4 Seguridad

- La llamada a Laravel no se expone al cliente; no hay `fetch` a la API en componentes cliente.
- No se registran el payload ni la contraseña en logs. La contraseña solo se muestra si el usuario activa el toggle.
- No se persisten tokens ni cookies de la respuesta; la spec excluye la autenticación automática.
- Los errores internos se transforman en mensajes genéricos; no se filtran stack traces.

### 4.5 Responsive

La vista se verifica en 320, 375, 768, 1024, 1440 y 1920 px. Es clara, sin variante de modo oscuro. La tarjeta mantiene la reducción de RF-24 y no genera scroll horizontal. El calendario deja de ocupar espacio en el documento: se muestra en un modal superpuesto, con ancho máximo limitado al viewport, scroll interno solo si hace falta y operación completa en 320 px. Contraseña y confirmación se apilan en móvil.

### 4.6 Registro de la excepción D2 (RNF-1 e idioma)

- **RNF-1:** se mantiene la tipografía Geist definida en `app/layout.tsx`; queda aprobada la excepción a la tipografía institucional.
- **Idioma:** se mantiene `lang="en"`; queda registrada la deuda de idioma para la vista `/register`.
- La vista `/register` no introduce una fuente nueva ni modifica `app/layout.tsx` o `app/globals.css`.

## 5. Trazabilidad

Evidencia: **U** tests unitarios, **API** cliente HTTP simulado, **E2E** navegador y **S** lint, tipos, build y búsquedas.

| Requisitos | Evidencia |
|---|---|
| RF-1, RF-2, RF-21 | E2E-1, E2E-2 |
| RF-3, RF-4, RF-5, RF-6 | U-1, E2E-2 |
| RF-7, RF-8, RF-9, RF-10, RF-11 | U-1 |
| RF-12, RF-13, RF-14 | U-2, E2E-3 |
| RF-15, RF-16, RF-22, RF-23 | API-1, E2E-1, E2E-6 |
| RF-17, RF-18, RF-19, RF-20 | API-2, E2E-4, E2E-5 |
| RF-24, RF-25 | E2E-7, E2E-9 |
| RF-26, RF-27 | U-3, E2E-3, E2E-9 |
| RNF-1 | Excepción aprobada D2: se mantiene Geist y `lang="en"`. |
| RNF-2, RNF-3, RNF-4, RNF-8 | E2E-7, E2E-8, E2E-9, S-1 |
| RNF-5, RNF-6, RNF-7 | S-1, API-1 |
| EC-1, EC-2, EC-3, EC-12 | API-2, E2E-4 |
| EC-4, EC-5, EC-6, EC-7, EC-8, EC-9, EC-10, EC-11, EC-13, EC-14, EC-15, EC-16, EC-17, EC-18 | U-1, U-2, E2E-2, E2E-3, E2E-5, E2E-8 |

## 6. Verificación y aceptación

Comandos: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` y `node --experimental-strip-types --test tests/validation/register.test.ts tests/api/parse.test.ts tests/api/auth.test.ts`. Los tests usan imports relativos con extensión `.ts` para el runner nativo; `tsconfig.json` habilita `allowImportingTsExtensions`.

Grupos de prueba:

- **U-1:** DNI, CUIL, teléfono sin +54, correo, nombres sin contar espacios, contraseña con complejidad y sin emojis, confirmación vacía o con distinta capitalización, payload exacto y mapeo de errores.
- **U-2:** edad, fecha máxima, hoy/futuro, 18 años, fecha pasada de menor seleccionable con mensaje, 29 de febrero con 28 de febrero en años no bisiestos, fecha mostrada DD/MM/YYYY y fechas inválidas.
- **U-3:** máscara de fecha editable: solo dígitos, barras automáticas DD/MM/YYYY, borrado, entrada incompleta, fecha imposible, conversión a ISO y conservación del valor visible.
- **API-1:** método, URL, cabeceras, credenciales, timeout, cuerpo de ocho claves y éxito.
- **API-2:** 422 con objeto y arreglo, 500, 3xx, red, timeout y cuerpo no JSON.
- **API-3:** URL base desde `LARAVEL_API_URL`: variable definida, ausente, vacía, con espacios, con barra final y sin esquema; prioridad del `baseUrl` explícito; sin llamada a `fetch` cuando la configuración es inválida.
- **E2E-1:** alta exitosa y redirección a `/verify-email`.
- **E2E-2:** validación de cliente, complejidad de contraseña, rechazo de emojis, bloqueo de pegado/autocompletado y toggle de visibilidad.
- **E2E-3:** fecha editable por teclado, bloqueos de hoy/futuro, mensaje de menor de 18, fecha DD/MM/YYYY y calendario modal.
- **E2E-4:** errores por campo, banner, red y timeout con valores conservados ante validación, error interno y conexión.
- **E2E-5:** doble envío y Enter.
- **E2E-6:** ninguna petición del navegador al API de Laravel (`LARAVEL_API_URL`).
- **E2E-7:** 320 a 1920 px sin overflow ni solapamientos.
- **E2E-8:** teclado, foco, etiquetas, anuncios y metadata.
- **E2E-9:** ancho reducido de RF-24, orden de campos, contraseña/confirmación en dos columnas, fecha editable, apertura exclusiva del calendario desde el icono, modal sin desplazamiento de layout, foco atrapado, Escape, overlay, selección y retorno de foco.
- **S-1:** lint, tipos, build y búsqueda de `any`, supresiones y `fetch` en componentes cliente.

Aceptación:

- Los RF, RNF y EC aplicables tienen evidencia; la excepción D2 de RNF-1 queda registrada.
- Los comandos de verificación terminan en verde y no hay `any` ni supresiones.
- El formulario muestra nueve controles y el payload tiene exactamente ocho claves; la fecha se muestra en `DD/MM/YYYY`, se envía en `YYYY-MM-DD` y el teléfono rechaza `+54`.
- La contraseña exige complejidad, rechaza emojis y bloquea pegado/autocompletado; el navegador no llama a Laravel.
- Los valores se conservan ante errores de validación, internos y de conexión; la contraseña no se expone.
- La vista funciona a 320 px y con teclado, sin desplazamiento horizontal.
- La tarjeta usa el 95 % del ancho de referencia actual en escritorio y el 97 % en móvil; los campos siguen el orden de RF-25 y contraseña/confirmación comparten fila en escritorio y se apilan en móvil.
- La fecha se puede editar por teclado con formato automático DD/MM/YYYY; el calendario se abre solo desde el icono, en un modal que no altera el layout, y se opera con teclado; al seleccionar una fecha el campo se actualiza y el modal se cierra.
- La URL base del API se resuelve solo de `LARAVEL_API_URL` (sin literal en el código); si falta o es inválida, el formulario muestra un aviso general, conserva los datos y no llama al servicio.
- Al cerrar: la spec queda en estado implementada.

## 7. Orden y riesgos no resueltos

1. Con D1 a D6 resueltas y el plan revisado, instalar `react-day-picker` y verificar su CSS con Next.js 16 y Turbopack.
2. Tipos, normalización, validadores, edad y payload; tests U-1 y U-2.
3. Parseo de respuestas, cliente HTTP y tests API-1 y API-2.
4. Server Action.
5. Componentes, formulario y página.
6. Tokens, responsive, accesibilidad y pruebas E2E.
7. Verificación estática y cierre.
8. Cambio de Fase I: ancho de tarjeta (RF-24), orden y fila de contraseñas (RF-25), fecha editable (RF-26) y calendario modal (RF-27); reutiliza la base de T1–T31 y agrega U-3 y E2E-9 antes de la verificación final.

| Riesgo | Mitigación |
|---|---|
| El CSS de `react-day-picker` 10.0.2 falla con Turbopack. | Verificar al inicio; probar el import desde la página o `globals.css`; si sigue fallando, evaluar 9.14.0 sin instalar el wrapper. |
| `redirect` queda atrapado por un `try/catch`. | Ejecutar la redirección fuera del bloque que captura errores de la API. |
| El calendario se desborda en 320 px. | Al estar en modal, limitar su ancho al viewport, permitir scroll interno y probar la matriz de viewports. |
| La máscara DD/MM/YYYY pierde dígitos o impide borrar. | Tratar el valor como dígitos y reconstruir las barras en cada cambio; cubrir borrado e entrada incompleta en U-3. |
| El modal no atrapa el foco o deja el fondo desplazable. | Mover el foco al modal al abrir, atrapar Tab, cerrar con Escape/overlay y devolver el foco al icono. |
| La reducción de ancho rompe el formulario en 320 px. | Verificar sin overflow con RF-24 aplicado; apilar contraseña/confirmación y permitir scroll interno en el modal. |
| El backend devuelve mensajes en inglés. | Mostrarlos tal como llegan; traducirlos es una decisión de contenido fuera de esta spec. |
| Laravel no está disponible en desarrollo. | Usar un servidor simulado en `localhost:8000` para los casos de error. |

Al cerrar la fase, actualizar `MEMORY.md` como registro operativo; no forma parte del inventario de archivos de producto.
