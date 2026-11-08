# Plan 011 — Gestión de usuarios

Estado: aprobado (2026-11-03)
Spec: `specs/011-staff/spec.md` (aprobada el 2026-11-03)

## 1. Resumen y enfoque

El módulo se implementa con el mismo patrón que Gestión de cursos:

- Server Components para cargar datos y armar el armazón privado.
- Client Components solo en filtros, tablas coordinadas, menús, diálogos y formularios.
- Lógica pura separada de la red en `app/lib/users/`.
- Integración HTTP centralizada en `app/lib/api/users.ts`.
- Server Actions con núcleos testeables en `app/lib/users/action-core.ts` y exposición en `app/lib/actions/users.ts`.
- Reutilización directa de las piezas genéricas ya probadas de Cursos: diálogo, aviso, paginación, breadcrumb, posición de menú y normalización de texto.
- Una única extracción compartida: el menú de acciones por fila, porque el de Cursos está acoplado a sus acciones.
- Reconciliación del rol de la interfaz con `GET /api/auth/me`, por sobre el rol del JWT.
- Padrón con filtros y paginación en el servidor y estado en la URL.
- Directorio con filtros y paginación en el cliente sobre el conjunto completo de staff.
- Sin dependencias nuevas.

## 2. Archivos

### 2.1 Nuevos — dominio (`app/lib/users/`)

| Archivo | Responsabilidad |
|---|---|
| `types.ts` | Tipos de usuario, roles, niveles educativos, filtros, paginación, resultados de API, estados de página y de acción, avisos y formularios. |
| `access.ts` | Roles habilitados para el módulo, perfil propio, solicitud de rol y administración. |
| `labels.ts` | Etiquetas de rol, nivel educativo, valores no informados y opciones de filtro. |
| `list.ts` | Normalización, filtros del directorio, filtros activos, paginación y comparación de identificadores. |
| `users-url.ts` | Lectura y escritura de filtros y página del padrón en la URL; saneamiento de `from`. |
| `rules.ts` | Elegibilidad de cambio de rol, baja, solicitud de rol y propia cuenta. |
| `profile.ts` | Presentación de perfil: fechas, campos opcionales, nivel educativo y estado de verificación. |
| `user-state.ts` | Traducción de resultados de API a estados de listado, detalle, perfil, cuenta y acción. |
| `guard-decision.ts` | Decisión pura de acceso por rol y mensajes. |
| `guard.ts` | Carga de cuenta, token y decisión de acceso para páginas y Server Actions. |
| `data.ts` | Cargadores memoizados con `cache()` para padrón, directorio, detalle y perfil. |
| `action-core.ts` | Núcleos testeables de cambio de rol, baja, actualización de perfil y solicitud de rol. |

### 2.2 Nuevos — API y validación

| Archivo | Responsabilidad |
|---|---|
| `app/lib/api/users.ts` | Endpoints, parseo estricto, consultas paginadas, directorio completo, detalle, cambio de rol, baja, perfil de tutor y solicitud de rol. |
| `app/lib/validation/users.ts` | Validación y payload de perfil de tutor y solicitud de rol; mapeo y traducción de errores por campo. |

### 2.3 Nuevos — Server Actions

| Archivo | Responsabilidad |
|---|---|
| `app/lib/actions/users.ts` | Expone `changeUserRoleAction`, `deleteUserAction`, `updateTutorProfileAction` y `requestRoleChangeAction`, conectando los núcleos con la API, la revalidación y la redirección. |

### 2.4 Nuevos — rutas

| Archivo | Responsabilidad |
|---|---|
| `app/dashboard/users/page.tsx` | Padrón: acceso, metadata, parseo de URL, carga paginada y armazón. |
| `app/dashboard/users/loading.tsx` | Esqueleto accesible del padrón. |
| `app/dashboard/users/error.tsx` | Límite de error con reintento y vuelta al inicio. |
| `app/dashboard/users/staff/page.tsx` | Directorio: acceso, metadata, carga completa y armazón. |
| `app/dashboard/users/staff/loading.tsx` | Esqueleto accesible del directorio. |
| `app/dashboard/users/staff/error.tsx` | Límite de error del directorio. |
| `app/dashboard/users/[userId]/page.tsx` | Detalle: acceso, metadata, carga, origen y estados. |
| `app/dashboard/users/[userId]/loading.tsx` | Esqueleto accesible del detalle. |
| `app/dashboard/users/[userId]/error.tsx` | Límite de error del detalle. |
| `app/dashboard/profile/page.tsx` | Mi perfil: acceso para los tres roles, metadata y datos del perfil propio. |
| `app/dashboard/profile/loading.tsx` | Esqueleto accesible del perfil. |
| `app/dashboard/profile/error.tsx` | Límite de error del perfil. |
| `app/dashboard/account/page.tsx` | Configuración de cuenta: datos de sistema, seguridad y solicitud de rol. |
| `app/dashboard/account/loading.tsx` | Esqueleto accesible de la configuración. |
| `app/dashboard/account/error.tsx` | Límite de error de la configuración. |

### 2.5 Nuevos — UI (`app/ui/users/`)

| Archivo | Responsabilidad |
|---|---|
| `users-header.tsx` | Breadcrumb «Inicio > Usuarios > sección», título y descripción. |
| `user-filters.tsx` | Filtros del padrón: DNI, CUIL, nombre, apellido, correo, aplicar y limpiar. |
| `directory-filters.tsx` | Filtros del directorio: nombre, apellido, DNI, CUIL, correo, rol, aplicar y limpiar. |
| `user-table.tsx` | Tabla semántica compartida por padrón y directorio. |
| `user-role-badge.tsx` | Etiqueta visual del rol. |
| `user-row-actions.tsx` | Menú de acciones por fila con «Ver usuario», «Cambiar rol» y «Dar de baja». |
| `users-view.tsx` | Coordinación del padrón: filtros, tabla, paginación, URL, diálogos y avisos. |
| `directory-view.tsx` | Coordinación del directorio: filtros en cliente, paginación, diálogos y avisos. |
| `change-role-dialog.tsx` | Confirmación de cambio de rol con rol actual y selección nueva. |
| `delete-user-dialog.tsx` | Confirmación de baja con identificación y consecuencias. |
| `user-table-states.tsx` | Estados vacío global, sin coincidencias y error del listado. |
| `user-skeletons.tsx` | Esqueletos de listado, detalle, perfil y cuenta. |
| `user-detail.tsx` | Detalle en cuatro secciones, auditoría condicionada y acciones. |
| `user-detail-actions.tsx` | Botones de cambio de rol y baja para `ADMINISTRADOR`. |
| `profile-view.tsx` | Presentación de Mi perfil y datos de cuenta. |
| `tutor-profile-form.tsx` | Formulario editable de ocupación y nivel educativo para `TUTOR`. |
| `account-view.tsx` | Presentación de Configuración de cuenta y bloque de seguridad. |
| `role-request-form.tsx` | Solicitud de cambio de rol para `TUTOR` con aviso de limitación. |
| `user-notice.tsx` | Aviso de resultado con auto-cierre a los 4 segundos para éxitos y persistencia para errores. |

### 2.6 Nuevos — UI compartida y assets

| Archivo | Responsabilidad |
|---|---|
| `app/ui/table/row-actions-menu.tsx` | Menú de acciones genérico con portal, posición, teclado y retorno de foco. |
| `public/icons/ico-staff.svg` | Icono de 24×24 para «Directorio de staff»: grupo de personas. Trazo institucional `#2C3E50`. Se usa con `next/image`. |

### 2.7 Modificados

| Archivo | Cambio |
|---|---|
| `app/lib/auth/types.ts` | Extiende `CurrentUser` con teléfono, fecha de nacimiento, ocupación, nivel educativo, verificación y fechas de auditoría opcionales. |
| `app/lib/api/me.ts` | Parsea los campos opcionales sin fallar si faltan; conserva los obligatorios actuales. |
| `app/lib/auth/effective-role.ts` | Nuevo helper puro que devuelve el rol del perfil del servicio y cae al rol del token solo si no hay perfil. |
| `app/lib/dashboard/private-account-state.ts` | No cambia su contrato; el rol efectivo se consume con el helper nuevo. |
| `app/dashboard/page.tsx` | Usa rol efectivo en el armazón y en los datos del pie. |
| `app/dashboard/courses/page.tsx` | Usa rol efectivo y pasa el rol al pie de cuenta. |
| `app/dashboard/courses/[courseId]/page.tsx` | Ídem. |
| `app/dashboard/courses/new/page.tsx` | Ídem. |
| `app/dashboard/courses/[courseId]/edit/page.tsx` | Ídem. |
| `app/lib/courses/guard.ts` | Decide el acceso con el rol del perfil del servicio, no con el rol del token. |
| `app/lib/sidebar/types.ts` | Agrega hijos de sección, estado de sección y rol visible en los datos de cuenta. |
| `app/lib/sidebar/navigation.ts` | Incorpora la sección «Gestión de usuarios», habilita «Mi perfil» y agrega la sección a `ADMINISTRATIVO`. |
| `app/lib/sidebar/icons.ts` | Agrega la clave `staff` y su ruta de icono. |
| `app/lib/sidebar/account.ts` | Incluye el rol en los datos del pie. |
| `app/ui/sidebar/sidebar.tsx` | Pasa el rol efectivo y el estado de sección al menú. |
| `app/ui/sidebar/sidebar-nav.tsx` | Renderiza la sección expandible y, en colapso, sus dos iconos. |
| `app/ui/sidebar/sidebar-account.tsx` | Muestra nombre, correo y rol en el pie expandido. |
| `app/ui/sidebar/sidebar-account-menu.tsx` | Convierte «Configuración de cuenta» en enlace real y conserva «Cerrar sesión». |
| `app/ui/courses/course-row-actions.tsx` | Usa el menú genérico compartido sin cambiar su comportamiento. |
| `tests/sidebar/navigation.test.ts` | Actualiza la estructura esperada por rol. |
| `tests/sidebar/account.test.ts` | Agrega el rol a los datos del pie. |
| `tests/courses/guard.test.ts` | Verifica el rol efectivo. |
| `tests/api/me.test.ts` | Cubre los campos opcionales nuevos. |
| `tests/dashboard/private-account.test.ts` | Cubre el rol efectivo y los campos extendidos. |

No se modifican `app/ui/navigation` ni se renombran componentes de Cursos: la reutilización es directa. La única intervención compartida sobre Cursos es el menú de acciones por fila y la decisión de rol, ambas con regresión.

## 3. Funciones de lógica pura

### 3.1 `app/lib/users/access.ts`

- `USER_MANAGER_ROLES`: `ADMINISTRATIVO` y `ADMINISTRADOR`.
- `isUserManagerRole(role)`: type guard.
- `canManageUsers(role)`: habilita padrón, directorio y detalle.
- `canAdministerUsers(role)`: solo `ADMINISTRADOR`.
- `canRequestRoleChange(role)`: solo `TUTOR`.
- `canEditOwnProfile(role)`: solo `TUTOR`.

### 3.2 `app/lib/users/labels.ts`

- Etiquetas de rol reutilizando las existentes.
- Etiquetas de nivel educativo: Primario, Secundario, Terciario, Universitario, Postgrado.
- Valores por defecto: «No informado» y «No disponible».
- Opciones de filtro de rol: Todos, Administrativo, Administrador.
- Opciones de rol para el modal: Tutor, Administrativo, Administrador.
- Type guards de nivel educativo y de filtro de rol.

### 3.3 `app/lib/users/list.ts`

- `normalizeIdentifier(value)`: recorta y deja solo dígitos.
- `hasActiveUserFilters(filters)`: determina si hay filtros activos.
- `filterDirectoryUsers(users, filters)`: nombre, apellido, DNI, CUIL, correo y rol combinados, con coincidencia parcial sin mayúsculas ni tildes y exacta para DNI/CUIL.
- `getDefaultDirectoryFilters()` y `clearDirectoryFilters()`.
- `paginateUserList(items, page, pageSize)`: ajusta la página a `1..última` y calcula desde/hasta.
- `normalizeUserId(value)`: normaliza número o UUID a texto para comparar la propia cuenta.
- `buildUserQuery(filters, page, pageSize)`: arma parámetros solo con filtros activos.
- `countDirectoryPages(total, pageSize)`.
- `getDirectoryResultLabel(total, from, to)`.

### 3.4 `app/lib/users/users-url.ts`

- `USERS_PATH` y `STAFF_PATH`.
- `parseUserFilters(searchParams)`: lee DNI, CUIL, nombre, apellido, correo y página; descarta valores inválidos.
- `serializeUserFilters(filters, page, existing)`: escribe solo filtros activos y página mayor a 1; conserva parámetros ajenos.
- `sanitizeUserReturnPath(value)`: acepta solo `/dashboard/users` y `/dashboard/users/staff`; sin origen válido devuelve el padrón.
- `getOriginFrom(value)`: devuelve `users` o `staff`.

### 3.5 `app/lib/users/rules.ts`

- `isOwnAccount(userId, currentUserId)`.
- `canChangeUserRole({ viewerRole, targetRole, targetVerified, isSelf })`.
- `canDeleteUser({ viewerRole, isSelf })`.
- `getChangeRoleDisabledReason(...)`.
- `getDeleteDisabledReason(...)`.
- `canRequestSameRole(requestedRole, currentRole)`.
- `isStaffRole(role)`.
- `getVerificationDisplay(viewerRole, emailVerifiedAt)`: «Verificado», «Sin verificar» o «No informado» según el rol y el dato.

### 3.6 `app/lib/users/profile.ts`

- `formatProfileDate(value)`: fecha sin hora en `DD/MM/AAAA`.
- `formatProfileDateTime(value)`: fecha y hora en `DD/MM/AAAA HH:mm` en zona local.
- `formatOptionalValue(value)`: «No informado» cuando falta.
- `formatEducationLevel(value)`.
- `isTutorProfileComplete(user)`.
- `getProfileDisplayName(user)`.

### 3.7 `app/lib/users/user-state.ts`

- `USER_LIST_LOADING_STATE`, `USER_DETAIL_LOADING_STATE`, `USER_ACTION_IDLE_STATE`.
- `toUserListState(result, pageData)`.
- `toStaffState(result, pageData)`.
- `toUserDetailState(result)`.
- `toUserActionState(result)`.
- `toProfileState(account)`.
- `toAccountState(account)`.

### 3.8 `app/lib/auth/effective-role.ts`

- `getEffectiveRole(account)`: devuelve `account.user.role` cuando la cuenta está disponible; en caso contrario, el rol del token; si no hay ninguno, `null`.

### 3.9 `app/lib/users/guard-decision.ts` y `guard.ts`

- `getUserAccessDecision(role)`: allowed para roles gestores.
- `getProfileAccessDecision(role)`: allowed para cualquier rol conocido.
- `getUserPageAccess()`: cuenta privada, rol efectivo y token.
- `getUserActionAccess()`: ídem para Server Actions.
- `getProfileActionAccess()`: exige `TUTOR` para actualizar perfil.
- `getRoleRequestAccess()`: exige `TUTOR` para solicitar rol.

### 3.10 `app/lib/validation/users.ts`

- `USER_PROFILE_FIELDS` y `ROLE_REQUEST_FIELDS`.
- `validateTutorProfile(input)`: ocupación recortada, no vacía, máximo 100; nivel educativo dentro del enum.
- `buildTutorProfilePayload(input)`.
- `validateRoleRequest(input)`: rol dentro del enum; motivo recortado, no vacío, máximo 500; rechazo local si coincide con el rol actual.
- `buildRoleRequestPayload(input)`.
- `readTutorProfileFormData(formData)` y `readRoleRequestFormData(formData)`.
- `mapUserFieldErrors(value)` y `translateUserFieldErrors(errors)`.

### 3.11 `app/lib/users/action-core.ts`

- `changeUserRoleActionCore(previousState, formData, dependencies)`.
- `deleteUserActionCore(previousState, formData, dependencies)`.
- `updateTutorProfileActionCore(previousState, formData, dependencies)`.
- `requestRoleChangeActionCore(previousState, formData, dependencies)`.

Cada núcleo recibe acceso, función de API, redirección y revalidación inyectadas, para probarse sin red.

## 4. Contrato de datos y estados

### 4.1 Endpoints usados

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/users` | Padrón con DNI, CUIL, nombre, apellido, correo, página y `per_page=10`. |
| GET | `/api/users/staff` | Directorio completo con `per_page=100` y tope de 100 páginas. |
| GET | `/api/users/{userId}` | Detalle. |
| PUT | `/api/users/{userId}/role` | Cambio de rol con `{ newRole }`. |
| DELETE | `/api/users/{userId}` | Baja lógica. |
| GET | `/api/auth/me` | Perfil propio, configuración de cuenta y rol efectivo. |
| PUT | `/api/profile/tutor` | Ocupación y nivel educativo del tutor. |
| POST | `/api/role-request` | Solicitud de cambio de rol con `{ requested_role, reason }`. |

### 4.2 Reglas de parseo

- Listas y detalle exigen `id`, `name`, `lastname`, `role`; DNI, CUIL, correo y campos opcionales se toleran ausentes.
- El padrón exige metadatos de paginación válidos; si faltan o son inconsistentes, la respuesta es inválida.
- El detalle conserva `created_at`, `updated_at` y `email_verified_at` solo cuando existen.
- El perfil propio conserva los campos opcionales que devuelve `/me`.
- Los errores `401`, `403`, `404`, `409`, `422`, `5xx`, red y timeout se clasifican por separado.
- La precedencia es `401`, `403`, `404`, `409`, `422`, `5xx`, red.

## 5. Decisiones técnicas justificadas

- **D1. Reutilización directa de `CourseDialog`, `CourseNotice`, `CoursePagination`, `CourseBreadcrumb`, `computeMenuPosition` y `normalizeSearch`.** Son genéricos pese al prefijo «Course». Alternativa descartada: extraerlos y renombrarlos, que obliga a tocar Cursos y agranda el riesgo sin beneficio funcional.
- **D2. Extraer `app/ui/table/row-actions-menu.tsx`.** El menú de Cursos contiene navegación por teclado, portal y reposicionamiento que no conviene duplicar. Alternativa descartada: copiar el menú en Usuarios, que viola la reutilización y duplica mantenimiento.
- **D3. Padrón con filtros y paginación en el servidor, estado en la URL y `router.replace`.** La spec exige filtros de servicio y URL reconstruible. Alternativa descartada: traer todo y filtrar en cliente, que ignora los filtros del backend y pierde la URL.
- **D4. Directorio con filtros en cliente sobre todas las páginas.** El endpoint no documenta filtros. Se solicitan páginas de 100 con tope de 100 y fallo atómico. Alternativa descartada: filtrar solo la página visible, que da resultados incompletos.
- **D5. Rol efectivo desde `/me`.** El JWT puede quedar desactualizado tras un cambio de rol. Alternativa descartada: usar solo el token, que deja menú y acciones desfasados.
- **D6. Server Actions con núcleos inyectables.** Sigue el patrón de Cursos y permite probar reglas sin red. Alternativa descartada: `fetch` directo desde componentes, que rompe la separación de capas.
- **D7. Sin actualizaciones optimistas.** Se espera la confirmación del servicio y luego se refresca. Alternativa descartada: actualizar la fila antes de la respuesta, que puede mostrar un estado falso.
- **D8. Restricciones de último administrador, correo sin verificar y propia cuenta delegadas al servicio cuando el dato no está disponible.** El padrón no informa verificación y el cliente no cuenta administradores. Alternativa descartada: precalcular desde el listado, que es incompleto y propenso a carreras.
- **D9. Verificación del detalle según el rol del observador.** `ADMINISTRADOR` interpreta la ausencia como «Sin verificar»; `ADMINISTRATIVO` muestra «No informado» porque el contrato no le envía el dato. Alternativa descartada: mostrar «Sin verificar» a ambos, que sería una afirmación falsa.
- **D10. Perfil y cuenta desde `getPrivateAccount`.** Evita una segunda llamada a `/me` y reutiliza el estado de sesión existente. Alternativa descartada: consultar `/me` otra vez desde cada pantalla.
- **D11. Solicitud de rol con aviso explícito y sin cambio local.** El servicio confirma pero no persiste. Alternativa descartada: simular el cambio de rol, prohibido por la spec.
- **D12. Menú de sección con hijos opcionales en el modelo actual.** Minimiza el cambio sobre la spec 009. Alternativa descartada: un modelo nuevo de navegación, que obliga a reescribir el menú completo.
- **D13. Un icono nuevo `ico-staff.svg`.** Padrón y Directorio necesitan iconos distintos. Alternativa descartada: repetir `ico-users`, que confunde las dos opciones.
- **D14. Sin dependencias nuevas.** Todo se resuelve con Next.js, React y APIs nativas. Alternativa descartada: librerías de tablas o formularios, no aprobadas.

## 6. Estrategia de tests

### 6.1 Unitarios puros (`node:test` con `--experimental-strip-types`)

- `tests/users/access.test.ts`: roles gestores, administración, perfil y solicitud.
- `tests/users/labels.test.ts`: etiquetas, opciones y type guards.
- `tests/users/list.test.ts`: identificadores, filtros activos, filtrado del directorio con mayúsculas, tildes y espacios, paginación y ajuste de página.
- `tests/users/users-url.test.ts`: parseo, serialización, valores inválidos, conservación de parámetros, saneamiento de `from`.
- `tests/users/rules.test.ts`: propia cuenta, verificación, elegibilidad, rol actual y estado de verificación por rol.
- `tests/users/profile.test.ts`: fechas, campos opcionales y nivel educativo.
- `tests/users/user-state.test.ts`: mapeo de resultados y estados.
- `tests/auth/effective-role.test.ts`: perfil por sobre token y caída al token.

### 6.2 API con `fetch` inyectable

- `tests/api/users.test.ts`: listado con filtros y página, directorio completo con tope y fallo atómico, detalle, cambio de rol, baja, perfil de tutor y solicitud de rol.
- Casos: URL y método exactos, Bearer, cuerpo exacto, `per_page`, `401`, `403`, `404`, `409`, `422`, `5xx`, red, timeout y cuerpo inválido.
- `tests/api/me.test.ts`: campos opcionales nuevos sin romper los obligatorios.

### 6.3 Server Actions con dependencias inyectadas

- `tests/actions/users.test.ts`: cambio de rol propio, mismo rol, sin verificación, último administrador por `409`, éxito y revalidación; baja propia, `409`, éxito y redirección desde detalle; perfil de tutor válido, inválido, `403` y éxito; solicitud de rol válida, mismo rol, `403`, `422`, éxito con aviso de pendiente y sin cambio local.

### 6.4 Sidebar y regresión

- `tests/sidebar/navigation.test.ts`: sección para `ADMINISTRADOR` y `ADMINISTRATIVO`, ausencia en `TUTOR`, «Mi perfil» habilitado y orden.
- `tests/sidebar/account.test.ts`: rol en los datos del pie.
- `tests/courses/guard.test.ts`: rol efectivo.
- `tests/dashboard/private-account.test.ts`: cuenta con campos extendidos y rol efectivo.
- Suite completa de Cursos sin regresiones.

### 6.5 E2E (fase posterior, Playwright y backend simulado)

- Menú por rol, sección expandible, colapso con dos iconos, «Mi perfil» y «Configuración de cuenta».
- Padrón: filtros combinados, validación de DNI/CUIL, URL, recarga, atrás/adelante, paginación de 10, limpiar filtros y vacíos.
- Detalle: secciones, auditoría solo para `ADMINISTRADOR`, «Sin verificar» frente a «No informado», propias acciones deshabilitadas y no encontrado.
- Cambio de rol y baja: restricciones, modales, `409`, `403`, `404`, `422`, refresco y aviso.
- Directorio: exclusión de `TUTOR`, filtros en cliente, paginación y salida del conjunto tras cambio de rol.
- Perfil: tutor editable con validación y error; roles administrativos en lectura.
- Cuenta: enlace de recuperación y solicitud de rol con aviso de pendiente.
- Accesibilidad, responsive de 320 a 1920 px, texto al 200 %, privacidad y consola limpia.

### 6.6 Comandos de verificación

- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `node --experimental-strip-types --test`
- `pnpm build`

## 7. Matriz de cobertura de RF

| RF | Cobertura principal | Tests |
|---|---|---|
| RF-1 a RF-22 | Menú, secciones, rutas, acceso y rol efectivo | navegación, effective-role, guard, E2E |
| RF-23 a RF-45 | Padrón, filtros, URL, paginación y estados | users-url, list, api/users, E2E |
| RF-46 a RF-51 | Menú de acciones por fila | row-actions, E2E |
| RF-52 a RF-67 | Cambio de rol | rules, action-core, api/users, E2E |
| RF-68 a RF-80 | Baja de usuario | rules, action-core, api/users, E2E |
| RF-81 a RF-99 | Detalle y auditoría | user-state, profile, E2E |
| RF-100 a RF-117 | Directorio | list, api/users, E2E |
| RF-118 a RF-139 | Mi perfil y perfil de tutor | validation/users, profile, action-core, api/users, E2E |
| RF-140 a RF-159 | Configuración de cuenta y solicitud de rol | validation/users, action-core, api/users, E2E |
| RF-160 a RF-171 | Autenticación, permisos, errores y avisos | api/users, action-core, guard, E2E |

## 8. Riesgos y mitigaciones

- **Regresión en Cursos por el menú compartido y el rol efectivo.** Mitigación: pruebas de Cursos, regresión de navegación y E2E de Cursos antes del cierre.
- **Desfase entre la URL y la página tras aplicar filtros.** Mitigación: serialización única, página 1 al filtrar y reconstrucción desde la URL.
- **Doble navegación o refresco tras una Server Action.** Mitigación: una sola estrategia por acción; `router.refresh()` después de la confirmación y redirección solo en la baja desde detalle.
- **Directorio con muchas páginas o fallo parcial.** Mitigación: tope de 100 páginas, fallo atómico y mensaje de conjunto incompleto.
- **Zona horaria en fechas de auditoría.** Mitigación: fechas con hora en zona local y fecha de nacimiento sin desplazamiento, con tests de formato.
- **Datos faltantes del servicio.** Mitigación: parseo tolerante de opcionales y «No informado»; nunca inventar.
- **Solicitud de rol no persistida.** Mitigación: aviso explícito, prueba de que no cambia el rol y nota de pendiente de backend.

## 9. Orden de implementación

- **Fase A. Base compartida:** rol efectivo, menú de acciones genérico, icono de staff y ajustes de sidebar.
- **Fase B. Dominio:** tipos, acceso, etiquetas, listas, URL, reglas, perfil y validación.
- **Fase C. Red:** `app/lib/api/users.ts` y extensión de `/me`.
- **Fase D. Estados y acciones:** user-state, guard, data, action-core y Server Actions.
- **Fase E. Padrón:** página, vista, filtros, tabla, paginación, diálogos y estados.
- **Fase F. Detalle:** página, secciones, auditoría y acciones.
- **Fase G. Directorio:** página, filtros en cliente, tabla y acciones.
- **Fase H. Perfil y cuenta:** páginas, formulario de tutor y solicitud de rol.
- **Fase I. Cierre:** loading/error, accesibilidad, responsive, privacidad, E2E, suite completa, `pnpm lint` y `pnpm build`.

## 10. Verificación de cierre

- Todos los RF de la matriz cubiertos por tests y recorridos.
- `pnpm exec tsc --noEmit` limpio.
- `pnpm lint` sin errores.
- Suite completa en verde.
- `pnpm build` en verde con las cinco rutas nuevas.
- Sin dependencias nuevas.
- Sin regresiones en Cursos, sidebar, login, registro, verificación ni recuperación.
- Imágenes e iconos declarados y servidos con la optimización del framework.
- `MEMORY.md` actualizado al cierre.
