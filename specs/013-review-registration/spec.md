# Spec 013 — Evaluación de inscripciones

Estado: implementada (2026-11-15)

## Contexto y objetivo

Cuando los tutores envían solicitudes de inscripción, estas llegan al panel del staff en estado `PENDING`. Los miembros del staff (`ADMINISTRATIVO` y `ADMINISTRADOR`) deben evaluar cada solicitud y emitir un dictamen: **aprobar**, **devolver con observaciones**, **reasignar** o **rechazar**.

El objetivo de esta spec es habilitar el módulo **Inscripciones** del menú lateral para el staff, con una vista única que permita recorrer todas las solicitudes (pendientes, observadas, reasignadas, aprobadas y rechazadas), filtrarlas, buscarlas y ordenarlas, ver de forma clara y moderna los datos importantes de cada una, ejecutar las acciones de dictamen y consultar el formulario oficial en PDF con opción de descargarlo o imprimirlo. Además, el dashboard del staff incorpora un contador de solicitudes pendientes que enlaza a la bandeja correspondiente.

Toda acción de cambio de estado exige una alerta de confirmación antes de ejecutarse, para evitar dictámenes accidentales; la aprobación ofrece además elegir entre aprobar en el curso solicitado o reasignar a otro curso, y advierte cuando el curso solicitado está lleno.

La evaluación la realizan únicamente los roles altos; el circuito del tutor (envío, subsanación y respuesta a reasignaciones) queda fuera de alcance.

## Usuarios

- Personas con rol `ADMINISTRATIVO` (secretaría).
- Personas con rol `ADMINISTRADOR`.
- Personas con rol `TUTOR` (no evalúan; la opción de inscripciones les sigue apareciendo como «próximamente»).
- Personas no autenticadas o con sesión vencida que intentan acceder al módulo.
- Personas con un rol no reconocido que intentan acceder por la dirección de la página.

## Historias de usuario

- HU-1. Como administrativo o administrador, quiero ver todas las solicitudes de inscripción en un solo lugar para saber qué trámites requieren mi intervención.
- HU-2. Como administrativo, quiero recorrer las solicitudes por estado (pendientes, observadas, reasignadas, aprobadas, rechazadas) para priorizar el trabajo.
- HU-3. Como administrativo, quiero buscar y filtrar solicitudes por datos del alumno y del curso para encontrar una en particular.
- HU-4. Como administrativo, quiero ordenar las solicitudes por más recientes o más antiguas para seguir el orden que me convenga.
- HU-5. Como administrativo, quiero ver los datos completos de una solicitud en una tarjeta para tomar una decisión informada.
- HU-6. Como administrativo, quiero saber qué certificados fueron adjuntados y poder verlos para validar la documentación.
- HU-7. Como administrativo, quiero abrir el formulario oficial en PDF, descargarlo e imprimirlo para el legajo.
- HU-8. Como administrativo, quiero aprobar una solicitud para reservar la vacante del alumno.
- HU-9. Como administrativo, quiero rechazar una solicitud para desestimarla formalmente.
- HU-10. Como administrativo, quiero devolver una solicitud con observaciones detallando qué falta o falla para que el tutor la corrija.
- HU-11. Como administrativo, quiero reasignar una solicitud de curso indicando el curso y el motivo para ofrecer una vacante alternativa.
- HU-12. Como administrativo o administrador, quiero ver en el dashboard cuántas solicitudes pendientes hay para saber de un vistazo el trabajo por resolver.
- HU-13. Como persona que usa lector de pantalla o teclado, quiero operar el listado, filtros, tarjetas, acciones, alertas de confirmación y el modal del PDF de forma accesible.
- HU-14. Como persona que usa el teléfono, quiero consultar y evaluar solicitudes sin desbordes ni controles inalcanzables.
- HU-15. Como administrativo, quiero confirmar cada dictamen antes de ejecutarlo para evitar acciones accidentales.

## Definiciones

- **Solicitud** o **inscripción**: registro de inscripción enviado por un tutor, identificado por su `id`, con un `status` del ciclo de vida.
- **Estado**: valor del ciclo de vida de la solicitud: `PENDING`, `OBSERVED`, `PROPOSED_REASSIGNMENT`, `APPROVED` o `REJECTED`.
- **Pendiente** (`PENDING`): solicitud lista para ser evaluada por el staff; admite aprobar, devolver con observaciones, reasignar o rechazar.
- **Observada** (`OBSERVED`): solicitud retenida con observaciones que el tutor debe subsanar; el staff no puede dictaminarla mientras esté en este estado.
- **Reasignada** (`PROPOSED_REASSIGNMENT`): solicitud con una propuesta de curso alternativo a la espera de la respuesta del tutor.
- **Aprobada** (`APPROVED`): estado terminal exitoso; la vacante quedó reservada.
- **Rechazada** (`REJECTED`): estado terminal definitivo; el trámite fue desestimado.
- **Dictamen**: acción del staff sobre una solicitud: aprobar, devolver con observaciones, reasignar o rechazar.
- **Bandeja** / **pestaña**: subconjunto de la lista que corresponde a un estado o a la totalidad de las solicitudes.
- **Filtros activos**: al menos un filtro recortado y no vacío.
- **Rol vigente**: rol que devuelve el perfil del servicio; prevalece sobre el rol del token para lo que muestra la interfaz.
- **Curso destino**: curso alternativo al que se propone reasignar, dentro del mismo año lectivo.
- **Certificado**: documento adjunto a una condición especial (salud, inclusión, impedimento de contacto o procesos legales). El servicio no lo expone por separado; solo informa su existencia mediante flags y lo anexa al formulario en PDF.
- **Formulario oficial**: PDF institucional de la inscripción que genera el servicio; incluye los certificados anexados al final.
- **Aviso de resultado**: mensaje interno que informa el resultado de la operación que la persona acaba de realizar.
- **Alerta de confirmación**: aviso que se muestra antes de ejecutar un dictamen, identifica la solicitud y la acción a realizar, y ofrece confirmar o volver atrás.
- **Alerta de elección**: aviso previo a la aprobación que permite elegir entre aprobar en el curso solicitado o reasignar a otro curso.
- **Tutor responsable**: cuenta que envió la solicitud; sus datos de contacto se muestran en el detalle para que el staff pueda comunicarse.

## Requisitos funcionales

### Acceso y navegación

- RF-1. CUANDO el rol vigente es `ADMINISTRATIVO` o `ADMINISTRADOR`, EL SISTEMA habilita la opción «Inscripciones» del menú lateral con destino al módulo de evaluación.
- RF-2. CUANDO el rol vigente es `TUTOR`, EL SISTEMA mantiene «Inscripciones» como no disponible con el rótulo «Próximamente», porque el circuito del tutor queda fuera de alcance.
- RF-3. CUANDO la dirección actual pertenece al módulo de inscripciones, EL SISTEMA marca la opción «Inscripciones» como activa, incluida la pantalla de detalle.
- RF-4. EL SISTEMA determina pantallas y acciones a partir del rol vigente reconciliado con el perfil del servicio; si difiere del rol del token, prevalece el perfil.
- RF-5. SI una persona sin sesión válida accede a una pantalla del módulo, ENTONCES EL SISTEMA redirige al inicio de sesión con el aviso de sesión vencida.
- RF-6. SI el perfil del servicio responde `401`, ENTONCES EL SISTEMA descarta la sesión y redirige al inicio de sesión con el aviso de sesión vencida.
- RF-7. SI el perfil del servicio responde `403`, ENTONCES EL SISTEMA muestra acceso denegado sin exponer datos.
- RF-8. SI el rol vigente no es `ADMINISTRATIVO` ni `ADMINISTRADOR`, ENTONCES EL SISTEMA no muestra la opción de inscripciones y, ante un acceso directo, muestra acceso denegado sin solicitar ni exponer datos.

### Listado: pestañas, filtros, orden y paginación

- RF-9. EL SISTEMA publica la vista de evaluación de inscripciones en `/dashboard/registrations` y el detalle de cada solicitud en `/dashboard/registrations/{registrationId}`.
- RF-10. EL SISTEMA muestra pestañas de estado: «Todas», «Pendientes», «Observadas», «Reasignadas», «Aprobadas» y «Rechazadas».
- RF-11. EL SISTEMA usa «Pendientes» como pestaña inicial; sin parámetro de estado en la dirección, la vista abre en «Pendientes»; «Todas» se representa con el valor `all`.
- RF-12. CUANDO la persona elige una pestaña de estado, EL SISTEMA filtra la lista por ese estado; «Todas» no aplica filtro de estado.
- RF-13. EL SISTEMA permite ordenar las solicitudes por «Más recientes» y «Más antiguas», con «Más recientes» por defecto.
- RF-14. EL SISTEMA ofrece filtros por datos del alumno: DNI (coincidencia exacta, solo dígitos), CUIL (coincidencia exacta, solo dígitos), apellido y nombre (coincidencia parcial, sin distinguir mayúsculas ni tildes).
- RF-15. EL SISTEMA ofrece filtros por datos del curso, cada uno con su opción «Todos/Todas»: año lectivo (año actual o futuro), año de cursada (1 a 6), división (texto, coincidencia parcial), ciclo (Básico/Superior), turno (Mañana/Tarde/Noche) y especialidad (Básica/Informática/Electrónica).
- RF-16. EL SISTEMA permite combinar varios filtros y aplicarlos juntos.
- RF-17. CUANDO la persona escribe en un filtro de texto (apellido, nombre, DNI o CUIL), EL SISTEMA busca en vivo con cada tecla sobre el conjunto ya cargado, sin consultar el servicio por tecla; los filtros de curso (selects) se aplican al cambiar la selección.
- RF-18. EL SISTEMA solo admite dígitos en los campos DNI y CUIL; el campo CUIL agrega automáticamente los guiones con el formato `XX-XXXXXXXX-X` mientras se escribe; al enviar la búsqueda, EL SISTEMA envía solo los dígitos (sin guiones).
- RF-19. CUANDO la persona elige «Limpiar filtros», EL SISTEMA elimina todos los filtros y vuelve a la primera página.
- RF-20. EL SISTEMA no aplica filtros vacíos y conserva los valores escritos mientras la persona edita.
- RF-21. EL SISTEMA refleja el nombre, el apellido, los filtros de curso, la pestaña de estado (`status`, con los valores del enum y `all` para «Todas») y la página en la dirección de la página; el DNI y el CUIL no se reflejan en la dirección y se conservan durante la pestaña.
- RF-22. EL SISTEMA muestra 15 solicitudes por página.
- RF-23. EL SISTEMA muestra controles de paginación en este orden: «Inicio», «Anterior», los números de página (anterior, actual y siguiente), «Siguiente» y «Final»; el número de la página actual es un campo editable que acepta solo dígitos y navega a esa página al presionar Enter.
- RF-24. SI la página solicitada está fuera del rango disponible, ENTONCES EL SISTEMA la ajusta a la última página válida.
- RF-25. SI los metadatos de la lista faltan o son inconsistentes, ENTONCES EL SISTEMA trata la respuesta como inválida, muestra el error y ofrece reintentar, sin inventar totales ni mostrar datos parciales.
- RF-26. MIENTRAS se obtienen los resultados, EL SISTEMA muestra un estado de carga sin filas ficticias.
- RF-27. SI no hay resultados, ENTONCES EL SISTEMA distingue entre «sin solicitudes» y «sin coincidencias» según haya filtros activos; en el segundo caso ofrece limpiar los filtros.
- RF-28. SI la consulta falla, ENTONCES EL SISTEMA muestra el mensaje correspondiente y ofrece reintentar.

### Tarjetas del listado

- RF-29. EL SISTEMA muestra cada solicitud como una tarjeta resumida.
- RF-30. EL SISTEMA muestra en cada tarjeta resumida los datos clave: apellido y nombre del alumno, CUIL del alumno, identificación del curso (código, año y división), estado y fecha de creación.
- RF-31. EL SISTEMA muestra el estado de cada solicitud con un rótulo visible en español.
- RF-32. EL SISTEMA muestra el orden cronológico informado por el servicio.
- RF-33. CUANDO la persona elige una tarjeta, EL SISTEMA abre el detalle completo de esa solicitud.

### Detalle de la solicitud (tarjeta completa)

- RF-34. EL SISTEMA presenta los datos completos de la solicitud en una tarjeta con secciones diferenciadas.
- RF-35. EL SISTEMA muestra el detalle en la versión web en dos columnas: la columna de la izquierda con la información de la solicitud y la columna de la derecha con el estado y los botones de acción («Aprobar», «Devolver con observaciones», «Reasignar» y «Rechazar»), uno debajo del otro.
- RF-36. EL SISTEMA muestra en la versión móvil el estado como un botón flotante con una etiqueta corta del estado en español (`P` Pendiente, `O` Observada, `PR` Propuesta de Reasignación, `A` Aprobada, `R` Rechazada) que, al presionarlo, muestra el nombre completo del estado; debajo de ese botón, otro botón flotante con un icono de acción que, al presionarlo, muestra las acciones disponibles («Aprobar», «Devolver con observaciones», «Reasignar» y «Rechazar»), y se oculta o deshabilita cuando no hay dictámenes disponibles.
- RF-37. EL SISTEMA muestra los datos del alumno: apellido, nombre y CUIL.
- RF-38. EL SISTEMA muestra los datos del curso solicitado: código, año lectivo, año de cursada, división, ciclo, turno y especialidad.
- RF-39. EL SISTEMA muestra el vínculo con el alumno, la institución de origen y si se autoriza el uso de la imagen del alumno en fotos institucionales.
- RF-40. EL SISTEMA muestra los datos del tutor responsable: nombre, apellido, correo electrónico y teléfono.
- RF-41. EL SISTEMA muestra las condiciones especiales declaradas: problema de salud, alumno de inclusión, impedimento de contacto y procesos legales.
- RF-42. CUANDO la solicitud está en `PROPOSED_REASSIGNMENT`, EL SISTEMA muestra el curso propuesto y el motivo de la reasignación.
- RF-43. SI la solicitud tiene observaciones, ENTONCES EL SISTEMA muestra el texto de las observaciones.
- RF-44. SI la solicitud tiene materias adeudadas o documentación faltante, ENTONCES EL SISTEMA las muestra.
- RF-45. EL SISTEMA muestra las fechas de creación y de última actualización con fecha y hora (`DD/MM/AAAA HH:mm`).
- RF-46. SI un dato opcional no está informado, ENTONCES EL SISTEMA muestra «No informado».
- RF-47. EL SISTEMA no muestra datos que el servicio no entregue ni inventa valores.

### Certificados

- RF-48. EL SISTEMA muestra, por cada condición especial con certificado cargado, una descripción que indica que el certificado existe.
- RF-49. EL SISTEMA muestra las condiciones especiales sin certificado como ausentes, sin inventar archivos.
- RF-50. CUANDO el staff elige ver los certificados, EL SISTEMA abre el modal del formulario en PDF, que los anexa al final del documento.

### Formulario oficial en PDF

- RF-51. EL SISTEMA permite al staff abrir el formulario oficial en PDF de cualquier solicitud no eliminada, en cualquier estado.
- RF-52. EL SISTEMA muestra el PDF embebido dentro de un modal.
- RF-53. EL SISTEMA ofrece dentro del modal las acciones «Descargar» e «Imprimir».
- RF-54. CUANDO la persona elige descargar, EL SISTEMA entrega el archivo con el nombre que el servicio indica en la respuesta de descarga.
- RF-55. CUANDO la persona elige imprimir, EL SISTEMA permite imprimir el PDF embebido, con la opción de ajustar al área de impresión para no recortar su contenido.
- RF-56. SI el formulario no se puede generar o la carga falla, ENTONCES EL SISTEMA muestra un mensaje de error sin entregar un archivo ni un PDF parcial.

### Dictamen: aprobar

- RF-57. CUANDO la solicitud está en `PENDING`, EL SISTEMA ofrece la acción «Aprobar».
- RF-58. CUANDO el staff elige «Aprobar», EL SISTEMA muestra una alerta de elección con dos opciones: «Aprobar en el curso solicitado» y «Reasignar a otro curso».
- RF-59. CUANDO el staff elige «Aprobar en el curso solicitado», EL SISTEMA solicita los campos opcionales (observaciones, materias adeudadas y documentación faltante) y luego muestra la alerta de confirmación de la aprobación.
- RF-60. CUANDO el staff elige «Reasignar a otro curso», EL SISTEMA abre el flujo de reasignación (selección del curso de destino y motivo, más los campos opcionales) y muestra la alerta de confirmación correspondiente.
- RF-61. CUANDO la aprobación es exitosa, EL SISTEMA muestra el aviso de resultado y revalida la lista, el detalle y el contador del dashboard; la vacante queda reservada y las solicitudes hermanas del mismo ciclo quedan rechazadas por el servicio.
- RF-62. SI el servicio rechaza la aprobación porque el curso solicitado está lleno (`422` con el error en `course`), ENTONCES EL SISTEMA muestra una alerta que sugiere reasignar y ofrece abrir el flujo de reasignación, con prioridad sobre el tratamiento genérico de `422`.
- RF-63. SI la solicitud no está en `PENDING`, ENTONCES EL SISTEMA muestra el conflicto de estado sin alterar datos.

### Dictamen: rechazar

- RF-64. CUANDO la solicitud está en `PENDING`, EL SISTEMA ofrece la acción «Rechazar».
- RF-65. EL SISTEMA recolecta en el formulario de rechazo: observaciones, materias adeudadas (lista) y documentación faltante; todas opcionales.
- RF-66. CUANDO el staff confirma el rechazo, EL SISTEMA muestra la alerta de confirmación antes de ejecutarlo.
- RF-67. CUANDO el rechazo es exitoso, EL SISTEMA muestra el aviso de resultado y revalida la lista, el detalle y el contador del dashboard; la solicitud queda en `REJECTED`.

### Dictamen: devolver con observaciones

- RF-68. CUANDO la solicitud está en `PENDING`, EL SISTEMA ofrece la acción «Devolver con observaciones».
- RF-69. EL SISTEMA exige en el formulario un texto de observaciones obligatorio que detalle qué falta o qué está mal.
- RF-70. SI las observaciones están vacías, ENTONCES EL SISTEMA muestra el error junto al campo y no envía la solicitud.
- RF-71. CUANDO el staff confirma la devolución, EL SISTEMA muestra la alerta de confirmación antes de ejecutarla.
- RF-72. CUANDO la devolución es exitosa, EL SISTEMA muestra el aviso de resultado y revalida la lista, el detalle y el contador del dashboard; la solicitud queda en `OBSERVED` a la espera del tutor.

### Dictamen: reasignar

- RF-73. CUANDO la solicitud está en `PENDING`, EL SISTEMA ofrece la acción «Reasignar».
- RF-74. EL SISTEMA exige en el formulario de reasignación seleccionar un curso de destino y un motivo justificado obligatorio.
- RF-75. EL SISTEMA ofrece en el selector los cursos activos del mismo año lectivo de la solicitud que tienen cupo disponible.
- RF-76. SI no hay cursos disponibles con cupo en el año lectivo, ENTONCES EL SISTEMA muestra el mensaje correspondiente y no permite proponer la reasignación.
- RF-77. SI falta el curso de destino o el motivo, ENTONCES EL SISTEMA muestra el error junto al campo y no envía la solicitud.
- RF-78. EL SISTEMA recolecta además, de forma opcional: observaciones, materias adeudadas (lista) y documentación faltante.
- RF-79. CUANDO el staff confirma la reasignación, EL SISTEMA muestra la alerta de confirmación antes de ejecutarla.
- RF-80. CUANDO la reasignación es exitosa, EL SISTEMA muestra el aviso de resultado y revalida la lista, el detalle y el contador del dashboard; la solicitud queda en `PROPOSED_REASSIGNMENT` a la espera del tutor.
- RF-81. SI el curso destino está lleno, ENTONCES EL SISTEMA muestra la lista de cursos disponibles devuelta por el servicio para reintentar.
- RF-82. SI el curso destino es el mismo curso, está inactivo, pertenece a otro año lectivo, o el alumno ya tiene una solicitud activa en ese curso, ENTONCES EL SISTEMA muestra el error del servicio correspondiente.

### Confirmaciones y alertas de dictamen

- RF-83. CUANDO el staff inicia un dictamen, EL SISTEMA no lo ejecuta de inmediato: muestra una alerta de confirmación que identifica la solicitud (identificador, alumno y curso) y describe la acción a realizar.
- RF-84. EL SISTEMA ofrece en cada alerta de confirmación dos opciones: confirmar la acción y volver atrás.
- RF-85. CUANDO el staff elige volver atrás, EL SISTEMA cierra la alerta sin ejecutar el dictamen ni alterar datos.
- RF-86. CUANDO el staff confirma, EL SISTEMA envía el dictamen al servicio y muestra el resultado.
- RF-87. EL SISTEMA distingue la alerta de elección (solo en «Aprobar») de la alerta de confirmación (todos los dictámenes).
- RF-88. CUANDO el staff propone una reasignación por cualquier vía (la acción «Reasignar» o la opción «Reasignar a otro curso»), EL SISTEMA advierte en la alerta de confirmación que, si el tutor acepta la propuesta, esta se concreta y pasa a ser una inscripción aprobada.
- RF-89. SI el servicio responde `409` al confirmar (la solicitud cambió de estado en otra sesión), ENTONCES EL SISTEMA cierra la alerta, muestra el conflicto y refresca el detalle al estado vigente.

### Acciones y errores transversales

- RF-90. EL SISTEMA muestra las acciones disponibles según el estado de la solicitud; fuera de `PENDING` no ofrece dictámenes, muestra el motivo de la indisponibilidad y oculta o deshabilita el botón de acciones del detalle.
- RF-91. EL SISTEMA ubica las acciones de dictamen en la pantalla de detalle; tras una acción exitosa, permanece en el detalle mostrando el nuevo estado y el aviso de resultado.
- RF-92. SI una acción responde `422`, ENTONCES EL SISTEMA muestra los errores junto a los campos y un aviso general para los errores desconocidos, conservando los valores escritos.
- RF-93. SI una acción responde `403`, ENTONCES EL SISTEMA informa que la operación no está permitida.
- RF-94. SI una acción responde `401`, ENTONCES EL SISTEMA descarta la sesión y redirige al inicio de sesión con el aviso de sesión vencida.
- RF-95. SI una acción sufre error de red o se agota el tiempo de espera, ENTONCES EL SISTEMA muestra un mensaje general, conserva los valores y permite reintentar.
- RF-96. MIENTRAS una acción se envía, EL SISTEMA evita envíos repetidos y muestra el estado de envío.
- RF-97. CUANDO una respuesta presenta más de un error aplicable, EL SISTEMA respeta la precedencia `401`, `403`, `404`, `422`, `5xx` y red.
- RF-98. EL SISTEMA mantiene los avisos de resultado visibles 4 segundos y los errores hasta su cierre manual o reintento.
- RF-99. EL SISTEMA no permite acciones masivas ni dictámenes sobre varias solicitudes a la vez.

### Contador del dashboard

- RF-100. CUANDO el rol vigente es `ADMINISTRATIVO` o `ADMINISTRADOR`, EL SISTEMA muestra en el dashboard un contador de solicitudes pendientes (`PENDING`).
- RF-101. EL SISTEMA hace que el contador enlace a la pestaña «Pendientes» del módulo (`/dashboard/registrations?status=PENDING`).
- RF-102. EL SISTEMA muestra en el contador el total real de solicitudes pendientes, obtenido del total de la bandeja de pendientes.
- RF-103. SI el conteo no puede obtenerse, ENTONCES EL SISTEMA no muestra un número falso y omite o neutraliza el contador.

## Requisitos no funcionales

- RNF-1. Consistencia visual: misma paleta institucional, fondos claros, superficies blancas, bordes, radios, sombras, espaciados, tipografía y jerarquía que Cursos, Alumnos y Gestión de usuarios; sin colores ni estilos nuevos.
- RNF-2. Reutilización por composición de las piezas existentes de tabla, tarjetas, buscador, filtros, paginación, badges, menús, avisos, diálogos, esqueletos y estados; sin variantes duplicadas.
- RNF-3. Contraste mínimo de 4.5:1 en texto y de 3:1 en indicadores y bordes no textuales; foco visible en todos los controles.
- RNF-4. Accesibilidad: operación completa por teclado; roles, nombres accesibles, estado activo, expandido, deshabilitado y ocupado anunciados; mensajes de error y resultado anunciados; foco devuelto al cerrar menús, diálogos, alertas de confirmación, botones flotantes y el modal del PDF.
- RNF-5. Responsive de 320 a 1920 px: sin desborde horizontal de página, contenido desplazable donde corresponda, controles alcanzables y texto al 200 % sin pérdida de contenido.
- RNF-6. Estados de carga, vacío, error, acceso denegado y resultados visualmente distinguibles y accesibles.
- RNF-7. Privacidad: nunca exponer token, contraseñas ni datos sensibles en la dirección de la página, HTML, almacenamiento del navegador, consola o notificaciones; el DNI y el CUIL de los filtros no se reflejan en la dirección.
- RNF-8. Fechas: los datos se reciben en ISO del servicio y los instantes se presentan en `DD/MM/AAAA HH:mm`.
- RNF-9. Sin caché compartida entre usuarios: los datos del módulo se generan por sesión y se revalidan después de una escritura.
- RNF-10. Sin dependencias externas nuevas.
- RNF-11. Cada pantalla del módulo tiene título y descripción propios.
- RNF-12. Cada segmento del módulo ofrece estado de carga y límite de error con reintento.
- RNF-13. Las acciones de escritura bloquean envíos repetidos y muestran indicador de envío.
- RNF-14. La reutilización de piezas de Cursos, Alumnos y Gestión de usuarios es por composición; si una pieza compartida debe cambiar, el cambio es retrocompatible y se valida con regresión de esos módulos.
- RNF-15. Textos de interfaz en español e identificadores técnicos en inglés, conforme a la constitución.
- RNF-16. Los formularios conservan los valores escritos ante errores de validación o de red.
- RNF-17. Todas las respuestas JSON del servicio se procesan con el sobre `{data, message, errors}` y los errores se traducen de forma uniforme.
- RNF-18. Toda imagen o icono nuevo se sirve con la optimización del framework y se declara en el plan con carpeta, descripción y nombre ideal.
- RNF-19. El formulario en PDF es la única respuesta binaria del módulo (excepción al sobre JSON) y se obtiene y previsualiza por la capa centralizada de API, sin `fetch` directo en componentes de UI.

## Casos límite

- CL-1. La lista está vacía y no hay filtros: se muestra el estado de «sin solicitudes».
- CL-2. Los filtros no devuelven coincidencias: se muestra el estado de «sin coincidencias» con opción de limpiar.
- CL-3. Filtro de DNI o CUIL con letras, puntos, espacios o guiones: no se ingresan en el campo (solo dígitos) y no se busca con caracteres inválidos.
- CL-4. Filtros escritos con mayúsculas: se aplican igual (sin distinguir mayúsculas ni tildes en nombres).
- CL-5. La página solicitada es cero, negativa o no numérica: se normaliza a la primera página.
- CL-6. La página solicitada supera la última: se ajusta a la última válida.
- CL-7. Los metadatos de la lista faltan o son inconsistentes: error con reintento, sin totales inventados.
- CL-8. Una respuesta anterior llega después de un cambio de filtro, pestaña o página (incluso por la búsqueda en vivo): se descarta y prevalece el estado más reciente.
- CL-9. Una solicitud tiene un dato opcional ausente: se muestra «No informado».
- CL-10. Una solicitud está observada: no se ofrecen dictámenes y se muestra la razón.
- CL-11. Una solicitud está reasignada: se muestra el curso propuesto y el motivo; no se ofrecen dictámenes.
- CL-12. Una solicitud está aprobada o rechazada: no se ofrecen dictámenes (estado terminal).
- CL-13. Se intenta aprobar un curso lleno: el servicio responde `422` y el sistema muestra una alerta que sugiere reasignar y ofrece abrir el flujo.
- CL-14. Se intenta devolver con observaciones sin texto: error local junto al campo y no se envía.
- CL-15. Se intenta reasignar sin curso o sin motivo: error local y no se envía.
- CL-16. El curso destino elegido queda lleno: el servicio devuelve los cursos disponibles y se muestran para reintentar.
- CL-17. Se elige el mismo curso, uno inactivo o de otro año como destino: se muestra el error del servicio.
- CL-18. Doble clic o doble Enter en una acción o en una confirmación: se envía una sola operación.
- CL-19. La red se corta o el servicio tarda durante una acción: mensaje general, valores conservados y reintento.
- CL-20. La sesión vence durante una carga o una acción: se descarta la sesión y se redirige con el aviso de sesión vencida.
- CL-21. El rol cambia mientras la persona está en el módulo: la siguiente solicitud responde `403` o `401` y se recalcula el acceso.
- CL-22. El formulario en PDF no se puede generar: se muestra el error sin entregar archivo.
- CL-23. Una condición especial tiene certificado cargado: se muestra su descripción y se accede vía el formulario PDF.
- CL-24. Una condición especial no tiene certificado: se muestra como ausente.
- CL-25. El contador del dashboard no puede obtener el total: no se muestra un número falso.
- CL-26. Dos pestañas con filtros o páginas distintas: cada una conserva su estado; una mutación en una no altera la otra hasta que se refresque.
- CL-27. Se elige «Aprobar» y luego «Volver atrás» en la alerta de elección o de confirmación: no se ejecuta ningún dictamen ni se altera nada.
- CL-28. Se elige «Reasignar a otro curso»: se abre el flujo de reasignación (curso, motivo y opcionales) y se muestra la confirmación correspondiente.
- CL-29. Se propone una reasignación por cualquier vía: la alerta de confirmación advierte que, si el tutor acepta, pasa a inscripción aprobada.
- CL-30. Se rechaza o se devuelve con observaciones y se vuelve atrás: no se ejecuta y la solicitud conserva su estado.
- CL-31. El selector de reasignación queda vacío (ningún curso activo del año tiene cupo): se muestra el mensaje y no se permite proponer la reasignación.
- CL-32. Se confirma un dictamen y el servicio responde `409` porque la solicitud cambió de estado: se cierra la alerta, se muestra el conflicto y se refresca el detalle.
- CL-33. Se escribe o pega un CUIL con separadores: el campo conserva solo los dígitos y aplica los guiones automáticos; al enviar se mandan solo los dígitos.
- CL-34. El tutor responsable no tiene datos o el servicio no los devuelve: se muestra «No informado» en esos datos y el resto del detalle se conserva.

## Fuera de alcance

- El circuito del tutor: envío de solicitudes, edición/subsanación y respuesta a reasignaciones.
- Crear inscripciones en nombre de tutores.
- Editar los datos de una solicitud.
- Restaurar solicitudes eliminadas o revertir estados terminales.
- Acciones masivas o dictámenes sobre varias solicitudes a la vez.
- Un endpoint individual para cada certificado; los certificados se ven únicamente dentro del formulario en PDF.
- Notificaciones a tutores sobre dictámenes o reasignaciones.
- Reportes institucionales distintos del formulario de la inscripción.
- Cambios en el backend para habilitar funcionalidades nuevas.
- Duplicar componentes de Cursos, Alumnos o Gestión de usuarios o introducir una identidad visual distinta.

## Criterios de finalización

- Todos los requisitos funcionales verificados con pruebas y recorridos de extremo a extremo.
- Recorrido del staff cubierto: bandejas por estado, búsqueda en vivo, filtros, orden, paginación (con página editable), detalle en dos columnas (web) y con botones flotantes (móvil), tutor responsable, certificados, formulario en PDF (ver, descargar e imprimir) y los cuatro dictámenes —aprobar (con su alerta de elección y la alerta de curso lleno), rechazar, devolver con observaciones y reasignar— cada uno con su alerta de confirmación y su opción de volver atrás.
- Recorrido del contador del dashboard cubierto: visible solo para los roles altos y enlazando a «Pendientes».
- Los requisitos no funcionales verificados: contraste, teclado, lector de pantalla, responsive, texto al 200 % y privacidad.
- La suite de pruebas, el linter y la compilación en verde, sin dependencias nuevas.
- Sin errores de consola en los recorridos principales.
- Sin regresiones en Cursos, Alumnos, Gestión de usuarios, menú lateral, inicio de sesión, registro ni recuperación.
- Imágenes e iconos nuevos declarados en el plan con carpeta, descripción y nombre ideal.
- Documentación de la spec y memoria del proyecto actualizadas al cierre.

## Dudas abiertas

- Sin dudas abiertas.
- Notas de backend registradas: (a) no existe endpoint individual para certificados, por lo que se muestran flags y se accede vía el formulario en PDF; (b) el contador del dashboard se deriva del total de la bandeja de pendientes; (c) el formulario en PDF es la única respuesta binaria del módulo (excepción al sobre `{data, message, errors}`); (d) los datos del tutor responsable no vienen en el recurso de inscripción y se obtienen de `GET /api/students/{student}/tutor` (roles altos); (e) el detalle de la inscripción se obtiene de `GET /api/registrations/{id}` (mismo recurso del listado).
