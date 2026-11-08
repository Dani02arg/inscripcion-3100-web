# Tareas 009 — Menú lateral reutilizable con navegación por rol

Estado: aprobado (2026-10-28)

Spec: `specs/009-sidebar/spec.md` (aprobada el 2026-10-28).
Plan: `specs/009-sidebar/plan.md` (aprobado el 2026-10-28).

## Reglas de ejecución

- Una tarea por vez: test, código, verde, marcar y detenerse.
- No se implementa nada fuera de la spec 009 ni del plan.
- Sin dependencias nuevas.
- Verificación por tarea: `pnpm exec tsc --noEmit` y `pnpm lint`.
- Al cerrar cada tarea se actualiza `MEMORY.md`.
- Tests unitarios con `node --experimental-strip-types --test` e imports relativos con `.ts`.
- E2E con `pnpm dev`, `LARAVEL_API_URL` apuntando a un mock local y Playwright en modo headless.
- No se escriben clases de Tailwind con sintaxis insegura en archivos Markdown.
- Los textos visibles y los comentarios van en español; identificadores y archivos en inglés.

## Fase A — Lógica pura

- [x] **T1. Tipos e inventario de navegación por rol.**
  RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-54
  - Hecho cuando: `app/lib/sidebar/types.ts` y `app/lib/sidebar/navigation.ts` exponen los tres inventarios exactos, en orden, con `href` solo para «Inicio», y `tests/sidebar/navigation.test.ts` valida contenido, orden y ausencia de opciones ajenas.
  - Verificado el 2026-10-28: `navigation.test.ts` 8/8; `tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`).

- [x] **T2. Estado de ruta y opción activa.**
  RF-13, RF-14, RF-15, RF-16, RF-17, RF-18, RF-19, RF-23
  - Hecho cuando: `normalizePathname`, `isHrefActive` y `getNavigationItemState` cubren dashboard, barra final, query, fragmento, prefijos futuros, opciones no disponibles y rutas sin coincidencia, con tests en verde.
  - Verificado el 2026-10-28: `navigation.test.ts` 15/15; `tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`).

- [x] **T3. Iniciales, nombre y pie de cuenta.**
  RF-41, RF-42, RF-43, RF-44, RF-45, RF-46, RF-47
  - Hecho cuando: `formatInitials`, `formatFullName`, `getAccountAccessibleName` y `toSidebarAccount` manejan dos palabras, nombres compuestos, acentos, una palabra, una letra, vacíos y estados `ok`, `forbidden` y `error`, con tests en verde.
  - Verificado el 2026-10-28: `account.test.ts` 12/12; `tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`).

- [x] **T4. Preferencia de colapso.**
  RF-35, RF-36, RNF-12
  - Hecho cuando: `parseCollapsePreference` acepta solo `"1"` como colapsado y `serializeCollapsePreference` devuelve `"1"` o `"0"`, con tests de valores ausentes, vacíos e inválidos.
  - Verificado el 2026-10-28: `collapse-preference.test.ts` 6/6; `tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`). Se separaron `collapse-cookie.ts` (servidor) y `collapse-cookie-client.ts` (cliente) para no mezclar `next/headers` con el bundle del navegador.

- [x] **T5. Mapa de iconos y nombres de institución.**
  RF-1, RF-2, RF-3, RF-4, RF-5, RF-33, RNF-20
  - Hecho cuando: `app/lib/sidebar/icons.ts` asigna cada `SidebarIconKey` a un archivo existente o declarado y `getInstitutionLabel`/`getNavigationWidth` devuelven los textos y anchos de la spec, con tests.
  - Verificado el 2026-10-28: `icons.test.ts` 4/4 y `presentation.test.ts` 7/7; suite de sidebar **44/44**; `tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`).

## Fase B — Carga de cuenta y armazón

- [x] **T6. Carga de cuenta en el servidor.**
  RF-25, RF-39, RF-41, RF-42, RF-43, RF-44, RF-45, RF-52, RNF-9, RNF-14
  - Hecho cuando: `app/lib/dashboard/private-account.ts` devuelve `ok`, `forbidden` o `error`, borra la cookie y redirige con `401`, conserva la sesión con `403`, y el mapeo a pie de cuenta tiene tests.
  - Verificado el 2026-10-28: `private-account-state.ts` (mapeo puro) y `private-account.ts` (cargador con `verifySession`, `401` y `403`); `private-account.test.ts` 4/4; suite de sidebar y dashboard **48/48**; `tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`).

- [x] **T7. Armazón privado reutilizable.**
  RF-11, RF-18, RF-21, RF-22, RF-25, RF-26, RF-27, RF-29, RF-30, RF-31, RF-32, RF-33, RF-34, RF-35, RF-36, RF-37, RF-38, RF-39, RF-40, RNF-6
  - Hecho cuando: `app/ui/sidebar/private-shell.tsx` recibe rol, cuenta, colapso y contenido, y compone menú, barra compacta y contenido sin hacer `fetch`.
  - Verificado el 2026-10-28: `PrivateShell` (Server Component) con `role`, `account`, `collapsed` y `children`; coloca el menú y el contenido en un flex, reserva el alto de la barra compacta en móvil y no hace `fetch`. `tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`). E2E en T28/T30.

- [x] **T8. Página del dashboard con el armazón.**
  RF-20, RF-21, RF-22, RF-25, RF-26, RF-52
  - Hecho cuando: `app/dashboard/page.tsx` llama a `getPrivateAccount` y `getCollapsedPreference`, renderiza `PrivateShell` y conserva `metadata` y la protección de sesión.
  - Verificado el 2026-10-28: página con `getPrivateAccount`, `getCollapsedPreference`, `toSidebarAccount` y `PrivateShell`; sin `DashboardNavbar`; `metadata` y redirecciones conservadas. `tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`). La vista sigue cargando por su acción hasta T9; E2E en T28/T30.

- [x] **T9. Vista del dashboard presentacional.**
  RF-21, RF-41, RF-42, RF-43, RF-44, RF-45, RF-52
  - Hecho cuando: `app/ui/dashboard/dashboard-view.tsx` recibe el estado de cuenta, mantiene saludo, subtítulo, rol, correo y estado vacío del tutor, y muestra `forbidden` o `error` con reintento sin hacer `fetch`.
  - Verificado el 2026-10-28: `DashboardView` pasó a Server Component con `account`; `forbidden` y `error` conservan mensajes; `RetryButton` refresca el servidor; eliminada la acción cliente y la llamada duplicada a `/me`. `tsc --noEmit` limpio, `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`) y `pnpm build` en verde.

- [x] **T10. Carga y error del segmento.**
  RF-44, RF-45, RNF-1
  - Hecho cuando: `app/dashboard/loading.tsx` muestra el esqueleto del menú y del contenido con `aria-busy`, y `app/dashboard/error.tsx` muestra el mensaje, «Reintentar» y el acceso a iniciar sesión sin menú.
  - Verificado el 2026-10-28: `SidebarSkeleton` reutilizable con `motion-reduce`, `loading.tsx` con armazón y `aria-busy`, `error.tsx` sin navbar ni menú con logo, mensaje, reintento e inicio de sesión. `tsc --noEmit` limpio, `pnpm lint` 0 errores (4 avisos preexistentes) y `pnpm build` en verde.

## Fase C — Cabecera, navegación y cuenta

- [x] **T11. Contenedor del menú y estados de escritorio.**
  RF-18, RF-21, RF-25, RF-26, RF-27, RF-28, RF-29, RF-30, RF-31, RF-32, RF-33, RF-34, RF-35, RF-36, RF-37, RNF-11
  - Hecho cuando: `app/ui/sidebar/sidebar.tsx` maneja colapso, drawer y cambio de breakpoint, usa `usePathname`, escribe la preferencia y cierra el drawer y el menú de cuenta al pasar a escritorio.
  - Verificado el 2026-10-28: contenedor con estado de colapso y drawer, escritura de cookie al alternar, `usePathname`, cierre por `matchMedia` al entrar a escritorio, cierre en `popstate`, menús de cuenta separados para escritorio y drawer, y conexión de cabecera, navegación y pie. `tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`). E2E en T27/T28/T30.

- [x] **T12. Cabecera institucional.**
  RF-1, RF-2, RF-3, RF-4, RF-5, RF-38, RF-39, RNF-13
  - Hecho cuando: `app/ui/sidebar/sidebar-header.tsx` muestra el logotipo existente, las variantes de nombre por estado, la campana y el control de colapso, con el nombre completo como nombre accesible único.
  - Verificado el 2026-10-28: cabecera y campana creadas; `tsc --noEmit` limpio y `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`). La verificación visual y responsive queda en T25 y T30.

- [x] **T13. Navegación con estado activo y opciones no disponibles.**
  RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-28, RF-32, RF-33, RF-34, RNF-1, RNF-2, RNF-3
  - Hecho cuando: `app/ui/sidebar/sidebar-nav.tsx` marca «Inicio» con `aria-current`, muestra fondo, indicador y negrita al activo, y expone las opciones no disponibles como enfocables, descritas y no navegables.
  - Verificado el 2026-10-28: navegación con `Link`, activo con `aria-current` e indicador, no disponibles con `role="link"`, `aria-disabled`, descripción y bloqueo de Enter/Espacio, tooltip básico en colapso. `tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`). E2E en T25 y T29.

- [x] **T14. Pie de cuenta.**
  RF-41, RF-42, RF-43, RF-44, RF-45, RF-46, RF-47, RNF-1
  - Hecho cuando: `app/ui/sidebar/sidebar-account.tsx` muestra iniciales, nombre y correo, degrada sin datos inventados y en colapso deja solo el avatar con los datos dentro del menú.
  - Verificado el 2026-10-28: pie con iniciales o avatar genérico, nombre y correo con elipsis, estado «Cuenta» degradado, disposición colapsada y ranura para el menú; `tsc --noEmit` limpio y `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`). E2E en T26.

- [x] **T15. Menú de cuenta y cierre de sesión.**
  RF-48, RF-49, RF-50, RF-51, RNF-1
  - Hecho cuando: `app/ui/sidebar/sidebar-account-menu.tsx` abre con clic, Enter o Espacio, cierra con Escape, clic fuera o acción, devuelve el foco al avatar, muestra «Configuración de cuenta» no disponible y ejecuta «Cerrar sesión» con bloqueo de doble envío.
  - Verificado el 2026-10-28: menú con apertura/cierre por teclado y puntero, foco inicial y retorno al disparador, encabezado con nombre y correo en colapso, «Configuración de cuenta» no disponible y `LogoutButton` con `useFormStatus`; `tsc --noEmit` limpio y `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`). E2E en T26/T29.

## Fase D — Colapso y tooltips

- [x] **T16. Colapso, persistencia y anchos.**
  RF-27, RF-28, RF-32, RF-35, RF-36, RF-39, RF-40
  - Hecho cuando: el control alterna 280 y 72 px, escribe la cookie de preferencia, conserva el activo y la campana, y el estado inicial del servidor evita el salto visual.
  - Verificado el 2026-10-28: el contenedor usa `getNavigationWidth` (280/72), `initialCollapsed` desde la cookie, `writeCollapsePreference` al alternar, campana y activo conservados en colapso y `data-collapsed` para verificación. `tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`). E2E en T27.

- [x] **T17. Tooltips accesibles.**
  RF-33, RF-34, RNF-19
  - Hecho cuando: el tooltip aparece con hover y foco, se oculta con Escape, no desborda el viewport y agrega «Próximamente» en las opciones no disponibles.
  - Verificado el 2026-10-28: estado controlado de tooltip en colapso, apertura por hover y foco, cierre con Escape y al salir del ítem, ancho máximo de 224 px, texto con «Próximamente» y remontaje de la navegación al cambiar el colapso. `tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`). E2E en T29.

## Fase E — Tablet y móvil

- [x] **T18. Barra compacta y apertura del drawer.**
  RF-26, RF-38, RF-39
  - Hecho cuando: `app/ui/sidebar/mobile-top-bar.tsx` muestra apertura, logotipo y campana por debajo de 1024 px y abre el drawer con nombre abreviado.
  - Verificado el 2026-10-28: barra conectada al `Sidebar` mediante `onOpenMenu`/`triggerRef`; el drawer muestra nombre abreviado, opciones y cuenta. `tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`). E2E en T28/T30.

- [x] **T19. Drawer con foco, Escape y fondo.**
  RF-27, RF-28, RF-29, RF-30, RF-31, RF-40, RNF-18
  - Hecho cuando: `app/ui/sidebar/sidebar-drawer.tsx` usa `dialog` con `showModal`, mueve el foco al cierre, lo contiene, cierra con botón, Escape o fondo sin propagar el clic y devuelve el foco al abridor.
  - Verificado el 2026-10-28: drawer con `dialog`/`showModal`, foco al botón de cierre, `onCancel`, clic de fondo sin propagación, retorno de foco al disparador, bloqueo de scroll con compensación, ancho 320 px o 85 % y scroll interno. `tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`). E2E en T28.

- [x] **T20. Scroll, fondo inerte y resize.**
  RF-30, RF-37, RNF-6, RNF-17
  - Hecho cuando: el fondo no se desplaza ni salta al abrir o cerrar, el interior del drawer se desplaza con cabecera y pie visibles, y el cambio de breakpoint cierra drawer y menú de cuenta y aplica la preferencia.
  - Verificado el 2026-10-28: `dialog` con fondo inerte y scroll interno, bloqueo de `body` con compensación de barra, cierre por `matchMedia` al entrar a escritorio, cierre del menú de cuenta y preferencia de colapso conservada; atributos `data-drawer-open` y `data-account-menu-open` para E2E. `tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`). E2E en T28.

## Fase F — Integración y assets

- [x] **T21. Integración del menú con el dashboard.**
  RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-18, RF-21, RF-25, RF-52
  - Hecho cuando: el dashboard renderiza el menú con el rol del token y la cuenta del servidor, y una sesión vencida deja de mostrar el menú.
  - Verificado el 2026-10-28: `page.tsx` toma el rol de `claims` y la cuenta de `/me`, `Sidebar` deriva la lista con `getRoleNavigation`; `401` y sesión inválida redirigen antes de renderizar. Tests de integración del mapeo (6/6) y atributos `data-role`/`data-account-status` para E2E. `tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes). E2E en T30.

- [x] **T22. Retiro de la barra anterior.**
  RF-25, RF-27, RF-50
  - Hecho cuando: se eliminan `dashboard-navbar`, la acción de dashboard y los archivos movidos, no quedan importadores huérfanos y `tsc` pasa.
  - Verificado el 2026-10-28: eliminados `app/ui/dashboard/dashboard-navbar.tsx`, `notification-bell.tsx`, `logout-button.tsx` y `app/lib/actions/dashboard.ts`; sin importadores huérfanos. `tsc --noEmit` limpio, `pnpm lint` 0 errores (4 avisos preexistentes) y `pnpm build` en verde.

- [x] **T23. Iconos institucionales.**
  RF-1, RF-33, RNF-15, RNF-20
  - Hecho cuando: se agregan en `public/icons` los cinco iconos nuevos (`ico-home.svg`, `ico-users.svg`, `ico-report.svg`, `ico-profile.svg`, `ico-settings.svg`) y se reutilizan los existentes y `public/logo.png` con `next/image`.
  - Verificado el 2026-10-28: cinco SVG nuevos de 24×24 con `fill="#2C3E50"`; reutilizados `ico-read-book`, `ico-course`, `ico-register` y `logo.png`; `icons.test.ts` 5/5 con verificación de existencia; `tsc --noEmit` limpio, `pnpm lint` 0 errores (4 avisos preexistentes) y `pnpm build` en verde.

## Fase G — Calidad y E2E

- [x] **T24. Suite unitaria de la lógica del menú.**
  RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-18, RF-19, RF-23, RF-35, RF-36, RF-41, RF-42, RF-43, RF-44, RF-45, RF-46, RF-47, RNF-12
  - Hecho cuando: toda la suite nueva de `tests/sidebar` y `tests/dashboard/private-account.test.ts` pasa y la suite completa no tiene regresiones.
  - Verificado el 2026-10-28: suite completa **267/267** en verde, incluidas navegación, cuenta, preferencia, iconos, presentación e integración de la cuenta. `tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes).

- [x] **T25. E2E de identidad, roles y estado activo.**
  RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-18, RF-19, RF-20, RF-21, RF-23, RNF-7, RNF-11
  - Hecho cuando: los tres roles ven su lista exacta, «Inicio» queda activo, las opciones no disponibles no navegan y los cortes de 1024, 1279 y 1280 px muestran las variantes correctas.
  - Verificado el 2026-10-29 con `next start -p 3117`, mock en `:8010` y Playwright: ADMINISTRADOR con 7 opciones, TUTOR con 4 y ADMINISTRATIVO con 5, cada uno con su nombre, iniciales y correo; «Inicio» único activo; opciones no disponibles con `aria-disabled` que no navegan ni cambian el foco; 1024 y 1279 con nombre abreviado y logo de 24 px, 1280 y 1440 con nombre completo y logo de 32 px; barra compacta oculta en escritorio. Sin regresiones.

- [x] **T26. E2E del pie, cuenta y sesión.**
  RF-41, RF-42, RF-43, RF-44, RF-45, RF-46, RF-47, RF-48, RF-49, RF-50, RF-51, RF-52, RNF-9
  - Hecho cuando: se verifican iniciales, nombre y correo, esqueleto, error y `403` degradados, menú de cuenta, cierre de sesión, doble activación, servicio caído y `401` con redirección.
  - Verificado el 2026-10-29 con Playwright: pie con iniciales, nombre y correo; menú con foco inicial, Escape y retorno de foco; configuración no disponible; colapso con solo avatar y datos en el menú; `403` y `500` con pie «Cuenta» y acciones; `401` redirige a `/login?reason=session-expired`, borra la cookie y muestra el aviso; logout con redirección, doble clic con una sola solicitud y logout con el mock caído; esqueleto de carga con `aria-busy` y 26 bloques. **Corrección:** borrar la cookie durante el render no está permitido; se agregó `app/session-expired/route.ts` para limpiarla y redirigir, y `getPrivateAccount` ahora redirige allí. Sin este cambio, el `401` caía en el límite de error.

- [x] **T27. E2E del colapso y tooltips.**
  RF-27, RF-28, RF-32, RF-33, RF-34, RF-35, RF-36, RF-39, RF-40
  - Hecho cuando: se verifican 280 y 72 px, iconos, tooltip con hover y foco, Escape, persistencia tras recarga y logout, cookie ausente o inválida y ausencia de saltos visuales.
  - Verificado el 2026-10-29 con Playwright: 72/280 px, iconos y nombres ocultos, tooltip «Inicio» y «Usuarios — Próximamente» visibles con hover y foco, dentro del viewport, oculto con Escape; cookie `1`/`0`, persistencia tras recarga y tras el ciclo de logout/login, y cookie inválida o ausente con menú expandido. El SSR parte del estado de la cookie, sin parpadeo. `MEMORY.md` actualizado.

- [x] **T28. E2E del drawer y errores de ruta.**
  RF-22, RF-24, RF-26, RF-27, RF-28, RF-29, RF-30, RF-31, RF-37, RF-40, RF-52, RNF-6, RNF-17, RNF-18
  - Hecho cuando: se verifican apertura en 320 a 1023 px, cierre por botón, Escape y fondo sin clic a través, foco atrapado y devuelto, scroll interno, resize, navegación que cierra el drawer y 404 sin menú.
  - Verificado el 2026-10-29 con Playwright: en 375 px la barra compacta reemplaza al `aside`; drawer de 318,9 px (85 % de 375) con foco inicial en «Cerrar menú», nombre abreviado, 7 opciones y cuenta; Escape cierra y devuelve el foco; clic en el fondo no navega ni enfoca el fondo; en 320×480 el drawer mide 272 px, el contenido se desplaza y el pie queda visible; resize a escritorio cierra el drawer y restaura el `body`; «Inicio» cierra el drawer; `/dashboard/desconocido` responde 404 sin menú. **Corrección:** el foco escapaba al enlace de la barra compacta al tabular; se agregó trampa de foco explícita en `SidebarDrawer` y se verificaron 20 tabulaciones consecutivas dentro del diálogo.

- [x] **T29. Accesibilidad y preferencias del sistema.**
  RF-13, RF-14, RF-15, RF-16, RF-17, RF-28, RF-29, RF-34, RF-39, RF-47, RF-48, RF-52, RNF-1, RNF-2, RNF-3, RNF-5, RNF-13, RNF-16, RNF-18, RNF-19
  - Hecho cuando: el árbol AX, `aria-current`, `aria-disabled`, descripciones, foco visible, contraste 4.5:1 y 3:1, colores forzados, movimiento reducido y texto al 200 % quedan verificados.
  - Verificado el 2026-10-29 con Playwright: árbol AX con «Menú lateral», «Menú principal», «Inicio» y opciones «No disponible, próximamente»; `aria-current="page"` y `aria-disabled="true"`; foco visible con anillo de 4 px; contrastes 13.58:1 (activo), 10.98:1 (texto), 10.42:1 (badge) y 13.58:1 (indicador); en colores forzados el foco usa `outline` y el indicador conserva borde visible; con movimiento reducido el esqueleto no anima; con texto al 200 % no hay desbordes y las etiquetas conservan ancho legible. **Correcciones:** borde en el indicador activo, regla global de `outline` para colores forzados, `motion-reduce` en el tooltip y badge apilado debajo de la etiqueta para no colapsar el texto al 200 %. `pnpm build` en verde.

- [x] **T30. Responsive, privacidad y regresión de la 008.**
  RF-21, RF-22, RF-25, RF-26, RF-37, RF-53, RF-54, RNF-4, RNF-5, RNF-8, RNF-14
  - Hecho cuando: no hay desbordamiento ni solapamiento entre 320 y 1920 px, el token no aparece en HTML, URL, consola ni almacenamiento, la cookie de colapso solo contiene `"0"` o `"1"` y login, logout, `401`, `403` y `/login` siguen funcionando.
  - Verificado el 2026-10-29 con Playwright: 320, 375, 768, 1023, 1024, 1279, 1280, 1440 y 1920 sin desbordes ni elementos fuera del viewport; colapso de 72 px en 1024/1280/1920 sin desbordes; texto al 200 % en 320 sin desborde tras `break-all` en el correo del dashboard. Login real con mock → `/dashboard`, `/login` con sesión → `/dashboard`, `403` con acceso denegado y pie «Cuenta», logout → `/login` y cookie eliminada. Privacidad: cookie `token` `httpOnly`/`Lax`, sin token en HTML, URL, `localStorage` ni `sessionStorage`, y `document.cookie` vacío tras el login; la preferencia de colapso solo usa `0`/`1`. **Corrección:** `dd` del correo con `break-all` para el 200 % en 320 px.

- [x] **T31. Verificación final y cierre.**
  RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-18, RF-19, RF-20, RF-21, RF-22, RF-23, RF-24, RF-25, RF-26, RF-27, RF-28, RF-29, RF-30, RF-31, RF-32, RF-33, RF-34, RF-35, RF-36, RF-37, RF-38, RF-39, RF-40, RF-41, RF-42, RF-43, RF-44, RF-45, RF-46, RF-47, RF-48, RF-49, RF-50, RF-51, RF-52, RF-53, RF-54, RNF-1, RNF-2, RNF-3, RNF-4, RNF-5, RNF-6, RNF-7, RNF-8, RNF-9, RNF-10, RNF-11, RNF-12, RNF-13, RNF-14, RNF-15, RNF-16, RNF-17, RNF-18, RNF-19, RNF-20
  - Hecho cuando: `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build` pasan; la suite completa y los E2E están en verde; la spec 008 sigue coherente; `package.json` no suma dependencias y `MEMORY.md` queda actualizado.
  - Verificado el 2026-10-29: `tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`); suite completa **267/267**; `pnpm build` en verde con `/session-expired` y `/dashboard` dinámicos; E2E T25–T30 completos; `package.json` sin dependencias nuevas; spec 008 actualizada al cambio implementado. Spec 009 cerrada como **implementada**.

## Orden de dependencia

1. T1 a T5.
2. T6.
3. T12 a T15 (piezas de UI que no dependen del contenedor).
4. T11 (contenedor del menú).
5. T7 a T10 (integración con la página).
6. T16 y T17.
7. T18 a T20.
8. T21 a T23.
9. T24 a T30.
10. T31.

## Trazabilidad

- RF-1 a RF-5: T5, T12, T23, T24, T25, T31.
- RF-6 a RF-14: T1, T2, T13, T21, T24, T25, T29, T31.
- RF-15 a RF-19: T2, T13, T24, T25, T29, T31.
- RF-20 a RF-24: T8, T21, T25, T28, T30, T31.
- RF-25 a RF-40: T7, T11 a T20, T23, T24, T25, T27, T28, T29, T30, T31.
- RF-41 a RF-47: T3, T9, T14, T24, T26, T29, T31.
- RF-48 a RF-51: T15, T22, T26, T29, T31.
- RF-52 a RF-54: T6, T9, T21, T28, T30, T31.
- RNF-1 a RNF-20: T10 a T20, T23, T24 a T31.
