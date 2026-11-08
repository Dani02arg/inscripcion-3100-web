# Tareas 010 — Gestión de cursos

Estado: aprobado (revisión QA 2026-10-30 y revisión 2026-10-31)

Spec: `specs/010-cursos/spec.md` (aprobada con revisión 2026-10-31).
Plan: `specs/010-cursos/plan.md` (aprobado con revisión 2026-10-31).

## Reglas de ejecución

- Una tarea por vez: tests primero, código, verde, marcar y detenerse.
- No se implementa nada fuera de la spec 010 ni del plan.
- Sin dependencias nuevas. Solo se permite la corrección de autorización multirrol del backend; no se cambia el contrato de cursos.
- Verificación por tarea: `pnpm exec tsc --noEmit` y `pnpm lint`.
- Tests unitarios con `node --experimental-strip-types --test` e imports relativos con `.ts`/`.tsx`.
- E2E con `pnpm dev` o `pnpm start`, `LARAVEL_API_URL` apuntando a un mock local y Playwright headless.
- Al cerrar cada tarea se actualiza `MEMORY.md`.
- No se escriben clases de Tailwind con sintaxis insegura en archivos Markdown.
- Textos visibles y comentarios en español; identificadores, tipos y rutas en inglés.
- Ninguna operación se marca como exitosa sin respuesta exitosa del backend.
- No se usan datos de ejemplo, cursos ficticios ni métricas inventadas.
- Cursos con `currentCapacity > 0`: «Eliminar» y «Desactivar» deshabilitados.
- Curso con `currentCapacity = 0`: «Eliminar» habilitado y eliminación lógica.
- Cursos de años pasados: solo lectura; «Editar» deshabilitado.
- Clonación: copia capacidad máxima y estado; masiva solo desde años anteriores.
- Sin reasignación de inscriptos ni borrado físico.
- El listado no muestra «Código»; la selección es visual y «Enviar notificación» queda «Próximamente».
- Los avisos de éxito se ocultan a los 4 segundos; los errores permanecen hasta cierre manual.
- El menú de acciones no puede quedar recortado por la tabla.
- El footer institucional se muestra solo en el home público `/home`.

## Fase A — Base de dominio

- [x] **T1. Tipos del dominio de cursos.**
  RF-27, RF-50, RF-57, RF-89, RF-102
  - Hecho cuando: `app/lib/courses/types.ts` define curso, enums, filtros, paginación, resumen, reporte con `totalInscriptions`, resultados de API, estados de página/acción, `CourseDeleteEligibility`, `CourseEditEligibility` y motivos accesibles; compila sin `any` y `tsc --noEmit` queda limpio.
  - Verificado el 2026-10-30: `app/lib/courses/types.ts` creado con tipos de curso, filtros, paginación, resumen, reporte, resultados de API, estados de página/acción y elegibilidad; `pnpm exec tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T2. Etiquetas, opciones y orden de turnos.**
  RF-28, RF-30, RNF-21
  - Hecho cuando: `app/lib/courses/labels.ts` traduce ciclo, especialidad, turno y estado, usa «No disponible» como fallback y `tests/courses/labels.test.ts` pasa con opciones, etiquetas y orden «Mañana, Tarde, Noche».
  - Verificado el 2026-10-30: etiquetas, opciones de formulario/filtro, type guards y orden de ciclo/especialidad/turno implementados; 7/7 tests en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T3. Acceso por rol.**
  RF-1, RF-2, RF-4, RF-87
  - Hecho cuando: `app/lib/courses/access.ts` autoriza solo `ADMINISTRATIVO` y `ADMINISTRADOR`, rechaza `TUTOR` y roles desconocidos, y `tests/courses/access.test.ts` pasa.
  - Verificado el 2026-10-30: `COURSE_MANAGER_ROLES`, `isCourseManagerRole` y `canManageCourses`; 4/4 tests en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

## Fase B — Lógica pura del listado

- [x] **T4. Búsqueda normalizada.**
  RF-19, RF-22
  - Hecho cuando: `normalizeSearch` y `buildCourseSearchText` ignoran mayúsculas, acentos y espacios sobrantes, incluyen código y texto legible, y los tests de búsqueda pasan.
  - Verificado el 2026-10-30: `app/lib/courses/list.ts` con normalización NFD, colapso de espacios y texto de búsqueda desde código, año, cursada, división y etiquetas; 7/7 tests en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T5. Filtros combinados, valores por defecto y limpieza.**
  RF-20, RF-22, RF-24, RF-26
  - Hecho cuando: `filterCourses`, `getDefaultFilters` y `clearFilters` aplican año, ciclo, especialidad, turno y búsqueda en conjunto, y los tests cubren combinaciones, «all», año actual y ausencia de resultados.
  - Verificado el 2026-10-30: filtrado combinado, año actual presente/ausente, «Todos los años» y limpieza implementados; `tests/courses/list.test.ts` 16/16 en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T6. Orden del listado.**
  RF-29
  - Hecho cuando: `sortCourses` ordena por año descendente, cursada ascendente, división numérica o alfabética, turno «Mañana, Tarde, Noche», ciclo «Básico, Superior», especialidad «Básica, Informática, Electrónica» y desempata por identificador, con tests de cada criterio y de «01» vs «1».
  - Verificado el 2026-10-30: orden completo con desempates, valores desconocidos al final y sin mutar la entrada; `tests/courses/list.test.ts` 25/25 en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T7. Paginación, resumen y filtros por defecto.**
  RF-14, RF-15, RF-16, RF-24, RF-31
  - Hecho cuando: `paginateCourses` devuelve 15 por página, página válida ajustada a `1..páginas`, total y páginas; `summarizeCourses` devuelve total, activos y suma de capacidad; `getDefaultFilters`/`clearFilters` usan el año actual si existe y «Todos los años» si no; los tests cubren página fuera de rango, cero, año ausente y valores reales.
  - Verificado el 2026-10-30: paginación con tamaño por defecto/ajustado, página fuera de rango, conjunto vacío, resumen real y capacidad inválida; `tests/courses/list.test.ts` 33/33 en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T8. Filtros en la URL y ruta de retorno.**
  RF-25, RF-51
  - Hecho cuando: `parseCourseFilters` y `serializeCourseFilters` leen y escriben `q`, `year`, `cycle`, `speciality`, `shift` y `page`, ignoran valores inválidos, `sanitizeReturnPath` solo acepta rutas internas del listado, y `tests/courses/filters-url.test.ts` pasa con valores inválidos, externos y `//`.
  - Verificado el 2026-10-30: parseo/serialización de filtros y página, defaults por año, conservación de parámetros ajenos y saneamiento de retorno contra externos, `//`, backslashes y subrutas; 13/13 tests en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

## Fase C — Validación

- [x] **T9. Validación de curso y payload.**
  RF-64, RF-65, RF-66, RF-90, RF-91, RF-92, RF-93
  - Hecho cuando: `validateCourseInput` cubre año actual/futuro, curso de año pasado no editable, cursada 1–6, división recortada 1–10 y no solo espacios, enums y capacidad positiva; rechaza capacidad menor a la actual; `buildCoursePayload` devuelve exactamente las siete claves y `tests/courses/validation.test.ts` pasa.
  - Verificado el 2026-10-30: validación de año, bloqueo de año pasado, cursada, división, enums, capacidad y mínimo respecto de la actual; payload exacto de siete claves; 10/10 tests en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T10. Lectura de formularios y errores del backend.**
  RF-69, RF-72, RF-96, RF-100, RNF-17
  - Hecho cuando: `readCourseFormData`, `mapCourseFieldErrors` y `translateCourseFieldErrors` leen los siete campos, traducen errores conocidos, descartan claves desconocidas y los tests cubren `422` por campo y mensajes en inglés.
  - Verificado el 2026-10-30: lectura de los siete campos con ausentes normalizados, mapeo de errores anidados/directos, descarte de claves ajenas y traducción de mensajes conocidos con aviso general para desconocidos; 16/16 tests en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

## Fase D — Cliente API

- [x] **T11. Parseo de curso y listado.**
  RF-27, RF-28, RF-34, RF-53, RF-55, RF-86
  - Hecho cuando: `parseCourse` y `parseCourseListResponse` validan `data`, `meta`, números, estado, código ausente, enums desconocidos y cuerpo inválido, con tests en verde.
  - Verificado el 2026-10-30: `app/lib/api/courses.ts` con parseo de curso, meta paginada, availablePlaces derivado, enums desconocidos conservados y clasificación `401`/`403`/error; 10/10 tests en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T12. Parseo de reporte, clonación y eliminación.**
  RF-45, RF-46, RF-56, RF-57, RF-61, RF-63, RF-81, RF-82
  - Hecho cuando: los parsers de reporte, clonación por curso, clonación por año y eliminación aceptan `header.totalInscriptions`, `204` lógico, `422` con `error`, `cloned: 0`, resultado parcial, filas incompletas, capacidad máxima y estado del clon, y cuerpos inválidos, con tests en verde.
  - Verificado el 2026-10-30: `parseCourseReportResponse`, `parseCloneCourseResponse`, `parseCloneYearResponse` y `parseDeleteResponse`; total opcional, filas incompletas, clon cero/parcial, eliminación lógica y fallos `401`/`403`/`404`/`422`; 20/20 tests en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T13. Cliente HTTP y listado completo paginado.**
  RF-14, RF-34, RF-35, RNF-9, RNF-10
  - Hecho cuando: las solicitudes usan `Bearer`, `no-store`, `redirect: manual` y timeout de 10 s; `listCoursesPage` y `listAllCourses` siguen `meta.last_page`, respetan el tope de 100 páginas y los tests verifican URL, headers, timeout, concatenación y configuración ausente.
  - Verificado el 2026-10-30: `listCoursesPage` y `listAllCourses` con `per_page=100`, `page`, Bearer, `no-store`, `redirect: manual`, timeout, concatenación de páginas, tope de 100 y fallo sin datos parciales; 26/26 tests en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T14. Lecturas de detalle y reporte.**
  RF-34, RF-49, RF-50, RF-55, RF-56, RF-63
  - Hecho cuando: `getCourse` y `getCourseReport` clasifican éxito, `401`, `403`, `404`, `5xx`, red y timeout, y los tests verifican método, ruta y respuesta.
  - Verificado el 2026-10-30: `parseCourseResponse`, `getCourse` y `getCourseReport` con Bearer, ruta codificada, timeout, clasificación de errores y parseo del reporte; 31/31 tests en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T15. Escrituras de cursos.**
  RF-68, RF-70, RF-75, RF-76, RF-83, RF-97, RF-98
  - Hecho cuando: crear, editar, eliminar, clonar curso, clonar año y activar/desactivar usan método, ruta y payload del contrato; los tests cubren `201`, `200`, `204`, `422`, `5xx`, red y timeout.
  - Verificado el 2026-10-30: `createCourse`, `updateCourse`, `deleteCourse`, `cloneCourse`, `cloneCoursesByYear` y `setCourseStatus` con POST/PATCH/DELETE, payload exacto, `201`/`200`/`204`, `422` de validación/conflicto, `5xx`, red y timeout; 39/39 tests en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T16. Verificación integral del cliente API.**
  RF-34, RF-45, RF-63, RF-75, RF-83
  - Hecho cuando: `tests/api/courses.test.ts` reúne todos los endpoints y casos de error, pasa completo, `tsc --noEmit` está limpio y `pnpm lint` no agrega errores.
  - Verificado el 2026-10-30: listado, detalle, reporte, creación, edición, eliminación, clonación individual/masiva y activación/desactivación cubiertos; 39/39 tests en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

## Fase E — Servidor, sesión y estados

- [x] **T17. Estados de página y de acción.**
  RF-17, RF-18, RF-34, RF-54, RF-55, RF-63, RF-85, RF-88
  - Hecho cuando: `course-state.ts` mapea listo, cargando, vacío, no encontrado, denegado, error y éxito sin inventar datos, y sus tests cubren cada estado.
  - Verificado el 2026-10-30: `toCourseListState`, `toCourseDetailState`, `toCourseReportState` y `toCourseActionState` con estados iniciales, éxito, vacío, validación, conflicto, denegado, no encontrado y error; 8/8 tests en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T18. Guardia de sesión y rol.**
  RF-3, RF-4, RF-5, RF-6, RF-87
  - Hecho cuando: `guard.ts` obtiene la sesión, exige rol autorizado, redirige a `/session-expired` sin token y no llama a la API con rol insuficiente; los tests de rol pasan y la redirección se verifica en E2E.
  - Verificado el 2026-10-30: `guard.ts` con `getCoursePageAccess` y `getCourseActionAccess`, decisión pura en `guard-decision.ts`, redirección a `/session-expired` y bloqueo de roles sin permiso; 3/3 tests de rol en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes). La redirección E2E se valida en T53/T54.

- [x] **T19. Cargadores de servidor memoizados.**
  RF-6, RF-7, RF-50, RF-55, RF-63, RNF-13
  - Hecho cuando: `data.ts` expone listado, curso y reporte con `cache()`, sin `fetch` en componentes, y `tsc --noEmit` queda limpio.
  - Verificado el 2026-10-30: `getCourseListData`, `getCourseData` y `getCourseReportData` memoizados con `cache()` sobre el cliente API; `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

## Fase F — Server Actions

- [x] **T20. Acción de creación.**
  RF-64, RF-65, RF-66, RF-67, RF-68, RF-69, RF-70, RF-71, RF-72
  - Hecho cuando: la acción aplica los defaults de creación, revalida, no llama a la API con errores locales, envía el payload exacto, redirige con el código o «Sin código» tras `201`, y devuelve errores por campo o mensaje ante `422`, `401`, `403`, `5xx`, red y timeout.
  - Verificado el 2026-10-30: `createCourseActionCore` con defaults, validación local sin API, guardia de rol, payload exacto, revalidación, redirección con código, `422` por campo, conflicto, `403`, `404`, `5xx` y `401` a `/session-expired`; 6/6 tests en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T21. Acción de edición.**
  RF-89, RF-90, RF-91, RF-92, RF-93, RF-94, RF-95, RF-96, RF-97, RF-98, RF-99, RF-100, RF-101
  - Hecho cuando: la acción rechaza cursos de años pasados, valida con `currentCapacity`, envía los siete campos por `PATCH`, redirige según `from` tras `200`, informa el código devuelto o «Sin código», resuelve `404` y conserva valores ante `422` sin asumir éxito.
  - Verificado el 2026-10-30: `updateCourseActionCore` con rechazo de años pasados, capacidad mínima, PATCH exacto, retorno saneado a lista o detalle, código nuevo, `404`, `403`, `5xx`, `401` y conservación de valores ante `422`; 13/13 tests en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T22. Acciones de eliminación y estado.**
  RF-41, RF-42, RF-43, RF-44, RF-45, RF-46, RF-47, RF-48
  - Hecho cuando: eliminar exige `currentCapacity === 0`, distingue `204` lógico de `422`, activar/desactivar usan `show`/`hide`, desactivar exige capacidad cero, un `5xx` no cambia el estado mostrado y todas revalidan el listado.
  - Verificado el 2026-10-30: `deleteCourseActionCore` y `setCourseStatusActionCore` con capacidad cero, rechazo con inscriptos, `204`/`422`, `show`/`hide`, revalidación de lista/detalle, `5xx` sin revalidar y `401` a `/session-expired`; 20/20 tests en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T23. Acción de clonación individual.**
  RF-40, RF-73, RF-74, RF-75, RF-76, RF-77
  - Hecho cuando: la acción valida el año destino actual o futuro, envía solo `{ year }`, devuelve el código nuevo o «Sin código» tras `201`, conserva capacidad máxima y estado, y muestra el rechazo ante combinación duplicada.
  - Verificado el 2026-10-30: `cloneCourseActionCore` valida año actual/futuro, bloquea años pasados o inválidos sin API, envía solo `{ year }`, revalida lista y nuevo detalle, devuelve código, conserva capacidad máxima/estado y clasifica conflicto, `5xx` y `401`; 24/24 tests en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T24. Acción de clonación masiva.**
  RF-12, RF-78, RF-79, RF-80, RF-81, RF-82, RF-83, RF-84
  - Hecho cuando: la acción exige `oldYear < currentYear`, usa `/api/courses/clone/{oldYear}`, devuelve mensaje, `cloned`, cursos creados e intentados, informa cero cursos creados sin inventar motivo y refresca el listado ante error.
  - Verificado el 2026-10-30: `cloneYearActionCore` valida `oldYear < currentYear`, envía `attempted`, revalida lista y cursos creados, fija el mensaje de cero clones, rechaza años inválidos sin API, bloquea roles sin permiso, refresca ante error y redirige ante `401`; 29/29 tests en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T25. Tests de acciones.**
  RF-66, RF-69, RF-70, RF-75, RF-83, RF-93, RF-96, RF-98
  - Hecho cuando: `tests/actions/courses.test.ts` verifica cero llamadas con datos inválidos, payloads exactos y estados `401`, `403`, `404`, `422`, `5xx`, red y timeout, con `tsc` y lint limpios.
  - Verificado el 2026-10-30: la suite cubre creación, edición, eliminación, estado, clonación individual/masiva, cero llamadas con datos inválidos, payloads exactos y estados `401`/`403`/`404`/`422`/`5xx`; red y timeout están cubiertos en `tests/api/courses.test.ts`. 31/31 tests de acciones en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

## Fase G — Menú lateral

- [x] **T26. Habilitar «Cursos» en el menú lateral.**
  RF-1, RF-2, RF-3
  - Hecho cuando: `app/lib/sidebar/navigation.ts` habilita «Cursos» con `/dashboard/courses` y coincidencia por prefijo para `ADMINISTRATIVO` y `ADMINISTRADOR`, `TUTOR` queda intacto y `tests/sidebar/navigation.test.ts` valida opciones habilitadas y estado activo en la ruta y subpantallas.
  - Verificado el 2026-10-30: «Cursos» habilitado con prefijo para ambos roles administrativos, `TUTOR` intacto, activo en listado/creación/detalle/edición y no activo en rutas ajenas; 17/17 tests de navegación en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

## Fase H — Listado

- [x] **T27. Breadcrumb y encabezado del listado.**
  RF-8, RF-9, RF-10, RF-11, RF-13, RF-85
  - Hecho cuando: se muestran breadcrumb, título, descripción y las tres acciones; «Crear curso» abre el formulario, «Clonar cursos» abre el diálogo y «Generar reporte» aparece no disponible con «Próximamente».
  - Verificado el 2026-10-30: `course-breadcrumb.tsx` accesible y `courses-header.tsx` con breadcrumb, título, descripción, «Crear curso» hacia `/dashboard/courses/new`, callback de clonación masiva y «Generar reporte» con «Próximamente» y descripción accesible. Integración en la página del listado en T32; `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T28. Tarjetas de resumen.**
  RF-14, RF-15, RF-16, RF-17, RF-18
  - Hecho cuando: las cuatro tarjetas muestran total, año, activos y capacidad calculados del conjunto filtrado, con estados de carga, error y cero sin cifras inventadas.
  - Verificado el 2026-10-30: `course-summary-cards.tsx` con cuatro tarjetas, año seleccionado o «Todos los años», capacidad no disponible, carga sin cifras y error sin datos inventados. `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T29. Filtros del listado.**
  RF-19, RF-20, RF-21, RF-22, RF-23, RF-24, RF-26
  - Hecho cuando: buscador, año, ciclo, especialidad y turno actualizan tabla, tarjetas y paginación sin recargar, vuelven a la página 1 y «Limpiar filtros» restablece los valores definidos.
  - Verificado el 2026-10-30: `course-filters.tsx` con buscador y selects controlados de año/ciclo/especialidad/turno, valores del contrato, «Todas»/«Todos los años» y «Limpiar filtros»; la vista que los integra (T32) resuelve la página 1 y el filtrado sin recarga. `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T30. Tabla y estado visual.**
  RF-27, RF-28, RF-29, RF-30, RF-35
  - Hecho cuando: la tabla muestra las nueve columnas, traduce los valores, respeta el orden con desempates, identifica cada fila por su identificador interno y muestra el estado con texto e indicador accesible.
  - Verificado el 2026-10-30: `course-table.tsx` con las nueve columnas, caption y encabezados, filas por `id` interno con nombre accesible, etiquetas traducidas y acciones inyectables; `course-status-badge.tsx` con texto, color y punto no dependiente solo del color. `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T31. Paginación y estados de la tabla.**
  RF-31, RF-32, RF-33, RF-34
  - Hecho cuando: hay 15 filas por página con controles accesibles, página ajustada a `1..última`, esqueleto sin filas ficticias, estado vacío global y por filtros, y error con «Reintentar» que distingue `401` y `403`.
  - Verificado el 2026-10-30: `course-pagination.tsx` con página ajustada, total de resultados y controles anterior/siguiente; `course-skeletons.tsx` con esqueleto accesible y `motion-reduce`; `course-table-states.tsx` con vacío global/por filtros y error que distingue sesión vencida, acceso denegado y fallo con «Reintentar». La integración en la vista coordinadora queda para T32. `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T32. Página y vista coordinadora del listado.**
  RF-6, RF-7, RF-21, RF-25, RF-33, RF-34, RF-35
  - Hecho cuando: la página de servidor carga cuenta y cursos, valida el rol, pasa filtros iniciales, la vista sincroniza filtros y página con la URL, normaliza valores inválidos y el listado compila y se genera en `pnpm build`.
  - Verificado el 2026-10-30: `app/dashboard/courses/page.tsx` valida acceso, carga cursos con `getCourseListData`, calcula años y filtros iniciales y resuelve `forbidden`/error/`401`; `courses-view.tsx` filtra, ordena, pagina, resume y sincroniza URL con `replaceState` sin recargar. `tsc --noEmit` limpio, `pnpm lint` 0 errores (5 avisos preexistentes) y `pnpm build` en verde con `/dashboard/courses` dinámica.

- [x] **T33. Menú de acciones por fila.**
  RF-36, RF-37, RF-38, RF-39, RF-40, RF-85
  - Hecho cuando: el menú abre con puntero o teclado, enfoca la primera acción, cierra con Escape o foco fuera, devuelve el foco, ofrece Ver, Editar, Clonar, Activar/Desactivar y Eliminar con las deshabilitaciones por inscriptos o año pasado, y muestra «Generar reporte» como no disponible con nombres accesibles diferenciados.
  - Verificado el 2026-10-30: `course-row-actions.tsx` con apertura por puntero/teclado, foco inicial, flechas/Inicio/Fin, Escape, foco fuera, retorno al disparador, deshabilitaciones por año/inscriptos y reporte no disponible con nombre accesible del curso; integrado en `courses-view.tsx` con Ver/Editar por router. Los diálogos de clonar/eliminar/estado se conectan en T36–T39. `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T34. Avisos accesibles.**
  RF-88
  - Hecho cuando: éxitos se anuncian con `role="status"`, errores con `role="alert"`, el aviso se conserva hasta cerrarlo o cambiar de ruta, no se borra al paginar o filtrar y se puede descartar con teclado.
  - Verificado el 2026-10-30: `course-notice.tsx` con `role="status"`/`role="alert"`, cierre accesible por teclado y sin auto-ocultado; la vista conserva el aviso al filtrar/paginar y lo elimina de la URL al cerrarlo. Se muestran los avisos `created`/`updated` de crear/editar. `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

## Fase I — Diálogos y operaciones

- [x] **T35. Diálogo base reutilizable.**
  RF-41, RF-42, RNF-14
  - Hecho cuando: usa `<dialog>` con `showModal`, etiqueta accesible, foco atrapado, cierre con Escape, fondo inerte y retorno de foco al disparador.
  - Verificado el 2026-10-30: `course-dialog.tsx` usa `<dialog>` nativo con `showModal`, `aria-labelledby`/`aria-modal`, foco inicial, trampa de Tab, Escape controlado por `closeDisabled`, fondo inerte y retorno de foco al disparador. `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T36. Diálogo de eliminación.**
  RF-41, RF-45, RF-46, RF-47, RF-48
  - Hecho cuando: solo se ofrece con `currentCapacity === 0`, pide confirmación con código o «Sin código» y consecuencia lógica, bloquea doble envío, muestra el `422` de respaldo y actualiza y ajusta el listado tras `204`.
  - Verificado el 2026-10-30: `delete-course-dialog.tsx` usa `CourseDialog`, confirma código/consecuencia, envía `courseId` y `currentCapacity`, bloquea cierre y doble envío mientras está pendiente, muestra errores de respaldo y cierra con aviso de éxito; integrado en `courses-view.tsx` y enlazado desde el menú de fila. `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T37. Diálogo de activación y desactivación.**
  RF-42, RF-43, RF-44, RF-47, RF-48
  - Hecho cuando: desactivar solo se ofrece con `currentCapacity === 0` y confirma; activar se ejecuta sin confirmación adicional; se bloquean repeticiones, se informa éxito y ante `5xx` se conserva el estado mostrado sin asumir éxito.
  - Verificado el 2026-10-30: `status-dialog.tsx` confirma desactivación con `currentCapacity` cero, bloquea cierre/doble envío y muestra errores sin asumir éxito; la activación se ejecuta directa desde el menú con `useTransition`, guarda contra repeticiones y publica avisos de éxito/error. `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T38. Diálogo de clonación individual.**
  RF-40, RF-73, RF-74, RF-75, RF-76, RF-77
  - Hecho cuando: muestra código de origen o «Sin código», año destino por defecto, consecuencias con capacidad máxima y estado conservados, evita doble envío, informa el código nuevo o «Sin código» y muestra el rechazo por combinación existente.
  - Verificado el 2026-10-30: `clone-course-dialog.tsx` muestra origen y año destino por defecto, consecuencias y errores por año; bloquea cierre/doble envío, informa el código nuevo y muestra conflicto por combinación existente; integrado en `courses-view.tsx` y menú de fila. `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T39. Diálogo de clonación masiva.**
  RF-12, RF-78, RF-79, RF-80, RF-81, RF-82, RF-83, RF-84
  - Hecho cuando: ofrece solo años anteriores al actual con su cantidad, avisa destino fijo, bloquea confirmación sin años, informa cero clonados sin inventar motivo, informa resultado parcial y refresca el listado tras éxito o error.
  - Verificado el 2026-10-30: `clone-year-dialog.tsx` ofrece años anteriores con cantidad, destino fijo al año actual, consecuencias y `attempted`; bloquea envío sin años, usa el mensaje fijo de cero clones, informa resultado parcial y cierra con aviso; integrado en `courses-view.tsx` desde «Clonar cursos». El servidor revalida el listado ante éxito o error. `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

## Fase J — Detalle e inscripciones

- [x] **T40. Página y vista de detalle.**
  RF-6, RF-7, RF-49, RF-50, RF-51, RF-52, RF-55
  - Hecho cuando: muestra breadcrumb, datos completos, capacidades, estado, «Volver a cursos» y «Editar» habilitado solo para cursos editables, con metadata propia y sin `fetch` en la vista.
  - Verificado el 2026-10-30: `app/dashboard/courses/[courseId]/page.tsx` valida acceso, carga el curso memoizado, resuelve `401`/`forbidden`/`not_found`/error y pasa `from` saneado; `course-detail.tsx` muestra breadcrumb, datos, capacidades, estado, «Volver a cursos» y «Editar» solo para años actuales/futuros. `pnpm build` en verde con detalle dinámico; `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T41. Inscripciones activas.**
  RF-56, RF-57, RF-58, RF-59, RF-60, RF-61, RF-62, RF-63, RF-105
  - Hecho cuando: la sección muestra el total de `header.totalInscriptions` o «No disponible», N.º de orden secuencial, alumno «Apellido, Nombre», DNI, teléfono y correo del curso consultado; declara las limitaciones, no mezcla cursos, tiene carga independiente y resuelve vacío y error sin romper el detalle.
  - Verificado el 2026-10-30: `course-inscriptions-table.tsx` con total, orden secuencial, alumno «Apellido, Nombre», datos faltantes «No informado», ayuda, vacío y error local; `CourseInscriptionsSection` carga el reporte con Suspense y esqueleto independiente dentro del detalle. `pnpm build` en verde; `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T42. Estados del detalle.**
  RF-4, RF-53, RF-54, RF-55, RNF-13
  - Hecho cuando: curso inexistente, acceso denegado, carga y error se muestran dentro del armazón con enlace al listado y «Reintentar», sin perder el menú lateral.
  - Verificado el 2026-10-30: el detalle resuelve no encontrado y acceso denegado dentro de `PrivateShell` con enlace al listado; se agregan `loading.tsx` con esqueleto y `error.tsx` con «Reintentar» y «Volver a cursos». `pnpm build` en verde; `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

## Fase K — Formularios

- [x] **T43. Campo de selección accesible.**
  RF-64, RF-90, RNF-1
  - Hecho cuando: `SelectField` tiene etiqueta, ayuda, error, `aria-describedby`, foco visible y se usa en los formularios sin duplicar estilos.
  - Verificado el 2026-10-30: `app/ui/forms/select-field.tsx` con etiqueta, ayuda, error, `aria-describedby`, `aria-invalid`/`aria-required`, foco visible y estados disabled; ya reemplaza los selects duplicados de `course-filters.tsx` y se reutilizará en los formularios de curso. `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T44. Campos compartidos de curso.**
  RF-64, RF-90, RF-91
  - Hecho cuando: los siete campos comparten etiquetas y errores, el código, la capacidad actual y los cupos se muestran como no editables y los selects usan las opciones del contrato.
  - Verificado el 2026-10-30: `course-form-fields.tsx` comparte los siete campos con etiquetas/errores, `TextField`/`SelectField`, opciones de ciclo/especialidad/turno y cursada 1–6; en edición muestra código, capacidad actual y cupos como `readOnly`. `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T45. Formulario de creación.**
  RF-64, RF-65, RF-66, RF-67, RF-68, RF-69, RF-70, RF-71, RF-72
  - Hecho cuando: usa `useActionState`, aplica los defaults de creación, valida en vivo, muestra errores por campo y banner, conserva valores, indica envío, bloquea doble envío y no asume éxito ante error.
  - Verificado el 2026-10-30: `course-form.tsx` usa `createCourseAction`, defaults de creación, validación en vivo, errores por campo/banner, valores controlados, indicador de envío, bloqueo de doble envío y `CourseFormFields`; integración en la página de creación en T46. `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T46. Página de creación.**
  RF-7, RF-64, RF-68, RF-71
  - Hecho cuando: valida el rol, muestra metadata y valores por defecto, monta el formulario y «Cancelar» vuelve al listado sin enviar y conservando filtros.
  - Verificado el 2026-10-30: `app/dashboard/courses/new/page.tsx` valida acceso, expone metadata propia y monta `CourseForm` con defaults; `Cancelar` usa `returnTo` saneado desde el listado y el encabezado de la lista lo genera con la URL actual. `pnpm build` en verde con `/dashboard/courses/new` dinámica; `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T47. Formulario de edición.**
  RF-52, RF-89, RF-90, RF-91, RF-92, RF-93, RF-94, RF-95, RF-96, RF-97, RF-98, RF-99, RF-100, RF-101
  - Hecho cuando: no se ofrece en cursos de años pasados, precarga los valores actuales, exige capacidad mayor o igual a la actual, envía los siete campos, conserva valores ante error, refleja el resultado del backend sin actualizar antes de la respuesta e informa un posible código nuevo.
  - Verificado el 2026-10-30: `course-form.tsx` precarga el curso, oculta metadatos no editables, envía los siete campos y datos de contexto, valida capacidad mínima, conserva valores y no actualiza antes de la respuesta; los cursos pasados muestran solo el motivo. El detalle muestra el aviso `updated` con el código devuelto. `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T48. Página de edición.**
  RF-7, RF-52, RF-89, RF-97
  - Hecho cuando: carga el curso, valida el rol, resuelve `404`, muestra metadata propia, monta el formulario y permite cancelar sin cambios.
  - Verificado el 2026-10-30: `[courseId]/edit/page.tsx` valida acceso, carga el curso, resuelve `401`/forbidden/not_found/error, muestra metadata y breadcrumb, monta `CourseForm` en modo edición y «Cancelar» vuelve a lista o detalle sin enviar. `pnpm build` en verde con la ruta dinámica; `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T49. Carga y error de formularios.**
  RF-55, RNF-13
  - Hecho cuando: las rutas de creación y edición tienen esqueleto accesible y límite de error con «Reintentar» y enlace de regreso.
  - Verificado el 2026-10-30: `new/loading.tsx`, `new/error.tsx`, `[courseId]/edit/loading.tsx` y `[courseId]/edit/error.tsx` con esqueleto accesible y `CourseFormError` (`Reintentar` + `Volver a cursos`). `pnpm build` en verde; `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

## Fase L — Calidad y cierre

- [x] **T50. Accesibilidad.**
  RNF-1, RNF-2, RNF-3, RNF-4, RNF-14, RNF-22
  - Hecho cuando: árbol AX correcto, tablas con encabezados, menús y diálogos con teclado, foco visible, contraste mínimo y estado perceptible con colores forzados.
  - Verificado el 2026-10-30 con Playwright y mock local: árbol AX con breadcrumb, regiones, tabla/caption/encabezados y diálogo etiquetado; menú por fila abre con teclado, navega con flechas/Inicio/Fin, cierra con Escape y devuelve foco; diálogo atrapa Tab, cierra con Escape y devuelve foco. Se corrigió el contraste de encabezados de tabla, texto deshabilitado del reporte, etiquetas de detalle, estado desconocido y aviso de error. Foco visible y estado con `forced-colors` verificados. `pnpm build`, `tsc --noEmit` y `pnpm lint` en verde (5 avisos preexistentes).

- [x] **T51. Responsive y texto ampliado.**
  RNF-5, RNF-6, RNF-7, RNF-8
  - Hecho cuando: no hay desborde de página ni solapamientos entre 320 y 1920 px, la tabla desplaza su contenido dentro del contenedor, el texto base no baja de 14 px y al 200 % no se pierde contenido.
  - Verificado el 2026-10-30 con Playwright y mock local: listado, detalle, creación y edición sin desborde de página en 320–1920 px; la tabla mantiene `overflow-x: auto`; al 200 % de texto no hay scroll horizontal de página y la tabla conserva scroll interno. Se corrigió el encabezado de tabla global a 14 px. `pnpm build`, `tsc --noEmit` y `pnpm lint` en verde (5 avisos preexistentes).

- [x] **T52. Privacidad, estilo y datos reales.**
  RF-86, RNF-8, RNF-10, RNF-11, RNF-18, RNF-19, RNF-21
  - Hecho cuando: no se expone el token, no hay datos de ejemplo ni métricas inventadas, no se repiten botones ni tarjetas innecesarias, el estilo usa solo tokens institucionales y cumple los límites medibles de RNF-8.
  - Verificado el 2026-10-30: en navegador, `document.cookie`/URL/localStorage/sessionStorage/HTML/recursos no contienen JWT ni `Bearer`; no hay cursos ni métricas de ejemplo en `app/`; las acciones repetidas son solo las excepciones documentadas (Crear en encabezado/estado vacío, Editar en fila/detalle, reporte general/curso); los componentes de cursos usan tokens institucionales, sin colores crudos, con sombras y bordes dentro de RNF-8. `tsc --noEmit` y `pnpm lint` en verde (5 avisos preexistentes).

- [x] **T53. E2E del listado y del detalle.**
  RF-1, RF-2, RF-3, RF-4, RF-8, RF-9, RF-10, RF-11, RF-13, RF-14, RF-15, RF-16, RF-17, RF-18, RF-19, RF-20, RF-21, RF-22, RF-23, RF-24, RF-25, RF-26, RF-27, RF-28, RF-29, RF-30, RF-31, RF-32, RF-33, RF-34, RF-35, RF-49, RF-50, RF-51, RF-52, RF-53, RF-54, RF-55, RF-56, RF-57, RF-58, RF-59, RF-60, RF-61, RF-62, RF-63
  - Hecho cuando: Playwright verifica acceso por rol, menú activo, filtros, tarjetas, paginación, estados, detalle, inscripciones y no encontrado contra el mock, sin errores de consola.
  - Verificado el 2026-10-30 con Playwright y mock local de 20 cursos: `ADMINISTRADOR` accede con «Cursos» activo y `TUTOR` recibe acceso denegado sin tabla ni opción; tarjetas 20/15/600; paginación 15+5 con URL `page=2`; filtro de año 2026 reinicia a página 1 con 18; búsqueda acentuada, filtros combinados, estado vacío con tarjetas 0/año activo y «Limpiar filtros»; detalle con datos, total 2, filas «Pérez, Ana» y «Gómez, Luis» con «No informado»; no encontrado con enlace al listado. Sin errores de consola y sin refetch al filtrar.

- [x] **T54. E2E de formularios y acciones.**
  RF-12, RF-36, RF-37, RF-38, RF-39, RF-40, RF-41, RF-42, RF-43, RF-44, RF-45, RF-46, RF-47, RF-48, RF-64, RF-65, RF-66, RF-67, RF-68, RF-69, RF-70, RF-71, RF-72, RF-73, RF-74, RF-75, RF-76, RF-77, RF-78, RF-79, RF-80, RF-81, RF-82, RF-83, RF-84, RF-85, RF-87, RF-88, RF-89, RF-90, RF-91, RF-92, RF-93, RF-94, RF-95, RF-96, RF-97, RF-98, RF-99, RF-100, RF-101, RF-102, RF-106
  - Hecho cuando: Playwright verifica crear, editar, editar año pasado deshabilitado, clonar curso, clonar año solo desde años anteriores, eliminar solo con 0 inscriptos, activar/desactivar, acciones no disponibles, errores, doble envío y refresco contra el mock.
  - Verificado el 2026-10-30 con Playwright y mock stateful: creación con defaults y aviso/código; edición precargada desde lista con código nuevo y aviso; `422`/`500` sin éxito y valores conservados; doble envío con una sola solicitud y botón pendiente; clonación individual con año destino; clonación masiva solo con años anteriores y mensaje fijo de cero clones; activar/desactivar con avisos; eliminar solo con 0 inscriptos y refresco; Editar deshabilitado en años pasados; Eliminar/Desactivar deshabilitados con inscriptos; reporte no disponible; sin errores de consola.

- [x] **T55. Cierre técnico base.**
  RF-1 a RF-101, RNF-12, RNF-16
  - Hecho cuando: `pnpm exec tsc --noEmit` está limpio, `pnpm lint` tiene 0 errores, la suite completa pasa, `pnpm build` está en verde, `package.json` no suma dependencias y `MEMORY.md` queda actualizado.
  - Verificado el 2026-10-30: `pnpm exec tsc --noEmit` limpio; `pnpm lint` 0 errores (5 avisos preexistentes); suite completa **424/424**; `pnpm build` en verde con las rutas de cursos; `package.json` sin dependencias nuevas; `MEMORY.md` actualizado.

## Fase M — Revisión QA 2026-10-30

- [x] **T56. Reglas de elegibilidad de cursos.**
  RF-36, RF-52, RF-102, RF-103, RF-106
  - Hecho cuando: `rules.ts` expone `isPastYear`, `isCourseEditable`, `canDeleteCourse`, `canDeactivateCourse` y motivos accesibles; `tests/courses/rules.test.ts` cubre año pasado, curso con 0 inscriptos, curso con inscriptos y curso actual/futuro.
  - Verificado el 2026-10-30: `rules.ts` con las seis reglas/motivos; usado por menú de fila, detalle y formulario para deshabilitar edición/eliminación/desactivación. 4/4 tests en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T57. Eliminación lógica y acciones destructivas.**
  RF-45, RF-46, RF-102, RF-106
  - Hecho cuando: «Eliminar» y «Desactivar» se deshabilitan con `currentCapacity > 0`; «Eliminar» se habilita con 0; la acción exige 0 en servidor, ejecuta borrado lógico, ajusta la página y muestra «No se puede eliminar: el curso tiene inscriptos.» ante `422` de respaldo.
  - Verificado el 2026-10-30: reglas y menú deshabilitan con inscriptos y habilitan con 0; `deleteCourseActionCore` exige 0, no revalida ante `422` y conserva el mensaje de respaldo; se agregó prueba de ajuste de página tras eliminar el último elemento. 66/66 tests de acciones y listado en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T58. Edición de años pasados y código recalculado.**
  RF-52, RF-89, RF-92, RF-95
  - Hecho cuando: el detalle y la fila deshabilitan «Editar» con el motivo de año pasado; la acción rechaza editar un curso pasado; una edición de combinación muestra el código devuelto o «Sin código» y actualiza lista y detalle.
  - Verificado el 2026-10-30: fila/detalle usan las reglas de elegibilidad y muestran el motivo; `updateCourseActionCore` rechaza años pasados; la edición con código nuevo actualiza lista/detalle y con `code: null` redirige con «Sin código»; se agregó prueba específica. 32/32 tests de acciones en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T59. Clonación con estado y capacidad máxima.**
  RF-73, RF-78, RF-79, RF-82, RF-83, RF-84
  - Hecho cuando: los diálogos declaran que se conservan capacidad máxima y estado; la clonación masiva solo ofrece años anteriores; `cloned: 0` muestra el mensaje fijo; el resultado parcial informa creados e intentados; un error refresca el listado.
  - Verificado el 2026-10-30: ambos diálogos declaran capacidad máxima y estado; la masiva solo recibe años anteriores; el mensaje de cero es fijo; `formatCloneYearMessage` compone «Se crearon {creados} de {intentados} cursos.» y el action revalida ante error. 9/9 tests de estados en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T60. Reporte con total, orden y precedencia de errores.**
  RF-56, RF-57, RF-63, RF-105
  - Hecho cuando: la sección usa `header.totalInscriptions` o «No disponible», muestra orden secuencial y alumno «Apellido, Nombre», tiene esqueleto independiente y aplica `401`/`403`/`404` globales y `5xx`/red/timeout solo en la sección.
  - Verificado el 2026-10-30: `report.ts` centraliza total/orden/valores/alumno; la tabla usa `header.totalInscriptions`, orden secuencial y «Apellido, Nombre»; `401` redirige, `403`/`404` usan sus mensajes globales y `5xx`/red/timeout quedan localizados con «Reintentar». 4/4 tests nuevos en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T61. Página, URL, orden y valores desconocidos.**
  RF-16, RF-24, RF-25, RF-26, RF-29, RF-31
  - Hecho cuando: el año por defecto es actual si existe o «Todos los años»; la página se ajusta a `1..última`; los filtros inválidos se normalizan; el orden incluye turno, ciclo, especialidad y desempate por id; «Limpiar filtros» vuelve a página 1.
  - Verificado el 2026-10-30: defaults actual/Todos, normalización de URL y página, ajuste `1..última`, orden completo con turno/ciclo/especialidad/identificador y desconocidos al final; `handleClearFilters` de la vista vuelve a página 1. Se agregó prueba de orden para ciclo/especialidad desconocidos. 36/36 tests del listado en verde, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [x] **T62. Cierre de la revisión QA.**
  RF-102 a RF-106, RNF-8, RNF-9, RNF-20
  - Hecho cuando: E2E cubre eliminación con 0, eliminación/desactivación bloqueadas con inscriptos, edición de año pasado deshabilitada, clonación masiva solo anterior, total de reporte, página fuera de rango y avisos persistentes; `tsc --noEmit`, `pnpm lint`, suite completa y `pnpm build` quedan en verde, y `MEMORY.md` queda actualizado.
  - Verificado el 2026-10-31: E2E confirmó `page=999` ajustado a `?page=2` («Página 2 de 2 · 20 resultados») y aviso `created` persistente al filtrar, eliminado de la URL al cerrarlo; la cobertura E2E de T53/T54 ya incluía eliminación con 0, acciones bloqueadas con inscriptos, edición de año pasado deshabilitada, clonación masiva solo anterior y total del reporte. Suite completa **436/436**, `tsc --noEmit` limpio, `pnpm lint` 0 errores (5 avisos preexistentes) y `pnpm build` en verde con las cuatro rutas de cursos.

## Fase N — Revisión 2026-10-31

- [x] **T63. Autorización multirrol en la API.**
  RF-1, RF-3, RF-112
  - Hecho cuando: `CheckRole` acepta múltiples roles separados por Laravel; ADMINISTRADOR y ADMINISTRATIVO acceden a lectura/escritura; TUTOR accede a lectura y recibe `403` en escritura; `CourseAuthorizationTest` pasa.
  - Verificado el 2026-10-31: `CheckRole` usa `string ...$roles` y compara el rol contra todos los argumentos; `CourseAuthorizationTest` 6/6 y suite de API **120/120** en verde; `GET /api/courses` con token ADMINISTRADOR respondió **200**.

- [x] **T64. Listado sin código y fila accesible.**
  RF-27, RF-35
  - Hecho cuando: la tabla no muestra «Código», conserva el código en detalle/diálogos/edición y el nombre accesible de fila usa solo la descripción visible.
  - Verificado el 2026-10-31: `course-table.tsx` muestra «Año académico» como primera columna y no renderiza el código; `buildCourseRowLabel` en `labels.ts` compone la descripción sin código y la prueba de fila pasa. `tests/courses/labels.test.ts` 8/8, `tsc --noEmit` limpio y `pnpm lint` 0 errores (5 avisos preexistentes).

- [ ] **T65. Selección de cursos y checkboxes.**
  RF-107, RF-109
  - Hecho cuando: cada fila tiene casilla, la cabecera selecciona todos los filtrados con estado indeterminado, la selección se conserva por id al paginar/filtrar y se descartan cursos ausentes; tests de selección en verde.

- [ ] **T66. Barra de selección y notificación no disponible.**
  RF-108, RF-85
  - Hecho cuando: con al menos un curso seleccionado se muestra el contador, «Limpiar selección» y «Enviar notificación — Próximamente», enfocable, anunciada como no disponible y sin efectos.

- [ ] **T67. Avisos de éxito de 4 segundos.**
  RF-88, RF-113
  - Hecho cuando: los éxitos desaparecen a los 4 segundos, el temporizador se pausa con foco o puntero, los errores permanecen y se elimina `created`/`updated` de la URL al ocultar.

- [x] **T68. Menú de acciones fuera de la tabla.**
  RF-37, RF-110
  - Hecho cuando: el menú se renderiza en portal con posición fija, se abre hacia arriba si falta espacio, permanece dentro del viewport y conserva teclado, foco, Escape y cierre por clic fuera; tests de posición en verde.
  - Verificado el 2026-10-31: `course-row-actions.tsx` usa `createPortal` a `document.body`, posición fija calculada con `menu-position.ts` y actualización en scroll/resize; el menú permanece dentro del viewport. E2E confirmó que las celdas y el scroll de la tabla no cambian al abrirlo. `menu-position.test.ts` 5/5, `tsc --noEmit` limpio, `pnpm lint` 0 errores (5 avisos preexistentes) y `pnpm build` en verde.

- [x] **T69. Footer en páginas públicas y ausente del panel.**
  RF-111
  - Hecho cuando: el footer aparece en home, login, registro, recuperación, restablecimiento y verificación; no aparece en `/dashboard` ni `/dashboard/courses/*`.
  - Verificado el 2026-10-31: `app/layout.tsx` ya no renderiza el footer; se agregó a home, login, register, recuperación, reset y verificación. E2E confirmó footer visible en las seis rutas públicas y ausente en `/dashboard` y `/dashboard/courses`. `tsc --noEmit` limpio, `pnpm lint` 0 errores (5 avisos preexistentes) y `pnpm build` en verde.

- [x] **T70. Paginación de 10 cursos.**
  RF-31
  - Hecho cuando: el listado muestra 10 cursos por página, con 11 o más resultados «Siguiente» se habilita y cambia a la página 2 sin perder filtros.
  - Verificado el 2026-10-31: `COURSE_PAGE_SIZE = 10`; con 12 cursos la vista mostró «Página 1 de 2 · 12 resultados» y 10 filas, «Siguiente» habilitado; al avanzar mostró «Página 2 de 2 · 12 resultados» y 2 filas. `list.test.ts` 36/36 en verde.

- [ ] **T71. Cierre de la revisión 2026-10-31.**
  RF-107 a RF-113, RNF-1, RNF-5, RNF-12
  - Hecho cuando: E2E cubre acceso ADMINISTRADOR, ausencia de «Código», selección individual/todos, notificación no disponible, aviso de 4 segundos, menú sin recortes, footer público y paginación de 10; suite completa, tests de API, `tsc --noEmit`, `pnpm lint` y `pnpm build` en verde; `MEMORY.md` actualizado.
