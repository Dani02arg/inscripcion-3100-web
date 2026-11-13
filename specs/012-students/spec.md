# Spec 012 — Módulo de alumnos

Estado: implementada (2026-11-12)

Cambio sobre la spec 009 registrado el 2026-11-11: el `TUTOR` ve «Mis hijos» y los roles administrativos «Alumnos», ambos con destino `/dashboard/students` y coincidencia por prefijo; la spec 009 y su suite de navegación quedaron actualizadas.

## Contexto y objetivo

El panel privado ya cuenta con sesión autenticada, dashboard, menú lateral por rol y los módulos de Cursos y Gestión de usuarios, que son la referencia visual y de comportamiento. El servicio expone el módulo de alumnos con estas capacidades: alta de un alumno a cargo del tutor, listado de los alumnos propios, actualización de un alumno propio, listado general paginado con filtros, detalle y datos del tutor responsable para los roles administrativos.

Esta spec habilita el módulo **Alumnos** para los tres roles:

- El `TUTOR` entra desde «Mis hijos», ve únicamente sus alumnos, registra nuevos hijos, los consulta y los edita. Cuando no tiene alumnos ve un estado vacío con un mensaje y un botón azul para registrar el primero.
- `ADMINISTRATIVO` y `ADMINISTRADOR` entran desde «Alumnos», consultan el padrón completo con filtros y paginación y abren el detalle, que incluye los datos del tutor responsable. No crean, no editan y no dan de baja.

Decisiones confirmadas:

- La opción del menú dice «Mis hijos» para `TUTOR` y «Alumnos» para los roles administrativos.
- Las acciones del menú de cada alumno son: para `TUTOR`, ver, editar y eliminar; para los roles administrativos, solo ver.
- La baja de alumnos no está documentada por el servicio. La acción «Eliminar» se muestra al `TUTOR` y, al elegirla, informa que la baja todavía no está disponible; no envía ninguna solicitud ni simula el resultado.
- El `TUTOR` no tiene consulta de detalle en el servicio; su detalle se arma con los datos del alumno propio ya obtenidos en «Mis hijos» y no muestra datos del tutor.
- Los roles administrativos ven el detalle completo del alumno y los datos del tutor responsable cuando el servicio los devuelve.
- El listado de los roles administrativos usa los filtros documentados y la paginación de 15. El nombre, el apellido y la página se reflejan en la dirección de la página; el DNI y el CUIL no se reflejan en la dirección y se conservan solo durante la pestaña.
- No se inventan capacidades, campos, respuestas ni funcionalidades que el servicio no documente.
- Esta spec cambia la navegación documentada en la spec 009: habilita «Alumnos» para los roles administrativos y cambia la etiqueta del `TUTOR` de «Mis alumnos» a «Mis hijos». El cambio se documenta primero en la spec 009.

## Usuarios

- Personas con rol `TUTOR`.
- Personas con rol `ADMINISTRATIVO`.
- Personas con rol `ADMINISTRADOR`.
- Personas no autenticadas o con sesión vencida que intentan acceder al módulo.
- Personas con un rol no reconocido que intentan acceder por la dirección de la página.

## Historias de usuario

- HU-1. Como tutor, quiero ver la lista de mis hijos para saber cuáles tengo registrados.
- HU-2. Como tutor sin alumnos, quiero un mensaje claro y un botón visible para registrar el primero.
- HU-3. Como tutor, quiero registrar un hijo con sus datos personales y de contacto para dejarlo inscripto en el sistema.
- HU-4. Como tutor, quiero consultar el detalle de un hijo para revisar sus datos.
- HU-5. Como tutor, quiero corregir los datos editables de un hijo para mantener la información actualizada.
- HU-6. Como tutor, quiero intentar dar de baja a un hijo y saber que la funcionalidad todavía no está disponible, para no creer que la baja ocurrió.
- HU-7. Como administrativo o administrador, quiero ver el padrón completo de alumnos para consultar la población escolar.
- HU-8. Como administrativo o administrador, quiero buscar y filtrar alumnos para encontrar uno puntual.
- HU-9. Como administrativo o administrador, quiero abrir el detalle de un alumno y ver los datos de su tutor responsable para contactarlo.
- HU-10. Como persona que usa lector de pantalla o teclado, quiero operar listados, filtros, menús, formularios y detalle con acceso completo.
- HU-11. Como persona que usa el teléfono, quiero consultar y registrar alumnos sin desbordes ni controles inalcanzables.

## Definiciones

- **Alumno propio**: alumno registrado por el tutor autenticado; el servicio lo devuelve en el listado propio.
- **Alumno ajeno**: alumno que pertenece a otro tutor; el servicio lo trata como inexistente.
- **Listado propio**: conjunto completo de alumnos del tutor autenticado, sin paginar y ordenado por apellido y nombre por el servicio.
- **Listado general**: padrón paginado de alumnos que consultan los roles administrativos.
- **Rol vigente**: rol que devuelve el perfil del servicio para la sesión; prevalece sobre el rol del token para lo que muestra la interfaz.
- **Rol administrativo**: `ADMINISTRATIVO` o `ADMINISTRADOR`.
- **Acción exclusiva del tutor**: acción visible y operable solo por `TUTOR` sobre alumnos propios.
- **Detalle del alumno**: pantalla con los datos personales, de contacto y adicionales del alumno.
- **Tutor responsable**: cuenta que registró al alumno; sus datos de contacto solo los recibe el rol administrativo.
- **Dato no informado**: campo opcional ausente, vacío o nulo; se muestra «No informado».
- **Filtros activos**: al menos un filtro, recortado, no está vacío.
- **Filtros combinados**: filtros activos que se aplican simultáneamente.
- **Conjunto filtrado**: subconjunto del listado general que cumple todos los filtros activos.
- **Página válida**: página entre la primera y la última del conjunto filtrado.
- **Aviso de resultado**: mensaje interno de la operación que la persona acaba de realizar; no es una notificación a terceros.
- **Aviso de no disponible**: mensaje que explica que una capacidad todavía no está ofrecida por el servicio y que no se ejecutó ninguna acción.
- **Baja de alumno**: eliminación de un alumno; no está documentada por el servicio.
- **Pendiente de backend**: comportamiento visible que depende de una capacidad que el servicio todavía no documenta; la interfaz lo advierte y no lo simula.

## Requisitos funcionales

### Menú y acceso

- RF-1. CUANDO el rol vigente de la sesión es `TUTOR`, EL SISTEMA muestra en el menú lateral la opción «Mis hijos».
- RF-2. CUANDO el rol vigente es `ADMINISTRATIVO` o `ADMINISTRADOR`, EL SISTEMA muestra en el menú lateral la opción «Alumnos».
- RF-3. CUANDO la persona elige la opción de alumnos, EL SISTEMA abre la pantalla principal de alumnos correspondiente a su rol.
- RF-4. EL SISTEMA deja de mostrar la opción de alumnos con la etiqueta «Próximamente» cuando queda habilitada.
- RF-5. CUANDO la dirección actual pertenece al módulo de alumnos, EL SISTEMA marca la opción de alumnos como activa, incluidas las subpantallas de detalle, alta y edición.
- RF-6. EL SISTEMA determina pantallas y acciones a partir del rol vigente reconciliado con el perfil del servicio; si difiere del rol del token, prevalece el perfil del servicio.
- RF-7. SI una persona sin sesión válida accede a una pantalla del módulo, ENTONCES EL SISTEMA redirige al inicio de sesión con el aviso de sesión vencida.
- RF-8. SI el perfil del servicio responde `401`, ENTONCES EL SISTEMA descarta la sesión y redirige al inicio de sesión con el aviso de sesión vencida.
- RF-9. SI el perfil del servicio responde `403`, ENTONCES EL SISTEMA muestra acceso denegado sin exponer datos.
- RF-10. SI el rol vigente no es `TUTOR`, `ADMINISTRATIVO` ni `ADMINISTRADOR`, ENTONCES EL SISTEMA no muestra la opción de alumnos y, ante un acceso directo, muestra acceso denegado sin solicitar ni exponer datos.
- RF-11. EL SISTEMA publica el listado en `/dashboard/students`, el alta en `/dashboard/students/new`, el detalle en `/dashboard/students/{studentId}` y la edición en `/dashboard/students/{studentId}/edit`.

### Listado del tutor

- RF-12. CUANDO el `TUTOR` abre «Mis hijos», EL SISTEMA muestra exclusivamente los alumnos a su cargo.
- RF-13. EL SISTEMA no muestra al `TUTOR` alumnos de otros tutores.
- RF-14. MIENTRAS el `TUTOR` no tiene alumnos, EL SISTEMA muestra el mensaje «Aún no tenés alumnos registrados», el texto de ayuda «Registrá a tu hijo para poder inscribirlo en un curso» y un botón azul «Registrar un alumno».
- RF-15. CUANDO el `TUTOR` elige «Registrar un alumno», EL SISTEMA abre el formulario de alta de alumno.
- RF-16. CUANDO el `TUTOR` tiene al menos un alumno, EL SISTEMA muestra en el encabezado del listado el botón «Registrar un alumno».
- RF-17. EL SISTEMA muestra en cada alumno del listado propio el apellido y el nombre, el DNI, la fecha de nacimiento y un menú de acciones.
- RF-18. EL SISTEMA muestra los alumnos del tutor en el orden informado por el servicio, por apellido y nombre.
- RF-19. EL SISTEMA no pagina ni filtra el listado propio porque el servicio devuelve la lista completa.
- RF-20. MIENTRAS el listado propio se carga, EL SISTEMA muestra un estado de carga sin filas ficticias.
- RF-21. SI la carga del listado propio falla, ENTONCES EL SISTEMA muestra un mensaje general y ofrece reintentar.
- RF-22. SI el listado propio responde `403`, ENTONCES EL SISTEMA muestra acceso denegado sin exponer datos.

### Menú de acciones de cada alumno

- RF-23. EL SISTEMA muestra en cada alumno un menú de acciones con nombre accesible «Acciones de {apellido}, {nombre}», estado expandido y foco inicial en el primer ítem al abrirse.
- RF-24. MIENTRAS el menú de acciones está abierto, EL SISTEMA permite recorrerlo con flechas, inicio y fin, lo cierra con Escape o con foco fuera y devuelve el foco al disparador.
- RF-25. CUANDO el rol vigente es `TUTOR`, EL SISTEMA muestra en el menú de acciones «Ver», «Editar» y «Eliminar».
- RF-26. CUANDO el rol vigente es `ADMINISTRATIVO` o `ADMINISTRADOR`, EL SISTEMA muestra en el menú de acciones únicamente «Ver».
- RF-27. CUANDO se elige una acción del menú, EL SISTEMA produce únicamente el efecto descrito en el requisito de esa acción; las acciones no disponibles no envían solicitudes ni alteran datos.
- RF-28. EL SISTEMA no ofrece acciones masivas ni acciones sobre varios alumnos a la vez.

### Alta de alumno

- RF-29. CUANDO el rol vigente no es `TUTOR`, EL SISTEMA no ofrece la acción de alta, el botón de registro ni el formulario.
- RF-30. CUANDO el `TUTOR` abre el formulario de alta, EL SISTEMA muestra los campos DNI, CUIL, nombre, apellido, fecha de nacimiento, género, correo electrónico, teléfono, lugar de nacimiento y domicilio.
- RF-31. EL SISTEMA exige un DNI de 7 u 8 dígitos.
- RF-32. EL SISTEMA exige un CUIL de 11 dígitos.
- RF-33. EL SISTEMA exige nombre y apellido recortados, no vacíos y de hasta 100 caracteres.
- RF-34. EL SISTEMA exige una fecha de nacimiento válida y no futura; una fecha inexistente, incluido el 29 de febrero de un año no bisiesto, se rechaza y no se corrige.
- RF-35. EL SISTEMA exige un género entre «Masculino», «Femenino» y «Otro».
- RF-36. EL SISTEMA acepta el correo como opcional y, si se informa, exige un correo válido de hasta 255 caracteres.
- RF-37. EL SISTEMA acepta el teléfono como opcional y, si se informa, exige solo dígitos y no fija una longitud.
- RF-38. EL SISTEMA acepta el lugar de nacimiento como opcional de hasta 150 caracteres y el domicilio como opcional de texto libre.
- RF-39. EL SISTEMA trata DNI, CUIL y teléfono como texto y conserva todos sus dígitos, incluidos los ceros iniciales.
- RF-40. SI el formulario tiene errores de validación local, ENTONCES EL SISTEMA no envía la solicitud y muestra cada error junto a su campo.
- RF-41. SI el servicio informa que el DNI, el CUIL o el correo ya existen, ENTONCES EL SISTEMA muestra el error junto al campo correspondiente y conserva los valores escritos.
- RF-42. MIENTRAS el alta se envía, EL SISTEMA evita envíos repetidos y muestra el estado de envío.
- RF-43. CUANDO el alta es exitosa, EL SISTEMA vuelve al listado propio, muestra el aviso «Alumno registrado correctamente» y el alumno nuevo aparece en la lista.
- RF-44. SI el servicio rechaza el alta por validación, ENTONCES EL SISTEMA muestra los errores junto a los campos, muestra un aviso general para los errores desconocidos y conserva los valores escritos.
- RF-45. SI el alta responde `403`, ENTONCES EL SISTEMA informa que la operación no está permitida y conserva los valores escritos.
- RF-46. SI el alta responde `401`, ENTONCES EL SISTEMA descarta la sesión y redirige al inicio de sesión con el aviso de sesión vencida.
- RF-47. SI el alta sufre error de red o se agota el tiempo de espera, ENTONCES EL SISTEMA muestra un mensaje general, conserva los valores escritos y permite reintentar.
- RF-48. EL SISTEMA no permite elegir ni enviar el tutor al que se asocia el alumno; la asociación la determina el servicio a partir del tutor autenticado.
- RF-49. CUANDO la persona cancela el alta, EL SISTEMA vuelve al listado sin enviar la solicitud ni modificar datos.

### Edición de alumno

- RF-50. CUANDO el rol vigente es `TUTOR`, EL SISTEMA ofrece «Editar» sobre sus propios alumnos.
- RF-51. CUANDO el `TUTOR` elige «Editar», EL SISTEMA abre el formulario con los datos actuales del alumno.
- RF-52. EL SISTEMA muestra el DNI y el CUIL en modo lectura en la edición, los identifica como no modificables y no los envía al servicio.
- RF-53. EL SISTEMA permite editar nombre, apellido, correo electrónico, teléfono, fecha de nacimiento, género, lugar de nacimiento y domicilio.
- RF-54. EL SISTEMA aplica a los campos editables las mismas reglas de formato y obligatoriedad definidas para el alta.
- RF-55. SI el formulario de edición tiene errores de validación local, ENTONCES EL SISTEMA no envía la solicitud y muestra cada error junto a su campo.
- RF-56. EL SISTEMA envía solo los campos editables y envía nulo en los opcionales que la persona vació; nunca envía el DNI ni el CUIL.
- RF-57. MIENTRAS la edición se envía, EL SISTEMA evita envíos repetidos y muestra el estado de envío.
- RF-58. CUANDO la edición es exitosa, EL SISTEMA vuelve al detalle, muestra el aviso «Alumno actualizado correctamente», los valores confirmados por el servicio y revalida el listado.
- RF-59. SI el servicio rechaza la edición por validación, ENTONCES EL SISTEMA muestra los errores junto a los campos, muestra un aviso general para los errores desconocidos y conserva los valores escritos.
- RF-60. SI el alumno no existe o no pertenece al tutor autenticado, ENTONCES EL SISTEMA muestra que el alumno no existe, sin revelar si pertenece a otro tutor, y ofrece volver al listado.
- RF-61. SI la edición responde `403`, ENTONCES EL SISTEMA informa que la operación no está permitida y conserva los valores escritos.
- RF-62. SI la edición responde `401`, ENTONCES EL SISTEMA descarta la sesión y redirige al inicio de sesión con el aviso de sesión vencida.
- RF-63. SI la edición sufre error de red o se agota el tiempo de espera, ENTONCES EL SISTEMA muestra un mensaje general, conserva los valores escritos y permite reintentar.
- RF-64. EL SISTEMA no permite editar alumnos a los roles administrativos.

### Baja de alumno

- RF-65. CUANDO el rol vigente es `TUTOR`, EL SISTEMA muestra la acción «Eliminar» en el menú de acciones de cada alumno propio.
- RF-66. CUANDO el `TUTOR` elige «Eliminar», EL SISTEMA muestra un diálogo titulado «Baja no disponible» que explica que la baja de alumnos todavía no está disponible en el servicio.
- RF-67. MIENTRAS el diálogo de baja no disponible está abierto, EL SISTEMA no envía ninguna solicitud, no retira al alumno de la lista y no muestra un resultado de baja exitosa.
- RF-68. EL SISTEMA no ofrece la acción «Eliminar» a los roles administrativos.
- RF-69. EL SISTEMA no ofrece dar de baja desde el detalle del alumno ni mediante atajos de teclado.

### Detalle del alumno

- RF-70. CUANDO se elige «Ver» en un alumno, EL SISTEMA abre su detalle.
- RF-71. EL SISTEMA agrupa el detalle en «Datos personales», «Datos de contacto» e «Información adicional».
- RF-72. EL SISTEMA muestra en «Datos personales»: nombre, apellido, DNI, CUIL, fecha de nacimiento y género.
- RF-73. EL SISTEMA muestra en «Datos de contacto»: correo electrónico y teléfono.
- RF-74. EL SISTEMA muestra en «Información adicional»: lugar de nacimiento y domicilio.
- RF-75. SI un dato opcional no está informado, ENTONCES EL SISTEMA muestra «No informado».
- RF-76. MIENTRAS el rol vigente es `TUTOR`, EL SISTEMA muestra el detalle con los datos del alumno propio y no muestra datos del tutor responsable.
- RF-77. MIENTRAS el rol vigente es `ADMINISTRATIVO` o `ADMINISTRADOR`, EL SISTEMA muestra además una sección «Tutor responsable» con nombre, apellido, correo electrónico y teléfono.
- RF-78. SI el servicio no encuentra o no informa los datos del tutor responsable, ENTONCES EL SISTEMA muestra «No informado» en los datos faltantes, no invalida el resto del detalle y no inventa valores.
- RF-79. EL SISTEMA muestra las fechas en formato DD/MM/AAAA y la fecha de nacimiento sin desplazarla por zona horaria.
- RF-80. MIENTRAS el rol vigente es `TUTOR`, EL SISTEMA ofrece «Editar» en el detalle del alumno propio.
- RF-81. MIENTRAS el rol vigente es `ADMINISTRATIVO` o `ADMINISTRADOR`, EL SISTEMA no ofrece «Editar» ni «Eliminar» en el detalle.
- RF-82. EL SISTEMA no permite editar el DNI ni el CUIL desde el detalle.
- RF-83. SI el alumno no existe, no pertenece al tutor autenticado o fue eliminado, ENTONCES EL SISTEMA muestra un estado de no encontrado con acceso al listado.
- RF-84. SI el detalle responde `403`, ENTONCES EL SISTEMA muestra acceso denegado sin exponer datos.
- RF-85. SI el detalle responde `401`, ENTONCES EL SISTEMA descarta la sesión y redirige al inicio de sesión con el aviso de sesión vencida.
- RF-86. MIENTRAS el detalle se carga, EL SISTEMA muestra un estado de carga; si la carga falla, muestra un mensaje y permite reintentar.
- RF-87. CUANDO la persona vuelve del detalle al listado, EL SISTEMA conserva los filtros no sensibles y la página del origen; sin origen válido, vuelve al listado sin filtros.

### Listado general de alumnos

- RF-88. CUANDO `ADMINISTRATIVO` o `ADMINISTRADOR` abre «Alumnos», EL SISTEMA muestra el listado general paginado de alumnos.
- RF-89. EL SISTEMA muestra por alumno apellido y nombre, DNI, CUIL, fecha de nacimiento, género y menú de acciones.
- RF-90. EL SISTEMA ofrece filtros por DNI, CUIL, nombre y apellido.
- RF-91. EL SISTEMA permite combinar varios filtros y los aplica juntos.
- RF-92. EL SISTEMA aplica DNI y CUIL como coincidencia exacta y solo admite dígitos.
- RF-93. SI un filtro de DNI o CUIL contiene puntos, espacios, guiones u otro carácter no numérico, ENTONCES EL SISTEMA no aplica la búsqueda y muestra el mensaje de validación del filtro.
- RF-94. EL SISTEMA aplica nombre y apellido como coincidencia parcial, recortada y sin distinguir mayúsculas.
- RF-95. EL SISTEMA no aplica los filtros vacíos y conserva los valores escritos mientras la persona edita.
- RF-96. CUANDO la persona elige «Aplicar filtros» o presiona Enter en un campo de filtro, EL SISTEMA aplica los filtros activos; no busca con cada tecla.
- RF-97. EL SISTEMA refleja el nombre, el apellido y la página en la dirección de la página con reemplazo de historial, descarta los valores inválidos y reconstruye el estado en la recarga y en atrás/adelante; el DNI y el CUIL no se reflejan en la dirección.
- RF-98. EL SISTEMA conserva el DNI y el CUIL durante la pestaña y los restaura al volver al listado; una pestaña nueva comienza sin esos filtros.
- RF-99. CUANDO se aplican filtros, EL SISTEMA vuelve a la primera página.
- RF-100. EL SISTEMA muestra 15 alumnos por página.
- RF-101. EL SISTEMA muestra la página actual, el total de páginas y el total de resultados, y habilita «Anterior» y «Siguiente» solo cuando corresponde.
- RF-102. SI la página solicitada está fuera del rango disponible, ENTONCES EL SISTEMA la ajusta a la última página válida.
- RF-103. SI los metadatos del listado completo faltan o son inconsistentes, ENTONCES EL SISTEMA trata la respuesta como inválida, muestra el error y ofrece reintentar, sin inventar totales ni mostrar datos parciales.
- RF-104. CUANDO la persona elige «Limpiar filtros», EL SISTEMA elimina todos los filtros, incluidos DNI y CUIL, y vuelve a la primera página.
- RF-105. MIENTRAS se obtienen los resultados, EL SISTEMA muestra un estado de carga sin filas ficticias.
- RF-106. SI no hay resultados, ENTONCES EL SISTEMA distingue entre padrón sin alumnos y búsqueda sin coincidencias según haya filtros activos; en el segundo caso ofrece limpiar los filtros.
- RF-107. MIENTRAS no hay ningún alumno registrado y el rol es administrativo, EL SISTEMA muestra el mensaje «No hay alumnos registrados» sin botón de alta.
- RF-108. SI la consulta falla, ENTONCES EL SISTEMA muestra el mensaje correspondiente y ofrece reintentar.
- RF-109. SI el listado general responde `403`, ENTONCES EL SISTEMA muestra acceso denegado sin exponer datos.
- RF-110. SI el listado general responde `401`, ENTONCES EL SISTEMA descarta la sesión y redirige al inicio de sesión con el aviso de sesión vencida.
- RF-111. EL SISTEMA no ofrece filtros por correo, género, edad ni tutor porque el servicio no los documenta.
- RF-112. EL SISTEMA muestra el orden informado por el servicio, por apellido y nombre.
- RF-113. EL SISTEMA no ofrece alta, edición ni baja a los roles administrativos.
- RF-114. EL SISTEMA conserva el aviso de resultado visible cuando la persona filtra o pagina hasta completar su tiempo de visualización.

### Sesión, errores y comportamiento transversal

- RF-115. EL SISTEMA usa la sesión existente y envía el token en todas las solicitudes del módulo, sin duplicar la lógica de autenticación.
- RF-116. SI una solicitud responde `401`, ENTONCES EL SISTEMA descarta la sesión y redirige al inicio de sesión con el aviso de sesión vencida.
- RF-117. SI una solicitud responde `403`, ENTONCES EL SISTEMA muestra que la operación no está permitida sin exponer datos del alumno.
- RF-118. SI una solicitud responde `404`, ENTONCES EL SISTEMA muestra que el alumno no existe o no corresponde al tutor autenticado.
- RF-119. SI una solicitud responde `422`, ENTONCES EL SISTEMA muestra los errores de validación junto a los campos y deriva los errores desconocidos a un aviso general.
- RF-120. SI una solicitud sufre error de red o se agota el tiempo de espera, ENTONCES EL SISTEMA muestra un mensaje general y ofrece reintentar.
- RF-121. CUANDO una respuesta presenta más de un error aplicable, EL SISTEMA respeta la precedencia `401`, `403`, `404`, `422`, `5xx` y red.
- RF-122. EL SISTEMA mantiene los avisos de resultado visibles 4 segundos y los errores hasta su cierre manual o reintento.
- RF-123. EL SISTEMA usa los avisos de resultado de la operación y no los presenta como notificaciones a terceros.
- RF-124. EL SISTEMA no envía ni simula notificaciones a terceros ni al tutor del alumno porque el servicio no las documenta.
- RF-125. SI una respuesta exitosa trae un alumno con campos obligatorios ausentes o inválidos, ENTONCES EL SISTEMA trata la respuesta como inválida, muestra un error y no inventa datos.
- RF-126. SI la sesión vence mientras el menú de acciones está abierto, ENTONCES EL SISTEMA cierra el menú y redirige al inicio de sesión con el aviso de sesión vencida.

## Requisitos no funcionales

- RNF-1. Consistencia visual: misma paleta institucional, fondos claros, superficies blancas, bordes, radios, sombras, espaciados, tipografía y jerarquía que Cursos y Gestión de usuarios; sin colores ni estilos nuevos.
- RNF-2. Reutilización por composición de las piezas existentes de tabla, buscador, filtros, paginación, badges, menús de acciones, avisos, esqueletos y estados; sin variantes duplicadas.
- RNF-3. Contraste mínimo de 4.5:1 en texto y de 3:1 en indicadores y bordes no textuales; foco visible en todos los controles.
- RNF-4. Accesibilidad: operación completa por teclado; roles, nombres accesibles, estado activo, expandido, deshabilitado y ocupado anunciados; mensajes de error y resultado anunciados; foco devuelto al cerrar menús y diálogos.
- RNF-5. Responsive de 320 a 1920 px: sin desborde horizontal de página, tabla con desplazamiento interno, controles alcanzables y texto al 200 % sin pérdida de contenido.
- RNF-6. Estados de carga, vacío, error, acceso denegado y resultados visualmente distinguibles y accesibles.
- RNF-7. Privacidad: nunca exponer token, contraseñas ni datos sensibles en la dirección de la página, HTML, almacenamiento del navegador, consola o notificaciones; el DNI y el CUIL de los filtros no se reflejan en la dirección.
- RNF-8. Fechas: los datos se reciben en ISO del servicio y se presentan en DD/MM/AAAA; la fecha de nacimiento no se desplaza por zona horaria.
- RNF-9. Sin caché compartida entre usuarios: los datos del módulo se generan por sesión y se revalidan después de una escritura.
- RNF-10. Sin dependencias externas nuevas.
- RNF-11. Cada pantalla del módulo tiene título y descripción propios.
- RNF-12. Cada segmento del módulo ofrece estado de carga y límite de error con reintento.
- RNF-13. Las acciones de escritura bloquean envíos repetidos y muestran indicador de envío.
- RNF-14. La reutilización de piezas de Cursos y Gestión de usuarios es por composición; si una pieza compartida debe cambiar, el cambio es retrocompatible y se valida con regresión de esos módulos.
- RNF-15. Textos de interfaz en español e identificadores técnicos en inglés, conforme a la constitución.
- RNF-16. Los formularios conservan los valores escritos ante errores de validación o de red.
- RNF-17. Todas las respuestas del servicio se procesan con el sobre `{data, message, errors}` y los errores se traducen de forma uniforme.
- RNF-18. Toda imagen o icono nuevo se sirve con la optimización del framework y se declara en el plan con carpeta, descripción y nombre ideal.

## Casos límite

- CL-1. El tutor no tiene alumnos: estado vacío con mensaje, ayuda y botón azul de registro.
- CL-2. El tutor tiene un alumno y quiere registrar otro: el botón del encabezado abre el alta.
- CL-3. El tutor tiene alumnos y el servicio los devuelve desordenados: se muestra el orden recibido y no se reordena.
- CL-4. Un alumno ajeno se consulta por dirección directa: el servicio responde `404` y se muestra que no existe, sin revelar pertenencia.
- CL-5. El rol administrativo abre el módulo y no hay alumnos: «No hay alumnos registrados» sin botón de alta.
- CL-6. El rol administrativo intenta abrir el alta o la edición por dirección directa: acceso denegado, sin formulario.
- CL-7. El tutor abre el detalle de un alumno que ya no está en su lista: estado de no encontrado con acceso al listado.
- CL-8. Un alumno se actualiza en otra sesión: al recargar se muestran los valores vigentes del servicio.
- CL-9. El formulario de alta se envía vacío: errores locales en los campos obligatorios y ninguna solicitud.
- CL-10. DNI con 6 o 9 dígitos, con letras, puntos o espacios: error local de formato y ninguna solicitud.
- CL-11. CUIL con menos o más de 11 dígitos: error local de formato y ninguna solicitud.
- CL-12. Nombre o apellido con solo espacios o de más de 100 caracteres: error local y ninguna solicitud.
- CL-13. Fecha de nacimiento futura, inexistente o 29/02 en año no bisiesto: error local y ninguna solicitud.
- CL-14. Género no informado o fuera de los tres valores documentados: error local y ninguna solicitud.
- CL-15. Correo con formato inválido o de más de 255 caracteres: error local y ninguna solicitud.
- CL-16. Teléfono con letras, espacios, guiones o símbolos: error local y ninguna solicitud.
- CL-17. Lugar de nacimiento de más de 150 caracteres: error local y ninguna solicitud.
- CL-18. DNI, CUIL o correo ya registrados: el servicio responde `422` y el error se muestra junto al campo, conservando los valores.
- CL-19. DNI, CUIL o teléfono con ceros iniciales: se envían como texto y se conservan completos.
- CL-20. Doble clic o doble Enter en el alta o en la edición: se envía una sola operación.
- CL-21. El servicio tarda o se corta la red durante el alta: mensaje general, valores conservados y posibilidad de reintentar.
- CL-22. Se intenta editar el DNI o el CUIL: los campos son de solo lectura y no se envían.
- CL-23. Se intenta editar un alumno ajeno: el servicio responde `404` y se muestra que no existe, sin revelar pertenencia.
- CL-24. Se vacía un campo opcional en la edición: se envía nulo y se muestra el resultado del servicio.
- CL-25. Dos pestañas con filtros o páginas distintas: cada una conserva su estado; una mutación en una no altera la otra hasta que se refresque.
- CL-26. La última página del listado queda vacía después de aplicar un filtro: se ajusta a la página válida anterior.
- CL-27. Los filtros no devuelven coincidencias: estado sin resultados con opción de limpiar filtros.
- CL-28. Filtro de DNI o CUIL con puntos, espacios, guiones o guiones bajos: validación local, sin búsqueda.
- CL-29. Filtros escritos con mayúsculas: se aplican igual.
- CL-30. La dirección de la página contiene una página mayor a la última: se ajusta a la última válida.
- CL-31. Los metadatos del listado completo faltan o son inconsistentes: error con reintento, sin totales inventados ni datos parciales.
- CL-32. Una respuesta anterior llega después de un cambio de filtro o página: se descarta y prevalece el estado más reciente.
- CL-33. El alumno no tiene correo, teléfono, lugar de nacimiento o domicilio: se muestra «No informado» en cada dato faltante.
- CL-34. El servicio no devuelve los datos del tutor responsable: se muestra «No informado» y no se inventan valores.
- CL-35. La fecha de nacimiento llega en ISO: se muestra en DD/MM/AAAA sin desplazarse por zona horaria.
- CL-36. La sesión vence durante el alta, la edición o la carga del detalle: se descarta la sesión y se redirige al inicio de sesión con el aviso de sesión vencida.
- CL-37. El rol del usuario cambia mientras está en el módulo: la siguiente solicitud responde `403` o `401` según corresponda y se recalcula el acceso.
- CL-38. Un rol administrativo abre el menú de acciones de un alumno: solo ve «Ver».
- CL-39. El tutor elige «Eliminar»: se muestra el diálogo de baja no disponible y la lista permanece intacta.
- CL-40. Un aviso de resultado está visible y la persona filtra o pagina: el aviso se conserva hasta cumplir sus 4 segundos.
- CL-41. El servicio devuelve un alumno con un campo obligatorio ausente o inválido: se trata la respuesta como inválida y se muestra el error, sin datos inventados.
- CL-42. El tutor registra un alumno y vuelve atrás en el navegador: no se duplica el alta ni se reenvía la operación.
- CL-43. El diálogo de baja no disponible se opera con teclado: atrapa el foco, cierra con Escape y devuelve el foco al menú.
- CL-44. El DNI y el CUIL se escriben en los filtros y se recarga la pestaña: se restauran; en una pestaña nueva no aparecen.
- CL-45. El nombre o el apellido contienen ñ, apóstrofos, guiones o espacios internos: se aceptan y solo se recortan los extremos.
- CL-46. Un filtro de nombre o apellido contiene solo espacios: se considera vacío y no se aplica.
- CL-47. La página solicitada es cero, negativa o no numérica: se normaliza a la primera página.
- CL-48. El listado completo supera el tope de páginas permitido: se muestra un error y no se muestran resultados parciales.

## Fuera de alcance

- Dar de baja alumnos: la capacidad no está documentada por el servicio y solo se informa como no disponible.
- Crear, editar o dar de baja alumnos desde los roles administrativos.
- Editar DNI y CUIL de un alumno.
- Cambiar el tutor responsable de un alumno o reasignar alumnos entre tutores.
- Consultar alumnos propios desde un endpoint de detalle del tutor, porque el servicio no lo documenta.
- Inscripciones, cursos por alumno, calificaciones, asistencia o legajo académico.
- Reportes, exportación de listados o notificaciones a tutores.
- Restauración de alumnos eliminados.
- Acciones masivas sobre alumnos.
- Filtros por correo, género, edad o tutor en el listado general.
- Gestión de la relación tutor-alumno más allá de la asociación que aplica el servicio al registrar.
- Cambios en el backend para habilitar funcionalidades nuevas.
- Duplicar componentes de Cursos o de Gestión de usuarios o introducir una identidad visual distinta.
- Las tareas pendientes de las specs 010 y 011 y la T23 diferida de la spec 004.

## Criterios de finalización

- Todos los requisitos funcionales verificados con pruebas y recorridos de extremo a extremo.
- El recorrido del tutor cubierto: estado vacío, alta, listado, alta de un segundo alumno, detalle, edición y aviso de baja no disponible.
- El recorrido administrativo cubierto: padrón, filtros, paginación, detalle con tutor responsable y ausencia de acciones de escritura.
- Los requisitos no funcionales verificados: contraste, teclado, lector de pantalla, responsive, texto al 200 % y privacidad.
- La suite de pruebas, el linter y la compilación en verde, sin dependencias nuevas.
- Sin errores de consola en los recorridos principales.
- Sin regresiones en Cursos, Gestión de usuarios, menú lateral, inicio de sesión, registro ni recuperación.
- La spec 009 actualizada con el cambio de etiqueta y la habilitación de «Alumnos», con sus pruebas de navegación en verde.
- Imágenes e iconos nuevos declarados en el plan con carpeta, descripción y nombre ideal.
- Documentación de la spec y memoria del proyecto actualizadas al cierre.

## Dudas abiertas

- [PENDIENTE DE BACKEND] La baja de alumnos no está documentada; queda como acción visible que informa su indisponibilidad hasta que el servicio la ofrezca.
- [PENDIENTE DE BACKEND] No existe consulta de detalle para el tutor; el detalle del tutor se arma con los datos del listado propio y puede quedar desactualizado hasta recargar. Además, no está confirmado que el listado propio devuelva correo, teléfono, lugar de nacimiento y domicilio; si no los devuelve, se muestran como «No informado».
- [PENDIENTE DE BACKEND] No está confirmado que enviar `null` en un campo opcional de la edición borre el dato; si el servicio lo rechaza, se muestra el error de validación.
