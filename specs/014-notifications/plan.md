# Plan 014 — Módulo de Notificaciones

Estado: implementado (2026-11-19b)
Spec: `specs/014-notifications/spec.md` (implementada 2026-11-19b)
Gobernanza: `docs/constitution.md`, `AGENTS.md`, skill `sdd`

## 1. Alcance y restricciones

- Implementar únicamente lo que exige la spec 014: bandeja propia, detalle en modal, lectura automática, descarga de adjuntos, creación de notificaciones y badge del menú lateral.
- No se modifica el backend ni se inventan endpoints. Se consumen exclusivamente:

| Uso | Método y ruta |
|-----|----------------|
| Bandeja y conteo | `GET /api/notifications` |
| Marcar leída | `PATCH /api/notifications/{notificationId}/read` |
| Descargar adjunto | `GET /api/notifications/{notificationId}/attachment` |
| Enviar | `POST /api/notifications` |
| Selector de curso | `GET /api/courses` |
| Buscador de tutores | `GET /api/users` |

- Sin dependencias nuevas. Se reutilizan `CourseDialog`, `RetryButton`, tokens de diseño, `listAllCourses`, `listUsersPage`, `getEffectiveRole`, `getPrivateAccount`, `getSessionToken` y el icono existente `/icons/ico-bell.svg`.
- Rutas nuevas: `/dashboard/notifications` (bandeja). El detalle es un modal; no hay ruta de detalle.
- Capas: rutas en `app/dashboard/notifications`, red en `app/lib/api`, lógica/acciones en `app/lib`, UI pura en `app/ui`.

## 2. Decisiones técnicas

**D1. Badge del menú sin refactor del armazón.**
El menú lateral es un componente cliente renderizado por cada página; no existe un layout de `/dashboard`. El badge se obtiene desde un hook cliente que invoca una Server Action (`getNotificationBadgeAction`) al montar y al cambiar de ruta, y escucha un evento interno para refrescarse tras leer o enviar. Ante `401/403/5xx`, red o respuesta inválida devuelve `null`; si falla un refresco posterior, el hook oculta el badge hasta la próxima consulta exitosa (RF-89, RF-118).
- Descartado: crear `app/dashboard/layout.tsx` y quitar `PrivateShell` de todas las páginas. Es la solución más limpia, pero refactoriza módulos ajenos y contradice RF-11/RNF-11 y el alcance de la spec.
- Descartado: `fetch` directo desde la UI; viola el principio 4 (UI sin HTTP).

**D2. Límite de subida de Server Actions.**
Next 16 limita el cuerpo de una Server Action a 1 MB por defecto; un adjunto de 5.000.000 bytes no cabría. Se configura `experimental.serverActions.bodySizeLimit: "6mb"` en `next.config.ts` (5 MB + sobre multipart, con margen según la documentación instalada).
- Descartado: Route Handler de subida; agrega una superficie autenticada paralela y duplica la capa de red.

**D3. Descarga de adjuntos mediante Server Action y base64.**
Se reutiliza el patrón del formulario PDF: la acción autenticada devuelve `base64`, `filename` y `contentType`; la UI crea un Blob y dispara la descarga. Permite distinguir `401`, `403` y `404` sin exponer el token ni la URL protegida.
- Descartado: enlace directo a `attachmentUrl`; el navegador no adjunta el Bearer y se perdería el manejo tipado de errores.
- Descartado: Route Handler de streaming; eficiente en memoria, pero duplica autenticación y no aporta al alcance.

**D4. Cursos y tutores bajo demanda, con filtrado local por tecla.**
Cursos: al abrir el modal, una acción guardada recorre todas las páginas de `GET /api/courses` con tope, filtra el año lectivo vigente, ordena y devuelve la lista completa; el selector filtra localmente en cada tecla y muestra hasta cuatro coincidencias.
Tutores: la API de usuarios no expone filtro por rol. Una acción carga el directorio completo de tutores al abrir el selector (tope de seguridad) y la interfaz filtra localmente por nombre, apellido, DNI, CUIL o correo en cada tecla, mostrando hasta cuatro coincidencias.
- Descartado: consultar al servicio en cada tecla; agrega latencia, carrera de respuestas y carga innecesaria.
- Descartado: paginar tutores; el nuevo requisito pide una lista corta con filtro.
- Descartado: enviar un parámetro de rol no documentado por el servicio.

**D5. Un solo modal con confirmación interna.**
El alta usa `CourseDialog` y un estado `form | confirm`. La confirmación reemplaza el contenido del modal (sin modal anidado). El descarte de un borrador usa una confirmación en línea, también sin anidar.
- Descartado: dos modales superpuestos; complica foco, Escape y accesibilidad.

**D6. Lectura no optimista.**
El estado no leído se mantiene hasta que el PATCH responde; se muestra «Marcando como leída…». La fecha que prevalece es la del servicio. Si falla la red, se conserva el estado y se reintenta al reabrir. Cerrar durante la lectura está permitido: la vista permanece montada y, al llegar la respuesta, actualiza lista y badge sin reabrir (RF-96, RF-97).
- Descartado: actualización optimista; el rollback y el conteo negativo no son verificables con claridad.

**D7. Fecha con el offset del servicio.**
`formatNotificationDate` extrae los componentes de pared del ISO (`YYYY-MM-DDTHH:mm`) y los presenta como `dd/mm/aaaa HH:mm`, sin convertirlos de zona.
- Descartado: `Intl.DateTimeFormat` convirtiendo a la zona del servidor de Next; alteraría la hora de pared del offset informado.

**D8. Red y errores explícitos.**
Se sigue el patrón de los módulos existentes: `fetch` con `Authorization`, `cache: "no-store"`, `redirect: "manual"`, timeout por `AbortSignal`, y parsers puros que devuelven uniones discriminadas. No se usa `app/lib/api-client.ts` porque lanza excepciones, descarta el mapa de `errors` de `422` y no soporta respuestas binarias.
- Timeouts: lecturas 10 s; adjunto 20 s; envío 30 s (RNF-7).
- Taxonomía: `401` sesión; `403` permiso o recurso; `404` recurso; `413` tamaño; `422` validación; `5xx` y otros 4xx error del servicio con datos conservados; red o timeout en envío = incierto (RF-110 a RF-114).

**D9. Evento interno de refresco del badge.**
`badge-events.ts` expone el nombre del evento, un emisor y un suscriptor con `EventTarget` inyectable. Tras una lectura o un envío exitoso, la vista emite el evento; el hook recalcula el conteo. Tras un envío exitoso además se ejecuta `router.refresh()`.
- Descartado: polling o tiempo real; fuera de alcance y sin endpoint de conteo.

**D10. Reutilización de `CourseDialog`.**
Se agrega la prop opcional `closeOnBackdrop` (por defecto `false`) y una variante de ancho `wide` (por defecto, el tamaño actual). El alta usa `wide` para cumplir RF-129; el resto de los diálogos conserva su ancho. El cierre por fondo exige que la presión y la liberación del puntero ocurran sobre el diálogo, para no cerrar al arrastrar una selección (RF-43, RF-98, RF-129).
- Descartado: un diálogo propio; duplicaría foco atrapado, Escape y retorno de foco.
- Descartado: activar el cierre por fondo o el ancho amplio en todos los diálogos; alteraría módulos ajenos.

**D11. Badge solo cliente, sin SSR.**
El conteo aparece tras la hidratación. Se acepta para no tocar las páginas; en la bandeja puede implicar una segunda consulta (página + badge).
- Descartado: pasar el conteo por props desde cada página; obligaría a modificar todas las rutas.

**D12. Campana móvil retirada.**
RF-8 prohíbe otro indicador fuera del menú. Se elimina el uso y el archivo `notification-bell.tsx`; la barra compacta conserva hamburguesa y logo con un espaciador para no descuadrar el centrado. El icono del menú usa `/icons/ico-bell.svg`, ya existente (no hay imágenes nuevas).

**D13. Título normalizado y contado por puntos de código.**
Un módulo puro recorta espacios, tabulaciones y saltos de los extremos, cuenta con `Array.from` y rechaza el valor recortado de más de 80. Al pegar, si el valor recortado excede el límite, se conserva el valor anterior y se informa; no se trunca en silencio. El envío usa el título recortado (RF-63, RF-64, RF-105).
- Descartado: `maxLength` nativo; cuenta unidades UTF-16 y trunca al pegar sin aviso.

**D14. Adjunto: extensión, MIME declarado y reemplazo.**
La validación cliente acepta MIME vacío si la extensión es válida, exige coincidencia cuando el MIME viene informado, rechaza cero bytes y conserva el archivo válido anterior ante un reemplazo inválido. Un archivo válido nuevo reemplaza al anterior; el mismo archivo no se duplica (RF-67, RF-69, RF-106).
- Descartado: validar solo MIME; navegadores informan cadenas inconsistentes o vacías.

**D15. Descarga robusta.**
Nombre desde `Content-Disposition` (incluido `filename*`), limpiando separadores de ruta; si falta, «adjunto». Botón deshabilitado mientras descarga; clics repetidos ignorados; `5xx` u otros errores muestran aviso sin cerrar el detalle (RF-108, RF-109).

**D16. Navegación y rol.**
Un evento de cierre al cambiar de ruta o `popstate` cierra los modales sin enviar y descarta el borrador (RF-115). El hook del badge depende de la ruta, por lo que un cambio de rol se refleja en la siguiente consulta; la página revalida el acceso (RF-116).

**D17. Cursos del año vigente.**
La acción recorre todas las páginas con tope, deduplica por `id`, filtra el año de `new Date().getFullYear()` (inyectable para tests) y ordena por año de cursada, división y turno. La etiqueta de curso es propia del módulo y marca «Inactivo» (RF-49, RF-103). El selector filtra localmente sobre esta lista en cada tecla (RF-119 a RF-122).
- Descartado: ordenar por un campo `name` inexistente en el recurso.

**D18. Tutor: directorio completo, filtro local y máximo cuatro.**
Una acción carga todo el directorio de tutores al abrir el selector, recorriendo páginas con tope y filtrando `TUTOR`. La interfaz normaliza mayúsculas y acentos y filtra por nombre, apellido, DNI, CUIL o correo en cada tecla; ordena por apellido y nombre y muestra hasta cuatro coincidencias con el total. El backend documenta `first_name`, `last_name` y `email`; DNI/CUIL se filtran en cliente. No hay paginación.
- Descartado: búsqueda por tecla contra el servicio; multiplica solicitudes y obliga a resolver carreras.
- Descartado: mantener los cinco campos y el botón «Buscar»; el requisito pide una línea de búsqueda con lupa.

## 3. Archivos a crear

| Archivo | Responsabilidad | RF |
|---------|-----------------|----|
| `app/lib/notifications/types.ts` | Tipos del dominio, filtros, audiencias, resultados, estados de acciones y errores por campo. | 16–18, 31–33, 62–83 |
| `app/lib/notifications/access.ts` | Roles lectores (`TUTOR`, `ADMINISTRATIVO`, `ADMINISTRADOR`) y emisores (`ADMINISTRATIVO`, `ADMINISTRADOR`). | 1, 9–15, 84–87 |
| `app/lib/notifications/guard-decision.ts` | Mensajes en español y decisiones de acceso por cuenta/rol/sección. | 9–15 |
| `app/lib/notifications/guard.ts` | Acceso de página y de acciones con token; redirección a sesión vencida. | 9–15, 33, 37, 42, 66, 77 |
| `app/lib/notifications/labels.ts` | Textos, fechas, resumen, badge, etiquetas de audiencia, curso y tutor. | 3–5, 15, 19, 20, 56 |
| `app/lib/notifications/rules.ts` | Orden, filtros, conteo, badge, lectura aplicada, foco, criterios/paginación de tutores, cursos del año y borrador. | 3–8, 18–24, 33–35, 44–45, 49, 53–59, 64–65 |
| `app/lib/validation/notifications.ts` | Validación de título, contenido, adjunto y mapa/traducción de errores `422`. | 63–69, 80 |
| `app/lib/notifications/action-core.ts` | Núcleos testeables de badge, lectura, descarga, envío, cursos y búsqueda de tutores con dependencias inyectadas. | 6, 28, 33–42, 49–61, 66–82 |
| `app/lib/notifications/data.ts` | Cargas memoizadas por render: bandeja, cursos del año, tutores y conteo. | 16, 49, 53–55 |
| `app/lib/notifications/badge-events.ts` | Evento de refresco del badge con `EventTarget` inyectable. | 6, 76 |
| `app/lib/api/notifications.ts` | Red centralizada, parsers y errores de los cuatro endpoints; JSON o multipart según adjunto; nombre desde `Content-Disposition`. | 16–45, 62–81, 84–86 |
| `app/lib/actions/notifications.ts` | Server Actions: badge, lectura, descarga, envío, cursos y búsqueda de tutores. | 6, 10, 14, 28, 33–42, 49–61, 66–82 |
| `app/dashboard/notifications/page.tsx` | Ruta de la bandeja: guardia, carga inicial, metadata y shell. | 9–16, 84–87 |
| `app/dashboard/notifications/loading.tsx` | Estado de carga del segmento. | 26, RNF-13 |
| `app/dashboard/notifications/error.tsx` | Límite de error del segmento con reintento y vuelta al inicio. | 27, RNF-13 |
| `app/ui/notifications/notifications-view.tsx` | Orquestador cliente: filtro, lista, detalle, alta, avisos y evento de badge. | 17–45, 62–83 |
| `app/ui/notifications/notifications-header.tsx` | Título y botón «Crear notificación» según rol. | 13, 14 |
| `app/ui/notifications/notification-filters.tsx` | Filtros «Todas» y «No leídas» con estado persistente. | 21–24 |
| `app/ui/notifications/notification-list.tsx` | Listado: título, resumen, fecha, estado textual y adjunto; foco por fila. | 17–20, 26, 29 |
| `app/ui/notifications/notification-states.tsx` | Vacíos, error, acceso denegado y reintento. | 23–28 |
| `app/ui/notifications/notification-notice.tsx` | Aviso de resultado con región viva. | 30, 65, 76, 80 |
| `app/ui/notifications/notification-detail-dialog.tsx` | Detalle, lectura, descarga, cierre y foco. | 31–45 |
| `app/ui/notifications/create-notification-dialog.tsx` | Estados del alta, confirmación, descarte y errores; modal amplio. | 46–83, 129 |
| `app/ui/notifications/audience-selector.tsx` | Tres audiencias con descripción y cambio sin perder la redacción. | 40, 47–48, 59–60 |
| `app/ui/notifications/course-selector.tsx` | Combobox de curso con lupa, filtro por tecla, máximo cuatro y teclado. | 42, 49–52, 119–122, 127–129 |
| `app/ui/notifications/tutor-selector.tsx` | Combobox de tutor con lupa, filtro por tecla, máximo cuatro y teclado. | 46–57, 123–128, 130 |
| `app/ui/notifications/notification-composer.tsx` | Título, contenido, adjunto, límites y validaciones. | 62–70 |
| `app/ui/notifications/send-confirmation.tsx` | Resumen, cancelación, envío, error incierto y reintento advertido. | 71–82 |
| `app/ui/sidebar/notification-badge.tsx` | Badge numérico visual y variante contraída. | 3–5 |
| `app/ui/sidebar/use-unread-notifications.ts` | Hook cliente: acción de conteo, cambio de ruta y evento. | 1, 6–8 |
| `tests/api/notifications.test.ts` | Parsers, peticiones, multipart/JSON, binarios y errores. | 16–45, 62–81 |
| `tests/api/tutors.test.ts` | Directorio completo de tutores: recorrido, rol y filtro local por DNI/CUIL. | 53–56, 124 |
| `tests/validation/notifications.test.ts` | Validaciones y mapeo de `422`. | 63–69, 80 |
| `tests/notifications/rules.test.ts` | Orden, filtros, badge, lectura, foco, normalización y filtrado de tutores/cursos. | 3–8, 18–24, 33–35, 44–45, 49–59, 119–126 |
| `tests/notifications/labels.test.ts` | Fechas con offset, resumen, etiquetas y accesibilidad. | 5, 15, 19–20, 56 |
| `tests/notifications/guard.test.ts` | Roles lectores/emisores y decisiones. | 9–15 |
| `tests/actions/notifications.test.ts` | Núcleos de acciones con dependencias simuladas. | 6, 28, 33–42, 49–61, 66–82 |

## 4. Archivos a modificar

| Archivo | Cambio | RF |
|---------|--------|----|
| `app/lib/sidebar/types.ts` | Clave de icono `notification` y campo opcional `badge` en la opción. | 1–5 |
| `app/lib/sidebar/icons.ts` | Mapear `notification` a `/icons/ico-bell.svg`. | 1 |
| `app/lib/sidebar/navigation.ts` | `NOTIFICATIONS_PATH`, ítem con campana y función pura `withNotificationBadge`. | 1–3, 8 |
| `app/ui/sidebar/sidebar.tsx` | Usar el hook de conteo, inyectar el badge en las opciones y pasarlo al drawer. | 1–8 |
| `app/ui/sidebar/sidebar-nav.tsx` | Render del badge expandido/contraído y nombre accesible con la cantidad. | 3–5 |
| `app/ui/sidebar/mobile-top-bar.tsx` | Quitar la campana decorativa y conservar el centrado con un espaciador. | 8 |
| `app/ui/sidebar/sidebar-header.tsx` | Quitar el import sin uso de `NotificationBell`. | 8, RNF-11 |
| `app/ui/courses/course-dialog.tsx` | Prop opcional `closeOnBackdrop` y variante de ancho `wide` (por defecto no cambia nada). | 43, 129 |
| `app/lib/api/users.ts` | `listAllTutors` con recorrido completo, tope y filtro `TUTOR`; sirve el directorio del selector. | 53–57, 124 |
| `next.config.ts` | `experimental.serverActions.bodySizeLimit: "6mb"`. | 67–69 |
| `tests/sidebar/navigation.test.ts` | Nuevo orden, ítem habilitado y badge inyectado. | 1–8 |
| `tests/sidebar/icons.test.ts` | Clave `notification` y ruta existente. | 1 |
| `tests/api/users.test.ts` | `listAllTutors`: criterios, filtro, tope y fallo sin parciales. | 53–57 |
| `MEMORY.md` | Estado del plan al cerrar la fase. | — |

**Eliminar:** `app/ui/sidebar/notification-bell.tsx` (queda sin uso con la nueva campana del menú).

## 5. Funciones de lógica pura

**`app/lib/notifications/rules.ts`**
- `withNotificationBadge(items, count)` — clona las opciones y asigna el badge solo a Notificaciones (RF-1, RF-3, RF-8).
- `countUnreadNotifications(items)` — cantidad de `isRead === false` (RF-3, RF-6).
- `formatUnreadBadge(count)` — `null` en 0, número 1–99, `"99+"` desde 100 (RF-3, CL-1–CL-4).
- `sortNotificationsNewestFirst(items)` — descendente por `sentAt`, desempate ascendente por `id` (RF-18, RF-94).
- `resolveNotificationListState(items, filter)` — vacío de bandeja, vacío de no leídas o lista visible (RF-25, RF-95).
- `filterNotifications(items, filter)` — todas o no leídas (RF-21–RF-24).
- `summarizeNotificationContent(content, max)` — colapsa blancos, recorta a 140 puntos de código y agrega «…» solo al recortar (RF-20, RF-92).
- `buildNotificationRowLabel(item)` — nombre accesible con título, estado, fecha y adjunto (RF-92).
- `applyNotificationRead(items, updated)` — reemplaza la notificación por la del servicio (RF-33–RF-35).
- `resolveCloseAfterRead(items, filter, id)` — devuelve la lista sin el elemento leído y el id que debe recibir el foco (RF-44–RF-45, RF-96, CL-11, CL-39).
- `normalizeSearchText(value)` — minúsculas y sin diacríticos, para comparar RF-120 y RF-124.
- `filterCoursesByQuery(courses, query)` — coincidencias por etiqueta, código, año, división, ciclo, especialidad, turno y estado (RF-120, CL-61).
- `filterTutorsByQuery(users, query)` — coincidencias parciales por nombre, apellido, DNI, CUIL o correo (RF-124, CL-65, CL-66).
- `sortTutorsByName(users)` — orden por apellido y nombre con texto normalizado (RF-126).
- `limitSearchResults(items, max)` — máximo cuatro coincidencias y total (RF-122, RF-126).
- `selectCurrentYearCourses(courses, year)` — filtra el año vigente, deduplica por id y ordena (RF-49, RF-103, CL-46).
- `buildNotificationCourseLabel(course)` — etiqueta legible que marca «Inactivo» (RF-103).
- `hasNotificationDraft(input)` — determina si hay datos para confirmar descarte (RF-82, CL-36).
- `resolveSendFailure(result)` — traduce el resultado del servicio al paso y a los mensajes de la UI (RF-110–RF-114).

**`app/lib/validation/notifications.ts`**
- `normalizeNotificationTitle(value)` — recorta espacios, tabs y saltos; cuenta puntos de código; devuelve valor recortado y longitud (RF-63, RF-105).
- `validateNotificationTitle(value)` — exige 1–80 puntos de código sobre el valor recortado (RF-63, RF-64, CL-25, CL-48).
- `validateNotificationContent(value)` — exige al menos un carácter no blanco, sin máximo (RF-65, CL-26).
- `validateNotificationAttachment(fileMeta)` — extensión sin distinguir mayúsculas, MIME vacío permitido si la extensión es válida y coincidente si viene informado, tamaño mayor que 0 y ≤ 5.000.000, no duplica el mismo archivo (RF-67–RF-69, RF-106, CL-13–CL-17, CL-49–CL-50).
- `formatNotificationFileSize(bytes)` — megabytes con un decimal (RF-107).
- `buildNotificationPayload(input)` — audiencia válida y solo `recipientId` o `courseId` según corresponda (RF-73–RF-74).
- `mapNotificationFieldErrors(value)` y `translateNotificationFieldErrors(errors)` — claves `title`, `content`, `recipientId`, `courseId`, `attachment`, `recipients`; mensajes del servicio en español, desconocidos a aviso general (RF-80, RF-113).

**`app/lib/notifications/labels.ts`**
- `formatNotificationDate(value)` — `dd/mm/aaaa HH:mm` desde el ISO con su offset, sin conversión; ignora segundos y fracciones; inválido o vacío → «No disponible» (RF-19, RF-93, RNF-8, CL-58).
- `buildNotificationMenuLabel(count)` — «Notificaciones, N sin leer», «Notificaciones, no hay notificaciones sin leer» o «Notificaciones» sin conteo (RF-91, CL-38).
- `getAudienceLabel(audience)` — «Un tutor», «Por curso», «Todos los tutores» (RF-40, RF-47).
- `buildTutorOptionLabel(user)` — «Apellido, Nombre — DNI/Correo/Sin datos de contacto» (RF-56).
- `parseContentDispositionFilename(header)` — nombre provisto por el servicio, incluido `filename*` (RF-40, RF-108).
- `sanitizeAttachmentFilename(name)` — quita separadores de ruta y usa «adjunto» si queda vacío (RF-108).
- `truncateVisualFilename(name, max)` — 60 caracteres con «…», conservando el nombre completo aparte (RF-107, CL-28).

## 6. Capa de datos, red y acciones

**`app/lib/api/notifications.ts`**
- `listNotifications(token, options)` → `GET /api/notifications`; parsea `{ data }` y valida cada recurso, incluidos ids únicos, coherencia de `attachmentUrl` y fechas válidas; cualquier violación invalida la respuesta (RF-16–RF-28, RF-117).
- `markNotificationRead(token, id, options)` → `PATCH /api/notifications/{notificationId}/read`; `200` actualiza, `403`/`404` como recurso no disponible, otros errores como fallo de servicio (RF-33–RF-38, RF-97).
- `downloadNotificationAttachment(token, id, options)` → `GET /api/notifications/{notificationId}/attachment`; devuelve el blob, `Content-Type` y el nombre desde `Content-Disposition`; `401/403/404` tipados y `5xx` como fallo de descarga (RF-39–RF-42, RF-108, RF-109).
- `sendNotification(token, input, options)` → `POST /api/notifications`; JSON sin adjunto y `FormData` con adjunto, sin fijar `Content-Type` manualmente; considera exitoso cualquier `2xx`, mapea `413` y `5xx`/otros y usa `uncertain` solo para red o timeout (RF-73–RF-74, RF-110–RF-114, RNF-14).
- Parsers exportados: `parseNotificationListResponse`, `parseNotificationReadResponse`, `parseNotificationSendResponse`, `parseNotificationAttachmentResponse`.
- Constantes de timeout y tope de páginas.

**`app/lib/notifications/data.ts`** (memoizado con `cache` por render)
- `getNotificationsData(token)` (RF-16).
- `getNotificationCoursesData(token, year)` usando `listAllCourses` (RF-49).
- `getNotificationTutorsData(token)` usando `listAllTutors` con filtros vacíos: devuelve el directorio de tutores (RF-53–RF-56, RF-124).
- `getNotificationBadgeCount(token)` con la misma lista (RF-3, RF-6–RF-7).

**`app/lib/notifications/guard.ts`**
- `getNotificationPageAccess()`: cuenta privada, lectura permitida a los tres roles, token, estados `ok | forbidden | error` (RF-9–RF-15).
- `getNotificationReaderActionAccess()` y `getNotificationSenderActionAccess()`: guardias de acciones; un rol sin permiso no llama al servicio (RF-10–RF-15, RF-84–RF-87).
- `getNotificationBadgeAccess()`: solo token; `null` ante ausencia de sesión, sin redirigir (RF-118).

**`app/lib/actions/notifications.ts`**
- `getNotificationBadgeAction()`: solo token; devuelve número o `null`; nunca redirige; la falla oculta el badge (RF-88, RF-89, RF-118).
- `markNotificationReadAction(id)`: `401` redirige; éxito devuelve recurso; `403/404` mensaje «no disponible»; otros errores conservan el detalle (RF-33–RF-38, RF-96, RF-97).
- `downloadNotificationAttachmentAction(id)`: base64, nombre saneado y tipo; `401` redirige; `403/404` mensaje; `5xx` fallo de descarga (RF-39–RF-42, RF-108, RF-109).
- `sendNotificationAction(previousState, formData)`: valida en servidor, envía, revalida `"/dashboard/notifications"` y `"/dashboard"`; mapea `404` individual, `413`, `422`, `5xx` y `uncertain` (RF-62–RF-83, RF-104, RF-110–RF-114).
- `loadNotificationCoursesAction()` y `loadNotificationTutorsAction()`: guardia de emisor y resultados tipados; `401` redirige, `403` deniega el paso y el resto se informa (RF-49–RF-61, RF-123–RF-130).
- Toda acción pasa por `action-core.ts` con dependencias inyectables para pruebas.

## 7. Comportamiento de la interfaz

**Bandeja (`/dashboard/notifications`)**
- Carga en servidor; estado de carga y error por segmento; `403` de cuenta o bandeja muestra acceso denegado sin datos (RF-9–RF-16, RF-26–RF-28).
- Filtros «Todas»/«No leídas», visibles desde el inicio y persistentes durante carga/error/reintento; vacíos diferenciados y reinicio a «Todas» al reingresar (RF-21–RF-25, RF-95).
- Filas con título, resumen de 140, fecha, «Leída»/«No leída» y adjunto; orden estable por id; texto plano (RF-17–RF-20, RF-29–RF-30, RF-92–RF-94).
- Sin controles de búsqueda, orden ni paginación (RF-30).

**Detalle**
- `CourseDialog` con foco atrapado, Escape, cierre por botón y por fondo solo si presión y liberación ocurren allí; foco devuelto al disparador (RF-43–RF-44, RF-98, RNF-2).
- Contenido completo, estado y fechas; lectura pendiente, cierre permitido y respuesta posterior aplicada sin reabrir; fecha del servicio (RF-31–RF-38, RF-96).
- `403/404` de lectura mantiene el detalle y la lista sin cambios (RF-97).
- Descarga con espera, bloqueo de repeticiones, nombre saneado y errores `404/403/5xx` sin cerrar; sin vista previa (RF-39–RF-42, RF-108, RF-109).
- Con filtro «No leídas», al cerrar la leída se retira de la lista y el foco pasa al siguiente visible o al filtro (RF-45, CL-11).

**Alta**
- Botón solo para `ADMINISTRATIVO`/`ADMINISTRADOR` (RF-13–RF-15).
- Formulario único: audiencia, destinatario y redacción deshabilitada hasta completar la selección según la modalidad (RF-46–RF-47, RF-60, RF-99).
- Cursos cargados al abrir; error/vacío con reintento; año vigente; todas las páginas; sin duplicados; orden por año de cursada, división y turno; etiqueta «Inactivo» (RF-49–RF-52, RF-103). Selector con lupa, filtro por tecla, máximo cuatro, total/refinar, teclado y mensajes de vacío (RF-119–RF-122, RF-127–RF-129).
- Tutores cargados completos al abrir el selector; una línea de búsqueda con lupa y texto de ayuda; filtro local por nombre, apellido, DNI, CUIL o correo en cada tecla; máximo cuatro ordenados por apellido y nombre con total/refinar; selección visible y conservada; teclado (RF-53–RF-58, RF-100–RF-102, RF-123–RF-128, RF-130).
- El modal de creación usa la variante amplia: al menos 70% del viewport en 1024 px o más y 92%–96% en móvil (RF-129).
- Cambio de audiencia descarta solo curso/tutor y conserva redacción (RF-59, CL-31).
- Título con recorte, contador de puntos de código y tope de 80 sin truncado silencioso; contenido sin máximo; adjunto único con MIME/extensión, tamaño, reemplazo y quitado (RF-62–RF-70, RF-105–RF-107).
- Confirmación con resumen y «Sin adjunto»; cancelar vuelve con datos; cierre con borrador pide confirmación; navegar descarta el borrador (RF-71–RF-72, RF-82, RF-115).
- Durante el envío no se cierra ni se reenvía; éxito en cualquier `2xx` cierra, avisa, refresca bandeja/badge y no crea historial (RF-75–RF-76, RF-112).
- `401/403/404/413/422/5xx/red`: sesión, permiso, tutor, curso inválido, tamaño, errores por campo, error del servicio y resultado incierto con reintento explícito (RF-77–RF-81, RF-104, RF-110–RF-114).

**Menú lateral y badge**
- Ítem «Notificaciones» con campana para los tres roles; activo en la bandeja (RF-1–RF-2).
- Badge solo numérico, oculto en 0 o conteo desconocido, exacto 1–99, `99+` desde 100; a la derecha expandido y sobre el icono contraído; sin recortes ni superposición (RF-3–RF-4, CL-3–CL-5, CL-38).
- Nombre accesible con la cantidad y su significado; número visible, no solo color (RF-5, RF-91, RNF-3).
- Recalculado al cargar, navegar, leer y enviar; si falla un refresco se oculta; ausente sin verificación; sin otro indicador en móvil (RF-6–RF-8, RF-88–RF-90, RF-118, CL-7, CL-37).
- Cambio de rol: la siguiente carga o consulta ajusta opción, badge y controles (RF-116, CL-57).

## 8. Cobertura de requisitos

| Requisitos | Implementación principal | Verificación |
|------------|--------------------------|--------------|
| RF-1–RF-8 | `navigation.ts`, `icons.ts`, `sidebar.tsx`, `sidebar-nav.tsx`, `notification-badge.tsx`, `use-unread-notifications.ts`, `mobile-top-bar.tsx` | `tests/sidebar/*`, `tests/notifications/rules.test.ts`, E2E |
| RF-9–RF-15 | `access.ts`, `guard-decision.ts`, `guard.ts`, `page.tsx`, `notifications-header.tsx`, acciones | `tests/notifications/guard.test.ts`, `tests/actions/notifications.test.ts`, E2E |
| RF-16–RF-30 | `api/notifications.ts`, `data.ts`, `page.tsx`, `notifications-view.tsx`, `notification-list.tsx`, `notification-filters.tsx`, `notification-states.tsx`, `labels.ts` | `tests/api/notifications.test.ts`, `tests/notifications/*`, E2E |
| RF-31–RF-45 | `notification-detail-dialog.tsx`, `actions/notifications.ts`, `action-core.ts`, `api/notifications.ts`, `course-dialog.tsx` | `tests/actions/notifications.test.ts`, `tests/api/notifications.test.ts`, `tests/notifications/rules.test.ts`, E2E |
| RF-46–RF-61 | `create-notification-dialog.tsx`, `audience-selector.tsx`, `course-selector.tsx`, `tutor-selector.tsx`, acciones, `api/users.ts`, `api/courses.ts` | `tests/actions/notifications.test.ts`, `tests/api/tutors.test.ts`, `tests/notifications/rules.test.ts`, E2E |
| RF-119–RF-130 | `course-selector.tsx`, `tutor-selector.tsx`, `create-notification-dialog.tsx`, `course-dialog.tsx`, `rules.ts`, `data.ts`, `actions/notifications.ts` | `tests/notifications/rules.test.ts`, `tests/api/tutors.test.ts`, E2E de selectores y ancho |
| RF-62–RF-83 | `notification-composer.tsx`, `send-confirmation.tsx`, `validation/notifications.ts`, `api/notifications.ts`, `actions/notifications.ts`, `next.config.ts` | `tests/validation/notifications.test.ts`, `tests/api/notifications.test.ts`, `tests/actions/notifications.test.ts`, E2E |
| RF-84–RF-87 | `guard.ts`, acciones, API con Bearer solo en servidor, ausencia de controles de borrado/edición | Revisión de código, `tests/notifications/guard.test.ts`, `tests/api/notifications.test.ts`, E2E |
| RF-88–RF-118 | `rules.ts`, `validation/notifications.ts`, `labels.ts`, `api/notifications.ts`, `actions/notifications.ts`, `notification-detail-dialog.tsx`, `create-notification-dialog.tsx`, `notification-badge.tsx`, `use-unread-notifications.ts` | `tests/notifications/*`, `tests/validation/notifications.test.ts`, `tests/api/notifications.test.ts`, `tests/actions/notifications.test.ts`, E2E |
| RNF-1–RNF-6 | `CourseDialog`, selectores, foco, etiquetas accesibles, textos y estilos existentes | Pruebas puras de foco/etiquetas + E2E de teclado, ancho y 320–1920 |
| RNF-7 | Timeouts de `api/notifications.ts` | `tests/api/notifications.test.ts` |
| RNF-8 | `formatNotificationDate` | `tests/notifications/labels.test.ts` |
| RNF-9 | Nombres en inglés y textos en español | Revisión |
| RNF-10 | Sin dependencias nuevas | `git diff package.json` vacío |
| RNF-11 | Lista cerrada de archivos | Revisión del diff |
| RNF-12 | `metadata` en `page.tsx` | Revisión + `pnpm build` |
| RNF-13 | `loading.tsx` y `error.tsx` del segmento | Revisión + E2E |
| RNF-14 | `cache: "no-store"`, página dinámica por cookies | `tests/api/notifications.test.ts` + E2E |
| RNF-15 | Reutilización de `/icons/ico-bell.svg` | `tests/sidebar/icons.test.ts` |
| RNF-16 | Tipos estrictos, lint y build | `pnpm typecheck`, `pnpm lint`, `pnpm build` |

**Casos límite:** CL-1–CL-7 en badge/vacíos; CL-8–CL-12 en lectura/descarga; CL-13–CL-17 en adjunto; CL-18–CL-24 en cursos/tutores/envíos sin elegibles; CL-25–CL-28 en validación y contenido; CL-29–CL-31 en sesión, doble envío y audiencia; CL-32–CL-36 en payload, roles, resultado incierto y descarte; CL-37–CL-59 en badge, lectura pendiente, errores de servicio, reemplazo de adjunto, navegación y rol; CL-60–CL-71 en selectores con búsqueda, teclado y ancho del modal.

## 9. Estrategia de tests

**Unitarios y de red (Node `node:test`, sin dependencias nuevas).**
- `tests/api/notifications.test.ts`: listado válido o inválido, ids repetidos, `attachmentUrl` incoherente, fechas inválidas, `401/403`, orden no confiable, lectura ya leída, `403/404` de lectura, descarga con `Content-Disposition` y sin él, `401/403/404/5xx`, envío `2xx` con y sin `id`, `413`, `5xx`, `422` por clave, JSON sin archivo, multipart con archivo y campos, timeout y red incierta, `cache: "no-store"` y Bearer en todas las llamadas.
- `tests/validation/notifications.test.ts`: título 1/80/81 tras recorte, 84 en bruto con 80 recortado, espacios/tabs/saltos, Unicode, contenido vacío, extensión en mayúsculas, MIME vacío y discrepante, 0 bytes, 5.000.000/5.000.001, mismo archivo y reemplazo válido/inválido, payload exclusivo por audiencia, mapa de errores, tamaño y nombre de archivo.
- `tests/notifications/rules.test.ts`: badge 0/1/9/99/100, conteo, orden y empate por id, filtros, vacíos, reinicio del filtro, resumen 140 y colapso de blancos, nombre accesible de fila, lectura aplicada, cierre con filtro y foco siguiente/fallback, normalización sin acentos, filtrado de cursos/tutores, máximo cuatro, orden de tutores, cursos del año/deduplicación/orden, borrador, resolución de fallos de envío.
- `tests/notifications/labels.test.ts`: fechas con `+00:00` y `-03:00` sin conversión, segundos y fracciones, inválidas, etiquetas de audiencia/curso/tutor, nombres accesibles del badge, `Content-Disposition` simple y `filename*`, saneado y truncado de nombres.
- `tests/notifications/guard.test.ts`: lectura para los tres roles, envío solo para staff, desconocido, cuenta `forbidden/error`, sesión vencida, badge sin token.
- `tests/actions/notifications.test.ts`: acceso denegado sin token, `401` redirige, éxito revalida, `404` individual vuelve a audiencia, `413` y `5xx` conservan, `422` por campo, incierto sin reintento automático, badge `null` ante `401/403/5xx/red`, tutores sin criterios, tope de páginas sin parciales, curso inválido recarga.
- Modificados: `tests/sidebar/navigation.test.ts`, `tests/sidebar/icons.test.ts`, `tests/api/users.test.ts`.

**Componentes.** El proyecto no tiene framework de pruebas de DOM y no se agregan dependencias. La UI se valida con funciones puras (foco, etiquetas, validaciones) y E2E.

**E2E con backend real (`localhost:8000`) y `pnpm dev`.**
- Tres roles: ítem, contador, acceso y botón de creación.
- Contadores 0/1/99/100+, menú expandido/contraído, móvil sin segundo indicador.
- Bandeja, filtros, vacíos, detalle, lectura (contador y estado), cierre con filtro «No leídas», descarga y `404`.
- Alta por tutor (criterios y paginación), por curso (año vigente) y a todos; con y sin adjunto; confirmación, éxito, `422` por campo, `404` de tutor no verificado, `403`, `401` y resultado incierto.
- Teclado: Tab, Escape, foco inicial y retorno; responsive 320–1920; sin datos sensibles en URL, consola ni logs.

**Comandos de cierre:** `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`.

## 10. Riesgos y mitigaciones

- **Doble consulta en la bandeja** (página + badge): se acepta; el badge no bloquea la página y falla en silencio (`null`).
- **Recorrido completo de tutores**: acotado por criterios obligatorios, tope de 100 páginas y aborto sin resultados parciales.
- **Memoria de la descarga base64**: acotada por el límite de 5 MB del adjunto.
- **Límite de Server Actions**: mitigado con `bodySizeLimit: "6mb"`; se verifica con un archivo real de 5.000.000 bytes y se cubre el rechazo `413` con mensaje y redacción conservada.
- **Título con espacios extremos**: el recorte previo evita rechazos falsos; el contador usa puntos de código y el pegado excedido no se trunca en silencio.
- **Directorio de tutores completo**: se carga una vez al abrir el selector con tope de 100 páginas; si una falla, no hay resultados parciales y se ofrece reintento.
- **Parámetros del padrón**: el backend aplica `first_name`/`last_name`/`email`; la búsqueda de tutores no reutiliza `name`/`lastname`, que no filtran en el servicio.
- **Resultado incierto en envío**: no hay reintento automático; se advierte del posible duplicado y el reintento requiere una acción rotulada.
- **Lista sin paginación**: la spec lo excluye; se documenta el impacto de DOM si el volumen crece.
- **Sin pruebas de componentes**: se compensa con lógica pura y E2E manual; no se introduce infraestructura nueva.
- **Badge desactualizado entre pestañas**: se refresca al navegar; el tiempo real está fuera de alcance.

## 11. Verificación de cumplimiento constitucional

- Principio 1: spec aprobada y este plan antes de codificar; tareas en `tasks.md`.
- Principios 3–6: rutas, UI pura por props, `'use client'` solo en hojas interactivas y red centralizada en `app/lib/api`.
- Principio 2: tipos estrictos, sin `any` ni supresiones.
- Principios 7 y 16: identificadores en inglés; textos y comentarios en español.
- Principio 8: sin dependencias nuevas.
- Principio 9: fechas ISO en datos; presentación explícita.
- Principio 10: verificación con test, typecheck, lint y build.
- Principio 11: `metadata` propia; no se requieren imágenes nuevas.
- Principio 12: `loading.tsx` y `error.tsx` del segmento.
- Principio 13: datos sin caché y página dinámica.
- Principio 14: se reutiliza `ico-bell.svg`; no hay assets nuevos.
- Principio 15: sin clases inseguras en este plan.
- RNF-16: `pnpm typecheck`, `pnpm lint` y `pnpm build` sin errores; sin `any`.

## 12. Resoluciones de la revisión QA

- **Ambigüedades**: badge con origen, caída y nombre accesible (RF-88, RF-89, RF-91, RF-118); verificación por servicio (RF-90); fechas y orden deterministas (RF-93, RF-94); resumen y fila accesible (RF-92); vacíos y filtro inicial (RF-95); lectura al cerrar y `403/404` (RF-96, RF-97); cierre por fondo (RF-98); habilitación de redacción (RF-99); tutor seleccionado y paginación (RF-100–RF-102); cursos (RF-103, RF-104); título (RF-105); adjunto y descarga (RF-106–RF-109); envío (RF-110–RF-114); navegación y rol (RF-115–RF-117).
- **Contradicciones**: permiso de envío (RF-15/RF-78); foco y filtro (RF-44/RF-45); envío masivo sin destinatario (RF-46/RF-99); cancelación durante envío (RF-72/RF-75); actualización de bandeja (RF-76); orden de cursos (RF-49/RF-103); título (RF-63/RF-64/RF-105); alcance de cambios (RNF-11).
- **Constitución**: tiempos verificables (RNF-7); frescura como resultado (RNF-14); fechas dato/presentación (RNF-8); assets existentes (RNF-15); alcance de integración (RNF-11); calidad estricta (RNF-16).
- **Cambio 2026-11-19b**: modal amplio (RF-129); selectores con búsqueda por tecla y máximo cuatro coincidencias (RF-119–RF-128); directorio completo de tutores con error/reintento (RF-130); se retira la paginación (RF-101).
