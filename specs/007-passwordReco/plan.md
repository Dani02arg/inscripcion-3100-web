# Plan 007 — Recuperación de contraseña

Estado: aprobado (2026-10-25)

## 1. Alcance, principios y supuestos

Este plan implementa la spec 007, aprobada el 2026-10-25. Cubre la recuperación de contraseña solo en la aplicación web, con el contrato actual del backend y sin cambios en el servicio:

- Pantalla pública de solicitud de código (`/password-recovery`).
- Pantalla pública de cambio de contraseña (`/password-recovery/reset`).
- Consumo de `POST /api/auth/forgot-password` y `POST /api/auth/reset-password`.
- Correo de la solicitud activa conservado 15 minutos, por pestaña.
- OTP de cinco casillas con ceros iniciales, avance, retroceso, flechas y pegado.
- Política de contraseña del registro y confirmación.
- Retorno manual al inicio de sesión, sin inicio de sesión automático.

Queda fuera de alcance todo lo listado en la spec: backend, límites de solicitudes e intentos, invalidación de códigos anteriores, revocación de tokens, verificación de correo, persistencia de sesión, reenvío formal, dashboard, SMS, analítica y dependencias nuevas.

Principios aplicados de `docs/constitution.md`:

1. **SDD**: la spec 007 manda. No se implementa nada que no esté en ella; este plan no se ejecuta hasta su aprobación y la de `tasks.md`.
2. **TypeScript estricto**: sin `any`, sin castings inseguros y sin supresión de errores.
3. **Separación de capas**: rutas en `app/`, UI pura en `app/ui/`, red y helpers en `app/lib/`.
4. **Pureza visual**: los componentes de `app/ui` reciben datos por props y no hacen HTTP.
5. **Server Components primero**: las páginas son Server Components; los formularios y el campo OTP son Client Components por usar estado y eventos.
6. **API centralizada**: los dos endpoints viven en `app/lib/api/password-recovery.ts` y respetan `{ data, message, errors }`.
7. **Consistencia lingüística**: código, tipos, funciones y rutas en inglés; comentarios y textos visibles en español.
8. **Restricción de dependencias**: no se instala nada.
9. **Datos y fechas estándar**: el instante de la solicitud se guarda como epoch en milisegundos; las fechas visibles no aplican a esta funcionalidad.
10. **Planificación y verificación**: `pnpm exec tsc --noEmit`, `pnpm lint`, la suite de tests y `pnpm build` deben quedar en verde.
11. **Next.js optimizado**: `metadata` propia por ruta. No se agregan imágenes nuevas; si se reutilizara un ícono existente, se haría con `next/image` desde `public/icons/`.
12. **Loading y error boundaries**: `loading.tsx` y `error.tsx` en cada segmento de ruta, por RNF-10.
13. **Caché**: los POST usan `cache: "no-store"`; el estado de recuperación no se sirve desde caché compartida.
14. **Imágenes y assets**: no se requieren assets nuevos.
15. **Tailwind v4 en Markdown**: este documento no incluye clases utilitarias; cuando se implemente, se usarán tokens existentes y sintaxis segura.

> Nota de numeración: la constitución tiene dos principios numerados 15 y ninguno 16. Este plan cita los principios por su contenido para evitar ambigüedad.

Supuestos y límites:

- El backend mantiene el contrato documentado en la spec: `200` con `message`; `422` con `message` y `errors` por campo; `404` para cuentas eliminadas o correo no disponible.
- El código de recuperación es de cinco dígitos, tipo `RECOVER`, vence a los 15 minutos y es de un solo uso. La autoridad sobre la vigencia y el uso único es el servicio; la interfaz solo refleja el resultado.
- El servicio no distingue código vencido, inválido o ya usado: todos llegan como `422` con “Código de recuperación inválido.”.
- La entrega del correo depende de `APP_SEND_NOTIFICATIONS=true` y, con cola asíncrona, de un worker activo. La aplicación no confirma la entrega.
- El backend solo exige contraseña de 8 caracteres como mínimo; la interfaz aplica la política completa del registro. La diferencia queda registrada como limitación aceptada.
- No se persiste sesión ni token: el éxito no autentica.
- El estado de recuperación se conserva por pestaña; dos pestañas pueden tener solicitudes distintas, como exige la spec.

## 2. Archivos a crear y modificar

### 2.1 Crear — rutas

- `app/password-recovery/page.tsx`
  - Server Component público de la pantalla de solicitud.
  - Exporta `metadata` con título, descripción y Open Graph propios (RNF-8).
  - Compone `Navbar`, la tarjeta institucional y el formulario de solicitud.
  - No lee cookies ni datos sensibles en el servidor: el correo precargado lo resuelve el cliente desde el almacenamiento de la pestaña.
  - Cubre RF-1, RF-30, RNF-7, RNF-8, RNF-11.

- `app/password-recovery/loading.tsx`
  - Estado de carga del segmento, con texto en español y sin datos sensibles.
  - Cubre RNF-10.

- `app/password-recovery/error.tsx`
  - Client Component con límite de error del segmento, mensaje general y acción de reintento.
  - No muestra detalles técnicos ni valores del formulario.
  - Cubre RNF-10, RNF-3.

- `app/password-recovery/reset/page.tsx`
  - Server Component público de la pantalla de cambio.
  - Exporta `metadata` propia (RNF-8).
  - Compone `Navbar`, la tarjeta y el formulario de cambio.
  - Cubre RF-9, RF-10, RF-13, RNF-7, RNF-8.

- `app/password-recovery/reset/loading.tsx`
  - Estado de carga del segmento.
  - Cubre RNF-10.

- `app/password-recovery/reset/error.tsx`
  - Límite de error del segmento, sin filtrar datos.
  - Cubre RNF-10, RNF-3.

### 2.2 Crear — UI

- `app/ui/auth/request-recovery-form.tsx`
  - Client Component del formulario de solicitud.
  - Campos: correo electrónico y acción “Solicitar código”.
  - Lee el correo de la solicitud activa al montar para precargarlo tras “Volver a solicitar” (RF-28).
  - Validación local, error por campo, banner general, `aria-busy`, indicador de progreso y bloqueo de doble envío.
  - En éxito: guarda la solicitud activa, registra el aviso de solicitud enviada y navega a `/password-recovery/reset`.
  - No guarda código ni contraseña.
  - Cubre RF-1 a RF-8, RF-28, RF-29, RF-34, RNF-1, RNF-2, RNF-5, RNF-9.

- `app/ui/auth/reset-password-form.tsx`
  - Client Component del formulario de cambio.
  - Al montar resuelve la solicitud activa: ausente, vencida o vigente.
  - Muestra el correo enmascarado y el aviso de solicitud enviada una sola vez.
  - Campos: OTP de cinco casillas, nueva contraseña, confirmación y acción “Cambiar contraseña”.
  - Acciones “Volver a solicitar” y, tras el éxito, “Ir a iniciar sesión”.
  - Estado de éxito que reemplaza al formulario; no inicia sesión ni redirige automáticamente.
  - Conserva contraseña y confirmación ante código inválido; limpia el OTP y enfoca la primera casilla.
  - Cubre RF-9 a RF-29, RF-31 a RF-34, RNF-1, RNF-2, RNF-5, RNF-9.

- `app/ui/auth/recovery-code-field.tsx`
  - Client Component controlado para las cinco casillas.
  - Recibe valor, error, estado deshabilitado y callbacks por props; no hace HTTP.
  - Avance al completar, retroceso, flechas, pegado desde la primera casilla y ceros iniciales.
  - Etiquetas “Dígito N de 5”, `inputMode` numérico, `autoComplete` de código de un solo uso en la primera casilla.
  - Informa el código completo por un campo oculto del formulario.
  - Cubre RF-13, RF-15, RF-16, RNF-1.

### 2.3 Crear — lógica y red

- `app/lib/validation/password-recovery.ts`
  - Tipos de campos, entradas, payloads, errores, resultados de validación y estados de acción.
  - Constantes de mensajes de la spec y del campo `password_confirmation` del servicio.
  - Funciones puras de validación y construcción de payloads.
  - Reutiliza `trimText`, `isValidEmail`, `isValidPassword` y `passwordsMatch` de `app/lib/validation/register.ts`.
  - Cubre RF-2, RF-3, RF-17, RF-18, RF-19, RF-23, RF-34, RNF-5, RNF-12.

- `app/lib/recovery/request-value.ts`
  - Tipo `RecoveryRequest` con `email` y `requestedAt`.
  - Constante de vigencia de 15 minutos.
  - Serialización, parseo defensivo, vencimiento y máscara del correo.
  - Funciones puras, sin acceso a `window`.
  - Cubre RF-9, RF-11, RF-12, RF-28, RNF-3.

- `app/lib/recovery/storage.ts`
  - Acceso a `sessionStorage` de la pestaña, con guardas para ausencia o error de cuota.
  - Claves separadas para la solicitud activa y el aviso de solicitud enviada.
  - Lectura, escritura, borrado y consumo único del aviso.
  - Nunca guarda código, contraseña ni confirmación.
  - Cubre RF-5, RF-12, RF-28, RNF-3, RNF-11.

- `app/lib/recovery/code.ts`
  - Función pura de pegado que normaliza a dígitos, conserva los primeros cinco, reparte desde la primera casilla y devuelve el índice de foco siguiente.
  - Reutiliza `CODE_LENGTH`, `normalizeCode`, `setDigit`, `nextFocusIndex` y `isCompleteCode` de `app/lib/verification/code.ts` sin modificar su comportamiento.
  - Cubre RF-15, RF-16, RF-17.

- `app/lib/api/password-recovery.ts`
  - Cliente de `POST /api/auth/forgot-password` y `POST /api/auth/reset-password`.
  - Constantes de rutas, timeout de 10 segundos y mensajes de fallo.
  - Funciones puras de parseo y clasificación por endpoint.
  - Funciones de envío con JSON, `credentials: "omit"`, `cache: "no-store"`, `redirect: "manual"` y `AbortSignal.timeout`.
  - Reutiliza `getApiBaseUrl` de `app/lib/api/config.ts` y `getApiMessage`, `isRecord`, `toStringArray` de `app/lib/api/auth.ts`.
  - Nunca registra ni devuelve la contraseña, la confirmación o el código en los mensajes de error.
  - Cubre RF-6, RF-7, RF-8, RF-22 a RF-27, RNF-4, RNF-12.

- `app/lib/actions/password-recovery.ts`
  - Server Actions `requestRecoveryAction` y `resetPasswordAction`.
  - Revalidan en el servidor antes de llamar al servicio.
  - Traducen los resultados de la API a estados de acción con errores por campo o aviso general.
  - El cambio envía `{ email, code, password, password_confirmation }`.
  - No escriben cookies de sesión, no emiten tokens y no registran datos sensibles.
  - Cubre RF-4 a RF-8, RF-20 a RF-27, RF-31, RF-32, RNF-3, RNF-7.

### 2.4 Crear — tests

- `tests/validation/password-recovery.test.ts`
  - Validación de correo, código, política de contraseña, confirmación y payloads.
  - Cubre RF-2, RF-3, RF-17, RF-18, RF-19, RF-23, RF-34.

- `tests/recovery/request-value.test.ts`
  - Serialización, parseo defensivo, vigencia de 15 minutos, reemplazo de solicitud y máscara.
  - Cubre RF-9, RF-11, RF-12, RF-28.

- `tests/recovery/code.test.ts`
  - Pegado con letras, espacios, guiones, ceros iniciales, menos de cinco dígitos y más de cinco.
  - Índice de foco posterior al pegado.
  - Cubre RF-15, RF-16.

- `tests/api/password-recovery.test.ts`
  - Contrato de ambos endpoints, clasificación de `200`, `404`, `422`, `429`, `5xx`, red, timeout y cuerpo inválido.
  - Mapeo de `password_confirmation` a `passwordConfirmation`.
  - Verificación de que el resultado no contiene la contraseña.
  - Cubre RF-6, RF-7, RF-8, RF-22 a RF-27, RNF-3, RNF-4.

### 2.5 Modificar

- `app/ui/auth/login-form.tsx`
  - Cambia el destino del enlace “Recuperar contraseña” de `/home` a `/password-recovery`.
  - No cambia el resto del formulario.
  - Cubre RF-30.

- `specs/006-login/spec.md`
  - Actualiza RF-9 y el criterio de finalización para que el enlace deje de apuntar a `/home`.
  - No cambia código de la spec 006.
  - Cubre el criterio de finalización de la spec 007.

- `MEMORY.md`
  - Registra la aprobación de la spec, el estado del plan y, al cerrar la implementación, las verificaciones y decisiones.

### 2.6 No se modifica

- `app/lib/verification/*`: se reutilizan `code.ts` y `mask-email.ts` sin cambios. La pantalla de verificación de registro mantiene su comportamiento, incluido el pegado desde la casilla activa.
- `app/lib/validation/register.ts`: se reutilizan las reglas de correo y contraseña sin cambios.
- `app/lib/api/auth.ts`, `app/lib/api/config.ts` y `app/lib/api-client.ts`: se reutilizan sus helpers; `fetchAPI` no se usa porque agrega token y cookies y no permite la clasificación fina de errores.
- `app/ui/auth/password-input.tsx` y `app/ui/auth/text-field.tsx`: sus props actuales alcanzan para esta funcionalidad.
- Backend, contrato, configuración de notificaciones y colas.

## 3. Funciones de lógica pura

### 3.1 Validación

- `validateRecoveryEmail(value: string): RecoveryEmailValidation`
  - Recorta espacios exteriores.
  - Devuelve error de obligatorio si queda vacío y error de formato si no cumple la regla del registro.
  - Devuelve el correo normalizado cuando es válido.
  - Cubre RF-2, RF-3.

- `validateNewPassword(password: string, confirmation: string): ResetValidationResult`
  - Contraseña vacía: error de obligatorio.
  - Contraseña fuera de 8 a 16 caracteres, sin mayúscula, sin minúscula, sin número ni carácter especial, o con emoji: mensaje de política del registro.
  - Confirmación vacía: error de obligatorio; confirmación distinta: “Las contraseñas no coinciden.”.
  - No compara contra la contraseña anterior.
  - Cubre RF-18, RF-19, RF-33.

- `validateRecoveryCode(value: string): string | undefined`
  - Exige exactamente cinco dígitos; cualquier otro caso devuelve “Ingresá el código de 5 dígitos.”.
  - No recorta ceros iniciales.
  - Cubre RF-17.

- `buildRequestPayload(email: string): RequestRecoveryPayload`
  - Devuelve exactamente `{ email }` con el correo recortado.
  - Cubre RF-2.

- `buildResetPayload(input: ResetInput): ResetPasswordPayload`
  - Devuelve exactamente `{ email, code, password, password_confirmation }`.
  - No incluye la confirmación como campo propio ni campos adicionales.
  - Cubre RF-20.

- `mapResetFieldErrors(errors: unknown): ResetFieldErrors`
  - Reconoce `email`, `code`, `password` y `password_confirmation`.
  - Traduce `password_confirmation` a `passwordConfirmation`.
  - Descarta valores vacíos y deja el resto para el aviso general.
  - Cubre RF-23, RF-24, RNF-12.

### 3.2 Estado de la solicitud

- `serializeRecoveryRequest(request: RecoveryRequest): string`
  - Codifica correo y `requestedAt`; no incluye código ni contraseña.
  - Cubre RF-12, RNF-3.

- `parseRecoveryRequest(raw: string | null | undefined): RecoveryRequest | null`
  - Rechaza JSON inválido, tipos incorrectos, correo vacío o demasiado largo e instantes no finitos o negativos.
  - Un valor inválido se trata como ausencia de solicitud.
  - Cubre RF-10, RF-12.

- `isRecoveryExpired(request: RecoveryRequest, now: number): boolean`
  - Verdadero desde los 15 minutos inclusive.
  - Tolera un instante futuro sin vencerlo, para no bloquear por desfase de reloj.
  - Cubre RF-11, RF-12.

- `maskRecoveryEmail(email: string): string`
  - Delega en `maskEmail` de la verificación para mantener una sola máscara en el proyecto.
  - Cubre RF-9, RNF-3.

### 3.3 Código OTP

- `applyRecoveryPaste(digits: string, text: string): { digits: string; focusIndex: number }`
  - Descarta todo lo que no sea dígito y conserva los primeros cinco.
  - Reparte siempre desde la primera casilla, sin importar dónde se pegó.
  - Devuelve el foco en la siguiente casilla vacía; si el código quedó completo, en la última.
  - Conserva ceros iniciales.
  - Cubre RF-15, RF-16.

### 3.4 API

- `parseRequestRecoveryResponse(status: number, body: unknown): RequestRecoveryResult`
  - `2xx` sin errores: éxito con el mensaje del servicio o el texto de la spec.
  - `2xx` con errores: fallo general (RF-8).
  - `404`: `email_not_registered`.
  - `422` con `errors.email` de correo no registrado: `email_not_registered`.
  - `422` con otros errores: fallo general con el mensaje del servicio.
  - `429`, `5xx`, cuerpo inválido: fallo general.
  - Cubre RF-5 a RF-8, RNF-12.

- `parseResetPasswordResponse(status: number, body: unknown): ResetPasswordResult`
  - `2xx` sin errores: éxito.
  - `2xx` con errores: fallo general (RF-26).
  - `422` con “Código de recuperación inválido.” o `errors.code` equivalente: `invalid_code` (RF-22).
  - `422` con `errors.email` de correo no registrado: `email_not_registered` (RF-24).
  - `422` con errores por campo: `validation` con `fieldErrors` mapeados (RF-23).
  - `404`: `email_not_registered` (RF-25).
  - `429`, `5xx`, cuerpo inválido: fallo general (RF-26).
  - Cubre RF-21 a RF-26, RNF-12.

- `requestRecoveryCode(email: string, options?): Promise<RequestRecoveryResult>`
  - Resuelve la URL base; si falta configuración, no llama a `fetch`, registra solo en el servidor y devuelve fallo general.
  - Hace `POST /api/auth/forgot-password` con `{ email }`, timeout de 10 segundos.
  - Distingue timeout de error de conexión.
  - Cubre RF-4 a RF-8, RNF-4.

- `resetPassword(payload: ResetPasswordPayload, options?): Promise<ResetPasswordResult>`
  - Hace `POST /api/auth/reset-password` con el payload exacto y timeout de 10 segundos.
  - Distingue timeout de error de conexión, red y `5xx` (RF-27).
  - Cubre RF-20 a RF-27, RNF-4.

### 3.5 Acciones

- `requestRecoveryAction(previous, formData): Promise<RequestRecoveryActionState>`
  - Valida el correo en el servidor; si falla, devuelve el error sin llamar al servicio.
  - En éxito devuelve `sent` con el mensaje de la spec.
  - En correo no registrado devuelve `errors.email` con el texto de la spec.
  - En fallo general devuelve `message` para el banner y conserva el correo.
  - Cubre RF-3 a RF-8.

- `resetPasswordAction(previous, formData): Promise<ResetPasswordActionState>`
  - Valida código y contraseña en el servidor; si falla, devuelve errores por campo sin llamar al servicio.
  - Llama a `resetPassword` con el correo conservado en el formulario.
  - En éxito devuelve `success` con “Contraseña restablecida correctamente.”.
  - En código inválido devuelve `invalid_code` para que el formulario limpie las casillas.
  - En errores por campo devuelve `validation` con los mensajes mapeados.
  - En correo no registrado devuelve `email_not_registered`.
  - En timeout devuelve `timeout` para el mensaje específico.
  - En el resto devuelve `error` con aviso general.
  - No registra la contraseña ni el código.
  - Cubre RF-17 a RF-27, RF-31, RF-32.

## 4. Decisiones técnicas justificadas

1. **Dos rutas en inglés y páginas Server Component.**
   - Decisión: `/password-recovery` y `/password-recovery/reset`; ambas páginas son Server Components con metadata propia y montan formularios cliente.
   - Motivo: cumple la separación de capas, el principio de Server Components primero y la regla de rutas en inglés. Los formularios necesitan estado, eventos y `useActionState`.
   - Alternativa descartada: una sola ruta con pasos internos; impide metadatos y estados de carga por pantalla, y complica el acceso directo a la pantalla de cambio que exige RF-10.

2. **Estado de la solicitud por pestaña en `sessionStorage`.**
   - Decisión: guardar `{ email, requestedAt }` en `sessionStorage`, con claves propias y sin datos sensibles adicionales.
   - Motivo: RF-12 exige que la solicitud sobreviva a la recarga y el caso límite de dos pestañas exige estados independientes. Una cookie es compartida por todo el navegador y haría que una pestaña pisara a la otra.
   - Alternativa descartada: cookie `httpOnly` como en la verificación de registro; es más segura frente a lectura por scripts, pero rompe el aislamiento por pestaña y la spec lo exige explícitamente.
   - Mitigación: solo se guarda el correo, nunca el código ni la contraseña; el correo se muestra enmascarado y no se comparte entre usuarios ni pestañas.

3. **Server Actions en lugar de `fetch` desde el cliente.**
   - Decisión: `app/lib/actions/password-recovery.ts` concentra las llamadas.
   - Motivo: la UI no debe hacer HTTP y la acción permite revalidar en el servidor. Es el patrón de login y verificación.
   - Alternativa descartada: llamar a la API desde los formularios; viola la separación de capas y expone la URL base.

4. **Módulo de API propio con parseo por endpoint.**
   - Decisión: `app/lib/api/password-recovery.ts` con dos funciones y dos parseos, reutilizando los helpers existentes.
   - Motivo: los dos endpoints tienen cuerpos y errores distintos; separarlos evita condicionales por ruta dentro de una misma función.
   - Alternativa descartada: reutilizar `login.ts` o `verify-email.ts`; mezcla contratos y dificulta los tests.

5. **Reutilizar las reglas de contraseña y correo del registro.**
   - Decisión: importar `isValidPassword`, `passwordsMatch`, `isValidEmail` y `trimText` desde `register.ts`.
   - Motivo: RNF-5 exige que la política coincida con la del registro; una copia divergiría con el tiempo.
   - Alternativa descartada: duplicar las expresiones regulares; genera dos políticas distintas.

6. **Reutilizar el módulo de código de la verificación sin cambiar su comportamiento.**
   - Decisión: usar `CODE_LENGTH`, `normalizeCode`, `setDigit`, `nextFocusIndex` e `isCompleteCode`, y agregar solo la función de pegado propio de la recuperación.
   - Motivo: la mecánica de casillas ya está probada; el pegado de la verificación reparte desde la casilla activa y la spec 007 exige repartir desde la primera, por eso no se reutiliza ese comportamiento.
   - Alternativa descartada: modificar `applyPaste` de la verificación; cambiaría el comportamiento ya implementado de la spec 005.

7. **Campo OTP nuevo en lugar de refactorizar el de verificación.**
   - Decisión: `recovery-code-field.tsx` nuevo y controlado.
   - Motivo: el campo de verificación está acoplado a su acción y a su estado; extraerlo implicaría tocar una funcionalidad cerrada. El nuevo campo es más simple y testeable.
   - Alternativa descartada: parametrizar `verify-email-form.tsx`; agrega riesgo de regresión en la verificación de registro.

8. **Vigencia de la solicitud en el cliente, con el servicio como autoridad final.**
   - Decisión: la interfaz bloquea el cambio a los 15 minutos y muestra el aviso de RF-11; la Server Action no rechaza por vigencia local, solo por formato.
   - Motivo: evita falsos negativos por desfase de reloj entre navegador y servidor; el backend ya rechaza códigos vencidos.
   - Alternativa descartada: rechazar en el servidor según `requestedAt`; un reloj desfasado impediría un cambio que el servicio aceptaría.

9. **Aviso de solicitud enviada en la pantalla de cambio.**
   - Decisión: al confirmar la solicitud se guarda un aviso de un solo consumo en `sessionStorage` y se navega; la pantalla de cambio lo muestra una vez con `aria-live`.
   - Motivo: RF-5 exige mostrar el mensaje y pasar a la pantalla de cambio; mostrarlo allí evita una espera artificial en la primera pantalla.
   - Alternativa descartada: mostrar el mensaje y navegar tras un temporizador; agrega latencia y condiciones de carrera.

10. **Sin cuenta atrás ni reenvío formal.**
    - Decisión: “Volver a solicitar” navega a la solicitud con el correo precargado y sin envío automático.
    - Motivo: RF-28 y RF-29 lo exigen explícitamente.
    - Alternativa descartada: reutilizar el reenvío con espera de la verificación; la spec lo excluye.

11. **Estado de éxito sin redirección automática.**
    - Decisión: el formulario se reemplaza por el mensaje y el enlace “Ir a iniciar sesión”.
    - Motivo: RF-21 y RF-32 prohíben el inicio de sesión automático y no definen una redirección.
    - Alternativa descartada: navegar a `/login` tras unos segundos, como en la verificación; la spec pide una acción explícita.

12. **Timeout del cambio con mensaje propio.**
    - Decisión: el resultado `timeout` del cambio es distinto de red y `5xx`, y muestra el texto de RF-27 con las dos alternativas.
    - Motivo: un timeout no permite saber si el cambio se aplicó; reintentar a ciegas es incorrecto.
    - Alternativa descartada: tratar el timeout como error general; incumple RF-27.

13. **Campos de contraseña con pegado y gestor de contraseñas permitidos.**
    - Decisión: `PasswordInput` con `showPasswordPolicy`, pegado y arrastre permitidos y `autoComplete="new-password"`.
    - Motivo: en una recuperación la contraseña suele generarse o pegarse; bloquear el pegado perjudica la usabilidad y no aporta seguridad. El registro conserva su bloqueo actual.
    - Alternativa descartada: replicar el bloqueo del registro; la spec 007 no lo pide y el contexto es distinto.

14. **`loading.tsx` y `error.tsx` en ambos segmentos.**
    - Decisión: crear los cuatro archivos, aunque las páginas sean livianas.
    - Motivo: RNF-10 y el principio de loading y error boundaries lo exigen por ruta.
    - Alternativa descartada: omitirlos por ser rutas casi estáticas; incumple un requisito explícito.

15. **Sin dependencias nuevas.**
    - Decisión: usar Next.js, React, `sessionStorage` y las utilidades existentes.
    - Motivo: principio de restricción de dependencias y RNF-6.
    - Alternativa descartada: incorporar una librería de formularios u OTP; requiere aprobación y no es necesaria.

## 5. Estrategia de tests

### 5.1 Tests unitarios

Runner existente: `node:test` con `node --experimental-strip-types --test`, imports relativos con extensión explícita. No se agregan frameworks.

`tests/validation/password-recovery.test.ts`:

- Correo vacío, solo espacios y con formato inválido.
- Correo con espacios exteriores: se recorta y el payload lo usa recortado.
- Código vacío, de 4 dígitos, con letras y con espacios: error de código incompleto.
- Código `00123`: válido y con ceros conservados.
- Contraseña de 7 y de 17 caracteres: error de política.
- Contraseña sin mayúscula, sin minúscula y sin número ni carácter especial: error de política.
- Contraseña con emoji: rechazada.
- Contraseña válida: sin error, incluso si coincide con una anterior hipotética.
- Confirmación vacía y confirmación distinta: mensajes diferenciados.
- Payload de cambio con las cuatro claves exactas y sin campos adicionales.
- Mapeo de `password_confirmation` a `passwordConfirmation` y descarte de claves desconocidas.

`tests/recovery/request-value.test.ts`:

- Ida y vuelta de serialización y parseo.
- JSON inválido, valor no objeto, correo vacío, correo sin arroba, correo demasiado largo e instante no finito o negativo: `null`.
- `isRecoveryExpired` falso a los 14:59 y verdadero a los 15:00.
- Una solicitud futura no se considera vencida.
- Una nueva solicitud reemplaza a la anterior al escribir el almacenamiento (verificado en E2E por depender de `sessionStorage`).
- La máscara usa el formato existente `a***@g***.com`.

`tests/recovery/code.test.ts`:

- Pegado de `12-345`, `12 34 5` y `ab12cd34ef5`: resultado `12345` y foco en la última casilla.
- Pegado de `00123`: conserva los ceros.
- Pegado de menos de cinco dígitos: completa desde la primera y deja el foco en la siguiente vacía.
- Pegado de más de cinco: conserva los primeros cinco.
- Pegado en una casilla intermedia: se ignora la posición y se reparte desde la primera.
- Pegado sin dígitos: no altera el valor.

`tests/api/password-recovery.test.ts`:

- Solicitud: URL, método, headers JSON, credenciales omitidas, sin caché, redirección manual y señal de timeout.
- Solicitud: cuerpo exacto `{ email }`, sin campos adicionales.
- Solicitud: `200` con mensaje; `422` con correo no registrado; `404`; `422` con otros errores; `429`; `500`; red; timeout; cuerpo inválido; `2xx` con errores.
- Cambio: cuerpo exacto `{ email, code, password, password_confirmation }`.
- Cambio: `200`; `422` con mensaje de código inválido; `422` con `errors.code`; `422` con errores por campo; `422` con correo no registrado; `404`; `429`; `5xx`; red; timeout; cuerpo inválido; `2xx` con errores.
- El resultado serializado no contiene la contraseña ni la confirmación.
- El código no aparece en mensajes de error generados por la interfaz.

### 5.2 Verificación E2E

Se usa `pnpm dev` con un servicio simulado en `localhost:8000` y `LARAVEL_API_URL` apuntando a él. La interacción se verifica con Playwright o Chrome DevTools MCP, ya disponibles; no se agregan dependencias.

Escenarios:

- Desde `/login`, “Recuperar contraseña” navega a `/password-recovery`.
- Correo vacío o inválido: error local y ninguna petición.
- Solicitud exitosa: una sola petición con `{ email }`, mensaje visible y llegada a `/password-recovery/reset` con el correo enmascarado.
- Recarga de la pantalla de cambio: se conserva el correo enmascarado y no se repite el cambio.
- Acceso directo a `/password-recovery/reset` sin solicitud: aviso y acción para volver a solicitar.
- Solicitud vencida: se fuerza `requestedAt` a más de 15 minutos en `sessionStorage`, se recarga y aparece el aviso de vencimiento con la acción.
- Correo no registrado por `422` y por `404`: mensaje junto al campo y permanencia en la solicitud.
- Fallo de red, `429`, `500`, cuerpo inválido y `2xx` con errores: aviso general, correo conservado y reintento posible.
- Doble clic y Enter repetido en la solicitud: una sola petición.
- Pantalla de cambio: cinco casillas, contraseña y confirmación ocultas con toggles independientes.
- OTP: tipeo con avance, Retroceso, flechas, ceros iniciales y pegado de `12-345`, `12 34 5`, `ab12cd34ef5` y `00123` desde cualquier casilla.
- Código incompleto: mensaje y ninguna petición.
- Contraseña fuera de política, con emoji, y confirmación distinta: mensajes por campo y ninguna petición.
- Código inválido: mensaje, casillas limpias, foco en la primera y contraseña y confirmación conservadas.
- Errores por campo del servicio: se muestran junto al campo correspondiente; un error desconocido va al banner.
- `404` y correo no registrado en el cambio: mensaje y opción de volver a solicitar.
- Timeout del cambio: mensaje específico, sin reintento automático y con las dos alternativas.
- Red, `429`, `500`, cuerpo inválido y `2xx` con errores en el cambio: aviso general y valores conservados.
- Éxito: mensaje “Contraseña restablecida correctamente.”, acción “Ir a iniciar sesión”, sin cookie de sesión y sin redirección automática.
- Contra el servicio simulado: la contraseña anterior deja de ser válida y la nueva permite iniciar sesión.
- “Volver a solicitar”: vuelve con el correo precargado, sin envío automático y sin código, contraseña ni errores.
- Recarga o “atrás” después del éxito: no se repite el cambio.
- Dos pestañas con correos distintos: cada una conserva su solicitud y su correo enmascarado.
- Accesibilidad: etiquetas, `aria-invalid`, `aria-describedby`, `aria-live`, foco visible, orden de tabulación, controles de 44 × 44 px y contraste AA.
- Responsive: 320, 375, 768, 1024, 1440 y 1920 px sin desbordamiento horizontal.
- Privacidad: la URL, `document.cookie`, `localStorage`, la consola del navegador y el HTML no contienen correo sin enmascarar, código, contraseña ni confirmación; `sessionStorage` solo contiene correo e instante.

### 5.3 Verificación estática

- `pnpm exec tsc --noEmit` sin errores.
- `pnpm lint` sin errores; se aceptan los avisos preexistentes de `<img>`.
- `node --experimental-strip-types --test` con la suite completa en verde.
- `pnpm build` en verde, con las dos rutas generadas y sin advertencias de CSS o Turbopack.
- `package.json` sin dependencias nuevas.

## 6. Cobertura de requisitos

### 6.1 Requisitos funcionales

| Requisito | Implementación principal | Verificación |
| --- | --- | --- |
| RF-1 | `app/password-recovery/page.tsx`, `request-recovery-form.tsx` | E2E de acceso y campo |
| RF-2 | `validation/password-recovery.ts` y `storage` del formulario | Tests unitarios y E2E |
| RF-3 | `validateRecoveryEmail` y formulario | Tests unitarios y E2E |
| RF-4 | `request-recovery-form.tsx` con `aria-busy` y bloqueo | E2E de doble envío |
| RF-5 | `requestRecoveryAction`, aviso de un consumo y navegación | E2E de éxito |
| RF-6 | `parseRequestRecoveryResponse` y acción | Tests unitarios y E2E |
| RF-7 | Clasificación de `404` en solicitud | Tests unitarios y E2E |
| RF-8 | Clasificación de fallos y conservación del correo | Tests unitarios y E2E |
| RF-9 | `reset-password-form.tsx`, `maskRecoveryEmail` | E2E de correo enmascarado |
| RF-10 | `parseRecoveryRequest` nulo y aviso de ausencia | Tests unitarios y E2E |
| RF-11 | `isRecoveryExpired` y aviso de vencimiento | Tests unitarios y E2E |
| RF-12 | `request-value.ts` y `storage.ts` con 15 minutos | Tests unitarios y E2E de recarga |
| RF-13 | `reset-password-form.tsx` y `recovery-code-field.tsx` | E2E de estructura |
| RF-14 | `PasswordInput` con dos toggles | E2E de visibilidad |
| RF-15 | `recovery-code-field.tsx` y helpers de código | Tests unitarios y E2E |
| RF-16 | `applyRecoveryPaste` | Tests unitarios y E2E de pegado |
| RF-17 | `validateRecoveryCode` y acción | Tests unitarios y E2E |
| RF-18 | `validateNewPassword` con política del registro | Tests unitarios y E2E |
| RF-19 | `passwordsMatch` y mensaje de confirmación | Tests unitarios y E2E |
| RF-20 | Envío explícito, bloqueo y `aria-busy` | E2E de doble envío |
| RF-21 | Estado de éxito y enlace a `/login` | E2E de éxito |
| RF-22 | `invalid_code`, limpieza del OTP y foco | Tests unitarios y E2E |
| RF-23 | `mapResetFieldErrors` y banner para desconocidos | Tests unitarios y E2E |
| RF-24 | `422` con correo no registrado y acción | Tests unitarios y E2E |
| RF-25 | `404` en el cambio | Tests unitarios y E2E |
| RF-26 | Clasificación de fallos y conservación de valores | Tests unitarios y E2E |
| RF-27 | Resultado `timeout` y mensaje específico | Tests unitarios y E2E de timeout |
| RF-28 | Acción “Volver a solicitar” y precarga | E2E |
| RF-29 | Sin cuenta atrás ni contador | Revisión de UI y E2E |
| RF-30 | Enlace de `login-form.tsx` | E2E de navegación |
| RF-31 | Código de un solo uso en el servicio y OTP descartado | E2E de reutilización |
| RF-32 | Sin cookies de sesión ni tokens | E2E y revisión de la acción |
| RF-33 | `validateNewPassword` no compara con la anterior | Tests unitarios |
| RF-34 | Limpieza de error al editar cada campo | E2E |

### 6.2 Requisitos no funcionales

| Requisito | Implementación principal | Verificación |
| --- | --- | --- |
| RNF-1 | Etiquetas, `aria-live`, foco, teclado y tamaños | Árbol de accesibilidad y E2E |
| RNF-2 | Composición responsive de tarjetas y formularios | 320 a 1920 px |
| RNF-3 | `sessionStorage` mínimo, máscara y sin logs sensibles | Revisión de URL, consola, HTML y almacenamiento |
| RNF-4 | Timeout de 10 s y clasificación de fallos | Tests unitarios y E2E |
| RNF-5 | Textos en español y política compartida | Revisión de UI y tests |
| RNF-6 | Sin instalaciones | Revisión de `package.json` |
| RNF-7 | Rutas públicas sin sesión | E2E sin cookies |
| RNF-8 | `metadata` por ruta | Inspección del HTML |
| RNF-9 | Bloqueo de envíos duplicados | E2E de doble envío |
| RNF-10 | `loading.tsx` y `error.tsx` por segmento | Revisión de archivos y build |
| RNF-11 | `sessionStorage` por pestaña y POST sin caché | E2E de dos pestañas y revisión de red |
| RNF-12 | Parseo de `message` y `errors` sin depender de `data` | Tests unitarios |

## 7. Riesgos y dependencias

- **Contrato del backend.** La clasificación depende de los textos y de las claves de `errors`. Si el servicio cambia el mensaje de correo no registrado o de código inválido, hay que ajustar los patrones y los tests. El contrato actual está documentado en la spec y en el código del backend.
- **Correo no registrado y enumeración.** El mensaje explícito permite saber si una cuenta existe. Es un riesgo aceptado por el usuario.
- **Sin límite de solicitudes ni de intentos.** Un código de cinco dígitos es vulnerable a fuerza bruta. La interfaz no puede mitigarlo sin backend; queda como riesgo aceptado.
- **Códigos anteriores vigentes.** Una nueva solicitud no invalida los códigos previos en el servicio. La interfaz conserva solo la última solicitud; un código anterior podría seguir siendo aceptado.
- **Cuentas eliminadas y `404`.** El `404` se trata como correo no registrado; si proviniera de otra causa, el mensaje sería impreciso.
- **Cuenta no verificada.** El cambio puede completarse, pero el login puede fallar hasta verificar el correo. La interfaz no lo advierte porque la spec no lo pide.
- **Política de contraseña más estricta en la interfaz.** Un cliente que omita la interfaz podría establecer una contraseña más débil; el servicio solo exige 8 caracteres.
- **Timeout del cambio.** No se puede confirmar si la contraseña cambió; por eso no se reintenta automáticamente y se ofrecen las dos alternativas.
- **`sessionStorage` no disponible o lleno.** Si falla la escritura, la pantalla de cambio mostrará “No hay una solicitud de recuperación activa”. Se maneja el error sin romper el flujo.
- **Dos pestañas.** El aislamiento es por pestaña; cerrar la pestaña descarta la solicitud. Es coherente con RF-12 y con el caso límite de dos pestañas, y evita compartir el correo entre pestañas.
- **Cambio de spec 006.** El enlace deja de apuntar a `/home`; la spec 006, su plan y sus tareas deben quedar alineados para no contradecirse.
- **Reloj del navegador.** La vigencia visible depende del reloj local; un desfase puede mostrar el aviso antes o después. El servicio sigue siendo la autoridad y puede aceptar o rechazar el código.
- **Server Actions y redirecciones.** Las acciones devuelven estado; la navegación la hace el cliente. No se usa `redirect` dentro de las acciones para no perder el mensaje de éxito ni los errores por campo.

## 8. Verificación final

- [x] “Recuperar contraseña” en `/login` lleva a `/password-recovery`.
- [x] La solicitud valida el correo, envía una sola petición y muestra el mensaje de confirmación.
- [x] El correo no registrado y el `404` muestran el mensaje de la spec y no avanzan.
- [x] La pantalla de cambio muestra el correo enmascarado, cinco casillas y los dos campos de contraseña.
- [x] El OTP acepta solo dígitos, conserva ceros iniciales, avanza, retrocede, permite flechas y pega desde la primera casilla.
- [x] La política de contraseña y la confirmación se validan antes de llamar al servicio.
- [x] El código inválido limpia las casillas, enfoca la primera y conserva las contraseñas.
- [x] “Volver a solicitar” precarga el correo y no envía nada automáticamente.
- [x] El éxito muestra el mensaje y “Ir a iniciar sesión”, sin iniciar sesión.
- [x] La contraseña anterior deja de funcionar y la nueva permite iniciar sesión en el servicio simulado.
- [x] El timeout del cambio muestra el mensaje específico y las dos alternativas.
- [x] Red, `429`, `5xx`, cuerpos inválidos y `2xx` con errores conservan los valores necesarios.
- [x] Las pantallas son accesibles, responsive y no exponen código ni contraseña.
- [x] `tsc --noEmit`, lint, tests y build en verde.
- [x] Sin dependencias nuevas.
- [x] `MEMORY.md` actualizado.

## 9. Dudas abiertas que afectan al plan

- [NO BLOQUEANTE] ¿El servicio devuelve el correo no registrado en el cambio como `422` con `errors.email` o como `404`? El plan cubre ambos.
- [NO BLOQUEANTE] ¿El código inválido llega como `message` general o también como `errors.code`? El plan reconoce ambas formas.
- [NO BLOQUEANTE] ¿Se permite pegar la contraseña nueva? El plan lo permite por usabilidad y por gestores de contraseñas; si se prefiere el bloqueo del registro, se cambia una prop.
- [NO BLOQUEANTE] ¿La pantalla de cambio debe advertir que la cuenta no está verificada? La spec no lo pide; el plan no lo agrega.
- [NO BLOQUEANTE] ¿La solicitud vencida debe ocultar el formulario o solo deshabilitarlo? El plan lo reemplaza por el aviso y la acción, sin cuenta atrás.
- [NO BLOQUEANTE] ¿El aviso de solicitud enviada debe permanecer visible o desaparecer al primer cambio? El plan lo muestra una sola vez al entrar y lo consume.
- [NO BLOQUEANTE] ¿Se debe limpiar la contraseña del estado al llegar al éxito? El plan reemplaza el formulario por el mensaje, con lo que el estado se descarta al desmontar.

## 10. Orden de implementación sugerido para `tasks.md`

1. Funciones puras de validación, solicitud y pegado, con tests.
2. Parseo y cliente de los dos endpoints, con tests.
3. Server Actions.
4. Almacenamiento por pestaña y campo OTP.
5. Formulario de solicitud y ruta.
6. Formulario de cambio y ruta.
7. `loading.tsx`, `error.tsx`, metadata y enlace desde login.
8. Actualización de la spec 006.
9. E2E, accesibilidad, responsive y verificación final.
10. Cierre de `MEMORY.md`.
