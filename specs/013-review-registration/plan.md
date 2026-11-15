# Plan 013 — Evaluación de inscripciones

Estado: aprobado (2026-11-14)
Base: `specs/013-review-registration/spec.md` (aprobada), `specs/009-sidebar`, `specs/010-cursos`, `specs/011-staff` y `specs/012-students`.

## 1. Resumen

Se implementa el módulo de evaluación de inscripciones para `ADMINISTRATIVO` y `ADMINISTRADOR`: listado único con pestañas de estado, búsqueda en vivo, filtros por alumno y curso, orden y paginación con página editable; detalle en dos columnas (web) o con botones flotantes (móvil) con los cuatro dictámenes y sus alertas; formulario en PDF embebido con descarga e impresión; y un contador de pendientes en el dashboard.

Se reutilizan por composición `PrivateShell`, `CourseBreadcrumb`, `UserNotice`, `TextField`, `SelectField` y `RetryButton`. No se agregan dependencias.

## 2. Decisiones de diseño

- **D1. Rutas.** Listado en `/dashboard/registrations` y detalle en `/dashboard/registrations/{registrationId}`. Sin alta ni edición (el staff no crea ni edita solicitudes). Alternativa descartada: detalle en modal, porque RF-9 exige ruta propia y el layout de dos columnas necesita pantalla dedicada.
- **D2. Listado en cliente sobre el conjunto completo.** Filtrado, orden y paginación en cliente (patrón de Cursos y Alumnos): se carga `GET /api/registrations?per_page=100` recorriendo `meta.last_page` con tope de 100 páginas y fallo atómico; la vista filtra por estado, alumno y curso, ordena por recientes/antiguas y pagina 15, sincronizando en la URL el estado, los filtros no sensibles y la página. Alternativa descartada: filtrado en servidor con DNI/CUIL, por la tensión con RF-21 (DNI/CUIL fuera de la URL) y con la búsqueda en vivo de RF-17.
- **D3. DNI y CUIL fuera de la dirección.** Se conservan en `sessionStorage` y se aplican en cliente. Alternativa descartada: reflejarlos en la URL, que expone datos personales en el historial.
- **D4. Búsqueda en vivo.** Los filtros de texto se aplican con cada tecla sobre el conjunto ya cargado, sin consultar el servicio por tecla. Alternativa descartada: búsqueda en servidor por tecla, que satura el servicio.
- **D5. CUIL con máscara.** El campo CUIL solo admite dígitos y formatea automáticamente `XX-XXXXXXXX-X`; al filtrar se envían solo los dígitos. Alternativa descartada: pedir el CUIL formateado, que rompe la coincidencia exacta del servicio.
- **D6. Detalle con endpoint individual.** El detalle usa `GET /api/registrations/{id}` (endpoint nuevo que devuelve el mismo recurso del listado); el tutor se obtiene con `GET /api/students/{student}/tutor`. Alternativa descartada: derivar la inscripción del listado, que complica el acceso directo.
- **D7. Reasignación con `/available`.** El selector de curso destino usa `GET /api/courses/available?year={año}` (cursos activos con cupo del mismo año). Alternativa descartada: cargar todos los cursos y filtrar en cliente, siendo que el endpoint específico ya está documentado.
- **D8. PDF como excepción binaria.** `GET /api/registrations/{id}/form` responde `application/pdf`; se obtiene por la capa centralizada y se previsualiza en el modal mediante blob/URL de objeto, sin `fetch` en componentes de UI. Alternativa descartada: parsearlo como JSON (rompe el sobre) o abrirlo en pestaña nueva (no cumple RF-52).
- **D9. Contador del dashboard con una consulta.** El total de pendientes se obtiene con `GET /api/registrations?status=PENDING&per_page=1` leyendo `meta.total`; si falla, se omite el contador. Alternativa descartada: cargar todas las pendientes solo para contarlas.
- **D10. Dictámenes con Server Actions.** Aprobar, rechazar, devolver y reasignar usan Server Actions con núcleos testeables; revalidan listado y detalle. Alternativa descartada: escrituras directas desde cliente, que violan los principios 4 y 6.
- **D11. Alertas de elección y de confirmación.** «Aprobar» muestra primero la alerta de elección («Aprobar en el curso solicitado» / «Reasignar a otro curso»), luego los campos opcionales y la alerta de confirmación; los demás dictámenes solo muestran confirmación. Alternativa descartada: un único diálogo que mezcla pasos, menos claro.
- **D12. Pestaña en la URL.** La pestaña se refleja como `?status=` con los valores del enum y `all` para «Todas»; sin parámetro, la vista abre en `PENDING` (Pendientes). Así el contador enlaza a «Pendientes» y el historial funciona. Alternativa descartada: pestaña solo en estado local, que impide el enlace del contador.
- **D13. Solo CUIL (sin DNI).** El recurso solo expone `studentCuil`; el DNI se usa únicamente como filtro de búsqueda. Alternativa descartada: mostrar DNI, que no viene en el recurso.
- **D14. Paginación con página editable.** Widget propio `Inicio | Anterior | [pág−1] [pág] [pág+1] | Siguiente | Final`, con la página actual como campo numérico que navega con Enter. Alternativa descartada: reutilizar `UserPagination`, que no tiene extremos ni página editable.
- **D15. Detalle responsivo.** En web dos columnas (datos | estado+botones apilados); en móvil dos botones flotantes (estado y acciones). Alternativa descartada: una columna, descartada explícitamente por la spec.
- **D16. Etiqueta corta de estado.** El botón flotante de estado muestra una etiqueta corta en español definida en `labels.ts`: `P` (Pendiente), `O` (Observada), `PR` (Propuesta de Reasignación), `A` (Aprobada) y `R` (Rechazada). Alternativa descartada: solo la inicial, ambigua entre Reasignada y Rechazada.
- **D17. Sin notificaciones a terceros.** No se simulan avisos al tutor ni a otras personas; la spec lo prohíbe y el servicio no los documenta.
- **D18. Sin caché compartida.** Lecturas con `no-store` y memoización por render; escrituras revalidan listado, detalle y contador.

## 3. Rutas y flujo de datos

### 3.1 Rutas

| Ruta | Rol | Contenido |
|---|---|---|
| `/dashboard/registrations` | ADMINISTRATIVO y ADMINISTRADOR | Listado con pestañas, filtros, búsqueda en vivo, orden y paginación |
| `/dashboard/registrations/{registrationId}` | ADMINISTRATIVO y ADMINISTRADOR | Detalle en dos columnas/FABs, dictámenes y PDF |

Cada segmento tiene `loading.tsx` y `error.tsx`.

### 3.2 Flujo del listado

1. La página resuelve cuenta, rol vigente y token; valida acceso antes de cargar.
2. Carga el padrón completo (`per_page=100`, tope de 100 páginas) con la vista cliente.
3. La vista cliente aplica pestaña, filtros, búsqueda en vivo, orden y paginación de 15.
4. Sincroniza en la URL estado, nombre, apellido, filtros de curso y página; DNI y CUIL viven en `sessionStorage`.
5. Una tarjeta lleva al detalle.

### 3.3 Flujo del detalle

1. Obtiene la inscripción con `GET /api/registrations/{id}`.
2. Carga el tutor con `GET /api/students/{student}/tutor`; un fallo de tutor no invalida el detalle.
3. Muestra estado, datos, certificados, botones de dictamen y el modal del PDF.
4. Los dictámenes abren la alerta correspondiente y escriben con Server Actions; tras el éxito, el detalle muestra el nuevo estado y el aviso.

### 3.4 Errores y sesión

- Sin sesión válida: redirección existente a `/session-expired`.
- `401`: descarta sesión y redirige; `403`: acceso denegado sin datos; `404`: no encontrado; `422`: errores por campo y aviso general; `5xx`/red/timeout: error con reintento.
- Precedencia: `401`, `403`, `404`, `422`, `5xx`, red.

## 4. Archivos nuevos

### 4.1 Lógica de dominio

| Archivo | Responsabilidad | RF |
|---|---|---|
| `app/lib/registrations/types.ts` | Tipos inmutables: inscripción, alumno, curso, tutor, filtros, pestañas, página, estados y formularios de dictamen | RF-1 a RF-103 |
| `app/lib/registrations/access.ts` | Roles habilitados (`ADMINISTRATIVO`, `ADMINISTRADOR`) y verificación de evaluación | RF-1, RF-8 |
| `app/lib/registrations/labels.ts` | Rótulos de estado, ciclo, turno, especialidad, iniciales/abreviaturas de estado y textos | RF-31, RF-36, RF-37 a RF-41 |
| `app/lib/registrations/status.ts` | Pestañas de estado, estado inicial, mapeo estado↔parámetro y etiqueta corta | RF-10 a RF-12, RF-21 |
| `app/lib/registrations/list.ts` | Normalización de búsqueda, filtros, orden recientes/antiguas y paginación de 15 | RF-13 a RF-28 |
| `app/lib/registrations/registrations-url.ts` | Rutas, parámetros, parseo/serialización y retorno saneado | RF-9, RF-21, RF-24 |
| `app/lib/registrations/filters-storage.ts` | DNI y CUIL en `sessionStorage` con almacenamiento inyectable | RF-21 |
| `app/lib/registrations/cuil.ts` | Formateo `XX-XXXXXXXX-X`, extracción de dígitos y validación | RF-18 |
| `app/lib/registrations/reassignment.ts` | Filtro de cursos disponibles del selector y detección de vacío | RF-74 a RF-76 |
| `app/lib/registrations/guard-decision.ts` | Decisiones puras de acceso por rol y pantalla | RF-1 a RF-8 |
| `app/lib/registrations/guard.ts` | Acceso de páginas y acciones con cuenta privada y token | RF-1 a RF-8 |
| `app/lib/registrations/data.ts` | Cargas memoizadas: padrón, detalle por id, tutor, cursos disponibles y contador | RF-9 a RF-28, RF-40, RF-100 a RF-103 |
| `app/lib/registrations/registration-state.ts` | Traducción de resultados a estados de lista, detalle y acción | RF-25 a RF-28, RF-90 a RF-99 |
| `app/lib/registrations/action-core.ts` | Núcleos testeables de aprobar, rechazar, devolver y reasignar | RF-57 a RF-82 |

### 4.2 Red, validación y acciones

| Archivo | Responsabilidad | RF |
|---|---|---|
| `app/lib/api/registrations.ts` | Cliente HTTP tipado: padrón completo, detalle, parseos y escrituras (aprobar/rechazar/devolver/reasignar) | RF-9 a RF-82 |
| `app/lib/api/registration-form.ts` | Descarga binaria del PDF (blob, nombre y tipo), excepción al sobre JSON | RF-51 a RF-56 |
| `app/lib/validation/registrations.ts` | Campos de dictamen, observaciones y motivo obligatorios, materias y traducción de errores | RF-59, RF-65, RF-69, RF-74, RF-77 |
| `app/lib/actions/registrations.ts` | Server Actions de los cuatro dictámenes sobre los núcleos | RF-57 a RF-82 |

### 4.3 Interfaz

| Archivo | Responsabilidad | RF |
|---|---|---|
| `app/ui/registrations/registrations-header.tsx` | Breadcrumb, título y descripción | RF-9 |
| `app/ui/registrations/status-tabs.tsx` | Pestañas de estado | RF-10 a RF-12 |
| `app/ui/registrations/registration-filters.tsx` | Búsqueda (nombre/apellido/DNI/CUIL) y selects de curso | RF-14 a RF-20 |
| `app/ui/registrations/registration-card.tsx` | Tarjeta resumida del listado | RF-29 a RF-33 |
| `app/ui/registrations/registrations-view.tsx` | Vista coordinadora: pestañas, filtros, orden, paginación y URL | RF-9 a RF-28 |
| `app/ui/registrations/registration-pagination.tsx` | Paginación con extremos y página editable | RF-22 a RF-24 |
| `app/ui/registrations/registration-detail.tsx` | Detalle en dos columnas (datos | estado+botones) | RF-34 a RF-47 |
| `app/ui/registrations/registration-status-fab.tsx` | Botón flotante de estado (móvil) | RF-36 |
| `app/ui/registrations/registration-actions-fab.tsx` | Botón flotante de acciones (móvil) | RF-36 |
| `app/ui/registrations/approve-choice-dialog.tsx` | Alerta de elección de aprobar | RF-57, RF-58 |
| `app/ui/registrations/dictamen-confirm-dialog.tsx` | Alerta de confirmación genérica | RF-83 a RF-89 |
| `app/ui/registrations/observe-dialog.tsx` | Formulario de devolver con observaciones | RF-68 a RF-72 |
| `app/ui/registrations/reject-dialog.tsx` | Formulario de rechazar | RF-64 a RF-67 |
| `app/ui/registrations/reassign-dialog.tsx` | Formulario de reasignar (selector + motivo) | RF-73 a RF-82 |
| `app/ui/registrations/pdf-modal.tsx` | Modal del PDF embebido con descargar/imprimir | RF-51 a RF-56 |
| `app/ui/registrations/registration-states.tsx` | Estados vacío, sin coincidencias, error, denegado y no encontrado | RF-25 a RF-28 |
| `app/ui/registrations/registration-skeletons.tsx` | Esqueletos accesibles | RNF-12 |
| `app/ui/dashboard/pending-registrations-card.tsx` | Contador de pendientes del dashboard | RF-100 a RF-103 |

### 4.4 Rutas

| Archivo | RF |
|---|---|
| `app/dashboard/registrations/page.tsx` | RF-1 a RF-33 |
| `app/dashboard/registrations/loading.tsx` | RNF-12 |
| `app/dashboard/registrations/error.tsx` | RNF-12 |
| `app/dashboard/registrations/[registrationId]/page.tsx` | RF-34 a RF-99 |
| `app/dashboard/registrations/[registrationId]/loading.tsx` | RNF-12 |
| `app/dashboard/registrations/[registrationId]/error.tsx` | RNF-12 |

## 5. Archivos modificados

| Archivo | Cambio |
|---|---|
| `app/lib/sidebar/navigation.ts` | «Inscripciones» habilitado para `ADMINISTRATIVO` y `ADMINISTRADOR` con `/dashboard/registrations` y coincidencia por prefijo; `TUTOR` la conserva como «Próximamente» |
| `tests/sidebar/navigation.test.ts` | Habilitación, etiqueta y estado activo de «Inscripciones» |
| `app/lib/dashboard/role-dashboard.ts` | Decisión por rol de mostrar el contador de pendientes (solo roles altos) |
| `app/ui/dashboard/dashboard-view.tsx` | Integración del contador de pendientes en el dashboard base |
| `MEMORY.md` | Estado de la spec, decisiones y verificación |
| `specs/009-sidebar/spec.md` | Cambio de navegación (ya actualizado) |

## 6. Archivos eliminados o reemplazados

- No se eliminan archivos de Cursos, Alumnos ni Gestión de usuarios.
- `app/dashboard/registrations/*` se crean desde cero; no hay contenido previo que reemplazar.

## 7. Lógica pura

- **Acceso:** `isStaffRole`, `canEvaluateRegistrations`, `getRegistrationPageDecision`, `getRegistrationActionRoleDecision`.
- **Estado:** `REGISTRATION_STATUS_TABS`, `DEFAULT_STATUS_TAB`, `statusToParam`, `paramToStatus`, `getStatusLabel`, `getStatusShortLabel`.
- **Etiquetas y formato:** `REGISTRATION_NO_INFO_LABEL`, `REGISTRATION_STATUS_LABELS`, `getCycleLabel`, `getShiftLabel`, `getSpecialityLabel`, `formatRegistrationDate`, `buildCardLabel`.
- **Filtros y listado:** `getDefaultFilters`, `clearFilters`, `hasActiveFilters`, `normalizeSearch`, `filterRegistrations`, `sortRegistrations`, `paginateRegistrations`, `REGISTRATION_PAGE_SIZE`.
- **CUIL:** `formatCuil`, `extractCuilDigits`, `isCuilComplete`.
- **Dirección:** `REGISTRATIONS_PATH`, `registrationDetailPath`, `parseRegistrationsUrl`, `serializeRegistrationsFilters`, `sanitizeRegistrationReturnPath`.
- **Almacenamiento:** `readStoredIdentifiers`, `writeStoredIdentifiers`, `clearStoredIdentifiers`.
- **Reasignación:** `getAvailableCoursesForYear`, `isSelectorEmpty`.
- **Validación:** `REGISTRATION_DICTAMEN_FIELDS`, `validateObservations`, `validateReassignment`, `buildApprovePayload`, `buildRejectPayload`, `buildObservePayload`, `buildReassignPayload`, `mapDictamenFieldErrors`, `translateDictamenFieldErrors`.
- **Estados:** `toRegistrationListState`, `toRegistrationDetailState`, `toDictamenActionState`.
- **Núcleos:** `approveActionCore`, `rejectActionCore`, `observeActionCore`, `reassignActionCore`.
- **API:** `parseRegistration`, `parseRegistrationListMeta`, `parseRegistrationListResponse`, `parseRegistrationDetailResponse`, `parseDictamenResponse`, `parsePendingTotal`.

Regla: ninguna de estas funciones importa `next/headers`, `next/navigation` ni `react`.

## 8. Contrato con el servicio

- Lecturas: `GET /api/registrations?per_page=100&page=N`, `GET /api/registrations/{id}`, `GET /api/registrations/{id}/form`, `GET /api/courses/available?year=YYYY`, `GET /api/students/{student}/tutor`, `GET /api/registrations?status=PENDING&per_page=1`.
- Escrituras: `PUT /api/registrations/{id}/approve`, `/observe`, `/reject`, `/propose-reassignment`.
- Cabeceras: `Accept`, `Authorization` Bearer, `Content-Type` solo con cuerpo.
- Opciones: `credentials: "omit"`, `cache: "no-store"`, `redirect: "manual"`, `AbortSignal.timeout` de 10 s.
- Clasificación: éxito, `401`, `403`, `404`, `422`, `5xx`, red, tiempo agotado, cuerpo inválido y configuración ausente.
- Paginación: `current_page`, `last_page`, `per_page`, `total`; si faltan o son inconsistentes, la respuesta es inválida y no se muestran datos parciales.
- PDF: `200` con `application/pdf` y `Content-Disposition`; el nombre del archivo se toma de la cabecera.
- Reasignación: el selector usa `/available`; si el curso destino se llena, el `422` trae `availableCourses` para reintentar.
- Nunca se registran DNI, CUIL, correo, teléfono ni token en consola.

## 9. Cumplimiento de la constitución

| Principio | Cumplimiento en este plan |
|---|---|
| 1. SDD | La spec 013 se aprueba antes de este plan; la spec 009 se actualiza antes de tocar la navegación |
| 2. TypeScript estricto | Tipos `readonly`, uniones cerradas, sin `any` ni casts inseguros |
| 3. Separación de capas | Rutas en `app/dashboard/registrations`, UI en `app/ui/registrations`, lógica en `app/lib/registrations`, red en `app/lib/api`, validación en `app/lib/validation`, acciones en `app/lib/actions` |
| 4. Pureza visual | `app/ui/registrations` recibe datos y callbacks por props; sin `fetch` ni HTTP directo (incluida la previsualización del PDF) |
| 5. Server Components primero | Páginas y detalle de servidor; `'use client'` solo en vistas interactivas, filtros, pestañas, diálogos, FABs y modal del PDF |
| 6. API centralizada | Solo `app/lib/api/registrations.ts` y `registration-form.ts` hablan con Laravel; sobre `{data, message, errors}` uniforme, con el PDF como excepción binaria |
| 7. Idioma | Identificadores y tipos en inglés; textos, etiquetas y comentarios en español |
| 8. Dependencias | Sin paquetes nuevos |
| 9. Fechas y estados | ISO de entrada, `DD/MM/AAAA HH:mm` de salida; estados con patrones inmutables |
| 10. Planificación y verificación | Plan aprobado antes de codificar; verificación con typecheck, lint, suite y build |
| 11. Next.js optimizado | Sin imágenes nuevas salvo el icono del FAB de acciones (se declara en `plan.md`); metadata propia por ruta |
| 12. Loading y error | `loading.tsx` y `error.tsx` en listado y detalle |
| 13. Caché | `no-store` en lecturas, memoización por render y `revalidatePath` tras escrituras |
| 14. Assets | Icono nuevo para el FAB de acciones en `public/icons/` (nombre `ico-actions.svg`, 24×24, `fill="#2C3E50"`); descripción y carpeta declaradas |
| 15. Tailwind en Markdown | Este plan no incluye clases utilitarias ni el patrón prohibido; los colores se citan por token o en lenguaje natural |

## 10. Estrategia de pruebas

### 10.1 Unitarias

- `tests/registrations/access.test.ts`: roles admitidos y decisión por pantalla.
- `tests/registrations/labels.test.ts`: rótulos, iniciales/abreviaturas de estado y «No informado».
- `tests/registrations/status.test.ts`: pestañas, estado inicial y mapeo estado↔parámetro.
- `tests/registrations/list.test.ts`: normalización, filtros combinados, orden recientes/antiguas y paginación de 15.
- `tests/registrations/cuil.test.ts`: máscara, extracción de dígitos y CUIL incompleto.
- `tests/registrations/registrations-url.test.ts`: parámetros, valores inválidos, pestaña y retorno saneado.
- `tests/registrations/filters-storage.test.ts`: lectura, escritura, datos corruptos y almacenamiento ausente.
- `tests/registrations/reassignment.test.ts`: filtro de disponibles y selector vacío.
- `tests/registrations/guard.test.ts`: decisiones de página y acción sin `next/headers`.
- `tests/registrations/registration-state.test.ts`: traducción de resultados a estados.
- `tests/registrations/validation.test.ts`: observaciones y motivo obligatorios, payloads y traducción de errores.

### 10.2 API y acciones

- `tests/api/registrations.test.ts`: parseo de inscripción, padrón multipágina, metadatos inválidos, respuestas de dictámenes, total de pendientes, `401`, `403`, `404`, `422`, `5xx`, red, timeout y cuerpo inválido.
- `tests/api/registration-form.test.ts`: descarga binaria, nombre desde `Content-Disposition` y fallo de PDF.
- `tests/actions/registrations.test.ts`: núcleos de aprobar/rechazar/devolver/reasignar; validación local sin solicitud, éxito con revalidación, `401`, `403`, `404`, `409`, `422` y fallo de transporte.

### 10.3 Extremo a extremo

- Listado: pestañas, búsqueda en vivo, filtros, orden, paginación con página editable y CUIL con máscara.
- Detalle: dos columnas en web, FABs en móvil, tutor responsable, certificados y PDF (ver/descargar/imprimir).
- Dictámenes: aprobar (elección y curso lleno), rechazar, devolver con observaciones y reasignar, con sus confirmaciones y volver atrás.
- Contador del dashboard: visible solo para roles altos y enlazando a «Pendientes».
- Sesión/roles: `401`, `403`, `404`, `422`, `409` y red con sus precedencias.
- Accesibilidad: árbol AX, teclado, foco en diálogos, FABs y modal, anuncios y contraste.
- Responsive: 320, 375, 768, 1024, 1440 y 1920 sin desborde; texto al 200 %.
- Privacidad: token fuera de HTML/URL/almacenamiento; DNI y CUIL fuera de la URL; consola sin datos personales.
- Regresión: Cursos, Alumnos, Gestión de usuarios, menú lateral, login, registro y recuperación.

### 10.4 Comandos

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

## 11. Matriz de cobertura

| RF | Implementación |
|---|---|
| RF-1 a RF-8 | `navigation.ts`, `access.ts`, `guard.ts`, páginas y pruebas de navegación |
| RF-9 a RF-28 | `api/registrations.ts`, `data.ts`, `status.ts`, `list.ts`, `registrations-url.ts`, `filters-storage.ts`, `cuil.ts`, `status-tabs.tsx`, `registration-filters.tsx`, `registration-pagination.tsx`, `registration-states.tsx` |
| RF-29 a RF-33 | `registration-card.tsx`, `labels.ts`, `registrations-view.tsx` |
| RF-34 a RF-47 | `[registrationId]/page.tsx`, `registration-detail.tsx`, `registration-status-fab.tsx`, `registration-actions-fab.tsx`, `data.ts` |
| RF-48 a RF-50 | `registration-detail.tsx`, `pdf-modal.tsx` |
| RF-51 a RF-56 | `api/registration-form.ts`, `pdf-modal.tsx` |
| RF-57 a RF-63 | `approve-choice-dialog.tsx`, `dictamen-confirm-dialog.tsx`, `action-core.ts`, `actions/registrations.ts` |
| RF-64 a RF-67 | `reject-dialog.tsx`, `action-core.ts` |
| RF-68 a RF-72 | `observe-dialog.tsx`, `action-core.ts` |
| RF-73 a RF-82 | `reassign-dialog.tsx`, `reassignment.ts`, `action-core.ts` |
| RF-83 a RF-89 | `dictamen-confirm-dialog.tsx`, `approve-choice-dialog.tsx`, `registration-state.ts` |
| RF-90 a RF-99 | `action-core.ts`, `registration-state.ts`, `registration-states.tsx` |
| RF-100 a RF-103 | `data.ts`, `pending-registrations-card.tsx`, `role-dashboard.ts`, `dashboard-view.tsx` |

## 12. Riesgos y dudas abiertas

- **Endpoint de detalle nuevo.** `GET /api/registrations/{id}` fue creado por el backend; se valida en E2E su contrato (mismo recurso del listado) y se coordina con el backend si cambia.
- **Volumen del padrón.** Cargar el conjunto completo crece con los años; se mitiga con `per_page=100`, tope de 100 páginas y error sin datos parciales. Si el volumen lo exige, se reevalúa el filtrado en servidor con una revisión de privacidad.
- **Inicial de estado ambigua.** «Reasignada» y «Rechazada» comparten «R»; se resuelve con etiqueta corta distinguible.
- **PDF binario.** Obtener el blob con token y previsualizarlo exige un flujo centralizado; se cubre con `registration-form.ts` y pruebas de descarga.
- **Tutor fuera del recurso.** El tutor viene de `GET /api/students/{student}/tutor`; si responde `404`, se muestra «No informado» (CL-34).
- **Búsqueda en vivo.** El debounce evita saturar el servicio; se prueba que una respuesta antigua no pisa la más reciente (CL-8).
- **Acoplamiento de piezas reutilizadas.** Se reutilizan componentes de Cursos y Usuarios por composición; la extracción neutral queda como deuda futura.

## 13. Orden de ejecución

1. Base de dominio: `types.ts`, `access.ts`, `labels.ts`, `status.ts`.
2. Lógica pura: `list.ts`, `cuil.ts`, `registrations-url.ts`, `filters-storage.ts`, `reassignment.ts`.
3. Validación y cliente de API (incluida la descarga binaria del PDF).
4. Estados, guardias, cargadores y núcleos de acción.
5. Habilitar «Inscripciones» en el sidebar y su prueba.
6. Listado: encabezado, pestañas, filtros, tarjetas, paginación y estados.
7. Detalle: dos columnas/FABs, tutor, certificados y estados.
8. PDF: modal, descargar e imprimir.
9. Dictámenes: alertas de elección/confirmación y diálogos de aprobar/rechazar/devolver/reasignar.
10. Contador del dashboard.
11. Segmentos de carga y error, metadata y avisos.
12. Pruebas unitarias, API, acciones, extremo a extremo, accesibilidad, responsive y privacidad.
13. Verificación final, actualización de `MEMORY.md` y cierre.
