# Plan 012 — Módulo de alumnos

Estado: aprobado (2026-11-11)
Base: `specs/012-students/spec.md` (borrador aprobado), `specs/009-sidebar`, `specs/010-cursos` y `specs/011-staff`.

## 1. Resumen

Se implementa el módulo de alumnos con dos recorridos:

- `TUTOR`: «Mis hijos», listado propio, alta, detalle, edición y aviso de baja no disponible.
- `ADMINISTRATIVO` y `ADMINISTRADOR`: «Alumnos», padrón completo con filtros y paginación, detalle con tutor responsable y sin escrituras.

Se reutilizan por composición las piezas de Cursos y Gestión de usuarios: breadcrumb, menú de acciones por fila, aviso, paginación, campos de formulario, estados de error y el armazón privado. No se agregan dependencias.

## 2. Decisiones de diseño

- **D1. Rutas.** Listado compartido en `/dashboard/students`; alta en `/dashboard/students/new`; detalle en `/dashboard/students/{studentId}`; edición en `/dashboard/students/{studentId}/edit`. Alternativa descartada: detalle en modal, porque el detalle administrativo incluye una sección extra y necesita dirección propia para el retorno con filtros.
- **D2. Padrón completo en servidor y filtrado en cliente.** El listado administrativo recibe el conjunto completo paginando el servicio con `per_page=100` y un tope de 100 páginas, y filtra y pagina 15 en el cliente. Alternativa descartada: filtros del servicio con DNI y CUIL en la dirección, por la tensión con RNF-7 y la decisión D4.
- **D3. DNI y CUIL fuera de la dirección.** Se conservan en el estado de la vista y en `sessionStorage`; la dirección solo refleja nombre, apellido y página. Alternativa descartada: reflejar todos los filtros como en Cursos, porque expone datos personales en el historial y en la dirección.
- **D4. Detalle del tutor sin endpoint.** Se arma con el alumno obtenido de `/api/students/me`, buscado por identificador; si no está, se muestra no encontrado. Alternativa descartada: habilitar un endpoint nuevo, que no está documentado.
- **D5. Baja no disponible.** La acción abre un diálogo informativo con foco atrapado y sin solicitud. Alternativas descartadas: ocultar la acción, que no cumple el requisito del usuario, y simular la baja, prohibido por la spec.
- **D6. Fechas.** Se reutiliza la validación estricta del registro: una fecha inexistente, incluido el 29/02 en año no bisiesto, se rechaza y no se corrige a 28/02. Alternativa descartada: corregir silenciosamente, que ocultaría errores de tipeo.
- **D7. Fecha de nacimiento sin edad mínima.** `BirthdatePicker` y `getBirthdateError` reciben una edad mínima opcional; el registro mantiene 18 por defecto y el alta de alumnos usa 0. Alternativa descartada: duplicar el calendario para alumnos.
- **D8. Opcionales vacíos en la edición.** Se envían como `null` para quitarlos. Alternativa descartada: omitirlos, que impide borrar un dato. Queda como duda de backend confirmar que `null` borra.
- **D9. Avisos por consulta.** El alta redirige con `created=1` y la edición con `updated=1`; la pantalla consume el parámetro, muestra el aviso 4 segundos y lo retira de la dirección. Alternativa descartada: `sessionStorage`, que agrega estado y no sobrevive a la navegación entre pestañas.
- **D10. Un solo origen de filtrado administrativo.** La vista cliente es dueña de filtros, orden visible y paginación; el servidor solo entrega el conjunto completo y el estado inicial de la dirección. Alternativa descartada: mezclar filtros de servidor y cliente, que produce páginas inconsistentes.
- **D11. Reutilización directa.** Se usan `CourseBreadcrumb`, `UserNotice`, `UserPagination`, `RowActionsMenu`, `TextField`, `SelectField` y `RetryButton` tal como existen. Alternativa descartada: extraer piezas neutrales ahora, que obliga a refactorizar Cursos y Usuarios con riesgo de regresión. La extracción queda como deuda futura.
- **D12. Sin notificaciones a terceros.** No se simulan avisos al tutor ni a otras personas; la spec lo prohíbe y el servicio no los documenta.
- **D13. Sin caché compartida.** Todas las lecturas usan `no-store` y memoización por render; las escrituras revalidan listado y detalle.
- **D14. Edad mínima del registro intacta.** El cambio de D7 es retrocompatible y se prueba con la suite de registro.
- **D15. Sin cambios de backend.** No se inventan rutas ni campos.

## 3. Rutas y flujo de datos

### 3.1 Rutas

| Ruta | Rol | Contenido |
|---|---|---|
| `/dashboard/students` | TUTOR | «Mis hijos», listado propio, estado vacío, menú de acciones |
| `/dashboard/students` | ADMINISTRATIVO y ADMINISTRADOR | «Alumnos», padrón, filtros, paginación, menú de acciones |
| `/dashboard/students/new` | TUTOR | Formulario de alta |
| `/dashboard/students/{studentId}` | TUTOR | Detalle del alumno propio, sin tutor responsable, con «Editar» |
| `/dashboard/students/{studentId}` | ADMINISTRATIVO y ADMINISTRADOR | Detalle completo con tutor responsable, sin acciones de escritura |
| `/dashboard/students/{studentId}/edit` | TUTOR | Formulario de edición |

Cada segmento tiene `loading.tsx` y `error.tsx`.

### 3.2 Flujo del tutor

1. La página resuelve cuenta, rol vigente y token.
2. Carga `/api/students/me` y pasa los alumnos al listado.
3. Sin alumnos: mensaje, ayuda y botón azul hacia el alta.
4. Con alumnos: encabezado con el mismo botón de alta y tabla.
5. Detalle: vuelve a consultar el listado memoizado y busca el identificador.
6. Edición: mismo criterio; si el alumno no está, no encontrado.
7. Alta y edición escriben con Server Actions y redirigen con aviso.

### 3.3 Flujo administrativo

1. La página resuelve cuenta, rol y token.
2. Carga `/api/students` paginando de a 100 hasta la última página, con tope de 100.
3. Pasa el conjunto completo, los filtros no sensibles y la página a la vista cliente.
4. La vista filtra por DNI, CUIL, nombre y apellido, pagina 15 y sincroniza en la dirección solo nombre, apellido y página.
5. El detalle consulta `/api/students/{id}` y `/api/students/{id}/tutor`; un fallo del tutor no invalida el detalle.
6. Las rutas de alta y edición responden acceso denegado para estos roles.

### 3.4 Errores y sesión

- Sin sesión válida: redirección existente a `/session-expired`.
- `401` en cualquier solicitud: descarta la sesión y redirige.
- `403`: acceso denegado sin datos.
- `404`: no encontrado con retorno al listado.
- `422`: errores por campo y aviso general.
- `5xx`, red o tiempo agotado: error con reintento.
- Precedencia: `401`, `403`, `404`, `422`, `5xx`, red.

## 4. Archivos nuevos

### 4.1 Lógica de dominio

| Archivo | Responsabilidad | RF |
|---|---|---|
| `app/lib/students/types.ts` | Tipos inmutables del alumno, tutor, filtros, página, estados, resultados, formulario y avisos | RF-12 a RF-126 |
| `app/lib/students/labels.ts` | Etiquetas de género, «No informado», nombre completo, nombre de fila, fechas y textos de avisos | RF-17, RF-23, RF-72 a RF-79, RF-89 |
| `app/lib/students/access.ts` | Roles habilitados, lectura total y escritura exclusiva del tutor | RF-1, RF-10, RF-25, RF-26, RF-29, RF-113 |
| `app/lib/students/list.ts` | Filtros, normalización, detección de filtros activos y paginación de 15 | RF-90 a RF-100, RF-106 |
| `app/lib/students/students-url.ts` | Rutas, parámetros, parseo y serialización, retorno saneado | RF-11, RF-97, RF-98, RF-104 |
| `app/lib/students/filters-storage.ts` | Lectura y escritura de DNI y CUIL en `sessionStorage` con almacenamiento inyectable | RF-97, RF-98 |
| `app/lib/students/row-actions.ts` | Definiciones de acciones por rol y nombre accesible | RF-23 a RF-28 |
| `app/lib/students/guard-decision.ts` | Decisiones puras de acceso por rol y por pantalla | RF-1 a RF-10 |
| `app/lib/students/guard.ts` | Acceso de páginas y acciones con cuenta privada y token | RF-1 a RF-10, RF-115 a RF-117 |
| `app/lib/students/data.ts` | Cargas memoizadas por render del listado propio, general, detalle y tutor | RF-12, RF-60, RF-77, RF-88 |
| `app/lib/students/student-state.ts` | Traducción de resultados a estados de lista, detalle y acción | RF-12 a RF-126 |
| `app/lib/students/action-core.ts` | Núcleos testeables de alta y edición con dependencias inyectadas | RF-29 a RF-64 |

### 4.2 Red, validación y acciones

| Archivo | Responsabilidad | RF |
|---|---|---|
| `app/lib/api/students.ts` | Cliente HTTP tipado: listados, detalle, tutor, alta y edición | RF-12 a RF-126 |
| `app/lib/validation/students.ts` | Campos, mensajes, validación, payloads y traducción de errores | RF-29 a RF-64, RF-90 a RF-96 |
| `app/lib/actions/students.ts` | Server Actions de alta y edición sobre los núcleos | RF-42 a RF-64 |

### 4.3 Interfaz

| Archivo | Responsabilidad | RF |
|---|---|---|
| `app/ui/students/students-header.tsx` | Breadcrumb, título, descripción y botón de alta del tutor | RF-14 a RF-16 |
| `app/ui/students/tutor-students-view.tsx` | Listado propio, estado vacío, avisos y acciones | RF-12 a RF-28, RF-65 a RF-67 |
| `app/ui/students/admin-students-view.tsx` | Padrón, filtros, paginación, dirección y avisos | RF-88 a RF-114 |
| `app/ui/students/student-table.tsx` | Tabla semántica por rol | RF-17, RF-89 |
| `app/ui/students/student-row-actions.tsx` | Menú de acciones por rol | RF-23 a RF-28 |
| `app/ui/students/student-filters.tsx` | Filtros, validación local y aplicación explícita | RF-90 a RF-96 |
| `app/ui/students/student-empty-state.tsx` | Estado vacío del tutor y del padrón | RF-14, RF-107 |
| `app/ui/students/student-unavailable-dialog.tsx` | Diálogo de baja no disponible | RF-66, RF-67 |
| `app/ui/students/student-detail.tsx` | Secciones del detalle y variante por rol | RF-70 a RF-82 |
| `app/ui/students/student-form.tsx` | Formulario compartido de alta y edición | RF-29 a RF-64 |
| `app/ui/students/student-form-fields.tsx` | Campos, ayudas y lecturas de DNI y CUIL | RF-30 a RF-38, RF-51 a RF-53 |
| `app/ui/students/student-states.tsx` | Estados de acceso denegado, no encontrado y error | RF-83 a RF-86, RF-108 a RF-110 |

### 4.4 Rutas

| Archivo | RF |
|---|---|
| `app/dashboard/students/page.tsx` | RF-12 a RF-114 |
| `app/dashboard/students/loading.tsx` | RNF-12 |
| `app/dashboard/students/error.tsx` | RNF-12 |
| `app/dashboard/students/new/page.tsx` | RF-29 a RF-49 |
| `app/dashboard/students/new/loading.tsx` | RNF-12 |
| `app/dashboard/students/new/error.tsx` | RNF-12 |
| `app/dashboard/students/[studentId]/page.tsx` | RF-70 a RF-87 |
| `app/dashboard/students/[studentId]/loading.tsx` | RNF-12 |
| `app/dashboard/students/[studentId]/error.tsx` | RNF-12 |
| `app/dashboard/students/[studentId]/edit/page.tsx` | RF-50 a RF-64 |
| `app/dashboard/students/[studentId]/edit/loading.tsx` | RNF-12 |
| `app/dashboard/students/[studentId]/edit/error.tsx` | RNF-12 |

## 5. Archivos modificados

| Archivo | Cambio |
|---|---|
| `app/lib/sidebar/navigation.ts` | TUTOR: «Mis hijos» habilitado con `/dashboard/students` y coincidencia por prefijo. ADMINISTRATIVO y ADMINISTRADOR: «Alumnos» habilitado con el mismo destino |
| `tests/sidebar/navigation.test.ts` | Etiquetas, habilitación y estado activo del módulo |
| `app/lib/validation/register.ts` | `getBirthdateError` acepta edad mínima opcional; 18 por defecto |
| `app/ui/auth/birthdate-picker.tsx` | Prop `minimumAge` opcional; 18 por defecto |
| `eslint.config.mjs` | `@typescript-eslint/no-explicit-any` como error |
| `package.json` | Scripts `typecheck` y `test`; sin dependencias nuevas |
| `MEMORY.md` | Estado de la spec, decisiones y verificación |
| `specs/009-sidebar/spec.md`, `plan.md`, `tasks.md` | Cambio de navegación por la spec 012 |

## 6. Archivos eliminados o reemplazados

- `app/dashboard/students/studentId/page.tsx`: se reemplaza por `[studentId]`; el segmento literal no admite identificadores reales.
- `app/dashboard/students/page.tsx`: hoy está vacío; se reescribe.
- `app/dashboard/students/loading.tsx` y `error.tsx`: se revisan y reescriben si no cumplen RNF-12.
- `app/lib/api/students.ts`, `app/lib/actions/students.ts`, `app/lib/validation/students.ts` y `app/lib/students/types.ts`: se reescriben; se elimina todo `any`, cast inseguro y helper no usado.
- No se eliminan archivos de Cursos ni de Usuarios.

## 7. Lógica pura

- **Acceso:** `isStudentReaderRole`, `isTutorRole`, `canReadAllStudents`, `canWriteStudents`, `getStudentPageDecision`, `getStudentSectionDecision`, `getStudentActionRoleDecision`.
- **Etiquetas y formato:** `STUDENT_NO_INFO_LABEL`, `GENDER_OPTIONS`, `isGender`, `formatStudentFullName`, `formatStudentSortName`, `getStudentRowActionsLabel`, `formatStudentDate`, `STUDENT_NOTICES`.
- **Filtros:** `getDefaultStudentFilters`, `clearStudentFilters`, `hasActiveStudentFilters`, `normalizeStudentDigits`, `isStudentIdentifierInput`, `filterStudents`, `paginateStudents`.
- **Dirección:** `STUDENTS_PATH`, `studentNewPath`, `studentDetailPath`, `studentEditPath`, `parseStudentUrl`, `serializeStudentFilters`, `sanitizeStudentReturnPath`, `getStudentReturnLabel`.
- **Almacenamiento:** `parseStoredStudentFilters`, `serializeStudentFiltersForStorage`, `readStudentFilters`, `writeStudentFilters`, `clearStudentFiltersStorage`.
- **Acciones:** `getStudentRowActionDefinitions`.
- **Validación:** `STUDENT_FORM_FIELDS`, `STUDENT_VALIDATION_MESSAGES`, `getEmptyStudentForm`, `studentToFormInput`, `readStudentFormData`, `validateStudentFilter`, `validateStudentInput`, `buildStudentCreatePayload`, `buildStudentUpdatePayload`, `mapStudentFieldErrors`, `translateStudentFieldErrors`.
- **Estados:** `toStudentListState`, `toStudentDetailState`, `toStudentActionState`.
- **Núcleos:** `createStudentActionCore`, `updateStudentActionCore`.
- **API:** `parseStudent`, `parseStudentTutor`, `parseStudentListMeta`, `parseStudentListResponse`, `parseStudentDetailResponse`, `parseStudentMutationResponse`.

Regla: ninguna de estas funciones importa `next/headers`, `next/navigation` ni `react`.

## 8. Contrato con el servicio

- Lecturas: `GET /api/students/me`, `GET /api/students?per_page=100&page=N`, `GET /api/students/{id}`, `GET /api/students/{id}/tutor`.
- Escrituras: `POST /api/students` y `PUT /api/students/{id}`.
- Cabeceras: `Accept`, `Authorization` con Bearer y `Content-Type` solo con cuerpo.
- Opciones: `credentials: "omit"`, `cache: "no-store"`, `redirect: "manual"`, `AbortSignal.timeout` de 10 segundos.
- Clasificación: éxito, `401`, `403`, `404`, `422`, `5xx`, red, tiempo agotado, cuerpo inválido y configuración ausente.
- Paginación: se usan `current_page`, `last_page`, `per_page` y `total`; si faltan o son inconsistentes, la respuesta es inválida y no se muestran datos parciales.
- Alta: `201` con alumno en `data`; si el cuerpo no trae un alumno válido, se trata como fallo.
- Edición: `200` con alumno actualizado; se envían solo los campos editables y `null` para los opcionales vaciados.
- Nunca se registran DNI, CUIL, correo, teléfono ni token en consola.

## 9. Cumplimiento de la constitución

| Principio | Cumplimiento en este plan |
|---|---|
| 1. SDD | Se escribe la spec 012 antes del plan; la spec 009 se actualiza antes de tocar la navegación; no se codifica sin aprobación |
| 2. TypeScript estricto | Reescritura sin `any` ni casts inseguros; `no-explicit-any` como error; tipos `readonly` y uniones cerradas |
| 3. Separación de capas | Rutas en `app/dashboard/students`, UI en `app/ui/students`, lógica en `app/lib/students`, red en `app/lib/api`, validación en `app/lib/validation` y acciones en `app/lib/actions` |
| 4. Pureza visual | Las piezas de `app/ui/students` reciben datos y callbacks por props; no hacen `fetch` ni HTTP |
| 5. Server Components primero | Páginas y detalle son servidor; `'use client'` solo en vistas interactivas, filtros, formulario, menú, diálogo y aviso |
| 6. API centralizada | Solo `app/lib/api/students.ts` habla con Laravel; sobre `{data, message, errors}` uniforme |
| 7. Idioma | Identificadores y tipos en inglés; textos, etiquetas y comentarios en español |
| 8. Dependencias | Sin paquetes nuevos; se reutiliza `react-day-picker` ya aprobado |
| 9. Fechas y estados | ISO de entrada, DD/MM/AAAA de salida, sin desplazamiento de zona; tipos inmutables |
| 10. Planificación y verificación | Plan aprobado antes de codificar; verificación con typecheck, lint, suite y build |
| 11. Next.js optimizado | Sin imágenes nuevas; logo y assets existentes; metadata propia por ruta |
| 12. Loading y error | `loading.tsx` y `error.tsx` en listado, alta, detalle y edición |
| 13. Caché | `no-store` en lecturas, memoización por render y `revalidatePath` tras escrituras |
| 14. Assets | No se agregan imágenes; se reutiliza el icono de alumnos y la ilustración vacía existente. Si el plan de tareas necesitara una nueva, se declara carpeta, nombre y descripción |
| 15. Tailwind en Markdown | Este plan no incluye clases utilitarias ni el patrón prohibido; los colores se citan por token o en lenguaje natural |

## 10. Saneamiento del código existente

- **S1. Tipos.** Reescribir `app/lib/students/types.ts` con uniones cerradas, `readonly`, estados discriminados y sin duplicar tipos de otras capas.
- **S2. Cliente de API.** Reescribir `app/lib/api/students.ts`: eliminar los cinco `any`, envolver `fetch` en `try/catch`, clasificar `AbortError` y `TimeoutError`, agregar listado general paginado, detalle, tutor y escrituras, y parsear el sobre con guardas de tipo.
- **S3. Validación.** Reescribir `app/lib/validation/students.ts`: mensajes exactos, payload de alta y de edición separados, `null` para opcionales vaciados, mapeo y traducción de errores del servicio, validación de filtros y reutilización de `isValidDni`, `isValidCuil`, `isValidEmail`, `normalizeDigits`, `trimText` y `fromIsoDate`.
- **S4. Acciones.** Reescribir `app/lib/actions/students.ts`: núcleos testeables en `action-core.ts`, guardia de tutor, redirecciones con aviso y revalidación; sin acción de baja.
- **S5. Rutas.** Eliminar el segmento literal `studentId`, crear `[studentId]` y completar `page.tsx`; reescribir `loading.tsx` y `error.tsx`.
- **S6. Regla de lint.** Agregar `@typescript-eslint/no-explicit-any` como error y comprobar que no quedan `any` en `app/lib/students`, `app/lib/api/students.ts`, `app/lib/validation/students.ts` ni `app/lib/actions/students.ts`.
- **S7. Scripts.** Agregar `typecheck` y `test` a `package.json` para que la verificación del principio 10 sea reproducible.
- **S8. Deuda documental.** Corregir la numeración duplicada de la constitución: el segundo principio 15 pasa a 16. Es una tarea de documentación, sin efecto funcional.

## 11. Actualización de la spec 009

- **U1. Spec.** Agregar una sección de cambio con fecha y origen en 012: el `TUTOR` pasa de «Mis alumnos» a «Mis hijos»; «Alumnos» queda habilitado para `ADMINISTRATIVO` y `ADMINISTRADOR` con destino `/dashboard/students` y coincidencia por prefijo; el `TUTOR` no ve «Alumnos».
- **U2. Plan.** Actualizar el inventario de navegación, la tabla de opciones habilitadas y las pruebas de estado activo.
- **U3. Tareas.** Agregar tareas de cambio con «Hecho cuando» verificable: etiqueta, destino, habilitación, estado activo en lista y subpantallas, ausencia de la opción para el rol incorrecto y suite de navegación en verde.
- **U4. Pruebas.** Actualizar `tests/sidebar/navigation.test.ts` en etiquetas, habilitados y rutas activas; mantener las pruebas de colapso, drawer y secciones.
- **U5. Regresión.** Verificar que el menú colapsado, el drawer, el pie de cuenta y los módulos Cursos y Usuarios no cambian.

Orden obligatorio: U1, U2, U3 y U4 antes de modificar `navigation.ts`.

## 12. Estrategia de pruebas

### 12.1 Unitarias

- `tests/students/access.test.ts`: roles admitidos, lectura total y escritura exclusiva.
- `tests/students/labels.test.ts`: nombre completo, «No informado», fechas, avisos y nombre de acciones.
- `tests/students/list.test.ts`: filtros combinados, normalización, filtros activos, paginación de 15 y página fuera de rango.
- `tests/students/students-url.test.ts`: parámetros permitidos, valores inválidos, retorno saneado y rutas.
- `tests/students/filters-storage.test.ts`: lectura, escritura, datos corruptos y almacenamiento no disponible.
- `tests/students/row-actions.test.ts`: acciones por rol y nombre accesible.
- `tests/students/guard.test.ts`: decisiones de página y acción sin `next/headers`.
- `tests/students/student-state.test.ts`: traducción de resultados a estados.
- `tests/students/validation.test.ts`: obligatorios, formatos, fechas, género, correo, teléfono, unicidad reportada, payloads y `null` en opcionales.
- `tests/validation/register.test.ts`: regresión de la edad mínima de 18 en el registro.

### 12.2 API y acciones

- `tests/api/students.test.ts`: parseo de alumno y tutor, listado propio, listado general con varias páginas, metadatos inválidos, detalle, tutor, alta `201`, edición `200`, `401`, `403`, `404`, `422`, `5xx`, red, tiempo agotado y cuerpo inválido.
- `tests/actions/students.test.ts`: validación local sin solicitud, éxito con redirección, `401`, `403`, `422` y fallo de transporte; revalidación de listado y detalle.

### 12.3 Extremo a extremo

- Tutor: estado vacío, alta, listado con el alumno nuevo, alta de un segundo alumno, detalle, edición, aviso de baja no disponible y regreso al listado.
- Administrativo y administrador: padrón, filtros por DNI, CUIL, nombre y apellido, limpiar filtros, paginación, detalle con tutor responsable, ausencia de acciones de escritura y acceso denegado a alta y edición.
- Sesión: sin cookie redirige; `403` muestra acceso denegado; `401` descarta la sesión.
- Accesibilidad: árbol AX, teclado, foco en menús y diálogo, anuncios, contraste y foco visible.
- Responsive: 320, 375, 768, 1024, 1440 y 1920 sin desborde; texto al 200 por ciento.
- Privacidad: token fuera de HTML, dirección y almacenamiento; DNI y CUIL fuera de la dirección; consola sin datos personales.
- Regresión: Cursos, Usuarios, menú lateral, login, registro y recuperación.

### 12.4 Comandos

- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `node --experimental-strip-types --test` o `pnpm test` cuando se agregue el script
- `pnpm build`

## 13. Matriz de cobertura

| RF | Implementación |
|---|---|
| RF-1 a RF-11 | `navigation.ts`, `guard.ts`, páginas y pruebas de navegación |
| RF-12 a RF-22 | `api/students.ts`, `data.ts`, `tutor-students-view.tsx`, `student-empty-state.tsx` |
| RF-23 a RF-28 | `row-actions.ts`, `student-row-actions.tsx`, `RowActionsMenu` |
| RF-29 a RF-49 | `validation/students.ts`, `api/students.ts`, `action-core.ts`, `actions/students.ts`, `student-form.tsx`, `new/page.tsx` |
| RF-50 a RF-64 | validación, API, `action-core.ts`, `student-form.tsx`, `[studentId]/edit/page.tsx` |
| RF-65 a RF-69 | `row-actions.ts`, `student-unavailable-dialog.tsx` |
| RF-70 a RF-87 | `[studentId]/page.tsx`, `student-detail.tsx`, `data.ts`, `api/students.ts`, `student-states.tsx` |
| RF-88 a RF-114 | `data.ts`, `admin-students-view.tsx`, `student-filters.tsx`, `student-table.tsx`, `UserPagination`, `student-states.tsx` |
| RF-115 a RF-126 | API centralizada, guardias, avisos, estados y pruebas transversales |

## 14. Riesgos y dudas abiertas

- **Volumen del padrón.** Cargar todo el conjunto puede crecer; se mitiga con `per_page=100`, tope de 100 páginas y error sin datos parciales. Si el volumen lo exige, se reevalúa el filtrado en servidor con una revisión de privacidad.
- **Campos de `/students/me`.** Si el listado propio no devuelve correo, teléfono, lugar de nacimiento o domicilio, el detalle del tutor muestra «No informado». Queda pendiente de backend.
- **Baja.** No hay endpoint; solo se informa la indisponibilidad. Queda pendiente de backend.
- **Borrado de opcionales.** Enviar `null` debe borrar el dato; falta confirmación del backend.
- **Cambio compartido de fecha.** La edad mínima opcional afecta un componente usado por el registro; se cubre con regresión.
- **Acoplamiento de piezas reutilizadas.** Se usan componentes con nombres de Cursos y Usuarios; se acepta por composición y se deja la extracción neutral como deuda futura.
- **Persistencia de filtros sensibles.** `sessionStorage` aplica los identificadores después del montaje; se anuncia el cambio para evitar confusión y se limpia al cerrar la pestaña.

## 15. Orden de ejecución

1. Escribir la spec 012 con los ajustes de la revisión QA.
2. Actualizar la spec, el plan y las tareas de 009 (U1 a U4).
3. Saneamiento de tipos, API, validación y acciones (S1 a S4).
4. Navegación y pruebas de sidebar.
5. Listado del tutor y estado vacío.
6. Alta y acción de creación.
7. Detalle del alumno.
8. Edición y acción de actualización.
9. Padrón administrativo, filtros, paginación y dirección.
10. Diálogo de baja no disponible y avisos.
11. Segmentos de carga y error, metadata y estados.
12. Pruebas unitarias, API, acciones, extremo a extremo, accesibilidad, responsive y privacidad.
13. Verificación final, actualización de `MEMORY.md` y cierre.
