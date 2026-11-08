# Tasks 004 — Registro de Usuarios

**Spec:** `specs/004-auth-register/spec.md` (Estado: implementada; dudas abiertas)
**Plan:** `specs/004-auth-register/plan.md`
**Estado:** Fases A–J completadas (T1–T22, T24–T39); T23 diferida; spec cerrada como implementada con los cambios de Fase I y Fase J incorporados; dudas abiertas de spec.

## Decisiones previas

- [x] **D1. Aprobar el plan.** Aprobado con revisión previa; T1 no inicia hasta revisar el plan actualizado.
- [x] **D2. Tipografía e idioma.** Resuelto: se mantiene Geist y `lang="en"`; excepción aprobada a RNF-1 y deuda de idioma registrada.
- [x] **D3. Contraste de errores.** Resuelto: texto principal más borde e icono rojo.
- [x] **D4. EC-9 y contraseñas.** Resuelto: se recortan los campos de texto; la contraseña no.
- [x] **D5. Destino `/verify-email`.** Resuelto: se acepta el 404 temporal hasta la spec de verificación.
- [x] **D6. Tests sin runner nuevo.** Resuelto: `node --experimental-strip-types --test`, sin Vitest ni Jest.

## Fase A — Preparación

**Estado:** completada. Cubre: RF-12, RF-13; RNF-1 (excepción D2), RNF-6.

- [x] **T1. Instalar y verificar `react-day-picker` 10.0.2.** RF-12, RF-13; RNF-6.
  - Depende de: D1 (revisión previa del plan).
  - Hecho cuando: `package.json` declara `react-day-picker` en `10.0.2`, el lockfile se actualiza, no hay otras dependencias directas nuevas y `pnpm build` termina sin errores.
  - Evidencia (2026-10-20): `package.json` declara `react-day-picker` en `10.0.2`; el lockfile se actualizó con `date-fns@4.4.0` y `@date-fns/tz@1.5.0` como transitivas; `pnpm build` terminó en verde.

- [x] **T2. Verificar el import de estilos y la API de `react-day-picker` con Next.js 16 y Turbopack.** RF-12, RF-13; RNF-6.
  - Depende de: T1.
  - Hecho cuando: un render temporal de `DayPicker` con `react-day-picker/style.css` compila y muestra el calendario con estilos en `pnpm dev`; el render temporal se elimina y `pnpm build` sigue en verde. Si falla, se detiene y se reporta antes de continuar; no se instala `@daypicker/react` sin aprobación.
  - Evidencia (2026-10-20): el render temporal `/daypicker-check` respondió 200 en `pnpm dev`, incluyó las clases `rdp-root`/`rdp-day` y cargó el CSS de `react-day-picker` (9.552 bytes) con `--rdp-accent-color`; el render temporal se eliminó y `pnpm build` terminó en verde.

- [x] **T3. Registrar la excepción de tipografía e idioma.** RNF-1.
  - Depende de: D2 resuelta.
  - Hecho cuando: se documentan la excepción a RNF-1 por Geist y la deuda de idioma por `lang="en"`; no se modifica `app/layout.tsx` ni `app/globals.css`; no se introduce una fuente nueva en `/register`; `pnpm build` sigue en verde.
  - Evidencia (2026-10-20): excepción y deuda registradas en `plan.md` §4.6 y en `MEMORY.md`; no se modificaron `app/layout.tsx` ni `app/globals.css`; no se agregó una fuente nueva; `pnpm build` y `pnpm lint` (0 errores) terminaron en verde.

## Fase B — Lógica pura

**Estado:** completada. Cubre: RF-2, RF-3, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15, RF-22; RNF-7.

- [x] **T4. Definir tipos y constantes de registro.** RF-2, RF-7, RF-8, RF-9, RF-10, RF-11, RF-14, RF-22; RNF-7.
  - Depende de: T1.
  - Hecho cuando: `app/lib/validation/register.ts` exporta `RegisterField`, `RegisterInput`, `RegisterPayload`, `FieldErrors`, `RegisterActionState`, `RegisterApiResult` y `BirthdateError`; `RegisterPayload` tiene exactamente las ocho claves y ninguna `confirmPassword`; `pnpm exec tsc --noEmit` pasa; no hay `any`.
  - Evidencia (2026-10-20): tipos, constantes y mensajes creados en `app/lib/validation/register.ts`; `pnpm exec tsc --noEmit` pasa; búsqueda sin `any` en el archivo nuevo.

- [x] **T5. Implementar normalización de texto, dígitos, CUIL y fechas ISO.** RF-7, RF-8, RF-9, RF-14; EC-8, EC-9, EC-17.
  - Depende de: T4.
  - Hecho cuando: `trimText`, `normalizeDigits`, `normalizeCuil`, `toIsoDate`, `fromIsoDate` y `formatDisplayDate` están implementadas; `formatDisplayDate` produce `DD/MM/YYYY`; una comprobación con `node --experimental-strip-types` confirma que un CUIL con guiones produce 11 dígitos, que los espacios se recortan en textos pero no en contraseña ni confirmación, y que una fecha local no se corre de día.
  - Evidencia (2026-10-20): normalización y fechas implementadas; los tests cubren `20-12345678-9` → `20123456789`, recorte de textos, `DD/MM/YYYY`, ida y vuelta ISO y rechazo de `2023-02-29`.

- [x] **T6. Implementar edad, fecha máxima y matcher del calendario.** RF-12, RF-13, RF-14; EC-6, EC-7, EC-14.
  - Depende de: T4, T5.
  - Hecho cuando: `getMaxBirthdate`, `calculateAge`, `getBirthdateError` y `getCalendarDisabledMatcher` devuelven los resultados esperados para hoy, mañana, 18 años hoy, 17 años y 364 días, 29 de febrero en año bisiesto y 28 de febrero en año no bisiesto; el matcher solo deshabilita hoy y el futuro; una fecha pasada de una persona menor de 18 es seleccionable y produce el mensaje de edad.
  - Evidencia (2026-10-20): tests de 18 años exactos, 17 años y 364 días, 29/02 con 28/02 en año no bisiesto, fecha máxima, errores `required`/`invalid`/`future`/`underage` y matcher que solo bloquea hoy/futuro.

- [x] **T7. Implementar los validadores de campos.** RF-3, RF-5, RF-7, RF-8, RF-9, RF-10, RF-11; EC-4, EC-5, EC-8, EC-15, EC-16.
  - Depende de: T5.
  - Hecho cuando: `isValidDni`, `isValidCuil`, `isValidPhone`, `isValidEmail`, `isValidName`, `isValidPassword` y `passwordsMatch` están implementadas; `isValidPassword` exige 8 a 16 caracteres, mayúscula, minúscula y número o carácter especial, y rechaza emojis; `passwordsMatch` exige coincidencia exacta, no vacía y no solo espacios; `isValidPhone` rechaza `+54`; `isValidName` no cuenta espacios; `pnpm exec tsc --noEmit` pasa.
  - Evidencia (2026-10-20): validadores implementados y tests de DNI, CUIL, teléfono con/sin `+54`, correo, nombres con espacios, contraseña con complejidad, rechazo de emojis y confirmación vacía/espacios/capitalización distinta.

- [x] **T8. Implementar la validación agregada y el payload exacto.** RF-2, RF-6, RF-14, RF-15; EC-9, EC-14, EC-15, EC-16, EC-17.
  - Depende de: T6, T7.
  - Hecho cuando: `validateRegisterInput` devuelve validez, errores por campo y payload solo si todo es válido; `buildRegisterPayload` produce exactamente las ocho claves, con DNI, CUIL y teléfono normalizados, textos recortados y `birthdate` en `YYYY-MM-DD`; la contraseña no se recorta y la confirmación no se envía; el formulario tiene nueve controles.
  - Evidencia (2026-10-20): `validateRegisterInput` y `buildRegisterPayload` implementados; tests verifican payload de ocho claves sin `confirmPassword`, normalización, contrato de nueve controles y `payload: null` ante errores.

- [x] **T9. Escribir los tests unitarios de validación y fechas.** RF-3, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13, RF-14; EC-4, EC-5, EC-6, EC-7, EC-8, EC-9, EC-14, EC-15, EC-16, EC-17, EC-18.
  - Depende de: T8.
  - Hecho cuando: `node --experimental-strip-types --test tests/validation/register.test.ts` pasa con DNI, CUIL, teléfono sin `+54`, correo, nombres sin contar espacios, contraseña con complejidad y sin emojis, confirmación vacía, con espacios o con distinta capitalización, edad, 29 de febrero y 28 de febrero, fecha mostrada `DD/MM/YYYY`, fechas inválidas y payload exacto, sin agregar dependencias.
  - Evidencia (2026-10-20): `node --experimental-strip-types --test tests/validation/register.test.ts` pasa 7/7 tests; `pnpm exec tsc --noEmit` y `pnpm build` en verde; `tsconfig.json` habilita `allowImportingTsExtensions` para los imports `.ts` del runner nativo.

## Fase C — API

**Estado:** completada. Cubre: RF-15, RF-17, RF-18, RF-19, RF-22, RF-23; RNF-7; EC-2, EC-3, EC-12.

- [x] **T10. Implementar el parseo de `{ data, message, errors }`.** RF-17, RF-18, RF-19, RF-22; EC-2, EC-3, EC-12.
  - Depende de: T4.
  - Hecho cuando: `isRecord`, `toStringArray`, `getApiMessage`, `mapApiErrorsToFieldErrors` y `parseRegisterResponse` manejan 2xx con errores vacíos, 2xx con errores, 422 con objeto de campos, 422 con arreglo, 500 y cuerpo no JSON; `pnpm exec tsc --noEmit` pasa; no hay `any`.
  - Evidencia (2026-10-21): `app/lib/api/auth.ts` implementa los helpers y el parseo; 2xx sin errores es éxito, 2xx con errores y 422 mapean campos conocidos, los errores generales y claves desconocidas van al banner, y 500, 3xx y cuerpos inválidos devuelven fallo; `pnpm exec tsc --noEmit` pasa; sin `any`.

- [x] **T11. Escribir los tests del parseo de respuestas.** RF-17, RF-18, RF-19, RF-22; EC-2, EC-3, EC-12.
  - Depende de: T10.
  - Hecho cuando: `node --experimental-strip-types --test tests/api/parse.test.ts` pasa con los casos de 2xx, 422 con objeto, 422 con arreglo, 500, 3xx y cuerpo no JSON.
  - Evidencia (2026-10-21): `node --experimental-strip-types --test tests/api/parse.test.ts` pasa 8/8 tests; cubre 2xx con y sin errores, 422 con objeto y arreglo, 500, 3xx y cuerpo no JSON.

- [x] **T12. Implementar el cliente HTTP `registerUser`.** RF-15, RF-17, RF-18, RF-19, RF-22, RF-23; RNF-7.
  - Depende de: T8, T10.
  - Hecho cuando: `app/lib/api/auth.ts` hace `POST` a `LARAVEL_API_URL` más `/api/auth/register`, con `Content-Type`, `Accept: application/json`, `credentials: omit`, `cache: no-store`, `redirect: manual` y timeout de 10 segundos; devuelve `RegisterApiResult`; no importa React ni componentes de `app/ui`.
  - Evidencia (2026-10-21): `registerUser` hace `POST` a `${LARAVEL_API_URL}/api/auth/register` con las cabeceras, credenciales, caché, redirección manual y timeout de 10 s mediante `AbortSignal.timeout`; devuelve `RegisterApiResult`; no importa React ni `app/ui`; `pnpm exec tsc --noEmit` pasa.

- [x] **T13. Escribir los tests del cliente HTTP.** RF-15, RF-17, RF-18, RF-19, RF-22, RF-23.
  - Depende de: T12.
  - Hecho cuando: con `fetch` simulado, los tests verifican método, URL, cabeceras, credenciales, timeout, 2xx, 422, 500, 3xx, error de red y que el cuerpo tiene exactamente ocho claves y el resultado no contiene la contraseña.
  - Evidencia (2026-10-21): `node --experimental-strip-types --test tests/api/auth.test.ts` pasa 5/5 tests; verifica método, URL, cabeceras, credenciales, timeout, 2xx, 422, 500, 3xx, error de red, cuerpo de ocho claves y ausencia de la contraseña en el resultado. Los tests de API pasan 13/13; `pnpm lint` termina con 0 errores (4 avisos preexistentes) y `pnpm build` en verde.

## Fase D — Server Action

**Estado:** completada. Cubre: RF-6, RF-15, RF-16, RF-17, RF-18, RF-19, RF-20, RF-22, RF-23; EC-1, EC-2, EC-3, EC-12.

- [x] **T14. Implementar el Server Action `registerAction`.** RF-6, RF-15, RF-16, RF-17, RF-18, RF-19, RF-20, RF-22, RF-23; EC-1, EC-2, EC-3, EC-12.
  - Depende de: T8, T12.
  - Hecho cuando: `app/lib/actions/auth.ts` lee `FormData`, revalida con `validateRegisterInput`, no llama a la API si hay errores, construye el payload exacto, llama a `registerUser`, redirige a `/verify-email` en 2xx y devuelve estado con mensaje y errores en los demás casos; `pnpm exec tsc --noEmit` pasa; solo este módulo importa `registerUser`.
  - Evidencia (2026-10-21): `app/lib/actions/auth.ts` es un Server Action (`"use server"`) que lee los nueve controles, revalida sin llamar a la API si hay errores, usa el payload exacto de ocho claves, llama a `registerUser` y redirige a `/verify-email` en 2xx. En fallos devuelve `RegisterActionState` con mensaje, errores por campo y valores ingresados. `pnpm exec tsc --noEmit` y `pnpm build` terminan en verde; `pnpm lint` reporta 0 errores (4 avisos preexistentes) y los 20 tests existentes pasan. En `app/` solo este módulo importa `registerUser`.

## Fase E — Componentes de UI

**Estado:** completada. Cubre: RF-2, RF-3, RF-4, RF-5, RF-12, RF-13, RF-14; RNF-2, RNF-3, RNF-5; EC-4, EC-5, EC-6, EC-7, EC-13, EC-14, EC-16, EC-17.

- [x] **T15. Crear `TextField` accesible.** RF-2; RNF-2, RNF-3.
  - Depende de: T4.
  - Hecho cuando: el componente renderiza etiqueta asociada, input, ayuda y errores; usa `aria-invalid` y `aria-describedby`; no tiene estado propio, no hace `fetch` y `pnpm lint` no reporta errores nuevos.
  - Evidencia (2026-10-21): `app/ui/auth/text-field.tsx` asocia etiqueta e input, renderiza ayuda y error con `aria-invalid` y `aria-describedby`, y no tiene estado ni `fetch`. `pnpm exec tsc --noEmit`, `pnpm lint` (0 errores nuevos) y `pnpm build` en verde.

- [x] **T16. Crear `PasswordInput` con visibilidad, complejidad y protección.** RF-3, RF-4, RF-5; EC-4, EC-5, EC-16; RNF-5.
  - Depende de: T7, T15.
  - Hecho cuando: alternar el botón cambia el tipo del input sin modificar el valor; 7 y 17 caracteres o la falta de mayúscula, minúscula, número o carácter especial muestran error; 8 y 16 con la complejidad completa no; se rechazan emojis; se bloquean pegado y autocompletado en contraseña y confirmación; el botón comunica su estado con `aria-pressed` y etiqueta dinámica; el valor no se registra en logs.
  - Evidencia (2026-10-21): `app/ui/auth/password-input.tsx` alterna `password`/`text` sin modificar el valor, valida complejidad con `isValidPassword` y muestra el error correspondiente, bloquea pegado y arrastre, fija `autoComplete="off"` y expone `aria-pressed` con etiqueta dinámica. La validación de T7 cubre 7/17 caracteres, complejidad, emojis y confirmación; no hay logs del valor. Verificado en el render estático: con `Abc` se mostró el mensaje de complejidad, `aria-pressed="false"`, etiqueta "Mostrar contraseña" e input `type="password"`.

- [x] **T17. Crear `BirthdatePicker` con calendario, bloqueos, edad y salida ISO.** RF-12, RF-13, RF-14; EC-6, EC-7, EC-13, EC-14, EC-17.
  - Depende de: T2, T6, T15.
  - Hecho cuando: el calendario abre en español; hoy y el futuro están deshabilitados; la fecha máxima de 18 años es seleccionable; una fecha pasada de un menor de 18 es seleccionable y muestra el mensaje de edad; el input oculto contiene `YYYY-MM-DD`; la fecha visible se muestra `DD/MM/YYYY`; se opera con teclado.
  - Evidencia (2026-10-21): `app/ui/auth/birthdate-picker.tsx` usa `DayPicker` con locale `es`, matcher que solo bloquea hoy y el futuro, `defaultMonth` en la fecha máxima de 18 años, `startMonth` 1900, `endMonth` en el mes actual y `captionLayout="dropdown"`. El input oculto lleva `name="birthdate"` con ISO; el visible muestra `DD/MM/YYYY`; una fecha pasada de menor de 18 muestra el mensaje de edad. El render estático confirmó `rdp-root`, meses en español, `name="birthdate"` y `DD/MM/YYYY`; la navegación por teclado queda a cargo de `DayPicker`. `pnpm exec tsc --noEmit`, `pnpm lint` (0 errores nuevos) y `pnpm build` en verde.

## Fase F — Formulario, página y bordes

**Estado:** completada (T18–T22); T23 diferida. Cubre: RF-1, RF-2, RF-3, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-18, RF-19, RF-20, RF-21, RF-22; RNF-2, RNF-4, RNF-8; EC-1, EC-2, EC-3, EC-4, EC-5, EC-8, EC-9, EC-10, EC-11, EC-12, EC-14, EC-15, EC-16, EC-17, EC-18.

- [x] **T18. Crear el esqueleto del formulario con todos los campos.** RF-2, RF-21; RNF-2.
  - Depende de: T15, T16, T17.
  - Hecho cuando: el formulario renderiza los ocho campos del payload más la confirmación, con etiquetas y orden visual; los valores son controlados; no se llama a la API; `pnpm exec tsc --noEmit` y `pnpm lint` pasan.
  - Evidencia (2026-10-21): `app/ui/auth/register-form.tsx` renderiza los nueve controles en el orden del plan (nombre, apellido, DNI, CUIL, correo, teléfono, fecha, contraseña y confirmación), con `useState` para los valores controlados y sin `fetch` en el componente. El HTML estático de `/register` contiene los nueve `name` del formulario. `pnpm exec tsc --noEmit` y `pnpm lint` (0 errores, 4 avisos preexistentes) en verde.

- [x] **T19. Crear `app/register/page.tsx` con metadata y Navbar.** RF-1; RNF-8, RNF-4.
  - Depende de: T18.
  - Hecho cuando: `/register` es accesible sin sesión, renderiza el Navbar y el formulario, define título y descripción para buscadores y no hace `fetch`; `pnpm dev` muestra la ruta.
  - Evidencia (2026-10-21): `app/register/page.tsx` es una ruta pública con `Navbar`, tarjeta de superficie y `RegisterForm`; exporta `metadata` con título `Registrarse | EET N° 3100` y descripción propia. `/register` respondió 200 en `pnpm dev`, el HTML incluyó el título, la descripción, el Navbar y el formulario; no hay `fetch` en la página ni en el formulario. `pnpm build` generó `/register` como ruta estática.

- [x] **T20. Implementar la validación de cliente en tiempo real.** RF-3, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13, RF-14; EC-4, EC-5, EC-8, EC-9, EC-14, EC-15, EC-16, EC-17.
  - Depende de: T18.
  - Hecho cuando: los campos muestran errores al editar y al salir; contraseña y confirmación validan en tiempo real; el formulario bloquea el envío si hay errores; los valores no se recortan mientras se escribe.
  - Evidencia (2026-10-21): el formulario deriva `validateRegisterInput(values)` en cada cambio, marca cada campo como tocado al editar y al salir, y muestra el error correspondiente. `PasswordInput` valida complejidad en cada cambio y la confirmación usa `showPasswordPolicy={false}` con la comparación exacta del validador. `onSubmit` ejecuta una revalidación y hace `preventDefault` sin llamar al Server Action si hay errores. Los valores se guardan sin recortar; el recorte ocurre solo dentro de la validación y del payload. Los 20/20 tests de validación, parseo y API pasan; la interacción real en navegador queda para T26–T29.

- [x] **T21. Integrar `useActionState`, banner, errores de servidor y conservación de valores.** RF-6, RF-15, RF-17, RF-18, RF-19, RF-20, RF-22; EC-1, EC-2, EC-3, EC-12, EC-18.
  - Depende de: T14, T20.
  - Hecho cuando: el formulario envía al Server Action, muestra `isPending`, deshabilita el submit, muestra el banner y los errores por campo, oculta errores viejos del servidor al editar y conserva los valores después de errores de validación, internos y de conexión.
  - Evidencia (2026-10-21): el formulario usa `useActionState(registerAction, INITIAL_STATE)` y `formAction`; `isPending` se refleja en `aria-busy`, en el texto "Registrando" y en el `disabled` del submit. El banner de `state.message` usa `role="alert"`; `state.errors` se muestra por campo con `TextField`/`PasswordInput`/`BirthdatePicker`. Al editar se ocultan el error de ese campo y el banner del estado anterior (`clearedServerFields` y `hiddenMessageState`); los valores siguen en el estado local controlado después de errores de validación, internos y de conexión. El HTML estático incluyó la referencia al Server Action y `aria-busy="false"`; `pnpm build` en verde.

- [x] **T22. Agregar el botón principal, el secundario y el estado de carga.** RF-16, RF-20, RF-21; EC-10, EC-11.
  - Depende de: T21.
  - Hecho cuando: el botón principal envía, muestra "Registrando" y se deshabilita mientras `isPending`; el secundario es un enlace a `/login` con superficie, texto azul y borde, y se documenta que esa vista no existe todavía; Enter envía; el doble clic no dispara un segundo envío.
  - Evidencia (2026-10-21): el botón principal es `type="submit"`, usa el azul institucional, muestra "Registrando" y se deshabilita con `isPending`; el secundario es `Link` a `/login` con `bg-superficie`, `text-azul-institucional` y `border-borde-input`, y un comentario documenta que `/login` aún no existe. El envío con Enter usa el submit nativo del formulario. Un `useRef` bloquea un segundo `onSubmit` mientras el primero está en curso y `disabled` refuerza la protección. `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build` en verde.

- [ ] **T23. Diferido: `loading.tsx` y `error.tsx` del segmento.** RF-1.
  - Estado: fuera de alcance de esta spec por clarificación; se implementará después.
  - No se marca como completada en esta implementación.

## Fase G — Diseño y accesibilidad

**Estado:** completada (T24–T26). Cubre: RF-1, RF-2; RNF-2, RNF-3, RNF-4; EC-13.

- [x] **T24. Aplicar tokens y contraste de la vista.** RF-1; RNF-3.
  - Depende de: T19.
  - Hecho cuando: no se introducen colores HEX nuevos; se mantiene la tipografía Geist (excepción D2 a RNF-1); los textos informativos usan el token de texto principal; los errores usan texto principal con borde e icono de error; el foco es visible y el contraste de texto verifica al menos 4.5:1.
  - Evidencia (2026-10-21): no se agregó ningún HEX nuevo en los archivos de la vista; se mantiene Geist y `lang="en"` (D2). Los textos del formulario, ayudas y errores usan `text-texto-principal`; los placeholders se cambiaron de `placeholder` (1.88:1) a `text-texto-principal` (10.98:1) y se prefijaron con “Ej.:” para distinguirlos de los valores. Los errores conservan texto principal, borde `estado-error-borde` e icono `estado-error-texto`; el banner usa `role="alert"`. El foco visible se verificó en navbar, campos, toggle, botones y enlaces con anillos de 2 px. Contraste calculado: texto principal 10.98:1 y azul institucional 13.58:1 sobre superficie; ambos superan 4.5:1. `tsc --noEmit`, `pnpm lint` (0 errores, 4 avisos preexistentes) y `pnpm build` en verde.

- [x] **T25. Ajustar el responsive entre 320 y 1920 px.** RF-1; RNF-4.
  - Depende de: T22, T24.
  - Hecho cuando: en 320, 375, 768, 1024, 1440 y 1920 px no hay desplazamiento horizontal, solapamientos ni calendario cortado; los botones y campos se apilan correctamente.
  - Evidencia (2026-10-21): verificación en Brave/Chromium headless por CDP en 320, 375, 768, 1024, 1440 y 1920 px. En todos los anchos `documentElement.scrollWidth` quedó dentro del viewport y no se detectaron elementos visibles fuera de los márgenes. La tarjeta usa `p-3` en móvil y `sm:p-6`/`lg:p-8`; los botones se apilan en 320/375 y pasan a fila desde 768. El calendario usa tamaño de día `clamp(2.25rem, 7vw, 2.75rem)` (36 px en 320, 44 px desde el breakpoint), con `scrollWidth === clientWidth` en el contenedor del calendario en todos los anchos. Los campos pasan de una a dos columnas desde `md`. `pnpm build` en verde.

- [x] **T26. Revisar accesibilidad y operación por teclado.** RF-2; RNF-2, RNF-3; EC-13.
  - Depende de: T24, T25.
  - Hecho cuando: el recorrido con Tab sigue el orden visual, el foco es visible, las etiquetas y errores están asociados, el toggle de contraseña funciona con teclado, el calendario se opera con flechas y Enter, y el árbol de accesibilidad anuncia el estado de los campos.
  - Evidencia (2026-10-21): el recorrido con Tab en 1024 px siguió el orden visual: logo, enlaces de navbar, campos en el orden del formulario, calendario, contraseñas, botones y footer. En 320 px el orden fue logo, menú, campos apilados; el menú móvil abierto tampoco desbordó y sus enlaces reciben foco visible. Se añadió `navLayout="after"` en `DayPicker` para que el mes/año precedan a anterior/siguiente en el orden de tabulación. El toggle de contraseña respondió a Enter y Espacio, alternando `type` y `aria-pressed`. El calendario respondió a ArrowRight y Enter: el foco pasó al día siguiente y Enter seleccionó `2008-10-02`, reflejado como `02/10/2008` y en el input oculto. El árbol AX mostró nombres, `required`, `invalid` y descripciones de error; el error de DNI se asoció mediante `aria-describedby` y `aria-live="polite"`. `tsc --noEmit`, `pnpm lint` y `pnpm build` en verde.

## Fase H — Integración y cierre

**Estado:** completada (T27–T31). Cubre: RF-1 a RF-23; RNF-1 a RNF-8; EC-1, EC-2, EC-3, EC-10, EC-11, EC-12, EC-18.

- [x] **T27. Probar el camino feliz con el servicio simulado.** RF-15, RF-16, RF-22.
  - Depende de: T21, T22; D5.
  - Hecho cuando: un 2xx del servicio simulado produce la navegación a `/verify-email` y el payload recibido tiene exactamente ocho claves con `birthdate` en `YYYY-MM-DD`; se documenta que el destino muestra 404 hasta que exista la vista.
  - Evidencia (2026-10-21): servicio simulado en `localhost:8000/api/auth/register` con respuesta 201. El alta con `success@example.com` navegó a `/verify-email` en 827 ms. El payload recibido tuvo exactamente `birthdate, cuil, dni, email, lastname, name, password, user_phone`; `birthdate` fue `2008-10-01` (ISO), el CUIL se normalizó a `20123456789`, el teléfono a `1123456789` y `confirmPassword` no se envió. El servicio recibió una sola petición y el navegador no llamó a `:8000`. `GET /verify-email` respondió 404 y el body mostró “This page could not be found”; queda documentado como destino temporal hasta que exista la vista.

- [x] **T28. Probar errores de validación, servicio y red.** RF-17, RF-18, RF-19, RF-22; EC-1, EC-2, EC-3, EC-12, EC-18.
  - Depende de: T21, T22.
  - Hecho cuando: un 422 con errores de correo y DNI muestra cada mensaje junto a su campo; un 422 general y un 500 muestran el banner; un timeout, error de red, error de validación o error interno conserva los valores; el correo ya registrado se muestra junto al campo.
  - Evidencia (2026-10-21): con 422 por campo se mostraron “El correo ya está registrado.” y “El DNI ya está registrado.” junto a sus campos, con `aria-invalid="true"`; un 422 con `errors.general` mostró el banner “No se pudo completar el registro. El servicio rechazó la solicitud.”; un 500 mostró “Error interno del servicio.”; el correo ya registrado mostró su mensaje junto al campo. El error de red mostró “No se pudo conectar con el servicio. Intentá nuevamente.” y el timeout real (10,6 s) mostró “La solicitud tardó demasiado. Intentá nuevamente.”. En todos los casos se conservaron nombre, apellido, DNI, CUIL, correo, teléfono, fecha visible/ISO, contraseña y confirmación, y cada escenario generó una sola petición. Durante la prueba se detectó que `AbortSignal.timeout` nativo produce `TimeoutError`; se corrigió la detección en `app/lib/api/auth.ts` y se agregó cobertura unitaria (21/21 tests).

- [x] **T29. Probar doble envío, Enter y ausencia de llamada desde el navegador.** RF-20, RF-21, RF-23; EC-10, EC-11.
  - Depende de: T21, T22.
  - Hecho cuando: el doble clic y el Enter repetido generan una sola petición al servicio simulado; Enter envía igual que el botón principal; la pestaña Network no muestra peticiones a `localhost:8000`.
  - Evidencia (2026-10-21): el doble clic en el botón principal generó una sola petición y navegó a `/verify-email`; el Enter repetido (dos pulsaciones con 25 ms) generó una sola petición y navegó al mismo destino. En ambos escenarios los eventos de red del navegador no incluyeron ninguna URL con `:8000`; la llamada al servicio simulado ocurrió solo del lado del servidor.

- [x] **T30. Ejecutar la verificación estática final.** RF-1 a RF-23; RNF-1 a RNF-8.
  - Depende de: T27, T28, T29.
  - Hecho cuando: `pnpm lint` termina con cero errores, `pnpm exec tsc --noEmit` termina con cero errores y `pnpm build` finaliza correctamente; una búsqueda no encuentra `any`, `@ts-ignore` ni `fetch` en componentes de `app/ui`; no hay placeholders de clases con tres puntos entre corchetes en los archivos nuevos; se confirman la excepción D2 de RNF-1 con Geist y la deuda de idioma por `lang="en"`.
  - Evidencia (2026-10-21): `pnpm lint` terminó con 0 errores y 4 avisos preexistentes de `<img>`; `pnpm exec tsc --noEmit` sin salida; `pnpm build` compiló y generó las 6 páginas, incluida `/register` estática. La búsqueda no encontró `any`, `@ts-ignore`, `@ts-expect-error` ni llamadas `fetch` en `app/ui`. No hay placeholders de clases Tailwind con tres puntos entre corchetes; el único `[...]` es el spread `[message, ...generalErrors]` de `app/lib/actions/auth.ts`, que no es una clase. Se confirmaron `Geist`/`Geist_Mono` en `app/layout.tsx` y `lang="en"` (D2).

- [x] **T31. Actualizar `MEMORY.md`, marcar las tareas y cerrar la spec.** RF-1 a RF-23; RNF-1 a RNF-8.
  - Depende de: T30.
  - Hecho cuando: `MEMORY.md` registra la spec 004 como implementada, las tareas de este archivo quedan marcadas salvo T23, que queda diferida, y `specs/004-auth-register/spec.md` pasa a `Estado: implementada` con la evidencia de verificación.
  - Evidencia (2026-10-21): `MEMORY.md` registra la spec 004 como implementada y la Fase H completada; `tasks.md` marca T1–T22 y T24–T31, dejando T23 como diferida; `spec.md` pasa a `Estado: implementada` con la evidencia de E2E, 21/21 tests, lint, TypeScript y build.

## Fase I — Cambio visual y fecha editable

**Estado:** completada (T32–T37). Aprobada el 2026-10-21. Cubre: RF-24, RF-25, RF-26, RF-27; RNF-2, RNF-3, RNF-4; EC-13, EC-17.

Nota: T17, T18, T19 y T24–T26 documentan la versión anterior. La Fase I reemplaza el calendario inline por un modal, cambia el orden de los campos, agrega la fila de contraseñas y reduce el ancho de la tarjeta. Sus evidencias se conservan como historial.

- [x] **T32. Ajustar el ancho de la tarjeta y la distribución de los campos.** RF-24, RF-25; RNF-4.
  - Depende de: T19, T22.
  - Hecho cuando: la tarjeta usa el 95 % del ancho de referencia actual en escritorio (de unos 896 px a unos 851 px) y el 97 % en móvil, sin desplazamiento horizontal ni recorte; el orden visual es nombre, apellido, DNI, CUIL, fecha de nacimiento, correo, teléfono, contraseña y confirmación; la fecha ocupa fila propia; contraseña y confirmación comparten fila de dos columnas en escritorio y se apilan en móvil (320 y 375 px).
  - Evidencia (2026-10-21): `app/register/page.tsx` aplica `mx-auto w-[97%] md:w-[95%]` a la tarjeta. `app/ui/auth/register-form.tsx` quedó en nombre/apellido, DNI/CUIL, fecha a fila completa, correo/teléfono y contraseña/confirmación en una fila `grid-cols-1 md:grid-cols-2`. Verificación CDP (Brave headless): relación tarjeta/contenedor 0.97 en 320 y 375 px y 0.95 en 768, 1024, 1440 y 1920 px; `scrollWidth - innerWidth` negativo (sin overflow); contraseña y confirmación en la misma fila desde 768 px y apiladas en 320/375; orden de `name` del formulario: name, lastname, dni, cuil, birthdate, email, user_phone, password, confirmPassword.

- [x] **T33. Implementar la máscara y el parseo de la fecha editable.** RF-14, RF-26; EC-17.
  - Depende de: T5.
  - Hecho cuando: una utilidad pura acepta solo dígitos, inserta automáticamente las barras de DD/MM/YYYY mientras se escribe, permite borrar sin perder dígitos, rechaza fechas incompletas o imposibles y convierte el valor visible a ISO `YYYY-MM-DD`; no hay `any`.
  - Evidencia (2026-10-21): `formatDateInput` conserva hasta ocho dígitos e inserta las barras de forma progresiva; `parseDisplayDate` valida `DD/MM/YYYY` y devuelve ISO o cadena vacía. Ambas en `app/lib/validation/register.ts`, sin `any`. Verificación en navegador: "1"→"1", "12"→"12", "123"→"12/3", "1234"→"12/34", "12345"→"12/34/5", "12345678"→"12/34/5678"; "12/3" deja el input oculto vacío; "01012000"→visible "01/01/2000" e ISO "2000-01-01".

- [x] **T34. Escribir los tests unitarios de la fecha editable.** RF-14, RF-26; EC-17.
  - Depende de: T33.
  - Hecho cuando: los tests cubren solo dígitos, barras automáticas, borrado, entrada incompleta, fecha imposible, conversión a ISO y conservación del valor visible; el runner nativo termina en verde.
  - Evidencia (2026-10-21): `tests/validation/register.test.ts` suma dos pruebas: máscara progresiva (incluye borrado "12/34/567" y "12/34/56") y parseo a ISO (01/01/2000, 29/02/2024 válidos; 29/02/2023, 31/04/2000, incompletos y vacíos inválidos). Runner nativo en verde, 23/23 tests.

- [x] **T35. Reescribir `BirthdatePicker` con input editable, icono y modal.** RF-12, RF-13, RF-14, RF-26, RF-27; RNF-2, RNF-3; EC-6, EC-7, EC-13, EC-17.
  - Depende de: T6, T15, T33.
  - Hecho cuando: el input visible es editable por teclado con `inputMode="numeric"` y máscara DD/MM/YYYY; conserva el ISO en el input oculto `name="birthdate"`; el calendario no se abre al enfocar, escribir ni hacer clic en el campo; el icono adyacente abre el modal; el modal usa `DayPicker` con los bloqueos de hoy/futuro, el mensaje de edad y `defaultMonth`/`startMonth`/`endMonth` del plan; al seleccionar una fecha actualiza el input y cierra el modal; el modal no altera el layout, atrapa el foco, cierra con Escape o clic en el overlay y devuelve el foco al icono; se opera con teclado.
  - Evidencia (2026-10-21): `app/ui/auth/birthdate-picker.tsx` usa un input editable con `inputMode="numeric"`, `maxLength={10}` y máscara, sincroniza el ISO con el input oculto `name="birthdate"` y monta el calendario solo al abrir. Se agregó `app/ui/auth/birthdate-calendar-modal.tsx` con `role="dialog"`, `aria-modal="true"`, overlay `fixed`, bloqueo de scroll con compensación de barra, foco inicial, trampa de Tab, cierre con Escape y overlay, `DayPicker` con locale español, matcher hoy/futuro, mensaje de edad, `defaultMonth` en la fecha seleccionada o la máxima de 18 años, `startMonth` 1900 y `endMonth` en el mes actual. Verificación: el clic/enfoque en el campo no abre el modal; el icono lo abre (`aria-expanded` "true"); seleccionar el día 2 de enero de 2000 dejó visible "02/01/2000" e ISO "2000-01-02", cerró el modal y devolvió el foco al icono; Escape y overlay también cierran y devuelven el foco.

- [x] **T36. Verificar en E2E la fecha, el modal y el responsive.** RF-25, RF-26, RF-27; RNF-2, RNF-3, RNF-4; EC-13.
  - Depende de: T32, T34, T35.
  - Hecho cuando: la vista cumple U-3 y E2E-9 en navegador; el ancho reducido no genera overflow en 320, 375, 768, 1024, 1440 y 1920 px; solo el icono abre el calendario; el modal no desplaza el layout, atrapa el foco, cierra con Escape y overlay, selecciona la fecha y devuelve el foco; contraseña y confirmación se apilan en móvil.
  - Evidencia (2026-10-21): verificación por CDP con Brave headless (script `/tmp/opencode/cdp-t36.mjs`). Sin overflow en 320/375/768/1024/1440/1920 px; proporciones 0.97/0.95; contraseñas apiladas en móvil y en fila desde 768; modal abierto solo por el icono (clic y foco en el campo no lo abren); `layoutShift: false` comparando el rectángulo de la tarjeta antes y después; foco inicial dentro del diálogo y trampa de Tab sostenida en 30 pulsaciones; Escape cierra y devuelve el foco; overlay cierra; selección cierra y actualiza; `aria-expanded` pasa a "false" al cerrar. Los eventos de teclado reales de CDP se confirmaron con un listener de `keydown`.

- [x] **T37. Ejecutar la verificación final y cerrar la spec.** RF-24 a RF-27; RNF-1 a RNF-8.
  - Depende de: T36.
  - Hecho cuando: `pnpm lint` termina con cero errores, `pnpm exec tsc --noEmit` no reporta errores y `pnpm build` finaliza en verde; la búsqueda no encuentra `any`, supresiones ni `fetch` en componentes de `app/ui`; no hay placeholders de clases con tres puntos entre corchetes; `MEMORY.md` se actualiza y `spec.md` vuelve a `Estado: implementada` con la evidencia del cambio.
  - Evidencia (2026-10-21): `pnpm exec tsc --noEmit` sin salida; `pnpm lint` con 0 errores y los 4 avisos preexistentes de `<img>`; `pnpm build` en verde con `/register` estática; 23/23 tests nativos. La búsqueda no encontró `any`, `@ts-ignore`, `@ts-expect-error` ni `fetch` en `app/ui`; el único uso de corchetes con puntos suspensivos es el spread de `app/lib/actions/auth.ts`, que no es una clase Tailwind. `MEMORY.md` actualizado y `spec.md` vuelve a `Estado: implementada` con la evidencia de las Fases A–I.

## Fase J — Configuración de la URL del API

**Estado:** completada. Cubre: RF-28; EC-19; RNF-7.

- [x] **T38. Resolver la URL base del API desde `LARAVEL_API_URL` y eliminar el literal.**
  - RF: RF-28; EC-19.
  - Depende de: T10, T13 (cliente HTTP existente).
  - Hecho cuando: `app/lib/api/config.ts` resuelve la URL base desde `process.env.LARAVEL_API_URL` (con prioridad para el `baseUrl` explícito de los tests), recorta espacios, exige una URL absoluta `http`/`https`, quita la barra final y lanza un error tipado si falta, está vacía o es inválida; `app/lib/api/auth.ts` no contiene `http://localhost:8000` ni ningún valor por defecto; ante configuración inválida `registerUser` no llama a `fetch`, deja el detalle en la consola del servidor y devuelve un aviso general; se agrega `.env.example` y la excepción `!.env.example` en `.gitignore`; los tests cubren variable definida, ausente, con espacios y barra final, esquema inválido y prioridad del override.
  - Duración estimada: 25 min.
  - Evidencia (2026-10-21): `app/lib/api/config.ts` creado con `API_URL_ENV_VAR`, `ApiConfigurationError` y `getApiBaseUrl` (prioridad `baseUrl` explícito → `process.env.LARAVEL_API_URL`, recorte de espacios, URL absoluta `http`/`https` validada con `new URL`, barra final eliminada, evaluación en cada llamada). En `app/lib/api/auth.ts` se eliminaron `DEFAULT_API_URL` y `getBaseUrl`; ante configuración inválida `registerUser` no llama a `fetch`, registra `[register] <detalle>` en la consola del servidor y devuelve `status: null` con “El servicio de registro no está disponible en este momento. Intentá nuevamente.”. `.env.example` creado y `!.env.example` agregado a `.gitignore` después de `.env*`. Cuatro casos nuevos en `tests/api/auth.test.ts` (variable ausente, variable con espacios y barra final, prioridad del override y esquema inválido) con `process.env` y `console.error` restaurados en `finally`; 27/27 tests nativos, `tsc --noEmit` sin errores y `pnpm lint` con 0 errores.

- [x] **T39. Verificar y cerrar el cambio de configuración del API.**
  - RF: RF-28; EC-19; RNF-7.
  - Depende de: T38.
  - Hecho cuando: `grep -rn "localhost:8000" app/ tests/` no devuelve resultados; `pnpm lint`, `pnpm exec tsc --noEmit`, los tests nativos y `pnpm build` pasan; el E2E con el servicio simulado confirma el alta y el 422 con la URL tomada del entorno; con `LARAVEL_API_URL` ausente o vacía el formulario muestra el aviso general, conserva los datos y no se registra ninguna petición saliente; `MEMORY.md` y `README.md` documentan la variable.
  - Duración estimada: 25 min.
  - Evidencia (2026-10-21): `grep -rn "localhost:8000" app/` sin resultados; en `tests/` solo aparece como entrada negativa del caso “esquema inválido”, no como valor por defecto. El build de producción no contiene el literal y referencia `LARAVEL_API_URL` en el bundle de servidor, así que el valor se lee en cada petición y cambiarlo solo requiere reiniciar el proceso. Servidor reiniciado para cargar `.env` y servicio simulado en `:8000`: el alta con `ana.e2e@example.com` llegó a `POST http://localhost:8000/api/auth/register` (host `localhost:8000`, `Content-Type` y `Accept` JSON) con las ocho claves, `birthdate` `2000-01-01`, CUIL `20123456789`, teléfono `1123456789` y sin `confirmPassword`, y navegó a `/verify-email`; el 422 con `usado@example.com` mostró el banner “Datos inválidos.” y “El correo ya está registrado.” junto al campo, conservando los valores. Con `LARAVEL_API_URL=` el formulario mostró “El servicio de registro no está disponible en este momento. Intentá nuevamente.”, conservó los datos, el servicio simulado no recibió peticiones (contador 2 → 2) y la consola del servidor registró `[register] Falta la variable de entorno LARAVEL_API_URL.` sin exponerlo al navegador. `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`), `pnpm exec tsc --noEmit` sin errores, 27/27 tests nativos y `pnpm build` en verde. `README.md`, `.env.example` y `MEMORY.md` actualizados.
