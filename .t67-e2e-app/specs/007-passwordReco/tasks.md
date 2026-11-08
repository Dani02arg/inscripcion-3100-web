# Tareas 007 — Recuperación de contraseña

Estado: aprobado (2026-10-25)

Spec: `specs/007-passwordReco/spec.md` (aprobada el 2026-10-25).
Plan: `specs/007-passwordReco/plan.md` (aprobado el 2026-10-25).

## Reglas de ejecución

- Una tarea por vez: primero el test, después el código, test en verde, marcar la tarea y detenerse.
- No se implementa nada fuera de la spec 007 ni del plan aprobado.
- No se instalan dependencias.
- Comandos de verificación por tarea: `pnpm exec tsc --noEmit` y `pnpm lint`.
- Al cerrar cada tarea se actualiza `MEMORY.md`.
- Los tests unitarios usan `node --experimental-strip-types --test` con imports relativos y extensión `.ts`.
- Las tareas de E2E usan `pnpm dev` con un servicio simulado en `localhost:8000`, `LARAVEL_API_URL` apuntando a él y Playwright o Chrome DevTools MCP.

## Fase A — Lógica pura

- [x] **T1. Validación del correo y payload de solicitud.** RF-2, RF-3
  - `tests/validation/password-recovery.test.ts` cubre: correo vacío, solo espacios, formato inválido y espacios exteriores.
  - `app/lib/validation/password-recovery.ts` expone tipos base, `validateRecoveryEmail` y `buildRequestPayload`.
  - Hecho cuando: los tests pasan, el correo se recorta y el payload es exactamente `{ email }`.
  - Verificado el 2026-10-25: 6/6 tests, `tsc --noEmit` limpio y lint con 0 errores (4 avisos preexistentes de `<img>`).

- [x] **T2. Validación de la nueva contraseña y su confirmación.** RF-18, RF-19, RF-33
  - Tests de 7 y 17 caracteres, sin mayúscula, sin minúscula, sin número ni especial, con emoji, confirmación vacía y distinta.
  - `validateNewPassword` reutiliza `isValidPassword` y `passwordsMatch` de `register.ts`.
  - Hecho cuando: cada caso devuelve el mensaje de la spec y no se compara con una contraseña anterior.
  - Verificado el 2026-10-25: 14/14 tests acumulados, `tsc --noEmit` limpio y lint con 0 errores (4 avisos preexistentes de `<img>`).

- [x] **T3. Validación del código y mapeo de errores del servicio.** RF-17, RF-23, RF-24, RNF-12
  - Tests de código vacío, de 4 dígitos, con letras y con ceros iniciales.
  - `validateRecoveryCode` y `mapResetFieldErrors` traducen `password_confirmation` a `passwordConfirmation`.
  - Hecho cuando: el código válido conserva ceros iniciales y un error desconocido no se pierde.
  - Verificado el 2026-10-27: 18/18 tests del archivo, `tsc --noEmit` limpio y lint con 0 errores (4 avisos preexistentes de `<img>`). `buildResetPayload` recorta solo el correo y conserva el código y las contraseñas; los errores desconocidos quedan para el aviso general del parseo de la API (T7).

- [x] **T4. Estado de la solicitud activa.** RF-9, RF-11, RF-12, RF-28, RNF-3
  - `tests/recovery/request-value.test.ts` cubre ida y vuelta, JSON inválido, tipos incorrectos, correo inválido, instante no finito y límite de 15 minutos.
  - `app/lib/recovery/request-value.ts` expone `RecoveryRequest`, `RECOVERY_TTL_MS`, `serializeRecoveryRequest`, `parseRecoveryRequest`, `isRecoveryExpired` y `maskRecoveryEmail`.
  - Hecho cuando: 14:59 no vence, 15:00 vence, un valor inválido se trata como ausencia y el correo se enmascara con el formato existente.
  - Verificado el 2026-10-27: **15/15** tests del archivo, `tsc --noEmit` limpio y lint con 0 errores (4 avisos preexistentes de `<img>`). Serialización JSON con solo `email` y `requestedAt`; parseo defensivo; instante futuro no vencido; máscara `a***@g***.com`.

- [x] **T5. Pegado del código OTP.** RF-15, RF-16
  - `tests/recovery/code.test.ts` cubre `12-345`, `12 34 5`, `ab12cd34ef5`, `00123`, menos de cinco, más de cinco, pegado en casilla intermedia y texto sin dígitos.
  - `app/lib/recovery/code.ts` expone `applyRecoveryPaste` y reutiliza los helpers de `app/lib/verification/code.ts`.
  - Hecho cuando: el resultado siempre se reparte desde la primera casilla, conserva ceros y devuelve el foco correcto.
  - Verificado el 2026-10-27: **6/6** tests del archivo, `tsc --noEmit` limpio y lint con 0 errores (4 avisos preexistentes de `<img>`). El pegado reemplaza el valor desde la primera casilla, conserva ceros iniciales y deja el foco en la siguiente vacía o en la última si el código quedó completo; sin dígitos no altera el valor.

## Fase B — Red y acciones

- [x] **T6. Parseo de la respuesta de solicitud.** RF-5, RF-6, RF-7, RF-8, RNF-12
  - Tests de `200`, `2xx` con errores, `422` de correo no registrado, `422` con otros errores, `404`, `429`, `5xx` y cuerpo inválido.
  - `parseRequestRecoveryResponse` devuelve `email_not_registered` o fallo general según corresponda.
  - Hecho cuando: ningún caso lanza excepción y el mensaje de correo no registrado se reconoce por `errors.email`.
  - Verificado el 2026-10-27: **9/9** tests del archivo, `tsc --noEmit` limpio y lint con 0 errores (4 avisos preexistentes de `<img>`). Éxito con mensaje del servicio o texto de la spec; `2xx` con errores, `429`, `5xx` y cuerpo inválido como fallo general; `404` y `422` con `errors.email` de correo no registrado como `email_not_registered`; un `422` con otro error de correo queda como fallo general con el mensaje del servicio.

- [x] **T7. Parseo de la respuesta de cambio.** RF-22, RF-23, RF-24, RF-25, RF-26, RF-27, RNF-12
  - Tests de `200`, `2xx` con errores, `422` de código inválido por mensaje y por `errors.code`, `422` con errores por campo, `422` de correo no registrado, `404`, `429`, `5xx` y cuerpo inválido.
  - `parseResetPasswordResponse` distingue `invalid_code`, `validation`, `email_not_registered` y fallo general.
  - Hecho cuando: los errores por campo quedan mapeados y un `422` mixto no pierde el mensaje principal.
  - Verificado el 2026-10-27: **21/21** tests acumulados del archivo (12 nuevos de cambio), `tsc --noEmit` limpio y lint con 0 errores (4 avisos preexistentes de `<img>`). Éxito con mensaje del servicio o texto de la spec; `invalid_code` por mensaje o `errors.code`; `validation` con `password_confirmation` traducido y los errores desconocidos en `errors`; `404` y `422` con correo no registrado normalizados; `2xx` con errores, `429`, `5xx` y cuerpo inválido como fallo general.

- [x] **T8. Cliente de solicitud de código.** RF-4, RF-5, RF-6, RF-7, RF-8, RNF-4
  - Tests de URL, método, headers, credenciales omitidas, sin caché, redirección manual, señal de timeout y cuerpo exacto.
  - `requestRecoveryCode` usa `getApiBaseUrl`, timeout de 10 segundos y `AbortSignal.timeout`.
  - Hecho cuando: `POST /api/auth/forgot-password` recibe solo `{ email }` y se distinguen timeout y error de conexión.
  - Verificado el 2026-10-27: **29/29** tests acumulados del archivo (8 nuevos), `tsc --noEmit` limpio y lint con 0 errores (4 avisos preexistentes de `<img>`). POST a `/api/auth/forgot-password` con `{ email }`, `credentials: "omit"`, `cache: "no-store"`, `redirect: "manual"`, `AbortSignal.timeout` de 10 s y headers JSON; 422/404 de correo no registrado, red, timeout, configuración ausente sin `fetch`, cuerpo inválido y 204 vacío cubiertos.

- [x] **T9. Cliente de cambio de contraseña.** RF-20 a RF-27, RNF-4
  - Tests de cuerpo exacto `{ email, code, password, password_confirmation }`, timeout, red, `404`, `422` y `5xx`.
  - `resetPassword` usa timeout de 10 segundos y no incluye la contraseña en el resultado.
  - Hecho cuando: el resultado serializado no contiene contraseña ni confirmación.
  - Verificado el 2026-10-27: **36/36** tests acumulados del archivo (7 nuevos), `tsc --noEmit` limpio y lint con 0 errores (4 avisos preexistentes de `<img>`). `POST /api/auth/reset-password` con las cuatro claves exactas, timeout de 10 s, red, timeout, `404`, `422` (código inválido y errores por campo) y `5xx` cubiertos; `JSON.stringify(result)` no contiene la contraseña ni la confirmación.

- [x] **T10. Server Action de solicitud.** RF-3, RF-4, RF-5, RF-6, RF-7, RF-8
  - `app/lib/actions/password-recovery.ts` expone `requestRecoveryAction`.
  - Revalida el correo antes de llamar al servicio y devuelve `sent`, error por campo o mensaje general.
  - Hecho cuando: `tsc --noEmit` y lint pasan y la acción no llama al servicio con un correo inválido.
  - Verificado el 2026-10-27: **5/5** tests nuevos (correo vacío e inválido sin `fetch`, éxito `sent` con correo recortado, correo no registrado junto al campo y aviso general con correo conservado), **162/162** en la suite, `tsc --noEmit` limpio y lint con 0 errores (4 avisos preexistentes de `<img>`).

- [x] **T11. Server Action de cambio.** RF-17 a RF-27, RF-31, RF-32
  - `resetPasswordAction` expone estados `success`, `invalid_code`, `validation`, `email_not_registered`, `timeout` y `error`.
  - Envía el correo del formulario y no escribe cookies ni tokens.
  - Hecho cuando: la acción no registra contraseña ni código y devuelve errores por campo cuando corresponde.
  - Verificado el 2026-10-27: **7/7** tests nuevos (validación local sin `fetch`, éxito con el contrato exacto, `invalid_code` con OTP limpio, errores por campo, `404`, timeout con el mensaje de RF-27 y fallo general), **169/169** en la suite, `tsc --noEmit` limpio y lint con 0 errores (4 avisos preexistentes de `<img>`).

- [x] **T12. Almacenamiento por pestaña.** RF-5, RF-12, RF-28, RNF-3, RNF-11
  - `app/lib/recovery/storage.ts` expone lectura, escritura, borrado, aviso de un solo consumo y guardas ante `sessionStorage` ausente o lleno.
  - No guarda código, contraseña ni confirmación.
  - Hecho cuando: `tsc --noEmit` y lint pasan y un fallo de almacenamiento se traduce en ausencia de solicitud, sin excepción.
  - Verificado el 2026-10-27: **9/9** tests nuevos (ida y vuelta con solo `email` y `requestedAt`, reemplazo, borrado, valor inválido, fallos de lectura y escritura, ausencia de almacenamiento y aviso consumido una sola vez), **178/178** en la suite, `tsc --noEmit` limpio y lint con 0 errores (4 avisos preexistentes de `<img>`).

## Fase C — UI y rutas

- [x] **T13. Campo OTP de cinco casillas.** RF-13, RF-15, RF-16, RNF-1
  - `app/ui/auth/recovery-code-field.tsx` es un Client Component controlado por props.
  - Avance, Retroceso, flechas, pegado desde la primera casilla, ceros iniciales, etiquetas "Dígito N de 5" y campo oculto del formulario.
  - Hecho cuando: `tsc --noEmit` y lint pasan y el campo no hace HTTP.
  - Verificado el 2026-10-27: `tsc --noEmit` limpio y lint con 0 errores (4 avisos preexistentes de `<img>`). Componente controlado con `value`/`onChange`, avance, retroceso, flechas, pegado desde la primera casilla, `inputMode` numérico, `autoComplete="one-time-code"` en la primera casilla, etiquetas accesibles y campo oculto con el código normalizado; no hace HTTP.

- [x] **T14. Formulario de solicitud.** RF-1 a RF-8, RF-28, RF-34, RNF-1, RNF-9
  - `app/ui/auth/request-recovery-form.tsx` con correo, validación, error por campo, banner, `aria-busy`, bloqueo de doble envío y precarga del correo.
  - En éxito guarda la solicitud, registra el aviso y navega a `/password-recovery/reset`.
  - Hecho cuando: `tsc --noEmit` y lint pasan y el formulario no hace `fetch` directo.
  - Verificado el 2026-10-27: `tsc --noEmit` limpio, lint con 0 errores (4 avisos preexistentes de `<img>`) y suite **178/178**. Usa `useActionState`, valida antes de enviar, muestra el error junto al campo y el aviso general, bloquea dobles envíos con `aria-busy`, precarga el correo desde `sessionStorage`, y al recibir `sent` guarda `{ email, requestedAt }`, registra el aviso de un solo consumo y navega a `/password-recovery/reset`; no hace `fetch` directo.

- [x] **T15. Ruta de solicitud.** RF-1, RF-30, RNF-7, RNF-8, RNF-10
  - `app/password-recovery/page.tsx` con metadata propia, `Navbar`, tarjeta y formulario.
  - `loading.tsx` y `error.tsx` del segmento.
  - Hecho cuando: `pnpm build` genera la ruta y el HTML muestra el título propio.
  - Verificado el 2026-10-27: `pnpm build` en verde con `/password-recovery` estática; el HTML contiene `<title>Recuperar contraseña | EET N° 3100</title>`, `description` y Open Graph propios. `loading.tsx` muestra un estado de carga accesible y `error.tsx` un límite con "Reintentar" y enlace a `/login`, sin detalles técnicos. `tsc --noEmit` limpio y lint con 0 errores (4 avisos preexistentes de `<img>`).

- [x] **T16. Formulario de cambio.** RF-9 a RF-29, RF-31 a RF-34, RNF-1, RNF-9
  - `app/ui/auth/reset-password-form.tsx` con correo enmascarado, aviso de un solo consumo, OTP, dos campos de contraseña con toggles y acciones.
  - Estados de solicitud ausente, vencida y vigente; estado de éxito sin redirección automática.
  - En código inválido limpia el OTP y enfoca la primera casilla conservando las contraseñas.
  - Hecho cuando: `tsc --noEmit` y lint pasan y el formulario no inicia sesión ni hace HTTP.
  - Verificado el 2026-10-27: lee `sessionStorage` al montar y resuelve los estados ausente, vencido y vigente; consume el aviso una sola vez, muestra el correo con `maskRecoveryEmail`, cinco casillas, dos `PasswordInput` con toggles independientes y "Cambiar contraseña". El envío solo ocurre por acción explícita, bloquea dobles envíos con `aria-busy` y validación local, conserva contraseñas ante código inválido y limpia/enfoca el OTP. El éxito reemplaza el formulario por "Contraseña restablecida correctamente." e "Ir a iniciar sesión" sin redirección; timeout ofrece las dos alternativas y correo no registrado ofrece volver a solicitar. No usa `fetch`, cookies ni inicio de sesión. `tsc --noEmit` limpio y lint 0 errores (4 avisos preexistentes de `<img>`).

- [x] **T17. Ruta de cambio.** RF-9, RF-10, RF-13, RNF-7, RNF-8, RNF-10
  - `app/password-recovery/reset/page.tsx` con metadata propia, `Navbar`, tarjeta y formulario.
  - `loading.tsx` y `error.tsx` del segmento.
  - Hecho cuando: `/password-recovery/reset` responde 200 sin sesión y muestra el título propio.
  - Verificado el 2026-10-27: `pnpm build` genera `/password-recovery/reset` estática; `next start` en `:3107` respondió **200** sin sesión con `<title>Cambiar contraseña | EET N° 3100</title>`, el `h1` "Cambiar contraseña" y el estado de carga del formulario. `loading.tsx` y `error.tsx` propios del segmento; `tsc --noEmit` limpio y lint 0 errores (4 avisos preexistentes de `<img>`).

- [x] **T18. Enlace desde el inicio de sesión y actualización de la spec 006.** RF-30
  - `app/ui/auth/login-form.tsx` apunta “Recuperar contraseña” a `/password-recovery`.
  - `specs/006-login/spec.md` actualiza RF-9 y el criterio de finalización.
  - Hecho cuando: el enlace navega a la pantalla de solicitud y la spec 006 ya no menciona `/home` para ese enlace.
  - Verificado el 2026-10-27: el enlace del login apunta a `/password-recovery`; clic real en Playwright con `next start` en `:3108` navegó a `/password-recovery` con título propio y 0 errores de consola. `spec.md`, `plan.md` y `tasks.md` de la spec 006 ya no mencionan `/home` para ese enlace. `pnpm build` en verde con `/login` y `/password-recovery` estáticas; `tsc --noEmit` limpio y lint 0 errores (4 avisos preexistentes de `<img>`).

## Fase D — Verificación E2E

- [x] **T19. E2E del flujo de solicitud.** RF-1 a RF-8, RNF-9
  - Cobertura de acceso, validación local, éxito, correo no registrado por `422` y `404`, fallos de red, `429`, `500`, cuerpo inválido, `2xx` con errores y doble envío.
  - Hecho cuando: cada escenario muestra el mensaje de la spec, conserva el correo y genera una sola petición.
  - Verificado el 2026-10-27: **12 escenarios E2E** con `next dev` en `:3110`, servicio simulado en `:8000`, `LARAVEL_API_URL` apuntando al mock y Chrome headless por CDP, sin dependencias nuevas. Acceso desde `/login`; correo vacío e inválido con 0 peticiones; éxito con una petición `{ email }`, aviso visible, `/password-recovery/reset`, correo `e***@e***.com` y `sessionStorage` solo con `email`/`requestedAt`; `422` y `404` con mensaje junto al campo; red, `429`, `500`, cuerpo inválido y `2xx` con errores con aviso general, correo conservado y botón habilitado; doble envío con una sola petición. **Nota operativa:** usar `http://localhost` (no `127.0.0.1`) para el `next dev`, porque Next bloquea recursos de desarrollo por origen.

- [x] **T20. E2E del OTP y de la validación del cambio.** RF-13 a RF-19
  - Cobertura de casillas, toggles, avance, Retroceso, flechas, pegado, ceros iniciales, código incompleto, política de contraseña, emoji y confirmación distinta.
  - Hecho cuando: los envíos inválidos no generan petición y el foco se comporta como indica la spec.
  - Verificado el 2026-10-27: **14 escenarios E2E** con `next dev` en `:3110`, `sessionStorage` sembrado con una solicitud activa y Chrome headless por CDP, sin dependencias nuevas. Estructura con cinco casillas `maxLength=1`, etiquetas "Dígito N de 5", `inputMode=numeric`, `one-time-code` solo en la primera, contraseñas ocultas y botón "Cambiar contraseña"; toggles independientes; avance automático y Retroceso con y sin dígito; flechas; rechazo de letras; ceros iniciales `00123`; pegado `12-345`, `12 34 5`, `ab12cd34ef5`, `00123` y parcial `12` con foco en la siguiente vacía; código incompleto, política, emoji y confirmación distinta con sus mensajes y **0 POST**. **Nota operativa:** usar `http://localhost` con `next dev` por la restricción de orígenes de desarrollo.

- [x] **T21. E2E de errores del cambio.** RF-22 a RF-27
  - Cobertura de código inválido, errores por campo, correo no registrado, `404`, red, `429`, `500`, cuerpo inválido, `2xx` con errores y timeout.
  - Hecho cuando: el código inválido limpia las casillas, el timeout muestra su mensaje con las dos alternativas y el resto conserva los valores.
  - Verificado el 2026-10-27: **10 escenarios E2E** con mock en `:8000`, `next dev` en `:3110`, `sessionStorage` sembrado y Chrome headless por CDP. Código inválido limpia las casillas, enfoca la primera y conserva las contraseñas; errores por campo se muestran junto a cada campo y el error desconocido en el banner; correo no registrado por `422` y `404` ofrece "Volver a solicitar"; red, `429`, `500`, cuerpo inválido y `2xx` con errores muestran el aviso general, conservan los valores y permiten reintentar; timeout muestra el mensaje exacto, las dos alternativas y no reintenta automáticamente. Cada escenario envió **1 POST** con el contrato exacto. **Corrección:** `resetPasswordAction` ahora conserva también los errores generales desconocidos de un `422` en el aviso; test unitario agregado. Suite **179/179**, `tsc` limpio y lint 0 errores.

- [x] **T22. E2E del éxito y de la solicitud activa.** RF-21, RF-28, RF-29, RF-31 a RF-33
  - Cobertura de éxito sin sesión, contraseña anterior inválida y nueva válida, “Volver a solicitar”, precarga, recarga, “atrás”, dos pestañas, solicitud vencida, ausencia de solicitud y ausencia de cuenta atrás.
  - Hecho cuando: no se repite el cambio, no se crea sesión y cada pestaña conserva su propio correo.
  - Verificado el 2026-10-27: **8 escenarios E2E** con mock en `:8000`, `next dev` en `:3110` y Chrome headless por CDP. Éxito con mensaje "Contraseña restablecida correctamente." y "Ir a iniciar sesión", sin redirección automática, sin cookie ni `localStorage`, con `sessionStorage` limitado a `{ email, requestedAt }`; el login real con la contraseña anterior muestra "La contraseña es incorrecta" y con la nueva llega a `/home`; "Volver a solicitar" precarga el correo, no envía peticiones y deja atrás código, contraseña y errores; recarga y "atrás" tras el éxito conservan una sola petición; dos pestañas mantienen `p***@e***.com` y `o***@e***.com` con su propio correo; solicitud vencida y ausencia muestran su aviso y la acción, sin formulario, sin peticiones y sin cuenta atrás. Suite **179/179**, `tsc` limpio y lint 0 errores. Próximo paso: T23 (accesibilidad).

## Fase E — Calidad

- [x] **T23. Accesibilidad.** RNF-1
  - Árbol de accesibilidad, etiquetas, `aria-invalid`, `aria-describedby`, `aria-live`, foco visible, orden de tabulación, teclado en el OTP y controles de 44 × 44 px.
  - Contraste AA de texto, componentes y foco.
  - Hecho cuando: el recorrido con teclado y lector de pantalla coincide con la spec y las mediciones cumplen AA.
  - Verificado el 2026-10-27: **62/62 comprobaciones** con `next dev` en `:3110` y Chrome headless por CDP sobre solicitud y cambio, en estados limpio y con errores. Árbol AX con títulos de nivel 1, correo etiquetado y requerido, grupo "Código de recuperación de 5 dígitos", cinco casillas "Dígito N de 5", contraseñas y toggles etiquetados, enlace "Volver a solicitar" y nombres accesibles; `aria-invalid` y `aria-describedby` verificados en el correo, las cinco casillas y ambas contraseñas; errores anunciados por `aria-live="polite"`/`role="alert"` y aviso por `role="status"`. Foco visible en todos los controles del flujo (anillo azul 13.58:1; anillo de error 3.19:1) y orden de tabulación correo→botón y OTP→contraseña→toggle→confirmación→toggle. Teclado OTP: avance, flechas, Retroceso con limpieza y foco; toggles operados con Espacio y `aria-pressed`. Tamaños: inputs, toggles y enlace de 44 px; OTP 48×56 px; botones 48 px y acción de solicitud ausente 50 px. Contraste: texto 10.98:1, bordes normales 4.54:1, borde de error 3.19:1 e icono de error 3.68:1. **Corrección:** `TextField` usa `min-h-11`; el toggle de contraseña usa `min-h-11 min-w-11`; el enlace "Volver a solicitar" usa `inline-flex min-h-11`. Suite **179/179**, `tsc --noEmit` limpio, lint 0 errores (4 avisos preexistentes de `<img>`) y `pnpm build` en verde. Próximo paso: T24 (responsive y privacidad).

- [x] **T24. Responsive y privacidad.** RNF-2, RNF-3, RNF-11, RNF-12
  - Sin desbordamiento horizontal en 320, 375, 768, 1024, 1440 y 1920 px.
  - URL, `document.cookie`, `localStorage`, consola y HTML sin código, contraseña ni confirmación; `sessionStorage` solo con correo e instante.
  - Hecho cuando: las mediciones y las inspecciones no encuentran datos sensibles ni desbordes.
  - Verificado el 2026-10-27: **46/46 comprobaciones** con `next dev` en `:3110`, mock en `:8000` y Chrome headless por CDP. Sin desbordamiento horizontal en 320, 375, 768, 1024, 1440 y 1920 px para solicitud limpia y con error, cambio listo, con error, sin solicitud, vencido y con éxito, menú móvil abierto en 320/375 y error largo de política en 320/375: `scrollX=0`, `scrollWidth=clientWidth` (305 px en 320; 1905 px en 1920) y 0 elementos fuera del viewport. Privacidad en solicitud y cambio: URL `/password-recovery/reset` sin query ni hash; `document.cookie` vacío; `localStorage` vacío; `sessionStorage` solo `password_recovery_request` con claves `email` y `requestedAt`; consola, URLs de red, logs de `next dev` y del mock sin código ni contraseña; HTML sin código, contraseña ni confirmación tras escribir y tras el éxito; correo visible enmascarado y correo completo no visible; respuestas `Cache-Control: no-store`. **Corrección:** React reflejaba los valores controlados en atributos `value`; `TextField` ahora acepta `inputRef`, y `PasswordInput`/`RecoveryCodeField` eliminan ese atributo con `MutationObserver`. El campo oculto del código pasó de `type="hidden"` a `type="text"` oculto para poder limpiar el atributo sin vaciar el dato del formulario. Suite **179/179**, `tsc --noEmit` limpio, lint 0 errores (4 avisos preexistentes de `<img>`) y `pnpm build` en verde. Sin dependencias nuevas. Próximo paso: T25 (verificación final y cierre).

- [x] **T25. Verificación final y cierre.** Todos los RF y RNF
  - `pnpm exec tsc --noEmit`, `pnpm lint`, suite completa, `pnpm build` y `package.json` sin dependencias nuevas.
  - Actualización de `MEMORY.md` con resultados y desviaciones.
  - Hecho cuando: todo está en verde, la spec queda como implementada y no hay deudas ocultas.
  - Verificado el 2026-10-27: `pnpm exec tsc --noEmit` limpio; `pnpm lint` con 0 errores y 4 avisos preexistentes de `<img>`; suite completa **179/179**; `pnpm build` en verde con las rutas de recuperación prerenderizadas y sin errores. `package.json` conserva las dependencias existentes y no incorpora ninguna nueva para la spec 007 (`react-day-picker` pertenece a la spec 006). La spec quedó como **implementada (2026-10-27)**, la checklist de la sección 8 de `plan.md` quedó marcada y `MEMORY.md` actualizado. Sin deudas nuevas; las limitaciones preexistentes del chrome global (navbar/footer) siguen documentadas y fuera del alcance de 007.
