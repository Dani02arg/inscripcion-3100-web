# Plan 008 — Sesión autenticada y dashboard base

Estado: aprobado (2026-10-27)

Spec: `specs/008-session-dashboard/spec.md` (aprobada el 2026-10-27).

## 1. Alcance, principios y supuestos

Este plan implementa la spec 008: sesión autenticada a partir del JWT de login, cierre de sesión y un dashboard base privado común a los tres roles, con saludo con nombre y subtítulo por rol. No incluye módulos funcionales ni acciones diferenciadas por rol.

Alcance:

- Al autenticar, validar token y usuario mínimo, crear una sesión y redirigir a `/dashboard`.
- Conservar la sesión entre recargas y cierres del navegador hasta el `exp` del token.
- Proteger `/dashboard` y volver a `/login` sin sesión o con sesión vencida.
- Redirigir a `/dashboard` al usuario con sesión vigente que acceda a `/login`.
- Obtener el usuario autenticado con `GET /api/auth/me` para mostrar “Hola, {nombre}” 👋, el subtítulo del rol, el correo y la etiqueta del rol.
- Cerrar sesión: borrar la cookie local siempre y notificar a `POST /api/auth/logout` como mejor esfuerzo.
- Adjuntar el JWT como Bearer y clasificar `401` y `403`.

Fuera de alcance (según la spec): backend, revocación del token, refresh tokens, módulos o acciones por rol, perfil, recuperación, registro, verificación y retorno a una URL privada solicitada.

Principios aplicados de `docs/constitution.md`: SDD (la spec 008 manda), TypeScript estricto (sin `any` ni castings inseguros), separación de capas, pureza visual de `/app/ui`, Server Components primero, API centralizada, consistencia lingüística, restricción de dependencias, `loading.tsx`/`error.tsx` por ruta y verificación con `tsc`, lint, tests y build.

Supuestos y límites:

- El backend mantiene el contrato documentado en la spec: login devuelve `data.token` y `data.user`; `GET /api/auth/me` devuelve el usuario autenticado; `POST /api/auth/logout` responde el cierre pero no revoca (stateless).
- La aplicación web **no verifica la firma** del JWT: no dispone del secreto de Laravel y no debe tenerlo. El token se decodifica y se valida estructuralmente solo para decisiones optimistas de interfaz; la autoridad de seguridad es el backend (RNF-3).
- La sesión es fija: no se renueva ni se extiende (RF-8).
- El cierre de sesión es local y no depende del endpoint; la notificación a `POST /api/auth/logout` es de mejor esfuerzo (RF-13).
- El dashboard llama a `/me` en cada acceso; esta es la solicitud privada real que ejercita Bearer, `401` y `403` (RF-15 a RF-17, RF-19, RF-20).

## 2. Archivos a crear y modificar

### 2.1 Crear — tipos y sesión

- `app/lib/auth/types.ts`
  - `UserRole = "ADMINISTRADOR" | "ADMINISTRATIVO" | "TUTOR"` (valores de datos del backend; excepción lingüística documentada).
  - `SessionClaims` con `sub`, `email`, `role` y `exp` (segundos).
  - `LoginSessionData` con `token` y `user` (usuario mínimo con `id` y `email`).
  - `CurrentUser` con `id` (texto), `name`, `lastname`, `email` y `role`.
  - `ROLE_LABELS` en español y constantes de mensajes y subtítulos de la spec.
  - Cubre RF-9, RF-10, RF-11, RF-19, RNF-9.

- `app/lib/auth/session.ts`
  - `SESSION_COOKIE_NAME = "token"`, para reutilizar el cliente de API existente.
  - `parseJwtPayload(token): unknown | null`: separa las partes del JWT y decodifica el payload en base64url.
  - `decodeSessionToken(token): SessionClaims | null`: valida `sub`/`email` de texto no vacío, `role` conocido y `exp` numérico finito mayor que cero.
  - `isSessionExpired(claims, now): boolean` e `isKnownRole`.
  - `getSessionClaims(): Promise<SessionClaims | null>`: lee la cookie y decodifica; no redirige.
  - `createSession(token, claims)` y `deleteSession()`: escriben/borran la cookie `httpOnly`, `secure` en producción, `sameSite: "lax"`, `path: "/"` y `expires` en `exp`.
  - `verifySession()` memoizado con `cache` de React: si no hay sesión válida, redirige a `/login`; si la hay, devuelve los claims.
  - Usa `next/headers` y solo se importa desde Server Components y Server Actions.
  - Cubre RF-4 a RF-8, RF-14, RF-16, RNF-1, RNF-2, RNF-4.

### 2.2 Crear — ruta dashboard

- `app/dashboard/page.tsx`
  - Server Component dinámico que llama a `verifySession()` y luego a `getCurrentUser()`.
  - Si el rol de la sesión no es conocido (no debería ocurrir tras validar el token), muestra “No tenés permisos para acceder a esta sección.”
  - Muestra “Panel principal”, el saludo “Hola, {nombre}” con 👋, el subtítulo del rol, el correo y la etiqueta del rol, y el botón de cierre de sesión.
  - Exporta `metadata` propia.
  - Cubre RF-5, RF-9, RF-10, RF-11, RF-19, RF-20, RNF-7.

- `app/dashboard/loading.tsx`
  - Estado de carga accesible del segmento.
  - Cubre RNF-8.

- `app/dashboard/error.tsx`
  - Client Component con límite de error, mensaje general y “Reintentar”.
  - Cubre RNF-8, RF-20.

### 2.3 Crear — UI

- `app/ui/dashboard/logout-button.tsx`
  - Client Component mínimo que invoca la Server Action de logout mediante un formulario.
  - Texto “Cerrar sesión”, `aria-busy` y bloqueo de doble envío; sin `fetch`.
  - Cubre RF-12, RF-13, RNF-5.

- `app/ui/dashboard/access-denied.tsx` (si hace falta separarlo)
  - Presentación pura del estado “No tenés permisos para acceder a esta sección.”
  - Cubre RF-11, RF-17.

### 2.4 Crear — API de sesión

- `app/lib/api/me.ts`
  - `ME_ENDPOINT_PATH = "/api/auth/me"`, `ME_REQUEST_TIMEOUT_MS` (10 s).
  - `parseCurrentUserResponse(status, body): CurrentUserResult` que distingue éxito, `401`, `403`, error general (red, timeout, `5xx`, cuerpo inválido) y `2xx` con errores.
  - `getCurrentUser(options?)`: `GET` con Bearer desde la cookie `token`, `credentials: "omit"`, `cache: "no-store"`, `redirect: "manual"` y `AbortSignal.timeout`.
  - Reutiliza `getApiBaseUrl` y `isRecord`/`getApiMessage`.
  - Cubre RF-15, RF-16, RF-17, RF-19, RF-20.

- `app/lib/api/logout.ts`
  - `LOGOUT_ENDPOINT_PATH = "/api/auth/logout"`, timeout corto.
  - `notifyLogout(token, options?)`: `POST` con Bearer, mejor esfuerzo; devuelve éxito/fallo sin lanzar.
  - Cubre RF-13.

### 2.5 Crear — acciones

- `app/lib/actions/logout.ts`
  - Server Action `logoutAction`: lee el token, borra la cookie local, notifica al endpoint de logout como mejor esfuerzo y redirige a `/login`.
  - Nunca falla el cierre por culpa del endpoint.
  - Cubre RF-13, RF-14.

### 2.6 Crear — proxy

- `proxy.ts` (raíz del proyecto)
  - Optimiza redirecciones: `/dashboard` sin sesión válida → `/login`; `/login` con sesión válida → `/dashboard`.
  - Trata una sesión que no parsea como ausente para evitar bucles.
  - No sustituye la protección real (DAL); solo hace comprobaciones optimistas.
  - Cubre RF-4, RF-5.

### 2.7 Modificar

- `app/lib/api/login.ts`
  - Sustituye `data: unknown` por un resultado tipado con `LoginSessionData`.
  - Agrega `parseLoginSessionData(body.data): LoginSessionData | null`: valida token utilizable y usuario mínimo; una respuesta `2xx` inválida pasa a fallo general (RF-2).
  - Conserva la clasificación actual de email no registrado, contraseña incorrecta y fallo.
  - Cubre RF-1, RF-2.

- `app/lib/actions/login.ts`
  - En éxito valida `LoginSessionData`; si es válido, crea la sesión y redirige a `/dashboard`; si no, devuelve el error de respuesta inválida sin crear sesión.
  - Cubre RF-1, RF-2, RF-3.

- `app/lib/api-client.ts`
  - Elimina el casteo inseguro y centraliza el Bearer desde la cookie `token`.
  - Acepta un `token` inyectable para tests.
  - Clasifica `401` y `403` con mensajes de la spec; conserva el resto.
  - Cubre RF-15, RF-16, RF-17, RNF-3.

- `specs/006-login/spec.md`
  - Documenta el contrato real, RF-14 (redirección a `/dashboard`), el alcance de la sesión y resuelve las dudas abiertas que ya tienen respuesta.
  - No cambia la lógica de login más allá de lo ya incluido en este plan.

- `MEMORY.md`
  - Registra la aprobación de la spec, el estado del plan y, al implementar, las verificaciones.

### 2.8 No se modifica

- `app/ui/navbar.tsx` y `mobile-menu-toggle.tsx`: la navbar autenticada queda fuera de esta spec.
- `app/lib/validation/login.ts`: la validación de formato no cambia.
- `app/lib/api/config.ts`, `app/lib/api/auth.ts`: se reutilizan `getApiBaseUrl`, `getApiMessage`, `isRecord` y `toStringArray`.
- Backend y contrato.

## 3. Funciones de lógica pura

- `parseJwtPayload(token: string): unknown | null`
  - Rechaza tokens sin tres partes o con payload no decodificable.

- `decodeSessionToken(token: string): SessionClaims | null`
  - Devuelve `null` ante payload no objeto, `sub`/`email` no textuales o vacíos, `role` desconocido, `exp` no numérico o no finito, o `exp <= 0`.
  - Cubre RF-6, RF-11.

- `isSessionExpired(claims: SessionClaims, now: number): boolean`
  - Vencido desde `now >= claims.exp * 1000`.
  - Cubre RF-6, RF-8.

- `isKnownRole(value: unknown): value is UserRole`
  - Verifica pertenencia a `ADMINISTRADOR`, `ADMINISTRATIVO`, `TUTOR`.
  - Cubre RF-10, RF-11.

- `parseLoginSessionData(value: unknown): LoginSessionData | null`
  - Requiere `token` de texto decodificable y utilizable, y `user` objeto con `id` (string/number no vacío) y `email` (string no vacío).
  - Tolera campos adicionales.
  - Cubre RF-1, RF-2.

- `parseCurrentUserResponse(status: number, body: unknown): CurrentUserResult`
  - `2xx` con `data` que incluye `id`, `name`, `lastname`, `email` y `role`: éxito.
  - `401`: `unauthorized`; `403`: `forbidden`; red, timeout, `5xx`, cuerpo inválido o `2xx` con errores: `failed`.
  - Cubre RF-16, RF-17, RF-19, RF-20.

## 4. Decisiones técnicas justificadas

1. **Cookie `httpOnly` llamada `token`.**
   - Decisión: guardar el JWT en una cookie `httpOnly`, `secure` en producción, `sameSite: "lax"`, `path: "/"` y `expires` alineado con `exp`.
   - Motivo: impide el acceso desde JavaScript (RNF-1), sobrevive al cierre del navegador (RF-7) y reutiliza el nombre que ya lee `api-client.ts`.
   - Alternativa descartada: `localStorage`/`sessionStorage`; quedan expuestos a scripts y no cumplen RNF-1.

2. **JWT sin verificación de firma en el frontend.**
   - Decisión: decodificar y validar estructura y `exp` solo para decisiones optimistas de interfaz.
   - Motivo: el frontend no debe conocer el secreto de Laravel. La protección real la ejerce el backend con el token completo.
   - Alternativa descartada: verificar firma en Next; obligaría a compartir el secreto.

3. **`proxy.ts` como comprobación optimista, no como única defensa.**
   - Decisión: redirigir en `/dashboard` y `/login` según la presencia de sesión válida; el DAL (`verifySession`) sigue protegiendo los datos.
   - Motivo: es el patrón de Next.js 16 y evita renderizar páginas privadas sin sesión.
   - Alternativa descartada: solo `verifySession` en la página; funciona, pero el proxy adelanta la redirección y simplifica `/login`.

4. **`verifySession` memoizado con `cache` de React.**
   - Decisión: deduplicar la lectura de sesión dentro del render del servidor.
   - Motivo: evita leer y decodificar la cookie varias veces por render.
   - Alternativa descartada: leer la cookie en cada componente; repetido e innecesario.

5. **El nombre y el rol visibles provienen de `GET /api/auth/me`.**
   - Decisión: el token aporta `email`/`role` para el guard y la redirección; la pantalla muestra `name`, `email` y `role` devueltos por `/me`.
   - Motivo: el token no contiene el nombre; `/me` es la fuente autoritativa del usuario actual y da al dashboard una solicitud privada real que ejercita `401`/`403`.
   - Alternativa descartada: persistir el objeto `user` del login; queda desactualizado y no cubre la identidad en recargas.

6. **Logout como Server Action con borrado local y notificación best-effort.**
   - Decisión: `logoutAction` borra la cookie, llama a `POST /api/auth/logout` y redirige a `/login`; el borrado y la redirección no dependen de la respuesta del endpoint.
   - Motivo: el backend es stateless y no revoca; el borrado local es la acción que cierra el acceso. Notificar al endpoint es consistente con el contrato sin bloquear el cierre.
   - Alternativa descartada: esperar el resultado del endpoint para cerrar; si tarda o falla, deja al usuario “atrapado”.

7. **`401`/`403` tipados en `api-client.ts` y en `me.ts`.**
   - Decisión: eliminar el casteo inseguro, adjuntar Bearer de forma centralizada y clasificar `401` (sesión inválida) y `403` (acceso denegado).
   - Motivo: RF-15 a RF-17 y el principio de TypeScript estricto.
   - Alternativa descartada: manejar estados en cada llamador; duplica lógica y rompe la centralización de `/app/lib/api`.

8. **Valores de rol en español como datos del backend (excepción lingüística).**
   - Decisión: el tipo se llama `UserRole` (inglés) pero sus literales son `ADMINISTRADOR`, `ADMINISTRATIVO`, `TUTOR`, tal como los devuelve Laravel; los textos visibles usan `ROLE_LABELS` en español.
   - Motivo: el principio 7 exige identificadores en inglés, pero estos valores son contrato del backend, como la excepción ya aceptada para `dni`/`cuil`.
   - Alternativa descartada: renombrar roles en el frontend; crea un mapeo innecesario y puede confundir la integración.

9. **El saludo usa el emoji 👋.**
   - Decisión: “Hola, {nombre}” con 👋 en texto, sin asset nuevo.
   - Motivo: decisión del usuario; es más simple que agregar un ícono y no requiere archivo (principio 14: no se agregan assets).

10. **Sin dependencias nuevas.**
    - Decisión: usar APIs nativas de Node (`atob`/`Buffer` para base64url), `next/headers` y `cache` de React.
    - Motivo: principio de restricción de dependencias.
    - Alternativa descartada: `jose` o similar; requiere aprobación y no es necesaria para decodificar.

## 5. Estrategia de tests

Runner existente: `node:test` con `node --experimental-strip-types --test`, imports relativos con extensión `.ts`. No se agregan frameworks.

### 5.1 Tests unitarios

- `tests/auth/session.test.ts`
  - `parseJwtPayload` con token válido, sin tres partes y payload no base64url.
  - `decodeSessionToken` con token válido, `sub`/`email` vacíos o ausentes, `role` desconocido, `exp` ausente/no finito/no positivo.
  - `isSessionExpired` en el límite (`now` igual a `exp * 1000`).
  - `isKnownRole` para los tres roles y un valor desconocido.
  - Cubre RF-6, RF-8, RF-10, RF-11.

- `tests/api/login.test.ts` (ampliado)
  - `2xx` con `data.token` utilizable y `data.user` mínimo → éxito tipado.
  - `2xx` sin `data`, sin token, token no utilizable, token ya vencido o usuario incompleto → fallo de respuesta inválida, sin sesión.
  - Sin regresión en email no registrado, contraseña incorrecta y fallo general.
  - Cubre RF-1, RF-2.

- `tests/api/me.test.ts`
  - `parseCurrentUserResponse` para éxito, `401`, `403`, `5xx`, red, timeout, cuerpo inválido y `2xx` con errores.
  - `getCurrentUser` con Bearer, `no-store`, `redirect: "manual"` y timeout.
  - Cubre RF-16, RF-17, RF-19, RF-20.

- `tests/api/logout.test.ts`
  - `notifyLogout` con Bearer; éxito y fallo sin lanzar excepción.
  - Cubre RF-13.

- `tests/api/client.test.ts`
  - Bearer adjuntado desde token inyectado.
  - `401` → error de sesión expirada; `403` → acceso denegado; `422` y `500` → mensajes correspondientes.
  - Cubre RF-15, RF-16, RF-17.

### 5.2 Verificación E2E

Se usa `pnpm dev` con el backend real disponible y, para casos controlados, un servicio simulado. Interacción con Playwright o Chrome DevTools MCP, ya disponibles.

- Login real con cuenta `TUTOR` → cookie `httpOnly`, redirección a `/dashboard`, saludo “Hola, {nombre}” con 👋, subtítulo de tutor, correo y rol visibles.
- Login con los tres roles (real si hay cuentas; en su defecto con token simulado) → subtítulo correcto por rol.
- Sin sesión, `/dashboard` → `/login`.
- Con sesión, `/login` → `/dashboard`.
- Sesión forzada vencida (token con `exp` pasado) → `/dashboard` redirige y descarta.
- Recarga y reapertura del navegador antes del vencimiento → se conserva la sesión.
- “Cerrar sesión” → cookie eliminada, petición de logout best-effort y vuelta a `/login`; volver a `/dashboard` exige login.
- Doble clic en “Cerrar sesión” → una sola acción.
- Rol desconocido en el token → no crea sesión / acceso denegado.
- `GET /api/auth/me` con `401` → descarta sesión y vuelve a `/login`; con `403` → acceso denegado conservando la sesión; con `500`/red → error general y reintento sin descartar la sesión.
- Privacidad: el token no aparece en HTML, RSC, consola, URLs, `localStorage` ni `sessionStorage`; `document.cookie` no lo expone.
- Accesibilidad: teclado, nombre accesible del botón, foco visible, contraste AA.
- Responsive: 320 a 1920 px sin desbordamiento horizontal.

### 5.3 Verificación estática

- `pnpm exec tsc --noEmit` sin errores.
- `pnpm lint` sin errores; se aceptan los avisos preexistentes de `<img>`.
- `node --experimental-strip-types --test` con la suite completa en verde.
- `pnpm build` en verde, con `/dashboard` dinámica y sin advertencias de CSS o Turbopack.
- `package.json` sin dependencias nuevas.

## 6. Cobertura de requisitos

| Requisito | Implementación principal | Verificación |
| --- | --- | --- |
| RF-1 | `login.ts` y `actions/login.ts` crean sesión | Tests unitarios y E2E |
| RF-2 | `parseLoginSessionData` | Tests unitarios |
| RF-3 | Redirección a `/dashboard` | E2E |
| RF-4 | `proxy.ts` y `verifySession` | E2E |
| RF-5 | `proxy.ts` y `verifySession` | E2E |
| RF-6 | `decodeSessionToken`/`isSessionExpired` | Tests unitarios y E2E |
| RF-7 | Cookie con `expires` | E2E de recarga/reapertura |
| RF-8 | Sin renovación | Revisión y tests |
| RF-9 | `app/dashboard/page.tsx` + `/me` | E2E |
| RF-10 | `isKnownRole` y ruta | Tests unitarios y E2E |
| RF-11 | `decodeSessionToken`/`isKnownRole` | Tests unitarios y E2E |
| RF-12 | `logout-button.tsx` | E2E |
| RF-13 | `actions/logout.ts` + `api/logout.ts` | E2E |
| RF-14 | `verifySession` tras logout | E2E |
| RF-15 | `api-client.ts` y `me.ts` Bearer | Tests unitarios |
| RF-16 | `me.ts`/`api-client.ts` `401` | Tests unitarios y E2E |
| RF-17 | `me.ts`/`api-client.ts` `403` | Tests unitarios y E2E |
| RF-18 | Sin render del token | E2E de privacidad |
| RF-19 | `getCurrentUser` y página | Tests unitarios y E2E |
| RF-20 | Clasificación de fallo de `/me` | Tests unitarios y E2E |
| RNF-1 | Cookie `httpOnly` y sin logs | E2E de privacidad |
| RNF-2 | Cookie `secure`/`httpOnly` | Revisión y tests |
| RNF-3 | Backend autoritativo | Revisión |
| RNF-4 | Ruta dinámica y `no-store` | Revisión y build |
| RNF-5 | Botón accesible | E2E de accesibilidad |
| RNF-6 | Composición responsive | 320 a 1920 px |
| RNF-7 | `metadata` propia | Inspección del HTML |
| RNF-8 | `loading.tsx`/`error.tsx` | Revisión y build |
| RNF-9 | `ROLE_LABELS` y subtítulos en español | Tests unitarios |
| RNF-10 | Sin instalaciones | Revisión de `package.json` |

## 7. Riesgos y dependencias

- **JWT sin firma verificada.** Un atacante podría fabricar un token para engañar la interfaz optimista, pero no accedería a datos reales: el backend valida el token completo. RNF-3 lo deja explícito.
- **Disponibilidad de `/me`.** El saludo con nombre depende de `GET /api/auth/me`. Si falla por red o `5xx`, se muestra el error general y se permite reintentar; no se descarta la sesión.
- **`id` con tipos distintos.** El login trae UUID (string) y `/me` puede traer número; `CurrentUser.id` se normaliza a texto y la sesión usa `sub`, por lo que la inconsistencia no afecta la identidad.
- **Logout sin revocación.** El token sigue válido hasta `exp`; es una limitación aceptada del backend stateless.
- **Cookie y prerenderizado.** Leer `cookies()` en el dashboard convierte la ruta en dinámica; es lo esperado para una ruta privada.
- **Redirección tras login en tests existentes.** La E2E de la spec 006 esperaba `/home`; al cambiar a `/dashboard`, sus evidencias deben actualizarse en la spec 006 sin romper la lógica.
- **Bucle de redirección.** Una sesión que no parsea se trata como ausente en `/login` y en el proxy, de modo que `/login` no redirige de vuelta a `/dashboard`.
- **Doble clic en logout.** Se bloquea con `aria-busy` mientras está en curso para evitar envíos repetidos.

## 8. Verificación final

- [x] Un login exitoso crea sesión y lleva a `/dashboard`.
- [x] Los tres roles acceden al dashboard base y reciben el saludo con nombre y el subtítulo de su rol.
- [x] Una respuesta exitosa inválida no crea sesión.
- [x] El dashboard obtiene el usuario autenticado mediante `GET /api/auth/me`.
- [x] La sesión sobrevive a recargas y reaperturas hasta su vencimiento.
- [x] Sin sesión o con sesión vencida no se accede al dashboard.
- [x] El usuario autenticado que accede a `/login` vuelve al dashboard.
- [x] El cierre de sesión elimina el acceso local, notifica al endpoint y vuelve a `/login`.
- [x] El Bearer y los casos `401`/`403` están cubiertos.
- [x] El token no queda expuesto en la interfaz ni en el almacenamiento del cliente.
- [x] `tsc --noEmit`, lint, tests y build en verde.
- [x] Sin dependencias nuevas.
- [x] `MEMORY.md` actualizado.

> Verificación 2026-10-27: `tsc --noEmit` limpio, lint 0 errores (4 avisos preexistentes de `<img>`), suite **214/214**, `pnpm build` en verde (`/dashboard` y `/login` dinámicas, `ƒ Proxy (Middleware)`). E2E con mock en `:8020` y `next dev :3116`: login de los tres roles, saludo con nombre y subtítulo, persistencia, logout, `/me` con `401`/`403`, privacidad, accesibilidad y responsive 320–1920 px.

## 9. Dudas abiertas que afectan al plan

- [NO BLOQUEANTE] ¿El backend responde `401` o `403` en `/me` cuando el token expiró? El plan cubre ambos comportamientos y trata `401` como sesión inválida.
- [NO BLOQUEANTE] ¿El correo del dashboard debe mostrarse completo o enmascarado? El plan lo muestra como identidad mínima; si se prefiere enmascarado, se cambia la página.

## 10. Orden de implementación sugerido para `tasks.md`

1. Tipos y parseo puro de JWT/sesión, con tests.
2. Parseo tipado de la respuesta de login, con tests.
3. Cookie de sesión y `verifySession`.
4. Cliente de `GET /api/auth/me` y `POST /api/auth/logout`, con tests.
5. Server Action de login (sesión + redirección) y de logout.
6. `proxy.ts`.
7. Ruta `/dashboard` con `loading.tsx`, `error.tsx` y botón de cierre.
8. Cliente de API con Bearer, `401` y `403`, con tests.
9. Actualización de la spec 006.
10. E2E, accesibilidad, responsive, privacidad y verificación final.
11. Cierre de `MEMORY.md`.

## 11. Cambio 2026-10-27 — Dashboard del tutor

Alcance: barra privada en `/dashboard` (sin “Iniciar sesión” ni “Registrarse”, con campana visual y logout temporal), saludo del tutor y estado vacío de alumnos. Las tarjetas de resumen y el contador de notificaciones quedan pendientes de endpoint. No se modifica la navbar pública, `/login` ni `/register`.

### Archivos

- Modificar `app/dashboard/page.tsx`: usar `DashboardNavbar` en lugar de la navbar pública.
- Crear `app/ui/dashboard/dashboard-navbar.tsx`: logo a `/dashboard`, campana y logout en el slot que ocupaba “Registrarse”.
- Crear `app/ui/dashboard/notification-bell.tsx`: botón visual con nombre accesible “Notificaciones”, sin badge.
- Crear `app/ui/dashboard/empty-students.tsx`: ilustración SVG inline, título, texto y botón “Registrar un alumno” sin navegación.
- Modificar `app/ui/dashboard/logout-button.tsx`: estilo de barra privada, `aria-label` y bloqueo de doble envío.
- Modificar `app/ui/dashboard/dashboard-view.tsx`: saludo del tutor y estado vacío; se quita el logout del cuerpo porque vive en la barra.
- Crear `app/lib/dashboard/role-dashboard.ts` y `tests/dashboard/role-dashboard.test.ts`.
- No se modifica `app/ui/navbar.tsx`, `app/login/*` ni `app/register/*`.

### Decisiones

- El estado vacío se muestra siempre para `TUTOR` mientras no exista endpoint de alumnos; quedará condicional en una spec futura.
- El botón “Registrar un alumno” y la campana no navegan en esta versión.
- La ilustración es SVG inline (sin asset nuevo).
- `ADMINISTRADOR` y `ADMINISTRATIVO` conservan el dashboard base.
- El logout está temporalmente en la barra privada; su lugar definitivo será el menú lateral inferior izquierdo.

### Verificación

- [x] Barra privada sin “Iniciar sesión” ni “Registrarse”.
- [x] Campana accesible sin badge.
- [x] Logout temporal en la barra privada.
- [x] Saludo “¡Hola, {nombre}!” con ícono para `TUTOR`.
- [x] Estado vacío con ilustración, título, texto y botón sin navegación.
- [x] `ADMINISTRADOR` y `ADMINISTRATIVO` sin estado vacío.
- [x] `tsc`, lint, suite (216/216) y build en verde.

### Pendiente

- Endpoint de resumen para tarjetas y condición real del estado vacío.
- Endpoint de notificaciones para el contador.
- Menú lateral y reubicación definitiva del logout.
