# Spec 015 — Reportes del personal

Estado: aprobada

## Contexto y objetivo

Los miembros del personal con roles altos necesitan generar y descargar reportes oficiales desde el panel de gestión para consultar información consolidada y obtener los archivos institucionales correspondientes sin depender de procesos manuales fuera del sistema.

El objetivo de esta spec es habilitar el módulo **Reportes** para que el personal autorizado pueda seleccionar el reporte disponible según su rol, definir los filtros que el servicio permite, obtener una vista previa del resultado y descargar el archivo generado. El acceso al módulo se habilita desde el menú lateral para `ADMINISTRATIVO` y `ADMINISTRADOR`.

Quedan incluidos en este módulo: (1) el **listado de alumnos inscriptos** (alumnos con inscripción aceptada), disponible para `ADMINISTRATIVO` y `ADMINISTRADOR`, con filtros y descarga en formato de planilla (XLSX); y (2) el **padrón de personal**, disponible solo para `ADMINISTRADOR`, con descarga en formato PDF.

Queda fuera de este módulo el reporte de **formulario de inscripción** de una inscripción específica, que ya se encuentra disponible desde el detalle de cada inscripción en el módulo correspondiente.

## Usuarios

- Personas con rol `ADMINISTRATIVO` (secretaría): pueden acceder al módulo de Reportes y generar el listado de alumnos inscriptos.
- Personas con rol `ADMINISTRADOR`: pueden acceder al módulo de Reportes y generar el listado de alumnos inscriptos y el padrón de personal.
- Personas con rol `TUTOR`: no acceden a este módulo.
- Personas sin sesión válida, con sesión vencida o con un rol no autorizado que intentan acceder al módulo.

## Historias de usuario

- HU-1. Como administrativo o administrador, quiero acceder al módulo de Reportes desde el menú lateral para generar los reportes que tengo permitidos.
- HU-2. Como administrativo o administrador, quiero filtrar el listado de alumnos inscriptos por los criterios disponibles para acotar el resultado antes de revisarlo o descargarlo.
- HU-3. Como administrativo o administrador, quiero ver una vista previa del listado de alumnos inscriptos antes de descargarlo para confirmar que contiene la información que necesito.
- HU-4. Como administrativo o administrador, quiero descargar el listado de alumnos inscriptos con los filtros aplicados para obtener el archivo oficial en formato de planilla.
- HU-5. Como administrador, quiero generar y previsualizar el padrón de personal para revisar la información del personal de rol alto antes de descargarlo.
- HU-6. Como administrador, quiero descargar el padrón de personal en PDF para contar con el documento oficial.
- HU-7. Como administrador, quiero elegir de forma clara entre los reportes disponibles para trabajar con el que necesito sin confusiones.
- HU-8. Como administrativo, quiero ingresar directamente al reporte de alumnos inscriptos (el único disponible para mi rol) sin pasos adicionales innecesarios.
- HU-9. Como persona que usa teclado, lector de pantalla o un dispositivo móvil, quiero operar los filtros, la selección de reporte, la vista previa y la descarga de forma accesible y cómoda.

## Definiciones

- **Reporte**: documento institucional generado por el servicio a partir de los datos vigentes, disponible para su vista previa y descarga según el rol del usuario.
- **Listado de alumnos inscriptos**: reporte de las inscripciones aceptadas que cumplen los filtros aplicados, destinado a consulta y descarga en formato de planilla (XLSX).
- **Padrón de personal**: reporte del personal de rol alto vigente, destinado a consulta y descarga en formato PDF; disponible solo para administradores.
- **Filtros**: criterios opcionales que acotan el contenido del listado de alumnos inscriptos (año lectivo, año de estudio, turno y especialidad), según lo que el servicio permite.
- **Aplicar filtros**: acción explícita de confirmar los filtros seleccionados mediante el botón de búsqueda/generación para producir una vista previa.
- **Filtros aplicados**: conjunto de filtros vigentes confirmados mediante la acción de aplicar filtros y utilizados para generar la vista previa y la descarga asociada.
- **Artefacto generado**: archivo producido por el servicio para una vista previa (XLSX o PDF) que se utiliza tanto para mostrar la vista previa como para la descarga mientras sea el resultado vigente.
- **Vista previa**: representación en pantalla del artefacto generado con los filtros aplicados (o sin filtros, en el padrón), mostrada antes o junto a la posibilidad de descarga para que la persona verifique el resultado.
- **Vista previa vigente**: última vista previa generada correctamente para el reporte seleccionado y no descartada, cuyo artefacto está disponible para descarga.
- **Vista previa reducida**: vista previa del listado de alumnos inscriptos que muestra en una tabla las mismas columnas y datos del reporte, limitada a las primeras 20 filas en el orden provisto por el servicio, acompañada de una indicación para descargar el documento cuando existan más resultados.
- **Reintento**: acción mediante la cual la persona solicita repetir la misma operación de generación con los mismos filtros aplicados vigentes (para el listado de alumnos inscriptos) o la misma generación sin filtros (para el padrón de personal), según corresponda; en fallos de descarga, repite la entrega/descarga del mismo artefacto vigente cuando este existe y es válido.
- **Rol vigente**: rol que determina qué reportes puede ver y generar la persona en el módulo.

## Requisitos funcionales

### Acceso y navegación

- RF-1. CUANDO el rol vigente es `ADMINISTRATIVO` o `ADMINISTRADOR`, EL SISTEMA habilita la opción «Reportes» del menú lateral con destino al módulo de reportes.
- RF-2. CUANDO el rol vigente es `TUTOR`, EL SISTEMA no habilita el acceso al módulo de reportes desde el menú lateral.
- RF-3. CUANDO la dirección actual pertenece al módulo de reportes, EL SISTEMA marca la opción «Reportes» del menú lateral como activa.
- RF-4. SI una persona sin sesión válida accede al módulo de reportes, ENTONCES EL SISTEMA redirige al inicio de sesión con el aviso de sesión vencida.
- RF-5. SI el rol vigente no es `ADMINISTRATIVO` ni `ADMINISTRADOR` (incluido `TUTOR`), ENTONCES EL SISTEMA no muestra contenido del módulo y, ante un acceso directo, muestra acceso denegado sin exponer datos de reportes.
- RF-6. SI una persona con rol `ADMINISTRATIVO` intenta acceder al padrón de personal, ENTONCES EL SISTEMA impide el acceso y muestra acceso denegado sin exponer datos de ese reporte.

### Selección del reporte según el rol

- RF-7. CUANDO el rol vigente es `ADMINISTRADOR`, EL SISTEMA muestra los dos reportes disponibles en el módulo: «Listado de alumnos inscriptos» y «Padrón de personal».
- RF-8. CUANDO el rol vigente es `ADMINISTRADOR`, EL SISTEMA permite elegir de forma clara qué reporte generar y previsualizar mediante un control segmentado visible cuando hay más de un reporte disponible.
- RF-9. CUANDO el rol vigente es `ADMINISTRADOR` cambia la selección de reporte, EL SISTEMA descarta la vista previa, el artefacto, los mensajes y el estado del reporte anterior y presenta el estado inicial del reporte seleccionado sin mezclar resultados. CUANDO el administrador vuelve a un reporte previamente seleccionado, EL SISTEMA presenta su estado inicial y requiere la generación correspondiente (automática para el padrón de personal; mediante aplicación de filtros para el listado de alumnos inscriptos). SI la generación automática del padrón falla o supera el tiempo de espera, ENTONCES EL SISTEMA muestra un estado de error con el mensaje correspondiente y ofrece una acción de reintento manual que repite la misma generación del padrón (sin filtros), sin realizar reintentos automáticos en bucle.
- RF-10. CUANDO el rol vigente es `ADMINISTRATIVO`, EL SISTEMA muestra directamente el reporte «Listado de alumnos inscriptos» sin exigir la selección de un tipo de reporte.

### Listado de alumnos inscriptos: filtros

- RF-11. EL SISTEMA ofrece, para el listado de alumnos inscriptos, filtros opcionales y combinables: año lectivo (entero de 4 dígitos, con opciones correspondientes a los años lectivos existentes en cursos vigentes permitidos por el servicio), año de estudio (1 a 6), turno (Mañana, Tarde, Noche; correspondientes a los valores admitidos por el servicio) y especialidad (Básica, Informática, Electrónica; correspondientes a los valores admitidos por el servicio).
- RF-12. EL SISTEMA permite combinar los filtros del listado de alumnos inscriptos y no exige completar todos los filtros para generar la vista previa.
- RF-13. EL SISTEMA presenta cada filtro con sus opciones específicas disponibles en español y una opción «Todos»/«Todas» (o equivalente) que significa no aplicar ese criterio. SI un criterio no tiene opciones específicas disponibles, ENTONCES EL SISTEMA presenta únicamente la opción «Todos»/«Todas» seleccionable para ese criterio y muestra un mensaje informativo visible: «No hay opciones disponibles para este criterio.»
- RF-14. CUANDO la persona confirma la aplicación de filtros válidos mediante el botón de búsqueda/generación, EL SISTEMA toma esos valores como filtros aplicados y genera la vista previa y el artefacto correspondiente a esos filtros. EL SISTEMA mantiene el botón de búsqueda/generación deshabilitado mientras exista al menos un criterio en estado inválido o no determinable, o mientras haya una generación en curso; cuando todos los criterios se encuentran en estado válido (incluido «Todos»/«Todas» como ausencia de restricción) y no hay una generación en curso, EL SISTEMA habilita el botón de búsqueda/generación.
- RF-15. SI la persona intenta aplicar un valor de filtro no válido o no admitido por el servicio, ENTONCES EL SISTEMA no genera una vista previa inválida, conserva los valores ingresados para su corrección y muestra el mensaje de error provisto por el servicio cuando esté disponible; en errores de validación de filtros, asocia el mensaje al filtro correspondiente y/o lo presenta de forma comprensible. La descarga permanece asociada a la última vista previa válida/vigente, si existe.
- RF-16. CUANDO la persona modifica las entradas de los filtros después de haber generado una vista previa, EL SISTEMA no reemplaza la vista previa mostrada ni su artefacto hasta que la persona confirme nuevamente la aplicación de los filtros.
- RF-17. EL SISTEMA ofrece una acción «Limpiar filtros». CUANDO la persona activa «Limpiar filtros», EL SISTEMA restablece todos los filtros a su opción «Todos»/«Todas» sin disparar automáticamente una nueva generación, y conserva la última vista previa generada, su artefacto, los filtros aplicados vigentes y la posibilidad de descarga hasta que se genere una nueva vista previa o se cambie de reporte.
- RF-18. EL SISTEMA considera «Todos»/«Todas» como ausencia de restricción para un criterio y permite generar el reporte cuando los criterios se encuentran en estado válido, incluso si un criterio no tiene opciones específicas disponibles y permanece en «Todos»/«Todas». SI un criterio se encuentra en estado inválido o no determinable, ENTONCES EL SISTEMA no permite generar el reporte, mantiene deshabilitado el botón de búsqueda/generación mientras persista esa condición y muestra un mensaje de error asociado al criterio afectado.

### Listado de alumnos inscriptos: vista previa

- RF-19. CUANDO la persona confirma filtros válidos para el listado de alumnos inscriptos, EL SISTEMA genera y muestra una vista previa del reporte con los filtros aplicados.
- RF-20. EL SISTEMA muestra la vista previa del listado de alumnos inscriptos como una tabla en pantalla con las mismas 17 columnas y en el mismo orden que el archivo descargable: Nombre, Apellido, DNI, CUIL, Fecha de nacimiento, Domicilio, Año lectivo, Año de estudio, División, Turno, Carrera, Nombre del tutor, Apellido del tutor, DNI del tutor, CUIL del tutor, Email del tutor, Teléfono del tutor. Los datos mostrados corresponden al contenido del resultado obtenido y los datos faltantes o vacíos se representan como `-`.
- RF-21. EL SISTEMA limita la vista previa del listado de alumnos inscriptos a las primeras 20 filas visibles, respetando el orden provisto por el servicio.
- RF-22. SI el listado de alumnos inscriptos contiene más resultados que las 20 filas visibles, ENTONCES EL SISTEMA muestra un mensaje visible que indica que, para ver más detalles, se debe descargar el documento.
- RF-23. SI el listado de alumnos inscriptos no contiene más resultados que las 20 filas visibles, ENTONCES EL SISTEMA no muestra el mensaje de descarga para ver más detalles.
- RF-24. SI no hay alumnos inscriptos que cumplan los filtros aplicados, ENTONCES EL SISTEMA muestra una vista previa vigente en estado vacío dentro del área de vista previa: la tabla con los encabezados de las 17 columnas, sin filas de datos y sin datos inventados, junto al mensaje visible «No se encontraron alumnos inscriptos para los filtros aplicados.»
- RF-25. MIENTRAS se genera la vista previa del listado de alumnos inscriptos, EL SISTEMA muestra un estado de carga visible y evita que la persona interprete datos anteriores como el nuevo resultado.
- RF-26. EL SISTEMA presenta el área de vista previa tabular con desplazamiento interno vertical y horizontal para recorrer el contenido sin desbordar el módulo, sin controles de zoom.

### Listado de alumnos inscriptos: descarga

- RF-27. CUANDO existe una vista previa vigente con artefacto generado para el listado de alumnos inscriptos (incluido el estado vacío sin resultados), EL SISTEMA ofrece un botón de descarga ubicado debajo de la vista previa.
- RF-28. CUANDO la persona solicita la descarga del listado de alumnos inscriptos, EL SISTEMA entrega el archivo en formato de planilla (XLSX) reutilizando el artefacto generado de la vista previa vigente, correspondiente a los mismos filtros aplicados.
- RF-29. MIENTRAS no exista una vista previa vigente con artefacto generado para el listado de alumnos inscriptos, EL SISTEMA no ofrece una acción de descarga para ese reporte.
- RF-30. SI la descarga del listado de alumnos inscriptos falla, ENTONCES EL SISTEMA muestra un mensaje de error comprensible, conserva la vista previa vigente, los filtros aplicados y la posibilidad de reintentar, y no entrega un archivo incompleto o incorrecto. CUANDO la persona activa el reintento, EL SISTEMA repite la entrega/descarga del mismo artefacto vigente cuando existe y es válido; si no existe un artefacto vigente válido, EL SISTEMA repite la misma generación con los mismos filtros aplicados vigentes.

### Padrón de personal: vista previa y descarga

- RF-31. CUANDO el rol vigente es `ADMINISTRADOR` y selecciona el reporte «Padrón de personal», EL SISTEMA genera automáticamente la vista previa y el artefacto del padrón sin requerir filtros ni acción previa, dado que el servicio no define criterios de filtrado para este reporte. SI la generación automática falla o supera el tiempo de espera, ENTONCES EL SISTEMA muestra un estado de error con el mensaje correspondiente y ofrece una acción de reintento manual que repite la misma generación del padrón (sin filtros), sin realizar reintentos automáticos en bucle.
- RF-32. CUANDO se genera la vista previa del padrón de personal, EL SISTEMA muestra una previsualización del documento PDF dentro del módulo, con desplazamiento interno vertical y horizontal y controles de zoom (acercar, alejar y ajuste al ancho o a la página) dentro del área de vista previa. El documento del padrón corresponde a las 7 columnas provistas por el servicio, en este orden: Apellido, Nombre, Email, DNI, Rol, Fecha de alta, Última modificación.
- RF-33. SI el padrón de personal no contiene registros, ENTONCES EL SISTEMA muestra la vista previa vigente del documento PDF generado en ese estado (sin registros), de forma consistente con el resultado entregado por el servicio.
- RF-34. CUANDO existe una vista previa vigente con artefacto generado del padrón de personal (incluido el estado sin registros), EL SISTEMA ofrece un botón de descarga ubicado debajo de la vista previa.
- RF-35. CUANDO la persona solicita la descarga del padrón de personal, EL SISTEMA entrega el archivo en formato PDF reutilizando el artefacto generado de la vista previa vigente.
- RF-36. SI el artefacto del padrón fue recibido correctamente con contenido mayor a 0 kB pero la previsualización no puede mostrarse, ENTONCES EL SISTEMA informa el problema de visualización y mantiene disponible la acción de descarga del artefacto recibido.
- RF-37. SI no se recibió un artefacto válido del padrón (fallo de generación o entrega, error del servicio, o contenido no válido/0 kB), ENTONCES EL SISTEMA muestra un mensaje de error comprensible, no ofrece descarga de un archivo inválido y permite reintentar.
- RF-38. SI la descarga del padrón de personal falla, ENTONCES EL SISTEMA muestra un mensaje de error comprensible, conserva la vista previa vigente y la posibilidad de reintentar, y no entrega un archivo incompleto o incorrecto. CUANDO la persona activa el reintento, EL SISTEMA repite la entrega/descarga del mismo artefacto vigente cuando existe y es válido; si no existe un artefacto vigente válido, EL SISTEMA repite la misma generación del padrón (sin filtros).

### Errores, estados y comportamiento general

- RF-39. SI el servicio rechaza la solicitud por falta de permisos, ENTONCES EL SISTEMA informa que la operación no está permitida y no expone datos del reporte.
- RF-40. SI el servicio rechaza la solicitud por sesión no válida, ENTONCES EL SISTEMA redirige al inicio de sesión con el aviso de sesión vencida.
- RF-41. SI ocurre un error de comunicación, un fallo inesperado o se supera el tiempo de espera al generar la vista previa o la descarga, ENTONCES EL SISTEMA muestra un mensaje de error comprensible (utilizando el mensaje del servicio cuando esté disponible), conserva el contexto de trabajo y, cuando exista, la última vista previa válida y su artefacto, y ofrece una acción de reintento. CUANDO la persona activa el reintento tras un error de generación, EL SISTEMA repite la misma generación con los mismos filtros aplicados vigentes (listado de alumnos inscriptos) o la misma generación sin filtros (padrón de personal), según corresponda.
- RF-42. MIENTRAS se genera u obtiene la vista previa o se realiza una descarga, EL SISTEMA muestra un indicador de espera, evita solicitudes repetidas por la misma acción y permite interpretar que la operación está en curso.
- RF-43. CUANDO la descarga finaliza (con éxito o con error), EL SISTEMA mantiene visibles la vista previa, los filtros aplicados y los mensajes resultantes sin reiniciarlos.
- RF-44. EL SISTEMA produce cada nuevo artefacto a partir del estado vigente de la información en el momento de la generación solicitada (aplicación de filtros o generación automática del padrón) y no reutiliza un artefacto obsoleto de una generación anterior con filtros distintos o descartada por cambio de reporte.

## Requisitos no funcionales

- RNF-1. Consistencia visual: el módulo de Reportes mantiene la paleta institucional, tipografía, espaciados, superficies, bordes y componentes visuales coherentes con el resto del panel.
- RNF-2. Usabilidad: la disposición prioriza el flujo filtros → vista previa → descarga, con jerarquía clara, controles comprensibles y una experiencia cómoda para el personal autorizado.
- RNF-3. Accesibilidad: todos los controles interactivos (selector segmentado, filtros, botón de generar/buscar, limpiar, descargar y controles de zoom del PDF) son operables por teclado y muestran foco visible; los controles de formulario tienen etiqueta asociada; el selector segmentado expone nombre accesible y estado seleccionado perceptible; los estados de carga y los mensajes de error/resultado se comunican de forma perceptible (incluida su disponibilidad para tecnologías de asistencia); el área de vista previa tiene un nombre o etiqueta accesible que identifica el reporte y su estado; no se produce trampa de foco y el orden de foco sigue el flujo filtros → vista previa → descarga.
- RNF-4. Responsive: el módulo es utilizable en anchos de pantalla desde 320 px hasta 1920 px sin desplazamiento horizontal de la página. En pantallas estrechas, los controles (selector de reporte, filtros y acciones) y el contenido se reorganizan en disposición vertical apilada, manteniendo accesibles los filtros, el área de vista previa y el botón de descarga. Los controles interactivos mantienen un área de activación táctil objetivo mínima equivalente a 44×44 px CSS y el contenido permanece legible y operable con ampliación de texto. Cuando el contenido total supera el alto disponible, el desplazamiento externo del módulo/página permite alcanzar filtros, vista previa y descarga.
- RNF-5. Claridad de estados: los estados son mutuamente reconocibles por su indicador y mensaje: carga (indicador de espera y texto de estado, p. ej. generación o descarga en curso), vacío en alumnos inscriptos (encabezados de tabla sin filas y mensaje «No se encontraron alumnos inscriptos para los filtros aplicados.»), error (mensaje visible con opción de reintento cuando corresponda), acceso denegado (mensaje explícito sin datos del reporte) y resultado disponible (vista previa renderizada con descarga disponible según corresponda).
- RNF-6. Privacidad y seguridad: el módulo no expone datos de reportes a roles no autorizados ni muestra información sensible en mensajes o elementos visibles innecesarios.
- RNF-7. Confiabilidad: la vista previa y la descarga corresponden al mismo artefacto vigente generado con los filtros aplicados confirmados (o sin filtros en el padrón).
- RNF-8. Idioma: los textos visibles de la interfaz y los mensajes del módulo se presentan en español.
- RNF-9. Área de vista previa: el área de vista previa de cada reporte tiene una altura objetivo del 60 % del área de contenido disponible del módulo de reportes, con una altura mínima de 20 rem para preservar la usabilidad y una altura máxima acotada de modo que los controles de filtros situados sobre el área y la acción de descarga situada debajo permanezcan alcanzables mediante el desplazamiento externo del módulo/página. El área dispone de desplazamiento interno vertical y horizontal; el desplazamiento realizado fuera del área afecta al resto del contenido del módulo/página.

## Casos límite

- El listado de alumnos inscriptos no devuelve resultados para los filtros aplicados: se muestra una vista previa vigente en estado vacío (encabezados de las 17 columnas, sin filas y mensaje «No se encontraron alumnos inscriptos para los filtros aplicados.») y la descarga del archivo XLSX (encabezados sin filas de datos) permanece disponible.
- El listado de alumnos inscriptos devuelve más de 20 resultados: la vista previa muestra las primeras 20 filas en el orden provisto por el servicio y un mensaje que indica descargar el documento para ver más detalles.
- El listado de alumnos inscriptos devuelve 20 resultados o menos: la vista previa muestra todos los resultados obtenidos y no muestra el mensaje de descarga para ver más detalles.
- El padrón de personal no tiene registros para mostrar: la vista previa vigente refleja el documento PDF generado en ese estado (sin registros) y la descarga del artefacto generado permanece disponible.
- Una persona con rol `ADMINISTRATIVO` intenta acceder al padrón de personal (incluido acceso directo): se deniega el acceso sin exponer datos.
- Una persona con rol `TUTOR` intenta acceder al módulo (incluido acceso directo): se deniega el acceso sin exponer datos.
- Una persona cambia las entradas de los filtros pero no los aplica: la vista previa anterior y su artefacto permanecen vigentes hasta una nueva aplicación confirmada, y la descarga corresponde a la última vista previa vigente.
- Una persona activa «Limpiar filtros»: las entradas vuelven a «Todos/Todas» sin generación automática, y la última vista previa vigente y su descarga no se pierden.
- Una persona aplica filtros no válidos o no admitidos: se muestra el error (del servicio cuando corresponda), no se reemplaza la vista previa vigente y la descarga sigue correspondiendo a la última vista previa válida.
- Un criterio no tiene opciones específicas disponibles: el filtro permanece en «Todos/Todas» con mensaje informativo y no bloquea la generación; «Todos/Todas» se interpreta como ausencia de restricción para ese criterio.
- Un criterio se encuentra en estado inválido o no determinable: el sistema no permite generar el reporte, mantiene deshabilitado el botón de búsqueda/generación y muestra el mensaje de error asociado al criterio.
- Los filtros del listado se combinan entre sí (por ejemplo, año lectivo, turno y especialidad a la vez): el resultado refleja la combinación aplicada.
- No se selecciona ningún filtro en el listado de alumnos inscriptos (todas las opciones en «Todos/Todas»): el sistema permite generar la vista previa con el conjunto completo permitido por el servicio.
- El administrador cambia de reporte: se descarta la vista previa/estado del reporte anterior; al volver, se muestra el estado inicial y se requiere generación automática (padrón) o aplicación de filtros (alumnos). Si la generación automática del padrón falla o supera el tiempo de espera, se muestra error y se ofrece reintento manual (sin reintentos automáticos en bucle).
- La previsualización del padrón no puede mostrarse pero el artefacto recibido es válido (> 0 kB): se informa el problema de visualización y la descarga del artefacto permanece disponible.
- No se recibe un artefacto válido del padrón (error, fallo de entrega o contenido no válido/0 kB): se muestra error, no se ofrece descarga inválida y se permite reintentar (repetición de la misma generación sin filtros).
- Falla la generación u obtención de la vista previa o la descarga (incluido tiempo de espera excedido): se informa el error, se preserva el contexto y, si existe, la última vista previa válida y su artefacto; se permite reintentar sin entregar archivos parciales o incorrectos. El reintento repite la misma generación con los mismos filtros aplicados vigentes (alumnos) o la misma generación sin filtros (padrón), o la entrega del mismo artefacto vigente en fallos de descarga cuando corresponda.
- Tras una descarga exitosa o fallida: la vista previa, los filtros aplicados y los mensajes permanecen visibles.
- La sesión vence durante la generación o descarga: se redirige al inicio de sesión con el aviso correspondiente.

## Fuera de alcance

- El reporte de formulario de inscripción por inscripción individual y su acceso desde el detalle de inscripciones (ya implementado fuera de este módulo).
- La definición o modificación de los formatos, contenidos, columnas o reglas de negocio de los archivos generados por el servicio.
- La creación de nuevos tipos de reportes no contemplados en esta spec.
- La programación, envío por correo, almacenamiento histórico o compartición de reportes generados.
- La edición de datos de alumnos, inscripciones o personal desde el módulo de Reportes.
- Cambios en los permisos o capacidades del servicio distintos a los necesarios para consumir los reportes contemplados.

## Criterios de finalización

- [ ] Una persona con rol `ADMINISTRATIVO` o `ADMINISTRADOR` puede acceder al módulo de Reportes desde el menú lateral, y la opción aparece activa dentro del módulo; una persona con rol `TUTOR` o no autorizada no accede (ni por acceso directo).
- [ ] Una persona con rol `ADMINISTRATIVO` accede directamente al listado de alumnos inscriptos, puede aplicar sus filtros (año lectivo, año de estudio, turno, especialidad, opcionales y combinables, con «Todos/Todas» como ausencia de restricción) mediante el botón de búsqueda/generación, ver la vista previa y descargar el archivo XLSX del artefacto vigente.
- [ ] Una persona con rol `ADMINISTRADOR` puede elegir mediante control segmentado entre «Listado de alumnos inscriptos» y «Padrón de personal»; al cambiar se descarta el estado del reporte anterior y al volver se requiere generación según corresponda (automática para padrón, por aplicación de filtros para alumnos). Si la generación automática del padrón falla o supera el tiempo de espera, se ofrece reintento manual sin bucle automático.
- [ ] La vista previa del listado de alumnos inscriptos muestra una tabla con las 17 columnas definidas, en el orden del servicio, con datos faltantes/vacíos como `-`, limitada a las primeras 20 filas; si hay más de 20 resultados se muestra el mensaje para descargar el documento; si no hay resultados se muestra el estado vacío con encabezados y mensaje, y la descarga XLSX sigue disponible.
- [ ] La vista previa del padrón de personal se genera automáticamente al seleccionarlo, muestra el PDF (con las 7 columnas del servicio) dentro del módulo con desplazamiento interno vertical y horizontal y controles de zoom, y permite descargar el artefacto PDF vigente (incluido el caso sin registros y el caso de fallo de visualización con artefacto válido > 0 kB).
- [ ] La descarga reutiliza el artefacto generado de la vista previa vigente y corresponde a los mismos filtros aplicados confirmados.
- [ ] «Limpiar filtros» restablece entradas a «Todos/Todas» sin generación automática y sin perder la vista previa/artefacto vigente; la ausencia de opciones específicas con «Todos/Todas» no bloquea la generación, mientras que un criterio inválido/no determinable deshabilita el botón de búsqueda/generación; tras descarga exitosa o fallida, la vista previa, filtros aplicados y mensajes permanecen.
- [ ] Los estados de carga, vacío, error, acceso denegado y resultado disponible cumplen los comportamientos definidos, y los errores/tiempos de espera permiten reintento (misma generación con filtros aplicados vigentes o sin filtros en padrón; entrega del mismo artefacto vigente en fallos de descarga cuando corresponda) conservando el contexto.
- [ ] El área de vista previa cumple RNF-9 (60 % objetivo, altura mínima 20 rem, altura máxima que preserva el acceso a filtros y descarga, scroll interno vertical y horizontal) y el módulo es accesible y responsive según RNF-3 y RNF-4.

## Dudas abiertas

- Ninguna.
