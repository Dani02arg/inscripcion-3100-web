# Plan — Spec 015: Reportes del personal

**Spec:** `specs/015-staff-reports/spec.md` (Estado: **aprobada**, aclarada R1/S1/V1/G1)  
**Constitución:** `docs/constitution.md` (16 principios). **Skill:** `sdd`.

> Verificación de precondición SDD: la spec se encuentra en estado **aprobada** con dudas abiertas resueltas; se puede planificar.

## Objetivo del plan

Definir archivos, responsabilidades, funciones de lógica pura, decisiones técnicas justificadas y estrategia de pruebas para implementar el módulo «Reportes» (listado de alumnos inscriptos en XLSX y padrón de personal en PDF), respetando la constitución y cubriendo la totalidad de los requisitos funcionales (RF-1 a RF-44) y no funcionales (RNF-1 a RNF-9), incorporando las aclaraciones R1, S1, V1 y G1.

---

## 1. Archivos a crear y modificar

### 1.1 Navegación y acceso (RF-1, RF-2, RF-3, RF-5)

| Acción | Archivo | Responsabilidad | RF |
|---|---|---|---|
| Modificar | `app/lib/sidebar/navigation.ts` | Habilitar «Reportes» para `ADMINISTRATIVO` y `ADMINISTRADOR` como ítem activo con destino al módulo de reportes (coincidencia por prefijo), mantenerlo ausente/no habilitado para `TUTOR`. Ajustar orden conforme a la navegación vigente. | RF-1, RF-2, RF-3 |
| Revisar (sin cambio previsto) | `app/lib/sidebar/types.ts`, `app/lib/sidebar/icons.ts` | Confirmar que la clave/ícono `reports` ya existe; no introducir claves nuevas si no son necesarias. | RF-1 |

### 1.2 Rutas del módulo (RF-3, RF-4, RF-5, RF-6, RF-10, RNF-1, RNF-4)

| Acción | Archivo | Responsabilidad | RF/RNF |
|---|---|---|---|
| Crear | `app/dashboard/reports/page.tsx` | Server Component: resuelve acceso de página (sesión/rol efectivo), aplica guardias (redirige a sesión expirada si no hay sesión válida; muestra acceso denegado sin datos para rol no autorizado/TUTOR y para intentos no permitidos), compone el armazón privado con cuenta/colapso y renderiza la vista de reportes con el rol vigente y datos iniciales necesarios. Define metadata del módulo. | RF-3, RF-4, RF-5, RF-6, RF-10, RNF-1 |
| Crear | `app/dashboard/reports/loading.tsx` | Estado de carga del segmento de ruta coherente con el resto del panel. | RNF-5 |
| Crear | `app/dashboard/reports/error.tsx` | Límite de error del segmento con opción de reintento, sin exponer datos sensibles. | RNF-5, RF-41 |

### 1.3 Dominio y lógica pura (RF-7 a RF-24, RF-26, RF-27, RF-29, RF-31, RF-33, RF-36, RF-37, RF-39, RF-44, RNF-5, RNF-7, RNF-8)

> Ubicación propuesta: `app/lib/reports/` (helpers/dominio puros, sin `fetch` ni acceso a cookies/DOM).

| Acción | Archivo | Responsabilidad | RF/RNF |
|---|---|---|---|
| Crear | `app/lib/reports/types.ts` | Tipos e interfaces inmutables (sin `any`): roles con acceso, tipo de reporte, filtros de alumnos (entradas y aplicados), opciones de filtros (incl. estados válido, informativo por ausencia de opciones específicas, inválido/no determinable), columnas/filas de vista previa de alumnos, metadatos de artefacto (base64, tipo, nombre, tamaño), estados de vista previa/descarga/generación (inicial, cargando, vacío válido, error, listo, fallo de visualización con artefacto válido), errores de campo/general, y resultados tipados de acciones/API. | RF-7–RF-44, RNF-7 |
| Crear | `app/lib/reports/constants.ts` | Constantes puras: columnas y orden del listado de alumnos (17) y del padrón (7: Apellido, Nombre, Email, DNI, Rol, Fecha de alta, Última modificación) según API, límite de filas visibles (20), mensaje de estado vacío de alumnos, opciones/etiquetas fijas de turno (Mañana/Tarde/Noche), especialidad (Básica/Informática/Electrónica) y año de estudio (1–6) con opción «Todos/Todas», etiquetas y mensajes base en español (incl. informativo «No hay opciones disponibles para este criterio.»). | RF-11, RF-13, RF-20, RF-21, RF-22, RF-23, RF-24, RF-32, RNF-5, RNF-8 |
| Crear | `app/lib/reports/filters.ts` | Funciones puras de filtros: estado inicial de entradas, normalización/limpieza, construcción de filtros aplicados desde entradas válidas, serialización de parámetros (omitiendo «Todos/Todas»/vacíos), distinción entre ausencia de opciones específicas (informativa, no bloqueante con «Todos/Todas») y estado inválido/no determinable (bloqueante), determinación de habilitación de aplicar/generar, y restablecimiento a «Todos/Todas» sin disparar generación. | RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-18 |
| Crear | `app/lib/reports/enrolled-students.ts` | Funciones puras para vista previa tabular: selección de las primeras 20 filas respetando el orden recibido, cálculo de `hasMoreThanVisible`, transformación de celdas faltantes/vacías a `-`, construcción del estado vacío (encabezados sin filas + mensaje), y utilidades de presentación de valores. | RF-20, RF-21, RF-22, RF-23, RF-24, RNF-5 |
| Crear | `app/lib/reports/artifact.ts` | Funciones puras de artefacto: validación de artefacto (presencia y tamaño > 0 kB), determinación de disponibilidad de descarga (artefacto vigente válido, incluidos vacío/sin registros y caso de fallo de visualización con artefacto válido), y helpers para metadatos de descarga/reutilización. | RF-27, RF-28, RF-29, RF-30, RF-33, RF-34, RF-35, RF-36, RF-37, RF-38, RF-44, RNF-7 |
| Crear | `app/lib/reports/preview-state.ts` | Máquina/funciones puras de transición de estado por reporte: inicial, cargando, listo (con artefacto vigente), vacío-válido (alumnos), error, y «fallo de visualización con artefacto válido» (padrón); reglas de descarte al cambiar de reporte y de conservación ante limpiar filtros, error de aplicación, descarga, reintento y fallo de auto-generación del padrón. | RF-9, RF-15, RF-16, RF-17, RF-24, RF-25, RF-29, RF-31, RF-36, RF-37, RF-41, RF-43, RF-44, RNF-5 |
| Crear | `app/lib/reports/access.ts` | Lógica pura de autorización por rol: acceso al módulo, reportes permitidos por rol (`ADMINISTRATIVO`: alumnos; `ADMINISTRADOR`: alumnos y padrón), y decisión de denegación para padrón/acceso directo no autorizado. | RF-1, RF-2, RF-5, RF-6, RF-7, RF-10 |
| Crear | `app/lib/reports/xlsx-preview.ts` | Utilidad pura (sin dependencias externas) para derivar, desde el artefacto XLSX del listado, las filas/valores necesarios para la vista previa tabular (columnas y contenido) acotada al formato conocido del reporte del servicio, preservando orden y permitiendo identificar total de filas. (Ver decisión técnica D3). | RF-20, RF-21, RF-22, RF-23, RF-28, RF-44, RNF-7 |

### 1.4 Integración con API y acciones (RF-4, RF-11, RF-14, RF-15, RF-19, RF-28, RF-31, RF-35, RF-36, RF-37, RF-39, RF-40, RF-41, RF-42, RF-44, RNF-6, RNF-7)

| Acción | Archivo | Responsabilidad | RF/RNF |
|---|---|---|---|
| Crear | `app/lib/api/reports.ts` | Cliente HTTP centralizado (mismo patrón que `app/lib/api/*`): obtiene artefactos binarios desde `/api/reports/enrolled-students` (con filtros válidos como query params) y `/api/reports/staff`, con `Authorization: Bearer`, `cache: "no-store"`, `credentials: "omit"`, `redirect: "manual"` y timeout. Devuelve bytes/base64, `Content-Type`, nombre desde `Content-Disposition`, tamaño y errores tipados (401/403/422/timeout/red/inesperado) con mensaje del servicio cuando exista. No expone tokens ni datos sensibles. | RF-11, RF-14, RF-15, RF-19, RF-31, RF-35, RF-39, RF-40, RF-41, RF-44, RNF-6, RNF-7 |
| Crear | `app/lib/actions/reports.ts` | Server Actions: (a) generar/obtener artefacto del listado de alumnos (valida acceso y filtros en estado válido, llama API, produce artefacto y datos de vista previa derivados del mismo artefacto) y (b) generar/obtener artefacto del padrón (valida rol administrador). Reutilización: cada acción retorna el artefacto vigente para que el cliente lo conserve y lo descargue sin nueva obtención. Manejo de sesión inválida/403/422/timeout/errores según spec. | RF-4, RF-5, RF-6, RF-14, RF-15, RF-18, RF-19, RF-28, RF-31, RF-35, RF-36, RF-37, RF-39, RF-40, RF-41, RF-42, RF-43, RF-44, RNF-6, RNF-7 |

### 1.5 Interfaz de usuario (RF-7 a RF-10, RF-13, RF-14, RF-17, RF-19 a RF-38, RF-41, RF-42, RF-43, RNF-1 a RNF-9)

> Componentes visuales en `app/ui/reports/` (puros cuando sea posible; interactividad solo en hojas cliente). Textos visibles en español.

| Acción | Archivo | Responsabilidad | RF/RNF |
|---|---|---|---|
| Crear | `app/ui/reports/reports-view.tsx` | Hoja cliente orquestadora: selector segmentado para `ADMINISTRADOR` (alumnos/padrón) y vista directa para `ADMINISTRATIVO`; descarta estado al cambiar de reporte; dispara generación automática del padrón al seleccionarlo/volver (estado inicial) y coordina reintento manual ante fallo según G1; compone sub-vistas, estados, artefacto vigente y persistencia tras descarga. | RF-7, RF-8, RF-9, RF-10, RF-31, RF-41, RF-43, RNF-2, RNF-3 |
| Crear | `app/ui/reports/enrolled-students-report.tsx` | Hoja cliente del listado: entradas de filtros, acción «Limpiar filtros», botón de búsqueda/generación (deshabilitado si criterio inválido/no determinable o generación en curso), validación/errores por filtro o generales, conservación de vista previa/artefacto vigente según reglas, disparo de generación, reintento que repite la misma generación con los mismos filtros aplicados vigentes, y composición de vista previa + descarga. | RF-11–RF-19, RF-24, RF-25, RF-27, RF-28, RF-29, RF-30, RF-41, RF-42, RF-43, RF-44, RNF-2, RNF-3 |
| Crear | `app/ui/reports/enrolled-students-filters.tsx` | Controles de filtros (año lectivo según años disponibles, año de estudio, turno, especialidad) con opciones en español y «Todos/Todas»; muestra mensaje informativo cuando no hay opciones específicas disponibles (sin bloquear, con «Todos/Todas») y error/bloqueo cuando un criterio es inválido o no determinable; etiquetas accesibles y presentación de errores asociados. | RF-11, RF-12, RF-13, RF-14, RF-15, RF-18, RNF-3, RNF-8 |
| Crear | `app/ui/reports/enrolled-students-preview.tsx` | Vista previa tabular: tabla con 17 columnas en orden, hasta 20 filas (orden del servicio), celdas vacías como `-`, estado vacío (encabezados + mensaje), mensaje «ver más detalles» cuando >20, y contenedor con scroll interno vertical/horizontal sin zoom. | RF-20, RF-21, RF-22, RF-23, RF-24, RF-26, RNF-3, RNF-5, RNF-8, RNF-9 |
| Crear | `app/ui/reports/staff-report.tsx` | Hoja cliente del padrón: generación automática al entrar/seleccionar/volver; si falla o supera el tiempo de espera, estado de error con reintento manual que repite la misma generación sin filtros (sin reintentos automáticos en bucle); manejo de carga, listo (incl. sin registros), fallo de visualización con artefacto válido, y composición de vista previa + descarga. | RF-9, RF-31, RF-32, RF-33, RF-34, RF-36, RF-37, RF-38, RF-41, RF-42, RF-43, RNF-2, RNF-3 |
| Crear | `app/ui/reports/staff-pdf-preview.tsx` | Previsualización del documento PDF del padrón (7 columnas: Apellido, Nombre, Email, DNI, Rol, Fecha de alta, Última modificación) dentro del área acotada: renderizado del artefacto, scroll interno vertical/horizontal, controles de zoom (acercar, alejar, ajuste al ancho o a la página), y mensaje de problema de visualización cuando corresponda manteniendo descarga si el artefacto es válido. | RF-32, RF-33, RF-36, RNF-3, RNF-4, RNF-9 |
| Crear | `app/ui/reports/report-preview-shell.tsx` | Contenedor común del área de vista previa que aplica RNF-9 (altura objetivo 60 % del área de contenido disponible, altura mínima 20 rem y altura máxima acotada para mantener alcanzables filtros arriba y descarga abajo mediante scroll externo), scroll interno V/H y nombre/etiqueta accesible del estado del reporte. | RF-26, RF-32, RNF-3, RNF-4, RNF-9 |
| Crear | `app/ui/reports/download-button.tsx` (o equivalente) | Botón de descarga debajo de la vista previa, disponible solo cuando existe artefacto vigente descargable; dispara descarga reutilizando el artefacto en cliente; evita repeticiones mientras descarga; en fallo de descarga ofrece reintento que repite la entrega del mismo artefacto vigente cuando existe y es válido (o la generación aplicable si no). | RF-27, RF-28, RF-29, RF-30, RF-34, RF-35, RF-38, RF-42, RF-43, RNF-3 |
| Crear | `app/ui/reports/report-states.tsx` | Presentación reutilizable de estados: carga (indicador + texto), error (mensaje + reintentar con semántica definida), acceso denegado (sin datos), coherente con RNF-5 y anuncios accesibles. | RF-39, RF-41, RNF-3, RNF-5 |

> Nota: los nombres exactos de componentes pueden ajustarse en implementación siempre que se mantengan responsabilidades y separación de capas (P3, P4).

### 1.6 Pruebas (todas las áreas)

| Acción | Archivo | Responsabilidad | RF/RNF |
|---|---|---|---|
| Crear | `tests/reports/filters.test.ts` | Lógica pura de filtros: «Todos/Todas» como ausencia de restricción, serialización, limpiar sin auto-generar, ausencia de opciones específicas (informativa, no bloqueante), criterio inválido/no determinable (bloqueante), habilitación de aplicar/generar. | RF-11–RF-18 |
| Crear | `tests/reports/enrolled-students.test.ts` | Vista previa tabular: columnas/orden, 20 filas, `-` en vacíos, `hasMoreThanVisible`, estado vacío y mensaje. | RF-20–RF-24, RNF-5 |
| Crear | `tests/reports/artifact.test.ts` | Validez de artefacto y disponibilidad de descarga (incl. vacío, sin registros, visualización fallida con >0 kB, inválido/0 kB). | RF-27, RF-29, RF-30, RF-33, RF-34, RF-36, RF-37, RF-38, RNF-7 |
| Crear | `tests/reports/preview-state.test.ts` | Transiciones: aplicar, limpiar, error de aplicación conservando vigente, descarte al cambiar, fallo de auto-generación del padrón y reintento manual, persistencia tras descarga, timeout/error. | RF-9, RF-15–RF-17, RF-31, RF-41, RF-43, RF-44 |
| Crear | `tests/reports/access.test.ts` | Decisiones de acceso por rol (módulo y padrón). | RF-1, RF-2, RF-5, RF-6, RF-7, RF-10 |
| Crear | `tests/reports/api-reports.test.ts` | Cliente API con `fetch` simulado: endpoints, headers, query params, mapeo 401/403/422/red/timeout y extracción de nombre/tipo/tamaño. | RF-14, RF-15, RF-31, RF-35, RF-39, RF-40, RF-41 |
| Crear | `tests/reports/actions-reports.test.ts` | Server Actions: guardias de rol/sesión, generación alumnos/padrón, retorno de artefacto + preview, errores y validación de filtros. | RF-4, RF-5, RF-6, RF-14, RF-15, RF-18, RF-28, RF-31, RF-36, RF-37, RF-40, RF-41, RF-44 |
| Crear (si aplica) | `tests/reports/xlsx-preview.test.ts` | Extracción de vista previa desde artefacto XLSX (fixture controlado) respetando columnas/orden/filas. | RF-20, RF-21, RF-28 |

> Ubicación y convención final de tests según la estructura existente del repositorio (`tests/**/*.test.ts`), sin dependencias nuevas.

---

## 2. Funciones lógicas puras (principales)

> Todas en `app/lib/reports/*` (o utilidades puras asociadas), deterministas, sin efectos secundarios, tipadas estrictamente.

| Función (propuesta) | Descripción | RF cubiertos |
|---|---|---|
| `getAllowedReportTypes(role)` | Devuelve los reportes permitidos por rol vigente. | RF-1, RF-2, RF-5, RF-6, RF-7, RF-10 |
| `canAccessStaffReport(role)` | Indica si el rol puede acceder/generar padrón. | RF-6, RF-7 |
| `createInitialFilterInputs()` / `clearFilterInputs(inputs)` | Inicializa o restablece entradas a «Todos/Todas» sin generar. | RF-13, RF-17 |
| `buildAppliedFilters(inputs, optionsAvailability)` | Valida/normaliza entradas; trata «Todos/Todas» como ausencia de restricción (válido aunque falten opciones específicas, con estado informativo); detecta estado inválido/no determinable (bloqueante); produce filtros aplicados, errores o información. | RF-11, RF-12, RF-14, RF-15, RF-18 |
| `canApplyFilters(filterState)` | Determina si el botón de búsqueda/generación puede habilitarse (todos los criterios válidos y sin generación en curso). | RF-14, RF-18, RF-42 |
| `toEnrolledStudentsQuery(filters)` | Serializa solo filtros aplicables admitidos (omite «Todos/Todas»/vacíos). | RF-11, RF-12, RF-14 |
| `buildEnrolledStudentsPreview(rows, columns)` | Deriva filas visibles (máx. 20, orden recibido), reemplaza faltantes/vacíos por `-`, calcula total y `hasMoreThanVisible`. | RF-20, RF-21, RF-22, RF-23 |
| `buildEmptyEnrolledStudentsPreview()` | Construye vista previa vacía válida (encabezados, 0 filas, mensaje). | RF-23, RF-24, RNF-5 |
| `parseEnrolledStudentsXlsxArtifact(artifactBytes/base64)` | Extrae contenido tabular del artefacto XLSX (formato conocido) para preview, sin dependencias externas. | RF-20, RF-21, RF-28, RF-44, RNF-7 |
| `isValidArtifact(artifact)` / `canDownloadArtifact(artifact, visualizationFailed?)` | Valida artefacto (> 0 kB, datos presentes) y determina si la descarga está disponible (incl. vacío/sin registros y fallo de visualización con artefacto válido). | RF-27, RF-29, RF-30, RF-33, RF-34, RF-35, RF-36, RF-37, RF-38, RNF-7 |
| `reduceReportState(prev, event)` (o transiciones equivalentes) | Aplica reglas: iniciar carga, éxito con artefacto vigente, vacío válido, error de generación/timeout (incl. fallo de auto-generación del padrón), error de aplicación conservando vigente, limpiar entradas conservando vigente, descarte al cambiar de reporte, persistencia tras descarga, reintento según semántica definida. | RF-9, RF-15, RF-16, RF-17, RF-24, RF-25, RF-30, RF-31, RF-36, RF-37, RF-38, RF-41, RF-43, RF-44 |
| `getRetryAction(context)` / `mapServiceError(error)` | Determina la acción de reintento (misma generación con filtros aplicados vigentes / sin filtros en padrón, o entrega del mismo artefacto vigente en descarga cuando aplique) y normaliza mensajes (prefiere `message` del servicio). | RF-30, RF-31, RF-38, RF-39, RF-40, RF-41 |
| `getVisibleStatePresentation(state)` | Mapea estado a etiqueta/indicador/mensaje verificable (carga, vacío, error, acceso denegado, listo). | RNF-5 |

---

## 3. Decisiones técnicas justificadas

> Cada decisión respeta la constitución (capas P3/P4, Server Components por defecto P5, API centralizada P6, sin dependencias nuevas P8, sin exponer tokens P6/seguridad, sin `any` P2, textos UI en español P7/P16).

| # | Decisión | Justificación | Alternativa descartada | RF/RNF |
|---|---|---|---|---|
| D1 | **Un único artefacto por generación, reutilizado para vista previa y descarga.** El cliente conserva el artefacto vigente (bytes/base64 + metadatos) devuelto por la acción de generación y lo usa para renderizar preview y para descargar sin una nueva obtención. | Cumple literalmente la reutilización exigida y evita divergencias entre lo visto y lo descargado. | Dos solicitudes separadas (una para preview, otra para descarga): descartada porque puede producir resultados distintos en el tiempo y contradice la correspondencia artefacto vigente exigida (RF-28, RF-35, RF-44, RNF-7). | RF-28, RF-35, RF-39, RF-43, RF-44, RNF-7 |
| D2 | **Generación y obtención de artefactos vía Server Actions + cliente HTTP centralizado en `app/lib/api/reports.ts`.** El token de sesión se usa solo del lado servidor; al cliente solo llegan artefactos/datos necesarios y errores. | Respeta P3, P4, P6 y seguridad (tokens nunca en cliente/DOM/logs); centraliza contratos y manejo de errores HTTP/timeout. | `fetch` directo desde componentes UI o desde el navegador al servicio: descartado por violar pureza/capas y exponer manejo de autenticación fuera de la capa de red controlada (P4, P6). | RF-4, RF-14, RF-15, RF-31, RF-39, RF-40, RF-41, RNF-6 |
| D3 | **Vista previa tabular del XLSX derivada del mismo artefacto mediante utilidad interna sin dependencias externas.** Se implementa una extracción acotada al formato conocido del reporte (lectura de la planilla y sus valores) para producir columnas/filas de preview; si el formato no es interpretable, se trata como error de generación/visualización controlado sin entregar datos parciales incorrectos. | La spec exige tabla en pantalla con mismas columnas/datos y reutilización del artefacto; no existe endpoint JSON de preview y P8 prohíbe librerías externas no aprobadas. | Agregar librería de parseo XLSX: descartada por P8 (sin aprobación previa). Doble generación o mostrar el XLSX embebido: descartadas por incumplir tabla en pantalla y/o reutilización de artefacto (RF-19, RF-28). | RF-19, RF-20, RF-21, RF-22, RF-23, RF-28, RNF-7, P8 |
| D4 | **Interactividad concentrada en hojas cliente mínimas; página/guardias como Server Components.** Estado de filtros, selección segmentada, carga, artefacto vigente y descarga viven en componentes cliente hoja; acceso inicial y composición del armazón se resuelven en servidor. | P5 (Server Components por defecto, `use client` solo donde hay estado/eventos), manteniendo P4 (UI sin `fetch` directo). | Convertir todo el módulo a cliente o hacer todo en servidor sin estado interactivo: descartado por necesidad de interacciones (aplicar/limpiar, cambiar reporte, estados de carga, zoom/descarga) y por P5. | RF-7–RF-9, RF-14, RF-17, RF-25, RF-31, RF-32, RF-42, RNF-3 |
| D5 | **Descarte de estado al cambiar de reporte; limpieza de filtros sin pérdida del artefacto vigente.** El cambio de segmento reinicia al estado inicial del reporte destino (con auto-generación en padrón). «Limpiar filtros» solo restablece entradas a «Todos/Todas». | Evita mezclar resultados y datos potencialmente desactualizados al volver, y preserva la posibilidad de descargar el último resultado válido conforme a lo definido. | Conservar cacheada la vista previa al cambiar o invalidar la descarga al limpiar: descartado por contradecir RF-9/RF-17 y la expectativa de vigencia definida. | RF-9, RF-16, RF-17, RF-43, RF-44 |
| D6 | **Padrón: generación automática al seleccionar/volver (G1) y manejo explícito de «visualización fallida con artefacto válido (> 0 kB)».** Al volver se descarta estado y se dispara auto-generación; si falla o supera el tiempo de espera, se muestra error con reintento manual que repite la misma generación sin filtros (sin bucle automático). Si hay bytes válidos pero el visor no puede renderizar, se informa y se mantiene descarga. | Cumple la regla funcional específica, evita bucles automáticos y no bloquea la entrega de un archivo válido por un fallo de presentación. | Reintentos automáticos en bucle o tratar cualquier fallo de preview como fallo total con descarga bloqueada: descartados por complejidad/riesgo y por impedir descarga cuando el artefacto es válido (RF-9, RF-31, RF-36). | RF-9, RF-31, RF-33, RF-34, RF-36, RF-37 |
| D7 | **Área de vista previa con altura objetivo 60 %, mínimo 20 rem y máximo que preserva acceso a filtros y descarga (V1), con scroll interno V/H y scroll externo del módulo.** Contenedor común aplica la proporción y límites; tabla sin zoom, PDF con controles de zoom internos. | Satisface RNF-9 (verificable) y resuelve la tensión con RNF-4 manteniendo filtros y descarga alcanzables en pantallas pequeñas. | Altura fija rígida sin mínimo/máximo verificable ni scroll externo: descartada por comprometer usabilidad/responsive (RNF-4). | RF-26, RF-32, RNF-3, RNF-4, RNF-9 |
| D8 | **Timeout y manejo de errores unificados con reintento de semántica definida.** Reintento repite la misma generación con los mismos filtros aplicados vigentes (alumnos) o sin filtros (padrón); en fallos de descarga, repite la entrega del mismo artefacto vigente cuando exista y sea válido. Conserva contexto y artefacto válido previo. | Respuesta verificable ante demoras/fallos sin perder filtros aplicados ni artefacto válido previo, alineada a la spec. | Espera indefinida, reintentos ambiguos o borrado de estado ante error: descartados por mala experiencia y por incumplir conservación/reintento (RF-30, RF-38, RF-41, RF-42). | RF-30, RF-31, RF-38, RF-39, RF-40, RF-41, RF-42, RNF-5 |
| D9 | **Filtros con «Todos/Todas» como estado válido/no restrictivo (R1) y bloqueo solo por estado inválido/no determinable.** Ausencia de opciones específicas se informa sin bloquear si el criterio está en «Todos/Todas»; el botón de aplicar se habilita con criterios válidos y sin generación en curso. | Coherente con la interpretación “no filtrar” y evita bloqueos indebidos, manteniendo validación verificable. | Bloquear generación por ausencia de opciones específicas: descartado por contradecir R1 y el comportamiento esperado de «Todos/Todas» (RF-11, RF-13, RF-14, RF-18). | RF-11, RF-13, RF-14, RF-18 |

---

## 4. Estrategia de tests

### 4.1 Principios

- Cobertura alineada a RF/RNF (trazabilidad por caso). Pruebas deterministas, sin dependencias externas nuevas.
- Priorizar lógica pura (`app/lib/reports/*`) con pruebas unitarias; cubrir integración de `app/lib/api/reports.ts` y `app/lib/actions/reports.ts` con dobles de `fetch`/dependencias inyectadas o simuladas según patrón del proyecto.
- Textos y comportamientos verificados en español cuando aplique (RNF-8). No incluir tokens/datos sensibles en fixtures/logs (RNF-6).

### 4.2 Niveles y casos

| Nivel | Alcance | Casos clave | Cubre |
|---|---|---|---|
| Unitario (lógica pura) | `filters`, `enrolled-students`, `artifact`, `preview-state`, `access`, `xlsx-preview` | «Todos/Todas» como ausencia de restricción (válido), combinación y serialización omitiendo «Todos», limpiar sin auto-generar y sin perder vigente, ausencia de opciones específicas informativa/no bloqueante con «Todos/Todas», criterio inválido/no determinable bloqueante y habilitación de aplicar; 17 columnas/orden, 20 primeras filas, `-` en vacíos, `>20` y mensaje, estado vacío con encabezados+mensaje; validez de artefacto (>0 kB), descarga disponible en vacío/sin registros/fallo visualización con artefacto válido e indisponible en inválido; transiciones (carga, éxito, error, timeout, conservar vigente ante error de aplicación, descartar al cambiar, fallo de auto-generación padrón + reintento manual sin bucle, persistir tras descarga, semántica de reintento); permisos por rol y padrón solo admin; extracción de preview desde XLSX de muestra. | RF-1,2,5–7,9–18,20–24,27,29–31,33,34,36–38,41,43,44, RNF-5,7 |
| Integración (API/acciones) | `app/lib/api/reports.ts`, `app/lib/actions/reports.ts` | `GET /api/reports/enrolled-students` y `/api/reports/staff` con auth/headers/no-store/timeout; query params correctos (omite «Todos»); parseo de filename/content-type/tamaño; mapeo 401→sesión, 403→permisos, 422→validación con mensaje/errores, timeout/red→error; acciones rechazan rol no autorizado (incl. staff para `ADMINISTRATIVO`), rechazan estado inválido/no determinable y retornan artefacto+preview coherentes. | RF-4–6,14,15,18,19,28,31,35–41,44, RNF-6,7 |
| Componente/UI (si el entorno de pruebas lo soporta) | `reports-view`, filtros, previews, botón descarga | Control segmentado solo para admin; directo para administrativo; auto-generación padrón al seleccionar/volver y, ante fallo/timeout, error con reintento manual que repite la misma generación sin filtros (sin bucle automático); descarte al cambiar; aplicar/limpiar (sin auto-generar, sin perder vigente), «Todos» no bloquea por ausencia de opciones específicas, bloqueo/deshabilitación por criterio inválido/no determinable o generación en curso; estados carga/vacío/error/listo; tabla 20 filas + mensaje >20; scroll interno V/H y zoom solo en PDF; descarga habilitada según artefacto vigente y reintento de descarga reutilizando mismo artefacto vigente cuando aplique; persistencia tras descarga; foco/operabilidad por teclado; layout responsive (S1) y área preview (V1) cuando sea verificable. | RF-7–10,14–19,24–38,41–43, RNF-3,4,5,8,9 |
| Verificación transversal | módulo completo | Acceso/denegación, no exposición de datos sensibles, idioma español, consistencia filtros-aplicados=artefacto=descarga y semántica de reintento. | RF-1–6,30,38–41, RNF-1,6,7,8 |

### 4.3 Casos límite obligatorios (matriz)

- Sin resultados alumnos: vista previa vacía válida, mensaje definido, descarga XLSX disponible. (RF-23, RF-24, RF-27, caso 129)
- Más de 20 / 20 o menos: recorte y mensaje solo si >20. (RF-21–RF-23, casos 130,131)
- Padrón sin registros: preview y descarga disponibles. (RF-33, RF-34, caso 132)
- Acceso directo no autorizado a padrón/módulo (`ADMINISTRATIVO`, `TUTOR`). (RF-5, RF-6, casos 133,134)
- Filtros modificados sin aplicar / limpiar: vigente se conserva. (RF-16, RF-17, casos 135,136)
- Filtros inválidos/no admitidos: error con mensaje servicio, sin reemplazo de vigente. (RF-15, caso 137)
- Criterio sin opciones específicas con «Todos/Todas»: mensaje informativo, no bloquea la generación. (RF-13, RF-18, caso 138a)
- Criterio inválido o no determinable: no permite generar, botón deshabilitado y mensaje asociado. (RF-14, RF-18, caso 138b)
- Combinación de filtros y «Todos»: resultado correcto. (RF-12, casos 139,140)
- Cambio de reporte y regreso: descarte y estado inicial con generación requerida; si la auto-generación del padrón falla o supera el tiempo de espera, error con reintento manual (misma generación sin filtros, sin bucle automático). (RF-9, RF-31, caso 141)
- Fallo de visualización PDF con artefacto válido > 0 kB: mensaje y descarga disponible. (RF-36, caso 142)
- Artefacto inválido/0 kB o fallo de entrega: error, sin descarga inválida, reintento (misma generación). (RF-37, caso 143)
- Timeout/comunicación/fallo inesperado: error, conservación de contexto/artefacto válido previo, reintento con semántica definida. (RF-30, RF-38, RF-41, caso 144)
- Persistencia tras descarga exitosa/fallida. (RF-43, caso 145)
- Sesión vencida durante generación/descarga. (RF-4, RF-40, caso 146)

### 4.4 Criterios de aceptación de calidad

- `pnpm test` en verde (incluidas pruebas nuevas), `pnpm typecheck` y `pnpm lint` sin errores, `pnpm build` exitoso (P10).
- Sin `any`, sin supresión insegura de tipos (P2). Sin dependencias nuevas (P8). Sin exposición de tokens/datos sensibles (RNF-6). Textos UI/mensajes en español (RNF-8).

---

## 5. Trazabilidad resumida (RF → entregables)

- **Acceso/navegación (RF-1–RF-6):** navegación sidebar, `page.tsx`/guardias, `access.ts`, acciones con verificación de rol/sesión.
- **Selección por rol (RF-7–RF-10):** `reports-view` (segmentado/directo), `preview-state` (descarte/reinicio, fallo auto-gen padrón), `access`.
- **Filtros alumnos (RF-11–RF-18):** `constants`, `filters`, `enrolled-students-filters`, `actions/api`, estados válido/informativo/inválido, habilitación de aplicar y mensajes.
- **Preview alumnos (RF-19–RF-26):** `enrolled-students`, `xlsx-preview`, `enrolled-students-preview`, `report-preview-shell`, estados.
- **Descarga alumnos (RF-27–RF-30):** `artifact`, `download-button`, reutilización de artefacto, reintento de descarga/entrega.
- **Padrón (RF-31–RF-38):** auto-generación (G1), `staff-report`, `staff-pdf-preview` (7 columnas, zoom/scroll), validez de artefacto, reintentos definidos.
- **Errores/comportamiento general (RF-39–RF-44):** mapeo de errores, timeout, anti-repetición, persistencia, semántica de reintento, no reutilizar obsoleto.
- **RNF-1–RNF-9:** consistencia visual, flujo/UX, accesibilidad, responsive (S1: 320–1920 px, apilado, táctil/legibilidad), claridad de estados, privacidad, confiabilidad del artefacto, idioma, área 60 % (V1: mín. 20 rem, máx. alcanzable, scroll interno/externo).

---

## 6. Supuestos y notas de implementación

- Las opciones disponibles de «año lectivo» se obtendrán de los años lectivos existentes en cursos vigentes permitidos por el servicio; «Todos/Todas» permanece siempre disponible como ausencia de restricción. Si no hay opciones específicas, se informa sin bloquear la generación (R1); solo se impide generar ante estado inválido/no determinable (RF-11, RF-13, RF-18).
- La extracción de vista previa desde XLSX se limita al formato del reporte entregado por el servicio; ante un artefacto no interpretable se reporta error controlado sin mostrar datos parciales.
- La previsualización PDF y sus controles de zoom se implementan con capacidades web estándar dentro del módulo, sin introducir dependencias externas (P8), y se validará en los navegadores objetivo durante la implementación.

**Fuera del alcance del plan:** tareas de implementación (fase siguiente: `tasks.md`, tras aprobación explícita del plan).
