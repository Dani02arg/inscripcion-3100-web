# Tasks — Spec 015: Reportes del personal

**Spec:** `specs/015-staff-reports/spec.md` (aprobada, aclarada R1/S1/V1/G1)  
**Plan:** `specs/015-staff-reports/plan.md` (aprobado, actualizado)  
**Skill:** `sdd`

> Tareas pequeñas (máx. 20-30 min), en orden de dependencia. Una tarea a la vez durante la implementación: tests primero, código después, test en verde, marcar tarea y parar.

## Fundamentos de dominio (lógica pura)

- [x] **T1. Definir tipos y constantes del módulo de reportes.** RF-7, RF-8, RF-10, RF-11, RF-13, RF-20, RF-21, RF-22, RF-23, RF-24, RF-27, RF-29, RF-31, RF-32, RF-33, RF-36, RF-37, RF-44, RNF-5, RNF-7, RNF-8
  - Hecho cuando: existen `app/lib/reports/types.ts` y `app/lib/reports/constants.ts` con tipos inmutables (sin `any`) para roles/reportes, filtros (entradas y aplicados), opciones con estados válido/informativo por ausencia de opciones específicas/inválido-no determinable, columnas (17 alumnos; 7 padrón: Apellido, Nombre, Email, DNI, Rol, Fecha de alta, Última modificación) y orden, límite 20, mensaje vacío «No se encontraron alumnos inscriptos para los filtros aplicados.», opción «Todos/Todas» como ausencia de restricción, estados de preview/descarga/artefacto (incl. vacío válido y fallo de visualización con artefacto válido), errores y resultados; `pnpm typecheck` pasa para estos archivos.

- [x] **T2. Implementar y probar lógica pura de acceso por rol.** RF-1, RF-2, RF-3, RF-5, RF-6, RF-7, RF-10, RNF-6
  - Hecho cuando: `app/lib/reports/access.ts` expone funciones puras que determinan acceso al módulo, reportes permitidos (`ADMINISTRATIVO`: alumnos; `ADMINISTRADOR`: alumnos y padrón) y denegación de padrón/acceso no autorizado (incl. `TUTOR`), con pruebas en `tests/reports/access.test.ts` que cubren casos permitidos/denegados y acceso directo al padrón por administrativo en verde.

- [x] **T3. Implementar y probar lógica pura de filtros de alumnos inscriptos (R1).** RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-18
  - Hecho cuando: `app/lib/reports/filters.ts` implementa estado inicial, opciones/«Todos/Todas» (ausencia de restricción), normalización, construcción de filtros aplicados desde entradas válidas, serialización omitiendo «Todos/Todas», ausencia de opciones específicas como estado informativo no bloqueante cuando el criterio está en «Todos/Todas», criterio inválido/no determinable como bloqueante, determinación de habilitación de aplicar/generar (válidos y sin generación en curso) y limpiar entradas sin auto-generar; pruebas en `tests/reports/filters.test.ts` verifican combinación de filtros, todos en «Todos» (permite generar), limpieza, informativo sin opciones específicas no bloqueante y bloqueo por criterio inválido/no determinable en verde.

- [x] **T4. Implementar y probar helpers de vista previa tabular de alumnos.** RF-20, RF-21, RF-22, RF-23, RF-24, RNF-5, RNF-8
  - Hecho cuando: `app/lib/reports/enrolled-students.ts` construye preview con las 17 columnas en orden, primeras 20 filas respetando orden recibido, celdas faltantes/vacías como `-`, cálculo de total/`hasMoreThanVisible`, estado vacío válido (encabezados sin filas + mensaje definido) y mensaje solo cuando >20; pruebas en `tests/reports/enrolled-students.test.ts` cubren 0, ≤20 y >20 resultados en verde.

- [x] **T5. Implementar y probar helpers de artefacto y disponibilidad de descarga.** RF-27, RF-28, RF-29, RF-30, RF-33, RF-34, RF-35, RF-36, RF-37, RF-38, RF-44, RNF-7
  - Hecho cuando: `app/lib/reports/artifact.ts` valida artefactos (presencia, tamaño > 0 kB, metadatos) y determina disponibilidad de descarga para vigente válido (incl. alumnos vacío y padrón sin registros) y para fallo de visualización con artefacto válido (> 0 kB), rechazando artefacto inválido/0 kB; las utilidades soportan la regla de reintento de descarga (reutilizar mismo artefacto vigente cuando aplique); pruebas en `tests/reports/artifact.test.ts` cubren todos estos casos en verde.

- [x] **T6. Implementar y probar transiciones de estado de preview/artefacto (incl. G1 y semántica de reintento).** RF-9, RF-15, RF-16, RF-17, RF-24, RF-25, RF-30, RF-31, RF-36, RF-37, RF-38, RF-41, RF-42, RF-43, RF-44, RNF-5
  - Hecho cuando: `app/lib/reports/preview-state.ts` implementa transiciones puras: inicial/carga/éxito/vacío-válido/error/fallo-visualización-con-artefacto-válido; conserva vigente ante error de aplicación y ante limpiar entradas; descarta estado/artefacto al cambiar de reporte (reinicio a estado inicial); ante fallo/timeout de auto-generación del padrón pasa a error con posibilidad de reintento manual (sin bucle automático) que repite la misma generación sin filtros; persiste tras descarga; modela reintento como misma generación con filtros aplicados vigentes (alumnos) o sin filtros (padrón) y, en descarga, entrega del mismo artefacto vigente cuando aplique; evita reutilizar artefacto obsoleto; pruebas en `tests/reports/preview-state.test.ts` verifican estos escenarios en verde.

- [x] **T7. Implementar y probar extracción de vista previa desde artefacto XLSX (formato conocido).** RF-19, RF-20, RF-21, RF-22, RF-23, RF-28, RF-44, RNF-7
  - Hecho cuando: `app/lib/reports/xlsx-preview.ts` deriva del artefacto XLSX del listado las filas/valores necesarios para la tabla de preview (mismas columnas/orden/contenido, total de filas) sin dependencias externas, acotado al formato del servicio y con fallo controlado ante formato no interpretable; pruebas en `tests/reports/xlsx-preview.test.ts` con fixture representativa validan extracción correcta y orden en verde.

## Integración API y acciones

- [x] **T8. Implementar y probar cliente API de reportes (artefactos binarios).** RF-4, RF-11, RF-14, RF-15, RF-19, RF-31, RF-35, RF-39, RF-40, RF-41, RF-44, RNF-6, RNF-7
  - Hecho cuando: `app/lib/api/reports.ts` obtiene artefactos desde `/api/reports/enrolled-students` (query params serializados omitiendo «Todos/Todas») y `/api/reports/staff` con `Authorization: Bearer`, `cache: "no-store"`, `credentials: "omit"`, timeout y sin exponer token, devolviendo base64/bytes, content-type, nombre (Content-Disposition), tamaño y errores tipados (401, 403, 422 con mensaje/errores, timeout/red/inesperado, mensaje del servicio cuando exista); pruebas en `tests/reports/api-reports.test.ts` con `fetch` simulado verifican endpoints, headers, params y mapeos de error en verde.

- [x] **T9. Implementar y probar Server Actions de generación de reportes.** RF-4, RF-5, RF-6, RF-14, RF-15, RF-18, RF-19, RF-28, RF-31, RF-35, RF-36, RF-37, RF-39, RF-40, RF-41, RF-42, RF-43, RF-44, RNF-6, RNF-7
  - Hecho cuando: `app/lib/actions/reports.ts` expone acciones para generar listado de alumnos y padrón que validan sesión/rol (incl. padrón solo `ADMINISTRADOR`) y estado válido de filtros (permitiendo «Todos/Todas», rechazando inválido/no determinable), invocan la API, retornan artefacto vigente + datos de preview (alumnos derivados del mismo artefacto) y errores normalizados, sin nueva obtención para descarga; pruebas en `tests/reports/actions-reports.test.ts` cubren éxito, 401/403/422/timeout, denegación de padrón a `ADMINISTRATIVO` y manejo de filtros según R1 en verde.

## Navegación y ruta del módulo

- [x] **T10. Habilitar enlace «Reportes» en el menú lateral para roles autorizados.** RF-1, RF-2, RF-3
  - Hecho cuando: `app/lib/sidebar/navigation.ts` muestra «Reportes» como ítem activo (destino al módulo, coincidencia por prefijo) para `ADMINISTRATIVO` y `ADMINISTRADOR`, lo mantiene no disponible/ausente para `TUTOR`, y la opción queda marcada activa en rutas del módulo; no se rompen pruebas/lint existentes.

- [x] **T11. Crear segmento de ruta del módulo con guardias, armazón y estados de carga/error.** RF-3, RF-4, RF-5, RF-6, RF-10, RF-39, RF-40, RF-41, RNF-1, RNF-5
  - Hecho cuando: existen `app/dashboard/reports/page.tsx`, `loading.tsx` y `error.tsx`; la página resuelve rol efectivo/sesión, redirige a sesión expirada si corresponde, muestra acceso denegado sin exponer datos ante rol no autorizado/TUTOR o acceso no permitido, compone `PrivateShell` y renderiza la vista de reportes para roles autorizados con metadata definida; loading/error del segmento son coherentes y reintentables (reintento según semántica aplicable).

## Interfaz de usuario

- [x] **T12. Crear componentes base de estados y contenedor de vista previa (V1).** RF-24, RF-25, RF-26, RF-32, RF-39, RF-41, RNF-3, RNF-4, RNF-5, RNF-8, RNF-9
  - Hecho cuando: `app/ui/reports/report-states.tsx` presenta estados carga/vacío/error/acceso denegado/resultado con indicadores y mensajes verificables (incl. vacío alumnos y error con acción de reintento) anunciables accesiblemente; `app/ui/reports/report-preview-shell.tsx` aplica altura objetivo 60 % del área de contenido del módulo, altura mínima 20 rem y altura máxima acotada para mantener alcanzables filtros (arriba) y descarga (abajo) mediante scroll externo, con scroll interno vertical y horizontal y nombre/etiqueta accesible del área.

- [x] **T13. Crear control de descarga que reutiliza el artefacto vigente.** RF-27, RF-28, RF-29, RF-30, RF-34, RF-35, RF-36, RF-38, RF-42, RF-43, RNF-3, RNF-7
  - Hecho cuando: el componente de descarga (p. ej. `app/ui/reports/download-button.tsx`) se muestra debajo de la preview solo cuando existe artefacto descargable según reglas (incl. vacío/sin registros y fallo de visualización con artefacto válido > 0 kB), inicia descarga reutilizando el artefacto en cliente, evita repeticiones durante la operación; en fallo de descarga ofrece reintento que repite la entrega del mismo artefacto vigente cuando existe y es válido (o la generación aplicable si no) y conserva preview/filtros/mensajes tras éxito o error.

- [x] **T14. Crear controles de filtros de alumnos inscriptos (R1).** RF-11, RF-12, RF-13, RF-14, RF-15, RF-17, RF-18, RNF-2, RNF-3, RNF-8
  - Hecho cuando: `app/ui/reports/enrolled-students-filters.tsx` renderiza filtros año lectivo (según años disponibles permitidos), año de estudio (1–6), turno (Mañana/Tarde/Noche) y especialidad (Básica/Informática/Electrónica) con opción «Todos/Todas»; muestra mensaje informativo «No hay opciones disponibles para este criterio.» cuando no hay opciones específicas (sin bloquear, con «Todos/Todas»); muestra error asociado y bloquea aplicación cuando un criterio es inválido/no determinable; el botón de búsqueda/generación se deshabilita con criterio inválido/no determinable o generación en curso y se habilita con criterios válidos; incluye «Limpiar filtros» (restablece a «Todos/Todas» sin auto-generar) con etiquetas accesibles.

- [x] **T15. Crear vista previa tabular del listado de alumnos inscriptos.** RF-20, RF-21, RF-22, RF-23, RF-24, RF-26, RNF-3, RNF-4, RNF-5, RNF-8, RNF-9
  - Hecho cuando: `app/ui/reports/enrolled-students-preview.tsx` muestra tabla con las 17 columnas en orden, hasta 20 filas en orden del servicio, celdas faltantes/vacías como `-`, mensaje de «descargar para ver más detalles» solo si >20, y estado vacío con encabezados + mensaje definido; se presenta dentro del contenedor con scroll interno V/H y sin zoom.

- [x] **T16. Implementar flujo cliente del reporte de alumnos (aplicar, generar, estados y reintento).** RF-11, RF-12, RF-14, RF-15, RF-16, RF-17, RF-18, RF-19, RF-24, RF-25, RF-27, RF-28, RF-29, RF-30, RF-39, RF-41, RF-42, RF-43, RF-44, RNF-2, RNF-3, RNF-5, RNF-7
  - Hecho cuando: `app/ui/reports/enrolled-students-report.tsx` permite aplicar filtros mediante botón de búsqueda/generación respetando R1 (no bloquea por ausencia de opciones específicas con «Todos/Todas»; bloquea por inválido/no determinable), muestra carga evitando interpretar datos previos como nuevos, conserva vigente ante filtros inválidos/no aplicados y ante limpiar entradas, genera preview+artefacto vigente (incl. vacío descargable), maneja errores/timeout con reintento que repite la misma generación con los mismos filtros aplicados vigentes conservando contexto, y mantiene preview/filtros/mensajes tras descarga; no ofrece descarga sin artefacto vigente.

- [x] **T17. Crear vista previa PDF del padrón con scroll y controles de zoom.** RF-32, RF-33, RF-36, RNF-3, RNF-4, RNF-8, RNF-9
  - Hecho cuando: `app/ui/reports/staff-pdf-preview.tsx` renderiza el artefacto PDF del padrón (documento con las 7 columnas del servicio en orden: Apellido, Nombre, Email, DNI, Rol, Fecha de alta, Última modificación) dentro del área acotada con scroll interno vertical y horizontal y controles de zoom (acercar, alejar, ajuste al ancho o a la página) operables por teclado; muestra el estado sin registros cuando aplique y, si falla la visualización con artefacto válido (> 0 kB), informa el problema manteniendo la posibilidad de descarga.

- [x] **T18. Implementar flujo cliente del reporte de padrón (auto-generación G1 y fallos).** RF-9, RF-31, RF-33, RF-34, RF-35, RF-36, RF-37, RF-38, RF-39, RF-41, RF-42, RF-43, RF-44, RNF-2, RNF-3, RNF-5, RNF-7
  - Hecho cuando: `app/ui/reports/staff-report.tsx` genera automáticamente preview/artefacto al seleccionar/entrar/volver al padrón (sin filtros); si la auto-generación falla o supera el tiempo de espera, muestra estado de error con reintento manual que repite la misma generación sin filtros (sin reintentos automáticos en bucle); maneja carga, resultado (incl. sin registros), error de artefacto inválido/0 kB (sin descarga) y fallo de visualización con artefacto válido (con descarga), y mantiene estado tras descarga conservando contexto.

- [x] **T19. Implementar orquestador de reportes y cableado final en la página.** RF-7, RF-8, RF-9, RF-10, RF-31, RF-43, RNF-1, RNF-2, RNF-3, RNF-4
  - Hecho cuando: `app/ui/reports/reports-view.tsx` muestra control segmentado para `ADMINISTRADOR` (alumnos/padrón) y acceso directo a alumnos para `ADMINISTRATIVO`, descarta estado/artefacto/mensajes al cambiar de reporte y reinicia al estado inicial al volver (auto-generación padrón con manejo G1 / aplicación de filtros alumnos), y `app/dashboard/reports/page.tsx` lo integra con datos/rol correctos; el flujo filtros → vista previa → descarga es utilizable y accesible.

## Verificación y cierre

- [x] **T20. Verificación integral, trazabilidad RF y calidad.** RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-18, RF-19, RF-20, RF-21, RF-22, RF-23, RF-24, RF-25, RF-26, RF-27, RF-28, RF-29, RF-30, RF-31, RF-32, RF-33, RF-34, RF-35, RF-36, RF-37, RF-38, RF-39, RF-40, RF-41, RF-42, RF-43, RF-44, RNF-1, RNF-2, RNF-3, RNF-4, RNF-5, RNF-6, RNF-7, RNF-8, RNF-9
  - Hecho cuando: `pnpm test`, `pnpm typecheck`, `pnpm lint` y `pnpm build` finalizan en verde; se verifica cobertura de los casos límite de la spec (vacío/≤20/>20, sin registros, accesos denegados, limpiar y filtros inválidos conservando vigente, «Todos/Todas» sin opciones específicas informativo/no bloqueante, criterio inválido/no determinable bloqueante, cambio de reporte con descarte y regreso con G1, fallo de visualización con artefacto válido, artefacto inválido/0 kB, timeout, reintentos con semántica definida, persistencia tras descarga, sesión vencida) y la matriz de trazabilidad RF-1..RF-44 queda satisfecha sin dependencias nuevas ni exposición de datos sensibles; se comprueba RNF-4 (320–1920 px, sin scroll horizontal de página, apilado en estrecho) y RNF-9 (60 %, mín. 20 rem, máx. alcanzable, scroll interno V/H) en los tamaños relevantes.
