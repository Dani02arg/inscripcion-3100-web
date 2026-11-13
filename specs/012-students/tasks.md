# Tareas 012 — Módulo de alumnos

Estado: propuesto (pendiente de aprobación)
Plan: `specs/012-students/plan.md`
Regla: una tarea por vez, con prueba primero cuando corresponda, y se marca al verificarla.

## Fase A — Cambio documental de la spec 009

- [x] **T1. Actualizar `specs/009-sidebar/spec.md` con el cambio de la spec 012.** RF-1, RF-2, RF-4
  - Hecho cuando: una sección de cambio con fecha y origen en 012 actualiza la tabla de opciones y los requisitos de inventario; el `TUTOR` figura con «Mis hijos»; «Alumnos» figura habilitado para los roles administrativos con destino `/dashboard/students`; no quedan afirmaciones contradictorias en el resto del documento.

- [x] **T2. Actualizar `specs/009-sidebar/plan.md`.** RF-1 a RF-5
  - Hecho cuando: el inventario, la tabla de opciones habilitadas, el estado activo y las pruebas reflejan la nueva etiqueta y la habilitación del módulo.

- [x] **T3. Actualizar `specs/009-sidebar/tasks.md` con las tareas del cambio.** RF-1 a RF-5
  - Hecho cuando: hay tareas nuevas con RF y «Hecho cuando» para etiqueta, destino, habilitación, estado activo y pruebas; las tareas anteriores se mantienen.

## Fase B — Navegación y acceso

- [x] **T4. Habilitar las opciones de alumnos en `app/lib/sidebar/navigation.ts`.** RF-1, RF-2, RF-4, RF-5
  - Hecho cuando: `TUTOR` recibe «Mis hijos» habilitado, `ADMINISTRATIVO` y `ADMINISTRADOR` reciben «Alumnos» habilitado, todos con `/dashboard/students` y coincidencia por prefijo; «Cursos», «Gestión de usuarios» y «Mi perfil» conservan su posición.

- [x] **T5. Actualizar `tests/sidebar/navigation.test.ts`.** RF-1, RF-2, RF-4, RF-5
  - Hecho cuando: las listas esperadas usan «Mis hijos» y «Alumnos», los habilitados incluyen el módulo, el estado activo cubre lista, alta, detalle y edición, y la suite de sidebar queda en verde.

- [x] **T6. Crear `app/lib/students/access.ts` y `guard-decision.ts` con pruebas.** RF-6, RF-10, RF-25, RF-26, RF-29, RF-64, RF-113
  - Hecho cuando: los roles de lectura y escritura, la denegación de alta y edición a roles administrativos y las decisiones de página y acción están cubiertos por tests puros sin importar `next/headers`.

- [x] **T7. Crear `app/lib/students/guard.ts` para páginas y acciones.** RF-6, RF-7, RF-8, RF-9, RF-115, RF-116
  - Hecho cuando: una sesión ausente redirige a `/session-expired`, un rol no habilitado devuelve acceso denegado sin solicitar datos y una acción no llamada por tutor no obtiene token; la verificación estática queda limpia.

## Fase C — Dominio y saneamiento

- [x] **T8. Reescribir `app/lib/students/types.ts` sin `any`.** RF-12 a RF-126
  - Hecho cuando: alumno, tutor, filtros, página, resultados, estados, formulario, notificaciones y acciones tienen tipos inmutables y uniones cerradas; la comprobación de tipos no reporta errores.

- [x] **T9. Crear `app/lib/students/labels.ts` y sus tests.** RF-17, RF-23, RF-72 a RF-79, RF-89, RF-122
  - Hecho cuando: nombre completo, nombre de fila, nombre accesible de acciones, etiquetas de género, «No informado», formato de fecha y textos de avisos están cubiertos, incluidos valores nulos y fechas inválidas.

- [x] **T10. Crear `app/lib/students/list.ts` y sus tests.** RF-90 a RF-100, RF-106
  - Hecho cuando: filtros combinados, normalización de nombres, filtros activos, paginación de 15, página fuera de rango y lista vacía están cubiertos sin mutar la entrada.

- [x] **T11. Crear `app/lib/students/students-url.ts` y sus tests.** RF-11, RF-97, RF-98, RF-104
  - Hecho cuando: se leen y escriben solo nombre, apellido y página, se descartan valores inválidos, se conservan parámetros ajenos y el retorno al listado solo acepta rutas internas del módulo.

- [x] **T12. Crear `app/lib/students/filters-storage.ts` y sus tests.** RF-97, RF-98
  - Hecho cuando: DNI y CUIL se serializan, se restauran y se limpian; datos corruptos, ausencia de almacenamiento y cuota agotada no lanzan y devuelven filtros vacíos.

- [x] **T13. Crear `app/lib/students/row-actions.ts` y sus tests.** RF-23 a RF-28
  - Hecho cuando: el tutor recibe ver, editar y eliminar; los roles administrativos reciben solo ver; el nombre accesible usa apellido y nombre; un rol desconocido no recibe acciones.

- [x] **T14. Crear `app/lib/students/student-state.ts` y sus tests.** RF-12 a RF-126
  - Hecho cuando: resultados exitosos, vacíos, sin coincidencias, no encontrados, denegados y fallidos se traducen a estados excluyentes, sin mostrar vacío junto con error.

## Fase D — Validación

- [x] **T15. Reescribir la validación de campos y filtros en `app/lib/validation/students.ts`.** RF-31 a RF-40, RF-54, RF-55, RF-92, RF-93
  - Hecho cuando: DNI, CUIL, nombres, fecha, género, correo, teléfono, lugar y domicilio se validan con los mensajes de la spec; DNI y CUIL de filtros solo admiten dígitos; hay tests de límites y formatos.

- [x] **T16. Implementar payloads y traducción de errores en la validación.** RF-41, RF-44, RF-56, RF-59, RF-119
  - Hecho cuando: el alta envía las diez claves y la edición excluye DNI y CUIL, envía `null` en opcionales vacíos, mapea errores conocidos, deriva los desconocidos a un aviso general y descarta claves ajenas; tests en verde.

- [x] **T17. Extender la edad mínima de fecha de nacimiento.** RF-34, RNF-14
  - Hecho cuando: `getBirthdateError` y `BirthdatePicker` aceptan una edad mínima opcional con 18 por defecto, el alta de alumnos usa 0, el registro conserva su comportamiento y la suite de registro sigue en verde.

## Fase E — Cliente de API

- [x] **T18. Reescribir el parseo de `app/lib/api/students.ts` sin `any`.** RF-125
  - Hecho cuando: alumno, tutor, metadatos y sobres se parsean con guardas de tipo; identificadores numéricos o de texto se normalizan; campos obligatorios ausentes, género desconocido y metadatos inválidos devuelven `null`; tests de parseo en verde.

- [x] **T19. Implementar los listados propio y general.** RF-12, RF-19, RF-88, RF-103
  - Hecho cuando: `listMyStudents` devuelve el listado propio sin paginar; `listAllStudents` recorre páginas de 100 con tope de 100 y falla sin datos parciales; tests con `fetch` inyectable cubren una y varias páginas, metadatos inválidos y tope excedido.

- [x] **T20. Implementar detalle y tutor responsable.** RF-70, RF-77, RF-78, RF-83
  - Hecho cuando: `getStudentDetail` y `getStudentTutor` codifican el identificador, clasifican `401`, `403`, `404`, `5xx`, red y tiempo agotado, y el fallo del tutor se distingue del fallo del alumno; tests en verde.

- [x] **T21. Implementar alta y edición en el cliente de API.** RF-41, RF-43, RF-44, RF-58, RF-59, RF-60
  - Hecho cuando: el alta envía `POST` y espera `201` con alumno válido; la edición envía `PUT` con solo campos editables y espera `200`; `422`, `404`, `403` y `401` se clasifican con errores por campo; tests en verde.

- [x] **T22. Cubrir red, tiempo agotado, precedencia y configuración ausente.** RF-115 a RF-121
  - Hecho cuando: `fetch` se envuelve en `try/catch`, se distinguen `AbortError` y `TimeoutError`, se respeta la precedencia y la falta de configuración no llama a `fetch`; tests en verde.

- [x] **T23. Verificar opciones de solicitud y ausencia de datos personales en logs.** RNF-7, RF-115
  - Hecho cuando: todas las solicitudes usan Bearer, `credentials: omit`, `cache: no-store`, `redirect: manual` y timeout de 10 segundos; no se registran DNI, CUIL, correo, teléfono ni token.

## Fase F — Acciones

- [x] **T24. Crear los núcleos de alta y edición en `app/lib/students/action-core.ts` con tests.** RF-40 a RF-47, RF-55 a RF-63
  - Hecho cuando: la validación local evita la solicitud, el éxito redirige con aviso, `401` redirige, `403` y `422` conservan valores y la revalidación se invoca; tests con dependencias inyectadas en verde.

- [x] **T25. Reescribir `app/lib/actions/students.ts`.** RF-42 a RF-47, RF-57 a RF-63
  - Hecho cuando: ambas acciones usan la guardia de tutor, los núcleos, `revalidatePath` y las redirecciones; no existe acción de baja; `tsc` y lint limpios.

- [x] **T26. Implementar avisos y retorno saneado en las acciones.** RF-43, RF-58, RF-87
  - Hecho cuando: el alta redirige con `created=1`, la edición con `updated=1` y el origen saneado, y un retorno inválido vuelve al listado sin filtros; tests de serialización en verde.

## Fase G — Formularios y rutas de alta y edición

- [x] **T27. Usar el selector de fecha sin edad mínima en el formulario de alumnos.** RF-34
  - Hecho cuando: el alta y la edición aceptan fechas de menores, rechazan fechas futuras e inválidas y el registro conserva la regla de 18 años. (Selector con `minimumAge=0` y validación sin edad mínima listos; se integrará en los formularios de T28/T29; verificado con `tests/students/birthdate.test.ts`, `tests/students/validation.test.ts` y `tests/validation/register.test.ts`.)

- [x] **T28. Crear `app/ui/students/student-form-fields.tsx`.** RF-30 a RF-38, RF-51 a RF-53
  - Hecho cuando: los diez campos muestran etiquetas, ayudas y errores accesibles; DNI y CUIL se muestran en lectura en edición; género usa las tres opciones; los opcionales están marcados como tales.

- [x] **T29. Crear `app/ui/students/student-form.tsx`.** RF-40 a RF-49, RF-55 a RF-63
  - Hecho cuando: valida al salir y al enviar, bloquea envíos inválidos y repetidos, muestra estado de envío, conserva valores ante errores, muestra errores por campo y aviso general, y cancela sin enviar.

- [x] **T30. Crear la ruta de alta con carga y error.** RF-29 a RF-49, RNF-12
  - Hecho cuando: `/dashboard/students/new` es solo para tutor, los roles administrativos ven acceso denegado, la página tiene metadata, `loading.tsx` y `error.tsx`, y el envío exitoso vuelve al listado con aviso.

- [x] **T31. Crear la ruta de edición con carga y error.** RF-50 a RF-64, RNF-12
  - Hecho cuando: `/dashboard/students/{id}/edit` es solo para tutor, precarga los datos, muestra DNI y CUIL en lectura, vuelve al detalle con aviso y trata el no encontrado sin revelar pertenencia.

## Fase H — Listado del tutor y detalle

- [x] **T32. Crear `app/ui/students/student-table.tsx`.** RF-17, RF-89
  - Hecho cuando: la tabla es semántica, muestra las columnas por rol, usa «Apellido, Nombre» como encabezado de fila y admite el menú de acciones como contenido de celda.

- [x] **T33. Crear `app/ui/students/student-row-actions.tsx` sobre `RowActionsMenu`.** RF-23 a RF-28
  - Hecho cuando: el menú abre con foco en el primer ítem, navega con teclado, cierra con Escape o foco fuera, devuelve el foco y muestra solo las acciones del rol.

- [x] **T34. Crear el encabezado y el estado vacío del tutor.** RF-14, RF-15, RF-16, RF-107
  - Hecho cuando: el tutor sin alumnos ve mensaje, ayuda y botón azul; con alumnos ve el botón en el encabezado; el padrón vacío muestra «No hay alumnos registrados» sin botón.

- [x] **T35. Crear `app/ui/students/tutor-students-view.tsx`.** RF-12 a RF-22, RF-65 a RF-67
  - Hecho cuando: muestra lista u estado vacío, gestiona avisos y menús, abre el diálogo de baja no disponible sin solicitud y no pagina ni filtra.

- [x] **T36. Completar `app/dashboard/students/page.tsx` para el tutor.** RF-12 a RF-22
  - Hecho cuando: la página resuelve sesión, rol y token, carga el listado propio, muestra carga, error, acceso denegado y vacío, y monta el encabezado y la vista.

- [x] **T37. Crear el diálogo de baja no disponible.** RF-65 a RF-69
  - Hecho cuando: el diálogo tiene título, explicación, botón «Entendido», foco atrapado, cierre con Escape y retorno al menú; no envía solicitudes ni altera la lista.

- [x] **T38. Crear `app/ui/students/student-detail.tsx`.** RF-70 a RF-82
  - Hecho cuando: agrupa datos personales, contacto y adicionales, muestra «No informado», muestra el tutor solo a roles administrativos, formatea fechas y ofrece editar solo al tutor.

- [x] **T39. Crear la ruta de detalle con carga y error.** RF-70 a RF-87, RNF-12
  - Hecho cuando: el tutor busca el alumno en su listado y el administrativo consulta detalle y tutor; se cubren no encontrado, acceso denegado, error con reintento, metadata y retorno con filtros.

## Fase I — Padrón administrativo

- [x] **T40. Crear `app/ui/students/student-filters.tsx`.** RF-90 a RF-96
  - Hecho cuando: hay campos separados de DNI, CUIL, nombre y apellido; DNI y CUIL validan solo dígitos; se aplica con botón o Enter; limpiar restablece todo; los valores se conservan al editar.

- [x] **T41. Crear `app/ui/students/admin-students-view.tsx`.** RF-88 a RF-114
  - Hecho cuando: filtra por los cuatro criterios, pagina de a 15, muestra página y totales, ajusta páginas fuera de rango, distingue vacío de sin resultados, sincroniza nombre, apellido y página en la dirección, restaura DNI y CUIL desde la pestaña y no expone esos datos en la dirección.

- [x] **T42. Integrar el padrón en `app/dashboard/students/page.tsx`.** RF-88 a RF-114
  - Hecho cuando: el rol administrativo recibe el conjunto completo y los filtros iniciales; el rol tutor sigue viendo su listado; la página resuelve carga, error y acceso denegado.

- [x] **T43. Integrar avisos en ambos listados.** RF-43, RF-58, RF-114, RF-122
  - Hecho cuando: el aviso de alta o edición se muestra una sola vez, dura 4 segundos, se puede cerrar, se conserva al filtrar o paginar y el parámetro se retira de la dirección.

- [x] **T44. Revisar estados de acceso denegado, no encontrado y error.** RF-9, RF-10, RF-22, RF-83 a RF-86, RF-108 a RF-110
  - Hecho cuando: cada estado tiene mensaje propio, acción de reintento o retorno, y no expone datos ni token.

## Fase J — Calidad estructural

- [x] **T45. Agregar scripts de verificación a `package.json`.** RNF-10
  - Hecho cuando: `pnpm typecheck` ejecuta `tsc --noEmit` y `pnpm test` ejecuta la suite nativa, sin agregar dependencias.

- [x] **T46. Activar `@typescript-eslint/no-explicit-any` como error.** RNF-10, plan S6
  - Hecho cuando: la regla está activa y `pnpm lint` falla si aparece un `any` explícito en el módulo.

- [x] **T47. Eliminar el código obsoleto de alumnos.** Plan S1 a S5
  - Hecho cuando: no queda el segmento literal `studentId`, no hay archivos vacíos, no hay helpers sin uso y no quedan `any`, casts inseguros ni supresiones en `app/lib/students`, `app/lib/api/students.ts`, `app/lib/validation/students.ts` ni `app/lib/actions/students.ts`.

- [x] **T48. Corregir la numeración de la constitución.** Plan S8
  - Hecho cuando: el segundo principio numerado 15 pasa a 16 y las referencias del plan y de la spec siguen siendo válidas.

## Fase K — Pruebas y cierre

- [x] **T49. Ejecutar y ajustar la suite unitaria de alumnos.** RF-12 a RF-126
  - Hecho cuando: access, labels, list, URL, storage, row-actions, guard, estado y validación están en verde y no hay regresiones en la suite existente.

- [x] **T50. Ejecutar y ajustar las pruebas de API y acciones.** RF-115 a RF-126
  - Hecho cuando: los casos de parseo, listados, detalle, tutor, alta, edición, red, timeout y errores pasan; los núcleos de acción cubren validación, éxito, `401`, `403`, `422` y fallo de transporte.

- [x] **T51. Verificar el recorrido del tutor de punta a punta.** RF-12 a RF-87
  - Hecho cuando: estado vacío, alta, segundo alta, listado, detalle, edición, aviso de baja no disponible y regreso al listado funcionan con el servicio simulado, sin errores de consola y con una sola solicitud por envío.

- [x] **T52. Verificar el recorrido administrativo de punta a punta.** RF-88 a RF-114
  - Hecho cuando: padrón, filtros combinados, limpiar, paginación, detalle con tutor, retorno con filtros y ausencia de acciones de escritura funcionan; alta y edición por dirección dan acceso denegado.

- [x] **T53. Verificar sesión, roles y errores.** RF-6 a RF-10, RF-115 a RF-126
  - Hecho cuando: sin cookie redirige, `401` descarta la sesión, `403` deniega, `404` muestra no encontrado, `422` muestra errores por campo y `5xx` o red muestran reintento.

- [x] **T54. Verificar accesibilidad.** RNF-3, RNF-4
  - Hecho cuando: el árbol AX expone títulos, tablas, menús, diálogo, estados y nombres accesibles; teclado completo; foco visible; contraste mínimo; anuncios de error y resultado; foco devuelto al cerrar menús y diálogo.

- [x] **T55. Verificar responsive y texto al 200 por ciento.** RNF-5
  - Hecho cuando: no hay desborde horizontal ni solapamientos en 320, 375, 768, 1024, 1440 y 1920 px, la tabla se desplaza internamente y el texto al 200 por ciento no pierde contenido.

- [x] **T56. Verificar privacidad.** RNF-7
  - Hecho cuando: el token no aparece en HTML, dirección, almacenamiento ni consola; DNI y CUIL no aparecen en la dirección; no hay datos personales en logs; la sesión se mantiene en cookie httpOnly.

- [x] **T57. Regresión de módulos existentes.** RNF-14
  - Hecho cuando: Cursos, Gestión de usuarios, menú lateral, login, registro y recuperación conservan su comportamiento y sus pruebas en verde.

- [x] **T58. Verificación final y cierre.** RNF-9 a RNF-12, RNF-18
  - Hecho cuando: `pnpm exec tsc --noEmit`, `pnpm lint`, la suite completa y `pnpm build` están en verde; sin dependencias nuevas; sin errores de consola; metadata y segmentos de carga y error presentes; `MEMORY.md` actualizado; la spec 012 pasa a `implementada` con el cambio sobre 009 registrado.

## Dependencias

- T1 a T3 antes de T4.
- T4 y T5 antes de cualquier vista del módulo.
- T6 y T7 antes de las páginas y acciones.
- T8 antes de T9 a T26.
- T9 a T14 antes de la UI.
- T15 a T17 antes de T24 y T27 a T29.
- T18 a T23 antes de T24 a T26 y de las páginas.
- T24 y T25 antes de T30 y T31.
- T27 a T29 antes de T30 y T31.
- T32 a T39 antes de T49.
- T40 a T44 antes de T52.
- T45 a T48 pueden ejecutarse en paralelo con las fases G, H e I, sin bloquear.
- T49 a T58 al final, en orden.
