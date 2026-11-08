# Spec 010 — Gestión de cursos

Estado: aprobada (revisión 2026-10-31)

## Contexto y objetivo

El área privada ya cuenta con sesión autenticada, dashboard y menú lateral por rol (specs 008 y 009). En la spec 009 la opción «Cursos» existe para `ADMINISTRATIVO` y `ADMINISTRADOR`, pero permanece no disponible con la etiqueta «Próximamente». El backend ya expone el módulo de cursos: listado paginado, detalle, inscripciones activas por curso, creación, edición, clonación individual y masiva, activación/desactivación y eliminación lógica.

Esta spec habilita el módulo de Gestión de cursos para que `ADMINISTRATIVO` (rol equivalente a «secretario») y `ADMINISTRADOR` consulten y administren la oferta académica desde el panel, con acciones reales y sin simular operaciones que todavía no existen.

Decisiones confirmadas:

- «Secretario» se interpreta como el rol `ADMINISTRATIVO`.
- Solo `ADMINISTRATIVO` y `ADMINISTRADOR` acceden al módulo. `TUTOR` conserva su menú sin «Cursos» y no accede por URL.
- Se implementan: listado con filtros y tarjetas, detalle con inscripciones activas, creación, edición, clonación individual y masiva, eliminación y activación/desactivación.
- «Generar reporte» (exportación o descarga) queda visible como acción no disponible, claramente identificada. El reporte general del encabezado y el reporte del curso en la fila son alcances distintos. La tabla de inscripciones activas del detalle sí usa los datos reales del reporte del backend.
- Filtros y paginación se resuelven sobre el conjunto completo de cursos obtenido del backend, porque el listado no admite filtros de servidor. Las tarjetas de resumen se calculan sobre el conjunto filtrado.
- El año por defecto del filtro es el año actual si existe en el conjunto completo; si no existe, se selecciona «Todos los años».
- La clonación masiva elige un año de origen anterior al año actual y tiene como destino fijo el año actual. La clonación individual permite elegir el año de destino, por defecto el año actual.
- La clonación copia año de cursada, división, ciclo, especialidad, turno, capacidad máxima y estado. Nunca copia inscripciones, identificador ni código, e inicia la capacidad actual en cero.
- La edición es una actualización parcial de los campos configurables; nunca modifica el identificador ni la capacidad actual. El cliente nunca envía el código: el backend lo genera y lo recalcula cuando cambia la combinación académica. El estado se cambia con «Activar» o «Desactivar».
- Los cursos con año anterior al año actual son de solo lectura para sus campos editables: se pueden consultar, clonar y eliminar si no tienen inscriptos, pero no editar.
- «Desactivar» y «Eliminar» se ofrecen solo cuando la capacidad actual es cero. Con capacidad ocupada se muestran deshabilitados con motivo accesible.
- La eliminación es lógica: el curso deja de aparecer en las consultas normales. No existe borrado físico en esta spec.
- La reasignación de inscriptos a otro curso queda fuera de alcance y se planifica en una spec futura.
- Las métricas no se inventan: se derivan de datos reales o se muestran como no disponibles.
- El cierre de sesión sigue siendo local: el backend no revoca el JWT antes de su vencimiento y la falta de revocación no altera el comportamiento del módulo.
- El listado no muestra la columna «Código»; el código se conserva en detalle, diálogos y edición.
- El listado permite seleccionar uno o varios cursos con casillas; «Enviar notificación» queda no disponible con «Próximamente».
- La selección se conserva por identificador al paginar o filtrar y no se persiste entre recargas.
- Los avisos de éxito se ocultan a los 4 segundos; los errores permanecen hasta cierre manual.
- El menú de acciones se muestra fuera del contenedor de la tabla, sin recortes.
- El footer institucional se muestra en las páginas públicas; no aparece en el panel privado.
- Se corrige la autorización de roles del backend para que `ADMINISTRADOR` acceda al módulo.

## Usuarios

- Personas con rol `ADMINISTRATIVO` (secretario).
- Personas con rol `ADMINISTRADOR`.
- Personas no autenticadas o con sesión vencida que intentan acceder al módulo.
- Personas con rol `TUTOR`: sin acceso; su menú y sus rutas no se modifican.

## Historias de usuario

- HU-1. Como secretario o administrador, quiero ver la oferta académica completa para saber qué cursos están cargados.
- HU-2. Como secretario o administrador, quiero buscar y filtrar cursos para encontrar uno puntual sin recorrer toda la lista.
- HU-3. Como secretario o administrador, quiero ver cuántos cursos hay, cuáles están activos y cuánta capacidad suman para dimensionar la oferta.
- HU-4. Como secretario o administrador, quiero abrir el detalle de un curso para revisar sus datos y sus inscripciones activas.
- HU-5. Como secretario o administrador, quiero crear un curso nuevo para incorporarlo a la oferta del año.
- HU-6. Como secretario o administrador, quiero editar un curso existente para corregir su configuración sin recrearlo.
- HU-7. Como secretario o administrador, quiero clonar un curso a otro año para reutilizar su configuración sin cargarlo de nuevo.
- HU-8. Como secretario o administrador, quiero clonar todos los cursos de un año anterior al año actual para preparar la oferta siguiente.
- HU-9. Como secretario o administrador, quiero activar o desactivar un curso para controlar si se ofrece.
- HU-10. Como secretario o administrador, quiero eliminar un curso sin inscriptos para depurar la oferta.
- HU-11. Como persona que opera el sistema, quiero que las acciones no disponibles estén marcadas y no simulen éxito, para no confiar en operaciones que no ocurrieron.
- HU-12. Como persona que usa lector de pantalla o teclado, quiero operar listado, filtros, acciones, diálogos, formularios y detalle con acceso completo.
- HU-13. Como persona que usa el teléfono, quiero consultar y administrar cursos sin desbordes ni controles inalcanzables.

## Definiciones

- **Curso**: unidad de oferta académica identificada por un `id` UUID interno y un `code` legible generado por el servidor.
- **Código del curso**: texto legible con formato `{year}-{studyYear}-{division}-{cicloAbrev}-{especialidadAbrev}-{turnoAbrev}`; por ejemplo `2026-1-1-BAS-INF-M`. Lo genera y recalcula el backend cuando cambia la combinación académica; el cliente no lo envía ni lo edita.
- **Código ausente**: respuesta sin `code` o con `code` vacío; se muestra «Sin código» y la fila sigue operable.
- **Año académico**: año lectivo del curso (`year`). En creación y al cambiar el año debe ser el año actual o uno futuro. Un curso existente con año anterior al actual conserva su año y es de solo lectura para sus campos editables.
- **Año de cursada**: año dentro de la carrera (`studyYear`), de `1` a `6`.
- **División**: división del curso (`division`), texto recortado de 1 a 10 caracteres; no se admite solo espacios.
- **Ciclo**: `basic` o `superior`.
- **Especialidad**: `basic`, `informatics` o `electronics`.
- **Turno**: `morning`, `afternoon` o `night`.
- **Estado del curso**: `active` o `inactive`.
- **Capacidad máxima**: cupo máximo del curso (`maxCapacity`), entero mayor que cero.
- **Capacidad actual**: cantidad de inscriptos (`currentCapacity`), entero mayor o igual a cero.
- **Cupos disponibles**: `maxCapacity - currentCapacity`, informado por el backend (`availablePlaces`). Si el backend no lo informa, se deriva de ambos valores; si el resultado es negativo, se muestra «No disponible».
- **Curso activo**: curso con estado `active`.
- **Curso sin alumnos**: curso con capacidad actual igual a cero.
- **Curso de año pasado**: curso con año académico anterior al año actual. Es de solo lectura para sus campos editables.
- **Año actual**: año calendario vigente al momento de la operación; lo calcula el servidor en cada solicitud.
- **Inscripción activa**: registro incluido por el backend en el reporte del curso.
- **Edición de curso**: actualización parcial de año académico, año de cursada, división, ciclo, especialidad, turno y capacidad máxima. Nunca modifica el identificador ni la capacidad actual; el estado se cambia con «Activar» o «Desactivar». Puede generar un código nuevo si cambia la combinación académica.
- **Clonación individual**: copia de un curso a un año destino elegido, con código nuevo, sin inscripciones y con capacidad actual en cero. Copia año de cursada, división, ciclo, especialidad, turno, capacidad máxima y estado.
- **Clonación masiva**: copia de todos los cursos de un año de origen anterior al año actual al año actual, con las mismas reglas de contenido que la clonación individual.
- **Eliminación de curso**: eliminación lógica; el curso deja de aparecer en las consultas normales. Solo se permite cuando la capacidad actual es cero. No se borra físicamente.
- **Reasignación de inscriptos**: capacidad fuera de alcance de esta spec; requiere un endpoint del backend que no está disponible.
- **Acción no disponible**: acción sin lógica implementada; se muestra marcada y no produce efectos.
- **Conjunto filtrado**: subconjunto de cursos que cumple todos los filtros activos.
- **Conjunto completo**: todos los cursos obtenidos del backend, sin filtros.
- **Selección de cursos**: conjunto de cursos marcados por la persona en el listado; no implica el envío de una notificación mientras esa acción siga no disponible.
- **Página válida**: página entre `1` y la última página del conjunto filtrado. Si la URL indica una página fuera de rango, se ajusta a la última válida.

### Correspondencia de campos y valores

| Campo del backend | Etiqueta en la interfaz | Valores visibles |
|---|---|---|
| `code` | Código | El código legible del curso o «Sin código» |
| `year` | Año académico | Número de cuatro dígitos |
| `studyYear` | Año de cursada | `1` a `6` |
| `division` | División | Texto del backend |
| `cycle` | Ciclo | `basic` → «Básico»; `superior` → «Superior» |
| `speciality` | Especialidad | `basic` → «Básica»; `informatics` → «Informática»; `electronics` → «Electrónica» |
| `shift` | Turno | `morning` → «Mañana»; `afternoon` → «Tarde»; `night` → «Noche» |
| `status` | Estado | `active` → «Activo»; `inactive` → «Inactivo» |
| `maxCapacity` | Capacidad máxima | Entero mayor que cero |
| `currentCapacity` | Capacidad actual | Entero mayor o igual a cero |
| `availablePlaces` | Cupos disponibles | Entero mayor o igual a cero o «No disponible» |

### Reglas de filtros, orden, URL y métricas

- El filtro de año académico ofrece «Todos los años» y cada año presente en el conjunto completo, ordenados de forma descendente. Por defecto se selecciona el año actual si está presente; si no, «Todos los años».
- Los filtros de ciclo, especialidad y turno ofrecen «Todas» y las opciones del contrato.
- La búsqueda recorta, colapsa espacios internos, ignora mayúsculas, minúsculas y acentos. Compara el código y el texto legible del curso (año, año de cursada, división, ciclo, especialidad, turno y estado).
- Una búsqueda vacía o compuesta solo por espacios equivale a sin búsqueda.
- Los filtros se combinan entre sí; un curso debe cumplirlos todos para mostrarse.
- El orden es: año académico descendente; dentro de cada año, año de cursada ascendente; división ascendente; turno en el orden «Mañana», «Tarde», «Noche»; ciclo en el orden «Básico», «Superior»; especialidad en el orden «Básica», «Informática», «Electrónica»; desempate final por identificador ascendente.
- La división se compara numéricamente cuando ambos valores son enteros y alfabéticamente en caso contrario. Si «01» y «1» empatan numéricamente, se desempata por identificador.
- Los valores desconocidos de turno, ciclo, especialidad o estado se ordenan al final y se muestran como «No disponible».
- El total de cursos, los cursos activos y la capacidad total se calculan sobre el conjunto filtrado. La capacidad total es la suma de `maxCapacity`.
- La paginación muestra 10 cursos por página y se aplica al conjunto filtrado ya ordenado.
- La URL refleja búsqueda, año, ciclo, especialidad, turno y página. Los parámetros inválidos o desconocidos se ignoran y vuelven al valor por defecto.
- Cambiar cualquier filtro vuelve a la página 1. Después de una operación exitosa se conservan los filtros y la página se conserva salvo que quede fuera de rango, en cuyo caso se ajusta a la última válida.
- El total de inscripciones del detalle proviene de `header.totalInscriptions` del reporte del backend.

### Reglas de edición y años

- Solo se pueden editar cursos con año académico actual o futuro.
- Un curso con año anterior al actual se puede consultar, clonar y eliminar si no tiene inscriptos, pero no editar.
- No se permite crear un curso en un año pasado ni cambiar un curso a un año pasado.
- Si el año calendario cambia mientras un formulario está abierto, el servidor revalida el año actual al recibir la solicitud.

### Reglas de clonación

- La clonación individual permite elegir como año de destino el año actual o uno futuro.
- La clonación masiva solo permite elegir como año de origen un año anterior al año actual presente en el conjunto completo.
- La clonación copia año de cursada, división, ciclo, especialidad, turno, capacidad máxima y estado.
- La clonación no copia identificador, código ni inscripciones; la capacidad actual inicia en cero.
- La cantidad de cursos intentados en la clonación masiva es la cantidad de cursos del año de origen en el conjunto completo. La cantidad creada proviene de `cloned` en la respuesta del backend.
- Los cursos cuya combinación ya existe en el año destino son rechazados u omitidos por el backend según corresponda; la interfaz no inventa duplicados ni motivos no informados.

### Reglas de eliminación

- Con capacidad actual mayor que cero, «Desactivar» y «Eliminar» se muestran deshabilitados con motivo accesible.
- Con capacidad actual igual a cero, «Eliminar» se habilita y ejecuta una eliminación lógica.
- La regla aplica a cualquier curso, sin importar si fue creado desde este módulo.
- Si el backend rechaza una eliminación con `422` por inscripciones activas, se muestra un mensaje en español y se conserva el curso.
- Un curso con capacidad actual cero puede tener solicitudes pendientes que el frontend no puede ver; la respuesta del backend sigue siendo autoritativa.

## Requisitos funcionales

### Acceso y navegación

- RF-1. EL SISTEMA habilita la opción «Cursos» del menú lateral para `ADMINISTRATIVO` y `ADMINISTRADOR`, y la muestra activa en el listado, el detalle, la creación y la edición del módulo.
- RF-2. EL SISTEMA no incorpora «Cursos» al menú de `TUTOR` ni modifica las opciones de su rol.
- RF-3. CUANDO una persona con rol autorizado activa «Cursos», EL SISTEMA la lleva a la página de Gestión de cursos.
- RF-4. SI una persona con rol no autorizado intenta acceder por URL a una página del módulo, ENTONCES EL SISTEMA muestra acceso denegado sin exponer datos de cursos y sin alterar la sesión.
- RF-5. SI la sesión no es válida o venció, ENTONCES EL SISTEMA aplica el comportamiento de sesión vencida de la spec 008.
- RF-6. EL SISTEMA muestra las páginas del módulo dentro del armazón privado con el menú lateral y los datos de cuenta, sin la barra pública.
- RF-7. EL SISTEMA identifica el listado, el detalle, la creación y la edición con el título de documento propio definido en la tabla de mensajes.

### Encabezado y acciones generales

- RF-8. EL SISTEMA muestra en la página de gestión el breadcrumb «Inicio > Cursos», con «Inicio» enlazado al dashboard y «Cursos» como texto no enlazado de la página actual.
- RF-9. EL SISTEMA muestra el título «Gestión de cursos» y la descripción «Administrá la oferta académica de la institución».
- RF-10. EL SISTEMA muestra las acciones «Crear curso», «Clonar cursos» y «Generar reporte» en el encabezado de la página de gestión.
- RF-11. CUANDO la persona activa «Crear curso», EL SISTEMA abre el formulario de creación de curso.
- RF-12. CUANDO la persona activa «Clonar cursos», EL SISTEMA abre el diálogo de clonación masiva por año.
- RF-13. EL SISTEMA muestra «Generar reporte» del encabezado como acción no disponible, identificada con «Próximamente», sin descargar archivos ni simular éxito. Esta acción representa el reporte general de la oferta.

### Tarjetas de resumen

- RF-14. EL SISTEMA muestra cuatro tarjetas de resumen: total de cursos, año académico seleccionado, cursos activos y capacidad total.
- RF-15. EL SISTEMA calcula el total de cursos, los cursos activos y la capacidad total sobre el conjunto filtrado, sin estimaciones ni datos de ejemplo.
- RF-16. EL SISTEMA muestra en la tarjeta de año académico el año del filtro activo o «Todos los años» cuando el filtro abarca todos los años.
- RF-17. MIENTRAS los cursos se cargan, EL SISTEMA muestra las tarjetas en estado de carga sin cifras provisionales.
- RF-18. SI la carga de cursos falla, ENTONCES EL SISTEMA muestra las tarjetas como no disponibles, sin cifras inventadas.

### Filtros

- RF-19. EL SISTEMA ofrece un buscador por código o texto legible del curso.
- RF-20. EL SISTEMA ofrece los filtros de año académico, ciclo, especialidad y turno con las opciones definidas en las reglas de filtros.
- RF-21. MIENTRAS la persona escribe o cambia un filtro, EL SISTEMA actualiza tarjetas, tabla y paginación sin recargar la página ni volver a solicitar los datos. La carga inicial ya contiene el conjunto completo.
- RF-22. EL SISTEMA aplica los filtros de forma combinada y descarta los cursos que no cumplan todos.
- RF-23. EL SISTEMA vuelve a la primera página cuando cambia cualquier filtro.
- RF-24. CUANDO la persona activa «Limpiar filtros», EL SISTEMA restablece la búsqueda vacía, el año académico al año actual si está presente o «Todos los años» si no lo está, ciclo, especialidad y turno a «Todas», y vuelve a la primera página.
- RF-25. EL SISTEMA refleja los filtros y la página en la URL, ignora los valores inválidos y los restaura al recargar o al volver desde el detalle.
- RF-26. SI el conjunto filtrado no tiene resultados, ENTONCES EL SISTEMA muestra un estado vacío con mensaje y acción para limpiar filtros; las tarjetas numéricas muestran cero y la tarjeta de año muestra el filtro activo.

### Tabla de cursos

- RF-27. EL SISTEMA muestra en el listado las columnas «Selección», «Año académico», «Año de cursada», «División», «Ciclo», «Especialidad», «Turno», «Estado» y «Acciones», y no muestra la columna «Código».
- RF-28. EL SISTEMA traduce los valores del backend según la correspondencia de campos y valores; nunca muestra los valores internos en inglés.
- RF-29. EL SISTEMA ordena el listado según las reglas de orden definidas.
- RF-30. EL SISTEMA muestra el estado con texto e indicador visual, de modo que no dependa solo del color.
- RF-31. EL SISTEMA pagina el conjunto filtrado en páginas de 10 cursos y muestra la página actual, el total del conjunto filtrado y controles accesibles de página anterior y siguiente.
- RF-32. MIENTRAS los cursos se cargan, EL SISTEMA muestra un esqueleto de tabla accesible sin filas ficticias.
- RF-33. SI no existen cursos en el conjunto completo, ENTONCES EL SISTEMA muestra un estado vacío con mensaje y acción para crear el primer curso.
- RF-34. SI la carga falla por red, timeout, `401`, `403` o `5xx`, ENTONCES EL SISTEMA muestra un error con mensaje y acción «Reintentar»; con `401` aplica sesión vencida, con `403` acceso denegado y nunca presenta datos parciales como definitivos. Si la carga multipágina supera el tope de 100 páginas de 100 cursos, muestra un error controlado sin datos parciales.
- RF-35. EL SISTEMA identifica cada fila por su identificador interno y expone como nombre accesible la descripción visible del curso, sin incluir el código. El código no se usa como identidad de fila.

### Menú de acciones por fila

- RF-36. EL SISTEMA ofrece por fila las acciones «Ver detalles», «Editar», «Clonar», «Generar reporte», «Activar» o «Desactivar» según el estado, y «Eliminar». «Eliminar» y «Desactivar» se muestran deshabilitados cuando la capacidad actual es mayor que cero. «Editar» se muestra deshabilitado en cursos de años pasados. La acción «Generar reporte» de la fila representa el reporte del curso, distinto del reporte general del encabezado.
- RF-37. EL SISTEMA abre el menú de acciones con puntero, Enter, Espacio o flecha abajo; coloca el foco en la primera acción; navega con flechas, Inicio y Fin; lo cierra con Escape o Tab; y devuelve el foco al disparador.
- RF-38. EL SISTEMA muestra «Generar reporte» como acción no disponible con «Próximamente», enfocable y anunciada como no disponible, sin ejecutar efectos. El nombre accesible distingue «Generar reporte general» de «Generar reporte del curso».
- RF-39. CUANDO la persona activa «Ver detalles», EL SISTEMA navega al detalle del curso seleccionado.
- RF-40. CUANDO la persona activa «Clonar», EL SISTEMA abre el diálogo de clonación individual del curso.
- RF-41. CUANDO la persona activa «Eliminar» sobre un curso habilitado, EL SISTEMA abre un diálogo de confirmación con el código del curso o «Sin código» y la consecuencia de la eliminación lógica.
- RF-42. CUANDO la persona activa «Desactivar» sobre un curso habilitado, EL SISTEMA abre una confirmación y, al confirmar, solicita la desactivación del curso.
- RF-43. CUANDO la persona activa «Activar», EL SISTEMA solicita la activación del curso e informa el resultado, sin confirmación adicional.
- RF-44. SI el backend rechaza la desactivación porque el curso tiene capacidad ocupada, ENTONCES EL SISTEMA muestra un error genérico en español y conserva el estado mostrado sin asumir éxito.
- RF-45. SI la eliminación devuelve `422` por inscripciones activas, ENTONCES EL SISTEMA muestra un mensaje en español y conserva el curso en la lista.
- RF-46. CUANDO la eliminación devuelve `204`, EL SISTEMA cierra el diálogo, anuncia el éxito, actualiza el listado y ajusta la página si quedó fuera de rango. La eliminación es lógica.
- RF-47. MIENTRAS una acción de fila está en curso, EL SISTEMA muestra progreso, bloquea esa acción y descarta activaciones repetidas.
- RF-48. EL SISTEMA actualiza el listado después de cada operación exitosa sin perder los filtros; conserva la página salvo que quede fuera de rango.

### Página de detalle del curso

- RF-49. CUANDO la persona accede al detalle, EL SISTEMA muestra el breadcrumb «Inicio > Cursos > Detalles», con «Inicio» y «Cursos» enlazados y «Detalles» como texto de la página actual.
- RF-50. EL SISTEMA muestra la identificación del curso (código o «Sin código»), año académico, año de cursada, división, ciclo, especialidad, turno, capacidad máxima, capacidad actual, cupos disponibles y estado.
- RF-51. EL SISTEMA muestra la acción «Volver a cursos», que regresa a la gestión conservando los filtros y la página previos cuando el parámetro de regreso es válido; si no existe, vuelve a la gestión con los valores por defecto.
- RF-52. EL SISTEMA muestra la acción «Editar» en el detalle y abre el mismo formulario de edición del curso. En cursos de años pasados, «Editar» se muestra deshabilitado con motivo accesible.
- RF-53. SI el curso no existe o fue eliminado, ENTONCES EL SISTEMA muestra no encontrado con enlace a la gestión, conserva el menú lateral y usa el regreso válido si existe.
- RF-54. SI el acceso al detalle no está autorizado, ENTONCES EL SISTEMA muestra acceso denegado.
- RF-55. MIENTRAS el detalle se carga, EL SISTEMA muestra un esqueleto; si la carga falla, muestra un error con «Reintentar».

### Alumnos e inscripciones del curso

- RF-56. EL SISTEMA muestra en el detalle una sección «Inscripciones activas» con el total informado por el backend en `header.totalInscriptions`; si el backend no lo informa, muestra «No disponible» y conserva las filas recibidas.
- RF-57. EL SISTEMA muestra en esa tabla las columnas «N.º de orden», «Alumno», «DNI», «Teléfono» y «Correo», únicos datos disponibles del backend. El número de orden es secuencial en la tabla y el alumno se muestra como «Apellido, Nombre».
- RF-58. EL SISTEMA muestra solo las inscripciones del curso consultado y no mezcla alumnos de otros cursos.
- RF-59. EL SISTEMA informa que el listado contiene solo inscripciones activas y que el backend no expone fecha de solicitud, estado por alumno ni consulta de detalle del alumno.
- RF-60. EL SISTEMA no presenta acciones de detalle del alumno ni columnas de fecha o estado cuando el backend no las provee.
- RF-61. EL SISTEMA no cuenta solicitudes pendientes como vacantes ocupadas; los cupos disponibles provienen del backend o se derivan de sus campos, nunca de solicitudes pendientes.
- RF-62. SI no hay inscripciones activas, ENTONCES EL SISTEMA muestra un estado vacío con total cero.
- RF-63. SI la consulta de inscripciones falla por red, timeout o `5xx`, ENTONCES EL SISTEMA muestra el error solo en esa sección, conserva los datos del curso ya visibles y permite reintentar. Con `401` aplica sesión vencida, con `403` acceso denegado y con `404` curso inexistente.

### Creación de curso

- RF-64. CUANDO la persona activa «Crear curso», EL SISTEMA muestra un formulario con año académico, año de cursada, división, ciclo, especialidad, turno y capacidad máxima, y las acciones «Cancelar» y «Crear curso». Los valores iniciales son: año actual, año de cursada 1, división vacía, ciclo básico, especialidad básica, turno mañana y capacidad máxima vacía.
- RF-65. EL SISTEMA valida que el año académico sea el actual o futuro, que el año de cursada esté entre 1 y 6, que la división recortada tenga entre 1 y 10 caracteres y no sea solo espacios, que ciclo, especialidad y turno pertenezcan al contrato y que la capacidad máxima sea un entero mayor que cero.
- RF-66. SI hay errores de validación local, ENTONCES EL SISTEMA no envía la solicitud, muestra el error junto a cada campo y conserva los valores ingresados.
- RF-67. MIENTRAS el envío está en curso, EL SISTEMA muestra un indicador, deshabilita «Crear curso» y descarta activaciones repetidas.
- RF-68. SI el backend responde `201`, ENTONCES EL SISTEMA cierra el formulario, anuncia el éxito con el código del curso creado o «Sin código» si no lo recibe, y actualiza el listado.
- RF-69. SI el backend responde `422`, ENTONCES EL SISTEMA muestra los errores traducidos junto a los campos correspondientes, conserva los valores y no asume éxito.
- RF-70. SI el backend responde `401`, `403`, `5xx`, error de red o timeout, ENTONCES EL SISTEMA aplica la regla de errores y sesión definida y no modifica el listado.
- RF-71. CUANDO la persona activa «Cancelar» o cierra el formulario, EL SISTEMA no envía datos y conserva los filtros y la página de la lista.
- RF-72. SI la combinación de año, año de cursada, división, ciclo, turno y especialidad ya existe, ENTONCES EL SISTEMA muestra el rechazo del backend y no duplica el curso localmente.

### Clonación individual

- RF-73. CUANDO la persona activa «Clonar» en una fila, EL SISTEMA muestra un diálogo con el código del curso de origen o «Sin código», el año de destino (por defecto el año actual) y las consecuencias: código nuevo, sin inscripciones, capacidad actual en cero, y conservación de capacidad máxima y estado.
- RF-74. EL SISTEMA permite elegir como año de destino el año actual o uno futuro.
- RF-75. SI el año de destino genera una combinación ya existente, ENTONCES EL SISTEMA muestra el rechazo del backend y no crea duplicados.
- RF-76. CUANDO la clonación responde `201`, EL SISTEMA cierra el diálogo, anuncia el éxito con el nuevo código o «Sin código» si no lo recibe, y actualiza el listado.
- RF-77. MIENTRAS la clonación está en curso, EL SISTEMA bloquea un segundo envío.

### Clonación masiva por año

- RF-78. CUANDO la persona activa «Clonar cursos», EL SISTEMA muestra un diálogo para elegir el año de origen entre los años anteriores al año actual presentes en el conjunto completo.
- RF-79. EL SISTEMA informa en el diálogo que el destino es el año actual, que no se copian inscripciones, que la capacidad actual inicia en cero, que se conservan capacidad máxima y estado, y cuántos cursos del año de origen se intentarán copiar.
- RF-80. SI no hay años de origen disponibles, ENTONCES EL SISTEMA lo informa en el diálogo y no permite confirmar.
- RF-81. CUANDO la persona confirma, EL SISTEMA solicita la clonación masiva del año elegido y muestra la cantidad de cursos creados y el listado devuelto por el backend.
- RF-82. SI el backend informa cero cursos clonados, ENTONCES EL SISTEMA comunica «No se creó ningún curso nuevo.» y no inventa un motivo.
- RF-83. SI la clonación masiva falla, ENTONCES EL SISTEMA muestra el error, refresca el listado para reflejar el estado real del backend y no anuncia éxito.
- RF-84. MIENTRAS la clonación masiva está en curso, EL SISTEMA bloquea un segundo envío.

### Acciones no disponibles y datos

- RF-85. EL SISTEMA muestra cualquier acción no implementada con la etiqueta «Próximamente», la anuncia como no disponible, permite enfocarla y no ejecuta efectos.
- RF-86. EL SISTEMA no muestra cursos ficticios, datos de ejemplo ni métricas inventadas en ninguna pantalla.
- RF-87. EL SISTEMA trata la autorización del backend como definitiva: ante `403`, muestra acceso denegado aunque la acción estuviera visible.
- RF-88. EL SISTEMA anuncia el resultado de cada operación con un mensaje accesible. Los errores permanecen hasta que la persona los cierre o cambie de ruta; cambiar filtros o página no los borra.

### Edición de curso

- RF-89. CUANDO la persona activa «Editar» desde una fila o desde el detalle de un curso editable, EL SISTEMA abre un formulario de edición precargado con los valores actuales del curso.
- RF-90. EL SISTEMA permite modificar año académico, año de cursada, división, ciclo, especialidad, turno y capacidad máxima; el estado se modifica únicamente con «Activar» o «Desactivar».
- RF-91. EL SISTEMA muestra el código, la capacidad actual y los cupos disponibles como datos no editables.
- RF-92. EL SISTEMA valida que el año académico sea el actual o futuro, que el año de cursada esté entre 1 y 6, que la división recortada tenga entre 1 y 10 caracteres y no sea solo espacios, que ciclo, especialidad y turno pertenezcan al contrato y que la capacidad máxima sea un entero mayor que cero y no menor que la capacidad actual.
- RF-93. SI hay errores de validación local, ENTONCES EL SISTEMA no envía la solicitud, muestra el error junto a cada campo y conserva los valores ingresados.
- RF-94. MIENTRAS el envío está en curso, EL SISTEMA muestra un indicador, deshabilita «Guardar cambios» y descarta activaciones repetidas.
- RF-95. SI el backend responde `200`, ENTONCES EL SISTEMA cierra el formulario, anuncia «Curso actualizado correctamente: {código}.» con el código devuelto o «Sin código» si no lo recibe, actualiza el listado y, si el detalle está abierto, refleja los datos devueltos, incluido un posible código nuevo.
- RF-96. SI el backend responde `422`, ENTONCES EL SISTEMA muestra los errores traducidos junto a los campos correspondientes, conserva los valores y no asume éxito.
- RF-97. SI el backend responde `404` porque el curso ya no existe, ENTONCES EL SISTEMA informa que el curso no existe, cierra el formulario y actualiza el listado o muestra no encontrado en el detalle.
- RF-98. SI el backend responde `401`, `403`, `5xx`, error de red o timeout, ENTONCES EL SISTEMA aplica la regla de errores y sesión definida y no modifica los datos mostrados.
- RF-99. CUANDO la persona activa «Cancelar» o cierra el formulario de edición, EL SISTEMA no envía datos y conserva los filtros y la página de la lista.
- RF-100. SI la combinación editada de año, año de cursada, división, ciclo, turno y especialidad ya existe, ENTONCES EL SISTEMA muestra el rechazo del backend y no duplica el curso.
- RF-101. EL SISTEMA no presenta como exitosa una edición sin confirmación del backend ni actualiza los datos locales antes de recibir la respuesta.

### Requisitos adicionales de la revisión QA

- RF-102. EL SISTEMA muestra «Eliminar» deshabilitado con motivo accesible cuando la capacidad actual es mayor que cero, y lo habilita cuando es cero.
- RF-103. EL SISTEMA no ofrece reasignación de inscriptos entre cursos en esta spec.
- RF-104. EL SISTEMA muestra breadcrumb, metadata, estado de carga y límite de error propios en cada ruta del módulo.
- RF-105. MIENTRAS el reporte de inscripciones se carga, EL SISTEMA muestra un esqueleto solo en esa sección, aunque el curso ya esté visible.
- RF-106. CUANDO se elimina un curso con capacidad actual cero y el backend responde `204`, EL SISTEMA ejecuta la eliminación lógica, lo quita de las consultas normales y lo elimina del listado visible.

### Selección de cursos y ajustes de interfaz (revisión 2026-10-31)

- RF-107. EL SISTEMA muestra en cada fila del listado una casilla de selección y en el encabezado una casilla para seleccionar todos los cursos del conjunto filtrado, no solo los de la página visible.
- RF-108. MIENTRAS hay al menos un curso seleccionado, EL SISTEMA muestra la cantidad seleccionada, «Limpiar selección» y «Enviar notificación» con la etiqueta «Próximamente», enfocable, anunciada como no disponible y sin ejecutar efectos.
- RF-109. CUANDO la persona cambia de página o de filtros, EL SISTEMA conserva los cursos seleccionados por identificador y descarta los que ya no existen.
- RF-110. CUANDO la persona abre el menú de acciones de una fila, EL SISTEMA lo muestra fuera del contenedor de la tabla, completamente visible y sin recortes, y lo reposiciona para permanecer dentro del viewport.
- RF-111. EL SISTEMA muestra el footer institucional en las páginas públicas y no lo muestra en el panel privado, para cualquiera de los tres roles.
- RF-112. CUANDO una persona con rol `ADMINISTRADOR` o `ADMINISTRATIVO` accede al módulo, EL SISTEMA muestra el listado sin presentar acceso denegado.
- RF-113. CUANDO se muestra un aviso de éxito, EL SISTEMA lo oculta automáticamente a los 4 segundos, salvo que la persona interactúe con él, y elimina el parámetro correspondiente de la URL.

## Requisitos no funcionales

- RNF-1. Accesibilidad: listado, selección, filtros, paginación, menús de acciones, diálogos, formularios y detalle se operan con teclado; los controles tienen nombre accesible en español, foco visible y las teclas definidas para menús y diálogos.
- RNF-2. Las tablas usan encabezados de columna y un título descriptivo; cada cambio de página o de filtros se anuncia en una región viva con «Página X de Y, N resultados».
- RNF-3. Contraste de al menos 4.5:1 para texto y 3:1 para indicadores de estado, bordes y foco.
- RNF-4. El estado no depende solo del color: siempre hay texto y forma.
- RNF-5. Responsive entre 320 y 1920 px sin desbordamiento horizontal de página ni solapamientos; el menú de acciones se muestra fuera del contenedor de la tabla y permanece dentro del viewport; en pantallas angostas la tabla desplaza su contenido dentro de su contenedor.
- RNF-6. Todo texto visible, incluidas ayudas y metadatos, tiene al menos 14 px; no hay textos esenciales más pequeños y la jerarquía de títulos es correcta.
- RNF-7. Con el texto del navegador al 200 % no se pierde contenido ni aparece scroll horizontal de página.
- RNF-8. Estilo consistente con el sistema de diseño institucional: sin bordes negros puros de más de 1 px, sombras con opacidad máxima del 12 %, máximo tres colores de acento, sin bloques duplicados y una acción por contexto salvo las excepciones documentadas.
- RNF-9. Las solicitudes muestran un indicador de progreso en menos de 100 ms y tienen un tiempo máximo de espera de 10 segundos.
- RNF-10. Los datos del módulo no se sirven desde una caché compartida entre usuarios: se usan respuestas `no-store`, sin ISR, y cada sesión solicita sus datos.
- RNF-11. El token de sesión no se expone en HTML, URL, almacenamiento del navegador ni mensajes de error.
- RNF-12. El módulo se resuelve sin dependencias externas nuevas. Se permite la corrección de autorización de roles del backend necesaria para que `ADMINISTRADOR` acceda al módulo.
- RNF-13. Cada ruta del módulo tiene metadata propia, breadcrumb, límites de carga y error por segmento.
- RNF-14. Los diálogos atrapan el foco, cierran con Escape cuando no hay una operación en curso y devuelven el foco al disparador.
- RNF-15. Las animaciones se reducen o eliminan cuando el sistema lo solicita.
- RNF-16. Ninguna operación se marca como exitosa sin confirmación del backend; el estado local solo refleja respuestas exitosas.
- RNF-17. Los errores de validación conocidos del backend se muestran en español junto a su campo. En formularios se considera conocido un `422` con `errors` indexado por los siete campos; en eliminación, un `422` de negocio se muestra con el mensaje fijo en español definido. Los desconocidos se muestran en un aviso general y nunca se muestra el texto crudo del backend.
- RNF-18. La privacidad de los alumnos se limita a los campos que el backend entrega; no se infieren ni se muestran datos adicionales.
- RNF-19. La interfaz mantiene un único botón por acción y contexto. Se admiten estas excepciones: «Crear curso» en el encabezado y en el estado vacío; «Editar» en la fila y en el detalle del mismo curso; «Generar reporte» general en el encabezado y «Generar reporte» del curso en la fila. No se repite la misma acción dentro de una misma pantalla.
- RNF-20. Con hasta 10 000 cursos simulados, la carga completa se resuelve en menos de 10 segundos o muestra un error controlado sin datos parciales. Si se supera el tope de carga, el sistema no muestra métricas parciales.
- RNF-21. Los textos visibles están en español.
- RNF-22. Con colores forzados se conservan foco visible e indicadores de estado.

## Casos límite

### Listado, filtros y URL

- Sin cursos en el sistema: estado vacío global con acción para crear.
- Con cursos solo del año actual: el filtro de año ofrece ese año y «Todos los años».
- Con cursos de varios años: el orden por año descendente se respeta.
- Año actual sin cursos: el filtro por defecto es «Todos los años».
- Filtro de año sin cursos: estado vacío con opción de limpiar filtros.
- Búsqueda vacía, con espacios o solo espacios: equivale a sin búsqueda.
- Búsqueda con mayúsculas, minúsculas o acentos: encuentra igual.
- Búsqueda por código parcial: encuentra el curso.
- Búsqueda sin coincidencias: estado vacío y tarjetas numéricas en cero.
- División con ceros iniciales o texto: se muestra y compara según las reglas.
- División «01» y «1»: empate numérico resuelto por identificador.
- Empate de orden por ciclo o especialidad: se desempata por ciclo, especialidad e identificador.
- Turno, ciclo, especialidad, estado o año inválidos: se muestran como «No disponible» o error controlado y se ordenan al final.
- Capacidad actual mayor que la máxima o capacidad negativa: dato inválido; se muestra «No disponible» en las capacidades afectadas sin romper la tabla.
- Suma de capacidades no representable: la tarjeta de capacidad total muestra «No disponible».
- Código ausente: se muestra «Sin código» y la fila sigue operable.
- Código duplicado en la respuesta: cada fila se identifica por su identificador interno.
- Más de 10 resultados: paginación correcta y sin pérdida de filtros.
- Cambio de filtro estando en una página posterior: vuelve a la primera.
- URL con filtros inválidos o página fuera de rango: se normaliza a los valores por defecto o a la última página válida.
- Eliminación o edición que reduce el total de páginas: la página se ajusta si quedó fuera de rango.
- Crear o clonar un curso fuera del filtro activo: la operación puede ser exitosa y el curso no aparece hasta limpiar filtros.
- Edición que saca al curso del filtro activo: los filtros se conservan y la página se ajusta si corresponde.
- Conjunto completo vacío con filtros activos: prevalece el estado vacío global con acción para crear.
- Selección de uno, varios o todos los cursos filtrados: la barra muestra la cantidad exacta.
- Selección con filtros o páginas distintas: se conservan los identificadores seleccionados.
- Curso seleccionado eliminado o ausente tras refrescar: se descarta de la selección.
- Sin cursos seleccionados: no se muestra la barra de selección.
- Menú abierto en la última fila o cerca del borde inferior: se muestra completo y sin recortes.

### Estado de los cursos y acciones

- Curso con capacidad actual mayor que cero: «Desactivar» y «Eliminar» deshabilitados con motivo; no se abre diálogo.
- Curso con capacidad actual igual a cero: «Eliminar» habilitado; confirmación y eliminación lógica.
- Curso creado y sin alumnos: misma regla de eliminación que cualquier curso con capacidad actual cero.
- Curso con capacidad actual cero y solicitudes pendientes no visibles: el frontend no puede detectarlo; responde el backend.
- Intento de eliminar un curso con inscriptos por otra vía: rechazo `422`, mensaje en español y curso conservado.
- Intento de desactivar un curso con capacidad ocupada: error genérico y estado conservado.
- Eliminación exitosa: el curso desaparece del listado y la página se ajusta si quedó vacía.
- Curso inactivo: se muestra como inactivo y la acción disponible es «Activar».
- Curso activo: la acción disponible es «Desactivar».
- Curso de año pasado: «Editar» deshabilitado con motivo; se puede consultar, clonar y eliminar si no tiene inscriptos.
- Doble activación de crear, editar, clonar, eliminar o activar/desactivar: una sola solicitud.
- Cierre de diálogo durante una operación en curso: bloqueado hasta recibir la respuesta.
- Curso eliminado entre la apertura de un diálogo y la confirmación: rechazo `404`, cierre y refresco.
- Curso eliminado mientras el detalle está abierto: no encontrado con enlace a la gestión.
- Curso eliminado por otra persona entre la carga y una acción: rechazo `404` y actualización del listado.
- Ediciones concurrentes: la última escritura confirmada por el backend prevalece; no hay control de concurrencia optimista.

### Edición

- Edición sin cambios: se permite y se informa el resultado del backend.
- Edición que deja la capacidad máxima igual a la capacidad actual: se permite.
- Edición con capacidad máxima menor que la capacidad actual: rechazo local y conservación de valores.
- Edición que colisiona con una combinación académica existente: rechazo del backend y sin duplicados.
- Edición de un curso inactivo: se permite sin cambiar su estado.
- Edición que modifica la combinación y genera un código nuevo: se muestra el código devuelto por el backend.
- Curso eliminado entre la apertura del formulario de edición y el envío: aviso de curso inexistente y actualización del listado o detalle.
- Edición desde el detalle: al guardar, el detalle refleja los datos devueltos.
- Cambio de año calendario con el formulario abierto: el servidor revalida el año actual.
- División con solo espacios o más de 10 caracteres: error local y valores conservados.

### Clonación

- Clonación individual al mismo año con combinación existente: rechazo y sin duplicados.
- Clonación individual con año futuro: se crea con código nuevo, sin inscripciones, con capacidad actual cero y conservando capacidad máxima y estado.
- Clonación de un curso inactivo: el clon conserva el estado inactivo.
- Clonación masiva sin años de origen anteriores al actual: diálogo informativo sin confirmación.
- Clonación masiva con todos los cursos duplicados: cero clonados y mensaje sin motivo inventado.
- Clonación masiva parcial: se informa la cantidad creada y se conserva el listado actualizado.
- Clonación masiva con error: se muestra el error y se refresca el listado para reflejar el estado real.
- Clonación desde un año futuro: no se ofrece como origen.

### Inscripciones y reporte

- Reporte de inscripciones vacío: total cero y estado vacío.
- Reporte de inscripciones con error de red, timeout o `5xx`: error solo en esa sección y detalle utilizable.
- Reporte de inscripciones con `401`: sesión vencida.
- Reporte de inscripciones con `403`: acceso denegado.
- Reporte de inscripciones con `404`: curso inexistente.
- Inscripciones con datos faltantes de teléfono, correo, DNI, nombre u orden: se muestra «No informado» sin romper la tabla.
- Reporte con total distinto de la cantidad de filas: se muestra el total informado por el backend.
- Reporte con muchas filas: todas las filas del backend se muestran con scroll interno de la tabla.
- Reporte cargando mientras el detalle ya está visible: esqueleto solo en la sección de inscripciones.

### Sesión, red y accesibilidad

- Sesión vencida durante una operación: se descarta la sesión, se redirige al login y no se muestra éxito.
- Acceso denegado por rol: mensaje de acceso denegado sin datos.
- Error de red o timeout: mensaje, valores conservados y posibilidad de reintentar.
- Respuesta vieja de filtros que llega después de un cambio: se descarta si no corresponde al filtro vigente.
- Texto al 200 %: tabla con scroll interno y acciones alcanzables.
- Colores forzados: estado y foco siguen siendo perceptibles.
- ADMINISTRADOR y ADMINISTRATIVO acceden al listado; TUTOR recibe acceso denegado.
- Aviso de éxito: se oculta a los 4 segundos; con foco o puntero encima se pausa; los errores no se ocultan.
- Footer del panel: ausente en dashboard y cursos.

## Limitaciones conocidas del backend

- El listado general solo admite `page` y `per_page`; no hay filtros de servidor. La búsqueda y los filtros se resuelven en el cliente sobre el conjunto completo.
- No existe un endpoint de métricas agregadas; el total, los activos y la capacidad se calculan sobre los cursos obtenidos.
- `pendingRequests` se calcula internamente en `/available`, pero no se serializa; el frontend no puede mostrar solicitudes pendientes ni saber si un curso con capacidad actual cero las tiene.
- El detalle del curso no incluye alumnos. La única fuente es el reporte del curso, que trae solo inscripciones activas con apellido, nombre, DNI, teléfono y correo.
- El reporte informa el total en `header.totalInscriptions` y no informa fecha de solicitud, estado por alumno ni un identificador para consultar el detalle del alumno.
- El endpoint de reporte entrega JSON; no genera Excel, CSV ni PDF, y no existe una acción de exportación definida.
- La desactivación de un curso con capacidad ocupada lanza un error de servidor no transformado; la interfaz deshabilita la acción y trata un rechazo inesperado como error genérico.
- La clonación masiva siempre tiene como destino el año actual y omite silenciosamente los cursos cuya combinación ya existe.
- La clonación conserva capacidad máxima y estado según el contrato acordado.
- La actualización de un curso es parcial; no permite enviar ni editar el identificador, el código ni la capacidad actual, y la capacidad máxima no puede quedar por debajo de la capacidad actual. El backend puede recalcular el código si cambia la combinación.
- La combinación de año, año de cursada, división, ciclo, turno y especialidad debe seguir siendo única también al editar.
- La edición de cursos de años pasados no está permitida por la validación vigente.
- No existe un endpoint de reasignación de inscriptos entre cursos.
- La eliminación es lógica; no existe borrado físico de cursos.
- Un curso con capacidad actual cero puede eliminarse aunque tenga solicitudes pendientes no visibles; la respuesta del backend es autoritativa.
- No existe un endpoint de historial de cambios de un curso.
- El cierre de sesión es local: el backend no revoca el JWT antes de su vencimiento.
- No hay control de concurrencia optimista; la última escritura confirmada por el backend prevalece.
- La carga del conjunto completo tiene un tope de seguridad; si se supera, el módulo muestra un error controlado sin datos parciales.
- No existe endpoint de notificaciones ni de envío a alumnos; la selección y la acción «Enviar notificación» son una preparación visual no disponible.

## Fuera de alcance

- Generación o exportación de reportes en Excel, CSV, PDF o cualquier archivo descargable.
- Gestión de inscripciones, aprobación o rechazo de solicitudes desde el módulo de cursos.
- Reasignación de inscriptos entre cursos.
- Consulta del detalle o la ficha de un alumno.
- Acceso de `TUTOR` al módulo.
- Filtros, orden o métricas resueltos en el backend.
- Eliminación masiva, definitiva o física de cursos.
- Eliminación de cursos con capacidad actual mayor que cero.
- Acción de reasignación en la interfaz.
- Historial, auditoría o papelera de cursos eliminados.
- Envío real de notificaciones a alumnos; la selección y «Enviar notificación» quedan como preparación visual no disponible.
- Persistencia de la selección entre recargas o sesiones.
- Cambios de contrato, nuevos endpoints o reglas de negocio del backend. Se exceptúa la corrección de autorización de roles necesaria para el acceso de `ADMINISTRADOR`.
- Datos de prueba, cursos ficticios o métricas de ejemplo en producción.
- Modo oscuro o temas alternativos.
- Impresión de la tabla o del detalle.

## Mensajes de la interfaz

| Caso | Texto |
|---|---|
| Título de listado | «Cursos | EET N° 3100» |
| Título de creación | «Crear curso | Cursos | EET N° 3100» |
| Título de detalle | «{código o “Detalle del curso”} | Cursos | EET N° 3100» |
| Título de edición | «Editar {código o “curso”} | Cursos | EET N° 3100» |
| Breadcrumb de gestión | «Inicio > Cursos» |
| Breadcrumb de creación | «Inicio > Cursos > Crear curso» |
| Breadcrumb de detalle | «Inicio > Cursos > Detalles» |
| Breadcrumb de edición | «Inicio > Cursos > Editar curso» |
| Título | «Gestión de cursos» |
| Descripción | «Administrá la oferta académica de la institución» |
| Acción de creación | «Crear curso» |
| Acción de edición | «Editar» |
| Acción de guardado | «Guardar cambios» |
| Acción de clonación masiva | «Clonar cursos» |
| Acción de clonación individual | «Clonar» |
| Acción de reporte | «Generar reporte» |
| Nombre accesible de reporte general | «Generar reporte general» |
| Nombre accesible de reporte del curso | «Generar reporte del curso» |
| Acción de ver detalle | «Ver detalles» |
| Acción no disponible | «Próximamente» |
| Descripción de acción no disponible | «No disponible, próximamente» |
| Tarjeta 1 | «Total de cursos» |
| Tarjeta 2 | «Año académico seleccionado» |
| Tarjeta 3 | «Cursos activos» |
| Tarjeta 4 | «Capacidad total» |
| Filtro de año | «Año académico» |
| Filtro de ciclo | «Ciclo» |
| Filtro de especialidad | «Especialidad» |
| Filtro de turno | «Turno» |
| Opción sin restricción | «Todas» |
| Opción de todos los años | «Todos los años» |
| Limpiar filtros | «Limpiar filtros» |
| Columna de selección | «Selección» |
| Seleccionar todos | «Seleccionar todos los cursos filtrados» |
| Selección activa | «{n} cursos seleccionados» |
| Limpiar selección | «Limpiar selección» |
| Acción de notificación | «Enviar notificación» |
| Columnas | «Selección», «Año académico», «Año de cursada», «División», «Ciclo», «Especialidad», «Turno», «Estado», «Acciones» |
| Estado activo | «Activo» |
| Estado inactivo | «Inactivo» |
| Sin cursos | «Todavía no hay cursos cargados.» |
| Sin resultados | «No hay cursos que coincidan con los filtros.» |
| Columnas de inscripciones | «N.º de orden», «Alumno», «DNI», «Teléfono», «Correo» |
| Ayuda de inscripciones | «Solo se muestran inscripciones activas. El servicio no informa fecha de solicitud ni estado por alumno.» |
| Sin inscripciones | «Este curso no tiene inscripciones activas.» |
| Crear | «Crear curso» |
| Cancelar | «Cancelar» |
| Volver | «Volver a cursos» |
| Eliminar | «Eliminar» |
| Confirmar eliminación | «Eliminar curso» |
| Confirmación de eliminación | «Se eliminará el curso {código o “Sin código”} de la oferta. Esta acción no se puede deshacer desde la interfaz.» |
| Activar | «Activar» |
| Desactivar | «Desactivar» |
| Confirmación de desactivación | «El curso {código o “Sin código”} dejará de estar disponible.» |
| Eliminar deshabilitado | «No disponible: el curso tiene inscriptos.» |
| Desactivar deshabilitado | «No disponible: el curso tiene inscriptos.» |
| Editar deshabilitado por año pasado | «Solo se pueden editar cursos del año actual o futuros.» |
| Reintentar | «Reintentar» |
| Acceso denegado | «No tenés permisos para acceder a este módulo.» |
| No encontrado | «El curso no existe o fue eliminado.» |
| Error de carga | «No pudimos cargar los cursos. Intentá nuevamente.» |
| Error de inscripciones | «No pudimos cargar las inscripciones. Intentá nuevamente.» |
| Error de operación | «No pudimos completar la operación. Intentá nuevamente.» |
| Eliminación rechazada por inscriptos | «No se puede eliminar: el curso tiene inscriptos.» |
| Capacidad inválida | «La capacidad máxima no puede ser menor que la capacidad actual.» |
| Curso inexistente al editar | «El curso ya no existe.» |
| Éxito de creación | «Curso creado correctamente: {código o “Sin código”}.» |
| Éxito de edición | «Curso actualizado correctamente: {código o “Sin código”}.» |
| Éxito de clonación | «Curso clonado correctamente: {código o “Sin código”}.» |
| Éxito de clonación masiva | «Se crearon {creados} de {intentados} cursos.» |
| Sin cursos clonados | «No se creó ningún curso nuevo.» |
| Éxito de eliminación | «Curso eliminado correctamente.» |
| Éxito de activación | «Curso activado correctamente.» |
| Éxito de desactivación | «Curso desactivado correctamente.» |
| Sin año de origen | «No hay años anteriores disponibles para clonar.» |
| Sin código | «Sin código» |
| Dato no informado | «No informado» |
| Total de reporte no disponible | «No disponible» |

## Criterios de finalización

- «Cursos» está habilitado y activo en el menú lateral para `ADMINISTRATIVO` y `ADMINISTRADOR` en listado, detalle, creación y edición, sin cambios para `TUTOR`.
- Cada ruta del módulo tiene metadata, breadcrumb, estado de carga y límite de error propios.
- La página de gestión muestra breadcrumb, título, descripción y las tres acciones del encabezado, con «Generar reporte» marcada como no disponible.
- Las cuatro tarjetas se calculan con datos reales del conjunto filtrado y muestran carga y error sin cifras inventadas.
- Buscador, filtros de año, ciclo, especialidad y turno funcionan de forma combinada sobre el conjunto completo; «Limpiar filtros» restablece los valores definidos y vuelve a la página 1.
- La URL refleja filtros y página; los valores inválidos se normalizan y la página se ajusta cuando queda fuera de rango.
- La tabla muestra las columnas «Selección», «Año académico», «Año de cursada», «División», «Ciclo», «Especialidad», «Turno», «Estado» y «Acciones», sin «Código», con valores traducidos, orden por año descendente con desempates completos, estado accesible, paginación de 10 y estados de carga, vacío y error.
- La selección permite marcar uno o varios cursos, seleccionar todos los filtrados, conservar los identificadores al paginar o filtrar, limpiar la selección y descartar cursos inexistentes.
- La barra de selección muestra la cantidad seleccionada y «Enviar notificación» como acción no disponible con «Próximamente», sin efectos.
- El menú de acciones se muestra fuera del contenedor de la tabla, completo y dentro del viewport.
- Los avisos de éxito se ocultan a los 4 segundos; los errores permanecen hasta cierre manual.
- El footer institucional aparece en las páginas públicas y no en el panel privado, para ningún rol.
- ADMINISTRADOR y ADMINISTRATIVO acceden al listado sin recibir acceso denegado.
- El menú por fila ofrece todas las acciones acordadas, identifica las no disponibles y ejecuta Ver, Editar, Clonar, Activar/Desactivar y Eliminar con confirmación y resultados reales.
- «Eliminar» y «Desactivar» están deshabilitados con capacidad actual mayor que cero y habilitados con capacidad actual cero.
- La eliminación es lógica: el curso desaparece de las consultas normales y no existe borrado físico.
- No se ofrece reasignación de inscriptos en esta spec.
- Los cursos de años pasados no son editables y muestran el motivo correspondiente.
- La clonación copia capacidad máxima y estado; la clonación masiva solo acepta años anteriores al actual.
- El detalle muestra breadcrumb, datos completos del curso, «Volver a cursos» y «Editar» habilitado solo para cursos editables; resuelve no encontrado y acceso denegado.
- La sección de inscripciones activas usa solo datos reales del backend, muestra el total de `header.totalInscriptions`, no mezcla cursos ni supone aprobaciones, y declara sus limitaciones.
- El formulario de creación valida, informa, evita duplicados, conserva valores ante error y actualiza el listado solo con confirmación del backend.
- El formulario de edición valida, conserva valores ante error, no baja la capacidad por debajo de la actual y refresca lista y detalle solo con confirmación del backend.
- Ambos diálogos de clonación revisan origen, destino y consecuencias, evitan envíos duplicados y actualizan el listado con el resultado real.
- Toda operación fallida muestra error y no simula éxito; toda operación exitosa se anuncia y refresca los datos.
- La interfaz cumple accesibilidad, contraste, responsive, texto al 200 %, colores forzados y reducción de movimiento.
- No se usan datos de ejemplo y no se agregan dependencias. Solo se permite la corrección de autorización de roles del backend.
- La verificación técnica de tipos, lint, compilación y pruebas queda en verde y se detalla en el plan.

## Dudas abiertas

- Ninguna.
