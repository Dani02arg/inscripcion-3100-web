# Spec 011 — Gestión de usuarios

Estado: implementada (2026-11-03; cerrada el 2026-11-11)

## Contexto y objetivo

El panel privado ya cuenta con sesión autenticada, dashboard, menú lateral por rol (specs 008 y 009) y el módulo Gestión de cursos (spec 010), que es la referencia visual y de comportamiento. El backend expone el módulo de usuarios documentado en las guías detalladas: padrón paginado con filtros, directorio de staff, detalle, cambio de rol y baja lógica; además, el perfil propio (`GET /api/auth/me`), la actualización del perfil de tutor (`PUT /api/profile/tutor`) y la solicitud de cambio de rol (`POST /api/role-request`).

Esta spec habilita el módulo **Gestión de usuarios** para `ADMINISTRADOR` y `ADMINISTRATIVO`, el **perfil propio** para los tres roles y una **configuración de cuenta** accesible desde el pie del menú, con la misma identidad visual que Gestión de cursos.

Decisiones confirmadas:

- «Gestión de usuarios» es una sección desplegable del menú lateral con «Padrón de usuarios» y «Directorio de staff».
- «Mi perfil» es una opción de primer nivel al final de la lista del menú, visible para `TUTOR`, `ADMINISTRATIVO` y `ADMINISTRADOR`.
- «Configuración de cuenta» vive en el sector inferior del menú, junto a «Cerrar sesión», para los tres roles, y contiene solo nombre, apellido, correo y acceso a restablecer contraseña.
- La sección «Gestión de usuarios» solo se muestra a `ADMINISTRADOR` y `ADMINISTRATIVO`; `TUTOR` no la ve ni accede por URL.
- Las pantallas se publican bajo `/dashboard`: padrón en `/dashboard/users`, directorio en `/dashboard/users/staff`, detalle en `/dashboard/users/{userId}`, perfil en `/dashboard/profile` y configuración de cuenta en `/dashboard/account`. Las etiquetas visibles permanecen en español.
- El directorio ofrece «Ver usuario» a ambos roles administrativos y «Cambiar rol» y «Dar de baja» solo a `ADMINISTRADOR`, reutilizando las mismas reglas, modales y mensajes del padrón.
- El padrón filtra y pagina contra el servicio, con 10 usuarios por página.
- Los filtros se aplican con el botón «Aplicar filtros» o con Enter; no se envían con cada tecla.
- Los filtros y la página del padrón se reflejan en la URL, sobreviven a la recarga y a atrás/adelante, y los valores inválidos se descartan.
- El directorio resuelve sus filtros sobre el conjunto completo de personal y pagina el resultado filtrado, de a 10, porque el servicio no documenta filtros para ese listado.
- `TUTOR` puede completar y actualizar su ocupación y su nivel educativo desde «Mi perfil». Los roles administrativos ven esos datos en modo lectura.
- La solicitud de cambio de rol se ubica dentro de «Configuración de cuenta» y solo la ve `TUTOR`; no se muestra como acción suelta en el pie. `ADMINISTRATIVO` queda fuera de alcance aunque el servicio lo permita.
- El cambio de rol efectivo lo realiza exclusivamente `ADMINISTRADOR` con el endpoint documentado y funciona de punta a punta.
- La solicitud de cambio de rol del `TUTOR` se implementa con aviso explícito: el servicio no la registra, no la persiste y no notifica a los administradores. Queda pendiente de backend.
- Las notificaciones al usuario afectado cuando un administrador le cambia el rol tampoco están documentadas; quedan pendientes de backend y no se simulan.
- El resumen del pie muestra nombre, correo y rol; el estado de verificación se muestra en «Mi perfil».
- El rol que muestra la interfaz se reconcilia con el perfil del servicio (`GET /api/auth/me`); si difiere del rol del token, prevalece el perfil del servicio.
- `DNI` y `CUIL` no se muestran en «Mi perfil» porque el servicio de perfil propio no los devuelve. Queda pendiente revisarlos si el backend los incorpora.
- «Restablecer contraseña» abre el flujo público de recuperación existente sin precargar el correo; la sesión actual sigue vigente hasta expirar o cerrar sesión.
- No existe endpoint para cambiar contraseña conociendo la actual: solo se ofrece el flujo de recuperación existente.
- No se inventan endpoints, campos, respuestas ni funcionalidades.
- La autorización parte del rol vigente de la sesión; el backend sigue siendo autoritativo.
- Quedan fuera de esta spec las tareas pendientes de la spec 010 (T65–T67 y T71) y la T23 diferida de la spec 004.

## Usuarios

- Personas con rol `ADMINISTRADOR`.
- Personas con rol `ADMINISTRATIVO`.
- Personas con rol `TUTOR`.
- Personas no autenticadas o con sesión vencida que intentan acceder al módulo.

## Historias de usuario

- HU-1. Como administrador, quiero ver el padrón completo de usuarios para conocer quién está registrado.
- HU-2. Como administrador o administrativo, quiero buscar y filtrar usuarios por DNI, CUIL, nombre, apellido o correo para encontrar una cuenta puntual.
- HU-3. Como administrador o administrativo, quiero abrir el detalle de un usuario para revisar sus datos personales, de contacto, adicionales y de cuenta.
- HU-4. Como administrador, quiero cambiar el rol de un usuario para ajustar sus permisos.
- HU-5. Como administrador, quiero dar de baja a un usuario para que no pueda volver a ingresar.
- HU-6. Como administrador o administrativo, quiero consultar y filtrar el directorio del personal para ubicar a otro integrante del staff.
- HU-7. Como tutor, quiero ver mis datos disponibles del registro y completar mi ocupación y nivel educativo para mantener mi perfil actualizado.
- HU-8. Como cualquier persona autenticada, quiero revisar los datos de mi cuenta y acceder a restablecer mi contraseña.
- HU-9. Como tutor, quiero solicitar un cambio de rol explicando el motivo para que un administrador lo evalúe.
- HU-10. Como persona que opera el sistema, quiero que las acciones no permitidas se expliquen y no simulen efectos que no ocurrieron.
- HU-11. Como persona que usa lector de pantalla o teclado, quiero operar listados, filtros, menús, modales, formularios y detalle con acceso completo.
- HU-12. Como persona que usa el teléfono, quiero consultar y actualizar mi perfil sin desbordes ni controles inalcanzables.

## Definiciones

- **Usuario del padrón**: cuenta registrada devuelta por el listado general, sin incluir a la persona que consulta ni a las cuentas dadas de baja.
- **Usuario del staff**: cuenta con rol `ADMINISTRATIVO` o `ADMINISTRADOR`.
- **Usuario actual**: persona autenticada que consulta el módulo.
- **Perfil propio**: datos que el servicio devuelve para la cuenta autenticada.
- **Configuración de cuenta**: pantalla con nombre, apellido, correo y acceso a restablecer contraseña de la cuenta autenticada.
- **Rol**: valor `TUTOR`, `ADMINISTRATIVO` o `ADMINISTRADOR`.
- **Rol vigente**: rol que devuelve `GET /api/auth/me` para la sesión; prevalece sobre el rol del token para lo que muestra la interfaz.
- **Estado de verificación del correo**: indica si la cuenta confirmó su correo; nunca se deduce del rol.
- **Administrador activo**: cuenta no eliminada con rol `ADMINISTRADOR`. La regla la aplica el servicio; la interfaz no cuenta administradores.
- **Baja lógica**: la cuenta deja de aparecer en los listados, no puede volver a iniciar sesión y su detalle responde como no encontrado; sus alumnos e inscripciones se conservan.
- **Usuario eliminado**: cuenta dada de baja.
- **Filtros activos**: al menos un campo de filtro, recortado, no está vacío.
- **Filtros combinados**: filtros activos que se aplican simultáneamente.
- **Conjunto completo**: todos los usuarios del padrón o todo el personal del directorio, sin filtros. En el directorio se obtiene recorriendo todas las páginas del servicio con `per_page=100` y un tope de 100 páginas; si una página falla, no se muestra un conjunto parcial.
- **Conjunto filtrado**: subconjunto que cumple todos los filtros activos.
- **Página válida**: página entre la primera y la última del conjunto filtrado.
- **Acción exclusiva**: acción disponible únicamente para `ADMINISTRADOR`.
- **Dato no informado**: campo ausente, vacío o no disponible; se muestra «No informado».
- **Ocupación**: texto recortado, no vacío, de hasta 100 caracteres, que describe la actividad del tutor.
- **Nivel educativo**: uno de `PRIMARIO`, `SECUNDARIO`, `TERCIARIO`, `UNIVERSITARIO` o `POSTGRADO`.
- **Perfil de tutor completo**: cuenta `TUTOR` con ocupación y nivel educativo informados.
- **Solicitud de cambio de rol**: pedido con rol deseado y motivo que el tutor envía al servicio; no cambia el rol por sí mismo, no queda registrada y no notifica a los administradores.
- **Pendiente de backend**: comportamiento documentado que el servicio todavía no persiste o notifica, como la solicitud de rol y los avisos de solicitud y de cambio aplicado. La interfaz debe advertirlo y no simular el efecto.
- **Aviso de resultado**: mensaje interno de la operación que la persona acaba de realizar; no es una notificación a terceros.
- **Notificación a terceros**: aviso dirigido a otra persona, como al usuario afectado o a los administradores; no está documentada y no se simula.
- **Propia cuenta**: cuenta cuyo identificador normalizado a texto coincide con el identificador del perfil propio; nunca se determina por nombre o correo.
- **Sección del menú**: agrupación desplegable con dos o más opciones de navegación.
- **Origen de la navegación**: listado desde el cual se abrió un detalle, indicado como `users` o `staff`; sin origen válido, se vuelve al padrón.

## Requisitos funcionales

### Menú y acceso

- RF-1. CUANDO el rol de la sesión es `ADMINISTRADOR` o `ADMINISTRATIVO`, EL SISTEMA muestra en el menú lateral la sección «Gestión de usuarios» con las opciones «Padrón de usuarios» y «Directorio de staff».
- RF-2. CUANDO el rol de la sesión es `TUTOR`, EL SISTEMA no muestra la sección «Gestión de usuarios» ni sus opciones.
- RF-3. EL SISTEMA ubica la sección «Gestión de usuarios» después de «Inscripciones» y antes de «Reportes» cuando esa opción existe para el rol.
- RF-4. EL SISTEMA muestra la sección expandida por defecto y permite plegarla y desplegarla.
- RF-5. CUANDO la persona entra a una ruta del módulo, EL SISTEMA expande la sección; después la persona puede plegarla y la preferencia se conserva mientras permanece en el panel.
- RF-6. MIENTRAS la sección está plegada, EL SISTEMA oculta sus dos opciones y mantiene el control de despliegue con nombre accesible y estado expandido o contraído.
- RF-7. CUANDO la ruta actual pertenece al módulo, EL SISTEMA marca la opción correspondiente como activa, incluidas las subpantallas de detalle.
- RF-8. EL SISTEMA muestra la opción «Mi perfil» al final de la lista principal del menú lateral, para `TUTOR`, `ADMINISTRATIVO` y `ADMINISTRADOR`.
- RF-9. CUANDO la persona elige «Mi perfil», EL SISTEMA abre su pantalla de perfil.
- RF-10. EL SISTEMA muestra en el sector inferior del menú lateral, junto a «Cerrar sesión», la opción «Configuración de cuenta» para los tres roles.
- RF-11. CUANDO la persona elige «Configuración de cuenta», EL SISTEMA abre su pantalla de configuración.
- RF-12. EL SISTEMA muestra en el resumen de cuenta del pie, con el menú expandido, el nombre, el correo y el rol de la cuenta.
- RF-13. MIENTRAS el menú lateral está colapsado, EL SISTEMA muestra solo el avatar con nombre accesible y mantiene los datos de cuenta completos en las pantallas correspondientes.
- RF-14. MIENTRAS el menú lateral está colapsado, EL SISTEMA muestra las opciones «Padrón de usuarios» y «Directorio de staff» como dos iconos con nombre accesible, tooltip y estado activo, y oculta la cabecera de la sección.
- RF-15. MIENTRAS el menú lateral se muestra como drawer, EL SISTEMA presenta la sección «Gestión de usuarios» expandida con sus dos opciones.
- RF-16. EL SISTEMA publica el padrón en `/dashboard/users`, el directorio en `/dashboard/users/staff`, el detalle en `/dashboard/users/{userId}`, «Mi perfil» en `/dashboard/profile` y «Configuración de cuenta» en `/dashboard/account`.
- RF-17. CUANDO las opciones «Usuarios», «Mi perfil» y «Configuración de cuenta» quedan habilitadas, EL SISTEMA deja de mostrarlas con la etiqueta «Próximamente».
- RF-18. SI una persona sin rol habilitado accede por URL a una pantalla del módulo, ENTONCES EL SISTEMA muestra acceso denegado sin solicitar ni exponer datos.
- RF-19. SI una persona sin sesión válida accede a una pantalla del módulo, ENTONCES EL SISTEMA redirige al inicio de sesión con el aviso de sesión vencida.
- RF-20. EL SISTEMA obtiene el rol vigente del perfil del servicio y lo usa por sobre el rol del token para decidir secciones, pantallas y acciones; si difieren, prevalece el perfil del servicio.
- RF-21. SI el perfil del servicio responde `401`, ENTONCES EL SISTEMA descarta la sesión y redirige al inicio de sesión con el aviso de sesión vencida.
- RF-22. SI el perfil del servicio responde `403`, ENTONCES EL SISTEMA muestra acceso denegado sin exponer datos.

### Padrón de usuarios

- RF-23. CUANDO `ADMINISTRADOR` o `ADMINISTRATIVO` abre «Padrón de usuarios», EL SISTEMA muestra el listado general paginado de cuentas registradas.
- RF-24. EL SISTEMA muestra por usuario nombre y apellido, DNI, correo electrónico, rol y menú de acciones.
- RF-25. EL SISTEMA muestra el rol con la etiqueta visible «Tutor», «Administrativo» o «Administrador».
- RF-26. EL SISTEMA no muestra al usuario actual ni a los usuarios eliminados, conforme al comportamiento del servicio.
- RF-27. EL SISTEMA ofrece filtros por DNI, CUIL, nombre, apellido y correo electrónico.
- RF-28. EL SISTEMA permite combinar varios filtros y los envía juntos en la misma consulta.
- RF-29. EL SISTEMA aplica DNI y CUIL como coincidencia exacta y solo admite dígitos; las longitudes y los mensajes de formato quedan a cargo del servicio y se muestran.
- RF-30. SI un filtro de DNI o CUIL contiene puntos, espacios, guiones u otro carácter no numérico, ENTONCES EL SISTEMA no envía la consulta y muestra el mensaje de validación del filtro.
- RF-31. EL SISTEMA aplica nombre y apellido como coincidencia parcial, recortada y sin distinguir mayúsculas ni tildes.
- RF-32. EL SISTEMA aplica correo como coincidencia parcial, recortado y sin distinguir mayúsculas.
- RF-33. EL SISTEMA no envía los filtros vacíos y conserva los valores escritos mientras la persona edita.
- RF-34. CUANDO la persona elige «Aplicar filtros» o presiona Enter en un campo de filtro, EL SISTEMA consulta con los filtros activos; no consulta con cada tecla.
- RF-35. EL SISTEMA refleja los filtros y la página en la URL con reemplazo de historial, descarta los valores inválidos y reconstruye el estado en la recarga y en atrás/adelante.
- RF-36. CUANDO se aplican filtros, EL SISTEMA vuelve a la primera página.
- RF-37. EL SISTEMA muestra 10 usuarios por página.
- RF-38. EL SISTEMA muestra la página actual, el total de páginas y el total de resultados, y habilita «Anterior» y «Siguiente» solo cuando corresponde.
- RF-39. SI la página solicitada está fuera del rango disponible, ENTONCES EL SISTEMA la ajusta a la última página válida.
- RF-40. SI los metadatos de paginación faltan o son inconsistentes, ENTONCES EL SISTEMA trata la respuesta como inválida, muestra el error y ofrece reintentar, sin inventar totales.
- RF-41. CUANDO la persona elige «Limpiar filtros», EL SISTEMA elimina todos los filtros y vuelve a la primera página.
- RF-42. MIENTRAS se obtienen los resultados, EL SISTEMA muestra un estado de carga sin filas ficticias.
- RF-43. SI no hay resultados, ENTONCES EL SISTEMA distingue entre padrón sin usuarios y búsqueda sin coincidencias según haya filtros activos; en el segundo caso ofrece limpiar los filtros.
- RF-44. SI la consulta falla, ENTONCES EL SISTEMA muestra el mensaje correspondiente y ofrece reintentar.
- RF-45. EL SISTEMA no ofrece filtros por rol ni por estado de verificación en el padrón.

### Menú de acciones de cada fila

- RF-46. EL SISTEMA muestra en cada fila un menú de acciones con nombre accesible «Acciones de {nombre} {apellido}», estado expandido y foco inicial.
- RF-47. EL SISTEMA ofrece «Ver usuario» a `ADMINISTRADOR` y `ADMINISTRATIVO`.
- RF-48. EL SISTEMA ofrece «Cambiar rol» y «Dar de baja» solo a `ADMINISTRADOR`.
- RF-49. CUANDO se elige «Ver usuario», EL SISTEMA abre el detalle del usuario seleccionado.
- RF-50. EL SISTEMA no ofrece acciones de creación de usuarios, de edición de datos personales ni de gestión de contraseña de otros usuarios.
- RF-51. MIENTRAS el menú de acciones está abierto, EL SISTEMA permite operarlo con teclado, lo cierra con Escape o con foco fuera y devuelve el foco al disparador.

### Cambiar rol

- RF-52. CUANDO `ADMINISTRADOR` elige «Cambiar rol», EL SISTEMA abre un modal de confirmación que identifica al usuario por nombre, apellido, DNI y correo, e informa su rol actual.
- RF-53. EL SISTEMA muestra las tres opciones de rol; la opción del rol actual aparece deshabilitada y marcada «Rol actual».
- RF-54. EL SISTEMA solo habilita la confirmación cuando hay un rol distinto del actual seleccionado.
- RF-55. EL SISTEMA no permite cambiar el rol de la propia cuenta y determina esa condición comparando identificadores normalizados.
- RF-56. CUANDO el rol de la sesión es `ADMINISTRADOR` y el usuario destino no verificó su correo en el detalle, EL SISTEMA deshabilita «Cambiar rol» y explica el motivo.
- RF-57. CUANDO la acción se ofrece desde el padrón o el directorio, EL SISTEMA no evalúa el estado de verificación y muestra el rechazo del servicio.
- RF-58. EL SISTEMA no evalúa por su cuenta si el usuario es el último administrador activo; muestra el rechazo del servicio.
- RF-59. CUANDO se confirma un cambio válido, EL SISTEMA lo envía al servicio y no modifica la pantalla hasta recibir confirmación.
- RF-60. CUANDO el cambio es exitoso, EL SISTEMA actualiza el rol visible y muestra un aviso de resultado.
- RF-61. SI el servicio rechaza el cambio por conflicto, ENTONCES EL SISTEMA muestra el motivo recibido y conserva el rol anterior.
- RF-62. SI el servicio rechaza el cambio por permisos, ENTONCES EL SISTEMA muestra que la operación no está permitida y conserva el rol anterior.
- RF-63. SI el servicio rechaza el cambio por validación, ENTONCES EL SISTEMA muestra el error junto al rol nuevo y no aplica el cambio.
- RF-64. SI el usuario destino no existe o fue dado de baja, ENTONCES EL SISTEMA muestra que no existe y actualiza el listado cuando corresponde.
- RF-65. SI la sesión venció durante el cambio, ENTONCES EL SISTEMA redirige al inicio de sesión con el aviso de sesión vencida.
- RF-66. MIENTRAS el cambio se envía, EL SISTEMA bloquea el cierre del modal, evita envíos repetidos y muestra el estado de envío.
- RF-67. CUANDO el cambio se realiza desde el detalle, EL SISTEMA refleja el rol nuevo en el detalle y en la navegación que depende del rol.

### Dar de baja

- RF-68. CUANDO `ADMINISTRADOR` elige «Dar de baja», EL SISTEMA abre un modal de confirmación que identifica al usuario por nombre, apellido, DNI, correo y rol.
- RF-69. EL SISTEMA advierte en el modal que la baja es lógica, impide volver a iniciar sesión y retira al usuario de los listados.
- RF-70. EL SISTEMA no permite dar de baja la propia cuenta y determina esa condición comparando identificadores normalizados.
- RF-71. EL SISTEMA no evalúa por su cuenta si el usuario es el último administrador activo; muestra el rechazo del servicio.
- RF-72. CUANDO se confirma una baja válida, EL SISTEMA la envía al servicio y no modifica la pantalla hasta recibir confirmación.
- RF-73. CUANDO la baja es exitosa, EL SISTEMA retira al usuario del listado visible y muestra un aviso de resultado.
- RF-74. CUANDO la baja se realiza desde el detalle, EL SISTEMA vuelve al listado de origen con el aviso de resultado.
- RF-75. SI el servicio rechaza la baja por conflicto, ENTONCES EL SISTEMA muestra el motivo recibido y mantiene al usuario.
- RF-76. SI el servicio rechaza la baja por permisos, ENTONCES EL SISTEMA muestra que la operación no está permitida y mantiene al usuario.
- RF-77. SI el usuario ya no existe, ENTONCES EL SISTEMA muestra que no existe y actualiza el listado.
- RF-78. SI la sesión venció durante la baja, ENTONCES EL SISTEMA redirige al inicio de sesión con el aviso de sesión vencida.
- RF-79. MIENTRAS la baja se envía, EL SISTEMA bloquea el cierre del modal, evita envíos repetidos y muestra el estado de envío.
- RF-80. EL SISTEMA no ofrece restauración de usuarios dados de baja porque el servicio no lo documenta.

### Detalle de usuario

- RF-81. CUANDO `ADMINISTRADOR` o `ADMINISTRATIVO` abre un usuario, EL SISTEMA muestra su detalle.
- RF-82. EL SISTEMA agrupa el detalle en «Datos personales», «Datos de contacto», «Información adicional» e «Información de la cuenta».
- RF-83. EL SISTEMA muestra en «Datos personales»: nombre, apellido, fecha de nacimiento, DNI y CUIL.
- RF-84. EL SISTEMA muestra en «Datos de contacto»: correo electrónico y teléfono.
- RF-85. EL SISTEMA muestra en «Información adicional»: ocupación y nivel educativo.
- RF-86. EL SISTEMA muestra en «Información de la cuenta»: rol y estado de verificación del correo.
- RF-87. SI un dato opcional no está informado, ENTONCES EL SISTEMA muestra «No informado».
- RF-88. CUANDO el rol de la sesión es `ADMINISTRADOR`, EL SISTEMA muestra además la fecha de creación, la fecha de última actualización y la fecha de verificación del correo cuando exista.
- RF-89. CUANDO el rol de la sesión es `ADMINISTRATIVO`, EL SISTEMA no muestra información de auditoría.
- RF-90. CUANDO el rol de la sesión es `ADMINISTRADOR` y el correo del usuario no está verificado, EL SISTEMA muestra el estado «Sin verificar» y no muestra fecha de verificación.
- RF-91. CUANDO el rol de la sesión es `ADMINISTRATIVO` y el servicio no informa el estado de verificación, EL SISTEMA muestra «No informado» y no afirma que el correo esté sin verificar.
- RF-92. EL SISTEMA muestra las fechas de nacimiento y de auditoría en formato DD/MM/AAAA y, cuando incluyen hora, en DD/MM/AAAA HH:mm en la zona horaria local del dispositivo; la fecha de nacimiento no se desplaza por zona horaria.
- RF-93. EL SISTEMA ofrece «Cambiar rol» y «Dar de baja» en el detalle solo a `ADMINISTRADOR`.
- RF-94. CUANDO el detalle corresponde a la propia cuenta, EL SISTEMA permite consultarlo pero deshabilita ambas acciones y explica el motivo de forma accesible.
- RF-95. EL SISTEMA no ofrece edición de datos personales, de correo ni de contraseña en el detalle.
- RF-96. SI el usuario no existe o fue dado de baja, ENTONCES EL SISTEMA muestra un estado de no encontrado con acceso al listado de origen.
- RF-97. SI la sesión no tiene permiso, ENTONCES EL SISTEMA muestra acceso denegado sin exponer datos.
- RF-98. EL SISTEMA ofrece volver al padrón o al directorio según el origen indicado en la URL; sin origen válido, vuelve al padrón.
- RF-99. MIENTRAS el detalle se carga, EL SISTEMA muestra un estado de carga; si falla, permite reintentar.

### Directorio de staff

- RF-100. CUANDO `ADMINISTRADOR` o `ADMINISTRATIVO` abre «Directorio de staff», EL SISTEMA muestra el directorio del personal.
- RF-101. EL SISTEMA muestra exclusivamente usuarios con rol `ADMINISTRATIVO` o `ADMINISTRADOR`.
- RF-102. EL SISTEMA excluye del directorio a todo usuario con rol `TUTOR`, aunque el servicio lo devuelva.
- RF-103. EL SISTEMA muestra por usuario nombre y apellido, DNI, correo electrónico, rol y menú de acciones.
- RF-104. EL SISTEMA muestra el directorio paginado de a 10 usuarios.
- RF-105. EL SISTEMA ofrece filtros por nombre o apellido, DNI, correo electrónico, CUIL y rol, combinables, y una opción para limpiar los filtros.
- RF-106. EL SISTEMA ofrece como opciones de rol «Todos», «Administrativo» y «Administrador».
- RF-107. EL SISTEMA resuelve los filtros del directorio sobre el conjunto completo de personal y pagina el resultado filtrado.
- RF-108. EL SISTEMA obtiene el conjunto completo recorriendo todas las páginas del servicio con `per_page=100` y un tope de 100 páginas; si una página falla, no muestra un conjunto parcial.
- RF-109. EL SISTEMA aplica al directorio los mismos criterios de coincidencia de nombre, apellido, correo, DNI y CUIL definidos para el padrón.
- RF-110. EL SISTEMA ofrece «Ver usuario» a `ADMINISTRADOR` y `ADMINISTRATIVO`, y «Cambiar rol» y «Dar de baja» solo a `ADMINISTRADOR`, con las mismas reglas, modales y mensajes del padrón.
- RF-111. CUANDO un cambio de rol deja al usuario fuera de los roles del directorio, EL SISTEMA lo retira del directorio tras la confirmación; si permanece, actualiza la fila.
- RF-112. SI no hay personal registrado, ENTONCES EL SISTEMA distingue directorio vacío de búsqueda sin coincidencias según haya filtros activos y, en el segundo caso, ofrece limpiar los filtros.
- RF-113. SI el directorio falla, ENTONCES EL SISTEMA muestra el mensaje correspondiente y ofrece reintentar.
- RF-114. MIENTRAS el directorio se carga, EL SISTEMA muestra un estado de carga sin filas ficticias.
- RF-115. EL SISTEMA no muestra ni solicita datos de auditoría en el directorio.
- RF-116. EL SISTEMA no expone el directorio a `TUTOR` ni desde el menú ni por URL.
- RF-117. EL SISTEMA muestra el directorio en el orden informado por el servicio y recalcula el total y las páginas después de excluir usuarios `TUTOR`.

### Mi perfil

- RF-118. CUANDO cualquier persona autenticada abre «Mi perfil», EL SISTEMA muestra los datos de su perfil propio.
- RF-119. EL SISTEMA obtiene los datos del perfil propio del servicio y los usa como fuente única de la pantalla.
- RF-120. EL SISTEMA muestra en «Datos personales»: nombre, apellido, fecha de nacimiento, teléfono, ocupación y nivel educativo.
- RF-121. EL SISTEMA muestra en «Datos de contacto» el correo electrónico.
- RF-122. EL SISTEMA muestra en «Datos de la cuenta» el correo electrónico, el rol actual y el estado de verificación.
- RF-123. SI un dato opcional no está informado, ENTONCES EL SISTEMA muestra «No informado».
- RF-124. EL SISTEMA muestra la fecha de nacimiento en formato DD/MM/AAAA sin desplazarla por zona horaria.
- RF-125. CUANDO el rol es `TUTOR`, EL SISTEMA muestra los campos de ocupación y nivel educativo en modo editable.
- RF-126. EL SISTEMA exige ocupación y nivel educativo en cada guardado del perfil de tutor.
- RF-127. EL SISTEMA exige la ocupación recortada y no vacía, y la limita a 100 caracteres.
- RF-128. EL SISTEMA permite elegir el nivel educativo entre «Primario», «Secundario», «Terciario», «Universitario» y «Postgrado».
- RF-129. CUANDO el tutor guarda su perfil, EL SISTEMA envía ocupación y nivel educativo juntos y no actualiza la pantalla hasta recibir confirmación.
- RF-130. CUANDO el guardado es exitoso, EL SISTEMA actualiza los valores visibles con la respuesta del servicio y muestra un aviso de resultado.
- RF-131. SI el servicio rechaza el guardado por validación, ENTONCES EL SISTEMA muestra los errores junto a cada campo y conserva los valores escritos.
- RF-132. SI el servicio rechaza el guardado por permisos, ENTONCES EL SISTEMA muestra que la operación no está permitida y conserva los valores anteriores.
- RF-133. SI la sesión venció durante el guardado, ENTONCES EL SISTEMA redirige al inicio de sesión con el aviso de sesión vencida.
- RF-134. MIENTRAS el guardado se envía, EL SISTEMA evita envíos repetidos y muestra el estado de envío.
- RF-135. CUANDO el rol es `ADMINISTRATIVO` o `ADMINISTRADOR`, EL SISTEMA muestra ocupación y nivel educativo en modo lectura y no ofrece el formulario de actualización.
- RF-136. EL SISTEMA no permite editar nombre, apellido, correo, DNI, CUIL, fecha de nacimiento ni teléfono desde «Mi perfil».
- RF-137. SI la carga del perfil falla, ENTONCES EL SISTEMA muestra el mensaje correspondiente y ofrece reintentar.
- RF-138. SI la sesión venció durante la carga del perfil, ENTONCES EL SISTEMA redirige al inicio de sesión con el aviso de sesión vencida.
- RF-139. EL SISTEMA reconcilia los datos del perfil con la respuesta del servicio después de guardar o de volver a la pantalla, y descarta valores locales obsoletos.

### Configuración de cuenta

- RF-140. CUANDO cualquier persona autenticada abre «Configuración de cuenta», EL SISTEMA muestra nombre, apellido y correo electrónico de su perfil propio.
- RF-141. EL SISTEMA muestra esos tres datos en modo lectura y no permite editarlos.
- RF-142. EL SISTEMA muestra una sección «Seguridad» con la acción «Restablecer contraseña».
- RF-143. CUANDO la persona elige «Restablecer contraseña», EL SISTEMA abre el flujo público de recuperación existente sin precargar el correo.
- RF-144. EL SISTEMA no cierra la sesión actual al abrir el flujo de recuperación; la sesión sigue vigente hasta expirar o cerrar sesión.
- RF-145. EL SISTEMA no ofrece un formulario de cambio de contraseña conociendo la contraseña actual porque el servicio no lo documenta.
- RF-146. CUANDO el rol es `TUTOR`, EL SISTEMA muestra en «Configuración de cuenta» la acción «Solicitar cambio de rol».
- RF-147. EL SISTEMA permite elegir el rol solicitado entre `TUTOR`, `ADMINISTRATIVO` y `ADMINISTRADOR`.
- RF-148. SI el rol solicitado coincide con el rol actual, ENTONCES EL SISTEMA muestra un error local y no envía la solicitud.
- RF-149. EL SISTEMA exige un motivo recortado, no vacío y de hasta 500 caracteres.
- RF-150. CUANDO se envía una solicitud válida, EL SISTEMA la remite al servicio y no cambia el rol en pantalla.
- RF-151. CUANDO la solicitud es aceptada por el servicio, EL SISTEMA muestra el mensaje recibido y advierte que es solo un pedido: no queda registrada, no notifica a los administradores y no modifica el rol.
- RF-152. SI el servicio rechaza la solicitud por validación, ENTONCES EL SISTEMA muestra los errores junto a los campos y conserva los valores escritos.
- RF-153. SI el servicio rechaza la solicitud por permisos, ENTONCES EL SISTEMA muestra que la operación no está permitida.
- RF-154. SI la sesión venció durante la solicitud, ENTONCES EL SISTEMA redirige al inicio de sesión con el aviso de sesión vencida.
- RF-155. MIENTRAS la solicitud se envía, EL SISTEMA evita envíos repetidos y muestra el estado de envío.
- RF-156. EL SISTEMA no muestra la solicitud de cambio de rol a `ADMINISTRATIVO` ni a `ADMINISTRADOR`.
- RF-157. EL SISTEMA no muestra la acción de solicitud de cambio de rol suelta en el pie del menú; solo se accede desde «Configuración de cuenta».
- RF-158. SI la carga de la configuración de cuenta falla, ENTONCES EL SISTEMA muestra el mensaje correspondiente y ofrece reintentar.
- RF-159. SI la sesión venció durante la carga de la configuración de cuenta, ENTONCES EL SISTEMA redirige al inicio de sesión con el aviso de sesión vencida.

### Autenticación, permisos y errores

- RF-160. EL SISTEMA usa la sesión existente y envía el token como Bearer en todas las solicitudes del módulo, sin duplicar la lógica de autenticación.
- RF-161. EL SISTEMA determina secciones, pantallas y acciones a partir del rol vigente reconciliado con el perfil del servicio.
- RF-162. SI una solicitud responde `401`, ENTONCES EL SISTEMA descarta la sesión y redirige al inicio de sesión con el aviso de sesión vencida.
- RF-163. SI una solicitud responde `403`, ENTONCES EL SISTEMA muestra que la operación no está permitida sin exponer datos del usuario.
- RF-164. SI una solicitud responde `404`, ENTONCES EL SISTEMA muestra que el usuario no existe o fue dado de baja.
- RF-165. SI una solicitud responde `409`, ENTONCES EL SISTEMA muestra el conflicto de regla de negocio con el mensaje correspondiente.
- RF-166. SI una solicitud responde `422`, ENTONCES EL SISTEMA muestra los errores de validación junto al filtro, campo o acción que los origina.
- RF-167. SI una solicitud sufre error de red o se agota el tiempo de espera, ENTONCES EL SISTEMA muestra un mensaje general y ofrece reintentar.
- RF-168. CUANDO una respuesta presenta más de un error aplicable, EL SISTEMA respeta la precedencia `401`, `403`, `404`, `409`, `422`, `5xx` y red.
- RF-169. EL SISTEMA usa los avisos de resultado de la operación y no los presenta como notificaciones a terceros.
- RF-170. EL SISTEMA mantiene los avisos de resultado visibles 4 segundos y los errores hasta su cierre manual o reintento.
- RF-171. EL SISTEMA no envía ni simula notificaciones a terceros ni al usuario afectado porque el servicio no las documenta.

## Requisitos no funcionales

- RNF-1. Consistencia visual: misma paleta institucional, fondos claros, superficies blancas, bordes, radios, sombras, espaciados, tipografía y jerarquía que Gestión de cursos; sin colores ni estilos nuevos.
- RNF-2. Reutilización por composición de las piezas existentes de tabla, buscador, filtros, paginación, badges, modales, avisos, menús de acciones, esqueletos y estados; sin variantes duplicadas.
- RNF-3. Contraste mínimo de 4.5:1 en texto y de 3:1 en indicadores y bordes no textuales; foco visible en todos los controles.
- RNF-4. Accesibilidad: operación completa por teclado; roles, nombres accesibles, estado activo, expandido, deshabilitado y ocupado anunciados; mensajes de error y resultado anunciados; foco devuelto al cerrar modales y menús.
- RNF-5. Responsive de 320 a 1920 px: sin desborde horizontal de página, tabla con desplazamiento interno, controles alcanzables y texto al 200 % sin pérdida de contenido.
- RNF-6. Estados de carga, vacío, error y resultados visualmente distinguibles y accesibles.
- RNF-7. Privacidad: nunca exponer token, contraseñas ni datos sensibles en URL, HTML, almacenamiento del navegador, consola o notificaciones.
- RNF-8. Fechas: los datos se reciben en ISO del servicio y se presentan en DD/MM/AAAA o DD/MM/AAAA HH:mm en la zona local del dispositivo; la fecha de nacimiento no se desplaza por zona horaria.
- RNF-9. Sin caché compartida entre usuarios: los datos del módulo se generan por sesión.
- RNF-10. Sin dependencias externas nuevas.
- RNF-11. Cada pantalla del módulo tiene título y descripción propios.
- RNF-12. Cada segmento del módulo ofrece estado de carga y límite de error con reintento.
- RNF-13. Las acciones de escritura bloquean envíos repetidos y muestran indicador de envío.
- RNF-14. La reutilización de piezas de Gestión de cursos es por composición; si una pieza compartida debe cambiar, el cambio debe ser retrocompatible y validarse con regresión de Cursos, sin alterar su comportamiento visual ni funcional.
- RNF-15. Los filtros y la paginación del directorio no vuelven a solicitar datos ya obtenidos; solo se revalida después de una mutación o de un reintento explícito.
- RNF-16. Textos de interfaz en español e identificadores técnicos en inglés, conforme a la constitución.
- RNF-17. Los formularios de perfil y de solicitud de rol conservan los valores escritos ante errores de validación o de red.
- RNF-18. Todas las respuestas del servicio se procesan con el sobre `{data, message, errors}` y los errores se traducen de forma uniforme.
- RNF-19. Toda imagen nueva se sirve con la optimización del framework y se declara en el plan con carpeta, descripción y nombre ideal.

## Casos límite

- CL-1. La última página del padrón queda vacía después de aplicar un filtro: se ajusta a la página válida anterior.
- CL-2. Los filtros no devuelven coincidencias: estado sin resultados con opción de limpiar filtros.
- CL-3. DNI o CUIL con puntos, espacios, guiones o guiones bajos: validación local, sin solicitud al servicio.
- CL-4. Filtros escritos con mayúsculas o tildes: se aplican igual.
- CL-5. Correo parcial: se aplica como coincidencia parcial.
- CL-6. La URL contiene una página mayor a la última: se ajusta a la última válida.
- CL-7. El detalle apunta a un usuario eliminado: estado de no encontrado con acceso al listado de origen.
- CL-8. Se intenta cambiar el rol al mismo rol actual: la confirmación queda deshabilitada.
- CL-9. Se intenta cambiar el rol de la propia cuenta desde el detalle: acción deshabilitada con motivo.
- CL-10. Cambio de rol de un correo sin verificar desde el padrón o el directorio: se ofrece la acción y el servicio responde con conflicto; desde el detalle, con sesión `ADMINISTRADOR`, se deshabilita porque el estado se conoce.
- CL-11. Cambio de rol que dejaría al sistema sin administrador activo: el servicio responde con conflicto y la interfaz lo muestra.
- CL-12. Intento de baja de la propia cuenta: acción deshabilitada con motivo.
- CL-13. Intento de baja del último administrador activo: el servicio responde con conflicto y la interfaz lo muestra.
- CL-14. Baja de un usuario que ya fue eliminado en otra sesión: se informa y se actualiza el listado.
- CL-15. El directorio recibe usuarios `TUTOR`: se excluyen de la tabla, de los filtros y del total.
- CL-16. Un cambio de rol en el directorio convierte al usuario en `TUTOR`: se retira del directorio tras la confirmación; si permanece en el staff, se actualiza la fila.
- CL-17. Se da de baja al último usuario de la página actual en cualquiera de los dos listados: se ajusta la página y se refresca.
- CL-18. La sesión vence con un modal abierto: se cierra la operación y se redirige al inicio de sesión.
- CL-19. Doble confirmación en un modal: se envía una sola operación.
- CL-20. El servicio está caído al cargar padrón, directorio, detalle, perfil o configuración: mensaje general con reintento.
- CL-21. Datos opcionales vacíos en el detalle: se muestra «No informado».
- CL-22. Correo sin verificar: con sesión `ADMINISTRADOR` se muestra «Sin verificar» sin fecha; con sesión `ADMINISTRATIVO`, «No informado».
- CL-23. El perfil del tutor aún no tiene ocupación ni nivel educativo: se muestran vacíos y editables con aviso de campos obligatorios.
- CL-24. El tutor guarda el perfil con ocupación vacía, solo espacios o de más de 100 caracteres: error local, sin solicitud.
- CL-25. El tutor guarda el perfil sin nivel educativo: error local, sin solicitud.
- CL-26. El tutor envía una solicitud de rol sin motivo, solo espacios o con más de 500 caracteres: error local, sin solicitud.
- CL-27. La solicitud de rol es aceptada por el servicio: se muestra la confirmación y el aviso de que aún no se registra ni cambia el rol.
- CL-28. Un `ADMINISTRADOR` abre «Configuración de cuenta»: no ve la solicitud de cambio de rol.
- CL-29. La sección se expande al entrar al módulo; después la persona puede plegarla y la preferencia se conserva durante la sesión.
- CL-30. Una persona `TUTOR` accede por URL al padrón, al directorio o al detalle: acceso denegado sin datos.
- CL-31. El menú lateral está colapsado: el pie muestra solo el avatar, la sección muestra dos iconos y los datos de cuenta quedan en las pantallas correspondientes.
- CL-32. La respuesta trae un rol desconocido: no se muestra como rol válido ni se habilita acción alguna.
- CL-33. Una fecha de auditoría viene ausente o inválida: se omite o se muestra «No informado», sin calcularla.
- CL-34. Se guarda el perfil y luego se recarga: se muestran los valores confirmados por el servicio.
- CL-35. La configuración de cuenta no permite editar nombre, apellido ni correo: los campos se muestran como datos de solo lectura.
- CL-36. Otro administrador cambia el rol del usuario logueado: la interfaz reconcilia el rol con el perfil del servicio y actualiza menú, pie y acciones.
- CL-37. La cuenta del usuario logueado es dada de baja desde otra sesión: la siguiente solicitud responde `401` y se redirige al inicio de sesión con el aviso de sesión vencida.
- CL-38. Un administrador es degradado o eliminado mientras navega las pantallas de usuarios: las solicitudes siguientes responden `403` y se recalcula la navegación.
- CL-39. El detalle recibe un identificador inválido, inexistente o el de la propia cuenta: no encontrado o detalle propio con acciones deshabilitadas, respectivamente.
- CL-40. Recarga, atrás o adelante con filtros, página o modal: el listado se reconstruye desde la URL y el modal abierto se cierra.
- CL-41. Dos pestañas con filtros o páginas distintas: cada una conserva su estado; una mutación en una no altera la otra hasta que se refresque.
- CL-42. El directorio supera el tope de páginas o falla una página posterior: se muestra un error de conjunto incompleto y no se muestran resultados parciales.
- CL-43. Los metadatos de paginación faltan o son inconsistentes: error con reintento, sin totales inventados.
- CL-44. Filtros con espacios en los extremos, solo espacios, tildes aisladas o cadenas muy largas: se normalizan o se rechazan antes de consultar.
- CL-45. Una respuesta anterior llega después de un cambio de filtro o página: se descarta y prevalece la solicitud más reciente.
- CL-46. La respuesta trae un rol desconocido o campos obligatorios ausentes: error, sin mostrar datos inventados.
- CL-47. Cambio de rol y baja concurrentes entre dos administradores: se aplica la respuesta del servicio (`404` o `409`) y se actualiza la vista.
- CL-48. El detalle se abrió desde el directorio y el rol cambió a `TUTOR`: al volver, el usuario ya no aparece en el conjunto filtrado.
- CL-49. El rol del usuario cambia a `TUTOR` mientras está en «Mi perfil»: el formulario editable aparece después de reconciliar el perfil.
- CL-50. El tutor envía la solicitud de rol dos veces o después de un cambio ya aplicado: se bloquea el segundo envío y se reconcilia el rol vigente.
- CL-51. El servicio devuelve `education_level` desconocido o en minúsculas: se muestra «No informado» y no se envía en el formulario.
- CL-52. El perfil del servicio responde `403` al cargar perfil o configuración: acceso denegado sin datos.
- CL-53. Nombre, apellido o correo ausentes en la configuración de cuenta: «No informado».
- CL-54. El menú se muestra como drawer: la sección aparece expandida con sus dos opciones y el foco se mantiene dentro del drawer.
- CL-55. Se abre un modal y cambia la ruta o la página: se cierra la operación y no se envía nada.
- CL-56. Los identificadores de usuario llegan como número en una respuesta y como texto en otra: la comparación de la propia cuenta los normaliza.
- CL-57. El último administrador activo tiene su correo sin verificar o está eliminado: el servicio responde con conflicto y la interfaz lo muestra.
- CL-58. El detalle queda obsoleto por un cambio externo: se refresca al volver a la pantalla o al reintentar y muestra los datos vigentes.
- CL-59. `email_verified_at` llega vacío o con formato inválido: con `ADMINISTRADOR` se muestra «Sin verificar»; con `ADMINISTRATIVO`, «No informado».
- CL-60. Un aviso de resultado está visible y la persona filtra o pagina: el aviso se conserva hasta cumplir sus 4 segundos.
- CL-61. El servicio ajusta el tamaño de página solicitado: los cálculos usan el tamaño real informado por los metadatos.
- CL-62. El orden del padrón no está garantizado por el servicio: se muestra el orden recibido; el directorio conserva el orden del servicio.

## Fuera de alcance

- Creación de usuarios.
- Edición de nombre, apellido, correo, DNI, CUIL, fecha de nacimiento o teléfono, por no existir endpoint documentado.
- Mostrar DNI y CUIL en «Mi perfil» mientras el servicio de perfil propio no los devuelva.
- Cambio de contraseña conociendo la contraseña actual.
- Notificaciones por correo o en la aplicación al solicitar o aplicar un cambio de rol, por no estar documentadas.
- Solicitud de cambio de rol para `ADMINISTRATIVO` o `ADMINISTRADOR`.
- Verificación manual del correo o reenvío del código de verificación desde este módulo.
- Restauración de usuarios dados de baja.
- Acciones masivas sobre usuarios.
- Exportación, reportes o notificaciones a usuarios desde este módulo.
- Historial de auditoría más allá de las fechas informadas.
- Gestión de la relación tutor-alumno.
- Persistencia o aprobación de la solicitud de cambio de rol: la decide el backend, que hoy no la registra.
- Acceso de `TUTOR` al padrón, al directorio o al detalle de otros usuarios.
- Cambios en el backend para habilitar funcionalidades nuevas.
- Duplicar componentes de Gestión de cursos o introducir una identidad visual distinta.
- Las tareas pendientes de la spec 010 (T65–T67 y T71) y la T23 diferida de la spec 004.

## Criterios de finalización

- Todos los requisitos funcionales verificados con pruebas y recorridos de extremo a extremo.
- Los requisitos no funcionales verificados: contraste, teclado, lector de pantalla, responsive, texto al 200 % y privacidad.
- `pnpm lint`, `pnpm build` y la suite completa de pruebas en verde, sin dependencias nuevas.
- Sin errores de consola en los recorridos principales.
- Sin regresiones en Gestión de cursos, menú lateral, inicio de sesión, registro ni recuperación.
- Imágenes e iconos nuevos declarados en el plan con carpeta, descripción y nombre ideal.
- Documentación de la spec y memoria del proyecto actualizadas al cierre.

## Dudas abiertas

- [PENDIENTE DE BACKEND] La solicitud de cambio de rol no se persiste y no notifica a los administradores; se implementa con aviso explícito y se revisa cuando el backend la registre.
- [PENDIENTE DE BACKEND] No hay notificación al usuario afectado cuando un administrador cambia su rol; se revisa si el backend la incorpora.
- [PENDIENTE DE BACKEND] `/api/auth/me` no devuelve DNI ni CUIL; se omiten por ahora y se revisan si el servicio los incorpora.
- [PENDIENTE DE BACKEND] El detalle no informa el estado de verificación a `ADMINISTRATIVO`; se muestra «No informado» hasta que el contrato lo incluya.
