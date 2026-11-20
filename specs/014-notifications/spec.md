# Spec 014 — Módulo de Notificaciones

Estado: implementada (2026-11-19, cambio 2026-11-19b)

## Contexto y objetivo

El staff necesita comunicarse con tutores y usuarios mediante avisos internos. El servicio ya expone el envío de notificaciones (individual, por curso o a todos los tutores), la bandeja propia, el marcado de lectura y la descarga de adjuntos; la aplicación web todavía no ofrece ninguna de estas capacidades.

El objetivo de esta spec es habilitar el módulo **Notificaciones**: una bandeja donde cada persona autenticada ve exclusivamente las notificaciones que recibió, con filtros, detalle completo, marcado automático de lectura y descarga de adjuntos; y un flujo de creación para `ADMINISTRATIVO` y `ADMINISTRADOR` que permita elegir la audiencia, redactar el aviso, adjuntar un archivo opcional y confirmar el envío.

El acceso se ofrece desde una única opción del menú lateral, identificada con un icono de campana, cuya etiqueta muestra un badge numérico con la cantidad de notificaciones no leídas. No hay desplegable de campana ni barra superior adicional.

La audiencia se fija en el momento del envío: verificaciones o inscripciones posteriores no agregan destinatarios. No se modifica el servicio ni se agregan operaciones inexistentes.

## Usuarios

- Personas con rol `TUTOR` verificadas, que reciben avisos.
- Personas con rol `ADMINISTRATIVO` o `ADMINISTRADOR` verificadas, que reciben avisos y además pueden enviarlos.
- Personas autenticadas no verificadas que intentan consultar, leer, descargar o enviar.
- Personas no autenticadas o con sesión vencida.
- Personas con un rol no reconocido que acceden por la dirección del módulo.
- Personas que usan lector de pantalla, teclado o teléfono.

## Historias de usuario

- HU-1. Como destinatario, quiero ver mis notificaciones recibidas en un solo lugar para enterarme de los avisos de la institución.
- HU-2. Como destinatario, quiero distinguir las notificaciones leídas de las no leídas para priorizar lo pendiente.
- HU-3. Como destinatario, quiero filtrar solo las no leídas para revisar lo que todavía no leí.
- HU-4. Como destinatario, quiero saber de un vistazo cuándo se envió cada aviso y si tiene adjunto.
- HU-5. Como destinatario, quiero abrir una notificación y leer su contenido completo para comprender el aviso.
- HU-6. Como destinatario, quiero que el aviso se marque como leído al abrirlo para no perder el estado real.
- HU-7. Como destinatario, quiero descargar el adjunto de una notificación para acceder al documento enviado.
- HU-8. Como persona que usa el menú lateral, quiero ver cuántas notificaciones no leídas tengo para detectar avisos nuevos sin abrir el módulo.
- HU-9. Como administrativo o administrador, quiero enviar un aviso a un tutor en particular para comunicarme de forma directa.
- HU-10. Como administrativo o administrador, quiero enviar un aviso a todos los tutores de un curso para alcanzar a las familias de ese curso.
- HU-11. Como administrativo o administrador, quiero enviar un comunicado a todos los tutores para difundir información general.
- HU-12. Como administrativo o administrador, quiero adjuntar un archivo opcional para compartir circulares o documentación.
- HU-13. Como administrativo o administrador, quiero revisar un resumen y confirmar antes de enviar para evitar envíos accidentales.
- HU-14. Como administrativo o administrador, quiero corregir los datos señalados por el servicio para completar el envío.
- HU-15. Como persona que usa lector de pantalla o teclado, quiero operar la bandeja, los filtros, los modales y el envío de forma accesible.
- HU-16. Como persona que usa el teléfono, quiero consultar y redactar notificaciones sin desbordes ni controles inalcanzables.
- HU-17. Como destinatario, quiero identificar el número de avisos no leídos desde el menú lateral para decidir cuándo entrar.
- HU-18. Como emisor autorizado, quiero buscar cursos y tutores escribiendo para elegir el destinatario con pocas coincidencias.
- HU-19. Como emisor autorizado, quiero un modal amplio para redactar y revisar la confirmación sin perder contexto.

## Definiciones

- **Notificación**: aviso con título, contenido, fecha de envío, estado de lectura y adjunto opcional, identificado por un UUID.
- **Recurso de notificación**: `id` UUID; `title` y `content` no vacíos; `isRead` booleano; `readAt` fecha ISO válida o nulo, coherente con `isRead`; `hasAttachment` booleano; `attachmentUrl` presente solo cuando hay adjunto; `sentAt` fecha ISO válida con offset. Identificadores repetidos, fechas inválidas o `attachmentUrl` incoherente invalidan la respuesta completa.
- **Bandeja**: listado de las notificaciones entregadas a la persona autenticada. No es un historial de envíos. Al reingresar, el filtro vuelve a «Todas».
- **Destinatario verificado**: cuenta cuya identidad fue verificada; única habilitada para consultar, marcar como leída o descargar adjuntos. La interfaz no infiere la verificación: la determina por la respuesta del servicio.
- **Cuenta habilitada**: cuenta a la que el servicio no le responde `403` en la bandeja o en las operaciones del módulo.
- **Emisor autorizado**: persona con rol vigente `ADMINISTRATIVO` o `ADMINISTRADOR`.
- **Audiencia**: alcance del envío: `individual` (un tutor), `course` (tutores de un curso) o `allTutors` (todos los tutores).
- **Adjunto**: archivo PDF, JPG, JPEG, PNG o WEBP de hasta 5.000.000 bytes incluido el límite.
- **No leída**: notificación entregada sin fecha de lectura registrada.
- **Badge de no leídas**: indicador numérico junto a la opción «Notificaciones» del menú lateral. Muestra únicamente el número, no texto adicional; se oculta cuando la cantidad es cero o desconocida, y muestra «99+» desde 100.
- **Modal de detalle**: superficie superpuesta que muestra el contenido completo de una notificación.
- **Modal de creación**: superficie superpuesta donde el emisor autorizado elige audiencia, redacta y adjunta.
- **Confirmación de envío**: resumen previo que reemplaza el contenido del modal, identifica audiencia, destinatario o curso, título y adjunto, y permite confirmar o volver.
- **Resultado incierto**: envío que no recibió respuesta por red o tiempo de espera; pudo haberse completado en el servicio.
- **Aviso de resultado**: mensaje interno que informa el resultado de la operación recién realizada.
- **No disponible**: mensaje de una operación sobre un recurso propio que el servicio rechaza o no encuentra; no cierra la bandeja ni el detalle.
- **Acceso denegado**: pantalla que reemplaza al módulo cuando la cuenta no está habilitada; no expone datos.
- **Rol vigente**: rol que devuelve el perfil del servicio; prevalece sobre el rol del token para lo que muestra la interfaz.
- **Selector con búsqueda**: control desplegable con campo de texto, icono de lupa, lista de hasta cuatro coincidencias y selección simple.
- **Coincidencia**: resultado cuyo texto contiene el término ingresado, sin distinguir mayúsculas ni acentos.

## Requisitos funcionales

### Acceso y navegación

- RF-1. EL SISTEMA muestra la opción «Notificaciones» del menú lateral, con icono de campana, para los roles `TUTOR`, `ADMINISTRATIVO` y `ADMINISTRADOR`, con destino a la bandeja.
- RF-2. CUANDO la persona está en la bandeja, EL SISTEMA marca «Notificaciones» como opción activa.
- RF-3. EL SISTEMA muestra junto a «Notificaciones» un badge con la cantidad de notificaciones no leídas, sin texto adicional: oculto en cero, exacto entre 1 y 99 y «99+» desde 100.
- RF-4. EL SISTEMA ubica el badge a la derecha de la etiqueta cuando el menú está expandido y sobre el icono cuando está contraído, sin recortarlo, sin superponerlo al texto y sin alterar el alto de la fila.
- RF-5. EL SISTEMA incluye la cantidad y su significado en el nombre accesible de la opción, de modo que el estado no dependa solo del color ni del número visible.
- RF-6. CUANDO se confirma una lectura, EL SISTEMA recalcula el badge como la cantidad de notificaciones no leídas restantes; el badge nunca es negativo.
- RF-7. SI el conjunto de notificaciones no pudo obtenerse o la cuenta no está verificada, ENTONCES EL SISTEMA no muestra badge (RF-89, RF-118).
- RF-8. EL SISTEMA no muestra ningún otro indicador de notificaciones no leídas fuera de la opción del menú lateral, incluida la barra compacta de teléfono y tablet; una campana sin conteo no debe quedar como control inactivo.
- RF-9. SI una persona sin sesión válida accede al módulo, ENTONCES EL SISTEMA redirige al inicio de sesión con el aviso de sesión vencida.
- RF-10. SI el perfil del servicio responde `401`, ENTONCES EL SISTEMA descarta la sesión y redirige al inicio de sesión con el aviso de sesión vencida.
- RF-11. SI el perfil del servicio responde `403` o la bandeja responde `403`, ENTONCES EL SISTEMA muestra acceso denegado sin exponer notificaciones ni datos personales.
- RF-12. SI el rol vigente no es `TUTOR`, `ADMINISTRATIVO` ni `ADMINISTRADOR`, ENTONCES EL SISTEMA no muestra la opción del menú y, ante un acceso directo, muestra acceso denegado sin solicitar ni exponer datos.
- RF-13. MIENTRAS el rol vigente es `TUTOR`, EL SISTEMA no muestra el control «Crear notificación» ni permite abrir el flujo de envío.
- RF-14. CUANDO el rol vigente es `ADMINISTRATIVO` o `ADMINISTRADOR`, EL SISTEMA muestra el botón «Crear notificación» en la bandeja.
- RF-15. SI una persona sin permiso de envío intenta ejecutar el envío, ENTONCES EL SISTEMA no lo ejecuta y muestra un aviso de permiso; un `403` del servicio conserva la redacción (RF-78).

### Bandeja

- RF-16. CUANDO la persona ingresa a la bandeja, EL SISTEMA muestra únicamente las notificaciones entregadas a su cuenta, sin importar su rol.
- RF-17. EL SISTEMA muestra cada notificación con título, resumen del contenido, fecha de envío, estado de lectura con el texto «Leída» o «No leída» y si tiene adjunto.
- RF-18. EL SISTEMA ordena las notificaciones de la más reciente a la más antigua según la fecha de envío; ante fechas iguales, ordena por identificador ascendente (RF-94).
- RF-19. EL SISTEMA muestra la fecha de envío y, cuando existe, la fecha de lectura con el formato `dd/mm/aaaa HH:mm` correspondiente al offset informado por el servicio, sin convertirla a otra zona (RF-93).
- RF-20. EL SISTEMA muestra el contenido de la lista como resumen de hasta 140 caracteres en una línea, con «…» solo cuando se recorta (RF-92).
- RF-21. EL SISTEMA ofrece los filtros «Todas» y «No leídas», con «Todas» seleccionado al ingresar.
- RF-22. EL SISTEMA muestra el filtro desde el inicio, incluso durante la primera carga, y lo mantiene visible y aplicado mientras la bandeja se carga, se produce un error o se reintenta.
- RF-23. CUANDO la persona elige «Todas», EL SISTEMA muestra la totalidad de las notificaciones recibidas.
- RF-24. CUANDO la persona elige «No leídas», EL SISTEMA muestra solo las notificaciones sin lectura registrada.
- RF-25. SI la bandeja no tiene notificaciones, ENTONCES EL SISTEMA muestra un mensaje de bandeja vacía; si tiene notificaciones pero ninguna sin leer y el filtro es «No leídas», informa que no hay notificaciones sin leer (RF-95).
- RF-26. MIENTRAS la bandeja se está cargando, EL SISTEMA muestra un estado de carga y no muestra datos parciales.
- RF-27. SI la carga de la bandeja falla por un error distinto de `401` o `403`, ENTONCES EL SISTEMA muestra un mensaje de error y ofrece reintentar; el reintento reemplaza el estado de error.
- RF-28. SI la respuesta de la bandeja no respeta la estructura de notificación definida, ENTONCES EL SISTEMA muestra el error de carga y no muestra elementos parciales.
- RF-29. EL SISTEMA muestra título y contenido como texto plano, sin interpretar marcado ni ejecutar contenido incrustado.
- RF-30. EL SISTEMA muestra el contenido completo solo en el detalle; la bandeja no ofrece controles de búsqueda, orden ni paginación.

### Detalle y lectura

- RF-31. CUANDO la persona selecciona una notificación, EL SISTEMA abre el modal de detalle con su contenido completo.
- RF-32. EL SISTEMA muestra en el detalle título, contenido completo, fecha de envío, estado de lectura, fecha de lectura cuando existe y la disponibilidad de adjunto.
- RF-33. SI la notificación seleccionada no está leída, ENTONCES EL SISTEMA la marca como leída, indica «Marcando como leída…» mientras espera y, al confirmarse, actualiza el estado, la fecha de lectura, la lista y el badge.
- RF-34. SI la notificación seleccionada ya está leída, ENTONCES EL SISTEMA no vuelve a marcarla y conserva la fecha de lectura existente.
- RF-35. CUANDO el servicio devuelve una fecha de lectura, EL SISTEMA muestra esa fecha aunque difiera de la estimada localmente.
- RF-36. SI el marcado de lectura falla por un error distinto de `401` o `403`, ENTONCES EL SISTEMA mantiene visible el detalle, permite cerrarlo, conserva el estado no leído, informa que no pudo registrarse la lectura y reintenta al volver a abrir la notificación.
- RF-37. SI el marcado de lectura responde `401`, ENTONCES EL SISTEMA descarta la sesión y redirige al inicio de sesión con el aviso de sesión vencida.
- RF-38. SI el marcado de lectura responde `403` o `404`, ENTONCES EL SISTEMA informa que la notificación no está disponible, mantiene el detalle abierto y deja la notificación en la lista sin cambios (RF-97).
- RF-39. CUANDO la notificación tiene adjunto, EL SISTEMA ofrece una acción «Descargar adjunto» en el detalle.
- RF-40. CUANDO la persona solicita descargar el adjunto, EL SISTEMA inicia la descarga del archivo entregado con esa notificación, conservando el nombre y el tipo provistos por el servicio y sin mostrar su ruta de almacenamiento (RF-108).
- RF-41. SI la descarga responde `404`, ENTONCES EL SISTEMA informa que el adjunto no está disponible y mantiene abierto el detalle.
- RF-42. SI la descarga responde `401`, ENTONCES EL SISTEMA aplica el tratamiento de sesión vencida; si responde `403`, informa que el recurso no está disponible sin cerrar el detalle; otros errores se rigen por RF-109.
- RF-43. EL SISTEMA permite cerrar el modal de detalle con un control explícito, con la tecla Escape y con un clic fuera del contenido, siempre que la presión y la liberación del puntero ocurran sobre el fondo (RF-98).
- RF-44. CUANDO se cierra el modal de detalle, EL SISTEMA conserva el filtro y el desplazamiento de la lista y devuelve el foco al elemento que abrió el detalle, salvo el caso de RF-45.
- RF-45. SI con el filtro «No leídas» la notificación recién leída deja de pertenecer a la lista, ENTONCES EL SISTEMA la retira al cerrar el detalle y mueve el foco al siguiente elemento visible o al filtro si no queda ninguno.

### Creación: audiencia

- RF-46. CUANDO la persona autorizada presiona «Crear notificación», EL SISTEMA abre el modal de creación sin audiencia preseleccionada, en un formulario único cuyos campos de redacción permanecen deshabilitados hasta definir la audiencia y, cuando corresponda, su destinatario.
- RF-47. EL SISTEMA ofrece tres opciones de audiencia: «Por curso», «Todos los tutores» y «Un tutor», y describe con una frase el alcance de cada una.
- RF-48. CUANDO se elige «Todos los tutores», EL SISTEMA no solicita filtros ni destinatarios adicionales y advierte que solo reciben tutores verificados.
- RF-49. CUANDO se elige «Por curso», EL SISTEMA ofrece los cursos del año lectivo vigente, de todos los estados, ordenados por año de cursada, división y turno, sin duplicados por identificador, en un selector con búsqueda y solicita seleccionar uno (RF-103, RF-119 a RF-122).
- RF-50. MIENTRAS los cursos se están cargando, EL SISTEMA muestra un estado de carga en el selector y no permite continuar.
- RF-51. SI la carga de cursos falla, ENTONCES EL SISTEMA muestra un mensaje de error, permite reintentar y no permite continuar por curso.
- RF-52. SI no hay cursos disponibles, ENTONCES EL SISTEMA informa que no hay cursos para elegir y no permite continuar por curso.
- RF-53. CUANDO se elige «Un tutor», EL SISTEMA ofrece un selector desplegable con búsqueda y hasta cuatro coincidencias (RF-123 a RF-128).
- RF-54. EL SISTEMA actualiza el filtro de tutores en cada cambio del texto, sin exigir una acción adicional; sin texto muestra las primeras cuatro coincidencias y conserva la selección realizada (RF-124, RF-127).
- RF-55. EL SISTEMA permite filtrar tutores por nombre, apellido, DNI, CUIL o correo, en coincidencia parcial.
- RF-56. EL SISTEMA muestra en los resultados solo usuarios con rol `TUTOR`, con nombre, apellido y DNI si existe; si no, correo; si ninguno, «Sin datos de contacto».
- RF-57. SI la búsqueda de tutores no obtiene resultados, ENTONCES EL SISTEMA informa que no encontró tutores con esos criterios.
- RF-58. CUANDO la persona selecciona un tutor, EL SISTEMA lo muestra en el área «Destinatario seleccionado» con una acción «Cambiar» y lo destaca en los resultados (RF-100).
- RF-59. SI la persona cambia de audiencia, ENTONCES EL SISTEMA descarta solo el curso o tutor elegido, conserva título, contenido y adjunto, y vuelve a solicitar la selección correspondiente.
- RF-60. SI falta el curso o el tutor requerido según la modalidad elegida, ENTONCES EL SISTEMA no habilita la redacción ni el envío (RF-99).
- RF-61. SI la carga de cursos o la búsqueda de tutores responde `401`, ENTONCES EL SISTEMA aplica el tratamiento de sesión vencida; si responde `403`, informa acceso denegado en el paso, mantiene abierto el modal y permite cambiar de audiencia.

### Redacción y envío

- RF-62. CUANDO la audiencia y, cuando corresponda, su destinatario están definidos, EL SISTEMA habilita la redacción con título, contenido y adjunto opcional.
- RF-63. EL SISTEMA exige un título de 1 a 80 caracteres Unicode una vez recortados espacios, tabulaciones y saltos de los extremos, rechaza el título vacío, envía el título recortado y no acepta un título recortado de más de 80 (RF-105).
- RF-64. EL SISTEMA impide el ingreso que supere los 80 caracteres recortados sin truncar silenciosamente e informa el límite alcanzado.
- RF-65. EL SISTEMA exige un contenido con al menos un carácter no blanco, no impone límite máximo y lo envía tal como se ingresó.
- RF-66. SI el servicio rechaza el contenido por su tamaño, ENTONCES EL SISTEMA muestra el mensaje y conserva el contenido ingresado (RF-111).
- RF-67. EL SISTEMA acepta un único adjunto opcional en formato PDF, JPG, JPEG, PNG o WEBP, de hasta 5.000.000 bytes incluido el límite y con contenido mayor que cero bytes, validando la extensión sin distinguir mayúsculas y el tipo declarado; el contenido real lo valida el servicio (RF-106).
- RF-68. SI el archivo excede 5.000.000 bytes, está vacío o su formato no está permitido, ENTONCES EL SISTEMA rechaza el adjunto, informa el motivo y no lo incorpora al envío.
- RF-69. SI se elige un archivo inválido cuando ya había uno válido, ENTONCES EL SISTEMA conserva el anterior e informa el rechazo del nuevo.
- RF-70. CUANDO se incorpora un adjunto, EL SISTEMA muestra su nombre y tamaño y permite quitarlo antes del envío (RF-107).
- RF-71. CUANDO la persona solicita enviar, EL SISTEMA reemplaza el contenido del modal por la confirmación de envío con la audiencia, el destinatario o curso, el título y el adjunto, o «Sin adjunto» cuando no corresponde.
- RF-72. CUANDO la persona cancela la confirmación, incluida la tecla Escape o el clic fuera, EL SISTEMA vuelve a la redacción conservando los datos ingresados sin enviar, salvo que el envío esté en curso (RF-75).
- RF-73. CUANDO la persona confirma el envío, EL SISTEMA envía la notificación con la audiencia elegida y solo el dato de destinatario que corresponde a esa audiencia, sin incluir destinatarios ajenos.
- RF-74. EL SISTEMA completa el envío con o sin adjunto sin alterar los datos de texto ingresados.
- RF-75. MIENTRAS el envío está en curso, EL SISTEMA muestra un estado de envío, impide confirmar de nuevo y no permite cerrar el modal.
- RF-76. CUANDO el envío responde exitosamente, EL SISTEMA cierra el modal de creación, descarta el formulario, muestra un aviso de éxito en la bandeja, vuelve a consultar la bandeja y recalcula el badge; no agrega el aviso a la bandeja del emisor ni como historial de envíos.
- RF-77. SI el envío responde `401`, ENTONCES EL SISTEMA descarta la sesión y redirige al inicio de sesión con el aviso de sesión vencida.
- RF-78. SI el envío responde `403`, ENTONCES EL SISTEMA informa que la cuenta no tiene permiso para enviar y conserva los datos de la redacción.
- RF-79. SI un envío individual responde `404`, ENTONCES EL SISTEMA informa que el tutor no existe o no está verificado, vuelve al paso de audiencia y conserva los datos de la redacción que no dependen de ese destinatario.
- RF-80. SI el envío responde `422`, ENTONCES EL SISTEMA aplica el flujo de corrección de RF-113.
- RF-81. SI el envío no recibe respuesta por error de red o tiempo de espera, ENTONCES EL SISTEMA informa que el resultado es incierto, no reenvía automáticamente y aplica RF-114.
- RF-82. CUANDO la persona intenta cerrar el modal de creación con datos ingresados, EL SISTEMA pide confirmación antes de descartarlos.
- RF-83. EL SISTEMA no ofrece edición, eliminación, borradores ni programación de notificaciones.

### Permisos y seguridad

- RF-84. EL SISTEMA opera la bandeja, el marcado de lectura y la descarga solo sobre entregas propias.
- RF-85. EL SISTEMA no expone notificaciones, adjuntos ni datos de otras personas a quien no sea su destinatario.
- RF-86. EL SISTEMA no expone tokens, credenciales, rutas físicas de archivos ni identificadores sensibles en pantalla, direcciones, consola o registros.
- RF-87. EL SISTEMA no ofrece controles de eliminación ni de edición de notificaciones.

### Robustez, límites y navegación

- RF-88. EL SISTEMA obtiene el conteo del badge del mismo conjunto de notificaciones recibidas y lo recalcula al cargar una pantalla privada, al cambiar de ruta y tras una lectura o un envío confirmados.
- RF-89. SI la obtención del conteo falla después de haber mostrado un valor, ENTONCES EL SISTEMA oculta el badge hasta la próxima consulta exitosa.
- RF-90. EL SISTEMA determina la habilitación de la cuenta solo por la respuesta del servicio; no infiere la verificación del perfil. Una cuenta no verificada conserva la opción del menú, sin badge, y recibe acceso denegado al abrir la bandeja.
- RF-91. EL SISTEMA usa estos nombres accesibles: «Notificaciones, N sin leer» con N mayor que cero; «Notificaciones, no hay notificaciones sin leer» en cero; «Notificaciones» cuando el conteo no se conoce.
- RF-92. EL SISTEMA normaliza el resumen colapsando espacios, tabulaciones y saltos en un espacio simple, recorta extremos y cuenta caracteres Unicode; agrega «…» solo si recorta. La fila expone en su nombre accesible título, estado de lectura, fecha de envío y presencia de adjunto.
- RF-93. SI una fecha del recurso es inválida o no puede interpretarse, ENTONCES EL SISTEMA muestra «No disponible»; el formato de presentación ignora segundos y fracciones.
- RF-94. EL SISTEMA ordena por fecha de envío descendente y, ante fechas iguales, por identificador ascendente.
- RF-95. SI la bandeja no tiene notificaciones, ENTONCES EL SISTEMA muestra el vacío de bandeja aunque el filtro sea «No leídas»; si tiene notificaciones y el filtro «No leídas» no arroja resultados, muestra el vacío de no leídas. Al reingresar, el filtro vuelve a «Todas».
- RF-96. MIENTRAS una lectura está pendiente, EL SISTEMA permite cerrar el detalle; si la respuesta llega después del cierre, actualiza la lista y el badge sin reabrirlo.
- RF-97. SI el marcado de lectura responde `403` o `404`, ENTONCES EL SISTEMA mantiene abierto el detalle con el mensaje, deja la notificación en la lista y no altera el badge.
- RF-98. EL SISTEMA cierra el detalle por fondo solo si la presión y la liberación del puntero ocurren sobre el fondo del diálogo.
- RF-99. EL SISTEMA habilita la redacción cuando la audiencia está definida y, según la modalidad, hay curso o tutor seleccionado; «Todos los tutores» no exige destinatario.
- RF-100. CUANDO se selecciona un tutor, EL SISTEMA lo muestra en un área «Destinatario seleccionado» con su nombre y una acción «Cambiar», además de destacarlo en los resultados.
- RF-101. EL SISTEMA muestra como máximo cuatro coincidencias de tutores y el total de coincidencias; si hay más de cuatro, indica que se refine la búsqueda; no pagina (RF-126).
- RF-102. SI la carga o el filtrado de tutores falla por red, `5xx` o respuesta inválida, ENTONCES EL SISTEMA muestra un mensaje de error, permite reintentar y conserva el texto ingresado (RF-130).
- RF-103. EL SISTEMA ofrece los cursos del año lectivo vigente de todos los estados, recorriendo todas las páginas, sin duplicados por identificador y ordenados por año de cursada, división y turno, con la etiqueta «Inactivo» cuando corresponde.
- RF-104. SI el curso seleccionado deja de ser válido al enviar (`404` o `422` de curso), ENTONCES EL SISTEMA vuelve al formulario, recarga los cursos, conserva el texto y el adjunto y solicita elegir otro curso.
- RF-105. EL SISTEMA recorta del título espacios, tabulaciones y saltos de los extremos, cuenta caracteres Unicode y no acepta un título recortado de más de 80; al pegar o escribir impide el exceso sin truncar silenciosamente e informa el límite. El título se envía recortado.
- RF-106. EL SISTEMA acepta el tipo declarado vacío si la extensión es válida, rechaza un tipo declarado que no corresponda a la extensión, reemplaza el adjunto al elegir otro archivo válido y no lo duplica al volver a elegir el mismo.
- RF-107. EL SISTEMA muestra el tamaño del adjunto en megabytes con un decimal y el nombre truncado visualmente a 60 caracteres con «…», sin ocultar el nombre completo en el nombre accesible.
- RF-108. CUANDO se inicia una descarga, EL SISTEMA deshabilita la acción hasta terminarla, ignora solicitudes repetidas mientras está en curso y, si el servicio no informa nombre, usa «adjunto»; elimina separadores de ruta del nombre.
- RF-109. SI la descarga falla por `5xx` o un error distinto de `401`, `403` o `404`, ENTONCES EL SISTEMA informa que no pudo descargarse y mantiene abierto el detalle.
- RF-110. SI el envío responde `5xx` u otro error no contemplado, ENTONCES EL SISTEMA informa que no pudo completarse, conserva la redacción y permite reintentar sin advertir resultado incierto.
- RF-111. SI el envío responde `413` o el servicio rechaza el tamaño total de la solicitud, ENTONCES EL SISTEMA informa que el adjunto supera el tamaño permitido, conserva la redacción y permite elegir otro archivo.
- RF-112. CUANDO el envío responde con cualquier código `2xx`, EL SISTEMA lo considera exitoso aunque el cuerpo no incluya el identificador.
- RF-113. CUANDO el envío responde `422`, EL SISTEMA vuelve al formulario, asocia cada mensaje a su campo o al paso de audiencia y conserva los valores; los errores de destinatario o curso no borran el texto ni el adjunto.
- RF-114. DESPUÉS de un resultado incierto, EL SISTEMA muestra la advertencia de posible envío y solo permite reintentar mediante una acción explícita rotulada como reintento; no reenvía solo.
- RF-115. CUANDO la persona navega hacia atrás, adelante o a otra ruta con un modal abierto, EL SISTEMA lo cierra sin enviar y descarta el borrador; una lectura o descarga pendiente puede completarse en el servidor.
- RF-116. CUANDO cambia el rol vigente, EL SISTEMA recalcula en la siguiente carga o consulta del badge la opción del menú, el badge y los controles; si deja de ser emisor, cierra el modal de creación sin enviar.
- RF-117. SI la respuesta de la bandeja repite identificadores o incluye `attachmentUrl` cuando no hay adjunto, ENTONCES EL SISTEMA muestra el error de carga sin elementos parciales.
- RF-118. SI la obtención del badge responde `401`, `403`, `5xx`, error de red o respuesta inválida, EL SISTEMA no muestra badge y reintenta en la próxima consulta.
- RF-119. CUANDO se abre el selector de curso, EL SISTEMA muestra una línea de búsqueda con icono de lupa y una lista de hasta cuatro cursos; sin texto muestra los primeros cuatro en el orden de RF-103.
- RF-120. EL SISTEMA actualiza la lista de cursos en cada cambio del texto, sin acción adicional, y considera coincidencias en la etiqueta visible, código, año de cursada, división, ciclo, especialidad, turno y estado, sin distinguir mayúsculas ni acentos.
- RF-121. SI el texto del selector de curso no coincide con ningún curso, ENTONCES EL SISTEMA muestra «No encontramos cursos con ese criterio» y mantiene la búsqueda editable.
- RF-122. SI hay más de cuatro cursos coincidentes, ENTONCES EL SISTEMA muestra los cuatro primeros, informa el total de coincidencias e indica que se refine la búsqueda.
- RF-123. CUANDO se abre el selector de tutor, EL SISTEMA muestra una línea de búsqueda con icono de lupa y el texto «Buscá por nombre, apellido, DNI, CUIL o correo», y una lista de hasta cuatro tutores.
- RF-124. EL SISTEMA dispone del conjunto completo de tutores al abrir el selector y actualiza la lista en cada cambio del texto, comparando sin distinguir mayúsculas ni acentos por nombre, apellido, DNI, CUIL o correo, en coincidencia parcial.
- RF-125. SI el texto del selector de tutor no coincide con ningún tutor, ENTONCES EL SISTEMA muestra «No encontramos tutores con ese criterio» y mantiene la búsqueda editable.
- RF-126. SI hay más de cuatro tutores coincidentes, ENTONCES EL SISTEMA muestra los cuatro primeros ordenados por apellido y nombre, informa el total e indica que se refine la búsqueda.
- RF-127. CUANDO la persona selecciona un curso o tutor de la lista, EL SISTEMA cierra el desplegable, muestra el elemento elegido en el control y conserva la selección mientras la audiencia no cambie.
- RF-128. EL SISTEMA permite operar ambos selectores con teclado: abrir con Enter o Espacio, recorrer con flechas, elegir con Enter y cerrar con Escape, manteniendo el foco en el control.
- RF-129. EL SISTEMA muestra el modal de creación con un ancho mínimo del 70% del viewport en pantallas de 1024 píxeles o más y sin superar el 96%; en pantallas menores usa entre el 92% y el 96% del ancho, sin desbordes horizontales.
- RF-130. MIENTRAS se obtiene el conjunto de tutores, EL SISTEMA muestra un estado de carga y no permite seleccionar; si falla, informa, permite reintentar y no habilita el envío.

## Requisitos no funcionales

- RNF-1. EL SISTEMA permite operar la bandeja, filtros, modales, buscador y formulario únicamente con teclado, con orden de foco lógico.
- RNF-2. EL SISTEMA mantiene el foco dentro del modal abierto, lo ubica en su primer control al abrirlo y lo devuelve al elemento de origen al cerrarlo.
- RNF-3. EL SISTEMA identifica cada campo con etiqueta accesible, anuncia el título del modal y comunica los avisos de resultado y de error a lectores de pantalla.
- RNF-4. EL SISTEMA asocia cada mensaje de validación con su campo y lo presenta en español.
- RNF-5. EL SISTEMA mantiene un contraste mínimo de 4,5:1 en texto y 3:1 en componentes, y objetivos táctiles de al menos 44 por 44 píxeles.
- RNF-6. EL SISTEMA se adapta sin desbordes horizontales entre 320 y 1920 píxeles de ancho, incluido texto sin espacios, con contenido largo desplazable dentro de los modales.
- RNF-7. EL SISTEMA muestra retroalimentación visual en menos de 100 ms desde cada acción y aplica estos máximos: 10 s para bandeja, cursos y tutores; 20 s para descarga; 30 s para envío. Al vencer, informa el fallo y permite reintentar; en el envío, el resultado es incierto (RF-81).
- RNF-8. EL SISTEMA conserva y transporta las fechas en ISO 8601 con offset; `dd/mm/aaaa HH:mm` es solo presentación. El principio 9 de la constitución aplica a los datos persistidos, no al formato de pantalla.
- RNF-9. EL SISTEMA mantiene los textos de interfaz en español y los identificadores internos en inglés; los valores de audiencia son datos del servicio.
- RNF-10. EL SISTEMA no incorpora dependencias externas sin aprobación previa y reutiliza las ya aprobadas.
- RNF-11. EL SISTEMA limita los cambios al módulo de notificaciones, su opción de menú, el badge y los ajustes mínimos de integración: configuración del tamaño de las acciones del servidor, prop opcional del diálogo compartido, búsqueda de tutores en la API de usuarios y retiro de la campana decorativa móvil.
- RNF-12. EL SISTEMA define metadata propia para la ruta del módulo.
- RNF-13. EL SISTEMA cuenta con estados propios de carga y límite de error en el segmento de ruta del módulo.
- RNF-14. EL SISTEMA muestra la bandeja y el badge con el estado que devuelve el servicio en cada consulta, sin reutilizar datos de una carga anterior.
- RNF-15. EL SISTEMA no requiere imágenes nuevas; reutiliza el icono existente `public/icons/ico-bell.svg` para la opción del menú.
- RNF-16. EL SISTEMA no usa `any` ni suprime errores de tipos, y mantiene `pnpm typecheck`, `pnpm lint` y `pnpm build` sin errores.

## Casos límite

- CL-1. Bandeja sin notificaciones: mensaje de bandeja vacía y badge oculto.
- CL-2. Existen notificaciones pero ninguna sin leer: badge oculto y el filtro «No leídas» informa que no hay pendientes.
- CL-3. Una sola notificación sin leer: badge con «1».
- CL-4. 99 notificaciones sin leer: badge con «99»; 100 o más: «99+», con la cantidad exacta en el nombre accesible.
- CL-5. Menú contraído: el badge se ve sobre el icono sin recortarse ni cambiar el alto de la fila.
- CL-6. Menú móvil cerrado: no se muestra ningún otro indicador de no leídas.
- CL-7. La bandeja no se puede obtener o la cuenta no está verificada: sin badge.
- CL-8. El marcado de lectura falla por red: se conserva el estado no leído y se informa; al reabrir se reintenta.
- CL-9. La notificación ya fue leída: no se repite el marcado y se conserva la fecha de lectura original.
- CL-10. La fecha de lectura del servicio difiere de la local: prevalece la del servicio.
- CL-11. Lectura con filtro «No leídas»: el elemento sale de la lista al cerrar y el foco pasa al siguiente visible o al filtro.
- CL-12. El adjunto fue eliminado o es ajeno: la descarga informa que no está disponible sin cerrar el detalle.
- CL-13. Archivo de exactamente 5.000.000 bytes: se acepta; 5.000.001: se rechaza con el límite indicado.
- CL-14. Archivo de cero bytes o con extensión no permitida: se rechaza antes de enviar.
- CL-15. Extensión válida en mayúsculas: se acepta; tipo declarado distinto del permitido: se rechaza.
- CL-16. Archivo con extensión permitida pero contenido no válido: el servicio responde `422` y el mensaje se muestra junto al adjunto.
- CL-17. Se elige un archivo inválido cuando ya había uno válido: se conserva el válido y se informa.
- CL-18. No hay cursos disponibles: no se puede continuar por curso.
- CL-19. La carga de cursos falla: se informa y se permite reintentar sin perder la audiencia elegida.
- CL-20. Selector de tutores sin texto: muestra los primeros cuatro tutores ordenados por apellido y nombre.
- CL-21. Búsqueda de tutores sin resultados: se informa y se permite modificar el texto.
- CL-22. Se filtra, se cierra o se reabre el selector después de elegir tutor: la selección se conserva.
- CL-23. Se elige un tutor no verificado: el envío responde `404` y se vuelve al paso de audiencia sin cerrar el modal.
- CL-24. Envío por curso o a todos los tutores sin destinatarios elegibles: el envío responde `422` y se muestra el mensaje de destinatarios.
- CL-25. Título de 80 caracteres: se acepta; 81: se impide ingresarlos. Título con espacios, tabulaciones o saltos únicamente: se rechaza.
- CL-26. Contenido solo con espacios, tabulaciones o saltos: se rechaza.
- CL-27. Contenido muy extenso o con palabras sin espacios: se muestra completo, ajustado y desplazable sin desborde horizontal.
- CL-28. Nombre de adjunto muy largo: se trunca visualmente sin ocultar el tamaño ni la acción de quitar.
- CL-29. La sesión vence durante el envío: se redirige al inicio de sesión y se descarta el formulario.
- CL-30. Doble confirmación del envío: se ejecuta una sola vez; no se puede cerrar mientras está en curso.
- CL-31. Se cambia la audiencia después de elegir destinatario: se descarta solo esa selección y se conserva la redacción.
- CL-32. La bandeja devuelve un elemento con estructura inválida: se muestra error de carga sin elementos parciales.
- CL-33. Una notificación leída en otro dispositivo: al reingresar o recargar se muestra el estado y la fecha de lectura vigentes; no hay actualización en vivo.
- CL-34. Cambio de rol vigente en la sesión: se recalculan los controles; si deja de ser emisor, se cierra el modal sin enviar.
- CL-35. Envío sin respuesta: se informa resultado incierto y no se reenvía automáticamente.
- CL-36. Intento de cerrar el modal de creación con datos: se pide confirmación de descarte.
- CL-37. El badge mostró un valor y la siguiente consulta falla: el badge se oculta hasta la próxima consulta exitosa.
- CL-38. Conteo desconocido: nombre accesible «Notificaciones», sin número.
- CL-39. Se cierra el detalle con la lectura pendiente: la respuesta posterior actualiza la lista y el badge sin reabrir el modal.
- CL-40. La lectura responde `403` o `404`: el detalle permanece abierto con el mensaje y la lista no cambia.
- CL-41. Presión dentro del contenido y liberación sobre el fondo: el detalle no se cierra.
- CL-42. Audiencia «Todos los tutores»: la redacción se habilita sin destinatario adicional.
- CL-43. Coincidencia parcial por DNI o CUIL: el tutor aparece en la lista.
- CL-44. Dos búsquedas de tutores superpuestas: solo se muestran los resultados de la última.
- CL-45. Error de red o `5xx` en la carga o el filtrado de tutores: mensaje, reintento y texto conservado.
- CL-46. Cursos en varias páginas y curso inactivo: se listan todos, sin duplicados, con la etiqueta «Inactivo».
- CL-47. Curso eliminado o inválido al confirmar: se vuelve al formulario, se recargan cursos y se conserva la redacción.
- CL-48. Título con 84 caracteres en bruto y 80 tras recortar: se acepta y se envía recortado; 81 tras recortar: se bloquea.
- CL-49. Tipo declarado vacío con extensión válida: se acepta; tipo declarado que no corresponde: se rechaza.
- CL-50. Se elige otro archivo válido: reemplaza al anterior; se elige el mismo: no se duplica.
- CL-51. Descarga con `5xx` o clic repetido: mensaje y una sola descarga en curso.
- CL-52. Envío con `5xx` o `413`: mensaje, redacción conservada y reintento permitido.
- CL-53. Envío con `2xx` sin identificador: se considera exitoso.
- CL-54. Resultado incierto: el reintento requiere la acción explícita rotulada y no se ejecuta solo.
- CL-55. Navegación hacia atrás o a otra ruta con modal abierto: se cierra sin enviar y se descarta el borrador.
- CL-56. Bandeja con identificadores repetidos o `attachmentUrl` incoherente: error de carga sin elementos parciales.
- CL-57. Cambio de rol: la siguiente carga oculta la opción y el badge si el rol deja de estar habilitado, y cierra el modal de creación sin enviar.
- CL-58. Fecha inválida en la bandeja: error de carga por estructura inválida.
- CL-59. Reingreso a la bandeja: el filtro vuelve a «Todas».
- CL-60. Selector de curso sin texto: muestra los primeros cuatro cursos.
- CL-61. Búsqueda de curso por código, división o especialidad, con mayúsculas o acentos distintos: encuentra el curso.
- CL-62. Más de cuatro cursos coincidentes: muestra cuatro y el total, e indica refinar.
- CL-63. Búsqueda de curso sin coincidencias: mensaje y texto editable.
- CL-64. Selector de tutor con más de cuatro coincidencias: muestra cuatro, el total e indica refinar.
- CL-65. Búsqueda de tutor por apellido con acentos o mayúsculas distintas: encuentra coincidencias.
- CL-66. Búsqueda de tutor por DNI, CUIL o correo parcial: encuentra coincidencias.
- CL-67. Búsqueda de tutor sin coincidencias: mensaje y texto editable.
- CL-68. Curso o tutor seleccionado y luego filtro con otro texto: la selección visible se conserva hasta cambiarla.
- CL-69. Teclado en los selectores: flechas, Enter y Escape funcionan sin perder el foco.
- CL-70. Modal a 1024 px: ocupa al menos el 70% del ancho; a 320 px: entre 92% y 96%, sin desborde.
- CL-71. Falla la obtención de tutores: mensaje, reintento y envío deshabilitado.

## Fuera de alcance

- Desplegable de campana y barra superior de notificaciones.
- Historial de envíos o seguimiento de entregas del emisor.
- Edición, eliminación, borradores, programación o reenvío de notificaciones.
- Marcar todas como leídas y preferencias de notificación.
- Vista previa de adjuntos dentro de la aplicación; solo descarga.
- Búsqueda, orden y paginación de la bandeja.
- Envío individual a roles distintos de `TUTOR`.
- Selección múltiple de destinatarios individuales.
- Notificaciones en tiempo real o por correo.
- Interceptar la navegación del navegador para conservar borradores.
- Cambios en el servicio, en sus contratos o en sus validaciones.

## Criterios de finalización

- Todos los requisitos funcionales y no funcionales quedan cubiertos por pruebas automatizadas en verde.
- `pnpm test`, `pnpm typecheck`, `pnpm lint` y `pnpm build` terminan sin errores.
- Prueba de extremo a extremo con el servicio real como `TUTOR`, `ADMINISTRATIVO` y `ADMINISTRADOR`: bandeja, filtros, lectura, badge, descarga y las tres modalidades de envío.
- Verificación manual de errores `401`, `403`, `404`, `413`, `422` y `5xx`, de los casos límite de adjunto y de destinatarios sin elegibilidad.
- Verificación del badge en cero, 1, 99, 100 o más, conteo desconocido, menú expandido y contraído, y ausencia de un segundo indicador en móvil.
- Verificación de accesibilidad por teclado y lector de pantalla, y de respuesta visual entre 320 y 1920 píxeles.
- Verificación de los selectores con búsqueda: filtrado en cada tecla, máximo cuatro coincidencias, total/refinar, teclado y mensajes de vacío.
- Verificación del ancho del modal de creación: al menos 70% en 1024 px y 92%–96% en móvil, sin desborde.
- Ninguna modificación fuera del módulo de notificaciones, su opción de menú, su badge y los ajustes mínimos de integración listados en RNF-11.

## Dudas abiertas

Ninguna. Decisiones resueltas con la persona responsable y en la revisión QA: destinatario individual solo `TUTOR`; badge numérico únicamente junto a «Notificaciones», oculto en cero y en conteo desconocido; detalle en modal; filtros «Todas»/«No leídas»; lectura no optimista; título recortado y contado en caracteres Unicode; fechas sin conversión de zona; cursos de todas las páginas del año vigente; selectores de curso y tutor con búsqueda por tecla, máximo cuatro coincidencias y sin paginación; búsqueda de tutores por nombre, apellido, DNI, CUIL y correo; modal de creación amplio; errores `5xx`, `413` e inciertos con redacción conservada; navegación con modal descarta el borrador; sin reintento automático ante resultado incierto.

## Registro de resoluciones QA (2026-11-19)

- Ambigüedades: origen y caída del badge (RF-88, RF-89, RF-118); verificación por servicio (RF-90); nombre accesible (RF-91); resumen y fila accesible (RF-92); fecha inválida (RF-93); desempate de orden (RF-94); vacíos y filtro inicial (RF-95); lectura al cerrar (RF-96, RF-97); cierre por fondo (RF-98); habilitación de redacción (RF-99); tutor seleccionado (RF-100); paginación y errores de tutores (RF-101, RF-102); cursos (RF-103, RF-104); título (RF-105); adjunto (RF-106, RF-107); descarga (RF-108, RF-109); envío (RF-110 a RF-114); navegación y rol (RF-115 a RF-117).
- Contradicciones: permiso de envío (RF-15/RF-78); foco y filtro (RF-44/RF-45); redacción masiva (RF-46/RF-99); cancelación durante envío (RF-72/RF-75); actualización de bandeja (RF-76); orden de cursos (RF-49/RF-103); título (RF-63/RF-64/RF-105); alcance de cambios (RNF-11).
- Constitución: tiempos verificables (RNF-7); frescura como resultado (RNF-14); fechas dato/presentación (RNF-8); assets existentes (RNF-15); alcance de integración (RNF-11); verificación de tipos y calidad (RNF-16).
- **Cambio 2026-11-19b**: modal de creación amplio (RF-129); selectores de curso y tutor con búsqueda por tecla y máximo cuatro coincidencias (RF-119 a RF-128); carga completa de tutores con error y reintento (RF-130); se retira la paginación de tutores (RF-101).
