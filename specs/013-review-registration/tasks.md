# Tasks 013 — Evaluación de inscripciones

Estado: aprobado (2026-11-14)
Base: `specs/013-review-registration/spec.md` (aprobada) y `specs/013-review-registration/plan.md` (aprobado).

Cada tarea es pequeña (20–30 min), en orden de dependencia. Verificación por tarea: `pnpm typecheck` limpio y `pnpm lint` 0 errores (salvo avisos preexistentes).

## Fase A — Base de dominio

- [x] **T1. Tipos inmutables del dominio.** RF-1 a RF-103
  - Hecho cuando: `app/lib/registrations/types.ts` define inscripción, alumno, curso, tutor, filtros, pestañas, página, estados y formularios de dictamen con uniones cerradas y `readonly`; `pnpm typecheck` limpio.
- [x] **T2. Acceso por rol.** RF-1, RF-8
  - Hecho cuando: `access.ts` expone `isStaffRole` y `canEvaluateRegistrations`; `tests/registrations/access.test.ts` con 4/4 en verde.
- [x] **T3. Etiquetas y formato.** RF-31, RF-36, RF-37 a RF-41
  - Hecho cuando: `labels.ts` expone rótulos de estado, ciclo, turno, especialidad, «No informado», iniciales/abreviaturas de estado y `formatRegistrationDate`; `tests/registrations/labels.test.ts` en verde.
- [x] **T4. Pestañas y mapeo de estado.** RF-10 a RF-12, RF-21
  - Hecho cuando: `status.ts` expone `REGISTRATION_STATUS_TABS`, `DEFAULT_STATUS_TAB`, `statusToParam`, `paramToStatus` y `getStatusShortLabel`; `tests/registrations/status.test.ts` en verde.

## Fase B — Lógica pura del listado

- [x] **T5. Máscara de CUIL.** RF-18
  - Hecho cuando: `cuil.ts` expone `formatCuil` (XX-XXXXXXXX-X), `extractCuilDigits` e `isCuilComplete`; `tests/registrations/cuil.test.ts` en verde.
- [x] **T6. Normalización y filtros de alumno/curso.** RF-14 a RF-20
  - Hecho cuando: `list.ts` expone `normalizeSearch` y `filterRegistrations` (estado, alumno, curso) sin mutar la entrada; tests de filtros en verde.
- [x] **T7. Orden recientes/antiguas.** RF-13
  - Hecho cuando: `list.ts` expone `sortRegistrations` (recientes/antiguas por `created_at`, desempate por id); tests de orden en verde.
- [x] **T8. Paginación de 15.** RF-22, RF-24
  - Hecho cuando: `list.ts` expone `paginateRegistrations` y `REGISTRATION_PAGE_SIZE=15`, con página ajustada a 1..última; tests de paginación en verde.
- [x] **T9. Dirección y parámetros.** RF-9, RF-21, RF-24
  - Hecho cuando: `registrations-url.ts` expone rutas, `parseRegistrationsUrl`, `serializeRegistrationsFilters` y `sanitizeRegistrationReturnPath`; `tests/registrations/registrations-url.test.ts` en verde.
- [x] **T10. Almacenamiento de DNI/CUIL.** RF-21
  - Hecho cuando: `filters-storage.ts` lee/escribe/limpia DNI y CUIL en `sessionStorage` con almacenamiento inyectable y tolerancia a fallos; tests en verde.
- [x] **T11. Selector de reasignación.** RF-74 a RF-76
  - Hecho cuando: `reassignment.ts` expone `getAvailableCoursesForYear` e `isSelectorEmpty`; `tests/registrations/reassignment.test.ts` en verde.

## Fase C — Validación y red

- [x] **T12. Validación de dictámenes.** RF-59, RF-65, RF-69, RF-74, RF-77
  - Hecho cuando: `validation/registrations.ts` define campos, observaciones obligatorias, motivo obligatorio y materias; tests de validación en verde.
- [x] **T13. Payloads y traducción de errores.** RF-59, RF-65, RF-69, RF-74, RF-77
  - Hecho cuando: `validation/registrations.ts` expone `buildApprovePayload`, `buildRejectPayload`, `buildObservePayload`, `buildReassignPayload`, `mapDictamenFieldErrors` y `translateDictamenFieldErrors`; tests en verde.
- [x] **T14. Parseo de inscripción, listado y detalle.** RF-9 a RF-28, RF-34 a RF-47
  - Hecho cuando: `api/registrations.ts` expone `parseRegistration`, `parseRegistrationListResponse` y `parseRegistrationDetailResponse` (sobre `{data, message, errors}`, meta válida); `tests/api/registrations.test.ts` en verde.
- [x] **T15. Padrón multipágina.** RF-25
  - Hecho cuando: `api/registrations.ts` recorre páginas con `per_page=100` y tope de 100, con fallo atómico; tests de multipágina y meta inválida en verde.
- [x] **T16. Escrituras de dictámenes.** RF-57 a RF-82
  - Hecho cuando: `api/registrations.ts` expone approve/reject/observe/propose-reassignment con parseo de `200`, `401`, `403`, `404`, `409`, `422`, `5xx`, red y timeout; tests en verde.
- [x] **T17. Descarga binaria del PDF.** RF-51 a RF-56
  - Hecho cuando: `api/registration-form.ts` descarga el blob con nombre desde `Content-Disposition` y clasifica fallos; `tests/api/registration-form.test.ts` en verde.

## Fase D — Estados, guardias, cargadores y núcleos

- [x] **T18. Decisiones puras de acceso.** RF-1 a RF-8
  - Hecho cuando: `guard-decision.ts` expone `getRegistrationPageDecision` y `getRegistrationActionRoleDecision`; tests de guardia en verde.
- [x] **T19. Guardia con cuenta y token.** RF-1 a RF-8
  - Hecho cuando: `guard.ts` usa la cuenta privada y redirige a `/session-expired` sin sesión; `tests/registrations/guard.test.ts` en verde.
- [x] **T20. Estados de lista, detalle y acción.** RF-25 a RF-28, RF-90 a RF-99
  - Hecho cuando: `registration-state.ts` expone `toRegistrationListState`, `toRegistrationDetailState` y `toDictamenActionState`; `tests/registrations/registration-state.test.ts` en verde.
- [x] **T21. Cargadores memoizados.** RF-9 a RF-28, RF-40, RF-100 a RF-103
  - Hecho cuando: `data.ts` carga padrón, detalle (`GET /api/registrations/{id}`), tutor, cursos disponibles y total de pendientes con `cache()` y sin `fetch` en componentes.
- [x] **T22. Núcleos de aprobar y rechazar.** RF-57 a RF-67
  - Hecho cuando: `action-core.ts` expone `approveActionCore` y `rejectActionCore` con dependencias inyectadas y revalidación de listado, detalle y contador; `tests/actions/registrations.test.ts` en verde.
- [x] **T23. Núcleos de devolver y reasignar.** RF-68 a RF-82
  - Hecho cuando: `action-core.ts` expone `observeActionCore` y `reassignActionCore` con revalidación de listado, detalle y contador; tests de acciones en verde.
- [x] **T24. Server Actions.** RF-57 a RF-82
  - Hecho cuando: `actions/registrations.ts` conecta los núcleos con la guardia, la API, `revalidatePath` y redirección; `pnpm typecheck` limpio.

## Fase E — Navegación

- [x] **T25. Habilitar «Inscripciones».** RF-1, RF-2, RF-3
  - Hecho cuando: `app/lib/sidebar/navigation.ts` habilita «Inscripciones» para `ADMINISTRATIVO`/`ADMINISTRADOR` con `/dashboard/registrations` (prefijo) y la mantiene «Próximamente» para `TUTOR`; `tests/sidebar/navigation.test.ts` en verde.

## Fase F — Listado

- [x] **T26. Encabezado.** RF-9
  - Hecho cuando: `registrations-header.tsx` muestra breadcrumb «Inicio > Inscripciones», título y descripción; `pnpm typecheck` limpio.
- [x] **T27. Pestañas de estado.** RF-10 a RF-12
  - Hecho cuando: `status-tabs.tsx` renderiza las seis pestañas con la activa anunciada y sincroniza `?status=`; `pnpm typecheck` limpio.
- [x] **T28. Filtros y búsqueda en vivo.** RF-14 a RF-20
  - Hecho cuando: `registration-filters.tsx` busca en vivo con debounce y valida DNI/CUIL solo dígitos (CUIL con máscara), con «Limpiar filtros»; `pnpm typecheck` limpio.
- [x] **T29. Tarjeta resumida.** RF-29 a RF-33
  - Hecho cuando: `registration-card.tsx` muestra alumno, CUIL, curso, estado y fecha, y navega al detalle; `pnpm typecheck` limpio.
- [x] **T30. Paginación con página editable.** RF-22 a RF-24
  - Hecho cuando: `registration-pagination.tsx` muestra Inicio/Anterior/[páginas]/Siguiente/Final con la página actual editable (dígitos + Enter); `pnpm typecheck` limpio.
- [x] **T31. Estados y esqueletos.** RF-25 a RF-28
  - Hecho cuando: `registration-states.tsx` distingue vacío, sin coincidencias, error, denegado y no encontrado; `registration-skeletons.tsx` accesible; `pnpm typecheck` limpio.
- [x] **T32. Vista coordinadora.** RF-9 a RF-28
  - Hecho cuando: `registrations-view.tsx` coordina pestañas, filtros, orden, paginación y URL sin refetch al filtrar; `pnpm typecheck` limpio.
- [x] **T33. Ruta del listado.** RF-1 a RF-33
  - Hecho cuando: `app/dashboard/registrations/page.tsx` valida acceso, carga el padrón y resuelve estados; `loading.tsx` y `error.tsx` presentes; `pnpm build` en verde.

## Fase G — Detalle

- [x] **T34. Detalle en dos columnas.** RF-34 a RF-47
  - Hecho cuando: `registration-detail.tsx` muestra datos, tutor, certificados, estado y botones en dos columnas; `pnpm typecheck` limpio.
- [x] **T35. Botones flotantes móviles.** RF-36, RF-90
  - Hecho cuando: `registration-status-fab.tsx` (etiqueta corta P/O/PR/A/R → nombre completo) y `registration-actions-fab.tsx` (icono → acciones, oculto/deshabilitado sin dictámenes) accesibles; `pnpm typecheck` limpio.
- [x] **T36. Ruta del detalle.** RF-34 a RF-99
  - Hecho cuando: `[registrationId]/page.tsx` obtiene la inscripción con `GET /api/registrations/{id}` y el tutor, con `loading.tsx` y `error.tsx`; `pnpm build` en verde.

## Fase H — Formulario PDF

- [x] **T37. Modal del PDF.** RF-51 a RF-56
  - Hecho cuando: `pdf-modal.tsx` muestra el PDF embebido con «Descargar» e «Imprimir» (ajustar al área de impresión) y error sin archivo; `pnpm typecheck` limpio.

## Fase I — Dictámenes

- [x] **T38. Alerta de elección de aprobar.** RF-57, RF-58
  - Hecho cuando: `approve-choice-dialog.tsx` ofrece «Aprobar en el curso solicitado» / «Reasignar a otro curso»; `pnpm typecheck` limpio.
- [x] **T39. Alerta de confirmación.** RF-83 a RF-89
  - Hecho cuando: `dictamen-confirm-dialog.tsx` identifica solicitud, describe la acción y ofrece confirmar/volver atrás, con foco atrapado; `pnpm typecheck` limpio.
- [x] **T40. Devolver con observaciones.** RF-68 a RF-72
  - Hecho cuando: `observe-dialog.tsx` exige observaciones y confirma antes de enviar; `pnpm typecheck` limpio.
- [x] **T41. Rechazar.** RF-64 a RF-67
  - Hecho cuando: `reject-dialog.tsx` recolecta opcionales y confirma antes de enviar; `pnpm typecheck` limpio.
- [x] **T42. Reasignar.** RF-73 a RF-82
  - Hecho cuando: `reassign-dialog.tsx` ofrece selector de disponibles, motivo y opcionales, advierte la aceptación del tutor y confirma; `pnpm typecheck` limpio.

## Fase J — Contador del dashboard

- [x] **T43. Contador de pendientes.** RF-100 a RF-103
  - Hecho cuando: `pending-registrations-card.tsx` muestra el total de pendientes y enlaza a `?status=PENDING`, solo para roles altos, omitiéndose si falla y revalidado tras cada dictamen; `pnpm typecheck` limpio.

## Fase K — Pruebas unitarias, API y acciones

- [x] **T44. Unitarias de dominio.** RF-1, RF-8, RF-31, RF-36, RF-10 a RF-12
  - Hecho cuando: `tests/registrations/{access,labels,status}.test.ts` en verde.
- [x] **T45. Unitarias de listado.** RF-13 a RF-24, RF-74 a RF-76
  - Hecho cuando: `tests/registrations/{list,cuil,registrations-url,filters-storage,reassignment}.test.ts` en verde.
- [x] **T46. Unitarias de estado y validación.** RF-25 a RF-28, RF-59, RF-65, RF-69, RF-74, RF-77, RF-90 a RF-99
  - Hecho cuando: `tests/registrations/{guard,registration-state,validation}.test.ts` en verde.
- [x] **T47. API de registros.** RF-9 a RF-82
  - Hecho cuando: `tests/api/registrations.test.ts` cubre padrón multipágina, meta inválida, dictámenes, `401`, `403`, `404`, `409`, `422`, `5xx`, red, timeout y cuerpo inválido.
- [x] **T48. API del PDF.** RF-51 a RF-56
  - Hecho cuando: `tests/api/registration-form.test.ts` cubre descarga binaria, nombre y fallo.
- [x] **T49. Acciones.** RF-57 a RF-82
  - Hecho cuando: `tests/actions/registrations.test.ts` cubre validación local sin solicitud, éxito con revalidación, `401`, `403`, `404`, `409`, `422` y fallo de transporte.

## Fase L — Extremo a extremo y cierre

- [x] **T50. E2E del listado.** RF-9 a RF-33
  - Hecho cuando: recorrido de pestañas, búsqueda en vivo, filtros, orden, paginación con página editable y CUIL con máscara, sin errores de consola.
- [x] **T51. E2E de detalle y PDF.** RF-34 a RF-56
  - Hecho cuando: dos columnas en web, FABs en móvil, tutor, certificados y PDF (ver/descargar/imprimir) sin errores de consola.
- [x] **T52. E2E de dictámenes.** RF-57 a RF-89
  - Hecho cuando: aprobar (elección y curso lleno), rechazar, devolver y reasignar con confirmaciones y volver atrás; una sola solicitud por envío.
- [x] **T53. E2E de contador y sesión.** RF-100 a RF-103, RF-90 a RF-99
  - Hecho cuando: contador visible solo para roles altos y enlazando a «Pendientes»; `401`, `403`, `404`, `422`, `409` y red con precedencias.
- [x] **T54. Accesibilidad.** RNF-3, RNF-4
  - Hecho cuando: árbol AX correcto, teclado completo, foco en diálogos/FABs/modal, anuncios y contraste verdes.
- [x] **T55. Responsive.** RNF-5
  - Hecho cuando: sin desborde en 320/375/768/1024/1440/1920 y texto al 200 %, incluido el detalle de dos columnas.
- [x] **T56. Privacidad.** RNF-7
  - Hecho cuando: token fuera de HTML/URL/almacenamiento; DNI y CUIL fuera de la URL; consola sin datos personales.
- [x] **T57. Regresión.** RNF-14
  - Hecho cuando: suite completa en verde y smoke de Cursos, Alumnos, Usuarios, login, registro y recuperación sin cambios.
- [x] **T58. Verificación final y cierre.** RNF-9 a RNF-13, RNF-18
  - Hecho cuando: `pnpm typecheck` limpio, `pnpm lint` 0 errores, `pnpm test` en verde y `pnpm build` en verde; `package.json` sin dependencias nuevas; `MEMORY.md` y `spec.md` actualizados.

## Resumen de trazabilidad

- RF-1 a RF-8 → T2, T18, T19, T25.
- RF-9 a RF-33 → T4 a T10, T14, T15, T21, T26 a T33, T50.
- RF-34 a RF-56 → T17, T21, T34 a T37, T51.
- RF-57 a RF-89 → T12, T13, T16, T22 a T24, T38 a T42, T49, T52.
- RF-90 a RF-103 → T20, T43, T53.
- RNF → T54 a T58.
