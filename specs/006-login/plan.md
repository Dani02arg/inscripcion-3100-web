# Plan 006 — Inicio de sesión

Estado: aprobado

## 1. Alcance, principios y supuestos

Este plan implementa la spec 006 (aprobada el 2026-10-23). Cubre la pantalla pública de inicio de sesión, la autenticación contra `POST /api/auth/login`, la redirección a `/home` tras el éxito, los mensajes diferenciados de credenciales y el cambio de la verificación de email para que lleve a `/login`.

Principios aplicados de `docs/constitution.md`:

- SDD: la spec 006 manda; si una decisión no está en la spec, se detiene y se pregunta.
- TypeScript estricto: sin `any`, sin castings inseguros y sin supresión de errores.
- Separación de capas: ruta en `app/`, UI pura en `app/ui/`, red y helpers en `app/lib/`.
- UI pura: los componentes de `app/ui` reciben datos por props y no hacen HTTP.
- Server Components primero: la página es Server Component; el formulario es Client Component por usar estado y eventos.
- API centralizada en `app/lib/api` con el contrato uniforme del proyecto.
- Código, tipos, funciones y rutas en inglés; comentarios y textos visibles en español.
- Sin dependencias externas nuevas.
- `metadata` propia de la ruta.
- Verificación con TypeScript, lint, tests y build en verde.

Supuestos y límites:

- El servicio de login responde JSON con, al menos, `message` y `errors`; se espera compatibilidad con `{ data, message, errors }`.
- La distinción entre email no registrado y contraseña incorrecta se infiere de `errors.email` y `errors.password`, o del mensaje del servicio. Si el backend no permite distinguirlos, RF-15 y RF-16 quedan bloqueados hasta confirmar el contrato (ver §9).
- No se gestiona sesión ni token: el único efecto del éxito es la redirección a `/home`. La persistencia de sesión está fuera de alcance en la spec.
- Se permite pegar la contraseña y usar el autocompletado del navegador en login, manteniendo el bloqueo actual en el registro. Es una recomendación del plan sujeta a la duda abierta correspondiente.
- No se agregan `loading.tsx` ni `error.tsx` porque la ruta es estática y no incorpora datos asincrónicos. Se agregarán cuando la ruta los necesite, como exige el principio 12 en su ámbito de aplicación.

## 2. Archivos a crear y modificar

### 2.1 Crear

- `app/login/page.tsx`
  - Server Component público de la ruta `/login`.
  - Exporta `metadata` con título y descripción propios (RNF-8).
  - Renderiza la barra de navegación existente y la tarjeta institucional con el mismo tratamiento visual que registro y verificación (RNF-5).
  - Monta el formulario de login.
  - Cubre RF-1, RF-2, RNF-5, RNF-8.

- `app/ui/auth/login-form.tsx`
  - Client Component del formulario.
  - Estado local para email, contraseña, campos tocados, errores visibles y bloqueo de envío.
  - Usa `useActionState` con la acción de login.
  - Campo de email con etiqueta, validación y mensaje de error.
  - Campo de contraseña con visibilidad alternable y estado accesible.
  - Botón principal "Iniciar sesión" en azul institucional a la izquierda.
  - Enlace con apariencia de botón "Registrarse" en blanco a la derecha, hacia `/register`.
  - Enlace "Recuperar contraseña" debajo de los botones, hacia `/password-recovery`.
  - Indicador de progreso y bloqueo de envíos repetidos.
  - Cubre RF-1, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-19, RNF-1, RNF-2, RNF-4, RNF-7.

- `app/lib/validation/login.ts`
  - Tipos del formulario: campo, entrada, payload, errores por campo, resultado de validación y estado de la acción.
  - Constante con los campos del formulario.
  - Mensajes de error en español.
  - Funciones puras de validación y construcción del payload.
  - Reutiliza `trimText` e `isValidEmail` de `app/lib/validation/register.ts` para no duplicar reglas.
  - Cubre RF-10, RF-11, RF-19, CL-1, CL-2, CL-3, CL-4.

- `app/lib/api/login.ts`
  - Cliente del endpoint `POST /api/auth/login`.
  - Constantes de ruta y timeout de 10 segundos.
  - Tipos de éxito, fallo y clasificación de fallo.
  - Función pura de parseo y clasificación de la respuesta.
  - Función de envío con `fetch`, headers JSON, `credentials: "omit"`, `cache: "no-store"`, `redirect: "manual"` y `AbortSignal.timeout`.
  - Reutiliza `getApiBaseUrl` de `app/lib/api/config.ts` y `getApiMessage`, `isRecord` y `toStringArray` de `app/lib/api/auth.ts`.
  - No registra la contraseña en consola ni la incluye en el resultado.
  - Cubre RF-12, RF-15, RF-16, RF-17, CL-5, CL-6, CL-7.

- `app/lib/actions/login.ts`
  - Server Action de login.
  - Lee email y contraseña del formulario.
  - Revalida en el servidor antes de llamar al servicio.
  - Llama a `loginUser` y traduce el resultado al estado de la acción.
  - En éxito redirige a `/home`.
  - En email no registrado o contraseña incorrecta devuelve el error en el campo correspondiente.
  - En fallo general conserva los valores y devuelve un mensaje para el banner.
  - No escribe cookies ni gestiona sesión.
  - Cubre RF-10, RF-11, RF-12, RF-14, RF-15, RF-16, RF-17.

- `tests/validation/login.test.ts`
  - Tests unitarios de las funciones puras de validación.
  - Cubre RF-10, RF-11, RF-19 y los casos límite CL-1 a CL-4.

- `tests/api/login.test.ts`
  - Tests unitarios del cliente y del parseo de la respuesta.
  - Cubre RF-12, RF-15, RF-16, RF-17 y los casos límite CL-5 a CL-7.

### 2.2 Modificar

- `app/ui/auth/password-input.tsx`
  - Agrega props opcionales para permitir pegado, permitir arrastre y definir `autoComplete`.
  - Los valores por defecto conservan el comportamiento actual del registro (pegado y arrastre bloqueados, autocompletado desactivado).
  - El login usará pegado y arrastre permitidos y `autoComplete="current-password"`.
  - Mantiene el botón de visibilidad con `aria-pressed`, `aria-controls` y etiqueta dinámica.
  - Cubre RF-3, RF-4, RF-5, RNF-1, RNF-7.

- `app/ui/auth/verify-email-form.tsx`
  - Cambia la navegación de éxito de `/home` a `/login`.
  - Actualiza el texto del aviso accesible de éxito para mencionar el inicio de sesión.
  - Cubre RF-18, CL-9.

- `app/ui/auth/register-form.tsx`
  - Actualiza el comentario que indica que `/login` todavía no existe, ya que la ruta se crea en esta spec.
  - No cambia el comportamiento del registro.

- `MEMORY.md`
  - Registra el estado del plan y, al cerrar la implementación, las decisiones y verificaciones realizadas.

### 2.3 No se modifica

- `app/lib/api/auth.ts`: se reutilizan sus helpers exportados sin cambiar su contrato.
- `app/lib/api/config.ts`: la resolución de `LARAVEL_API_URL` ya es la adecuada.
- `app/lib/api-client.ts`: no se usa para login porque agrega token y cookies, y su manejo de errores no permite la clasificación fina que exige la spec.
- `app/ui/navbar.tsx`: el enlace a `/login` ya existe.
- `app/register/page.tsx`: el enlace a `/login` ya está implementado en el formulario de registro.

## 3. Funciones de lógica pura

### 3.1 Validación

- `validateLoginInput(input: LoginInput): LoginValidationResult`
  - Recorta el email y valida que no esté vacío y que tenga formato válido.
  - Valida que la contraseña no esté vacía, sin exigir complejidad ni longitud mínima: el login no debe rechazar credenciales válidas creadas con las reglas del registro.
  - Conserva la contraseña tal como fue ingresada, incluidos espacios internos y externos.
  - Devuelve `valid`, `errors` y `payload`; `payload` es `null` si hay errores.
  - Cubre RF-10, RF-11, RF-19, CL-1 a CL-4.

- `buildLoginPayload(input: LoginInput): LoginPayload`
  - Devuelve exactamente `{ email, password }` con el email recortado y la contraseña intacta.
  - No incluye campos adicionales.
  - Cubre RF-12, RF-19.

### 3.2 API

- `parseLoginResponse(status: number, body: unknown): LoginResult`
  - Considera éxito un estado 2xx sin errores en el cuerpo.
  - Si el cuerpo es inválido o no es un objeto, devuelve fallo general.
  - Extrae `message` y `errors`.
  - Clasifica como email no registrado cuando `errors.email` tiene contenido o el mensaje coincide con patrones de cuenta inexistente.
  - Clasifica como contraseña incorrecta cuando `errors.password` tiene contenido o el mensaje coincide con patrones de contraseña inválida.
  - En cualquier otro caso devuelve fallo general con el mensaje del servicio o el mensaje por defecto.
  - Nunca incluye la contraseña en el resultado.
  - Cubre RF-15, RF-16, RF-17.

- `loginUser(payload: LoginPayload, options?: LoginRequestOptions): Promise<LoginResult>`
  - Resuelve la URL base con `getApiBaseUrl`.
  - Si falta configuración, no llama a `fetch`, registra solo en el servidor y devuelve fallo general.
  - Hace `POST` a `/api/auth/login` con `{ email, password }`.
  - Usa timeout de 10 segundos y distingue timeout de error de conexión.
  - Cubre RF-12, RF-17.

### 3.3 Acción

- `loginAction(previousState: LoginActionState, formData: FormData): Promise<LoginActionState>`
  - Lee los campos, valida y, si hay errores, devuelve el estado sin llamar al servicio.
  - En éxito redirige a `/home`.
  - En email no registrado devuelve `errors.email` con el texto de la spec.
  - En contraseña incorrecta devuelve `errors.password` con el texto de la spec.
  - En fallo general devuelve `message` para el banner y conserva los valores.
  - No registra la contraseña.
  - Cubre RF-10, RF-11, RF-12, RF-14, RF-15, RF-16, RF-17.

## 4. Decisiones técnicas justificadas

1. **Página Server Component y formulario Client Component.**
   - Decisión: `app/login/page.tsx` es Server Component; `app/ui/auth/login-form.tsx` es Client Component.
   - Motivo: la página solo compone UI y metadata; el formulario necesita estado, eventos y `useActionState`. Cumple los principios 5 y 11.
   - Alternativa descartada: página Client Component completa; pierde metadata estática y mezcla composición con interacción.

2. **Server Action para la autenticación.**
   - Decisión: `app/lib/actions/login.ts` concentra la llamada al servicio.
   - Motivo: la UI no debe hacer HTTP (principio 4) y la acción permite revalidar en el servidor. Es el patrón ya usado en registro y verificación.
   - Alternativa descartada: `fetch` desde el componente; viola la separación de capas y expone la URL base al cliente.

3. **API de login en un módulo propio.**
   - Decisión: `app/lib/api/login.ts` con tipos y parseo propios, reutilizando helpers de `auth.ts`.
   - Motivo: mantiene la integración centralizada (principio 6) y separa el flujo de login del registro.
   - Alternativa descartada: agregar `loginUser` a `app/lib/api/auth.ts`; mezcla dos operaciones con payloads y errores distintos.

4. **Validación pura reutilizando reglas existentes.**
   - Decisión: `app/lib/validation/login.ts` importa `trimText` e `isValidEmail` de `register.ts`.
   - Motivo: evita duplicar la regla de correo y el recorte, y facilita tests unitarios.
   - Alternativa descartada: duplicar las funciones; genera divergencia entre registro y login.

5. **Reutilizar `PasswordInput` en lugar de crear otro campo.**
   - Decisión: extender `PasswordInput` con props opcionales y usar `showPasswordPolicy={false}` en login.
   - Motivo: el toggle, el estado accesible y el estilo ya están resueltos; el registro conserva su comportamiento por los valores por defecto.
   - Alternativa descartada: crear un `LoginPasswordInput`; duplica lógica y estilos.

6. **Mensajes diferenciados con clasificación por campos y mensaje.**
   - Decisión: `parseLoginResponse` prioriza `errors.email` y `errors.password`; si no existen, inspecciona el mensaje del servicio.
   - Motivo: cumple RF-15 y RF-16 sin depender de un contrato todavía no confirmado.
   - Alternativa descartada: mensaje único general; contradice la spec. Riesgo asumido: permite enumerar cuentas, decisión explícita del usuario.

7. **Sin gestión de sesión ni token.**
   - Decisión: el éxito solo redirige a `/home`; no se escribe cookie ni se guarda el token.
   - Motivo: la spec lo declara fuera de alcance y el contrato de respuesta no está definido.
   - Alternativa descartada: persistir un token; introduce una decisión de seguridad y de contrato no aprobada.

8. **Timeout de 10 segundos y opciones de red del proyecto.**
   - Decisión: `AbortSignal.timeout(10_000)`, `credentials: "omit"`, `cache: "no-store"` y `redirect: "manual"`.
   - Motivo: consistencia con registro y verificación, y cumplimiento de RF-17.
   - Alternativa descartada: timeout por defecto del navegador; no es medible ni uniforme.

9. **No usar `fetchAPI` de `app/lib/api-client.ts`.**
   - Decisión: el login usa su propio cliente en `app/lib/api/login.ts`.
   - Motivo: `fetchAPI` agrega token y cookies, y traduce los estados HTTP a mensajes genéricos; el login es público y necesita clasificar email y contraseña.
   - Alternativa descartada: reutilizar `fetchAPI`; impide cumplir RF-15 y RF-16.

10. **Botones con semántica correcta.**
    - Decisión: "Iniciar sesión" es un `button` de tipo `submit`; "Registrarse" y "Recuperar contraseña" son enlaces.
    - Motivo: el envío es una acción y la navegación es un enlace; mejora teclado, lector de pantalla y comportamiento del navegador.
    - Alternativa descartada: dos `button` con `router.push`; pierde la semántica de enlace y el soporte de abrir en otra pestaña.

11. **Sin íconos en los botones.**
    - Decisión: ambos botones muestran solo texto, según la respuesta del usuario.
    - Motivo: requisito explícito de la spec.
    - Alternativa descartada: reutilizar los íconos de la navbar; no fue aprobado.

12. **Enlace de recuperación a `/password-recovery`.**
    - Decisión: el enlace "Recuperar contraseña" navega a la pantalla de solicitud de la spec 007. Actualizado el 2026-10-27; el enlace ya no es provisional.
    - Motivo: RF-9 actualizado y respuesta del usuario.
    - Alternativa descartada: deshabilitar el enlace o mostrar un aviso; no fue lo aprobado.

13. **Metadata propia y sin `loading.tsx` ni `error.tsx`.**
    - Decisión: `app/login/page.tsx` exporta metadata; no se crean archivos de carga o error.
    - Motivo: la ruta es estática y no tiene datos asincrónicos; los archivos serían inertes. El principio 12 se aplicará cuando corresponda.
    - Alternativa descartada: crear archivos vacíos; agrega ruido sin cobertura real.

14. **Sin dependencias nuevas.**
    - Decisión: no se instala nada.
    - Motivo: principio 8 y RNF-9; los componentes, tests y herramientas actuales alcanzan.
    - Alternativa descartada: incorporar una librería de formularios o de sesión; requiere aprobación y no es necesaria.

## 5. Estrategia de tests

### 5.1 Tests unitarios

Runner existente: `node:test` con `node --experimental-strip-types --test`, sin Vitest ni Jest. Los tests importan los módulos `.ts` con rutas relativas y extensión explícita, como el resto del proyecto.

`tests/validation/login.test.ts`:

- Email vacío o solo espacios: error de obligatorio.
- Contraseña vacía: error de obligatorio.
- Email con formato inválido: error de correo.
- Email con espacios exteriores: se recorta y se considera válido.
- Contraseña con espacios: se conserva y se considera válida si no está vacía.
- Ambos campos válidos: `valid` verdadero y payload exacto.
- Cualquier error: `valid` falso y `payload` nulo.
- La lista de campos del formulario es exactamente email y password.
- No se exige complejidad de contraseña en login.

`tests/api/login.test.ts`:

- `POST` a la URL correcta, con método, headers JSON, credenciales omitidas, sin caché, redirección manual y señal de timeout.
- Cuerpo exacto `{ email, password }`, sin campos adicionales y con la contraseña intacta.
- Respuesta 200 con `{ data, message, errors: [] }`: éxito.
- Respuesta con `errors.email`: clasificación email no registrado.
- Respuesta con `errors.password`: clasificación contraseña incorrecta.
- Respuesta 500: fallo general con el mensaje del servicio.
- Error de red: fallo general de conexión.
- Timeout: fallo general de timeout.
- Cuerpo inválido o vacío: fallo general de respuesta inválida.
- El resultado serializado no contiene la contraseña.
- La clasificación por mensaje funciona cuando no hay errores por campo.

### 5.2 Verificación E2E

Se usa `pnpm dev` con un servicio simulado en `localhost:8000` y `LARAVEL_API_URL` apuntando a él. La interacción se verifica con Playwright o Chrome DevTools MCP, ya disponibles; no se agregan dependencias.

Escenarios:

- Acceso directo a `/login` sin cookie: responde 200 y muestra los dos campos.
- Toggle de contraseña: empieza oculta, el botón tiene estado no presionado; al activarlo el valor se ve y el estado pasa a presionado; al desactivarlo vuelve a ocultarse.
- Botones: "Iniciar sesión" azul a la izquierda y "Registrarse" blanco a la derecha; enlace de registro a `/register`; enlace "Recuperar contraseña" a `/password-recovery`.
- Validación local: envío vacío muestra ambos errores y no genera petición; email inválido muestra el error de correo; el foco y los mensajes son accesibles.
- Éxito: credenciales válidas llevan a `/home`; el servicio recibe una sola petición.
- Email no registrado: muestra el mensaje junto al campo de email y conserva los valores.
- Contraseña incorrecta: muestra el mensaje junto al campo de contraseña y conserva los valores.
- Error 500, red cortada y timeout: banner general, valores conservados y posibilidad de reintentar.
- Doble clic y Enter repetido: una sola petición.
- Responsive: 320, 375, 768, 1024 y 1440 px sin desbordamiento horizontal; botones apilados por debajo de 768 px y en fila desde 768 px, con el orden correcto.
- Accesibilidad: etiquetas asociadas, `aria-invalid`, `aria-describedby`, `aria-pressed`, foco visible, orden de tabulación lógico y contraste AA.
- RF-18: registro completo, verificación con código válido, espera de 1,5 segundos y llegada a `/login`; el pendiente de verificación se descarta y la cookie ya no está.

### 5.3 Verificación estática

- `pnpm exec tsc --noEmit` sin errores.
- `pnpm lint` sin errores; se aceptan los avisos preexistentes de `<img>`.
- `node --experimental-strip-types --test` con la suite completa en verde.
- `pnpm build` en verde, con `/login` generada como ruta estática y sin advertencias de CSS o Turbopack.
- `package.json` sin dependencias nuevas.

## 6. Cobertura de requisitos

| Requisito | Implementación principal | Verificación |
| --- | --- | --- |
| RF-1 | `app/login/page.tsx`, `login-form.tsx` | E2E de acceso y campos |
| RF-2 | `app/login/page.tsx` sin guardia de sesión | E2E sin cookie |
| RF-3 | `password-input.tsx` con visibilidad inicial oculta | E2E de toggle |
| RF-4 | `password-input.tsx` con toggle | E2E de toggle |
| RF-5 | `password-input.tsx` con nombre accesible y estado | Árbol de accesibilidad |
| RF-6 | `login-form.tsx` con botones y estilos | E2E visual |
| RF-7 | `login-form.tsx` con enlace a `/register` | E2E de clic |
| RF-8 | `login-form.tsx` con enlace de recuperación | E2E visual |
| RF-9 | `login-form.tsx` con enlace a `/password-recovery` | E2E de clic |
| RF-10 | `validation/login.ts` y `actions/login.ts` | Tests unitarios y E2E |
| RF-11 | `validation/login.ts` y `login-form.tsx` | Tests unitarios y E2E |
| RF-12 | `api/login.ts` y `actions/login.ts` | Tests unitarios y E2E |
| RF-13 | `login-form.tsx` con bloqueo y estado pendiente | E2E de doble envío |
| RF-14 | `actions/login.ts` con redirección a `/home` | E2E de éxito |
| RF-15 | `api/login.ts` con clasificación de email | Tests unitarios y E2E |
| RF-16 | `api/login.ts` con clasificación de contraseña | Tests unitarios y E2E |
| RF-17 | `api/login.ts` con timeout y errores de red | Tests unitarios y E2E |
| RF-18 | `verify-email-form.tsx` con redirección a `/login` | E2E de verificación |
| RF-19 | `validation/login.ts` con recorte del email | Tests unitarios |
| RNF-1 | `text-field.tsx`, `password-input.tsx` y `login-form.tsx` | Árbol de accesibilidad |
| RNF-2 | Formulario y botones nativos | Navegación por teclado |
| RNF-3 | Tokens de color existentes; borde en reposo `--color-borde-input` ajustado a `#767676` (4.54:1) en T12 | Medición de contraste |
| RNF-4 | Composición responsive del formulario | Medición en 320 a 1440 px |
| RNF-5 | Tarjeta y barra de navegación existentes | Comparación visual |
| RNF-6 | Textos en español | Revisión de UI |
| RNF-7 | Contraseña oculta por defecto | E2E y revisión de mensajes |
| RNF-8 | `metadata` de la ruta | Inspección del HTML |
| RNF-9 | Sin instalaciones | Revisión de `package.json` |

## 7. Riesgos y dependencias

- **Contrato de respuesta de login no confirmado.** Es el riesgo principal. Si el backend devuelve un único error genérico para email y contraseña, RF-15 y RF-16 no se pueden cumplir sin cambiar el contrato o la spec. La implementación se cerró el 2026-10-23 con validación contra el servicio simulado; la validación contra el servicio real queda como seguimiento y puede obligar a una spec de cambio si el contrato no distingue email y contraseña.
- **Sin sesión persistente.** El login redirige a `/home`, pero no autentica peticiones futuras. Es una limitación aprobada por la spec; si se necesita sesión, requiere una spec nueva.
- **Mensajes diferenciados y enumeración de cuentas.** La decisión del usuario facilita distinguir emails registrados. Queda documentado como riesgo de seguridad asumido.
- **Pegado y autocompletado.** El plan los habilita en login y mantiene el bloqueo en registro; si el usuario prefiere el comportamiento actual, se cambia una prop y se ajusta el test E2E.
- **Cambio en la spec 005.** RF-18 reemplaza la redirección a `/home` por `/login`. La spec 005, su plan y sus tareas deben actualizarse en la fase de cambio para no quedar contradictorios.
- **`PasswordInput` compartido.** Los valores por defecto deben conservar el bloqueo del registro; se verifica con los tests existentes y con una comprobación E2E de registro.
- **Redirección desde Server Action.** `redirect` debe ejecutarse fuera de bloques `try/catch` que puedan capturar su excepción interna. Se sigue el patrón de `registerAction`.
- **Ruta estática.** Si en el futuro el login necesita leer o escribir cookies, la página dejará de ser estática y habrá que revisar el renderizado y la caché.

## 8. Verificación final

- [x] `/login` responde 200 sin sesión y muestra email y contraseña.
- [x] La contraseña está oculta por defecto y el toggle funciona con teclado y ratón.
- [x] Los botones y el enlace de recuperación cumplen orden, color, textos y destinos.
- [x] La validación local bloquea envíos inválidos sin llamar al servicio.
- [x] El éxito redirige a `/home`.
- [x] Email no registrado y contraseña incorrecta muestran mensajes diferenciados.
- [x] Los fallos de servicio, red y timeout muestran un banner, conservan valores y permiten reintentar.
- [x] El doble envío genera una sola petición.
- [x] La verificación de email exitosa lleva a `/login`.
- [x] La pantalla es accesible, responsive y cumple contraste AA.
- [x] `tsc --noEmit`, lint, tests y build en verde.
- [x] Sin dependencias nuevas.
- [x] `MEMORY.md` actualizado.

> Validado con el servicio simulado el 2026-10-23. El contrato real de `POST /api/auth/login` y las dudas de §9 siguen abiertos para la validación con backend/producto.

## 9. Dudas abiertas que afectan al plan

- [BLOQUEANTE] ¿Qué estructura y códigos de respuesta devuelve `POST /api/auth/login` para el éxito, el email no registrado y la contraseña incorrecta? Sin esta definición, RF-15 y RF-16 quedan condicionados a la clasificación provisional por `errors` y mensaje.
- [NO BLOQUEANTE] ¿Se permite pegar la contraseña y usar el autocompletado del navegador en login? El plan propone permitirlo y mantener el bloqueo en registro.
- [NO BLOQUEANTE] ¿Qué debe ocurrir si una persona ya autenticada accede a `/login`? El plan no agrega guardia de sesión.
- [NO BLOQUEANTE] ¿La sesión debe persistir entre recargas y cierres? Queda fuera de alcance.
- [NO BLOQUEANTE] ¿Qué debe ocurrir si el email está registrado pero no verificado? El plan delega la respuesta al servicio y muestra el mensaje que devuelva.
- [NO BLOQUEANTE] ¿Los textos exactos de los mensajes los define la interfaz o el servicio? El plan usa los textos de la spec y deja el mensaje del servicio como fallback para errores generales.
- [NO BLOQUEANTE] ¿El cambio de redirección reemplaza por completo el comportamiento anterior de la verificación? El plan asume que sí y anota la actualización de la spec 005.
