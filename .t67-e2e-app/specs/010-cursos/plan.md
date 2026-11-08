# Plan 010 — Gestión de cursos

Spec: `specs/010-cursos/spec.md` — Estado: aprobada (revisión 2026-10-31)

## 1. Resumen y enfoque

El módulo se resuelve con rutas privadas dentro de `/dashboard/courses`, Server Components para la carga de datos, Server Actions para todas las escrituras y componentes cliente solo en las hojas interactivas (filtros, menús, diálogos y formularios). El backend es la única fuente de verdad: la interfaz nunca inventa métricas, nunca marca éxito sin confirmación y muestra como no disponible lo que no está implementado.

Enfoque por capas (constitución #3, #4, #5, #6):

- Rutas y composición: `app/dashboard/courses/**`.
- Lógica pura y estados: `app/lib/courses/**`.
- Red Laravel: `app/lib/api/courses.ts`.
- Validación y formularios: `app/lib/validation/course.ts`.
- Escrituras: `app/lib/actions/courses.ts`.
- Presentación: `app/ui/courses/**` y un `SelectField` reutilizable.

Decisiones transversales:

- Rutas y código en inglés; textos visibles en español (constitución #7 y #15 duplicado).
- Importaciones relativas con extensión `.ts`/`.tsx`, igual que el resto del proyecto; no usar `@/` porque Turbopack no lo resuelve en build.
- Sin dependencias nuevas (constitución #8).
- Sin cambios de contrato. Solo se permite la corrección de autorización multirrol del backend necesaria para que `ADMINISTRADOR` acceda al módulo.
- Sin imágenes nuevas: se reutilizan los iconos existentes de `public/icons/` (constitución #14).

Decisiones de la revisión QA:

- Cursos de años pasados: solo lectura para campos editables; «Editar» deshabilitado. No se crea ni se cambia a año pasado.
- «Eliminar» y «Desactivar» deshabilitados con `currentCapacity > 0`; «Eliminar» habilitado con 0 y ejecuta borrado lógico.
- La eliminación es lógica; no hay borrado físico ni reasignación de inscriptos en esta spec.
- Clonación individual y masiva copia capacidad máxima y estado; no copia id, code, inscripciones ni currentCapacity.
- Clonación masiva solo desde años anteriores al actual.
- Código recalculado por el backend al cambiar la combinación; el cliente no lo envía.
- Página y filtros normalizados desde la URL; la página se ajusta si queda fuera de rango.
- Reporte: total desde `header.totalInscriptions`; orden secuencial; alumno «Apellido, Nombre»; faltantes «No informado».
- Errores: `401` sesión vencida, `403` acceso denegado, `404` inexistente, `422` validación o negocio, `5xx`/red/timeout genérico; nunca mensaje crudo.
- RNF medibles: progreso <100 ms, timeout 10 s, hasta 10 000 cursos o error controlado, estilo con límites concretos.

Decisiones de la revisión 2026-10-31:

- El listado no muestra la columna «Código»; el código se conserva en detalle, diálogos y edición.
- La selección de cursos es visual: casillas por fila, casilla de cabecera para todos los filtrados, contador y «Limpiar selección».
- «Enviar notificación» queda no disponible con «Próximamente»; no existe endpoint de notificaciones.
- La selección se conserva por identificador al paginar o filtrar, no se persiste entre recargas y descarta identificadores inexistentes.
- Los avisos de éxito se ocultan a los 4 segundos; los errores permanecen hasta cierre manual.
- El menú de acciones se muestra fuera del contenedor de la tabla, con posición fija, sin recortes y dentro del viewport.
- El footer institucional se muestra en las páginas públicas; el panel privado no lo incluye.
- `CheckRole` se corrige para aceptar varios roles separados en la definición de la ruta.

## 2. Rutas

| Ruta | Tipo | Contenido |
|---|---|---|
| `/dashboard/courses` | Server Component dinámico | Listado, tarjetas, filtros, paginación y acciones generales |
| `/dashboard/courses/new` | Server Component + formulario cliente | Crear curso |
| `/dashboard/courses/[courseId]` | Server Component dinámico | Detalle del curso e inscripciones activas |
| `/dashboard/courses/[courseId]/edit` | Server Component + formulario cliente | Editar curso |

Todas heredan el armazón privado `PrivateShell`, el menú lateral y la cuenta. El `proxy.ts` existente ya cubre `/dashboard/:path*`; no se modifica. La autorización real se valida en el servidor y el backend sigue siendo autoritativo.

## 3. Archivos a crear

### 3.1 Rutas

- `app/dashboard/courses/page.tsx`: carga la cuenta, valida el rol, obtiene todos los cursos y pasa datos y filtros iniciales a la vista. Metadata propia.
- `app/dashboard/courses/loading.tsx`: esqueleto del listado con `aria-busy` y texto `sr-only`.
- `app/dashboard/courses/error.tsx`: límite de error con mensaje, `Reintentar` y enlace a `/dashboard`.
- `app/dashboard/courses/new/page.tsx`: valida el rol, muestra breadcrumb, título y `CourseForm` en modo creación. Metadata propia.
- `app/dashboard/courses/[courseId]/page.tsx`: carga curso y reporte, resuelve no encontrado y acceso denegado, y compone el detalle. `generateMetadata` con el código del curso o «Detalle del curso».
- `app/dashboard/courses/[courseId]/loading.tsx`: esqueleto del detalle.
- `app/dashboard/courses/[courseId]/error.tsx`: límite de error del detalle con `Reintentar` y enlace al listado.
- `app/dashboard/courses/[courseId]/edit/page.tsx`: carga el curso, valida el rol y muestra `CourseForm` en modo edición con valores actuales y `currentCapacity`. Metadata propia.
- `app/dashboard/courses/[courseId]/edit/loading.tsx`: esqueleto del formulario.

### 3.2 Lógica de dominio y datos

- `app/lib/courses/types.ts`: tipos del curso, enums, filtros, paginación, resumen, resultados de API, estados de página y estados de acción.
- `app/lib/courses/labels.ts`: etiquetas en español de ciclo, especialidad, turno y estado; orden de turnos; opciones de formulario y filtros; conversión de valores desconocidos a «No disponible».
- `app/lib/courses/access.ts`: `canManageCourses(role)` y lista de roles con acceso (`ADMINISTRATIVO`, `ADMINISTRADOR`).
- `app/lib/courses/rules.ts`: `isPastYear`, `isCourseEditable`, `canDeleteCourse`, `canDeactivateCourse`, `getEditDisabledReason` y `getDeleteDisabledReason`.
- `app/lib/courses/list.ts`: búsqueda normalizada, filtrado combinado, orden, paginación con ajuste de página, resumen, filtros por defecto y limpieza.
- `app/lib/courses/filters-url.ts`: lectura y escritura de `q`, `year`, `cycle`, `speciality`, `shift` y `page`; validación del parámetro `from` para volver al listado sin redirecciones abiertas.
- `app/lib/courses/course-state.ts`: mapeo de resultados de API a estados de página y de acción; mensajes de éxito y error; traducción de errores conocidos.
- `app/lib/courses/selection.ts`: selección por identificador, seleccionar todos los filtrados, limpiar y descartar cursos inexistentes.
- `app/lib/courses/menu-position.ts`: cálculo puro de posición del menú de acciones para mostrarlo fuera del contenedor de la tabla y dentro del viewport.
- `app/lib/courses/data.ts`: cargas de servidor memoizadas con `cache()`: listado completo, curso y reporte.
- `app/lib/courses/guard.ts`: sesión y rol para páginas y acciones; redirección a `/session-expired` cuando falta el token o el servicio responde `401`.
- `app/lib/api/courses.ts`: cliente HTTP centralizado de cursos.
- `app/lib/validation/course.ts`: validación, lectura de `FormData`, armado de payload y mapeo/traducción de errores por campo.
- `app/lib/actions/courses.ts`: Server Actions de crear, editar, eliminar, clonar individual, clonar por año y activar/desactivar.

### 3.3 Componentes de interfaz

- `app/ui/courses/courses-view.tsx`: coordinador cliente del listado; mantiene filtros y página, sincroniza la URL y compone encabezado, tarjetas, filtros, tabla, diálogos y avisos.
- `app/ui/courses/courses-header.tsx`: breadcrumb, título, descripción y acciones generales con «Generar reporte» no disponible.
- `app/ui/courses/course-breadcrumb.tsx`: breadcrumb accesible reutilizable para listado, detalle y edición.
- `app/ui/courses/course-summary-cards.tsx`: cuatro tarjetas con estados de carga y error; las numéricas muestran cero con resultados vacíos y la de año muestra el filtro activo.
- `app/ui/courses/course-filters.tsx`: buscador, selects de año, ciclo, especialidad y turno, y «Limpiar filtros».
- `app/ui/courses/course-table.tsx`: tabla semántica sin columna «Código», con columna «Selección», casilla por fila y casilla de cabecera para todos los filtrados; estado visual, paginación y contenedor con scroll interno.
- `app/ui/courses/course-selection-bar.tsx`: contador de cursos seleccionados, «Limpiar selección» y «Enviar notificación» no disponible con «Próximamente».
- `app/ui/courses/course-row-actions.tsx`: menú accesible por fila renderizado fuera de la tabla; deshabilita «Editar» en años pasados, «Eliminar» y «Desactivar» con inscriptos, y distingue los alcances de «Generar reporte».
- `app/ui/courses/course-status-badge.tsx`: estado con texto e indicador, nunca solo color.
- `app/ui/courses/course-notice.tsx`: aviso accesible de éxito, error o información con cierre; los errores persisten hasta cierre o cambio de ruta y los éxitos se ocultan a los 4 segundos, con pausa al recibir foco o puntero.
- `app/ui/courses/course-dialog.tsx`: diálogo nativo reutilizable con `showModal`, foco atrapado, Escape, fondo inerte y retorno de foco; bloquea el cierre mientras hay una operación en curso.
- `app/ui/courses/clone-year-dialog.tsx`: clonación masiva solo con años anteriores, destino fijo, consecuencias, cantidad intentada y resultado con `cloned` y `courses`.
- `app/ui/courses/clone-course-dialog.tsx`: clonación individual con año de destino, consecuencias, capacidad máxima y estado conservados.
- `app/ui/courses/delete-course-dialog.tsx`: confirmación de eliminación lógica solo para cursos con capacidad actual cero.
- `app/ui/courses/status-dialog.tsx`: confirmación de desactivación; activación sin confirmación adicional.
- `app/ui/courses/course-form.tsx`: formulario cliente de crear/editar con `useActionState`, defaults de creación, validación en vivo, errores, progreso y bloqueo de doble envío.
- `app/ui/courses/course-form-fields.tsx`: campos compartidos entre creación y edición.
- `app/ui/courses/course-detail.tsx`: datos completos del curso, estado, cupos y acciones; «Editar» deshabilitado en años pasados.
- `app/ui/courses/course-inscriptions-table.tsx`: inscripciones activas con total de `header.totalInscriptions`, orden secuencial, alumno «Apellido, Nombre», faltantes «No informado», ayuda y estados.
- `app/ui/courses/course-skeletons.tsx`: esqueletos del listado, tarjetas, tabla, detalle y formulario.
- `app/ui/courses/course-not-found.tsx`: curso inexistente o eliminado con enlace al listado.
- `app/ui/courses/course-access-denied.tsx`: acceso denegado sin datos.
- `app/ui/forms/select-field.tsx`: select accesible con etiqueta, ayuda, error y `aria-describedby`, compatible con el estilo de `TextField`.

### 3.4 Tests

- `tests/courses/labels.test.ts`
- `tests/courses/access.test.ts`
- `tests/courses/rules.test.ts`
- `tests/courses/list.test.ts`
- `tests/courses/filters-url.test.ts`
- `tests/courses/validation.test.ts`
- `tests/courses/selection.test.ts`
- `tests/courses/menu-position.test.ts`
- `tests/api/courses.test.ts`
- `tests/actions/courses.test.ts`

## 4. Archivos a modificar

- `app/lib/sidebar/navigation.ts`: reemplazar la opción no disponible «Cursos» por una opción habilitada con `href: "/dashboard/courses"` y `match: "prefix"` para `ADMINISTRATIVO` y `ADMINISTRADOR`. `TUTOR` queda intacto.
- `app/ui/courses/courses-view.tsx`: incorporar selección de cursos, barra de selección y cierre automático de avisos de éxito.
- `app/ui/courses/course-table.tsx`: quitar «Código», agregar «Selección» y conectar casillas individual/cabecera.
- `app/ui/courses/course-row-actions.tsx`: usar portal y posición fija para el menú.
- `app/ui/courses/course-notice.tsx`: temporizador de 4 segundos para éxitos.
- `app/layout.tsx` y páginas públicas: quitar el footer del layout raíz y agregarlo a home, login, registro, recuperación, restablecimiento y verificación.
- `eet3100-inscripciones-api/app/Http/Middleware/CheckRole.php`: aceptar múltiples roles con firma variádica.
- `eet3100-inscripciones-api/tests/Feature/CourseAuthorizationTest.php`: cubrir ADMINISTRADOR, ADMINISTRATIVO y TUTOR.
- `tests/sidebar/navigation.test.ts`: actualizar expectativas de opciones habilitadas y agregar el estado activo en la ruta del módulo y en sus subpantallas.
- `MEMORY.md`: registrar el plan, las decisiones y el estado al cerrar la fase.

No se modifican `app/globals.css`, `proxy.ts`, `next.config.ts`, `package.json` ni el contrato del backend. La única modificación de backend permitida es la corrección de autorización de roles.

## 5. Contrato, tipos y normalización

### 5.1 Endpoints usados

| Operación | Método y ruta | Respuesta esperada |
|---|---|---|
| Listado | `GET /api/courses?per_page=100&page=N` | `{ data, links, meta }` |
| Detalle | `GET /api/courses/{id}` | `{ data }` |
| Reporte | `GET /api/courses/{id}/report` | `{ header: { totalInscriptions }, list }` |
| Crear | `POST /api/courses/create` | `201 { data }` |
| Editar | `PATCH /api/courses/{id}` | `200 { data }` |
| Eliminar | `DELETE /api/courses/{id}` | `204` sin cuerpo, o `422 { error }`; eliminación lógica |
| Clonar curso | `POST /api/courses/{id}/clone` | `201 { data }`; copia capacidad máxima y estado |
| Clonar año | `POST /api/courses/clone/{oldYear}` | `201 { message, cloned, courses }`; solo `oldYear < currentYear` |
| Desactivar | `PATCH /api/courses/{id}/hide` | `200 { data }` |
| Activar | `PATCH /api/courses/{id}/show` | `200 { data }` |

No existe endpoint de reasignación de inscriptos; no se implementa en esta spec.

Todas las solicitudes usan `Authorization: Bearer <token>` leído de la cookie `httpOnly`, `credentials: "omit"`, `cache: "no-store"`, `redirect: "manual"` y `AbortSignal.timeout(10000)`. El token nunca llega al navegador ni a los componentes.

### 5.2 Tipos principales

- `CourseStatus = "active" | "inactive"`.
- `CourseCycle`, `CourseSpeciality`, `CourseShift` con sus uniones conocidas y etiquetas; los valores desconocidos se conservan como texto y se muestran como «No disponible».
- `Course` con `id`, `code` (puede faltar), `year`, `studyYear`, `division`, `cycle`, `speciality`, `shift`, `maxCapacity`, `currentCapacity`, `availablePlaces`, `status`, `createdAt`, `updatedAt`.
- `CourseFilters`: `query`, `year` (número o «all»), `cycle`, `speciality`, `shift`.
- `CoursePage`, `CourseSummary`, `CourseReport` con `totalInscriptions`, `CourseReportRow`.
- `CourseListResult`, `CourseResult`, `CourseReportResult`, `CourseActionResult`.
- `CourseFormInput`, `CoursePayload`, `CourseFieldErrors`.
- `CourseDeleteEligibility`, `CourseEditEligibility` y sus motivos accesibles.

### 5.3 Normalización

- `parseCourse` valida campos obligatorios, números enteros no negativos, enums conocidos de estado y acepta `code` ausente o vacío. `availablePlaces` se toma del backend; si falta, se deriva de `maxCapacity - currentCapacity`; si es negativo, se normaliza a `null` y la interfaz muestra «No disponible».
- `parseCourseListResponse` valida `data`, `meta.current_page`, `meta.last_page`, `meta.total` y tolera `links` incompletos. Una respuesta con datos inválidos se trata como error controlado, nunca como lista parcial.
- `parseCourseReportResponse` valida `header.totalInscriptions` y cada fila; si falta el total se normaliza a `null`; los campos de alumno faltantes se normalizan a `null` y la interfaz muestra «No informado».
- `parseCloneYearResponse` valida `message`, `cloned` y `courses`; `cloned` debe ser un entero no negativo.
- `parseCloneCourseResponse` valida el curso devuelto y conserva capacidad máxima y estado.
- `parseDeleteResponse` acepta `204` sin cuerpo y `422` con `{ error }`; el éxito se interpreta como eliminación lógica.
- Cualquier cuerpo inválido en un estado exitoso se trata como fallo general, nunca como éxito.

## 6. Funciones puras

- `canManageCourses(role: unknown): boolean`.
- `isPastYear(year, currentYear)`: año anterior al actual.
- `isCourseEditable(course, currentYear)`: `year >= currentYear`.
- `canDeleteCourse(course)`: `currentCapacity === 0`.
- `canDeactivateCourse(course)`: `currentCapacity === 0`.
- `getEditDisabledReason(course, currentYear)`: «Solo se pueden editar cursos del año actual o futuros.» cuando corresponde.
- `getDeleteDisabledReason(course)`: «No disponible: el curso tiene inscriptos.» cuando `currentCapacity > 0`.
- `getCycleLabel`, `getSpecialityLabel`, `getShiftLabel`, `getStatusLabel` con fallback «No disponible».
- `normalizeSearch(text)`: recorta, colapsa espacios internos, pasa a minúsculas y elimina diacríticos.
- `buildCourseSearchText(course)`: código y texto legible de año, cursada, división, ciclo, especialidad, turno y estado.
- `filterCourses(courses, filters)`.
- `sortCourses(courses)`: año descendente, cursada ascendente, división numérica o alfabética, turno «Mañana, Tarde, Noche», ciclo «Básico, Superior», especialidad «Básica, Informática, Electrónica» y desempate por identificador.
- `paginateCourses(courses, page, pageSize)`: devuelve página válida ajustada a `1..páginas`, total, desde, hasta y páginas.
- `summarizeCourses(courses)`: total, activos y suma de capacidad máxima; si la suma no es representable devuelve «No disponible».
- `getDefaultFilters(currentYear, years)`: año actual si está presente; si no, «Todos los años»; sin búsqueda y «Todas».
- `clearFilters(currentYear, years)`: igual a los valores por defecto.
- `parseCourseFilters(searchParams, currentYear, years)`: ignora valores inválidos y normaliza la página.
- `serializeCourseFilters(filters, page)`: solo valores no predeterminados; conserva parámetros ajenos.
- `sanitizeReturnPath(value)`: acepta solo rutas relativas que empiezan con `/dashboard/courses` y no contienen `//`.
- `toggleCourseSelection(selectedIds, courseId)`: agrega o quita un identificador.
- `selectAllFilteredCourses(selectedIds, filteredCourses)`: agrega todos los identificadores filtrados.
- `pruneCourseSelection(selectedIds, courses)`: descarta identificadores que ya no existen.
- `getCourseSelectionState(selectedIds, filteredCourses)`: devuelve cantidad y estado marcado/indeterminado de la cabecera.
- `computeRowMenuPosition(triggerRect, menuSize, viewport)`: calcula posición fija, apertura hacia arriba y límites del viewport.
- `validateCourseInput(input, currentCapacity, currentYear)`: año actual o futuro; cursada 1 a 6; división recortada de 1 a 10 y no solo espacios; enums; capacidad entera positiva; en edición, capacidad mayor o igual a la actual.
- `buildCoursePayload(input)`: exactamente `year`, `studyYear`, `division`, `cycle`, `speciality`, `shift`, `maxCapacity`.
- `readCourseFormData(formData)`.
- `mapCourseFieldErrors(value)`: reconoce los siete campos y descarta los desconocidos.
- `translateCourseFieldErrors(fieldErrors)`: traduce mensajes conocidos de Laravel al español y devuelve los desconocidos como aviso general.
- `getReportStudentName(row)`: «Apellido, Nombre» o «No informado».
- `toCourseListState`, `toCourseDetailState`, `toCourseReportState`, `toCourseActionState`.

## 7. Acceso, sesión y autorización

- Las páginas usan `getPrivateAccount()` para la cuenta y el armazón, y `canManageCourses(claims.role)` para el módulo.
- Un rol sin acceso recibe `CourseAccessDenied` dentro de `PrivateShell`, sin cargar cursos.
- Sin sesión, el `proxy.ts` y `verifySession()` redirigen a `/login`; un `401` del servicio de cursos redirige a `/session-expired`, que borra la cookie.
- Un `403` del servicio muestra acceso denegado y conserva la sesión.
- Las Server Actions obtienen el token de la cookie; si falta o el servicio responde `401`, redirigen a `/session-expired`; si el rol no corresponde o el servicio responde `403`, devuelven estado denegado sin llamar a la API cuando el rol ya es insuficiente.
- Precedencia de errores: `401` sesión vencida, `403` acceso denegado, `404` curso inexistente, `422` validación o negocio, `5xx`/red/timeout error genérico. Nunca se muestra el texto crudo del backend.
- Las acciones verifican en servidor que «Eliminar» y «Desactivar» solo se ejecutan con `currentCapacity === 0`; si el estado cambió, el backend sigue siendo autoritativo.
- El backend sigue siendo la autorización definitiva; el filtro por rol es solo de navegación y experiencia.
- `CheckRole` recibe los roles como argumentos separados por Laravel, no como un único texto separado por comas. La corrección usa `string ...$roles` y compara el rol del usuario contra esa lista.

## 8. Server Actions

Todas revalidan `/dashboard/courses` y, cuando corresponde, el detalle.

- `createCourseAction(previousState, formData)`: valida, no llama a la API con errores locales, envía el payload exacto, ante `201` revalida y redirige a `/dashboard/courses?created={code o “Sin código”}`; ante `422` devuelve errores por campo traducidos y valores; ante `401`/`403`/`5xx`/red/timeout devuelve el estado correspondiente. Los defaults son año actual, cursada 1, ciclo básico, especialidad básica, turno mañana y capacidad vacía.
- `updateCourseAction(previousState, formData)`: lee `courseId` oculto, rechaza cursos de años pasados, valida con `currentCapacity`, envía `PATCH` con los siete campos, ante `200` revalida y redirige al detalle o al listado según `from`; el mensaje incluye el código devuelto o «Sin código»; ante `404` informa curso inexistente; ante `422` conserva valores.
- `deleteCourseAction(previousState, formData)`: lee `courseId`, carga o valida el curso y exige `currentCapacity === 0`, envía `DELETE`; ante `204` revalida, devuelve éxito lógico y ajusta la página si corresponde; ante `422` muestra «No se puede eliminar: el curso tiene inscriptos.»; ante `404` informa y permite refrescar.
- `cloneCourseAction(previousState, formData)`: lee `courseId` y `year` destino, valida que sea actual o futuro, envía `{ year }`; ante `201` devuelve el código nuevo o «Sin código» y revalida; conserva capacidad máxima y estado.
- `cloneYearAction(previousState, formData)`: lee `oldYear`, valida que sea anterior al actual, envía `POST /api/courses/clone/{oldYear}`; devuelve mensaje, `cloned`, cursos creados e intentados; con `cloned: 0` informa que no se creó ninguno; ante error refresca el listado para reflejar el estado real.
- `setCourseStatusAction(previousState, formData)`: lee `courseId` y `status`, carga o valida el curso y exige que la desactivación solo se ejecute con `currentCapacity === 0`, llama a `hide` o `show`; ante `200` devuelve el curso actualizado; ante `5xx` muestra error genérico sin cambiar el estado mostrado.

Reglas comunes:

- Sin `fetch` en componentes; solo las acciones y los cargadores de servidor llaman a `app/lib/api/courses.ts`.
- Bloqueo de doble envío en el cliente con `useRef` y estado pendiente; el servidor no asume idempotencia.
- Los mensajes de éxito se anuncian con `role="status"`; los errores con `role="alert"`.
- No se registra el token, datos de alumnos ni payloads sensibles en consola.

## 9. Estrategia de presentación e interacción

### 9.1 Listado

- El servidor obtiene **todas** las páginas del listado con `per_page=100`, siguiendo `meta.last_page`, en orden secuencial y con un tope de 100 páginas. Si se supera el tope, se trata como error de carga y no se muestran datos parciales.
- La vista cliente filtra, ordena y pagina en memoria; las tarjetas se recalculan sobre el conjunto filtrado. Las tarjetas numéricas muestran cero con resultados vacíos; la tarjeta de año muestra el filtro activo.
- Los filtros y la página se reflejan en la URL con `history.replaceState`; al recargar, el servidor los lee de `searchParams` y los pasa como estado inicial. No se generan entradas de historial por cada tecla.
- El año por defecto es el actual si existe en el conjunto completo; si no, «Todos los años».
- «Limpiar filtros» vuelve al año por defecto, búsqueda vacía y «Todas», vuelve a la página 1 y elimina los parámetros del módulo.
- Una página fuera de rango se ajusta a la última válida; tras eliminar o editar, la página se conserva salvo que quede fuera de rango.
- Los enlaces al detalle incluyen `from` con la URL actual del listado, validada con `sanitizeReturnPath`; «Volver a cursos» la usa o cae en `/dashboard/courses`.
- El listado muestra esqueleto durante la carga del segmento, estado vacío global, estado vacío por filtros, error con reintento y `401`/`403` según corresponda.
- Crear o clonar fuera del filtro activo conserva los filtros y muestra el aviso con el código; el curso puede no verse hasta limpiar filtros.
- La selección de cursos se mantiene por identificador al paginar o filtrar, muestra la cantidad seleccionada y descarta cursos ausentes. No se persiste entre recargas.
- Los avisos de éxito se ocultan a los 4 segundos; el temporizador se pausa con foco o puntero encima y los errores permanecen hasta cierre manual.

### 9.2 Tabla y acciones

- Tabla semántica con `caption`, `th scope="col"` y contenedor `overflow-x-auto`; la página nunca desborda horizontalmente.
- Columnas: Selección, Año académico, Año de cursada, División, Ciclo, Especialidad, Turno, Estado y Acciones. La columna Código no se muestra en el listado.
- La columna Selección incluye una casilla por fila y una casilla de cabecera para todos los cursos filtrados, con estado indeterminado cuando corresponde.
- Estado con texto e indicador; «Activo» e «Inactivo», nunca solo color.
- Paginación de 10 con controles anterior/siguiente, página actual y total.
- La barra de selección aparece con al menos un curso marcado y muestra el contador, «Limpiar selección» y «Enviar notificación — Próximamente».
- Cada fila se identifica por `id`; el nombre accesible usa la descripción visible sin código.
- Menú por fila con patrón de `sidebar-account-menu`: `role="menu"`, foco inicial, Escape, clic fuera y retorno de foco. Se renderiza con portal fuera de la tabla y con posición fija para no recortarse; se abre hacia arriba si falta espacio y se limita al viewport. «Generar reporte» se muestra con `aria-disabled` y «Próximamente»; los nombres accesibles distinguen reporte general y reporte del curso; «Editar» navega a la ruta de edición salvo en años pasados; «Ver detalles» navega al detalle.
- «Eliminar» y «Desactivar» se muestran deshabilitados con `currentCapacity > 0` y motivo accesible; «Editar» se deshabilita en años pasados.
- Diálogos de eliminar, activar/desactivar y clonar con `<dialog>` nativo, `aria-labelledby`, foco atrapado y Escape; no se cierran mientras hay una operación en curso.

### 9.3 Detalle e inscripciones

- Detalle con breadcrumb, código o «Sin código», año, cursada, división, ciclo, especialidad, turno, capacidad máxima, actual, cupos disponibles, estado, «Volver a cursos» y «Editar». «Editar» se deshabilita en años pasados.
- La sección «Inscripciones activas» usa `GET /api/courses/{id}/report`; total desde `header.totalInscriptions`, tabla con N.º de orden secuencial, Alumno «Apellido, Nombre», DNI, Teléfono y Correo.
- Texto de ayuda sobre las limitaciones del backend; sin fecha, estado por alumno ni acción de detalle.
- Reporte vacío, carga independiente de la sección, error de reporte y datos faltantes («No informado») se resuelven sin romper el detalle.
- Errores del reporte: `401` sesión vencida, `403` acceso denegado, `404` curso inexistente, `5xx`/red/timeout solo en la sección.
- `404` y `403` se muestran dentro del armazón, con enlace al listado y regreso válido si existe.

### 9.4 Crear y editar

- Formularios con año, cursada, división, ciclo, especialidad, turno y capacidad máxima; «Cancelar» y «Crear curso» o «Guardar cambios».
- Crear: año actual por defecto, cursada 1, ciclo básico, especialidad básica, turno mañana, capacidad vacía.
- Editar: solo cursos actuales o futuros; valores actuales, `currentCapacity` visible como dato no editable, validación de capacidad mínima y código potencialmente nuevo.
- `useActionState`, errores por campo y banner, conservación de valores, `aria-busy`, spinner textual y bloqueo de doble envío.
- Crear redirige al listado con aviso de código o «Sin código»; editar redirige al detalle o al listado según `from`, con aviso que incluye el código devuelto.
- Cancelar no envía y conserva filtros y página.
- Los cursos de años pasados no ofrecen formulario de edición.

## 10. Decisiones técnicas justificadas

1. **Rutas dedicadas para crear y editar**, en lugar de modales.
   - Motivo: enlaces compartibles, botón atrás, formularios más simples y menos estado cliente.
   - Alternativa descartada: modal con formulario y cierre condicional, más frágil para recargas y accesibilidad.
2. **Filtrado y paginación en el cliente sobre el conjunto completo**, en lugar de filtros por servidor.
   - Motivo: `GET /api/courses` no acepta filtros y RF-21 exige no volver a solicitar datos al filtrar.
   - Alternativa descartada: filtrar en el servidor con `searchParams`, que provoca una petición por cambio.
3. **Obtención de todas las páginas con `per_page=100` y tope de 100 páginas**.
   - Motivo: métricas y filtros exactos; el tope de 10 000 cursos evita cargas desmedidas y datos parciales.
   - Alternativa descartada: mostrar solo la página del servidor, que haría inexactas las tarjetas.
4. **Server Actions para todas las escrituras**, sin `fetch` en el navegador.
   - Motivo: el token permanece en cookie `httpOnly`, se respeta la separación de capas y no se expone la API.
   - Alternativa descartada: Route Handlers con `fetch` cliente, más superficie y más código.
5. **`PATCH` con los siete campos editables completos**, en lugar de calcular diferencias.
   - Motivo: el contrato acepta los mismos campos, el resultado es predecible y el payload es testeable.
   - Alternativa descartada: enviar solo campos modificados, que agrega lógica sin beneficio claro.
6. **`<dialog>` nativo con trampa de foco explícita**.
   - Motivo: accesibilidad, fondo inerte y precedente ya probado en la spec 009.
   - Alternativa descartada: modal CSS propio con gestión manual del fondo.
7. **Estado del listado en la URL con `replaceState`**.
   - Motivo: recarga y regreso desde el detalle conservan filtros y página sin llenar el historial.
   - Alternativa descartada: `sessionStorage` o estado global; peor para compartir y para el botón atrás.
8. **Validación de capacidad en cliente y servidor**.
   - Motivo: retroalimentación inmediata y defensa en profundidad; el backend sigue validando.
   - Alternativa descartada: confiar solo en el `422` del backend, con peor experiencia.
9. **Traducción de errores conocidos de Laravel y aviso general para desconocidos**.
   - Motivo: RNF-17 y RNF-21 exigen español; evita mostrar mensajes internos en inglés.
   - Alternativa descartada: mostrar el mensaje crudo del backend.
10. **Vista propia de «no encontrado» dentro del armazón**, en lugar de `notFound()`.
    - Motivo: RF-53 exige conservar el menú lateral y ofrecer enlace al listado.
    - Alternativa descartada: `not-found.tsx` global sin menú.
11. **Autorización por rol en el servidor y confirmación del backend**.
    - Motivo: el menú es una ayuda, no un mecanismo de seguridad; el backend decide.
    - Alternativa descartada: replicar permisos en `proxy.ts`, que duplicaría reglas y podría desincronizarse.
12. **Reutilizar iconos existentes y no introducir assets**.
    - Motivo: constitución #14 y consistencia visual; ya existen `ico-pencil-tool`, `ico-trash`, `ico-download`, `ico-check`, `ico-ban`, `ico-course`, `ico-info` y `ico-rectangle-stack-fill-badge`.
    - Alternativa descartada: generar iconos nuevos sin necesidad.
13. **Avisos de éxito por redirección con parámetro en crear/editar y por estado de acción en operaciones de fila**.
    - Motivo: crear/editar cambian de pantalla y necesitan un mensaje accesible que se oculta a los 4 segundos; las operaciones de fila conservan filtros y página sin navegar.
    - Alternativa descartada: usar un único patrón para todos los casos, que empeora una de las dos experiencias.
14. **Sin caché compartida ni ISR para cursos**.
    - Motivo: datos privados y mutables por sesión; `cache: "no-store"` y páginas dinámicas.
    - Alternativa descartada: revalidación por tiempo, que mostraría datos obsoletos después de operaciones.
15. **Código recalculado por el backend al editar la combinación**.
    - Motivo: el código deriva de año, cursada, división, ciclo, especialidad y turno; el cliente no debe intentar generarlo.
    - Alternativa descartada: bloquear la edición de la combinación, que impediría corregir cursos.
16. **Eliminación lógica y sin reasignación de inscriptos**.
    - Motivo: el backend no expone borrado físico ni reasignación; la spec solo elimina cursos con `currentCapacity = 0`.
    - Alternativa descartada: borrado físico o mover alumnos desde este módulo, que requiere backend nuevo y otra spec.
17. **Clonación con estado y capacidad máxima; masiva solo desde años anteriores**.
    - Motivo: reutiliza la configuración completa y evita clonar desde años futuros.
    - Alternativa descartada: forzar clones inactivos o permitir cualquier origen, que cambia el contrato acordado.
18. **Cursos de años pasados de solo lectura**.
    - Motivo: la validación vigente solo permite año actual o futuro; evita depender de un cambio de backend.
    - Alternativa descartada: permitir conservar el año pasado al editar, que requiere confirmar el contrato.
19. **Página y filtros normalizados desde la URL**.
    - Motivo: recarga y regreso desde el detalle conservan el estado; una página inválida no deja la vista vacía.
    - Alternativa descartada: confiar en valores arbitrarios de la URL o reiniciar filtros tras cada mutación.
20. **RNF medibles y errores con precedencia única**.
    - Motivo: permite verificar accesibilidad, rendimiento y manejo de sesión sin criterios subjetivos.
    - Alternativa descartada: criterios como «rápido» o «sobrio» sin umbral, imposibles de testear.
21. **Selección visual por identificador, sin persistencia**.
    - Motivo: prepara una acción futura de notificación sin inventar un envío ni un contrato inexistente.
    - Alternativa descartada: guardar la selección en URL o almacenamiento, que agrega estado compartido y no tiene consumidor todavía.
22. **Menú de acciones en portal con posición fija**.
    - Motivo: el contenedor de la tabla tiene scroll horizontal y recorta un menú absoluto.
    - Alternativa descartada: quitar el scroll de la tabla, que rompe el responsive.
23. **Avisos de éxito con temporizador de 4 segundos**.
    - Motivo: evita que un mensaje verde quede indefinidamente en pantalla; los errores conservan lectura manual.
    - Alternativa descartada: ocultar todos los avisos por tiempo, que puede eliminar información necesaria para corregir un error.
24. **Footer en páginas públicas y ausente del panel privado**.
    - Motivo: el panel ya tiene navegación y cuenta; el footer institucional corresponde a las páginas públicas de acceso y portada.
    - Alternativa descartada: ocultarlo con CSS o un componente cliente según la ruta, que deja HTML innecesario en el panel.

## 11. Estrategia de tests

### 11.1 Unitarios puros (`node:test` + `node --experimental-strip-types`)

- `tests/courses/labels.test.ts`: etiquetas de ciclo, especialidad, turno y estado; fallback «No disponible»; opciones de formulario y orden de turnos.
- `tests/courses/access.test.ts`: `canManageCourses` para los tres roles, rol desconocido y valores nulos.
- `tests/courses/rules.test.ts`: año pasado, curso editable, `canDeleteCourse`, `canDeactivateCourse`, motivos de acciones deshabilitadas, curso con 0 inscriptos y curso con inscriptos.
- `tests/courses/list.test.ts`: búsqueda sin mayúsculas, acentos ni espacios sobrantes; filtros combinados; año «all»; orden por año descendente, cursada, división numérica o alfabética, turno, ciclo, especialidad y desempate por id; paginación con página fuera de rango; resumen; filtros por defecto con año actual presente/ausente y limpieza.
- `tests/courses/filters-url.test.ts`: parseo y serialización de parámetros; conservación de parámetros ajenos; año inválido; página inválida; normalización de valores desconocidos; `sanitizeReturnPath` contra rutas externas y `//`.
- `tests/courses/validation.test.ts`: año actual y futuro, año pasado inválido; cursada 0, 1, 6 y 7; división vacía, solo espacios, 1, 10 y 11 caracteres; enums inválidos; capacidad 0, negativa, decimal, igual y menor que la actual; payload exacto de siete claves; lectura de `FormData`; mapeo y traducción de errores por campo.
- `tests/courses/selection.test.ts`: alternar uno o varios cursos, seleccionar todos los filtrados, limpiar, conservar selección al cambiar filtros/página y descartar identificadores ausentes.
- `tests/courses/menu-position.test.ts`: apertura hacia abajo, hacia arriba cerca del borde inferior, límites horizontales y viewport pequeño.

### 11.2 API (`tests/api/courses.test.ts`)

Se usa `fetchImpl` inyectable o `globalThis.fetch` simulado, como en `tests/api/me.test.ts` y `tests/api/password-recovery.test.ts`.

- Parseo de listado, detalle, reporte con `header.totalInscriptions`, clonación por año y curso, y eliminación `204` lógica.
- `422` con `errors` por campo, `422` de eliminación con `error`, `401`, `403`, `404`, `5xx`, cuerpo inválido, red y timeout.
- URL, método, headers `Authorization` y `Content-Type`, cuerpo exacto, `credentials`, `cache`, `redirect` y timeout.
- Recorrido de paginación: primera página con `last_page` mayor a 1, segunda solicitud, concatenación y tope de 100 páginas.
- Clonación: `cloned: 0`, resultado parcial, conservación de capacidad máxima y estado en el curso devuelto.
- Configuración ausente: no llama a `fetch` y registra solo en servidor con etiqueta `[courses]`.

### 11.3 Acciones (`tests/actions/courses.test.ts`)

Se prueban los caminos sin redirección, igual que las acciones existentes.

- Errores locales: cero llamadas a `fetch`, errores por campo y valores conservados.
- `401`, `403`, `422`, `404`, `5xx`, red y timeout: estados correctos y sin éxito simulado.
- Payloads exactos de crear, editar, eliminar, clonar y cambiar estado.
- Eliminación bloqueada con `currentCapacity > 0` y permitida con 0; desactivación bloqueada con inscriptos.
- Edición rechazada en años pasados; código devuelto o «Sin código» en el mensaje de éxito.
- `cloned: 0` se informa como «no se creó ningún curso»; resultado parcial conserva la cantidad creada.
- La redirección de éxito y la revalidación se cubren en E2E, no en unitarios.

### 11.4 E2E (fase posterior, Playwright + backend simulado)

- Acceso por rol: `ADMINISTRATIVO` y `ADMINISTRADOR` ven «Cursos» activo; `TUTOR` no lo ve y por URL recibe acceso denegado.
- Listado: tarjetas, filtros combinados, limpiar, paginación, orden, estados vacío y error.
- Detalle: datos, reporte, sin mezcla de cursos, reporte vacío y error de reporte.
- Crear: éxito, `422`, `401`, `403`, `5xx`, doble envío y conservación de valores.
- Editar: éxito, capacidad menor a la actual, colisión de combinación, `404` y refresco del detalle.
- Clonar curso y clonar año: diálogos, año de destino, solo años anteriores en la clonación masiva, cero clonados, resultado parcial, duplicados y doble envío.
- Eliminar: deshabilitado con inscriptos, habilitado con 0, confirmación, `204` lógico, `422` de respaldo, cancelación y ajuste de página.
- Editar: curso de año pasado deshabilitado; curso actual/futuro con código nuevo cuando cambia la combinación.
- Reporte: total de `header.totalInscriptions`, orden secuencial, alumno «Apellido, Nombre», faltantes «No informado», carga independiente y precedencia `401`/`403`/`404`/`5xx`.
- Listado: año actual ausente, página fuera de rango, empates de orden, valores desconocidos y mutaciones fuera del filtro.
- Activar/desactivar: `200` y `5xx` sin cambio local; desactivación bloqueada con inscriptos.
- Accesibilidad, texto al 200 %, responsive de 320 a 1920 px, colores forzados, reducción de movimiento y privacidad del token.

### 11.5 Comandos de verificación

- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `node --experimental-strip-types --test tests/courses/*.test.ts tests/api/courses.test.ts tests/actions/courses.test.ts` y luego la suite completa.
- `pnpm build`
- E2E con `next dev` o `next start`, backend simulado y Playwright.
- API: `php artisan test --filter=CourseAuthorizationTest` y suite completa.

### 11.6 Autorización del backend

- `eet3100-inscripciones-api/tests/Feature/CourseAuthorizationTest.php`: ADMINISTRADOR y ADMINISTRATIVO acceden a lectura y escritura; TUTOR accede a lectura y recibe `403` en escritura.
- Verificar `GET /api/courses` con un token ADMINISTRADOR antes y después de la corrección.

## 12. Matriz de cobertura de requisitos

| RF | Dónde se cumple |
|---|---|
| RF-1 a RF-7 | `navigation.ts`, `page.tsx`, `guard.ts`, `course-state.ts`, metadata y `PrivateShell` |
| RF-8 a RF-13 | `courses-header.tsx`, `course-breadcrumb.tsx`, `courses-view.tsx` |
| RF-14 a RF-18 | `course-summary-cards.tsx`, `list.ts`, estados de carga y error |
| RF-19 a RF-26 | `course-filters.tsx`, `list.ts`, `filters-url.ts`, `courses-view.tsx` |
| RF-27 a RF-35 | `course-table.tsx`, `course-status-badge.tsx`, `list.ts`, `course-state.ts` |
| RF-36 a RF-48 | `course-row-actions.tsx`, diálogos, `actions/courses.ts`, `course-state.ts` |
| RF-49 a RF-55 | `[courseId]/page.tsx`, `course-detail.tsx`, `course-breadcrumb.tsx`, `course-not-found.tsx` |
| RF-56 a RF-63 | `course-inscriptions-table.tsx`, `data.ts`, `api/courses.ts` |
| RF-64 a RF-72 | `new/page.tsx`, `course-form.tsx`, `validation/course.ts`, `actions/courses.ts` |
| RF-73 a RF-77 | `clone-course-dialog.tsx`, `actions/courses.ts` |
| RF-78 a RF-84 | `clone-year-dialog.tsx`, `actions/courses.ts` |
| RF-85 a RF-88 | `course-notice.tsx`, `course-row-actions.tsx`, `courses-header.tsx` |
| RF-89 a RF-101 | `[courseId]/edit/page.tsx`, `course-form.tsx`, `validation/course.ts`, `actions/courses.ts` |
| RF-102 a RF-106 | `rules.ts`, `course-row-actions.tsx`, `delete-course-dialog.tsx`, `course-inscriptions-table.tsx`, metadata y rutas |
| RF-107 a RF-109 | `selection.ts`, `course-table.tsx`, `course-selection-bar.tsx`, `courses-view.tsx` |
| RF-110 | `menu-position.ts`, `course-row-actions.tsx` |
| RF-111 | `app/layout.tsx`, páginas públicas y `PrivateShell` |
| RF-112 | `CheckRole.php`, `routes/api.php` y `CourseAuthorizationTest.php` |
| RF-113 | `course-notice.tsx`, `courses-view.tsx` y `course-detail-notice.tsx` |

## 13. Cobertura de requisitos no funcionales

| RNF | Cómo se cumple |
|---|---|
| RNF-1 a RNF-4 | Tablas semánticas, foco visible, nombres accesibles, texto más forma y contraste con tokens existentes |
| RNF-5 a RNF-7 | Layout responsive, scroll interno de tabla, texto base de 14 px y prueba al 200 % |
| RNF-8 | Paleta y radios institucionales; bordes negros de máximo 1 px, sombras de hasta 12 % de opacidad, máximo tres acentos y sin bloques duplicados |
| RNF-9 | Indicador de progreso en menos de 100 ms y timeout de 10 s en la capa API |
| RNF-10 y RNF-11 | `no-store`, páginas dinámicas, sin ISR y token solo en cookie `httpOnly` |
| RNF-12 | Sin dependencias nuevas; solo se permite la corrección de autorización multirrol del backend |
| RNF-13 | Metadata, breadcrumb y `loading`/`error` por segmento en las cuatro rutas |
| RNF-14 y RNF-15 | Diálogos con foco atrapado, sin cierre durante operación y `motion-reduce` |
| RNF-16 | Estados locales solo tras respuestas exitosas |
| RNF-17 | Traducción de errores conocidos por campo, mensaje fijo para eliminación y aviso general para desconocidos |
| RNF-18 | Solo los campos de alumno que entrega el reporte |
| RNF-19 | Una acción por contexto, con excepciones explícitas para «Crear curso», «Editar» y los dos alcances de reporte |
| RNF-20 | Hasta 10 000 cursos simulados o error controlado; carga completa en menos de 10 s o error sin datos parciales |
| RNF-21 y RNF-22 | Textos en español y estilos para colores forzados |

## 14. Riesgos y mitigaciones

- **Paginación real desconocida**: el backend puede ignorar `per_page=100`. Mitigación: seguir `meta.last_page` y concatenar; probar con un mock que devuelva varias páginas.
- **Volumen del conjunto completo**: muchos cursos aumentan el payload RSC. Mitigación: tope de 100 páginas, tratamiento como error si se supera, y medición en E2E con datos representativos.
- **Desactivación o eliminación con capacidad ocupada**: la interfaz deshabilita la acción; si el backend rechaza igualmente, se trata como error genérico y no se cambia el estado mostrado.
- **Curso con 0 inscriptos y solicitudes pendientes**: el frontend no puede verlas; la eliminación se rige por la respuesta del backend y se documenta en la spec.
- **Clonación parcial o con duplicados**: la interfaz muestra `cloned` y los cursos creados, sin inventar motivos; ante error refresca el listado.
- **Contrato de clonación**: se asume que conserva capacidad máxima y estado; verificar con el backend o el mock antes de implementar.
- **Mensajes de validación en inglés**: la traducción puede quedar incompleta. Mitigación: mapa de patrones conocidos y aviso general para lo desconocido.
- **Año actual en cliente y servidor**: puede diferir en el cambio de año. Mitigación: el servidor calcula el año y lo pasa como prop; las acciones lo recalculan al validar.
- **Estado cliente tras revalidar**: el refresco puede resetear filtros. Mitigación: filtros y página viven en la URL y se reconstruyen desde ella; pruebas E2E de operaciones de fila.
- **Ediciones concurrentes**: no hay control optimista; la última escritura confirmada prevalece y se prueba que la interfaz no invente éxito.
- **Importaciones con `@/`**: Turbopack no las resuelve en build. Mitigación: rutas relativas con extensión.
- **Clases Tailwind en documentación**: evitar placeholders con puntos suspensivos dentro de corchetes; describir estilos en lenguaje natural.
- **Menú recortado por el scroll de la tabla**: el menú debe usar portal y posición fija; se prueba en la última fila y cerca del borde inferior.
- **Selección desincronizada tras refrescar**: se conserva por identificador y se depura contra el conjunto actual; no se persiste entre recargas.

## 15. Orden de implementación propuesto

`tasks.md` contiene la base T1–T55, la Fase M (T56–T62) de la revisión QA y la Fase N (T63–T71) de la revisión 2026-10-31. El orden previsto es:

1. Tipos, reglas de elegibilidad, etiquetas, acceso y funciones puras de listado, filtros y validación, con tests.
2. Cliente API de cursos, con tests de parseo y solicitudes.
3. Cargas de servidor, guardia de sesión/rol y estados de página.
4. Server Actions, con tests de caminos de error y reglas de eliminación/edición.
5. Habilitación de «Cursos» en el menú lateral y actualización de tests.
6. Listado, tarjetas, filtros, tabla, paginación, página normalizada y estados.
7. Detalle, inscripciones, reporte con total y estados.
8. Formularios de creación y edición, incluido el bloqueo de años pasados.
9. Diálogos de clonación, eliminación y estado.
10. Accesibilidad, responsive, E2E y cierre técnico de la revisión QA.
11. Corrección de autorización multirrol en la API y tests HTTP.
12. Quitar «Código» del listado y ajustar la descripción accesible de fila.
13. Modelo de selección y casillas individual/cabecera.
14. Barra de selección y «Enviar notificación — Próximamente».
15. Aviso de éxito de 4 segundos y menú de acciones en portal.
16. Footer en páginas públicas.
17. Paginación de 10 cursos, E2E y cierre de la revisión 2026-10-31.
