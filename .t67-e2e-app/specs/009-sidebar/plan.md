# Plan 009 — Menú lateral reutilizable con navegación por rol

Estado: aprobado (2026-10-28)

Spec: `specs/009-sidebar/spec.md` (aprobada el 2026-10-28).

## 1. Alcance, principios y supuestos

Este plan implementa la spec 009: un menú lateral reutilizable con identidad institucional, navegación según el rol, estado activo, pie de cuenta, colapso en escritorio, drawer en tablet y móvil, y preferencia recordada. Solo «Inicio» está habilitado; el resto de las opciones se muestra como no disponible.

Alcance:

- Reemplazar la barra privada del dashboard por el menú lateral en escritorio y por una barra compacta con drawer por debajo de 1024 px.
- Mostrar el logotipo institucional existente y el nombre oficial, con abreviatura entre 1024 y 1279 px y en el drawer.
- Derivar las opciones del rol del token y no mostrar opciones de otros roles.
- Marcar «Inicio» como activo al entrar al dashboard y anunciarlo como página actual.
- Mostrar iniciales, nombre y correo en el pie, con carga y degradación ante error.
- Ofrecer «Configuración de cuenta» como no disponible y «Cerrar sesión» como acción.
- Recordar el colapso en el navegador y conservarlo tras cerrar sesión.
- Actualizar la documentación de la spec 008 ya registrada como cambio pendiente.

Fuera de alcance (según la spec): módulos funcionales, rutas nuevas, activación de opciones por módulo, edición de perfil o configuración, permisos granulares, notificaciones reales, backend, búsqueda, modo oscuro, avatar con imagen y sincronización entre dispositivos.

Principios aplicados de `docs/constitution.md`:

- SDD: la spec 009 manda; este plan no agrega requisitos.
- TypeScript estricto: sin `any`, sin castings inseguros y sin supresión de errores.
- Separación de capas: rutas en `app`, UI pura en `app/ui`, lógica y red en `app/lib`.
- Pureza visual: los componentes de `app/ui` reciben datos por props y no hacen `fetch`.
- Server Components primero: el armazón privado y la carga de cuenta se resuelven en el servidor; el cliente queda para interacción.
- API centralizada: se reutiliza `getCurrentUser` de `app/lib/api/me.ts`.
- Consistencia lingüística: identificadores y archivos en inglés; textos visibles y comentarios en español.
- Sin dependencias nuevas.
- `next/image` para el logotipo y los iconos; `loading.tsx` y `error.tsx` del segmento se conservan.
- Assets: se reutiliza `public/logo.png`; los iconos faltantes se informan en la sección 2.9.

Supuestos:

- El dashboard es la única ruta privada de esta versión.
- `GET /api/auth/me` mantiene el contrato de la spec 008.
- El token conserva `role` y sigue siendo la fuente del menú.
- El colapso es una preferencia no sensible y puede vivir en una cookie legible por el servidor.
- El cierre de sesión sigue siendo local y de mejor esfuerzo.
- No se modifica el backend ni el contrato de sesión.

## 2. Archivos a crear y modificar

### 2.1 Crear — tipos y navegación

- `app/lib/sidebar/types.ts`
  - `SidebarIconKey` con las claves de icono.
  - `SidebarNavItem` con `label`, `icon`, `href` opcional y `enabled`.
  - `SidebarAccountData` con `name`, `lastname` y `email`.
  - `SidebarAccountState` con `status` `ready` o `unavailable` y datos opcionales.
  - `SidebarMode` con `expanded`, `collapsed` y `drawer`.
  - Cubre RF-7 a RF-13, RF-41 a RF-49.

- `app/lib/sidebar/navigation.ts`
  - Inventario inmutable por rol, en el orden exacto de la spec.
  - `getRoleNavigation(role)`: devuelve la lista del rol.
  - `getNavigationItemState(item, pathname)`: `active`, `inactive` o `unavailable`.
  - `isNavigationItemEnabled(item)`: verdadero solo para «Inicio».
  - `normalizePathname(pathname)`: elimina barra final, query y fragmento.
  - `isHrefActive(href, pathname)`: coincidencia exacta para «Inicio» y por prefijo para módulos futuros.
  - Constantes de breakpoints (1024 px y 1280 px) y de anchos (280, 72 y 320 px).
  - Cubre RF-6 a RF-21.

- `app/lib/sidebar/account.ts`
  - `formatInitials(name, lastname)`: primera letra del primer nombre y del último apellido; una palabra usa dos letras; sin nombre devuelve `null`.
  - `formatFullName(name, lastname)`: une las partes no vacías.
  - `toSidebarAccount(state)`: convierte el estado del servidor en datos de pie o en `unavailable`.
  - `getAccountAccessibleName(displayName)`: «Cuenta de {nombre}» o «Cuenta».
  - Cubre RF-41 a RF-47.

- `app/lib/sidebar/collapse-preference.ts`
  - `SIDEBAR_COLLAPSE_COOKIE_NAME = "sidebar_collapsed"`.
  - `COLLAPSE_COOKIE_MAX_AGE_SECONDS` de un año.
  - `parseCollapsePreference(value)`: solo `"1"` significa colapsado; ausente, vacío o inválido significa expandido.
  - `serializeCollapsePreference(collapsed)`: devuelve `"1"` o `"0"`.
  - Cubre RF-35, RF-36 y RNF-12.

- `app/lib/sidebar/collapse-cookie.ts`
  - Servidor: `getCollapsedPreference()` lee la cookie con `next/headers` y aplica `parseCollapsePreference`.
  - Cubre RF-35, RF-36.

- `app/lib/sidebar/collapse-cookie-client.ts`
  - Cliente: `writeCollapsePreference(collapsed)` escribe la cookie con `path=/`, `SameSite=Lax`, `maxAge` de un año y `Secure` en HTTPS; nunca lanza si el navegador la bloquea.
  - Se separa del archivo de servidor para que `next/headers` no entre al bundle del cliente.
  - Cubre RF-35, RF-36.

- `app/lib/sidebar/icons.ts`
  - Mapa de `SidebarIconKey` al archivo de icono en `public/icons`.
  - Los iconos se renderizan decorativos con `next/image` y texto alternativo vacío.
  - Cubre RF-1, RF-33, RNF-20.

### 2.2 Crear — carga de cuenta y armazón privado

- `app/lib/dashboard/private-account-state.ts`
  - `PrivateAccountState`: `ok` con `claims` y `user`, `forbidden` con `claims` y `error` con `claims` y mensaje.
  - `PrivateAccountLookup`: agrega `unauthorized` para que el cargador decida la redirección.
  - `mapCurrentUserResult(claims, result)`: traducción pura de la respuesta de `/me`, sin cookies ni redirecciones.
  - Se separa del cargador para poder probarla sin `next/headers`.
  - Cubre RF-41 a RF-45 y RF-52.

- `app/lib/dashboard/private-account.ts`
  - `getPrivateAccount()`: llama a `verifySession`, obtiene el token, llama a `getCurrentUser` y usa `mapCurrentUserResult`.
  - Sin token o token inválido: redirige a `/login` mediante `verifySession`.
  - `401`: borra la cookie y redirige a `/login?reason=session-expired`, conservando el comportamiento de la spec 008.
  - `403`: devuelve `forbidden` sin borrar la sesión.
  - Red, timeout, `5xx` o cuerpo inválido: devuelve `error` con el mensaje de la spec 008.
  - Se invoca una sola vez por render de página; no se duplica la llamada a `/me`.
  - Cubre RF-25, RF-39, RF-41 a RF-45, RF-52 y RNF-14.

- `app/ui/sidebar/private-shell.tsx`
  - Server Component presentacional que compone el menú lateral, la barra compacta y el contenido.
  - Recibe `role`, `account`, `collapsed` y `children`; no hace `fetch`.
  - Se usa desde la página del dashboard y queda disponible para futuras rutas privadas.
  - No se implementa como `layout.tsx` de ruta porque ese layout también envolvería al 404 de `/dashboard/...`, y la spec exige que el 404 se muestre sin menú.
  - Cubre RF-11, RF-18, RF-21, RF-22, RF-25 a RF-27, RF-29 a RF-40 y RNF-6.

- `app/session-expired/route.ts`
  - Route Handler que borra la cookie de sesión rechazada y redirige a `/login?reason=session-expired`.
  - Es necesario porque un Server Component no puede modificar cookies durante el render; `getPrivateAccount` solo redirige a este handler.
  - Cubre RF-52.

- `app/dashboard/page.tsx`
  - Deja de renderizar `DashboardNavbar`.
  - Llama a `getPrivateAccount` y a `getCollapsedPreference`; usa los claims devueltos como rol del menú.
  - Renderiza `PrivateShell` con el rol, la cuenta y el estado inicial del colapso.
  - Ajusta el contenedor al armazón del menú, sin el relleno superior de la barra antigua.
  - Conserva `metadata` y la protección de sesión.
  - Cubre RF-20, RF-21, RF-22, RF-25, RF-26 y RF-52.

- `app/dashboard/loading.tsx`
  - Renderiza un armazón de carga con el esqueleto del menú y del contenido.
  - Mantiene `aria-busy` y el aviso solo para lectores de pantalla.
  - Cubre RF-44 y RNF-1.

- `app/dashboard/error.tsx`
  - Client Component del límite de error.
  - Muestra el mensaje general, «Reintentar» y el enlace a iniciar sesión.
  - No dibuja el menú porque el límite de error no puede leer la cookie de sesión; el estado de sesión inválida se resuelve en el servidor antes de renderizar.
  - Cubre RNF-1 y RF-45.

### 2.3 Crear — UI del menú

- `app/ui/sidebar/sidebar.tsx`
  - Client Component dueño del estado de colapso, apertura del drawer y cambio de breakpoint.
  - Recibe `role`, `account` y `initialCollapsed`.
  - Usa `usePathname` para el estado activo.
  - Renderiza el menú de escritorio, la barra compacta y el drawer.
  - Escribe la preferencia al alternar el colapso.
  - Cierra el drawer y el menú de cuenta al cruzar a escritorio.
  - Cubre RF-18, RF-21, RF-25 a RF-37 y RNF-11.

- `app/ui/sidebar/sidebar-header.tsx`
  - Presentacional. Recibe `collapsed`, `isDrawer` y el control de colapso.
  - Renderiza el logotipo con `next/image` y las variantes del nombre.
  - En escritorio incluye la campana y el control de colapso; en el drawer, solo identidad y cierre.
  - El nombre completo se expone una vez como nombre accesible; las variantes visibles quedan ocultas para lectores de pantalla para evitar duplicados.
  - Cubre RF-1 a RF-5, RF-38, RF-39 y RNF-13.

- `app/ui/sidebar/sidebar-nav.tsx`
  - Presentacional. Recibe la lista, la ruta activa, el colapso y el cierre del drawer.
  - «Inicio» se renderiza como enlace con `aria-current="page"` cuando está activo.
  - Las opciones no disponibles se renderizan como enlaces deshabilitados no navegables, enfocables y descritos con «No disponible, próximamente».
  - En colapso muestra solo iconos; el nombre sigue accesible y el tooltip aparece con hover y foco.
  - Aplica fondo, indicador lateral y negrita al activo.
  - Cubre RF-7 a RF-17, RF-28, RF-32 a RF-34 y RNF-1 a RNF-3.

- `app/ui/sidebar/sidebar-account.tsx`
  - Client Component. Recibe el estado de cuenta y el colapso.
  - Muestra iniciales, nombre y correo, o el estado degradado.
  - Abre el menú de cuenta desde el avatar o el nombre.
  - En colapso muestra solo el avatar y revela nombre y correo dentro del menú.
  - Cubre RF-41 a RF-47 y RNF-1.

- `app/ui/sidebar/sidebar-account-menu.tsx`
  - Menú anclado al avatar con «Configuración de cuenta» y «Cerrar sesión».
  - Abre con clic, Enter o Espacio; cierra con Escape, clic fuera o al elegir una acción.
  - Devuelve el foco al avatar al cerrar.
  - La configuración se muestra no disponible; el cierre usa el formulario existente.
  - Cubre RF-48 a RF-51 y RNF-1.

- `app/ui/sidebar/sidebar-drawer.tsx`
  - Client Component basado en el elemento nativo `dialog`.
  - Abre con `showModal`, lo que aporta contención de foco y fondo inerte.
  - Cierra con el botón, Escape o clic en el fondo; el clic del fondo no se propaga.
  - Al abrir mueve el foco al botón de cierre; al cerrar lo devuelve al botón de apertura.
  - Bloquea el desplazamiento del fondo con compensación de barra para no mover el contenido.
  - El interior desplaza sus opciones y conserva cabecera y pie.
  - Cubre RF-26 a RF-31, RF-40 y RNF-6, RNF-17, RNF-18.

- `app/ui/sidebar/mobile-top-bar.tsx`
  - Barra compacta con botón de apertura, logotipo y campana.
  - Presentacional; recibe la acción de apertura.
  - Cubre RF-26, RF-38 y RF-39.

- `app/ui/sidebar/sidebar-skeleton.tsx`
  - Esqueleto accesible del menú y del pie para la carga de la ruta y del contenido.
  - Sin datos inventados ni animación cuando se solicita movimiento reducido.
  - Cubre RF-44 y RNF-17.

- `app/ui/sidebar/notification-bell.tsx`
  - Se mueve desde `app/ui/dashboard` sin cambios de comportamiento.
  - Conserva el nombre accesible «Notificaciones», sin contador ni consulta.
  - Cubre RF-38 y RF-39.

- `app/ui/sidebar/logout-button.tsx`
  - Se mueve desde `app/ui/dashboard` y se adapta al menú de cuenta.
  - Conserva el formulario con la Server Action, `useFormStatus`, `aria-busy` y el bloqueo de doble envío.
  - Cubre RF-50, RF-51 y RNF-1.

- `app/ui/dashboard/retry-button.tsx`
  - Client Component mínimo que refresca el render del servidor al reintentar.
  - Cubre RF-45 y RNF-1.

### 2.4 Modificar

- `app/ui/dashboard/dashboard-view.tsx`
  - Pasa a Server Component presentacional.
  - Recibe el estado de cuenta; ya no llama a la acción ni hace `fetch`.
  - Mantiene el saludo, el subtítulo, el correo, el rol y el estado vacío del tutor.
  - En `forbidden` muestra el mensaje de acceso denegado; en `error`, el mensaje y `RetryButton`.
  - Cubre RF-21, RF-41 a RF-45, RF-52 y RNF-14.

- `app/lib/auth/types.ts`
  - Se reutilizan `UserRole`, `CurrentUser` y los mensajes existentes.
  - Solo se agregan las constantes de textos del menú que no pertenezcan a `app/lib/sidebar`.
  - Cubre RF-54 y RNF-8.

- `specs/008-session-dashboard/spec.md`
  - Ya actualizada como cambio pendiente; no requiere más cambios de comportamiento.
  - Se revisa que la referencia al menú lateral y al cierre de sesión coincida con la implementación.

- `MEMORY.md`
  - Registra la aprobación de la spec, la aprobación del plan, las decisiones y la verificación final.

### 2.5 Eliminar

- `app/ui/dashboard/dashboard-navbar.tsx`
  - Reemplazada por el menú lateral y la barra compacta.
- `app/ui/dashboard/notification-bell.tsx` y `app/ui/dashboard/logout-button.tsx`
  - Se mueven a `app/ui/sidebar`; se eliminan las rutas antiguas.
- `app/lib/actions/dashboard.ts`
  - La carga pasa al servidor mediante `getPrivateAccount`; se elimina la acción y su tipo asociado.
  - Antes de borrar se verifica que no tenga otros importadores.

### 2.6 Pruebas nuevas

- `tests/sidebar/navigation.test.ts`
  - Listas por rol, orden, opciones habilitadas y estados de ruta.
- `tests/sidebar/account.test.ts`
  - Iniciales, nombre completo, nombre accesible y degradación.
- `tests/sidebar/collapse-preference.test.ts`
  - Parseo, serialización y valores inválidos.
- `tests/sidebar/icons.test.ts`
  - Correspondencia de claves y ausencia de claves duplicadas.
- `tests/dashboard/private-account.test.ts`
  - Mapeo del resultado del usuario a `SidebarAccountState`; no usa red.

### 2.7 Documentación de assets

- Logotipo: se reutiliza `public/logo.png`, el mismo de la barra superior. No se agrega ni reemplaza.
- Iconos existentes reutilizados:
  - `public/icons/ico-read-book.svg` para «Alumnos» y «Mis alumnos».
  - `public/icons/ico-course.svg` para «Cursos».
  - `public/icons/ico-register.svg` para «Inscripciones».
  - `public/icons/ico-bell.svg` para notificaciones, si no se conserva el SVG inline actual.
  - `public/icons/ico-burger-menu.svg` para la apertura del drawer.
  - `public/icons/ico-logout.svg` para el cierre de sesión.
- Iconos nuevos a agregar en `public/icons`, con trazo de 24 por 24 y estilo institucional:
  - `ico-home.svg`: casa simple, para «Inicio».
  - `ico-users.svg`: dos personas, para «Usuarios».
  - `ico-report.svg`: barras de reporte, para «Reportes».
  - `ico-profile.svg`: persona con contorno, para «Mi perfil».
  - `ico-settings.svg`: engranaje, para «Configuración de cuenta».
- Los iconos son decorativos; el nombre accesible lo aporta el texto de la opción.

### 2.8 No se modifica

- Backend, contrato de sesión, `/login`, `/register`, `/home` y rutas públicas.
- `app/lib/api/me.ts` y `app/lib/actions/logout.ts`: se reutilizan.
- `app/lib/auth/session-cookie.ts` y `session.ts`: la sesión y el rol no cambian.
- `proxy.ts`: la protección de `/dashboard` sigue igual.
- Dependencias: no se agregan paquetes.

## 3. Funciones de lógica pura

- `getRoleNavigation(role: UserRole): readonly SidebarNavItem[]`
  - Devuelve la lista exacta y en orden para cada rol.
  - No expone opciones de otros roles.
  - Cubre RF-6 a RF-11.

- `isNavigationItemEnabled(item: SidebarNavItem): boolean`
  - Verdadero solo para «Inicio» en esta versión.
  - Cubre RF-12 y RF-13.

- `normalizePathname(pathname: string): string`
  - Descarta query, fragmento y barra final; conserva la raíz.
  - Cubre RF-19.

- `isHrefActive(href: string | null, pathname: string): boolean`
  - Coincidencia exacta para el dashboard y por prefijo para módulos futuros.
  - Sin `href`, nunca activo.
  - Cubre RF-15 a RF-19 y RF-23.

- `getNavigationItemState(item, pathname)`
  - Prioriza `unavailable` si no está habilitado; luego `active` o `inactive`.
  - Cubre RF-13 a RF-18.

- `formatInitials(name: string, lastname: string): string | null`
  - Recorta, separa por espacios y toma el primer carácter del primer nombre y del último apellido.
  - Con una sola palabra usa sus dos primeros caracteres; con una sola letra devuelve esa letra.
  - Conserva acentos y mayúsculas; sin nombre devuelve `null`.
  - Cubre RF-42.

- `formatFullName(name: string, lastname: string): string`
  - Une las partes no vacías con un espacio y recorta el resultado.
  - Cubre RF-41.

- `getAccountAccessibleName(displayName?: string): string`
  - Devuelve «Cuenta de {nombre}» o «Cuenta».
  - Cubre RF-45.

- `toSidebarAccount(state: PrivateAccountState): SidebarAccountState`
  - `ok` con nombre y correo utilizable produce `ready`.
  - `forbidden` o `error` produce `unavailable`, sin inventar datos.
  - Cubre RF-43 a RF-45.

- `parseCollapsePreference(value: string | undefined): boolean`
  - Solo `"1"` es colapsado; todo lo demás es expandido.
  - Cubre RF-35 y RF-36.

- `serializeCollapsePreference(collapsed: boolean): string`
  - Devuelve `"1"` o `"0"`.
  - Cubre RF-35.

- `getInstitutionLabel(mode: SidebarMode, isWide: boolean): string`
  - Devuelve el nombre completo o abreviado según el estado; en colapso no hay texto visible.
  - Cubre RF-2 a RF-5.

- `getNavigationWidth(mode: SidebarMode): number`
  - 280 px expandido, 72 px colapsado, 320 px como base del drawer.
  - Cubre RF-40 y RNF-4.

## 4. Decisiones técnicas justificadas

### 4.1 Armazón privado en la página, no en un layout de ruta

Decisión: componer el menú y el contenido con `PrivateShell` desde la página del dashboard, y cargar la cuenta una sola vez en el servidor.

Alternativa descartada: un `layout.tsx` del segmento `/dashboard`. Se descarta porque también envolvería al 404 de `/dashboard/...`, contradiciendo RF-22, y porque obligaría a una suspensión adicional para el esqueleto.

Alternativa descartada: un proveedor cliente que consultara `/me` y compartiera los datos por contexto. Se descarta porque duplicaría la llamada, trasladaría la carga al cliente y rompería la pureza de `app/ui`.

Consecuencia: una sola solicitud a `/me` por render, 404 sin menú, rol tomado del token y estados `forbidden` y `error` manejados en el servidor. `PrivateShell` queda reutilizable para futuras rutas privadas. Cubre RF-6, RF-21, RF-22, RF-41 a RF-45, RF-52 y RNF-14.

### 4.2 `DashboardView` presentacional

Decisión: `DashboardView` deja de ser un Client Component que consulta datos y pasa a recibir el estado de cuenta.

Alternativa descartada: mantener la acción cliente y sumar otra consulta desde el menú. Se descarta por duplicación y por el principio de Server Components primero.

Consecuencia: el mensaje de error y el acceso denegado se siguen mostrando; el reintento se resuelve con un botón cliente que refresca el servidor. Cubre RF-45 y conserva RF-19 y RF-20 de la spec 008.

### 4.3 Preferencia de colapso en cookie legible

Decisión: guardar el colapso en una cookie no `httpOnly`, con un año de vigencia, para que el servidor renderice el estado inicial correcto.

Alternativa descartada: `localStorage` con aplicación en un efecto. Se descarta porque produce un salto visual y un posible desajuste de hidratación en el primer render.

Consecuencia: sin parpadeo y sin salto de layout; la cookie no contiene datos de cuenta ni token. Si está ausente o es inválida, el menú inicia expandido. Cubre RF-35, RF-36 y RNF-12.

### 4.4 Responsive por CSS y cierre del drawer por `matchMedia`

Decisión: las variantes de nombre, tamaño de logo, visibilidad del menú de escritorio y barra compacta se resuelven con los breakpoints `lg` y `xl` de Tailwind. JavaScript solo escucha el cambio de breakpoint para cerrar el drawer y el menú de cuenta.

Alternativa descartada: calcular el ancho en JavaScript y renderizar condicionalmente. Se descarta por desajuste de hidratación y por trabajo innecesario en cada resize.

Consecuencia: los cortes coinciden con 1024 y 1280 px; el colapso prevalece sobre el texto por ancho. Cubre RF-2 a RF-5, RF-25 a RF-27 y RF-37.

### 4.5 Drawer con `dialog` nativo

Decisión: usar `dialog` con `showModal` para el drawer.

Alternativa descartada: un contenedor posicionado con una trampa de foco manual. Se descarta por duplicar comportamiento que el navegador ya ofrece: foco contenido, Escape, fondo inerte y semántica modal.

Consecuencia: se mueve el foco al botón de cierre y se devuelve al abridor; se agrega bloqueo de scroll con compensación de barra y cierre por clic en el fondo. Cubre RF-27 a RF-31, RF-40 y RNF-18.

### 4.6 Opciones no disponibles enfocables

Decisión: renderizar las opciones no disponibles como enlaces con `aria-disabled`, `tabIndex` y descripción accesible, sin navegación.

Alternativa descartada: usar el atributo nativo `disabled` o quitarlas del orden de tabulación. Se descarta porque impediría anunciarlas y contradiría RF-13.

Consecuencia: se pueden descubrir con teclado, se anuncian como no disponibles y no cambian la ruta. Cubre RF-13, RF-14 y RF-17.

### 4.7 Iconos existentes y cinco iconos nuevos

Decisión: reutilizar los iconos institucionales disponibles y agregar cinco archivos descriptivos en `public/icons`.

Alternativa descartada: dibujar todos los iconos inline. Se descarta para mantener la iconografía existente y evitar duplicar trazos.

Consecuencia: se cumple el principio de assets y se conserva el estilo. Ver sección 2.7. Cubre RNF-20.

### 4.8 Sin dependencias nuevas

Decisión: resolver el menú, el tooltip, el colapso y el drawer con React, Tailwind y APIs del navegador.

Alternativa descartada: incorporar una biblioteca de menús o de foco. Se descarta por la restricción de dependencias y porque el alcance es acotado.

Consecuencia: se usan `dialog`, `matchMedia`, `usePathname`, `useId` y `useRef`. Cubre RNF-10.

### 4.9 Estados de sesión y cuenta preservados

Decisión: `401` borra la cookie y redirige con el aviso de sesión vencida; `403` muestra acceso denegado y conserva la sesión; un fallo de red muestra el pie degradado y el reintento.

Alternativa descartada: tratar cualquier fallo como sesión vencida. Se descarta porque la spec 008 distingue los casos y la 009 los conserva.

Consecuencia: el menú desaparece solo cuando la sesión deja de ser válida; en error de cuenta se mantiene con datos degradados. Cubre RF-45 y RF-52.

## 5. Estrategia de tests

### 5.1 Unitarios con el runner nativo

Comando: `node --experimental-strip-types --test`.

- `tests/sidebar/navigation.test.ts`
  - Las tres listas coinciden en contenido y orden.
  - Solo «Inicio» está habilitado.
  - No hay opciones repetidas ni de otros roles.
  - `normalizePathname` cubre barra final, query y fragmento.
  - `isHrefActive` cubre dashboard, raíz, subpantallas futuras y rutas ajenas.
  - `getNavigationItemState` devuelve `unavailable` antes que `active`.
- `tests/sidebar/account.test.ts`
  - Iniciales con dos palabras, nombre compuesto, un apellido, una sola palabra, una letra, acentos, espacios y valores vacíos.
  - Nombre completo con y sin apellido.
  - Nombre accesible con y sin nombre.
  - `toSidebarAccount` para `ok`, `forbidden` y `error`.
- `tests/sidebar/collapse-preference.test.ts`
  - `"1"` es colapsado; `"0"`, vacío, texto y valores extraños son expandido.
  - Serialización estable.
- `tests/sidebar/icons.test.ts`
  - Todas las claves tienen archivo declarado.
  - No hay claves duplicadas.
- `tests/dashboard/private-account.test.ts`
  - Mapeo de estados sin red, con dobles tipados.

### 5.2 Integración y E2E

Herramientas: `next dev` con `LARAVEL_API_URL` apuntando a un mock en `:8000` y Playwright en modo headless. Sin dependencias nuevas.

Escenarios:

- Identidad: 1024, 1279, 1280 y 1440 px; nombre abreviado, completo, logo de 24 y 32 px; drawer con nombre abreviado; colapso con solo logo.
- Roles: sesión de tutor, administrativo y administrador; cada uno ve su lista exacta y ninguna opción ajena.
- Opciones: «Inicio» habilitado; el resto con «Próximamente»; foco, anuncio y ausencia de navegación con clic, Enter y Espacio.
- Estado activo: «Inicio» al entrar; barra final, query y fragmento; pantalla sin módulo sin resaltado.
- Navegación: clic en Inicio; URL desconocida con 404 sin menú; atrás y adelante cierran el drawer.
- Pie: iniciales, nombre y correo; recorte con elipsis y nombre accesible; colapso con solo avatar y datos en el menú de cuenta.
- Carga y error: mock lento para observar el esqueleto; `/me` con red, timeout, `500`, cuerpo inválido y `403`; sesión `401` redirigida y cookie eliminada.
- Cuenta: apertura y cierre con teclado; configuración no disponible; cierre de sesión; doble activación; servicio de logout caído.
- Colapso: control, anchos de 280 y 72 px, iconos, tooltip con hover y foco, persistencia tras recarga y tras cerrar sesión, cookie inválida y cookie ausente.
- Drawer: apertura desde 320, 375, 768 y 1023 px; cierre con botón, Escape y fondo; el fondo no recibe el clic; foco atrapado y devuelto; scroll interno en 320 por 480; bloqueo de scroll sin salto; Inicio navega y cierra.
- Resize: drawer a escritorio, escritorio a móvil, colapso conservado, menú de cuenta cerrado.
- Accesibilidad: árbol AX, nombres, `aria-current`, `aria-disabled`, descripciones, foco visible, contraste de 4.5:1 y 3:1, colores forzados, movimiento reducido y texto al 200 %.
- Responsive: 320, 375, 768, 1023, 1024, 1279, 1280, 1440 y 1920 px sin desbordamiento ni solapamiento.
- Privacidad: token ausente de HTML, URL, consola y almacenamiento; cookie de colapso solo con `"0"` o `"1"`; sin datos de cuenta en la preferencia.
- Regresión de la spec 008: login, dashboard, `401`, `403`, cierre de sesión y redirección de `/login`.

### 5.3 Verificación estática y build

- `pnpm exec tsc --noEmit`.
- `pnpm lint`.
- `pnpm build`.
- Revisión de que no se agregaron dependencias en `package.json`.

## 6. Cobertura de requisitos

| Requisitos | Cobertura principal |
|---|---|
| RF-1 a RF-5 | `navigation` y `account` unitarios; E2E de identidad en 1024, 1279, 1280, 1440, drawer y colapso |
| RF-6 a RF-14 | `navigation.test`; E2E de roles, orden, opciones ajenas, no disponibles, foco y activación |
| RF-15 a RF-19 | `navigation.test` de ruta activa; E2E de Inicio, URL con query, barra final, fragmento y sin coincidencia |
| RF-20 a RF-24 | E2E de Inicio, 404, atrás y adelante, cierre del drawer al navegar |
| RF-25 a RF-40 | E2E de escritorio, barra compacta, drawer, colapso, persistencia, resize, tooltip, campana y scroll |
| RF-41 a RF-47 | `account.test`; E2E de iniciales, nombre, correo, carga, error, recorte y colapso |
| RF-48 a RF-51 | E2E del menú de cuenta, configuración, cierre de sesión y doble activación |
| RF-52 a RF-54 | E2E de sesión vencida, privacidad del token y revisión de los valores de rol |
| RNF-1 a RNF-3 | Playwright con árbol AX, teclado, contraste y colores forzados |
| RNF-4 a RNF-6 | Playwright en 320 a 1920 px, texto al 200 % y medición de posición |
| RNF-7 a RNF-9 | Revisión visual, textos y pruebas de autorización del servicio |
| RNF-10 | Revisión de `package.json` |
| RNF-11 | E2E de los tres roles sobre el mismo menú |
| RNF-12 | Prueba de cookie de colapso sin datos de cuenta |
| RNF-13 | E2E de nombre completo accesible y visible según el estado |
| RNF-14 | E2E de carga única de `/me` y revisión de caché |
| RNF-15 a RNF-17 | Revisión de nitidez, colores forzados y movimiento reducido |
| RNF-18 a RNF-19 | E2E de foco atrapado y tooltip dentro del viewport |
| RNF-20 | `icons.test` y revisión de assets |
| RF-1 a RF-54 (sin excepción) | La matriz es exhaustiva y sus rangos son inclusivos: la validación final recorre la lista completa de la spec y confirma que cada RF tiene al menos una prueba o una verificación asociada. |

## 7. Riesgos y dependencias

- Refactor de la carga del dashboard: puede alterar `401`, `403` o el reintento de la spec 008. Mitigación: pruebas de regresión y conservación de mensajes y redirecciones.
- Redirecciones del servidor: `verifySession` y el `401` deben redirigir antes de renderizar el menú. Mitigación: probar sesión ausente, vencida y `401`.
- `dialog` nativo: la apertura solo puede ocurrir después del montaje. Mitigación: efecto controlado, sin renderizado modal en el servidor.
- Cookie de colapso: un navegador que la bloquea debe degradar a expandido. Mitigación: escritura tolerante a fallos y lectura con valor por defecto.
- Iconos SVG y `next/image`: los archivos deben tener color y tamaño coherentes. Mitigación: assets de 24 por 24 y revisión visual.
- Foco y scroll en 320 px con texto al 200 %: el drawer debe desplazar su interior. Mitigación: prueba específica de altura reducida.
- Texto largo de institución, nombre o correo: puede desbordar. Mitigación: variantes por breakpoint, elipsis y nombres accesibles.
- Cambio de la barra superior: puede afectar el relleno del contenido del dashboard. Mitigación: prueba en 320 a 1920 px y revisión de la posición del contenido.
- Sin dependencias nuevas: cualquier necesidad de foco o menú se resuelve con APIs nativas.
- Dependencia del contrato de `/me` y del token: no se modifica; si el backend cambia, la spec 008 debe actualizarse primero.

## 8. Verificación final

- `pnpm exec tsc --noEmit` sin errores.
- `pnpm lint` sin errores nuevos.
- `pnpm build` en verde.
- Suite unitaria completa en verde.
- E2E de escritorio, tablet y móvil en verde.
- Accesibilidad, contraste, colores forzados, movimiento reducido y texto al 200 % verificados.
- Sin desbordamiento entre 320 y 1920 px.
- Token no expuesto y preferencia sin datos de cuenta.
- Spec 008 sin contradicciones documentales.
- `MEMORY.md` actualizado con las tareas y la verificación.

## 9. Dudas abiertas que afectan al plan

- Ninguna. La spec 009 está aprobada y sus decisiones cerradas.

## 10. Orden de implementación sugerido para `tasks.md`

1. Lógica pura de navegación, cuenta, iniciales, institución y preferencia, con sus tests.
2. Carga de cuenta en el servidor y refactor de la página y la vista del dashboard.
3. Armazón privado y esqueleto de carga.
4. Cabecera del menú, navegación, estado activo y opciones no disponibles.
5. Pie de cuenta y menú de cuenta.
6. Colapso de escritorio y persistencia.
7. Barra compacta y drawer con foco, Escape, fondo y scroll.
8. Carga, error y ajustes de contenido del dashboard.
9. Iconos y assets.
10. E2E de roles, responsive, accesibilidad y privacidad.
11. Verificación final, documentación y `MEMORY.md`.
