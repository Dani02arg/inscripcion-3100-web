# Plan 005 — Verificación de Correo Electrónico

**Spec:** `specs/005-email-verify/spec.md` (Estado: **aprobada**, verificada antes de escribir este plan).
**Estado del plan:** **aprobado** el 2026-10-22, con las decisiones D1 a D14 aceptadas y revisado el 2026-10-22 tras las respuestas de la auditoría (D13 rectificada; D15 a D18 agregadas).
**Cambio 2026-10-23:** la spec 006 (RF-18) reemplaza el destino de éxito `/home` por `/login`; se actualizan D7, D17 y las referencias de este plan. La implementación se ajusta en T8 de la spec 006.

## 1. Resumen de la solución

1. El registro, ante un 2xx válido, extrae `data.id` y `data.email`, guarda un
   **registro pendiente** en una cookie httpOnly y redirige a `/verify-email`.
2. `/verify-email` es un Server Component: lee la cookie y, si existe, muestra el correo
   enmascarado y el formulario; si no existe, muestra el estado vacío con acceso a
   `/register`.
3. El formulario (Client Component) maneja cinco casillas con avance, retroceso y pegado,
   y un botón de envío con indicador de carga que se habilita al completar el código.
4. El Server Action lee el identificador **de la cookie** (nunca del formulario), valida el
   código y llama a `POST /api/auth/verify-email` con `{ user_id, code }`.
5. Éxito: borra la cookie, devuelve `success`, el botón se pinta de verde con el ícono
   `ico-verify` (sin texto y con nombre accesible) y a los 1,5 s el cliente navega a
   `/login`.
6. Rechazo: mensaje junto al código, casillas vacías, foco en la primera, pendiente intacto.
7. Reenvío: Server Action que lee el correo de la cookie y llama a
   `POST /api/auth/resend-code` con `{ email, type: "REGISTER" }`; al aceptar, reescribe la
   cookie con el instante habilitado a 45 s, que sobrevive a la recarga, y el cliente
   muestra la cuenta atrás y los intentos restantes sobre 5 por día.

## 2. Decisiones técnicas

| # | Decisión | Alternativa descartada | Por qué |
|---|---|---|---|
| D1 | Registro pendiente en cookie httpOnly `verify_pending` (`path=/`, `sameSite=lax`, `secure` en producción, `maxAge` 7 días). | `localStorage` o `sessionStorage`. | RF-21 prohíbe exponer id/correo en URL, historial y consola; con almacenamiento del navegador el id sería legible por JavaScript y el POST saldría del cliente, contra la constitución #4 y #6. |
| D2 | La cookie se escribe en el Server Action de registro y se borra con una acción de cierre que el cliente invoca al terminar la confirmación, justo antes de navegar. | Borrarla dentro de la acción de verificación. | `cookies()` solo se modifica en Server Actions o Route Handlers, y el identificador queda en el servidor. Si la acción de verificación la borra, Next re-renderiza la ruta, el formulario se desmonta y el verde de RF-9 no llega a verse (verificado con el servicio simulado el 2026-10-23). |
| D3 | El identificador de la verificación se lee de la cookie, no de un campo oculto. | Campo oculto en el formulario. | Evita alteraciones desde el DOM y cumple RF-21; el formulario solo aporta el código. |
| D4 | `maxAge` de 7 días. | Cookie de sesión. | RF-18 exige sobrevivir al cierre del navegador; una cookie de sesión no lo hace. Siete días es un techo técnico conservador, muy superior a la vigencia esperada del código. |
| D5 | Cinco casillas controladas por un único Client Component, con la lógica de manipulación extraída a funciones puras. | Cinco componentes con estado propio. | Una sola fuente de verdad, pegado y teclado simples, lógica verificable sin DOM. Es la decisión del usuario (casillas OTP). |
| D6 | Envío explícito con `useActionState`; botón deshabilitado con `pending` y spinner. | Auto-envío al quinto dígito. | Decisión del usuario; además evita envíos accidentales y permite corregir el código. |
| D7 | El pase a `/login` ocurre en el cliente 1,5 s después del éxito (`router.push`). | `redirect()` dentro del Server Action. | RF-9 exige que el verde con el ícono se vea; `redirect()` corta la respuesta antes de pintarlo. |
| D8 | El resultado de la API distingue **rechazo** (hubo respuesta HTTP) de **falla de transporte** (sin respuesta). | Un único tipo de error, como en el registro. | RF-10 exige vaciar el código ante un rechazo y RF-12 exige conservarlo ante un fallo de conexión o demora. |
| D9 | Tolerancia de respuesta: 2xx sin cuerpo o con `errors` vacío o ausente = éxito; 2xx con `errors` no vacío = rechazo; cuerpo no JSON no vacío = falla. | Exigir siempre `{ data, message, errors }`. | Las dudas abiertas de la spec no fijan la forma; la regla acepta 200 y 204 sin confundir un 2xx válido con un error. |
| D10 | Se reutilizan `getApiMessage` e `isRecord` ya exportados por `app/lib/api/auth.ts`; el mapeo de errores de verificación es propio (`{ code }`). | Generalizar `extractErrors` con genéricos. | Una ruta con una sola clave no justifica tocar el parser del registro y arriesgar los 27 tests existentes. |
| D11 | Sin `loading.tsx` ni `error.tsx` en la ruta. | Crearlos en esta spec. | Se mantiene la excepción temporal ya registrada en spec 004 (T23); el estado de carga es local al botón y no son requisitos de la spec 005. |
| D12 | Sin dependencias nuevas. | Librería de OTP o de máscaras. | RNF-7 y constitución #8; la lógica cabe en funciones puras de pocas líneas. |
| D13 | Un registro rechazado **descarta cualquier pendiente anterior**, incluido el de una cuenta ya creada. | Conservar el pendiente anterior. | RF-2 lo exige explícitamente (respuesta C1 de la auditoría del 2026-10-22); la spec es la fuente de verdad. |
| D14 | Solo un 422 (o un cuerpo con `errors`) se considera rechazo del código; 429, 401, 403, 3xx, 5xx, red, timeout y cuerpo ilegible conservan el código y muestran aviso general. | Vaciar el código ante cualquier respuesta no exitosa. | RF-10 habla de que el servicio rechace el código; un 500 no invalida el código y borrarlo obligaría a pedir otro. |
| D15 | La espera de reenvío es de 45 s y se guarda en la cookie del pendiente (`resendAvailableAt`), no solo en memoria. | Contador local que se reinicia al recargar. | RF-16 exige que sobreviva a la recarga; el límite real lo impone el servicio (respuesta A9). |
| D16 | El aviso de reenvío informa los intentos restantes sobre un máximo de 5 por día; si la respuesta no trae el dato, se muestra el máximo. | Ocultar la cuota. | RF-25; el origen del número queda como duda abierta. |
| D17 | El éxito navega a `/login` desde la spec 006 (RF-18); el verde muestra solo el ícono `ico-verify`, con nombre accesible. | `/home` (comportamiento anterior) o texto "Correo verificado". | Decisión del usuario (C9 y A4), actualizada por la spec 006; RNF-1 y RNF-8 se cumplen con el nombre accesible. |
| D18 | Un código vencido se trata como rechazo especial: aviso de vencimiento, casillas vacías y oferta de reenvío, sin descartar el pendiente. | Tratarlo como falla genérica. | RF-24; la detección exacta en la respuesta queda como duda abierta. |

## 3. Archivos a crear y modificar

| Archivo | Tipo | Responsabilidad | Requisitos |
|---|---|---|---|
| `app/lib/verification/types.ts` | Tipos | `PendingRegistration`, `VerifyFieldErrors`, `VerifyActionState`, `ResendActionState`. | RF-1, RF-10, RF-12, RF-15 |
| `app/lib/verification/pending-value.ts` | Puro | Serializar, parsear y extraer el registro pendiente, incluido el instante de reenvío disponible. | RF-1, RF-2, RF-16, RF-18, RF-19, RF-22 |
| `app/lib/verification/pending.ts` | Servidor | Leer, escribir, actualizar y borrar la cookie httpOnly del registro pendiente. | RF-1, RF-2, RF-16, RF-18, RF-19, RF-20, RF-21 |
| `app/lib/verification/code.ts` | Puro | Normalizar, completar, pegar y validar el código de 5 dígitos. | RF-5, RF-11 |
| `app/lib/verification/mask-email.ts` | Puro | Enmascarar el correo para mostrarlo. | RF-3, RNF-4 |
| `app/lib/api/verify-email.ts` | Servidor | `verifyEmail` y `resendVerificationCode`: URL base, timeout, cabeceras, normalización de la respuesta y clasificación del vencimiento. | RF-8, RF-12, RF-13, RF-14, RF-24 |
| `app/lib/actions/verify-email.ts` | Servidor | `verifyEmailAction` y `resendVerificationAction`; leen la cookie, persisten la espera de reenvío y traducen el resultado a estados. | RF-7 a RF-10, RF-12, RF-14 a RF-17, RF-20, RF-24 |
| `app/verify-email/page.tsx` | Server Component | Ruta pública, metadata, navbar, tarjeta, estado vacío o formulario. | RF-3, RF-4, RF-26, RNF-5, RNF-6 |
| `app/ui/auth/verify-email-form.tsx` | Client Component | Casillas, teclado, pegado, botón con spinner y verde, bloqueo durante el envío, aviso de vencimiento, reenvío y cuenta atrás. | RF-5 a RF-7, RF-9 a RF-11, RF-15 a RF-17, RF-23 a RF-26, RNF-1, RNF-2, RNF-8 |
| `app/lib/actions/auth.ts` | Modificar | Extraer el pendiente de la respuesta y guardarlo antes de redirigir; descartarlo si el registro falla; aviso si faltan `id` o `email`. | RF-1, RF-2, RF-19, RF-22 |
| `tests/verification/pending-value.test.ts` | Prueba | Serialización, parseo, extracción y espera de reenvío. | RF-1, RF-2, RF-16, RF-18, RF-19, RF-22 |
| `tests/verification/code.test.ts` | Prueba | Normalización, dígitos, pegado y foco. | RF-5, RF-11 |
| `tests/verification/mask-email.test.ts` | Prueba | Reglas de enmascarado. | RF-3, RNF-4 |
| `tests/api/verify-email.test.ts` | Prueba | Contratos HTTP de verificación y reenvío, incluido el vencimiento. | RF-8, RF-12, RF-13, RF-14, RF-24 |

**No se crean ni modifican** `app/lib/api/auth.ts` (`getApiMessage` e `isRecord` ya se
exportan), `app/lib/api/config.ts`, `app/lib/validation/register.ts` ni
`app/ui/auth/register-form.tsx`.

**Assets:** ninguno nuevo: se usa `public/icons/ico-verify.svg`, que ya existe (se sirve como `/icons/ico-verify.svg`).

## 4. Contratos

### 4.1 Registro pendiente

- Cookie: `verify_pending`; valor
  `encodeURIComponent(JSON.stringify({ userId, email, resendAvailableAt }))`, con
  `resendAvailableAt` en milisegundos desde la época (ausente o `0` = reenvío habilitado).
- Validación al leer: objeto con `userId` y `email` de tipo texto, `userId` no vacío y de
  hasta 128 caracteres, `email` con `@` y hasta 254, y `resendAvailableAt` numérico o
  ausente. Cualquier desvío se trata como "sin pendiente" (RF-4) y no rompe la vista.
- Escritura: solo tras un 2xx con `id` y `email` utilizables; reemplaza el valor anterior y
  deja el reenvío habilitado (RF-19).
- Reenvío aceptado: se reescribe la cookie con el mismo `userId` y `email` y
  `resendAvailableAt = ahora + 45 s` (RF-16, D15).
- Borrado: al cerrar la confirmación de éxito, antes de navegar a `/login` (RF-9, RF-20, D2), y
  en el registro rechazado (RF-2, D13). No se borra en el rechazo del código ni en la falla de
  transporte.
- La cookie no es de sesión: sobrevive al cierre del navegador (RF-18).

### 4.2 Verificación (HTTP)

| Elemento | Valor |
|---|---|
| Método y URL | `POST` a `${LARAVEL_API_URL}/api/auth/verify-email`. |
| Cuerpo | `{ "user_id": "<id conservado>", "code": "<5 dígitos>" }`. |
| Cabeceras | `Content-Type: application/json` y `Accept: application/json`. |
| Credenciales | `credentials: omit`; sin cookies ni `Authorization`. |
| Caché | `no-store`. |
| Redirecciones | `redirect: manual`; un 3xx es respuesta inesperada. |
| Timeout | 10 segundos con `AbortSignal.timeout` (RNF-3). |

| Respuesta | Clasificación | Efecto |
|---|---|---|
| 2xx sin cuerpo | Éxito | Verde con ícono y pase a `/login`. |
| 2xx con `errors` vacío o ausente | Éxito | Verde con ícono y pase a `/login`. |
| 2xx con `errors` no vacío | Rechazo | Mensaje, casillas vacías, foco en la primera. |
| 422 | Rechazo | Mensaje y, si viene, error de la clave `code`. |
| 422 con aviso de vencimiento | Rechazo por vencimiento | Aviso de vencimiento, casillas vacías y reenvío ofrecido. |
| 429, 401, 403, 3xx, 5xx | Falla | Aviso general, código conservado. |
| Red o timeout | Falla | Aviso general, código conservado, botón restablecido. |
| Cuerpo no JSON no vacío | Falla | Aviso general, pendiente conservado. |

### 4.3 Reenvío (HTTP)

`POST` a `${LARAVEL_API_URL}/api/auth/resend-code` con
`{ "email": "<correo conservado>", "type": "REGISTER" }`, mismas cabeceras, credenciales,
caché, redirecciones y timeout. Éxito: 2xx; rechazo: 422 o `errors` no vacío; falla: resto.
El cuerpo no incluye el identificador. Al aceptar se reescribe la cookie con
`resendAvailableAt = ahora + 45 s` (D15) y la vista informa los intentos restantes sobre
5 por día, usando el dato del servicio si viene (D16).

### 4.4 Estados de las acciones

| Estado | Cuándo | Qué muestra la vista |
|---|---|---|
| `idle` | Estado inicial. | Formulario limpio, botón deshabilitado. |
| `rejected` | 422 o `errors` no vacío. | Mensaje del servicio junto al código, casillas vacías, foco en la primera. |
| `failed` | 3xx, 4xx distintos de 422, 5xx, red, timeout o cuerpo ilegible. | Banner general, código conservado, botón restablecido. |
| `expired` | 422 o `errors` con aviso de vencimiento. | Aviso de que el código venció, casillas vacías y reenvío ofrecido. |
| `missing` | La cookie desapareció entre la carga y el envío. | Aviso de verificación no disponible y acceso a `/register`. |
| `success` | Verificación confirmada. | Botón verde con el ícono `ico-verify` y nombre accesible; a los 1,5 s, `/login`. |

Reenvío: `idle`, `sent` (aviso, cuenta atrás de 45 s persistida e intentos restantes sobre
5 por día), `failed` (banner y reintento tras la espera) y `missing` (mismo aviso que la
verificación).

## 5. Lógica pura y firmas

| Función | Comportamiento |
|---|---|
| `parsePendingRegistration(raw)` | Devuelve el pendiente válido (incluido `resendAvailableAt`) o `null`; tolera `undefined`, JSON roto, campos faltantes y tipos incorrectos. |
| `serializePendingRegistration(pending)` | Devuelve el valor de cookie codificado. |
| `extractPendingRegistration(data)` | Extrae `id` y `email` de `data` (desconocido) y devuelve `null` si no son utilizables (RF-22). |
| `maskEmail(email)` | Conserva el primer carácter del local y el sufijo desde el último punto del dominio, y reemplaza el resto por `***`: `andres@gmail.com` queda `a***@g***.com`; una entrada inválida queda `***`. |
| `normalizeCode(value)` | Deja solo dígitos y recorta a 5. |
| `setDigit(digits, index, char)` | Reemplaza un dígito y devuelve una cadena nueva de hasta 5. |
| `applyPaste(digits, text, startIndex)` | Descarta todo lo que no sea dígito, reparte desde la casilla activa y conserva como máximo los primeros cinco. |
| `nextFocusIndex(digits, index)` | Indica la casilla que recibe el foco tras escribir o borrar. |
| `isCompleteCode(value)` | Verdadero solo con exactamente 5 dígitos. |
| `resendWaitMs(pending, now)` | Milisegundos que faltan para habilitar el reenvío; 0 si no hay espera. |

## 6. UI, accesibilidad y responsive

- Estructura equivalente a `/register`: `Navbar`, `main`, contenedor `pt-28`, tarjeta
  `w-[97%] md:w-[95%]`.
- Correo enmascarado como contexto, sin campo para escribirlo (RF-3).
- Orden: casillas, botón de verificación centrado debajo y, más abajo, el reenvío con el
  aviso de intentos restantes sobre 5 por día (RF-23, RF-25).
- Cinco `input` de un dígito: `inputMode="numeric"`, `maxLength=1`,
  `autoComplete="one-time-code"` solo en la primera, etiqueta "Dígito N de 5",
  `aria-invalid` y `aria-describedby` hacia el error cuando corresponde. Avance al
  escribir, retroceso al borrar, flechas para moverse y pegado que descarta espacios,
  guiones y letras y conserva los primeros cinco dígitos (RF-5).
- Botón `type="submit"` deshabilitado hasta completar los 5 dígitos, con `aria-busy`
  mientras verifica y texto e ícono de carga; durante el envío se bloquean las casillas y
  el reenvío (RF-6, RF-7, RNF-2).
- Éxito: fondo verde con el ícono `ico-verify` únicamente y nombre accesible; el contraste
  del ícono sobre el verde se mide y debe superar 4.5:1 (RNF-1, RNF-8).
- Reenvío: botón secundario con cuenta atrás de 45 s que sobrevive a la recarga y aviso
  `role="status"` con los intentos restantes sobre 5 por día (RF-16, RF-25).
- Código vencido: aviso de vencimiento y oferta de reenvío (RF-24).
- Estado vacío: título, explicación y enlace a `/register` (RF-4, RF-26).
- Responsive de 320 px a 1920 px sin desplazamiento horizontal (RNF-5).
- `metadata` propia de la ruta (RNF-6).

## 7. Trazabilidad

| Requisito | Artefacto principal | Prueba |
|---|---|---|
| RF-1 | `actions/auth.ts`, `pending.ts` | E2E-1 |
| RF-2 | `actions/auth.ts`, `pending.ts` (D13) | Unit `pending-value`, E2E-1, E2E-15 |
| RF-3 | `page.tsx`, `mask-email.ts` | Unit `mask-email`, E2E-1 |
| RF-4 | `page.tsx` | E2E-6 |
| RF-5 | `code.ts`, `verify-email-form.tsx` | Unit `code`, E2E-4 |
| RF-6 | `verify-email-form.tsx` | E2E-1 |
| RF-7 | `verify-email-form.tsx` | E2E-2 |
| RF-8 | `actions/verify-email.ts`, `api/verify-email.ts` | Unit `verify-email`, E2E-2 |
| RF-9 | `actions/verify-email.ts`, `verify-email-form.tsx` | E2E-2 |
| RF-10 | `actions/verify-email.ts`, `verify-email-form.tsx` | E2E-3 |
| RF-11 | `code.ts`, `verify-email-form.tsx` | Unit `code`, E2E-1 |
| RF-12 | `api/verify-email.ts`, `verify-email-form.tsx` | Unit `verify-email`, E2E-7 |
| RF-13 | `api/verify-email.ts` | Unit `verify-email` |
| RF-14 | `actions/verify-email.ts`, `api/verify-email.ts` | Unit `verify-email`, E2E-5 |
| RF-15 | `verify-email-form.tsx` | E2E-5 |
| RF-16 | `pending-value.ts`, `pending.ts`, `actions/verify-email.ts`, `verify-email-form.tsx` (D15) | Unit `pending-value`, E2E-5 |
| RF-17 | `verify-email-form.tsx` | E2E-5 |
| RF-18 | `pending.ts` (D4) | E2E-8 |
| RF-19 | `actions/auth.ts`, `pending.ts` | E2E-9 |
| RF-20 | `actions/verify-email.ts`, `pending.ts` | E2E-2 |
| RF-21 | `pending.ts` (D1, D3) | E2E-10 |
| RF-22 | `pending-value.ts`, `actions/auth.ts` | Unit `pending-value` |
| RF-23 | `verify-email-form.tsx` | E2E-1, E2E-13 |
| RF-24 | `api/verify-email.ts`, `verify-email-form.tsx` | Unit `verify-email`, E2E-14 |
| RF-25 | `verify-email-form.tsx` | E2E-5 |
| RF-26 | `page.tsx` | E2E-6, E2E-10 |
| RNF-1 | `verify-email-form.tsx` | E2E-11 |
| RNF-2 | `verify-email-form.tsx` | E2E-2, E2E-12 |
| RNF-3 | `api/verify-email.ts` | Unit `verify-email` |
| RNF-4 | `mask-email.ts` | Unit `mask-email` |
| RNF-5 | `page.tsx`, `verify-email-form.tsx` | E2E-13 |
| RNF-6 | `page.tsx` | Inspección del `head` en E2E |
| RNF-7 | `package.json` sin cambios | Revisión de `git diff` |
| RNF-8 | `verify-email-form.tsx` | E2E-2 y medición de contraste |

## 8. Estrategia de tests

### 8.1 Unitarios con el runner nativo (sin dependencias)

- `pending-value`: ida y vuelta de serialización; valor `undefined`; JSON roto; tipos
  incorrectos; `id` o `email` faltantes o vacíos; `email` sin `@`; longitudes excedidas;
  `resendAvailableAt` válido, ausente y no numérico; `resendWaitMs` con espera pendiente,
  vencida y sin dato; `extractPendingRegistration` con `data` válido, con `id` numérico,
  sin `email` y con `data` no objeto.
- `code`: normalización con espacios, guiones, letras y exceso de dígitos; pegado con
  espacios, guiones y letras (`ab12cd34ef5` → `12345`); reemplazo por casilla; pegado
  desde el inicio y desde una casilla intermedia; foco en los bordes; completitud exacta.
- `mask-email`: correo normal, local de un carácter, subdominios, dominio de dos niveles,
  entrada sin `@` y cadena vacía.
- `verify-email`: método, URL, cabeceras, credenciales, caché, redirecciones, timeout,
  cuerpo con `user_id` y `code`; éxito 200 y 204; 2xx con `errors`; 422 con `code`, con
  mensaje general y con aviso de vencimiento; 429, 403, 500, 3xx; cuerpo no JSON; error de
  red; timeout; variable de entorno faltante. Reenvío: cuerpo con `email` y `type`, sin
  `user_id`, y los mismos códigos.

### 8.2 E2E con Brave headless por CDP y servicio simulado en `:8000`

1. Registro aceptado: llega a `/verify-email` con correo enmascarado, cinco casillas y
   botón deshabilitado; la cookie es httpOnly.
2. Código correcto: el botón muestra el indicador, se bloquean casillas y reenvío, aparece
   el verde con el ícono y sin texto, a los 1,5 s se navega a `/login` y la cookie
   desaparece; al volver a `/verify-email` se ve el estado vacío.
3. Código incorrecto: mensaje junto al código, casillas vacías, foco en la primera, botón
   normal y el pendiente sigue en pie tras recargar.
4. Pegado `12-345`, `12 34 5` y `ab12cd34ef5`: se descarta lo que no sea dígito y se
   conserva `12345` en las cinco casillas.
5. Reenvío: el servicio recibe `{ email, type: "REGISTER" }` sin identificador; aviso de
   enviado con cuenta atrás de 45 s e intentos restantes sobre 5 por día; al recargar, la
   espera sigue vigente; con error, banner y reintento tras la espera.
6. Acceso directo sin cookie: estado vacío con acceso a `/register`.
7. Servicio caído: banner, código conservado y botón restablecido.
8. Cierre y reapertura del navegador con el mismo perfil: el pendiente sigue disponible.
9. Dos registros seguidos: el pendiente se reemplaza por el más reciente.
10. La URL no lleva identificador ni correo y `document.cookie` no expone el pendiente.
11. Teclado y árbol de accesibilidad: cinco casillas etiquetadas, flechas, borrado, Enter
    y botón con estado ocupado.
12. Doble activación del botón: una sola solicitud.
13. Responsive en 320, 375, 768 y 1440 px sin desplazamiento horizontal; orden casillas →
    botón centrado → reenvío; medición de contraste del ícono sobre el verde y del botón
    deshabilitado.
14. Código vencido: aviso de vencimiento, casillas vacías y reenvío disponible.
15. Registro fallido con un pendiente previo: el pendiente anterior desaparece y
    `/verify-email` muestra el estado vacío.

### 8.3 Comandos

```
node --experimental-strip-types --test tests/validation/register.test.ts tests/api/parse.test.ts tests/api/auth.test.ts tests/api/verify-email.test.ts tests/verification/pending-value.test.ts tests/verification/code.test.ts tests/verification/mask-email.test.ts
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

El build debe mostrar `/verify-email` como ruta dinámica, porque lee cookies en cada
petición.

## 9. Riesgos y límites

- **Forma real de las respuestas**: las dudas abiertas de la spec siguen sin resolverse;
  D9 y D14 dejan el sistema tolerante y los tests fijan la interpretación. Si el backend
  confirma otra forma, se ajusta primero la spec.
- **Destino del éxito actualizado**: desde la spec 006 (RF-18) el éxito lleva a `/login`;
  `/login` ya existe y se elimina la salida provisional a `/home` (D7, D17). La
  implementación de la spec 005 se ajusta en T8 de la spec 006.
- **Cookies desactivadas**: sin cookie no hay verificación posible; se muestra el estado
  vacío.
- **HTTPS en producción**: `secure` impide que la cookie viaje por HTTP; el despliegue
  debe usar HTTPS.
- **Doble pestaña**: la segunda envía con un identificador ya verificado y recibe el
  mensaje del servicio (EC-6).
- **Navegación sin recarga**: tras el éxito no queda rastro del identificador; volver
  atrás muestra el estado vacío.
