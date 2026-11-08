# Tasks 005 — Verificación de Correo Electrónico

**Spec:** `specs/005-email-verify/spec.md` (Estado: implementada)
**Plan:** `specs/005-email-verify/plan.md` (Estado: aprobado el 2026-10-22 y revisado tras la auditoría)
**Estado:** Fases A–F completadas (T1–T18). Spec implementada y validada el 2026-10-23.
**Cambio 2026-10-23:** la spec 006 (RF-18) actualiza el destino de éxito de `/home` a `/login`. T7 actualizó esta documentación y T8 ajusta el código.

## Decisiones previas

- [x] **D1. Aprobar el plan.** Aprobado el 2026-10-22 con las decisiones D1–D14 y revisado con D15–D18.
- [x] **D2. Persistencia.** Registro pendiente en cookie httpOnly, nunca en almacenamiento del navegador (plan D1–D4).
- [x] **D3. Envío y éxito.** Botón explícito con spinner, verde con el ícono `ico-verify` sin texto y pase a `/login` a los 1,5 s (plan D6, D7, D17; destino actualizado por la spec 006).
- [x] **D4. Rechazo y falla.** Solo 422 o `errors` no vacío vacía el código; un registro fallido descarta el pendiente anterior (plan D13, D14).
- [x] **D5. Reenvío.** Espera de 45 s persistida en la cookie y aviso de 5 intentos por día (plan D15, D16).
- [x] **D6. Vencimiento.** Un código vencido muestra aviso y ofrece reenviar (plan D18).
- [x] **D7. Tests sin runner nuevo.** `node --experimental-strip-types --test`, sin Vitest ni Jest.
- [x] **D8. Dependencias.** Ninguna nueva (RNF-7, constitución #8).

## Fase A — Fundamentos y lógica pura

**Estado:** completada el 2026-10-22. Cubre: RF-1, RF-2, RF-3, RF-5, RF-11, RF-16, RF-18, RF-19, RF-22; RNF-4.

- [x] **T1. Definir los tipos del flujo de verificación.** RF-1, RF-10, RF-12, RF-15
  - Hecho cuando: `app/lib/verification/types.ts` exporta `PendingRegistration` (con `userId`, `email` y `resendAvailableAt`), `VerifyFieldErrors`, `VerifyActionState` y `ResendActionState`, con las variantes `idle`, `rejected`, `expired`, `failed`, `missing`, `success` y `sent`; `pnpm exec tsc --noEmit` no reporta errores.
  - Depende de: nada.
  - Duración estimada: 15 min.
  - Evidencia: archivo creado; `pnpm exec tsc --noEmit` sin salida.

- [x] **T2. Parsear, serializar y extraer el registro pendiente.** RF-1, RF-2, RF-16, RF-18, RF-19, RF-22
  - Hecho cuando: `app/lib/verification/pending-value.ts` expone las cuatro funciones puras y `tests/verification/pending-value.test.ts` pasa con ida y vuelta, valor `undefined`, JSON roto, tipos incorrectos, campos faltantes o vacíos, correo sin `@`, longitudes excedidas, `resendAvailableAt` válido, ausente y no numérico, `resendWaitMs` con espera pendiente, vencida y sin dato, y `extractPendingRegistration` con `data` válido, `id` numérico, sin `email` y `data` no objeto.
  - Depende de: T1.
  - Duración estimada: 35 min.
  - Evidencia: `tests/verification/pending-value.test.ts` con 9 tests en verde.

- [x] **T3. Manipular y validar el código de cinco dígitos.** RF-5, RF-11
  - Hecho cuando: `app/lib/verification/code.ts` expone `normalizeCode`, `setDigit`, `applyPaste`, `nextFocusIndex` e `isCompleteCode`, y `tests/verification/code.test.ts` pasa con espacios, guiones, letras, exceso de dígitos, pegado desde el inicio y desde una casilla intermedia, pegado `ab12cd34ef5` que queda `12345`, foco en los bordes y completitud exacta.
  - Depende de: T1.
  - Duración estimada: 25 min.
  - Evidencia: `tests/verification/code.test.ts` con 8 tests en verde.

- [x] **T4. Enmascarar el correo para mostrarlo.** RF-3, RNF-4
  - Hecho cuando: `app/lib/verification/mask-email.ts` expone `maskEmail` y `tests/verification/mask-email.test.ts` pasa con correo normal, local de un carácter, subdominios, dominio de dos niveles, entrada sin `@` y cadena vacía; `andres@gmail.com` se muestra como `a***@g***.com` y la dirección completa nunca aparece.
  - Depende de: T1.
  - Duración estimada: 20 min.
  - Evidencia: `tests/verification/mask-email.test.ts` con 4 tests en verde.

## Fase B — Integración HTTP

**Estado:** completada el 2026-10-22. Cubre: RF-8, RF-12, RF-13, RF-14, RF-24; RNF-3.

- [x] **T5. Cliente HTTP de verificación y reenvío.** RF-8, RF-12, RF-13, RF-14, RF-24; RNF-3
  - Hecho cuando: `app/lib/api/verify-email.ts` expone `verifyEmail` y `resendVerificationCode` con URL base de `getApiBaseUrl`, 10 s de timeout, `credentials: omit`, `cache: no-store` y `redirect: manual`; `tests/api/verify-email.test.ts` pasa y cubre método, URL, cabeceras, cuerpo `{ user_id, code }`, cuerpo `{ email, type: "REGISTER" }` sin identificador, éxito 200 y 204, 2xx con `errors`, 422, 422 con aviso de vencimiento, 429, 403, 500, 3xx, cuerpo no JSON, red, timeout y variable de entorno faltante, con la clasificación éxito, rechazo, vencimiento y falla del plan §4.2.
  - Depende de: T1.
  - Duración estimada: 35 min.
  - Evidencia: `tests/api/verify-email.test.ts` con 16 tests en verde; suite completa 64/64; `pnpm exec tsc --noEmit` sin salida; `pnpm lint` 0 errores (4 avisos preexistentes). El vencimiento se detecta por texto del servicio (`expirad`, `expir`, `venci`, `expired`), pendiente de confirmación del backend.

## Fase C — Persistencia y registro

**Estado:** completada el 2026-10-22. Cubre: RF-1, RF-2, RF-16, RF-18, RF-19, RF-20, RF-21, RF-22.

- [x] **T6. Cookie httpOnly del registro pendiente.** RF-1, RF-16, RF-18, RF-19, RF-20, RF-21
  - Hecho cuando: `app/lib/verification/pending.ts` lee, escribe, actualiza y borra la cookie `verify_pending` con `httpOnly`, `sameSite: "lax"`, `path: "/"`, `secure` en producción y `maxAge` de 7 días, incluido `resendAvailableAt`; un valor inválido devuelve `null` sin lanzar y el identificador nunca se registra en consola.
  - Depende de: T2.
  - Duración estimada: 20 min.
  - Evidencia: `app/lib/verification/pending.ts` con `readPendingRegistration`, `writePendingRegistration`, `markPendingResent` (45 s desde `RESEND_WAIT_MS`) y `clearPendingRegistration`; usa `await cookies()` (API asíncrona de Next 16.4.1); valor inválido queda en `null` vía `parsePendingRegistration` y no hay logs. `tsc`, `lint` y `pnpm build` en verde.

- [x] **T7. Guardar el pendiente al aceptar el registro.** RF-1, RF-2, RF-19, RF-22
  - Hecho cuando: en `app/lib/actions/auth.ts`, un 2xx con `id` y `email` utilizables escribe la cookie y redirige a `/verify-email`; un 2xx sin datos utilizables muestra el aviso general sin cookie ni redirección; un registro rechazado borra cualquier pendiente anterior (D13).
  - Depende de: T2, T6.
  - Duración estimada: 25 min.
  - Evidencia: `app/lib/actions/auth.ts` usa `extractPendingRegistration` sobre `result.data`, escribe la cookie y redirige; 2xx sin datos utilizables borra el pendiente y devuelve el aviso general; toda respuesta no exitosa del servicio borra el pendiente antes de devolver el error (D13). Los fallos de validación local no tocan la cookie. Suite 64/64, `tsc`, `lint` y `pnpm build` en verde.

## Fase D — Acciones de verificación

**Estado:** completada el 2026-10-22. Cubre: RF-7, RF-8, RF-9, RF-10, RF-12, RF-14, RF-15, RF-16, RF-17, RF-18, RF-20, RF-24.

- [x] **T8. Server Action de verificación.** RF-7, RF-8, RF-9, RF-10, RF-12, RF-18, RF-20, RF-24
  - Hecho cuando: `app/lib/actions/verify-email.ts` expone `verifyEmailAction`; sin cookie devuelve `missing`; con cookie valida el código y envía el identificador conservado; el éxito devuelve `success` y el pendiente se borra al cerrar la confirmación (D2); el rechazo conserva el pendiente y devuelve el mensaje y el error de `code`; si el servicio informa vencimiento devuelve `expired`; la falla de transporte conserva el código y devuelve `failed`.
  - Depende de: T5, T6, T7.
  - Duración estimada: 30 min.
  - Evidencia: `verifyEmailAction` lee el pendiente con `readPendingRegistration`; normaliza el campo `code` y, si no tiene 5 dígitos, responde `rejected` sin llamar al servicio; envía `{ userId: pending.userId, code }`; el éxito devuelve `success` sin mensaje y `clearPendingVerificationAction` borra la cookie justo antes de navegar (D2 corregida: borrarla en la acción desmontaba el verde por el re-render de Next); el rechazo devuelve `message` + `fieldErrors.code` sin tocar la cookie; el vencimiento devuelve `expired`; la falla devuelve `failed`. `tsc`, `lint`, `pnpm build` y suite 64/64 en verde.

- [x] **T9. Server Action de reenvío.** RF-14, RF-15, RF-16, RF-17
  - Hecho cuando: `resendVerificationAction` lee el correo de la cookie y llama a `resendVerificationCode`; sin cookie devuelve `missing`; el éxito devuelve `sent` y reescribe la cookie con `resendAvailableAt = ahora + 45 s`; el rechazo o la falla devuelven `failed` con el mensaje del servicio; ninguna respuesta incluye el identificador.
  - Depende de: T5, T6.
  - Duración estimada: 25 min.
  - Evidencia: `resendVerificationAction` lee `email` del pendiente y llama a `resendVerificationCode(pending.email)`; sin cookie devuelve `missing`; con espera vigente responde `failed` sin llamar al servicio (refuerzo de servidor de RF-16); el éxito reescribe la cookie con `markPendingResent` (45 s) y devuelve `sent` (mensaje del servicio o `RESENT_MESSAGE`); rechazo y falla devuelven `failed` con el mensaje del servicio; los estados solo contienen `status`, `message` y `remainingResends?`, nunca el identificador. Se agregó `argsIgnorePattern: "^_"` en `eslint.config.mjs` para el contrato de `useActionState` (`_previousState`/`_formData`). `tsc`, `lint`, `pnpm build` y suite 64/64 en verde.

## Fase E — Interfaz

**Estado:** completada el 2026-10-23. Cubre: RF-3, RF-4, RF-5, RF-6, RF-7, RF-9, RF-10, RF-11, RF-12, RF-15, RF-16, RF-17, RF-23, RF-24, RF-25, RF-26; RNF-1, RNF-2, RNF-5, RNF-6, RNF-8.

- [x] **T10. Ruta `/verify-email` con estado vacío y metadata.** RF-3, RF-4, RF-26; RNF-5, RNF-6
  - Hecho cuando: `app/verify-email/page.tsx` responde 200 con título y descripción propios; sin pendiente muestra el aviso y el enlace a `/register`; con pendiente muestra el correo enmascarado y el formulario dentro de la tarjeta `w-[97%] md:w-[95%]` con `pt-28`, igual que el registro.
  - Depende de: T4, T6.
  - Duración estimada: 25 min.
  - Evidencia: `page.tsx` es Server Component asíncrono con `metadata` ("Verificar correo | EET N° 3100"), `Navbar`, contenedor `pt-28` y tarjeta `w-[97%] md:w-[95%]`; sin cookie muestra el aviso y el enlace a `/register`; con cookie muestra `maskEmail(pending.email)` y el formulario. `pnpm build` lista `/verify-email` como `ƒ` (dinámica). CDP: 200, título propio, `a***@g***.com`, 5 casillas y sin desborde a 320 px.

- [x] **T11. Casillas OTP y botón habilitado solo con el código completo.** RF-5, RF-6, RF-11; RNF-1, RNF-2
  - Hecho cuando: `app/ui/auth/verify-email-form.tsx` muestra cinco casillas de un dígito con avance al escribir, retroceso al borrar, flechas y pegado que descarta espacios, guiones y letras y conserva los primeros cinco dígitos; cada casilla tiene etiqueta "Dígito N de 5"; el botón está deshabilitado hasta completar cinco dígitos y un código incompleto no se envía.
  - Depende de: T3, T10.
  - Duración estimada: 30 min.
  - Evidencia: cinco `input` con `inputMode="numeric"`, `maxLength=1`, etiquetas "Dígito 1 de 5" a "Dígito 5 de 5" y `one-time-code` en la primera; CDP: escribir `12345` llena las casillas en orden, mueve el foco y habilita el botón (`name="code"` = `12345`); Retroceso borra la última y lo deshabilita; pegar `ab12cd34ef5` deja `12345`; con menos de cinco dígitos el envío se cancela. A 320 px las casillas miden 44 px y no hay desborde.

- [x] **T12. Estados de envío: spinner, rechazo y falla.** RF-7, RF-10, RF-12
  - Hecho cuando: con el envío en curso el botón muestra el indicador de carga, queda deshabilitado, se bloquean las casillas y el reenvío y no se admite una segunda solicitud (EC-13); el rechazo vacía las casillas, devuelve el foco a la primera y muestra el mensaje junto al código; el vencimiento muestra el aviso y ofrece reenviar; la falla conserva el código, restablece el botón y muestra el banner general.
  - Depende de: T8, T11.
  - Duración estimada: 25 min.
  - Evidencia: con respuesta demorada, CDP muestra "Verificando", `aria-busy`, el spinner, el botón deshabilitado, las casillas y el reenvío bloqueados; un segundo clic no genera otra solicitud. Contra el servicio simulado: 422 → "Código incorrecto" junto al código, casillas vacías, foco en la primera, `aria-invalid` y cookie intacta; 500 → banner "Error interno del servicio" con `99999` conservado y botón habilitado; vencimiento → aviso y reenvío disponible con las casillas vacías.

- [x] **T13. Confirmación verde, orden de la vista y pase a `/login`.** RF-9, RF-20, RF-23; RNF-8
  - Hecho cuando: al recibir `success` el botón pasa a verde con el ícono `ico-verify` únicamente y nombre accesible, a los 1,5 s se navega a `/login` y la cookie del pendiente ya no existe; el botón queda centrado debajo de las casillas y el reenvío debajo del botón; el éxito no se comunica solo por color.
  - Depende de: T8, T12.
  - Duración estimada: 25 min.
  - Evidencia: CDP con el servicio simulado: botón `rgb(46, 125, 50)` (`verde-institucional`) con el SVG `ico-verify` en blanco, sin texto, `aria-label="Correo verificado"` y aviso `role="status"`; el ícono blanco sobre ese verde mide **5.13:1** (RNF-8); el botón está centrado con las casillas y el reenvío debajo. En la implementación original de la spec 005, a los 1,5 s navegaba a `/home` y `verify_pending` ya no existía; desde el cambio de la spec 006 (RF-18) el destino es `/login` y se revalida en T8 de esa spec. Se corrigió D2: la cookie se borra con `clearPendingVerificationAction` justo antes de navegar, porque borrarla dentro de la acción re-renderizaba la ruta y desmontaba el verde.

- [x] **T14. Reenvío con cuenta atrás, persistencia y avisos.** RF-15, RF-16, RF-17, RF-25
  - Hecho cuando: el botón de reenvío se deshabilita mientras envía, al aceptar muestra un aviso `role="status"` con cuenta atrás de 45 s, los intentos restantes sobre 5 por día y no permite otro reenvío hasta terminar; tras recargar, la espera sigue vigente; si falla, muestra el banner y permite reintentar al terminar la espera.
  - Depende de: T9, T12.
  - Duración estimada: 40 min.
  - Evidencia: el reenvío se deshabilita durante el envío y la espera; al aceptar muestra `role="status"` "Código reenviado", "Podés reenviar en 45 s" y "Reenvíos disponibles hoy: 5 de 5"; tras recargar la cuenta atrás sigue en 44 s (cookie reescrita con `resendAvailableAt`); el servicio simulado recibe `{ email: "andres@gmail.com", type: "REGISTER" }` sin identificador. Con fallo 500 muestra el banner "No se pudo reenviar" y una espera local de 45 s antes de reintentar.

## Fase F — Verificación y cierre

**Estado:** completada el 2026-10-23. Cubre: todos los RF y RNF.

- [x] **T15. Accesibilidad, responsive y contraste.** RNF-1, RNF-5, RNF-8
  - Hecho cuando: el recorrido completo por teclado (Tab, flechas, Retroceso, Enter) funciona, el árbol de accesibilidad anuncia las cinco casillas, el botón ocupado y el nombre accesible del botón de éxito, no hay desplazamiento horizontal ni solapamientos en 320, 375, 768 y 1440 px, y el contraste del ícono sobre el verde y del botón deshabilitado alcanza al menos 4.5:1.
  - Depende de: T11, T12, T13, T14.
  - Duración estimada: 25 min.
  - Evidencia: con Brave headless y CDP, el árbol de accesibilidad expone cinco `textbox` llamados "Dígito 1 de 5" a "Dígito 5 de 5", el botón "Verificar código" deshabilitado y el reenvío "Reenviar código"; Tab pasa de la casilla 1 a la 2, Shift+Tab vuelve, las flechas mueven el foco, Retroceso borra la última casilla y deja el botón deshabilitado, y Enter con `00000` envía, muestra "Código incorrecto" y enfoca la primera. Durante el envío el botón se anuncia como "Verificando" con `busy` y `disabled`; en el éxito se anuncia "Correo verificado". En 320, 375, 768 y 1440 px no hay desborde horizontal, las casillas quedan dentro del viewport, el botón está centrado bajo las casillas y el reenvío debajo. Contraste medido: botón deshabilitado `#E0E0E0`/`#2C3E50` = **8.32:1**; ícono blanco sobre `#2E7D32` = **5.13:1**. No hizo falta cambiar código de producción.

- [x] **T16. E2E del flujo principal.** RF-1, RF-3, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-14, RF-16, RF-20
  - Hecho cuando: contra el servicio simulado, el registro lleva a `/verify-email` con correo enmascarado y botón deshabilitado; el código correcto muestra spinner, bloquea casillas y reenvío, pinta el verde con el ícono y navega a `/login` tras 1,5 s con la cookie borrada; el código incorrecto muestra el mensaje, vacía las casillas, enfoca la primera y conserva el pendiente; el pegado `12-345` se reparte; el reenvío envía `{ email, type: "REGISTER" }` y aplica la espera.
  - Depende de: T15.
  - Duración estimada: 30 min.
  - Evidencia: registro real desde `/register` (nombre, apellido, DNI, CUIL, fecha, correo, teléfono y contraseña) → `/verify-email` con `a***@e***.com`, cinco casillas, botón deshabilitado, correo completo ausente y cookie `verify_pending` con `httpOnly` y `SameSite=Lax`. Con `55555`: "Verificando", spinner, `aria-busy`, casillas y reenvío bloqueados; luego botón `rgb(46, 125, 50)` con el SVG y sin texto, cookie presente durante el verde, y tras 1,6 s `/home` (implementación original; desde la spec 006 el destino es `/login`) con la cookie eliminada y el estado vacío al volver. Con `00000`: "Código incorrecto", casillas vacías, foco en la primera y pendiente conservado tras recargar. Los pegados `12-345`, `12 34 5` y `ab12cd34ef5` dejan `12345`. Reenvío: `role="status"` "Código reenviado", "Podés reenviar en 45 s", "Reenvíos disponibles hoy: 5 de 5", botón deshabilitado, cookie reescrita y espera vigente tras recargar; el servicio recibe `{ email: "andres@gmail.com", type: "REGISTER" }` sin identificador.

- [x] **T17. E2E de límites y privacidad.** RF-2, RF-4, RF-12, RF-18, RF-19, RF-21, RF-24, RF-25; RNF-2
  - Hecho cuando: sin cookie se ve el estado vacío con enlace a `/register`; con el servicio caído se muestra el banner y se conserva el código; un código vencido muestra el aviso y ofrece reenviar; un registro fallido con pendiente previo lo elimina; tras cerrar y reabrir el navegador con el mismo perfil el pendiente sigue disponible y la espera de 45 s sigue vigente tras recargar; un registro nuevo reemplaza al anterior; la URL y `document.cookie` no exponen el identificador; el doble clic genera una sola solicitud.
  - Depende de: T16.
  - Duración estimada: 35 min.
  - Evidencia: sin cookie, estado vacío y enlace a `/register`; `11111` (vencido) muestra "Código vencido", vacía casillas, enfoca la primera y habilita el reenvío; con la conexión cortada (`77777`) aparece "No se pudo conectar con el servicio. Intentá nuevamente.", se conserva `77777` y el botón vuelve a estar habilitado; un registro con correo `fallo@example.com` muestra el banner y el error del correo, elimina el `verify_pending` previo y `/verify-email` queda vacío; un registro nuevo con `nueva@example.com` reemplaza la cookie anterior; cerrar el navegador con `Browser.close` y reabrirlo con el mismo perfil conserva `a***@g***.com`, las cinco casillas y "Podés reenviar en 12 s" con el reenvío deshabilitado; la URL es `/verify-email` sin identificador ni correo, `document.cookie` está vacío y la consola no registra datos; dos clics seguidos generan **una** solicitud al servicio.

- [x] **T18. Cierre estático y documentación.** RNF-7; criterios de finalización
  - Hecho cuando: `pnpm lint` termina con 0 errores (solo quedan los 4 avisos preexistentes de `<img>`), `pnpm exec tsc --noEmit` no reporta errores, la suite nativa completa pasa, `pnpm build` finaliza en verde con `/verify-email` como ruta dinámica, `package.json` no registra dependencias nuevas y `MEMORY.md` queda actualizado con la evidencia.
  - Depende de: T17.
  - Duración estimada: 20 min.
  - Evidencia: suite nativa **64/64**, `tsc --noEmit` sin errores, `pnpm lint` **0 errores** y 4 avisos preexistentes de `<img>`, `pnpm build` en verde con `/verify-email` como `ƒ`, `package.json` sin dependencias nuevas (`next`, `react`, `react-dom`, `react-day-picker@10.0.2`) y `MEMORY.md` actualizado con la Fase F.
