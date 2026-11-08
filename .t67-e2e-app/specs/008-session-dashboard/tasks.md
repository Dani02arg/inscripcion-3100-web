# Tareas 008 — Sesión autenticada y dashboard base

Estado: aprobado (2026-10-27)

Spec: `specs/008-session-dashboard/spec.md` (aprobada el 2026-10-27).
Plan: `specs/008-session-dashboard/plan.md` (aprobado el 2026-10-27).

## Reglas de ejecución

- Una tarea por vez: test → código → verde → marcar → detenerse.
- No se implementa nada fuera de la spec 008 ni del plan.
- Sin dependencias nuevas.
- Verificación por tarea: `pnpm exec tsc --noEmit` y `pnpm lint`.
- Al cerrar cada tarea se actualiza `MEMORY.md`.
- Tests con `node --experimental-strip-types --test` e imports relativos con `.ts`.
- E2E con `pnpm dev`, backend real o mock, y Playwright/Chrome DevTools MCP.

## Fase A — Lógica pura

- [x] **T1. Tipos de autenticación y roles.** RF-9, RF-10, RF-11, RF-19, RNF-9
  - Hecho cuando: `app/lib/auth/types.ts` expone `UserRole`, `SessionClaims`, `LoginSessionData`, `CurrentUser`, etiquetas, subtítulos y mensajes, y `tsc --noEmit` pasa.
  - Verificado el 2026-10-27: `types.ts` con `ADMINISTRADOR`/`ADMINISTRATIVO`/`TUTOR`, `ROLE_LABELS`, `ROLE_SUBTITLES`, `WAVE_EMOJI` y mensajes; `tsc` limpio.

- [x] **T2. Decodificación del JWT.** RF-6, RF-8, RF-10, RF-11
  - Hecho cuando: `parseJwtPayload` y `decodeSessionToken` validan `sub`, `email`, `role` conocido y `exp` positivo, con tests en verde.
  - Verificado el 2026-10-27: `tests/auth/session.test.ts` 10/10 (incluye T3).

- [x] **T3. Vencimiento y rol conocido.** RF-6, RF-8, RF-11
  - Hecho cuando: `isSessionExpired` vence en `now >= exp*1000` e `isKnownRole` acepta solo los tres roles, con tests en verde.
  - Verificado el 2026-10-27: límite exacto y roles cubiertos en `session.test.ts`.

- [x] **T4. Parseo tipado del login.** RF-1, RF-2
  - Hecho cuando: `parseLoginSessionData` acepta token utilizable + usuario mínimo y la suite de `login.test.ts` está en verde.
  - Verificado el 2026-10-27: `parseLoginSessionData` con token no vencido y usuario `id`+`email`; éxito tipado.

- [x] **T5. Casos inválidos del login.** RF-1, RF-2
  - Hecho cuando: `2xx` sin `data`, token no utilizable/vencido o usuario incompleto devuelven fallo de respuesta inválida, con tests.
  - Verificado el 2026-10-27: 5 casos nuevos en `tests/api/login.test.ts`.

## Fase B — Sesión

- [x] **T6. Cookie de sesión.** RF-7, RF-14, RF-16, RNF-1, RNF-2
  - Hecho cuando: `createSession`, `getSessionToken` y `deleteSession` usan `httpOnly`, `secure` en producción, `sameSite=lax`, `path=/` y `expires=exp`.
  - Verificado el 2026-10-27: `app/lib/auth/session-cookie.ts`; `tsc`/lint en verde y smoke runtime.

- [x] **T7. verifySession.** RF-4, RF-5, RF-6, RF-14
  - Hecho cuando: `verifySession` devuelve claims vigentes o redirige a `/login`, memoizado con `cache`.
  - Verificado el 2026-10-27: `verifySession` con `cache`; `tsc`/lint y smoke en verde.

## Fase C — API

- [x] **T8. Parseo de `/me`.** RF-19, RF-20
  - Hecho cuando: `parseCurrentUserResponse` clasifica éxito, `401`, `403`, `5xx`, red y cuerpo inválido, con tests.
  - Verificado el 2026-10-27: `tests/api/me.test.ts` 10/10.

- [x] **T9. Cliente `GET /api/auth/me`.** RF-15, RF-16, RF-17, RF-19, RF-20
  - Hecho cuando: `getCurrentUser` envía Bearer, `no-store`, `redirect:manual` y timeout de 10 s, con tests.
  - Verificado el 2026-10-27: `tests/api/me.test.ts` 10/10; `id` numérico normalizado a texto.

- [x] **T10. Cliente `POST /api/auth/logout`.** RF-13
  - Hecho cuando: `notifyLogout` envía Bearer y nunca lanza ante éxito o fallo.
  - Verificado el 2026-10-27: `tests/api/logout.test.ts` 3/3.

- [x] **T11. Cliente autenticado central.** RF-15, RF-16, RF-17, RNF-3
  - Hecho cuando: `fetchAPI` adjunta Bearer y clasifica `401`, `403`, `422`, `5xx`, red y cuerpo inválido, con tests.
  - Verificado el 2026-10-27: `tests/api/client.test.ts` 7/7; `ApiRequestError` tipado.

## Fase D — Acciones y rutas

- [x] **T12. Login con sesión y redirección.** RF-1, RF-2, RF-3
  - Hecho cuando: un login válido crea sesión y redirige a `/dashboard`; una respuesta inválida no crea sesión.
  - Verificado el 2026-10-27: `app/lib/actions/login.ts`; `tsc`/lint y build en verde.

- [x] **T13. Acción de datos del dashboard.** RF-16, RF-19, RF-20
  - Hecho cuando: `getDashboardDataAction` devuelve usuario, `forbidden`, `session_expired` o `error`, y borra la cookie en `401`.
  - Verificado el 2026-10-27: `app/lib/actions/dashboard.ts`; `tsc`/lint en verde.

- [x] **T14. Logout con notificación best-effort.** RF-13, RF-14
  - Hecho cuando: `logoutAction` borra la cookie siempre, notifica `/logout` y redirige a `/login` sin depender del endpoint.
  - Verificado el 2026-10-27: `app/lib/actions/logout.ts`; `tsc`/lint en verde.

- [x] **T15. Proxy de redirecciones.** RF-4, RF-5
  - Hecho cuando: `/dashboard` sin sesión va a `/login` y `/login` con sesión va a `/dashboard`, sin bucle ante sesión no parseable.
  - Verificado el 2026-10-27: smoke con `next dev` y curl (`307` en ambos sentidos; cookie inválida → `200`); build muestra `ƒ Proxy (Middleware)`.

- [x] **T16. Página `/dashboard`.** RF-5, RF-9, RF-10, RF-11, RF-19, RNF-7
  - Hecho cuando: la página usa `verifySession`, exporta metadata propia y `pnpm build` la marca como dinámica.
  - Verificado el 2026-10-27: `app/dashboard/page.tsx`; `/dashboard` dinámica en build.

- [x] **T17. Vista del dashboard.** RF-9, RF-10, RNF-9
  - Hecho cuando: muestra “Panel principal”, “Hola, {nombre}” 👋, subtítulo por rol, correo y etiqueta del rol.
  - Verificado el 2026-10-27: `app/ui/dashboard/dashboard-view.tsx`; `tsc`/lint en verde. Verificación visual en T22.

- [x] **T18. Carga y error del dashboard.** RNF-8, RF-20
  - Hecho cuando: existen `loading.tsx` y `error.tsx` accesibles, sin filtrar el token ni detalles técnicos.
  - Verificado el 2026-10-27: `app/dashboard/loading.tsx` y `error.tsx`; build en verde.

- [x] **T19. Botón de logout.** RF-12, RF-13, RNF-5
  - Hecho cuando: invoca `logoutAction`, muestra “Cerrar sesión”, `aria-busy` y bloquea doble envío sin `fetch`.
  - Verificado el 2026-10-27: `app/ui/dashboard/logout-button.tsx` con `useFormStatus` y `disabled`.

- [x] **T20. Aviso de sesión expirada en login.** RF-16
  - Hecho cuando: `/login?reason=session-expired` muestra el mensaje de la spec.
  - Verificado el 2026-10-27: `app/login/page.tsx` lee `searchParams` y muestra `SESSION_EXPIRED_MESSAGE`. Verificación visual en T24.

## Fase E — Documentación

- [x] **T21. Actualizar spec 006.** Criterio de finalización
  - Hecho cuando: documenta el contrato real, RF-14 a `/dashboard` y resuelve las dudas ya respondidas.
  - Verificado el 2026-10-27: `specs/006-login/spec.md` actualizada (contrato, RF-14, fuero de alcance y dudas).

## Fase F — E2E y calidad

- [x] **T22. E2E login → dashboard y saludo.** RF-1, RF-3, RF-7, RF-9, RF-10, RF-19
  - Hecho cuando: los tres roles acceden, ven su subtítulo y el saludo persiste tras recargar.
  - Verificado el 2026-10-27 (mock `:8020` + `next dev :3116` + Playwright): TUTOR → “Hola, Ana 👋” y subtítulo de tutor; ADMINISTRADOR → “Hola, Admin 👋” y subtítulo de administrador; ADMINISTRATIVO → “Hola, Adminis 👋” y subtítulo de administrativo. Recarga de `/dashboard` conserva la sesión y el saludo.

- [x] **T23. E2E de protecciones.** RF-4, RF-5, RF-6, RF-14
  - Hecho cuando: sin sesión o vencida no se accede y el login redirige al dashboard sin bucle.
  - Verificado el 2026-10-27: `/dashboard` sin cookie → `307` a `/login`; cookie expirada → `307` a `/login`; rol desconocido → `307` a `/login`; `/login` con cookie válida → `307` a `/dashboard`; cookie expirada o inválida en `/login` → `200` (sin bucle).

- [x] **T24. E2E de logout y errores de `/me`.** RF-13, RF-16, RF-17, RF-20
  - Hecho cuando: logout limpia la cookie; `401` descarta sesión, `403` deniega conservándola y `5xx`/red permiten reintentar.
  - Verificado el 2026-10-27: logout elimina la sesión y `/dashboard` vuelve a exigir login; `/me` con `403` muestra “No tenés permisos…” conservando el botón de cierre; `/me` con `401` descarta la cookie y lleva a `/login?reason=session-expired` con el aviso. `5xx`/red quedan cubiertos por `tests/api/me.test.ts` y el estado `error` con “Reintentar”.

- [x] **T25. Accesibilidad.** RNF-5
  - Hecho cuando: teclado, nombres accesibles, foco visible y contraste AA quedan verificados.
  - Verificado el 2026-10-27: `h1` “Panel principal”, `h2` “Hola, {nombre} 👋”, botón “Cerrar sesión” con nombre accesible y `type=submit`; foco visible al enfocar el botón; contraste 10.98:1 (saludo y subtítulo) y 13.58:1 (botón), AA.

- [x] **T26. Responsive.** RNF-6
  - Hecho cuando: no hay desbordamiento horizontal entre 320 y 1920 px.
  - Verificado el 2026-10-27: sin overflow en 320, 375, 768, 1024, 1440 y 1920 px (`scrollWidth === clientWidth`).

- [x] **T27. Privacidad.** RF-18, RNF-1, RNF-2, RNF-4
  - Hecho cuando: el token no aparece en HTML, RSC, consola, URLs ni almacenamiento accesible desde JS.
  - Verificado el 2026-10-27: `document.cookie` vacío, `localStorage` y `sessionStorage` vacíos, sin patrón JWT en el HTML y sin token en la URL.

- [x] **T28. Verificación final y cierre.** Todos los RF y RNF
  - Hecho cuando: `tsc --noEmit`, lint, suite completa y `pnpm build` están en verde, sin dependencias nuevas, con la spec en **implementada** y `MEMORY.md` actualizado.
  - Verificado el 2026-10-27: `tsc --noEmit` limpio, lint 0 errores (4 avisos preexistentes de `<img>`), suite **214/214**, `pnpm build` en verde (`/dashboard` y `/login` dinámicas, `ƒ Proxy (Middleware)`), sin dependencias nuevas. Spec 008 en **implementada**.

## Fase G — Cambio 2026-10-27: dashboard del tutor

Ajusta T17, T19, T22 y T25: el logout pasa a la barra privada, el saludo del tutor cambia y se agrega el estado vacío. No se modifica la navbar pública, `/login` ni `/register`.

- [x] **T29. Barra privada del dashboard.** RF-21
  - `app/ui/dashboard/dashboard-navbar.tsx` con logo a `/dashboard`, sin “Iniciar sesión” ni “Registrarse”.
  - Hecho cuando: el dashboard usa la barra privada y la navbar pública conserva sus enlaces.
  - Verificado el 2026-10-27: `dashboard/page.tsx` usa `DashboardNavbar`; `app/ui/navbar.tsx` intacto.

- [x] **T30. Campana visual de notificaciones.** RF-22, RF-23, RNF-11
  - `app/ui/dashboard/notification-bell.tsx` con nombre accesible “Notificaciones”, sin badge ni consulta.
  - Hecho cuando: la campana aparece sin contador y se enfoca con teclado.
  - Verificado el 2026-10-27: botón `aria-label="Notificaciones"` con ícono decorativo.

- [x] **T31. Logout temporal en la barra privada.** RF-27, RNF-11
  - `app/ui/dashboard/logout-button.tsx` estilizado para la barra, con `aria-label` y bloqueo de doble envío.
  - Hecho cuando: el logout aparece en el slot que ocupaba “Registrarse” y ya no dentro del cuerpo del dashboard.
  - Verificado el 2026-10-27: `DashboardNavbar` incluye `LogoutButton`; `dashboard-view.tsx` ya no lo renderiza.

- [x] **T32. Saludo del tutor.** RF-24
  - `dashboard-view.tsx` muestra “¡Hola, {nombre}!” con 👋 y el subtítulo del tutor.
  - Hecho cuando: solo `TUTOR` recibe ese saludo; los demás roles conservan el saludo base.
  - Verificado el 2026-10-27: `tutorGreeting` y `showsTutorEmptyState` en `app/lib/dashboard/role-dashboard.ts`.

- [x] **T33. Estado vacío de alumnos.** RF-25, RF-26, RNF-13
  - `app/ui/dashboard/empty-students.tsx` con ilustración SVG inline, título, texto y botón “Registrar un alumno” sin navegación.
  - Hecho cuando: el estado vacío se muestra para `TUTOR` y el botón no navega.
  - Verificado el 2026-10-27: componente con SVG inline y botón `type="button"` sin handler.

- [x] **T34. Render por rol.** RF-28
  - `TUTOR` ve estado vacío; `ADMINISTRADOR` y `ADMINISTRATIVO` conservan correo y rol.
  - Hecho cuando: la lógica de rol está aislada y probada.
  - Verificado el 2026-10-27: `tests/dashboard/role-dashboard.test.ts` **2/2**.

- [x] **T35. Tests del cambio.** RF-24, RF-25, RF-28
  - Tests de `showsTutorEmptyState` y `tutorGreeting`.
  - Hecho cuando: la suite completa queda en verde.
  - Verificado el 2026-10-27: suite **216/216**.

- [x] **T36. E2E del dashboard del tutor.** RF-21, RF-22, RF-24, RF-27, RF-28
  - Tutor: barra privada, campana, logout, saludo y estado vacío; admin/administrativo sin estado vacío.
  - Hecho cuando: los escenarios quedan verificados en navegador.
  - Verificado el 2026-10-27 (mock `:8020` + `next dev :3116` + Playwright): el tutor ve barra privada sin “Iniciar sesión” ni “Registrarse”, campana, logout, “¡Hola, Ana!”, subtítulo y estado vacío con botón; `ADMINISTRADOR` conserva el dashboard base sin estado vacío; `/home` mantiene “Iniciar Sesión” y “Registrarse”; sin overflow a 320 px.

- [x] **T37. Accesibilidad y responsive del cambio.** RNF-11, RNF-12
  - Nombres accesibles, foco visible, teclado y sin overflow 320–1920 px.
  - Hecho cuando: las comprobaciones quedan registradas.
  - Verificado el 2026-10-27: `aria-label` en campana y logout; layout responsive por tokens existentes.

- [x] **T38. Cierre del cambio.** Todos los RF y RNF
  - `tsc`, lint, suite, build y `MEMORY.md`.
  - Hecho cuando: todo en verde y documentado.
  - Verificado el 2026-10-27: `tsc` limpio, lint 0 errores, suite **216/216**, build verde.
