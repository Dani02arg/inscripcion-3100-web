# Tasks 011 — Gestión de usuarios

Estado: aprobado (2026-11-03)
Spec: `specs/011-staff/spec.md` (aprobada)
Plan: `specs/011-staff/plan.md` (aprobado)

Máximo sugerido por tarea: 20-30 minutos. Una tarea por vez; pruebas primero cuando aplique, después el código, verificación y marca.

## Fase A — Base compartida

- [x] **T1. Helper de rol efectivo.** RF-20, RF-161
  - Hecho cuando: `getEffectiveRole` prioriza el rol de `/me`, cae al token y devuelve `null` sin datos; `tests/auth/effective-role.test.ts` en verde.

- [x] **T2. Aplicar rol efectivo en dashboard, Cursos y guardia.** RF-20, RF-161
  - Hecho cuando: dashboard, las cuatro pantallas de Cursos y `getCoursePageAccess` usan el rol del perfil; tests de `courses/guard` y `dashboard/private-account` en verde.

- [x] **T3. Menú de acciones genérico y adaptación de Cursos.** RF-46, RF-51, RNF-2, RNF-14
  - Hecho cuando: `row-actions-menu` concentra teclado, portal y foco; `course-row-actions` lo usa sin cambiar comportamiento; E2E de Cursos sin regresiones.

- [x] **T4. Modelo de navegación con sección.** RF-1, RF-2, RF-3, RF-7, RF-8, RF-9, RF-10, RF-11, RF-16, RF-17
  - Hecho cuando: la sección existe para `ADMINISTRADOR` y `ADMINISTRATIVO`, no para `TUTOR`; «Mi perfil» queda al final y habilitado; «Configuración de cuenta» queda en el pie; `tests/sidebar/navigation.test.ts` en verde.

- [x] **T5. Icono de Directorio.** RF-1, RNF-19
  - Hecho cuando: `public/icons/ico-staff.svg` existe con medidas y color institucional; `icons.ts` expone `staff`; `tests/sidebar/icons.test.ts` verifica el archivo.

- [x] **T6. Menú: sección expandible, colapso y drawer.** RF-4, RF-5, RF-6, RF-7, RF-14, RF-15
  - Hecho cuando: se expande al entrar al módulo, se puede plegar y conserva estado; en colapso muestra dos iconos con tooltip; en drawer aparece expandida; `aria-expanded`, `aria-controls` y `aria-current` correctos.

- [x] **T7. Pie de cuenta y configuración real.** RF-10, RF-11, RF-12, RF-13, RF-17
  - Hecho cuando: el pie expandido muestra nombre, correo y rol; el colapsado solo avatar; «Configuración de cuenta» navega a `/dashboard/account`; «Cerrar sesión» sigue funcionando; `tests/sidebar/account.test.ts` en verde.

## Fase B — Dominio

- [x] **T8. Tipos base del dominio.** RF-1 a RF-171
  - Hecho cuando: `types.ts` define usuarios, roles, niveles educativos, filtros, paginación, resultados de API y avisos; `tsc --noEmit` limpio.

- [x] **T9. Tipos de estados y formularios.** RF-23 a RF-45, RF-81 a RF-159
  - Hecho cuando: existen estados de listado, detalle, perfil, cuenta y acción, y tipos de formularios de perfil y solicitud; `tsc --noEmit` limpio.

- [x] **T10. Acceso por rol.** RF-1, RF-2, RF-14, RF-18, RF-101, RF-116
  - Hecho cuando: gestión solo para `ADMINISTRATIVO`/`ADMINISTRADOR`; perfil y solicitud solo para `TUTOR`; roles desconocidos rechazados; `tests/users/access.test.ts` en verde.

- [x] **T11. Etiquetas y opciones.** RF-18, RF-25, RF-106, RF-128
  - Hecho cuando: roles, niveles educativos, «No informado» y opciones de filtro coinciden con la spec; `tests/users/labels.test.ts` en verde.

- [x] **T12. Listas, identificadores y filtros del directorio.** RF-27 a RF-36, RF-105 a RF-109, RF-117
  - Hecho cuando: DNI/CUIL solo dígitos; nombre/apellido/correo ignoran mayúsculas y tildes; filtros activos; paginación `1..última`; `tests/users/list.test.ts` en verde.

- [x] **T13. Filtros y página del padrón en URL.** RF-33, RF-34, RF-35, RF-98
  - Hecho cuando: lectura/escritura de los cinco filtros y página; valores inválidos descartados; parámetros ajenos conservados; `from` saneado; `tests/users/users-url.test.ts` en verde.

- [x] **T14. Reglas de elegibilidad.** RF-53 a RF-58, RF-70, RF-71, RF-81, RF-90 a RF-94, RF-146 a RF-148
  - Hecho cuando: propia cuenta por identificador normalizado; cambio y baja según rol y verificación conocida; estado de verificación distingue observador; `tests/users/rules.test.ts` en verde.

- [x] **T15. Presentación de perfil y fechas.** RF-84, RF-92, RF-122 a RF-124
  - Hecho cuando: fecha y fecha-hora con los formatos acordados, zona local, fecha de nacimiento sin desplazamiento y opcionales «No informado»; `tests/users/profile.test.ts` en verde.

- [x] **T16. Validación del perfil de tutor.** RF-127, RF-129, RF-166
  - Hecho cuando: ocupación recortada no vacía de hasta 100; nivel educativo del enum; errores por campo; `tests/users/validation.test.ts` en verde.

- [x] **T17. Validación de solicitud de rol y errores.** RF-149, RF-166
  - Hecho cuando: motivo recortado no vacío de hasta 500; rol del enum y distinto del actual; mapeo y traducción de errores; `tests/users/validation.test.ts` en verde.

## Fase C — API

- [x] **T18. Base del cliente y parseo de listas.** RF-23 a RF-32
  - Hecho cuando: parsea usuario resumido y listado con `data` y `meta`; rechaza campos obligatorios ausentes y cuerpo inválido; `tests/api/users.test.ts` cubre estos casos.

- [x] **T19. Solicitud del padrón con filtros y página.** RF-23 a RF-32, RF-40
  - Hecho cuando: envía solo filtros activos, `per_page=10` y página; `meta` inválida es error; clasifica `401`, `403`, `5xx`, red y timeout.

- [x] **T20. Directorio completo con tope y fallo atómico.** RF-100 a RF-109, RF-117
  - Hecho cuando: recorre todas las páginas con `per_page=100`, respeta el tope, falla sin datos parciales y excluye `TUTOR`; pruebas con varias páginas y fallo posterior.

- [x] **T21. Detalle y auditoría.** RF-81 a RF-92
  - Hecho cuando: `GET /api/users/{id}` parsea obligatorios y opcionales, conserva auditoría y clasifica `401`, `403`, `404`, `5xx`, red y cuerpo inválido.

- [x] **T22. Cambio de rol y baja.** RF-52 a RF-80
  - Hecho cuando: `PUT` envía `{ newRole }` exacto y `DELETE` sin cuerpo; clasifica `401`, `403`, `404`, `409`, `422`, `5xx`, red y timeout; pruebas de método, ruta y cabeceras.

- [x] **T23. Actualización del perfil de tutor.** RF-118 a RF-139
  - Hecho cuando: `PUT /api/profile/tutor` envía ocupación y nivel educativo juntos; parsea el usuario actualizado y clasifica errores.

- [x] **T24. Solicitud de cambio de rol.** RF-140 a RF-159
  - Hecho cuando: `POST /api/role-request` envía `{ requested_role, reason }`; parsea mensaje y errores; clasifica `401`, `403`, `422`, `5xx`, red y timeout.

- [x] **T25. Extender `/api/auth/me`.** RF-20, RF-118 a RF-123, RF-140
  - Hecho cuando: `CurrentUser` y el parser incorporan teléfono, nacimiento, ocupación, educación, verificación y auditoría opcionales sin romper los obligatorios; `tests/api/me.test.ts` en verde.

## Fase D — Estados, guardias, datos y acciones

- [x] **T26. Estados de listado y detalle.** RF-23 a RF-45, RF-81 a RF-99
  - Hecho cuando: distingue listo, vacío, sin coincidencias, no encontrado, denegado y error sin inventar datos; `tests/users/user-state.test.ts` en verde.

- [x] **T27. Estados de perfil, cuenta y acción.** RF-118 a RF-159
  - Hecho cuando: distingue listo, validación, conflicto, éxito, denegado, no encontrado y error; `tests/users/user-state.test.ts` en verde.

- [x] **T28. Guardias de páginas y acciones.** RF-1, RF-2, RF-14, RF-18 a RF-22, RF-101, RF-116
  - Hecho cuando: gestión exige rol gestor; perfil y cuenta aceptan cualquier autenticado; perfil de tutor y solicitud exigen `TUTOR`; `401` redirige; `tests/users/guard.test.ts` en verde.

- [x] **T29. Cargadores memoizados.** RF-23, RF-81, RF-100, RF-118, RF-140
  - Hecho cuando: padrón, directorio, detalle y perfil usan `cache()` y no hay `fetch` en componentes; `tsc --noEmit` limpio.

- [x] **T30. Núcleo de cambio de rol.** RF-52 a RF-67
  - Hecho cuando: valida rol, propia cuenta, mismo rol y verificación; no optimista; `409` conserva rol; `401` redirige; revalida listados y detalle; pruebas de caminos.

- [x] **T31. Núcleo de baja.** RF-68 a RF-80
  - Hecho cuando: valida propia cuenta; no optimista; `409` mantiene; desde detalle redirige al origen; revalida; pruebas de caminos.

- [x] **T32. Núcleo de perfil de tutor.** RF-118 a RF-139
  - Hecho cuando: revalida, exige `TUTOR`, envía ambos campos, conserva valores ante `422`, distingue `403`, `401` y red, y devuelve usuario actualizado.

- [x] **T33. Núcleo de solicitud de rol.** RF-140 a RF-159
  - Hecho cuando: exige `TUTOR`, valida rol y motivo, rechaza rol actual sin enviar, no cambia rol local, muestra aviso de pendiente y distingue errores.

- [x] **T34. Cablear Server Actions.** RF-52 a RF-159
  - Hecho cuando: las cuatro acciones conectan acceso, API, revalidación y redirección; `tsc --noEmit` y `pnpm lint` limpios.

## Fase E — Padrón de usuarios

- [x] **T35. Página del padrón y metadata.** RF-23, RF-42, RF-44
  - Hecho cuando: `/dashboard/users` valida acceso, parsea filtros, carga y arma el armazón con metadata; `pnpm build` en verde.

- [x] **T36. Loading y error del padrón.** RF-42, RF-44
  - Hecho cuando: `loading.tsx` muestra esqueleto accesible y `error.tsx` ofrece reintento y vuelta al inicio; sin datos ficticios.

- [x] **T37. Encabezado del padrón.** RF-23, RF-24
  - Hecho cuando: breadcrumb «Inicio > Usuarios > Padrón», título y descripción con la identidad de Cursos; sin acciones de creación.

- [x] **T38. Filtros del padrón.** RF-27 a RF-35, RF-41, RF-43, RF-45
  - Hecho cuando: cinco filtros, «Aplicar filtros», Enter y «Limpiar filtros»; DNI/CUIL solo dígitos con error local; sin filtros de rol ni verificación.

- [x] **T39. Tabla y badge de rol.** RF-24, RF-25
  - Hecho cuando: columnas Usuario, DNI, Correo, Rol y Acciones; caption, encabezados y nombre accesible por fila; badge con texto y color institucional.

- [x] **T40. Paginación del padrón.** RF-37 a RF-40
  - Hecho cuando: 10 por página, «Página X de Y · N resultados», anterior/siguiente según corresponda, página fuera de rango ajustada y `meta` inválida derivada al error.

- [x] **T41. Estados y esqueleto del padrón.** RF-42 a RF-44
  - Hecho cuando: vacío global, sin coincidencias con limpiar filtros, error con reintento y esqueleto accesible.

- [x] **T42. Coordinación del padrón, URL y avisos.** RF-33 a RF-43, RF-169, RF-170
  - Hecho cuando: filtros y página reemplazan la URL, sobreviven recarga y atrás/adelante; éxito 4 s y error persistente; `aria-busy` durante la transición.

- [x] **T43. Menú de acciones por fila.** RF-46 a RF-51
  - Hecho cuando: «Acciones de {nombre} {apellido}», Ver para ambos roles, Cambiar rol y Dar de baja solo para `ADMINISTRADOR`, teclado, Escape y retorno de foco.

- [x] **T44. Diálogo de cambio de rol.** RF-52 a RF-63, RF-66
  - Hecho cuando: identifica al usuario, rol actual deshabilitado, selección distinta, bloqueo de cierre y doble envío, y errores `409`, `403`, `404`, `422`.

- [x] **T45. Diálogo de baja.** RF-68 a RF-80
  - Hecho cuando: identifica nombre, apellido, DNI, correo y rol; advierte baja lógica; bloquea cierre y repetición; muestra `409`, `403`, `404`; no ofrece restauración.

- [x] **T46. Integración de acciones del padrón.** RF-52 a RF-80
  - Hecho cuando: tras cambio o baja se refresca el listado, se muestran avisos y la fila desaparece o actualiza; `401` redirige; sin optimismo.

## Fase F — Detalle de usuario

- [x] **T47. Página de detalle, origen y metadata.** RF-81, RF-84 a RF-87, RF-96 a RF-99
  - Hecho cuando: `/dashboard/users/{userId}` valida acceso, carga, resuelve `404`, `403`, error y `401`, conserva `from` y tiene metadata.

- [x] **T48. Loading y error del detalle.** RF-87, RF-96 a RF-99
  - Hecho cuando: esqueleto accesible y límite de error con reintento y vuelta al origen.

- [x] **T49. Secciones personales, contacto y adicionales.** RF-82 a RF-85, RF-87
  - Hecho cuando: cuatro secciones, datos personales, contacto y adicionales; opcionales «No informado».

- [x] **T50. Cuenta, auditoría y verificación.** RF-86, RF-88 a RF-92
  - Hecho cuando: auditoría solo para `ADMINISTRADOR`; ausencia del dato es «Sin verificar» para admin y «No informado» para administrativo; fechas con formato acordado.

- [x] **T51. Acciones y diálogos del detalle.** RF-93, RF-94, RF-52 a RF-80
  - Hecho cuando: acciones solo para `ADMINISTRADOR`; propias deshabilitadas con motivo; verificación conocida deshabilita cambio; tras mutación refresca o vuelve al origen.

## Fase G — Directorio de staff

- [x] **T52. Página del directorio y metadata.** RF-100 a RF-104
  - Hecho cuando: `/dashboard/users/staff` valida acceso, carga el conjunto completo, arma el armazón y tiene metadata; `pnpm build` en verde.

- [x] **T53. Loading y error del directorio.** RF-113, RF-114
  - Hecho cuando: esqueleto accesible y error con reintento; sin conjunto parcial.

- [x] **T54. Filtros del directorio en cliente.** RF-105 a RF-109
  - Hecho cuando: nombre, apellido, DNI, CUIL, correo y rol combinados sobre todo el personal; DNI/CUIL exactos; texto parcial sin mayúsculas ni tildes; limpiar filtros.

- [x] **T55. Tabla, paginación y estados del directorio.** RF-110 a RF-117
  - Hecho cuando: mismas columnas que el padrón, 10 por página, total y páginas recalculados, vacío global, sin coincidencias y error; excluye `TUTOR`.

- [x] **T56. Acciones del directorio e integración.** RF-110, RF-111
  - Hecho cuando: Ver para ambos, cambio y baja solo admin con los mismos diálogos; cambio a `TUTOR` retira la fila; si permanece, actualiza; avisos y refresco.

## Fase H — Mi perfil y Configuración de cuenta

- [x] **T57. Página de perfil y metadata.** RF-118 a RF-124, RF-135 a RF-138
  - Hecho cuando: `/dashboard/profile` acepta los tres roles, carga desde el perfil del servicio y tiene metadata y estados.

- [x] **T58. Loading y error del perfil.** RF-137, RF-138
  - Hecho cuando: esqueleto accesible, error con reintento y `401` con redirección.

- [x] **T59. Vista de perfil en lectura.** RF-119 a RF-124, RF-135, RF-136
  - Hecho cuando: datos personales, contacto y cuenta; sin DNI/CUIL; roles administrativos ven ocupación y educación en lectura; opcionales «No informado».

- [x] **T60. Formulario de tutor.** RF-125 a RF-134
  - Hecho cuando: ocupación y educación editables, validación local y de servicio, ambos campos obligatorios, errores por campo, valores conservados y bloqueo de doble envío.

- [x] **T61. Integración de perfil.** RF-113, RF-130, RF-139
  - Hecho cuando: guardar actualiza la pantalla y el pie, muestra aviso de éxito y reconcilia con la respuesta del servicio.

- [x] **T62. Página de cuenta, metadata y estados.** RF-140 a RF-145, RF-158, RF-159
  - Hecho cuando: `/dashboard/account` acepta los tres roles, muestra datos de sistema, tiene metadata, loading y error; `401` redirige.

- [x] **T63. Vista de cuenta y seguridad.** RF-140 a RF-145
  - Hecho cuando: nombre, apellido y correo en lectura; «Restablecer contraseña» abre el flujo público sin precarga y sin cerrar la sesión; sin formulario de contraseña actual.

- [x] **T64. Solicitud de rol e integración.** RF-146 a RF-157
  - Hecho cuando: solo `TUTOR` la ve; rol y motivo validados; rol actual rechazado localmente; éxito muestra mensaje del servicio con aviso de pendiente; no cambia rol, menú ni pie.

## Fase I — Calidad y cierre

- [x] **T65. Suite unitaria de usuarios.** RF-1 a RF-171
  - Hecho cuando: tests de dominio, API, acciones, estados, guardias y regresión pasan con `node --experimental-strip-types --test`.

- [x] **T66. E2E de menú y padrón.** RF-1 a RF-45
  - Hecho cuando: Playwright verifica menú por rol, sección, colapso, filtros, URL, recarga, atrás/adelante, paginación de 10 y vacíos.

- [ ] **T67. E2E de detalle y acciones.** RF-46 a RF-99
  - Hecho cuando: verifica detalle, auditoría por rol, verificación distinta, acciones deshabilitadas, cambio de rol, baja y códigos `409`, `403`, `404`, `422`.

- [ ] **T68. E2E de directorio.** RF-100 a RF-117
  - Hecho cuando: verifica exclusión de `TUTOR`, filtros, paginación, totales y salida del conjunto tras cambio de rol.

- [ ] **T69. E2E de perfil y cuenta.** RF-118 a RF-159
  - Hecho cuando: verifica edición de tutor, lectura administrativa, enlace de recuperación y solicitud de rol con aviso.

- [ ] **T70. Accesibilidad.** RNF-3, RNF-4, RNF-6
  - Hecho cuando: teclado, foco, nombres accesibles, `aria-expanded`/`aria-current`/`aria-busy`, contraste y mensajes anunciados en las cinco pantallas.

- [ ] **T71. Responsive y texto al 200 %.** RNF-5
  - Hecho cuando: sin desbordes en 320 a 1920 px, tabla con scroll interno, controles alcanzables y texto al 200 % sin pérdida de contenido.

- [x] **T72. Privacidad, consola y regresión.** RF-160 a RF-171, RNF-7, RNF-14
  - Hecho cuando: sin token, contraseñas ni datos sensibles en URL, HTML, storage, consola o red; consola limpia; Cursos, login, registro, verificación y recuperación sin regresiones.
  - Verificado el 2026-11-06 en una app Next aislada con API simulada: login y Cursos cargan; registro llega a verificación y recuperación completa el restablecimiento. No hay token, código, contraseña ni correo sin enmascarar en URL, HTML, storage no permitido ni consola; `sessionStorage` conserva únicamente correo e instante según Spec 007. Las solicitudes sensibles van solo a sus endpoints previstos, sin query sensible ni valores registrados por el mock. Consola del navegador sin errores ni advertencias; Cursos conserva tabla, filtros y acciones. Suite: 685/685; `tsc --noEmit` limpio; lint sin errores (5 avisos preexistentes).

- [ ] **T73. Cierre técnico y documentación.** RF-1 a RF-171
  - Hecho cuando: `pnpm exec tsc --noEmit` limpio, `pnpm lint` sin errores, suite completa en verde, `pnpm build` en verde con las cinco rutas, sin dependencias nuevas; spec a implementada, tasks completo y `MEMORY.md` actualizado.

## Cobertura por fase

| Fase | Tareas | RF |
|---|---|---|
| A. Base compartida | T1-T7 | RF-1 a RF-22, RF-46, RF-51, RF-161 |
| B. Dominio | T8-T17 | RF-18, RF-23 a RF-36, RF-53 a RF-58, RF-70 a RF-71, RF-81 a RF-94, RF-100 a RF-109, RF-117, RF-122 a RF-129, RF-146 a RF-149, RF-166 |
| C. API | T18-T25 | RF-20, RF-23 a RF-92, RF-100 a RF-159 |
| D. Estados y acciones | T26-T34 | RF-1 a RF-2, RF-14, RF-18 a RF-22, RF-23 a RF-159 |
| E. Padrón | T35-T46 | RF-23 a RF-80 |
| F. Detalle | T47-T51 | RF-52 a RF-99 |
| G. Directorio | T52-T56 | RF-100 a RF-117 |
| H. Perfil y cuenta | T57-T64 | RF-118 a RF-159 |
| I. Calidad | T65-T73 | RF-1 a RF-171, RNF-1 a RNF-19 |
